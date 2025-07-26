#!/usr/bin/env python3
"""
Test runner script for Recipe GPT Backend
Usage: python tests/run_tests.py [test_type]
"""

import sys
import subprocess
import argparse
from pathlib import Path


def run_command(cmd, description):
    """Run a command and print results."""
    print(f"\n🧪 {description}")
    print("=" * 50)
    
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed: {e}")
        print("STDOUT:", e.stdout)
        print("STDERR:", e.stderr)
        return False


def run_unit_tests():
    """Run unit tests only."""
    return run_command(
        "pytest tests/test_models.py tests/test_api_mocked.py -v",
        "Running Unit Tests (Fast)"
    )


def run_integration_tests():
    """Run integration tests."""
    return run_command(
        "pytest tests/test_api_integration.py -v",
        "Running Integration Tests (Real API Calls)"
    )


def run_performance_tests():
    """Run performance tests."""
    return run_command(
        "pytest tests/test_api_performance.py -v",
        "Running Performance Tests"
    )


def run_all_tests():
    """Run all tests."""
    return run_command(
        "pytest tests/ -v",
        "Running All Tests"
    )


def run_coverage_tests():
    """Run tests with detailed coverage report."""
    return run_command(
        "pytest tests/ --cov=src --cov-report=html --cov-report=term-missing --cov-fail-under=80",
        "Running Tests with Coverage Analysis"
    )


def run_quick_tests():
    """Run quick tests (unit + mocked only)."""
    return run_command(
        "pytest tests/test_models.py tests/test_api_mocked.py -x -v",
        "Running Quick Tests (Unit + Mocked)"
    )


def run_smoke_tests():
    """Run smoke tests (basic functionality)."""
    return run_command(
        "pytest tests/test_api_integration.py::TestUserEndpoints::test_create_user_success "
        "tests/test_api_integration.py::TestSessionEndpoints::test_create_session_success "
        "tests/test_api_integration.py::TestChatEndpoints::test_chat_simple_message -v",
        "Running Smoke Tests (Basic Functionality)"
    )


def main():
    """Main test runner."""
    parser = argparse.ArgumentParser(description="Recipe GPT Backend Test Runner")
    parser.add_argument(
        'test_type',
        nargs='?',
        default='quick',
        choices=[
            'unit', 'integration', 'performance', 'all', 
            'coverage', 'quick', 'smoke'
        ],
        help='Type of tests to run (default: quick)'
    )
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    print("🚀 Recipe GPT Backend Test Runner")
    print(f"📊 Running: {args.test_type} tests")
    
    # Ensure we're in the right directory
    project_root = Path(__file__).parent.parent
    subprocess.run(f"cd {project_root}", shell=True)
    
    # Test type mapping
    test_functions = {
        'unit': run_unit_tests,
        'integration': run_integration_tests,
        'performance': run_performance_tests,
        'all': run_all_tests,
        'coverage': run_coverage_tests,
        'quick': run_quick_tests,
        'smoke': run_smoke_tests
    }
    
    # Run the selected tests
    success = test_functions[args.test_type]()
    
    if success:
        print("\n✅ Tests completed successfully!")
        
        if args.test_type == 'coverage':
            print("\n📊 Coverage report generated:")
            print("  - Terminal: see output above")
            print("  - HTML: open htmlcov/index.html in browser")
    else:
        print("\n❌ Tests failed!")
        sys.exit(1)


if __name__ == "__main__":
    main() 