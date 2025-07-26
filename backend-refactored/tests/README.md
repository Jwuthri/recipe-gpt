# 🧪 Recipe GPT Backend Tests

Comprehensive test suite for the Recipe GPT Backend API endpoints.

## 📁 Test Structure

```
tests/
├── __init__.py                  # Test package initialization
├── conftest.py                  # Pytest configuration and fixtures
├── test_models.py               # Unit tests for database models
├── test_api_integration.py      # End-to-end integration tests
├── test_api_performance.py      # Performance and load tests
├── test_api_mocked.py          # Mocked tests (no real API calls)
├── run_tests.py                # Test runner script
├── pytest.ini                 # Pytest configuration
└── README.md                   # This file
```

## 🚀 Quick Start

### Run All Tests
```bash
make test
# or
python tests/run_tests.py all
```

### Run Quick Tests (Unit + Mocked)
```bash
make test-quick
# or 
python tests/run_tests.py quick
```

### Run with Coverage
```bash
make test-cov
# or
python tests/run_tests.py coverage
```

## 📊 Test Categories

### 1. Unit Tests (`test_models.py`)
- **Fast execution** ⚡
- Test database models in isolation
- Test model relationships and methods
- No external dependencies

### 2. Integration Tests (`test_api_integration.py`)
- **Real API calls** 🌐
- End-to-end testing of all endpoints
- Tests complete user journeys
- Requires real LLM API (may be slow/expensive)

### 3. Performance Tests (`test_api_performance.py`)
- **Load testing** 🔧
- Response time validation
- Concurrent request handling
- API stability under load

### 4. Mocked Tests (`test_api_mocked.py`)
- **Fast + Isolated** 🎭
- No real LLM API calls
- Test error handling scenarios
- Safe for CI/CD pipelines

## 🎯 Test Coverage

### User Management
- ✅ User creation and retrieval
- ✅ Duplicate device ID handling
- ✅ User not found scenarios

### Session Management  
- ✅ Session creation with system messages
- ✅ Session retrieval and listing
- ✅ Invalid session handling

### Chat Functionality
- ✅ Basic chat interactions
- ✅ Chat with ingredients lists
- ✅ Recipe requests and responses
- ✅ Streaming chat responses
- ✅ Conversation history continuity

### Image Analysis
- ✅ Single and multiple image analysis
- ✅ Image format validation
- ✅ Ingredient extraction from images

### Complete User Journeys
- ✅ Signup → Session → Chat → Image Analysis
- ✅ Error handling and edge cases
- ✅ Performance benchmarks

## 🛠 Test Runner Usage

The `run_tests.py` script provides different test execution modes:

```bash
# Quick tests (unit + mocked)
python tests/run_tests.py quick

# Integration tests (real API calls)
python tests/run_tests.py integration

# Performance tests
python tests/run_tests.py performance  

# Smoke tests (basic functionality)
python tests/run_tests.py smoke

# All tests
python tests/run_tests.py all

# Tests with coverage report
python tests/run_tests.py coverage
```

## 🔧 Makefile Commands

```bash
make test-unit          # Unit tests only
make test-integration   # Integration tests  
make test-performance   # Performance tests
make test-mocked       # Mocked tests
make test-quick        # Quick tests (unit + mocked)
make test-smoke        # Smoke tests
make test-cov          # Tests with coverage
make test              # All tests
```

## 📈 Performance Benchmarks

The performance tests validate:
- User creation: < 1 second
- Session creation: < 2 seconds  
- Chat responses: < 10 seconds
- Concurrent operations: < 5 seconds for 5 users
- Conversation scaling: No degradation with history

## 🚨 CI/CD Integration

For continuous integration, use:

```bash
# Install dependencies
make ci-install

# Run tests suitable for CI (no real API calls)
make ci-test

# Run linting
make ci-lint
```

## 📝 Writing New Tests

### Adding Unit Tests
Add to `test_models.py` for database model tests.

### Adding Integration Tests  
Add to `test_api_integration.py` for end-to-end API testing.

### Adding Mocked Tests
Add to `test_api_mocked.py` for isolated testing with mocks.

### Test Fixtures
Common fixtures are in `conftest.py`:
- `client`: FastAPI test client
- `db_session`: Isolated database session
- `sample_user_data`: Test user data

### Example Test
```python
def test_new_feature(client: TestClient):
    """Test description."""
    # Arrange
    data = {"key": "value"}
    
    # Act  
    response = client.post("/api/v1/endpoint", json=data)
    
    # Assert
    assert response.status_code == 200
    assert response.json()["success"] is True
```

## 🎭 Mock Patterns

Use the mock patterns from `test_api_mocked.py`:

```python
@patch('src.services.llm_service.LLMService.generate_chat_response')
def test_feature(mock_llm, client: TestClient):
    mock_llm.return_value = "Mocked response"
    # Test logic here
```

## 📊 Coverage Reports

Coverage reports are generated in:
- **Terminal**: Displayed after `make test-cov`
- **HTML**: `htmlcov/index.html` (open in browser)

Target coverage: **80%+** 🎯 