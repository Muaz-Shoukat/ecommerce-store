# Stationery Store

A full-stack e-commerce platform for a stationery shop. The backend is a Django REST API with JWT authentication and PostgreSQL; the frontend is a Vite + React SPA. Payments support **Stripe Checkout** (test/live) plus JazzCash / Easypaisa placeholders, with optional Gemini-powered chat, suggestions, and admin product descriptions.

## Tech Stack

**Backend**
- Python, Django, Django REST Framework
- JWT auth via `djangorestframework-simplejwt`
- PostgreSQL
- Stripe Python SDK, Google GenAI (Gemini), ReportLab (PDF invoices)
- `python-decouple` for environment config, `django-cors-headers` for CORS
- [uv](https://docs.astral.sh/uv/) for environment and dependency management

**Frontend**
- Vite, React, Tailwind, Node.js, npm

## Project Structure

```
ecommerce-store/
├── backend/
│   ├── accounts/      # Custom user model and authentication
│   ├── assistant/     # RAG store chatbot (Gemini)
│   ├── common/        # Shared utilities (Gemini client)
│   ├── products/      # Categories, products, variants, reviews, suggestions
│   ├── orders/        # Orders, checkout, confirmation email, PDF invoice
│   ├── payments/      # Stripe Checkout + webhook; JazzCash / Easypaisa stubs
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

- Python 3.12+
- [uv](https://docs.astral.sh/uv/getting-started/installation/)
- PostgreSQL 14+
- Node.js 18+ and npm (frontend)

## Backend Setup

### 1. Clone the repo and open the backend

```bash
git clone <repo-url>
cd ecommerce-store/backend
```

### 2. Create the virtual environment and install dependencies

```bash
uv venv
uv pip install -r requirements.txt
```

### 3. Configure environment variables

```bash
cp .env.example .env   # then edit .env (see Environment Variables below)
```

### 4. Create the database (in psql)

```sql
CREATE USER ecommerce_user WITH PASSWORD 'admin';
CREATE DATABASE ecommerce_store OWNER ecommerce_user;
```

### 5. Run migrations

```bash
uv run python manage.py migrate
```

### 6. (Optional) Seed sample products

```bash
uv run python manage.py seed_products           # idempotent
uv run python manage.py seed_products --clear   # wipe and reseed
```

### 7. Create an admin user

```bash
uv run python manage.py createsuperuser
```

### 8. Start the server

```bash
uv run python manage.py runserver
```

The API runs at http://localhost:8000 and the admin panel at http://localhost:8000/admin/.

### Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in values. Minimum for local shop + Stripe:

```dotenv
DEBUG=True
SECRET_KEY=change-me
DATABASE_URL=postgres://ecommerce_user:admin@localhost:5432/ecommerce_store
FRONTEND_URL=http://localhost:5173
DJANGO_SETTINGS_MODULE=config.settings.dev

# Stripe (test mode): https://dashboard.stripe.com/test/apikeys
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=          # from Stripe CLI listen (see below)
STRIPE_CURRENCY=pkr

# Optional: Gemini AI features
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite

# Optional: Gmail SMTP for order emails
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=

# Legacy gateway placeholders (optional)
JAZZCASH_MERCHANT_ID=
JAZZCASH_PASSWORD=
JAZZCASH_INTEGRITY_SALT=
EASYPAISA_STORE_ID=
EASYPAISA_HASH_KEY=
```

> `DATABASE_URL` must contain the URL only, with no second `DATABASE_URL=` prefix and no quotes. Never commit `.env`.

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
- Rule-based “You may also like” suggestions
- RAG store assistant (Gemini) + AI product descriptions in Django admin
- Guest checkout with COD or Stripe Checkout
- Order confirmation email (Gmail SMTP) + PDF invoice download
- JazzCash / Easypaisa payment method placeholders

## Stripe payments & webhooks (local)

Stripe’s Dashboard **cannot** send webhooks to `localhost`. This app supports two fulfillment paths so local demos still work.

### How payment confirmation works

| Path | When it runs | Needs public URL? |
| --- | --- | --- |
| **Success-URL confirm API** `POST /api/payments/stripe/confirm/` | After Checkout redirects to `/order-confirmation?session_id=…` the frontend asks Django to retrieve the session from Stripe and mark the order paid | No — this is the default local path |
| **Webhook** `POST /api/payments/stripe/webhook/` | Stripe pushes `checkout.session.completed` (and async success) with a signed payload | Yes for Dashboard webhooks, **or** use Stripe CLI locally (below) |

Both paths call the same `confirm_order_payment` helper (idempotent): set status → send email if configured.

### 1) Minimum local Stripe (no webhooks)

1. Put `STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` (test mode) in `backend/.env`.
2. Restart Django: `uv run python manage.py runserver 8000`.
3. Checkout → **Card (Stripe)** → pay with test card `4242 4242 4242 4242`.
4. On return, the confirmation page calls `/api/payments/stripe/confirm/` and the order becomes **confirmed**.

You can leave `STRIPE_WEBHOOK_SECRET` empty if you only use this path. Webhook posts will fail signature checks until the secret is set.

### 2) Recommended local webhooks — Stripe CLI

Use [Stripe CLI](https://stripe.com/docs/stripe-cli) so real Stripe events are forwarded to your machine:

```bash
# Install (macOS)
brew install stripe/stripe-cli/stripe

# Log in once (opens browser)
stripe login

# Forward Checkout events to Django (keep this terminal open)
stripe listen --forward-to localhost:8000/api/payments/stripe/webhook/
```

The CLI prints a signing secret like `whsec_...`. Put it in `backend/.env`:

```dotenv
STRIPE_WEBHOOK_SECRET=whsec_...
```

Restart Django so it picks up the secret. Then run a test payment again — you should see `checkout.session.completed` in the CLI and the order confirm via webhook **and/or** the confirm API.

Optional one-shot event (with API already running and `STRIPE_WEBHOOK_SECRET` set from `stripe listen`):

```bash
stripe trigger checkout.session.completed
```

### 3) Production / deployed backend

1. Deploy the API to a public HTTPS host (e.g. Render, Railway).
2. Stripe Dashboard → **Developers → Webhooks → Add endpoint**:
   - URL: `https://YOUR_API_HOST/api/payments/stripe/webhook/`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
3. Copy the endpoint **Signing secret** into production env as `STRIPE_WEBHOOK_SECRET`.
4. Set `FRONTEND_URL` to the deployed storefront so Checkout success/cancel URLs are correct.

### Endpoints reference

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/payments/stripe/config/` | Publishable key + currency for the SPA |
| POST | `/api/payments/stripe/confirm/` | Confirm paid session after redirect (local-friendly) |
| POST | `/api/payments/stripe/webhook/` | Signed Stripe webhooks |
| GET | `/api/orders/<id>/invoice/?email=…` | Download PDF invoice (guest email or owner/session) |

## Troubleshooting

**`The database name '...' is longer than PostgreSQL's limit of 63 characters`**
Your `DATABASE_URL` value is malformed, usually a doubled `DATABASE_URL=` prefix in `.env`, or a stale `DATABASE_URL` set in your shell. Run `echo $DATABASE_URL` and `unset` it if needed.

**`password authentication failed` / `database does not exist`**
Create the PostgreSQL user and database as shown in step 4 of the backend setup.

**Stripe order stays `pending` after paying**
Open the confirmation URL with `session_id` so the confirm API runs, or start `stripe listen` with a matching `STRIPE_WEBHOOK_SECRET` and pay again. Stripe Dashboard webhooks never reach bare `localhost`.

**Webhook returns `Invalid signature`**
`STRIPE_WEBHOOK_SECRET` must be the secret from the **same** `stripe listen` process (or the Dashboard endpoint), and Django must be restarted after changing `.env`.

## License

Add a license of your choice here.
