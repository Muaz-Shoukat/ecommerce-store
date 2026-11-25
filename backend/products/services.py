from django.db.models import Avg, Count, IntegerField, OuterRef, QuerySet, Subquery, Sum, Value
from django.db.models.functions import Coalesce

from orders.models import OrderItem

from .models import Product, ProductReview

REVIEW_ELIGIBLE_STATUSES = ("confirmed", "processing", "shipped", "delivered")
SOLD_COUNT_STATUSES = REVIEW_ELIGIBLE_STATUSES


def filter_products(queryset: QuerySet, *, category: str | None = None, search: str | None = None) -> QuerySet:
    """Apply category and search filters to a product queryset."""
    if category:
        queryset = queryset.filter(category__slug=category)
    if search:
        queryset = queryset.filter(name__icontains=search)
    return queryset


def annotate_product_stats(queryset: QuerySet) -> QuerySet:
    """Add average_rating, review_count, and sold_count annotations."""
    sold_subquery = (
        OrderItem.objects.filter(
            product_id=OuterRef("pk"),
            order__status__in=SOLD_COUNT_STATUSES,
        )
        .values("product_id")
        .annotate(total=Sum("quantity"))
        .values("total")[:1]
    )
    return queryset.annotate(
        average_rating=Coalesce(Avg("reviews__rating"), Value(0.0)),
        review_count=Count("reviews", distinct=True),
        sold_count=Coalesce(
            Subquery(sold_subquery, output_field=IntegerField()),
            Value(0),
        ),
    )


def user_has_purchased(user, product: Product) -> bool:
    if not user or not user.is_authenticated:
        return False
    return OrderItem.objects.filter(
        product=product,
        order__user=user,
        order__status__in=REVIEW_ELIGIBLE_STATUSES,
    ).exists()


def user_has_reviewed(user, product: Product) -> bool:
    if not user or not user.is_authenticated:
        return False
    return ProductReview.objects.filter(product=product, user=user).exists()


def user_can_review(user, product: Product) -> bool:
    return user_has_purchased(user, product) and not user_has_reviewed(user, product)


def _active_products_queryset() -> QuerySet:
    return (
        Product.objects.filter(is_active=True)
        .select_related("category")
        .prefetch_related("variants")
    )


def get_product_suggestions(product: Product, *, limit: int = 4) -> list[Product]:
    """Rule-based suggestions: FBT, same category, then popular (no ML)."""
    if limit <= 0:
        return []

    excluded_ids: set[int] = {product.pk}
    ordered_ids: list[int] = []

    order_ids = (
        OrderItem.objects.filter(
            product_id=product.pk,
            order__status__in=SOLD_COUNT_STATUSES,
        )
        .values_list("order_id", flat=True)
        .distinct()
    )
    if order_ids:
        fbt_rows = (
            OrderItem.objects.filter(
                order_id__in=order_ids,
                order__status__in=SOLD_COUNT_STATUSES,
                product__is_active=True,
            )
            .exclude(product_id=product.pk)
            .exclude(product_id__isnull=True)
            .values("product_id")
            .annotate(co_count=Count("order_id", distinct=True))
            .order_by("-co_count")
        )
        for row in fbt_rows:
            if len(ordered_ids) >= limit:
                break
            product_id = row["product_id"]
            if product_id not in excluded_ids:
                excluded_ids.add(product_id)
                ordered_ids.append(product_id)

    def fill_from_queryset(queryset: QuerySet) -> None:
        remaining = limit - len(ordered_ids)
        if remaining <= 0:
            return
        for pk in queryset.values_list("pk", flat=True)[:remaining]:
            if pk not in excluded_ids:
                excluded_ids.add(pk)
                ordered_ids.append(pk)

    if len(ordered_ids) < limit and product.category_id:
        fill_from_queryset(
            annotate_product_stats(
                _active_products_queryset()
                .filter(category_id=product.category_id)
                .exclude(pk__in=excluded_ids)
            ).order_by("-sold_count", "-created_at")
        )

    if len(ordered_ids) < limit:
        fill_from_queryset(
            annotate_product_stats(
                _active_products_queryset().exclude(pk__in=excluded_ids)
            ).order_by("-sold_count", "-created_at")
        )

    if not ordered_ids:
        return []

    products_by_id = {
        item.pk: item
        for item in annotate_product_stats(
            _active_products_queryset().filter(pk__in=ordered_ids)
        )
    }
    return [products_by_id[pk] for pk in ordered_ids if pk in products_by_id]
