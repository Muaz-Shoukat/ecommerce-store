from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from common.gemini import GeminiNotConfiguredError

from .serializers import ChatRequestSerializer
from .services import chat_with_assistant


class AssistantChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = serializer.validated_data["message"]
        product_slug = serializer.validated_data.get("product_slug")

        try:
            reply, sources = chat_with_assistant(message, product_slug=product_slug)
        except GeminiNotConfiguredError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except (RuntimeError, OSError, ValueError):
            return Response(
                {"detail": "Assistant is temporarily unavailable. Please try again later."},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception:
            return Response(
                {"detail": "Assistant is temporarily unavailable. Please try again later."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({"reply": reply, "sources": sources})