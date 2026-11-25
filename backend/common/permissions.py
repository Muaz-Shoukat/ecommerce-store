from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOwner(BasePermission):
    """
    Object-level permission: only the owner may access the object.
    Expects the model to have a `user` attribute.
    """

    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "user", None)
        return owner == request.user


class IsOwnerOrReadOnly(BasePermission):
    """Allow read to anyone; write only to the owner."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner = getattr(obj, "user", None)
        return owner == request.user


class IsAdminOrStaff(BasePermission):
    """Allow access only to authenticated admin or staff users."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_staff or user.is_superuser)
        )
