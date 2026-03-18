.PHONY: help install dev build start start-prod test lint lint-fix clean \
	docker-up docker-down docker-logs docker-clean \
	db-migrate db-push db-seed db-studio db-reset db-generate \
	test-db-reset setup seed-allcode seed-%

# Default target
help:
	@echo "backend_service - Available Commands"
	@echo ""
	@echo "Setup & Development:"
	@echo "  make install     - Install dependencies"
	@echo "  make dev         - Start development server (watch mode)"
	@echo "  make build       - Build for production"
	@echo "  make start       - Start app (Nest CLI)"
	@echo "  make start-prod  - Start production (node dist/main)"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up   - Start PostgreSQL and Redis containers"
	@echo "  make docker-down - Stop and remove containers"
	@echo "  make docker-logs - View container logs"
	@echo "  make docker-clean - Stop, remove containers and volumes"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate  - Run database migrations"
	@echo "  make db-push     - Push schema (no migration files)"
	@echo "  make db-seed     - Seed the database (requires db:seed script)"
	@echo ""
	@echo "Application Seeds:"
	@echo "  make seed-allcode        - Run npm run seed:allcode"
	@echo "  make seed-<name>         - Run npm run seed:<name> (ví dụ: seed-user)"
	@echo "  make db-studio   - Open Prisma Studio"
	@echo "  make db-reset    - Reset database (WARNING: deletes all data)"
	@echo "  make db-generate - Generate Prisma client"
	@echo ""
	@echo "Testing & Quality:"
	@echo "  make test        - Run tests"
	@echo "  make test-db-reset - Reset test database (TEST_DATABASE_URL)"
	@echo "  make lint        - Run linter"
	@echo "  make lint-fix    - Run linter with --fix"
	@echo ""
	@echo "Quick Start:"
	@echo "  make setup       - Full setup (docker + install + generate + migrate)"

# =============================================================================
# Setup & Development
# =============================================================================

install:
	npm install

dev:
	npm run start:dev

build:
	npm run build

start:
	npm run start

start-prod:
	npm run start:prod

# =============================================================================
# Docker
# =============================================================================

docker-up:
	docker compose up -d
	@echo ""
	@echo "Services started:"
	@echo "  PostgreSQL: localhost:5432 (ai_food_db)"
	@echo "  Redis:      localhost:6379 (password: 123456)"
	@echo ""
	@echo "Waiting for PostgreSQL to be ready..."
	@sleep 3
	@docker compose exec -T postgres pg_isready -U postgres || (echo "Waiting a bit more..." && sleep 5)
	@echo "PostgreSQL is ready!"

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f

docker-clean:
	docker compose down -v --remove-orphans

# =============================================================================
# Database
# =============================================================================

db-migrate:
	npx prisma migrate dev

db-push:
	npx prisma db push

db-seed:
	npm run db:seed

db-studio:
	npx prisma studio

db-reset:
	@echo "WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	npx prisma migrate reset --force

db-generate:
	npx prisma generate

# =============================================================================
# Application Seeds (AllCode, User, ...)
# =============================================================================

seed-allcode:
	npm run seed:allcode

# Generic seed target: `make seed-<name>` -> `npm run seed:<name>`
seed-%:
	npm run seed:$*

# =============================================================================
# Testing & Quality
# =============================================================================

test:
	npm run test

# Reset test DB: set TEST_DATABASE_URL in env or use default (ai_food_db_test)
test-db-reset:
	@echo "Resetting test database..."
	@url="$${TEST_DATABASE_URL:-postgresql://postgres:123456@localhost:5432/ai_food_db_test}"; \
	DATABASE_URL="$$url" npx prisma db push --force-reset --skip-generate
	@echo "Test database reset complete!"

lint:
	npm run lint

lint-fix:
	npm run lint

# =============================================================================
# Quick Setup
# =============================================================================

setup: docker-up install db-generate db-migrate
	@echo ""
	@echo "========================================="
	@echo "Setup complete! Run 'make dev' to start."
	@echo "========================================="

# =============================================================================
# Cleanup
# =============================================================================

clean:
	rm -rf node_modules dist coverage
