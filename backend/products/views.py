from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from common.pagination import StandardResultsSetPagination

from .models import Category, Product, ProductReview
from .serializers import (
    CategorySerializer,
    ProductReviewCreateSerializer,
    ProductReviewSerializer,
    ProductSerializer,
)
from .services import annotate_product_stats, filter_products, user_can_review, user_has_reviewed


class CategoryListView(ListAPIView):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
    pagination_class = StandardResultsSetPagination


class ProductListView(ListAPIView):
    serializer_class = ProductSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = annotate_product_stats(
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related("variants")
            .order_by("-created_at")
        )
        return filter_products(
            queryset,
            category=self.request.query_params.get("category"),
            search=self.request.query_params.get("search"),
        )


class ProductDetailView(RetrieveAPIView):
    serializer_class = ProductSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return annotate_product_stats(
            Product.objects.filter(is_active=True)
            .select_related("category")
            .prefetch_related("variants")
        )


class ProductReviewListCreateView(ListCreateAPIView):
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_product(self):
        return Product.objects.get(slug=self.kwargs["slug"], is_active=True)

    def get_queryset(self):
        return (
            ProductReview.objects.filter(product__slug=self.kwargs["slug"], product__is_active=True)
            .select_related("user")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProductReviewCreateSerializer
        return ProductReviewSerializer

    def list(self, request, *args, **kwargs):
        try:
            self.get_product()
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        try:
            product = self.get_product()
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        if user_has_reviewed(request.user, product):
            return Response(
                {"detail": "You have already reviewed this product."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user_can_review(request.user, product):
            return Response(
                {
                    "detail": (
                        "You can only review products you have purchased "
                        "(order confirmed or later)."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = ProductReview.objects.create(
            product=product,
            user=request.user,
            rating=serializer.validated_data["rating"],
            comment=serializer.validated_data["comment"],
        )
        return Response(
            ProductReviewSerializer(review).data,
            status=status.HTTP_201_CREATED,
        )
