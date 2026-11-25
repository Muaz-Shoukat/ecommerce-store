"""Generate product descriptions via the shared Gemini client."""

from __future__ import annotations

from common.gemini import generate_text

from .models import Product

SYSTEM_INSTRUCTION = (
    "You write friendly product descriptions for a stationery shop. "
    "Use 2–4 sentences. Plain text only: no markdown, no bullet lists. "
    "Do not mention prices, discounts, or shipping. "
    "Do not invent features or claims that are not implied by the product name."
)

MAX_OUTPUT_TOKENS = 300


def _build_prompt(product: Product) -> str:
    parts = [f'Product name: "{product.name}"']
    if product.category_id and product.category:
        parts.append(f'Category: "{product.category.name}"')
    parts.append("Write a short shop description for this item.")
    return "\n".join(parts)


def generate_product_description(product: Product) -> str:
    product = (
        Product.objects.select_related("category").filter(pk=product.pk).first()
        or product
    )
    return generate_text(
        _build_prompt(product),
        system_instruction=SYSTEM_INSTRUCTION,
        max_output_tokens=MAX_OUTPUT_TOKENS,
    )


def apply_ai_description(product: Product, *, save: bool = True) -> str:
    text = generate_product_description(product)
    product.description = text
    if save:
        product.save(update_fields=["description"])
    return text