"""Payment-side order fulfillment helpers."""

from __future__ import annotations

import logging

from django.db import transaction

from orders.emails import send_order_confirmation_email
from orders.models import Order

logger = logging.getLogger(__name__)


@transaction.atomic
def confirm_order_payment(order: Order, *, send_email: bool = True) -> Order:
    """
    Mark a pending order as confirmed (idempotent) and optionally email the customer.
    """
    order = Order.objects.select_for_update().prefetch_related(
        "items__product", "items__variant", "user"
    ).get(pk=order.pk)

    if order.status == "cancelled":
        return order

    newly_confirmed = order.status == "pending"
    if newly_confirmed:
        order.status = "confirmed"
        order.save(update_fields=["status", "updated_at"])

    if send_email and newly_confirmed:
        try:
            send_order_confirmation_email(order)
        except Exception:
            logger.exception("Failed to send confirmation email for order %s", order.pk)

    return order
