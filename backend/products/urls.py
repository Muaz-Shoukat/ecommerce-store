from django.urls import path

from .views import (
    CategoryListView,
    ProductDetailView,
    ProductListView,
    ProductReviewListCreateView,
    ProductSuggestionsView,
)

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("products/", ProductListView.as_view(), name="product-list"),
    path(
        "products/<slug:slug>/reviews/",
        ProductReviewListCreateView.as_view(),
        name="product-reviews",
    ),
    path(
        "products/<slug:slug>/suggestions/",
        ProductSuggestionsView.as_view(),
        name="product-suggestions",
    ),
    path("products/<slug:slug>/", ProductDetailView.as_view(), name="product-detail"),
]
