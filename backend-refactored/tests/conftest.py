"""Pytest configuration and fixtures."""

import pytest
import tempfile
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.main import app
from src.models.base import Base
from src.core.database import get_db


# Create a temporary database file for tests
temp_db = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
TEST_DATABASE_URL = f"sqlite:///{temp_db.name}"

# Create test engine 
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# Test session maker
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def override_get_db():
    """Override database session for testing."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Create tables once for all tests
@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Set up test database for the entire session."""
    # Create tables
    Base.metadata.create_all(bind=test_engine)
    yield
    # Clean up - close the temp file and delete it
    temp_db.close()
    os.unlink(temp_db.name)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        
    # Clean up data after each test
    cleanup_db = TestingSessionLocal()
    try:
        # Delete all data from tables (in reverse order due to foreign keys)
        for table in reversed(Base.metadata.sorted_tables):
            cleanup_db.execute(table.delete())
        cleanup_db.commit()
    finally:
        cleanup_db.close()


@pytest.fixture(scope="function")
def client():
    """Create a test client with overridden database."""
    # Override the get_db dependency
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Clean up
    app.dependency_overrides.clear()
    
    # Clean up data after test
    cleanup_db = TestingSessionLocal()
    try:
        # Delete all data from tables
        for table in reversed(Base.metadata.sorted_tables):
            cleanup_db.execute(table.delete())
        cleanup_db.commit()
    finally:
        cleanup_db.close()


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "device_id": "test-device-123",
        "username": "test_user",
        "email": "test@example.com"
    } 