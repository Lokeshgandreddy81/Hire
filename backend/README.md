# Hire App Backend

Production-ready FastAPI backend for the Hire App.

## Quick Start

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose (for containerized deployment)

---

## Local Development

### 1. Setup Environment
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your local settings
```

### 2. Start PostgreSQL
```bash
# Using Docker
docker run -d \
  --name hireapp-postgres \
  -e POSTGRES_DB=hireapp \
  -e POSTGRES_USER=hireapp_user \
  -e POSTGRES_PASSWORD=localdev123 \
  -p 5432:5432 \
  postgres:15-alpine
```

### 3. Run Migrations
```bash
alembic upgrade head
```

### 4. Seed Database (Optional)
```bash
python scripts/seed.py
```

### 5. Start Development Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Verify
- Health: http://localhost:8000/health
- Readiness: http://localhost:8000/ready
- API Docs: http://localhost:8000/docs

---

## Production Deployment

### Using Docker Compose

```bash
# Create production .env file
cp .env.example .env

# Generate secure secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
# Add this to .env as SECURITY_SECRET_KEY

# Set production environment
# ENVIRONMENT=production

# Set database password
# DATABASE_PASSWORD=your-secure-password

# Build and start
docker-compose up -d --build

# Run migrations
docker-compose exec app alembic upgrade head

# Check health
curl http://localhost:8000/health
curl http://localhost:8000/ready
```

### Manual Production Deployment

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export ENVIRONMENT=production
export SECURITY_SECRET_KEY=your-generated-secret-key
export DATABASE_HOST=your-db-host
export DATABASE_PASSWORD=your-db-password

# Run migrations
alembic upgrade head

# Start with Gunicorn
gunicorn app.main:app -c gunicorn.conf.py
```

---

## Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/health` | Basic liveness check - returns healthy if server is running |
| `/ready` | Readiness check - verifies database connectivity |
| `/info` | System information and configuration |

---

## Database Migrations

### Setup
```bash
pip install alembic
```

### Commands
```bash
# Apply all migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Rollback one migration
alembic downgrade -1

# Check current revision
alembic current
```

### Migration Files
- `001_initial_schema.py`: Creates all tables with basic indexes
- `002_add_missing_indexes_constraints.py`: Adds performance indexes and validation constraints

---

## API Documentation

- **Swagger UI**: `/docs` (development only)
- **ReDoc**: `/redoc` (development only)
- **OpenAPI JSON**: `/openapi.json` (development only)

---

## Environment Variables

See `.env.example` for all available configuration options.

### Required for Production
- `ENVIRONMENT=production`
- `SECURITY_SECRET_KEY` - Must be set (use `secrets.token_urlsafe(32)`)
- `DATABASE_PASSWORD` - Secure database password

---

## Architecture

```
app/
├── api/           # API routes (thin controllers)
│   ├── v1/        # API version 1 routes
│   └── dependencies/  # FastAPI dependencies
├── core/          # Core configuration
├── db/            # Database setup
├── models/        # SQLAlchemy models
├── schemas/       # Pydantic schemas
└── services/      # Business logic layer
```
