from decimal import Decimal

from django.db import transaction
from django.db.models import F

from products.models import Product, ProductVariant

from .models import Order, OrderItem


class OrderServiceError(Exception):
    """Domain error raised by order creation logic."""


@transaction.atomic
def create_order(
    *,
    items: list[dict],
    payment_method: str,
    user=None,
    guest_name: str = "",
    guest_phone: str = "",
    guest_address: str = "",
) -> Order:
    """
    Validate stock, price lines from the DB, and create Order + OrderItems.

    `items` entries: {"product_id": int, "quantity": int, "variant_id": int | None}
    Never trusts client-supplied prices.
    """
    if not items:
        raise OrderServiceError("Order must include at least one item.")

    if user is None:
        if not guest_name or not guest_phone or not guest_address:
            raise OrderServiceError(
                "Guest orders require guest_name, guest_phone, and guest_address."
            )

    prepared_lines = []
    total = Decimal("0.00")

    for raw in items:
        product_id = raw.get("product_id")
        variant_id = raw.get("variant_id")
        quantity = int(raw.get("quantity") or 0)

        if not product_id or quantity < 1:
            raise OrderServiceError("Each item needs a product_id and quantity >= 1.")

        try:
            product = Product.objects.select_for_update().get(pk=product_id, is_active=True)
        except Product.DoesNotExist as exc:
            raise OrderServiceError(f"Product {product_id} is not available.") from exc

        variant = None
        if variant_id:
            try:
                variant = ProductVariant.objects.select_for_update().get(
                    pk=variant_id,
                    product_id=product.id,
                )
            except ProductVariant.DoesNotExist as exc:
                raise OrderServiceError(
                    f"Variant {variant_id} is not valid for product {product_id}."
                ) from exc

            if variant.stock < quantity:
                raise OrderServiceError(
                    f"Insufficient stock for {product.name} ({variant.name}: {variant.value})."
                )
            unit_price = product.unit_price(variant)
            available_stock = variant.stock
        else:
            if product.stock < quantity:
                raise OrderServiceError(f"Insufficient stock for {product.name}.")
            unit_price = product.unit_price()
            available_stock = product.stock

        if available_stock < quantity:
            raise OrderServiceError(f"Insufficient stock for {product.name}.")

        line_total = unit_price * quantity
        total += line_total
        prepared_lines.append(
            {
                "product": product,
                "variant": variant,
                "quantity": quantity,
                "price_at_purchase": unit_price,
            }
        )

    order = Order.objects.create(
        user=user,
        guest_name=guest_name if user is None else "",
        guest_phone=guest_phone if user is None else "",
        guest_address=guest_address if user is None else "",
        payment_method=payment_method,
        total_amount=total,
        status="pending",
    )

    OrderItem.objects.bulk_create(
        [
            OrderItem(
                order=order,
                product=line["product"],
                variant=line["variant"],
                quantity=line["quantity"],
                price_at_purchase=line["price_at_purchase"],
            )
            for line in prepared_lines
        ]
    )

    for line in prepared_lines:
        quantity = line["quantity"]
        if line["variant"] is not None:
            ProductVariant.objects.filter(pk=line["variant"].pk).update(
                stock=F("stock") - quantity
            )
        else:
            Product.objects.filter(pk=line["product"].pk).update(stock=F("stock") - quantity)

    return (
        Order.objects.select_related("user")
        .prefetch_related("items__product", "items__variant")
        .get(pk=order.pk)
    )
