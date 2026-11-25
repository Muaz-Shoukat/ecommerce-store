"""Order confirmation emails (HTML + plain text via Gmail SMTP or console)."""

from __future__ import annotations

import logging
from decimal import Decimal

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from .models import Order

logger = logging.getLogger(__name__)


def _order_email_context(order: Order, *, to_email: str) -> dict:
    lines = []
    for item in order.items.select_related("product", "variant").all():
        name = item.product.name if item.product else "Item"
        variant = ""
        if item.variant:
            variant = f"{item.variant.name}: {item.variant.value}"
        qty = item.quantity
        unit = item.price_at_purchase
        line_total = (unit * qty).quantize(Decimal("0.01"))
        lines.append(
            {
                "name": name,
                "variant": variant,
                "quantity": qty,
                "unit_price": unit,
                "line_total": line_total,
            }
        )

    shipping_address = (order.guest_address or "").strip()
    customer_name = order.guest_name or order.customer_display
    if order.user_id and not order.guest_name:
        customer_name = order.user.get_username()

    shop_url = (getattr(settings, "FRONTEND_URL", None) or "").rstrip("/")
    if shop_url:
        shop_url = f"{shop_url}/products"

    return {
        "order": order,
        "lines": lines,
        "customer_name": customer_name,
        "shipping_address": shipping_address,
        "to_email": to_email,
        "shop_url": shop_url,
    }


def send_order_confirmation_email(order: Order) -> bool:
    """
    Send multipart order confirmation (text + HTML).
    Returns True if sent, False if no recipient email.
    """
    to_email = order.customer_email()
    if not to_email:
        logger.info("Skipping order email for order %s — no recipient email", order.pk)
        return False

    # Ensure related rows are available for templates
    order = (
        Order.objects.select_related("user")
        .prefetch_related("items__product", "items__variant")
        .get(pk=order.pk)
    )

    context = _order_email_context(order, to_email=to_email)
    subject = f"Order #{order.pk} confirmed — Stationery Store"
    if order.status != "confirmed":
        subject = f"Order #{order.pk} received — Stationery Store"

    text_body = render_to_string("emails/order_confirmation.txt", context)
    html_body = render_to_string("emails/order_confirmation.html", context)

    from_email = (
        getattr(settings, "DEFAULT_FROM_EMAIL", None)
        or settings.EMAIL_HOST_USER
        or "noreply@stationery.local"
    )

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=from_email,
        to=[to_email],
    )
    message.attach_alternative(html_body, "text/html")
    message.send(fail_silently=False)
    return True
