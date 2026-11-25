from django.contrib import admin

from .models import Category, Product, ProductReview, ProductVariant


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


class ProductReviewInline(admin.TabularInline):
    model = ProductReview
    extra = 0
    readonly_fields = ("created_at", "updated_at")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "discount_percent", "stock")
    list_filter = ("is_active", "category")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductVariantInline, ProductReviewInline]


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ("name", "value", "stock")
    list_filter = ("product",)


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "user", "rating", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("product__name", "user__username", "comment")
    readonly_fields = ("created_at", "updated_at")
