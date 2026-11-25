from rest_framework.generics import CreateAPIView, ListCreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated

from common.permissions import IsOwner

from .models import Address
from .serializers import AddressSerializer, RegisterSerializer


class RegisterView(CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class AddressListCreateView(ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user).order_by("-is_default", "id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
