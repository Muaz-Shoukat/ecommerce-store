from django.urls import path

from .views import StripeConfigView, StripeConfirmSessionView, StripeWebhookView

urlpatterns = [
    path("payments/stripe/config/", StripeConfigView.as_view(), name="stripe-config"),
    path(
        "payments/stripe/confirm/",
        StripeConfirmSessionView.as_view(),
        name="stripe-confirm",
    ),
    path(
        "payments/stripe/webhook/",
        StripeWebhookView.as_view(),
        name="stripe-webhook",
    ),
]
