from django.conf import settings
from django.core.validators import FileExtensionValidator, MaxValueValidator, MinValueValidator
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name="products",
    )
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(90)],
        help_text="Percent off the list price (0–90).",
    )
    stock = models.PositiveIntegerField(default=0)
    image = models.ImageField(
        upload_to="products/",
        validators=[FileExtensionValidator(allowed_extensions=["jpg", "jpeg", "png", "webp"])],
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def sale_price(self):
        """List price after discount_percent is applied."""
        from decimal import Decimal, ROUND_HALF_UP

        if not self.discount_percent:
            return self.price
        factor = (Decimal("100") - Decimal(self.discount_percent)) / Decimal("100")
        return (self.price * factor).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def unit_price(self, variant=None):
        base = self.sale_price
        if variant is not None:
            return base + variant.extra_price
        return base

    def __str__(self):
        return self.name


class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="variants",
    )
    name = models.CharField(max_length=50)  # e.g. "Size", "Color"
    value = models.CharField(max_length=50)  # e.g. "Medium", "Blue"
    extra_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.product.name} — {self.name}: {self.value}"


class ProductReview(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="product_reviews",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["product", "user"],
                name="unique_product_review_per_user",
            ),
        ]

    def __str__(self):
        return f"{self.product.name} — {self.rating}★ by {self.user}"
