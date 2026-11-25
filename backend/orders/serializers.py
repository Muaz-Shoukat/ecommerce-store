from rest_framework import serializers

from .models import Order, OrderItem
from .services import OrderServiceError, create_order


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    variant_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    items = OrderItemInputSerializer(many=True)
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES)
    guest_name = serializers.CharField(required=False, allow_blank=True, default="")
    guest_phone = serializers.CharField(required=False, allow_blank=True, default="")
    guest_address = serializers.CharField(required=False, allow_blank=True, default="")
    guest_email = serializers.EmailField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user if request.user.is_authenticated else None
        payment_method = attrs.get("payment_method")
        email = (attrs.get("guest_email") or "").strip()
        if user is not None:
            email = email or (getattr(user, "email", "") or "").strip()
        if payment_method == "stripe" and not email:
            raise serializers.ValidationError(
                {"guest_email": "Email is required for card payments."}
            )
        attrs["guest_email"] = email
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user if request.user.is_authenticated else None
        try:
            return create_order(
                items=validated_data["items"],
                payment_method=validated_data["payment_method"],
                user=user,
                guest_name=validated_data.get("guest_name", ""),
                guest_phone=validated_data.get("guest_phone", ""),
                guest_address=validated_data.get("guest_address", ""),
                guest_email=validated_data.get("guest_email", ""),
            )
        except OrderServiceError as exc:
            raise serializers.ValidationError({"detail": str(exc)}) from exc


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True, default=None)
    variant_label = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product",
            "product_name",
            "variant",
            "variant_label",
            "quantity",
            "price_at_purchase",
        )

    def get_variant_label(self, obj):
        if not obj.variant:
            return None
        return f"{obj.variant.name}: {obj.variant.value}"


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    customer = serializers.CharField(source="customer_display", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "customer",
            "user",
            "guest_name",
            "guest_phone",
            "guest_address",
            "guest_email",
            "status",
            "payment_method",
            "total_amount",
            "stripe_checkout_session_id",
            "items",
            "created_at",
            "updated_at",
        )
        read_only_fields = fields


class OrderStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ("status",)
