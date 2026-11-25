from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils.html import format_html

from common.gemini import GeminiNotConfiguredError

from .description_ai import apply_ai_description
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
    list_display = ("name", "price", "discount_percent", "stock", "description_indicator")
    list_filter = ("is_active", "category")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductVariantInline, ProductReviewInline]
    actions = ["generate_ai_descriptions"]
    change_form_template = "admin/products/product/change_form.html"

    @admin.display(description="Description")
    def description_indicator(self, obj: Product) -> str:
        if obj.description and obj.description.strip():
            return format_html('<span style="color:#0a0;">{}</span>', "✓")
        return format_html('<span style="color:#999;">{}</span>', "—")

    @admin.action(description="Generate AI descriptions", permissions=["change"])
    def generate_ai_descriptions(self, request, queryset):
        try:
            from common.gemini import get_gemini_api_key

            get_gemini_api_key()
        except GeminiNotConfiguredError as exc:
            self.message_user(request, str(exc), level=messages.ERROR)
            return

        success = 0
        failed = 0
        for product in queryset.select_related("category"):
            try:
                apply_ai_description(product, save=True)
                success += 1
            except Exception as exc:
                failed += 1
                self.message_user(
                    request,
                    f'Could not generate description for "{product.name}": {exc}',
                    level=messages.WARNING,
                )

        if success:
            self.message_user(
                request,
                f"Generated AI descriptions for {success} product(s).",
                level=messages.SUCCESS,
            )
        if failed and not success:
            self.message_user(
                request,
                "No descriptions were generated.",
                level=messages.ERROR,
            )

    def changeform_view(self, request, object_id=None, form_url="", extra_context=None):
        if (
            request.method == "POST"
            and "_generate_ai_description" in request.POST
            and object_id
        ):
            product = self.get_object(request, object_id)
            if product is None:
                self.message_user(request, "Product not found.", level=messages.ERROR)
            elif not self.has_change_permission(request, product):
                self.message_user(
                    request,
                    "You do not have permission to change this product.",
                    level=messages.ERROR,
                )
            else:
                try:
                    apply_ai_description(product, save=True)
                    self.message_user(
                        request,
                        "AI description generated and saved.",
                        level=messages.SUCCESS,
                    )
                except GeminiNotConfiguredError as exc:
                    self.message_user(request, str(exc), level=messages.ERROR)
                except Exception as exc:
                    self.message_user(
                        request,
                        f"Failed to generate description: {exc}",
                        level=messages.ERROR,
                    )
            url = reverse(
                "admin:products_product_change",
                args=[object_id],
                current_app=self.admin_site.name,
            )
            return HttpResponseRedirect(url)

        return super().changeform_view(request, object_id, form_url, extra_context)


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