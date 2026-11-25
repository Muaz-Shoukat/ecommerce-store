from django.conf import settings
from django.db import models

from products.models import Product, ProductVariant


class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("processing", "Processing"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]
    PAYMENT_METHOD_CHOICES = [
        ("jazzcash", "JazzCash"),
        ("easypaisa", "Easypaisa"),
        ("cod", "Cash on Delivery"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="orders",
    )

    # Guest checkout fields (used when user is null)
    guest_name = models.CharField(max_length=150, blank=True)
    guest_phone = models.CharField(max_length=20, blank=True)
    guest_address = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.pk} — {self.customer_display}"

    @property
    def customer_display(self):
        if self.user_id:
            return self.user.get_username()
        return self.guest_name or "Guest"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    quantity = models.PositiveIntegerField(default=1)
    price_at_purchase = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        product_name = self.product.name if self.product else "Deleted product"
        return f"{product_name} × {self.quantity}"
