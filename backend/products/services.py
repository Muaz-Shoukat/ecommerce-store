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
