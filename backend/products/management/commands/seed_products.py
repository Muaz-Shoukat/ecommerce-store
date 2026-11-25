from decimal import Decimal
from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from PIL import Image

from products.models import Category, Product, ProductReview, ProductVariant

User = get_user_model()

SEED_REVIEWERS = [
    {"username": "seed_reviewer_1", "password": "seedpass123"},
    {"username": "seed_reviewer_2", "password": "seedpass123"},
    {"username": "seed_reviewer_3", "password": "seedpass123"},
]

SEED_COMMENTS = [
    (5, "My kids love this — great quality and arrived quickly."),
    (4, "Nice product for school. Would buy again."),
    (5, "Perfect size and the colors are bright. Highly recommend!"),
    (3, "Good overall, though packaging was a bit plain."),
    (4, "Worth the price. Durable enough for daily use."),
]

SEED_DATA = [
    {
        "name": "Pens",
        "products": [
            {"name": "Rainbow Gel Pen Set", "price": "249.00", "stock": 40, "discount_percent": 10},
            {"name": "Cartoon Character Ballpoint", "price": "79.00", "stock": 100},
            {"name": "Sparkle Glitter Pen Pack", "price": "199.00", "stock": 55, "discount_percent": 15},
        ],
    },
    {
        "name": "Erasers",
        "products": [
            {"name": "Animal Shape Eraser Pack", "price": "99.00", "stock": 80},
            {"name": "Scented Soft Eraser", "price": "49.00", "stock": 120, "discount_percent": 20},
            {"name": "Giant Novelty Eraser", "price": "129.00", "stock": 35},
        ],
    },
    {
        "name": "Water Bottles",
        "products": [
            {"name": "Kids Space Adventure Bottle", "price": "799.00", "stock": 25, "discount_percent": 25},
            {"name": "Pastel Sipper Bottle 500ml", "price": "599.00", "stock": 30},
            {"name": "Cartoon Print Steel Bottle", "price": "999.00", "stock": 18, "discount_percent": 50},
        ],
    },
    {
        "name": "Uniforms",
        "products": [
            {"name": "School Shirt Blue", "price": "1299.00", "stock": 45},
            {"name": "School Trousers Grey", "price": "1499.00", "stock": 40, "discount_percent": 10},
            {"name": "House T-Shirt Red", "price": "899.00", "stock": 50, "discount_percent": 15},
        ],
    },
    {
        "name": "Bags",
        "products": [
            {"name": "Dinosaur Backpack", "price": "2499.00", "stock": 20, "discount_percent": 20},
            {"name": "Unicorn School Bag", "price": "2199.00", "stock": 22},
            {"name": "Compact Lunch Tote", "price": "699.00", "stock": 60, "discount_percent": 10},
        ],
    },
]


def _placeholder_image(label: str) -> ContentFile:
    """Generate a simple PNG placeholder for seeded products."""
    image = Image.new("RGB", (400, 400), color=(240, 232, 220))
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return ContentFile(buffer.getvalue(), name=f"{slugify(label)}.png")


class Command(BaseCommand):
    help = "Seed sample categories and products (idempotent)."

    def handle(self, *args, **options):
        categories_created = 0
        products_created = 0
        products_updated = 0

        for category_data in SEED_DATA:
            category_name = category_data["name"]
            category_slug = slugify(category_name)
            category, created = Category.objects.update_or_create(
                slug=category_slug,
                defaults={"name": category_name},
            )
            if created:
                categories_created += 1
                self.stdout.write(f"Created category: {category.name}")
            else:
                self.stdout.write(f"Updated category: {category.name}")

            for product_data in category_data["products"]:
                product_slug = slugify(product_data["name"])
                defaults = {
                    "category": category,
                    "name": product_data["name"],
                    "description": f"Sample {product_data['name']} for the kids stationery store.",
                    "price": Decimal(product_data["price"]),
                    "discount_percent": product_data.get("discount_percent", 0),
                    "stock": product_data["stock"],
                    "is_active": True,
                }

                product = Product.objects.filter(slug=product_slug).first()
                if product is None:
                    product = Product(slug=product_slug, **defaults)
                    product.image.save(
                        f"{product_slug}.png",
                        _placeholder_image(product_data["name"]),
                        save=False,
                    )
                    product.save()
                    products_created += 1
                    self.stdout.write(f"  Created product: {product.name}")
                else:
                    for field, value in defaults.items():
                        setattr(product, field, value)
                    if not product.image:
                        product.image.save(
                            f"{product_slug}.png",
                            _placeholder_image(product_data["name"]),
                            save=False,
                        )
                    product.save()
                    products_updated += 1
                    self.stdout.write(f"  Updated product: {product.name}")

                # One sample variant per product (also idempotent)
                ProductVariant.objects.update_or_create(
                    product=product,
                    name="Color",
                    value="Default",
                    defaults={
                        "extra_price": Decimal("0.00"),
                        "stock": product.stock,
                    },
                )

        reviews_created = self._seed_reviews()

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Categories created: {categories_created}. "
                f"Products created: {products_created}, updated: {products_updated}. "
                f"Reviews created: {reviews_created}."
            )
        )

    def _seed_reviews(self) -> int:
        reviewers = []
        for data in SEED_REVIEWERS:
            user, created = User.objects.get_or_create(
                username=data["username"],
                defaults={"email": f"{data['username']}@example.com"},
            )
            if created:
                user.set_password(data["password"])
                user.save()
                self.stdout.write(f"Created seed reviewer: {user.username}")
            reviewers.append(user)

        products = list(Product.objects.filter(is_active=True).order_by("id"))
        created_count = 0
        for index, product in enumerate(products):
            # 1–2 reviews per product from rotating reviewers
            for offset in range(1 + (index % 2)):
                reviewer = reviewers[(index + offset) % len(reviewers)]
                rating, comment = SEED_COMMENTS[(index + offset) % len(SEED_COMMENTS)]
                _, created = ProductReview.objects.get_or_create(
                    product=product,
                    user=reviewer,
                    defaults={"rating": rating, "comment": comment},
                )
                if created:
                    created_count += 1
        return created_count
