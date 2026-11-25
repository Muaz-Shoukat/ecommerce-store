from django.contrib import admin, messages

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    can_delete = False
    readonly_fields = ("product", "variant", "quantity", "price_at_purchase")
    fields = ("product", "variant", "quantity", "price_at_purchase")

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "total_amount", "status", "payment_method", "created_at")
    list_filter = ("status", "payment_method")
    search_fields = ("guest_name", "guest_phone", "user__username")
    readonly_fields = ("created_at", "updated_at", "total_amount")
    inlines = [OrderItemInline]
    actions = ["mark_confirmed", "mark_processing", "mark_shipped", "mark_delivered", "mark_cancelled"]

    @admin.display(description="Customer")
    def customer(self, obj):
        return obj.customer_display

    def _bulk_set_status(self, request, queryset, status):
        updated = queryset.update(status=status)
        self.message_user(
            request,
            f"Updated {updated} order(s) to “{status}”.",
            messages.SUCCESS,
        )

    @admin.action(description="Mark selected orders as Confirmed")
    def mark_confirmed(self, request, queryset):
        self._bulk_set_status(request, queryset, "confirmed")

    @admin.action(description="Mark selected orders as Processing")
    def mark_processing(self, request, queryset):
        self._bulk_set_status(request, queryset, "processing")

    @admin.action(description="Mark selected orders as Shipped")
    def mark_shipped(self, request, queryset):
        self._bulk_set_status(request, queryset, "shipped")

    @admin.action(description="Mark selected orders as Delivered")
    def mark_delivered(self, request, queryset):
        self._bulk_set_status(request, queryset, "delivered")

    @admin.action(description="Mark selected orders as Cancelled")
    def mark_cancelled(self, request, queryset):
        self._bulk_set_status(request, queryset, "cancelled")


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("order", "product", "variant", "quantity", "price_at_purchase")
    list_filter = ("order__status",)
