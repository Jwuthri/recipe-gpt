#!/bin/bash

# Recipe GPT Backend - Development Runner
# Usage: ./run.sh [command]

set -e

# Default values
COMMAND=${1:-"run"}

case "$COMMAND" in
    "install")
        echo "🔧 Installing dependencies..."
        pip install -r requirements.txt
        ;;
    "dev")
        echo "🔧 Installing for development..."
        pip install -e .
        ;;
    "test")
        echo "🧪 Running tests..."
        pytest tests/ -v
        ;;
    "test-cov")
        echo "🧪 Running tests with coverage..."
        pytest tests/ -v --cov=src --cov-report=html --cov-report=term
        ;;
    "lint")
        echo "🔍 Running linting..."
        flake8 src tests
        mypy src
        ;;
    "format")
        echo "🎨 Formatting code..."
        black src tests
        isort src tests
        ;;
    "run")
        echo "🚀 Starting development server..."
        uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
        ;;
    "clean")
        echo "🧹 Cleaning cache files..."
        find . -type f -name "*.pyc" -delete
        find . -type d -name "__pycache__" -delete
        find . -type d -name "*.egg-info" -exec rm -rf {} + || true
        rm -rf .coverage htmlcov/ .pytest_cache/
        ;;
    *)
        echo "Usage: $0 {install|dev|test|test-cov|lint|format|run|clean}"
        echo ""
        echo "Commands:"
        echo "  install    - Install dependencies"
        echo "  dev        - Install for development"
        echo "  test       - Run tests"
        echo "  test-cov   - Run tests with coverage"
        echo "  lint       - Run linting"
        echo "  format     - Format code"
        echo "  run        - Start development server"
        echo "  clean      - Clean cache files"
        exit 1
        ;;
esac

echo "✅ Done!" 