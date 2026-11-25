from django.urls import path

from .views import (
    OrderDetailView,
    OrderInvoiceView,
    OrderListCreateView,
    OrderStatusUpdateView,
)

urlpatterns = [
    path("orders/", OrderListCreateView.as_view(), name="order-list-create"),
    path("orders/<int:pk>/", OrderDetailView.as_view(), name="order-detail"),
    path(
        "orders/<int:pk>/invoice/",
        OrderInvoiceView.as_view(),
        name="order-invoice",
    ),
    path(
        "orders/<int:pk>/status/",
        OrderStatusUpdateView.as_view(),
        name="order-status-update",
    ),
]
