import logging

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order
from orders.serializers import OrderSerializer

from .services import confirm_order_payment
from .stripe_service import (
    StripeNotConfiguredError,
    StripeServiceError,
    construct_webhook_event,
    retrieve_checkout_session,
)

logger = logging.getLogger(__name__)


class StripeConfigView(APIView):
    """Expose publishable key for the storefront (safe to share)."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "publishable_key": settings.STRIPE_PUBLISHABLE_KEY or "",
                "currency": (settings.STRIPE_CURRENCY or "pkr").lower(),
                "configured": bool((settings.STRIPE_SECRET_KEY or "").strip()),
            }
        )


class StripeConfirmSessionView(APIView):
    """
    Confirm payment after Stripe redirects back to the success URL.
    Useful for local demo when webhooks are not yet configured.
    Idempotent with the webhook handler.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        session_id = (request.data.get("session_id") or "").strip()
        order_id = request.data.get("order_id")
        if not session_id:
            return Response(
                {"detail": "session_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            session = retrieve_checkout_session(session_id)
        except StripeNotConfiguredError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception:
            logger.exception("Failed to retrieve Stripe session")
            return Response(
                {"detail": "Could not verify Stripe session."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        session_data = _stripe_to_dict(session)
        metadata = _stripe_to_dict(session_data.get("metadata"))
        meta_order_id = metadata.get("order_id") or session_data.get("client_reference_id")
        if order_id and str(order_id) != str(meta_order_id):
            return Response(
                {"detail": "Order does not match Stripe session."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = Order.objects.get(pk=meta_order_id)
        except (Order.DoesNotExist, TypeError, ValueError):
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        # Require paid — do not treat status=complete + unpaid as success (async methods).
        payment_status = session_data.get("payment_status")
        if payment_status != "paid":
            return Response(
                {
                    "detail": "Payment is not completed yet.",
                    "payment_status": payment_status,
                    "order": OrderSerializer(order).data,
                },
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        if order.stripe_checkout_session_id and order.stripe_checkout_session_id != session_id:
            return Response(
                {"detail": "Session does not match this order."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not order.stripe_checkout_session_id:
            order.stripe_checkout_session_id = session_id
            order.save(update_fields=["stripe_checkout_session_id", "updated_at"])

        order = confirm_order_payment(order, send_email=True)
        return Response({"order": OrderSerializer(order).data})


def _stripe_to_dict(value):
    """Normalize StripeObject / dict / None into a plain dict."""
    if value is None:
        return {}
    if isinstance(value, dict):
        return value
    to_dict = getattr(value, "to_dict", None)
    if callable(to_dict):
        return to_dict()
    return dict(value)


class StripeWebhookView(APIView):
    """Stripe webhook — verify signature, fulfill on paid Checkout sessions."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")
        try:
            event = construct_webhook_event(payload, sig_header)
        except StripeNotConfiguredError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as exc:
            logger.warning("Stripe webhook signature verification failed: %s", exc)
            return Response({"detail": "Invalid signature."}, status=status.HTTP_400_BAD_REQUEST)

        event_data = _stripe_to_dict(event)
        event_type = event_data.get("type") or ""
        data_object = _stripe_to_dict(_stripe_to_dict(event_data.get("data")).get("object"))

        if event_type in (
            "checkout.session.completed",
            "checkout.session.async_payment_succeeded",
        ):
            payment_status = data_object.get("payment_status")
            if payment_status != "paid":
                return Response({"received": True, "fulfilled": False})

            metadata = _stripe_to_dict(data_object.get("metadata"))
            order_id = metadata.get("order_id") or data_object.get("client_reference_id")
            session_id = data_object.get("id") or ""
            try:
                order = Order.objects.get(pk=order_id)
            except (Order.DoesNotExist, TypeError, ValueError):
                logger.error("Webhook order not found: %s", order_id)
                return Response({"received": True, "fulfilled": False})

            if (
                order.stripe_checkout_session_id
                and session_id
                and order.stripe_checkout_session_id != session_id
            ):
                logger.error(
                    "Webhook session mismatch for order %s: stored=%s event=%s",
                    order.pk,
                    order.stripe_checkout_session_id,
                    session_id,
                )
                return Response({"received": True, "fulfilled": False})

            if session_id and not order.stripe_checkout_session_id:
                order.stripe_checkout_session_id = session_id
                order.save(update_fields=["stripe_checkout_session_id", "updated_at"])

            confirm_order_payment(order, send_email=True)
            return Response({"received": True, "fulfilled": True})

        return Response({"received": True})
