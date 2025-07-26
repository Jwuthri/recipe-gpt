"""Unit tests for database models."""

import pytest
from datetime import datetime

from src.models.user import User
from src.models.chat_session import ChatSession
from src.models.message import Message, MessageRole, MessageType


def test_user_creation(db_session):
    """Test creating a user."""
    user = User(device_id="test-device-456", username="testuser")
    db_session.add(user)
    db_session.commit()
    
    assert user.id is not None
    assert user.device_id == "test-device-456"
    assert user.username == "testuser"
    assert isinstance(user.created_at, datetime)


def test_chat_session_creation(db_session):
    """Test creating a chat session."""
    user = User(device_id="test-device-789")
    db_session.add(user)
    db_session.commit()
    
    session = ChatSession(user_id=user.id, title="Test Session")
    db_session.add(session)
    db_session.commit()
    
    assert session.id is not None
    assert session.user_id == user.id
    assert session.title == "Test Session"
    assert session.user == user


def test_message_creation(db_session):
    """Test creating a message."""
    user = User(device_id="test-device-101")
    db_session.add(user)
    db_session.commit()
    
    session = ChatSession(user_id=user.id)
    db_session.add(session)
    db_session.commit()
    
    message = Message(
        session_id=session.id,
        content="Hello world",
        role=MessageRole.USER.value
    )
    db_session.add(message)
    db_session.commit()
    
    assert message.id is not None
    assert message.session_id == session.id
    assert message.content == "Hello world"
    assert message.role == MessageRole.USER.value
    assert message.session == session


def test_message_with_images(db_session):
    """Test message with image metadata."""
    user = User(device_id="test-device-123")
    db_session.add(user)
    db_session.commit()
    
    session = ChatSession(user_id=user.id)
    db_session.add(session)
    db_session.commit()
    
    image_metadata = {
        "images": [
            {
                "filename": "test.jpg",
                "content_type": "image/jpeg",
                "data": "base64data"
            }
        ]
    }
    
    message = Message(
        session_id=session.id,
        content="Please analyze this image",
        role=MessageRole.USER.value,
        message_type=MessageType.IMAGE.value,
        message_metadata=image_metadata
    )
    db_session.add(message)
    db_session.commit()
    
    assert message.has_images is True
    assert len(message.get_images()) == 1
    assert message.get_images()[0]["data"] == "base64data"


def test_model_relationships(db_session):
    """Test relationships between models."""
    user = User(device_id="test-device-999")
    db_session.add(user)
    db_session.commit()
    
    session1 = ChatSession(user_id=user.id, title="Session 1")
    session2 = ChatSession(user_id=user.id, title="Session 2")
    db_session.add_all([session1, session2])
    db_session.commit()
    
    message1 = Message(
        session_id=session1.id,
        content="Message 1",
        role=MessageRole.USER.value
    )
    message2 = Message(
        session_id=session1.id,
        content="Message 2",
        role=MessageRole.ASSISTANT.value
    )
    db_session.add_all([message1, message2])
    db_session.commit()
    
    # Test user has sessions
    assert len(user.sessions) == 2
    
    # Test session has messages
    assert len(session1.messages) == 2
    assert len(session2.messages) == 0
    
    # Test message belongs to session
    assert message1.session == session1
    assert message2.session == session1 