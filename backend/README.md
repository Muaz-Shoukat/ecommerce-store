# Stationery Store

A full-stack e-commerce platform for a stationery shop. The backend is a Django REST API with JWT authentication and PostgreSQL; the frontend is a Vite single-page app. Payments are designed around Pakistani gateways (JazzCash and Easypaisa).

## Tech Stack

**Backend**
- Python, Django, Django REST Framework
- JWT auth via `djangorestframework-simplejwt`
- PostgreSQL
- `python-decouple` for environment config, `django-cors-headers` for CORS
- [uv](https://docs.astral.sh/uv/) for environment and dependency management

**Frontend**
- Vite, Node.js, npm

## Project Structure

```
stationery-store/
├── backend/
│   ├── accounts/      # Custom user model and authentication
│   ├── common/        # Shared utilities
│   ├── products/      # Categories, products, variants, reviews
│   ├── orders/        # Orders and checkout
│   ├── payments/      # JazzCash / Easypaisa integration
│   ├── config/        # Project settings (base / dev) and URLs
│   ├── media/         # Uploaded files (product images)
│   ├── .env.example
│   ├── manage.py
│   └── requirements.txt
└── frontend/
    ├── src/
    ├── public/
    ├── index.html
    └── vite.config.js
```

## Prerequisites

- Python 3.12+ and [uv](https://docs.astral.sh/uv/getting-started/installation/)
- PostgreSQL 14+
- Node.js 18+ and npm

## Backend Setup

```bash
cd backend

# 1. Create a virtual environment and install dependencies
uv venv
uv pip install -r requirements.txt

# 2. Configure environment variables
cp .env.example .env        # then edit .env (see below)

# 3. Create the database (in psql)
#    CREATE USER ecommerce_user WITH PASSWORD 'admin';
#    CREATE DATABASE ecommerce_store OWNER ecommerce_user;

# 4. Run migrations
uv run python manage.py migrate

# 5. Create an admin user
uv run python manage.py createsuperuser

# 6. Start the API server
uv run python manage.py runserver
```

The API runs at http://localhost:8000 and the admin panel at http://localhost:8000/admin/.

### Environment Variables

Create `backend/.env`:

```dotenv
DEBUG=True
SECRET_KEY=change-me
DATABASE_URL=postgres://ecommerce_user:admin@localhost:5432/ecommerce_store
FRONTEND_URL=http://localhost:5173
DJANGO_SETTINGS_MODULE=config.settings.dev

# Payment gateways (optional during development)
JAZZCASH_MERCHANT_ID=
JAZZCASH_PASSWORD=
JAZZCASH_INTEGRITY_SALT=
EASYPAISA_STORE_ID=
EASYPAISA_HASH_KEY=
```

> `DATABASE_URL` must contain the URL only, with no second `DATABASE_URL=` prefix and no quotes. Never commit `.env`.

### Seed Sample Data

Place `seed_products.py` at `backend/products/management/commands/seed_products.py`, with empty `__init__.py` files in `management/` and `commands/`, then run:

```bash
uv run python manage.py seed_products           # idempotent
uv run python manage.py seed_products --clear   # wipe and reseed
```

This creates sample categories, products and variants with placeholder images.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app runs at http://localhost:5173. Make sure `FRONTEND_URL` in the backend `.env` matches this address so CORS allows requests.

Build for production:

```bash
npm run build
```

## Common Commands

| Task | Command (from `backend/`) |
| --- | --- |
| Run server | `uv run python manage.py runserver` |
| Make migrations | `uv run python manage.py makemigrations` |
| Apply migrations | `uv run python manage.py migrate` |
| Run tests | `uv run python manage.py test` |
| Add a package | `uv add <package>` or `uv pip install <package>` |

## Features

- JWT authentication (access tokens 60 min, refresh tokens 7 days)
- Product catalog with categories, discounts, stock tracking and variants
- Product reviews and ratings (one review per user per product)
- Order management
- JazzCash and Easypaisa payment integration (in progress)

## Troubleshooting

**`The database name '...' is longer than PostgreSQL's limit of 63 characters`**
Your `DATABASE_URL` value is malformed, usually a doubled `DATABASE_URL=` prefix in `.env`, or a stale `DATABASE_URL` set in your shell. Run `echo $DATABASE_URL` and `unset` it if needed.

**`password authentication failed` / `database does not exist`**
Create the PostgreSQL user and database as shown in step 3 of the backend setup.

## License

Add a license of your choice here.