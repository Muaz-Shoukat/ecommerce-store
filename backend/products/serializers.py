from rest_framework import serializers

from .models import Category, Product, ProductReview, ProductVariant
from .services import user_can_review, user_has_reviewed

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ("id", "name", "value", "extra_price", "stock")


class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    sale_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )
    average_rating = serializers.FloatField(read_only=True, default=0)
    review_count = serializers.IntegerField(read_only=True, default=0)
    sold_count = serializers.IntegerField(read_only=True, default=0)
    can_review = serializers.SerializerMethodField()
    has_reviewed = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "category",
            "name",
            "slug",
            "description",
            "price",
            "discount_percent",
            "sale_price",
            "stock",
            "image",
            "is_active",
            "created_at",
            "variants",
            "average_rating",
            "review_count",
            "sold_count",
            "can_review",
            "has_reviewed",
        )

    def get_can_review(self, obj):
        request = self.context.get("request")
        if not request:
            return False
        return user_can_review(request.user, obj)

    def get_has_reviewed(self, obj):
        request = self.context.get("request")
        if not request:
            return False
        return user_has_reviewed(request.user, obj)

    def validate_image(self, value):
        if value and value.size > MAX_IMAGE_SIZE_BYTES:
            raise serializers.ValidationError("Image file size must be 5MB or less.")
        return value


class ProductReviewSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = ProductReview
        fields = ("id", "user", "rating", "comment", "created_at")
        read_only_fields = ("id", "user", "created_at")

    def get_user(self, obj):
        return obj.user.get_username()


class ProductReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductReview
        fields = ("rating", "comment")

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_comment(self, value):
        text = (value or "").strip()
        if len(text) < 5:
            raise serializers.ValidationError("Comment must be at least 5 characters.")
        return text
