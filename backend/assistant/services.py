from __future__ import annotations

from decimal import Decimal

from django.db.models import Q

from common.gemini import generate_text
from products.models import Product
from products.services import annotate_product_stats

STOPWORDS = frozenset(
    {
        "a",
        "an",
        "the",
        "is",
        "are",
        "was",
        "were",
        "what",
        "which",
        "who",
        "how",
        "do",
        "does",
        "did",
        "you",
        "your",
        "i",
        "me",
        "my",
        "we",
        "our",
        "for",
        "and",
        "or",
        "to",
        "of",
        "in",
        "on",
        "with",
        "about",
        "please",
        "can",
        "could",
        "would",
        "want",
        "need",
        "looking",
        "find",
        "show",
        "tell",
        "any",
        "some",
        "this",
        "that",
        "these",
        "those",
    }
)

RETRIEVE_LIMIT = 8
DESC_MAX_LEN = 200

SYSTEM_INSTRUCTION = (
    "You are a helpful stationery store assistant. "
    "Answer ONLY using the product context provided. "
    "If the answer is not in the context, say you do not have that product or information. "
    "When recommending products, mention their name and slug. "
    "Be concise and friendly."
)


def _tokenize(message: str) -> list[str]:
    raw = message.lower().split()
    tokens: list[str] = []
    for word in raw:
        cleaned = "".join(ch for ch in word if ch.isalnum())
        if len(cleaned) > 1 and cleaned not in STOPWORDS:
            tokens.append(cleaned)
    return tokens


def _truncate(text: str, max_len: int = DESC_MAX_LEN) -> str:
    normalized = " ".join((text or "").split())
    if len(normalized) <= max_len:
        return normalized
    return normalized[: max_len - 3].rstrip() + "..."


def retrieve_products(
    message: str,
    *,
    product_slug: str | None = None,
    limit: int = RETRIEVE_LIMIT,
) -> list[Product]:
    base_qs = Product.objects.filter(is_active=True).select_related("category")
    found: list[Product] = []
    seen: set[int] = set()

    if product_slug:
        pinned = base_qs.filter(slug=product_slug).first()
        if pinned:
            found.append(pinned)
            seen.add(pinned.pk)

    tokens = _tokenize(message)
    if tokens:
        combined = Q()
        for token in tokens:
            combined |= (
                Q(name__icontains=token)
                | Q(description__icontains=token)
                | Q(category__name__icontains=token)
            )
        for product in base_qs.filter(combined).distinct()[:limit]:
            if product.pk not in seen:
                found.append(product)
                seen.add(product.pk)

    if len(found) < 3:
        top_sold = annotate_product_stats(base_qs).order_by("-sold_count", "-pk")[:limit]
        for product in top_sold:
            if product.pk not in seen:
                found.append(product)
                seen.add(product.pk)
            if len(found) >= limit:
                break

    return found[:limit]


def build_context(products: list[Product]) -> str:
    if not products:
        return "(No matching products in context.)"

    lines: list[str] = []
    for product in products:
        category = product.category.name if product.category else "Uncategorized"
        desc = _truncate(product.description)
        lines.append(
            f"- id={product.pk} name={product.name!r} slug={product.slug} "
            f"category={category} price={product.price} sale_price={product.sale_price} "
            f"stock={product.stock} description={desc!r}"
        )
    return "\n".join(lines)


def format_sources(products: list[Product]) -> list[dict]:
    sources: list[dict] = []
    for product in products:
        price = product.sale_price
        sources.append(
            {
                "name": product.name,
                "slug": product.slug,
                "price": str(price) if isinstance(price, Decimal) else price,
            }
        )
    return sources


def generate_answer(message: str, context: str) -> str:
    prompt = (
        f"Product catalog context:\n{context}\n\n"
        f"Customer question:\n{message.strip()}\n"
    )
    return generate_text(
        prompt,
        system_instruction=SYSTEM_INSTRUCTION,
        max_output_tokens=400,
    )


def chat_with_assistant(
    message: str,
    *,
    product_slug: str | None = None,
) -> tuple[str, list[dict]]:
    products = retrieve_products(message, product_slug=product_slug)
    context = build_context(products)
    reply = generate_answer(message, context)
    return reply, format_sources(products)