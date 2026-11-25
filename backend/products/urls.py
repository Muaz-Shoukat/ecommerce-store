from django.urls import path

from .views import (
    CategoryListView,
    ProductDetailView,
    ProductListView,
    ProductReviewListCreateView,
)

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("products/", ProductListView.as_view(), name="product-list"),
    path(
        "products/<slug:slug>/reviews/",
        ProductReviewListCreateView.as_view(),
        name="product-reviews",
    ),
    path("products/<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),
]
