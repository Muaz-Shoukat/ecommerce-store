"""Stripe Checkout helpers (test/sandbox). Uses StripeClient — no global api_key."""

from __future__ import annotations

from decimal import Decimal

from django.conf import settings
import stripe
from stripe import StripeClient

from orders.models import Order


class StripeNotConfiguredError(RuntimeError):
    pass


class StripeServiceError(RuntimeError):
    pass


def get_stripe_client() -> StripeClient:
    key = (settings.STRIPE_SECRET_KEY or "").strip()
    if not key:
        raise StripeNotConfiguredError(
            "STRIPE_SECRET_KEY is not set. Add your test secret key to backend/.env "
            "(https://dashboard.stripe.com/test/apikeys)."
        )
    return StripeClient(key)


def _amount_to_stripe_units(amount: Decimal, currency: str) -> int:
    """
    Convert Decimal money to Stripe integer units (smallest currency unit).

    Most currencies (including PKR on current Stripe Checkout) use 2 decimals,
    so ₨224.10 → 22410. Truly zero-decimal currencies stay as whole units.
    """
    currency = currency.lower()
    # Do not include pkr here — Stripe Checkout treats PKR as 2-decimal.
    zero_decimal = {"bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"}
    if currency in zero_decimal:
        return int(amount.quantize(Decimal("1")))
    return int((amount * 100).quantize(Decimal("1")))


def create_checkout_session(order: Order) -> stripe.checkout.Session:
    if order.payment_method != "stripe":
        raise StripeServiceError("Order is not a Stripe payment.")

    client = get_stripe_client()
    currency = (settings.STRIPE_CURRENCY or "pkr").lower()
    frontend = settings.FRONTEND_URL.rstrip("/")

    line_items = []
    for item in order.items.select_related("product", "variant").all():
        name = item.product.name if item.product else "Item"
        if item.variant:
            name = f"{name} ({item.variant.name}: {item.variant.value})"
        line_items.append(
            {
                "quantity": item.quantity,
                "price_data": {
                    "currency": currency,
                    "unit_amount": _amount_to_stripe_units(item.price_at_purchase, currency),
                    "product_data": {"name": name[:120]},
                },
            }
        )

    if not line_items:
        raise StripeServiceError("Order has no line items.")

    customer_email = order.customer_email() or None
    session = client.v1.checkout.sessions.create(
        {
            "mode": "payment",
            "line_items": line_items,
            "success_url": (
                f"{frontend}/order-confirmation"
                f"?session_id={{CHECKOUT_SESSION_ID}}&order_id={order.pk}"
            ),
            "cancel_url": f"{frontend}/checkout?cancelled=1&order_id={order.pk}",
            "client_reference_id": str(order.pk),
            "metadata": {"order_id": str(order.pk)},
            **({"customer_email": customer_email} if customer_email else {}),
        }
    )
    order.stripe_checkout_session_id = session.id
    order.save(update_fields=["stripe_checkout_session_id", "updated_at"])
    return session


def retrieve_checkout_session(session_id: str):
    client = get_stripe_client()
    return client.v1.checkout.sessions.retrieve(session_id)


def construct_webhook_event(payload: bytes, sig_header: str):
    secret = (settings.STRIPE_WEBHOOK_SECRET or "").strip()
    if not secret:
        raise StripeNotConfiguredError(
            "STRIPE_WEBHOOK_SECRET is not set. Add the webhook signing secret to backend/.env."
        )
    return stripe.Webhook.construct_event(payload, sig_header, secret)
