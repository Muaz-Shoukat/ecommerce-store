from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.username


class Address(models.Model):
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="addresses",
    )
    label = models.CharField(max_length=50)  # e.g. "Home", "School"
    full_address = models.TextField()
    city = models.CharField(max_length=100)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.label} — {self.user.username}"
