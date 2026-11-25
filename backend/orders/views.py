from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from common.permissions import IsAdminOrStaff, IsOwner

from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer, OrderStatusUpdateSerializer


class OrderListCreateView(ListCreateAPIView):
    """
    POST /api/orders/ — create (guest or authenticated)
    GET  /api/orders/ — list logged-in user's orders
    """

    def get_permissions(self):
        if self.request.method == "POST":
            return [AllowAny()]
        return [IsAuthenticated(), IsOwner()]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return OrderCreateSerializer
        return OrderSerializer

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Order.objects.none()
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items__product", "items__variant")
            .order_by("-created_at")
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        output = OrderSerializer(order, context=self.get_serializer_context())
        headers = self.get_success_headers(output.data)
        return Response(output.data, status=status.HTTP_201_CREATED, headers=headers)


class OrderDetailView(RetrieveAPIView):
    """GET /api/orders/<id>/ — owner only."""

    permission_classes = [IsAuthenticated, IsOwner]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related("items__product", "items__variant")
        )


class OrderStatusUpdateView(UpdateAPIView):
    """PATCH /api/orders/<id>/status/ — admin/staff only."""

    permission_classes = [IsAdminOrStaff]
    serializer_class = OrderStatusUpdateSerializer
    http_method_names = ["patch", "head", "options"]
    queryset = Order.objects.all()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        output = OrderSerializer(instance, context=self.get_serializer_context())
        return Response(output.data)
