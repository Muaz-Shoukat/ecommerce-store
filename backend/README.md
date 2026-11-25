# Stationery Store: Backend Setup

## Prerequisites

- Python 3.12+
- [uv](https://docs.astral.sh/uv/getting-started/installation/)
- PostgreSQL 14+

## Setup

### 1. Clone the repo and open the backend

```bash
git clone <repo-url>
cd stationery-store/backend
```

### 2. Create the virtual environment and install dependencies

```bash
uv venv
uv pip install -r requirements.txt
```

### 3. Configure environment variables with proper values


### 5. Run migrations

```bash
uv run python manage.py migrate
```

### 6. (Optional) Seed sample products

```bash
uv run python manage.py seed_products
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