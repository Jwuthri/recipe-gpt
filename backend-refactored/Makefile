# Recipe GPT Backend Makefile

.PHONY: help install dev test test-unit test-integration test-performance test-mocked test-cov test-smoke test-quick lint format clean run run-prod

# Default target
help: ## Show available commands
	@echo "🍳 Recipe GPT Backend - Available Commands:"
	@echo "=========================================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Installation and setup
install: ## Install dependencies
	pip install -r requirements.txt

# Development
dev: ## Run development server with hot reload
	uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Testing - All test types
test: ## Run all tests
	python tests/run_tests.py all

test-unit: ## Run unit tests only (fast)
	python tests/run_tests.py unit

test-integration: ## Run integration tests (real API calls)
	python tests/run_tests.py integration

test-performance: ## Run performance tests
	python tests/run_tests.py performance

test-mocked: ## Run mocked tests (no real API calls)
	pytest tests/test_api_mocked.py -v

test-cov: ## Run tests with coverage report
	python tests/run_tests.py coverage

test-smoke: ## Run smoke tests (basic functionality)
	python tests/run_tests.py smoke

test-quick: ## Run quick tests (unit + mocked)
	python tests/run_tests.py quick

# Alternative test commands using pytest directly
pytest-all: ## Run all tests with pytest
	pytest tests/ -v

pytest-unit: ## Run unit tests with pytest
	pytest tests/test_models.py tests/test_api_mocked.py -v

pytest-integration: ## Run integration tests with pytest
	pytest tests/test_api_integration.py -v

pytest-performance: ## Run performance tests with pytest
	pytest tests/test_api_performance.py -v

# Code quality
lint: ## Run linting (flake8 + mypy)
	flake8 src tests
	mypy src

format: ## Format code with black
	black src tests

# Database
db-init: ## Initialize database (create tables)
	python -c "from src.core.database import create_tables; create_tables()"

db-reset: ## Reset database (drop and recreate tables)
	python -c "from src.core.database import drop_tables, create_tables; drop_tables(); create_tables()"

# Cleanup
clean: ## Clean up build artifacts and cache
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/
	rm -rf dist/
	rm -rf .coverage
	rm -rf htmlcov/
	rm -rf .pytest_cache/

# Run application
run: ## Run production server
	uvicorn src.main:app --host 0.0.0.0 --port 8000

run-prod: ## Run production server with gunicorn
	gunicorn src.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Development workflow shortcuts
quick-check: ## Quick development check (format + lint + quick tests)
	@echo "🔧 Formatting code..."
	black src tests
	@echo "🔍 Linting code..."
	flake8 src tests --count --statistics
	@echo "🧪 Running quick tests..."
	python tests/run_tests.py quick

full-check: ## Full development check (format + lint + all tests + coverage)
	@echo "🔧 Formatting code..."
	black src tests
	@echo "🔍 Linting code..."
	flake8 src tests --count --statistics
	@echo "🔬 Type checking..."
	mypy src
	@echo "🧪 Running all tests with coverage..."
	python tests/run_tests.py coverage

# Continuous Integration helpers
ci-install: ## Install dependencies for CI
	pip install -r requirements.txt

ci-test: ## Run tests suitable for CI
	pytest tests/ --cov=src --cov-report=xml --cov-report=term-missing

ci-lint: ## Run linting for CI
	flake8 src tests --count --statistics --exit-zero
	mypy src --no-error-summary

# Environment setup
setup-env: ## Setup development environment
	@echo "🚀 Setting up Recipe GPT Backend development environment..."
	@echo "📦 Installing dependencies..."
	pip install -r requirements.txt
	@echo "🗄️ Initializing database..."
	python -c "from src.core.database import create_tables; create_tables()"
	@echo "✅ Setup complete! Run 'make dev' to start development server." 