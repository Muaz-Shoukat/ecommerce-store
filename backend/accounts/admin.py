from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Address, CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "phone", "is_staff", "is_active")
    fieldsets = UserAdmin.fieldsets + (
        ("Contact", {"fields": ("phone",)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Contact", {"fields": ("phone",)}),
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ("label", "user", "city", "is_default")
    list_filter = ("city", "is_default")
    search_fields = ("label", "full_address", "user__username")
