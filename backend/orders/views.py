import logging

from django.http import HttpResponse
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsAdminOrStaff, IsOwner
from payments.services import confirm_order_payment
from payments.stripe_service import (
    StripeNotConfiguredError,
    StripeServiceError,
    create_checkout_session,
)

from .emails import send_order_confirmation_email
from .invoice import build_invoice_pdf
from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer, OrderStatusUpdateSerializer
from .services import cancel_order_and_restock

logger = logging.getLogger(__name__)


class OrderListCreateView(ListCreateAPIView):
    """
    POST /api/orders/ — create (guest or authenticated)
    GET  /api/orders/ — list logged-in user's orders
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [AllowAny()]
        return [IsAuthenticated(), IsOwner()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Order.objects.none()
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items__product", "items__variant")
            .order_by("-created_at")
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Fail fast before stock reservation if Stripe is selected but not configured.
        if serializer.validated_data.get("payment_method") == "stripe":
            from django.conf import settings as djsettings

            if not (djsettings.STRIPE_SECRET_KEY or "").strip():
                return Response(
                    {
                        "detail": (
                            "STRIPE_SECRET_KEY is not set. Add your test secret key to "
                            "backend/.env (https://dashboard.stripe.com/test/apikeys)."
                        )
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

        order = serializer.save()

        checkout_url = None
        if order.payment_method == "stripe":
            try:
                session = create_checkout_session(order)
                checkout_url = session.url
            except StripeNotConfiguredError as exc:
                cancel_order_and_restock(order)
                return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            except StripeServiceError as exc:
                cancel_order_and_restock(order)
                return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception:
                logger.exception("Stripe Checkout session creation failed")
                cancel_order_and_restock(order)
                return Response(
                    {"detail": "Could not start Stripe Checkout. Try again later."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
        elif order.payment_method == "cod":
            # COD is accepted immediately for the demo; email confirmation is best-effort.
            order = confirm_order_payment(order, send_email=True)
        else:
            # JazzCash / Easypaisa placeholders — keep pending; email if address present.
            try:
                send_order_confirmation_email(order)
            except Exception:
                logger.exception("Failed to send order email for order %s", order.pk)

        output = OrderSerializer(order, context=self.get_serializer_context())
        headers = self.get_success_headers(output.data)
        body = dict(output.data)
        if checkout_url:
            body["checkout_url"] = checkout_url
        return Response(body, status=status.HTTP_201_CREATED, headers=headers)


class OrderDetailView(RetrieveAPIView):
    """GET /api/orders/<id>/ — owner only."""

    permission_classes = [IsAuthenticated, IsOwner]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items__product", "items__variant")
        )


class OrderStatusUpdateView(UpdateAPIView):
    """PATCH /api/orders/<id>/status/ — admin/staff only."""

    permission_classes = [IsAdminOrStaff]
    serializer_class = OrderStatusUpdateSerializer
    http_method_names = ["patch", "head", "options"]
    queryset = Order.objects.all()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        output = OrderSerializer(instance, context=self.get_serializer_context())
        return Response(output.data)


class OrderInvoiceView(APIView):
    """
    GET /api/orders/<id>/invoice/ — PDF invoice.

    Allowed when the requester is the order owner/staff, or provides a matching
    guest email / Stripe session id (so confirmation-page guests can download).
    """

    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            order = Order.objects.prefetch_related("items__product", "items__variant").get(
                pk=pk
            )
        except Order.DoesNotExist:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)

        if not self._can_download(request, order):
            return Response(
                {"detail": "Not allowed to download this invoice."},
                status=status.HTTP_403_FORBIDDEN,
            )

        pdf_bytes = build_invoice_pdf(order)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="invoice-order-{order.pk}.pdf"'
        response["Content-Length"] = str(len(pdf_bytes))
        return response

    def _can_download(self, request, order: Order) -> bool:
        user = request.user
        if user and user.is_authenticated:
            if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
                return True
            if order.user_id and order.user_id == user.id:
                return True

        email = (request.query_params.get("email") or "").strip().lower()
        if email and email == order.customer_email().lower():
            return True

        session_id = (request.query_params.get("session_id") or "").strip()
        if (
            session_id
            and order.stripe_checkout_session_id
            and session_id == order.stripe_checkout_session_id
        ):
            return True

        return False
