from rest_framework import serializers


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(required=True, max_length=1000, trim_whitespace=True)
    product_slug = serializers.SlugField(required=False, allow_blank=True, max_length=200)

    def validate_message(self, value: str) -> str:
        if not value.strip():
            raise serializers.ValidationError("Message cannot be empty.")
        return value.strip()

    def validate_product_slug(self, value: str) -> str | None:
        if value is None or not str(value).strip():
            return None
        return str(value).strip()