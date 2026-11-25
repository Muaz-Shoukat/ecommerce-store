"""
Thin Gemini client for catalog features (chat RAG, AI descriptions).

Uses gemini-3.5-flash-lite — free-tier friendly and low token cost.
API key is read from GEMINI_API_KEY; never hard-code secrets.
"""

from __future__ import annotations

from django.conf import settings
from google import genai


DEFAULT_MODEL = "gemini-3.5-flash-lite"


class GeminiNotConfiguredError(RuntimeError):
    """Raised when GEMINI_API_KEY is missing or empty."""


def get_gemini_api_key() -> str:
    key = (getattr(settings, "GEMINI_API_KEY", None) or "").strip()
    if not key:
        raise GeminiNotConfiguredError(
            "GEMINI_API_KEY is not set. Add it to backend/.env "
            "(get a free key at https://aistudio.google.com/apikey)."
        )
    return key


def get_gemini_client() -> genai.Client:
    return genai.Client(api_key=get_gemini_api_key())


def generate_text(
    prompt: str,
    *,
    system_instruction: str | None = None,
    model: str | None = None,
    max_output_tokens: int = 512,
) -> str:
    """
    Generate a short text completion. Keeps max_output_tokens low to save quota.
    """
    client = get_gemini_client()
    config: dict = {"max_output_tokens": max_output_tokens}
    if system_instruction:
        config["system_instruction"] = system_instruction

    response = client.models.generate_content(
        model=model or getattr(settings, "GEMINI_MODEL", DEFAULT_MODEL),
        contents=prompt,
        config=config,
    )
    text = (getattr(response, "text", None) or "").strip()
    if not text:
        raise RuntimeError("Gemini returned an empty response.")
    return text
