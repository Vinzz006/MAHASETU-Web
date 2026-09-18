# Contributing to MahaSetu Platform

Thank you for your interest in contributing to **MahaSetu** (Maharashtra Interoperability & Data Exchange Platform — Problem Statement 26129).

This guide outlines our development lifecycle, quality gates, and code standards to ensure production reliability for government-grade civic infrastructure.

---

## 1. Development Prerequisites

- **Python**: 3.11+ (Python 3.12 or 3.14 supported)
- **Node.js**: 20 LTS or 22+
- **Database**: SQLite (default for development/testing) or PostgreSQL 15+ (production)
- **Redis**: Optional (graceful in-memory fallback enabled by default)
- **Docker & Docker Compose**: For containerized orchestration

---

## 2. Local Environment Setup

### Backend Setup
```bash
# 1. Create and activate a virtual environment
python -m venv venv
# On Linux/macOS:
source venv/bin/activate
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Configure environment
cp .env.example .env

# 4. Run database migrations
alembic upgrade head

# 5. Start the backend development server
uvicorn backend.app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Run the Vite dev server
npm run dev
```

---

## 3. Automated Quality Verification

Every pull request must pass all automated quality checks before merging:

### Backend Tests
```bash
# Run the complete test suite (161+ tests)
python -m pytest backend/tests

# Run with verbose output
python -m pytest backend/tests -v
```

### Frontend Tests & Type Checking
```bash
cd frontend

# Run Vitest suite
npm test -- --run

# Run TypeScript compilation & production bundle check
npm run build
```

---

## 4. Database Migrations (Alembic)

MahaSetu uses **Alembic** for schema migrations. Never modify the database schema via raw SQL or un-migrated model definitions.

```bash
# Generate a new migration after editing SQLAlchemy models
alembic revision --autogenerate -m "describe_schema_change"

# Apply pending migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

---

## 5. Branching & Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new feature or endpoint
- `fix:` A bug fix
- `docs:` Documentation improvements
- `refactor:` Code improvements without functionality changes
- `test:` Adding or updating tests
- `chore:` Dependency or workflow updates

**Branch naming**:
- `feature/issue-short-name`
- `fix/issue-short-name`
- `docs/topic-name`

---

## 6. Security & Sensitive Information

- **NEVER** commit secret keys, private credentials, or live API keys to the repository.
- Use `.env` (which is excluded via `.gitignore`).
- For security vulnerability disclosures, please refer to [SECURITY.md](SECURITY.md).
