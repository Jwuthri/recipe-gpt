"""End-to-end integration tests for all API endpoints."""

import pytest
import json
import base64
import io
from PIL import Image
from fastapi.testclient import TestClient

from src.main import app


class TestUserEndpoints:
    """Test user management endpoints."""
    
    def test_create_user_success(self, client: TestClient):
        """Test successful user creation."""
        user_data = {
            "device_id": "test-device-12345",
            "username": "john_doe",
            "email": "john@example.com"
        }
        
        response = client.post("/api/v1/users/", json=user_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["device_id"] == user_data["device_id"]
        assert data["username"] == user_data["username"]
        assert data["email"] == user_data["email"]
        assert "id" in data
        assert "created_at" in data
    
    def test_create_user_duplicate_device_id(self, client: TestClient):
        """Test creating user with duplicate device_id returns existing user."""
        user_data = {
            "device_id": "duplicate-device-123",
            "username": "user1",
            "email": "user1@example.com"
        }
        
        # Create user first time
        response1 = client.post("/api/v1/users/", json=user_data)
        assert response1.status_code == 200
        user1_data = response1.json()
        
        # Create user second time with same device_id
        user_data2 = {
            "device_id": "duplicate-device-123",
            "username": "user2",
            "email": "user2@example.com"
        }
        
        response2 = client.post("/api/v1/users/", json=user_data2)
        assert response2.status_code == 200
        user2_data = response2.json()
        
        # Should return the same user
        assert user1_data["id"] == user2_data["id"]
        assert user2_data["device_id"] == "duplicate-device-123"
    
    def test_get_user_success(self, client: TestClient):
        """Test retrieving user by ID."""
        # Create user first
        user_data = {
            "device_id": "get-test-device-456",
            "username": "jane_doe",
            "email": "jane@example.com"
        }
        
        create_response = client.post("/api/v1/users/", json=user_data)
        created_user = create_response.json()
        user_id = created_user["id"]
        
        # Get user by ID
        response = client.get(f"/api/v1/users/{user_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == user_id
        assert data["device_id"] == user_data["device_id"]
        assert data["username"] == user_data["username"]
        assert data["email"] == user_data["email"]
    
    def test_get_user_not_found(self, client: TestClient):
        """Test retrieving non-existent user."""
        response = client.get("/api/v1/users/99999")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


class TestSessionEndpoints:
    """Test chat session management endpoints."""
    
    def test_create_session_success(self, client: TestClient):
        """Test successful session creation with system message."""
        # Create user first
        user_data = {
            "device_id": "session-test-device-789",
            "username": "session_user"
        }
        user_response = client.post("/api/v1/users/", json=user_data)
        user = user_response.json()
        
        # Create session
        session_data = {
            "user_id": user["id"],
            "title": "My First Cooking Session",
            "session_type": "chat"
        }
        
        response = client.post("/api/v1/sessions/", json=session_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["user_id"] == user["id"]
        assert data["title"] == session_data["title"]
        assert data["session_type"] == session_data["session_type"]
        assert "id" in data
        assert "created_at" in data
    
    def test_create_session_invalid_user(self, client: TestClient):
        """Test session creation with invalid user ID."""
        session_data = {
            "user_id": 99999,
            "title": "Invalid User Session"
        }
        
        response = client.post("/api/v1/sessions/", json=session_data)
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_get_session_success(self, client: TestClient):
        """Test retrieving session by ID."""
        # Create user and session
        user_data = {"device_id": "get-session-device-101"}
        user_response = client.post("/api/v1/users/", json=user_data)
        user = user_response.json()
        
        session_data = {
            "user_id": user["id"],
            "title": "Retrievable Session"
        }
        session_response = client.post("/api/v1/sessions/", json=session_data)
        session = session_response.json()
        
        # Get session
        response = client.get(f"/api/v1/sessions/{session['id']}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == session["id"]
        assert data["title"] == session_data["title"]
        assert data["user_id"] == user["id"]
    
    def test_get_user_sessions(self, client: TestClient):
        """Test retrieving all sessions for a user."""
        # Create user
        user_data = {"device_id": "multi-session-device-202"}
        user_response = client.post("/api/v1/users/", json=user_data)
        user = user_response.json()
        
        # Create multiple sessions
        session_titles = ["Session 1", "Session 2", "Session 3"]
        created_sessions = []
        
        for title in session_titles:
            session_data = {
                "user_id": user["id"],
                "title": title
            }
            session_response = client.post("/api/v1/sessions/", json=session_data)
            created_sessions.append(session_response.json())
        
        # Get all user sessions
        response = client.get(f"/api/v1/users/{user['id']}/sessions/")
        
        assert response.status_code == 200
        sessions = response.json()
        
        assert len(sessions) == 3
        returned_titles = [s["title"] for s in sessions]
        for title in session_titles:
            assert title in returned_titles


class TestChatEndpoints:
    """Test chat interaction endpoints."""
    
    @pytest.fixture
    def setup_chat_session(self, client: TestClient):
        """Create user and session for chat tests."""
        # Create user
        user_data = {"device_id": "chat-test-device-303"}
        user_response = client.post("/api/v1/users/", json=user_data)
        user = user_response.json()
        
        # Create session
        session_data = {
            "user_id": user["id"],
            "title": "Chat Test Session"
        }
        session_response = client.post("/api/v1/sessions/", json=session_data)
        session = session_response.json()
        
        return {"user": user, "session": session}
    
    def test_chat_simple_message(self, client: TestClient, setup_chat_session):
        """Test basic chat functionality."""
        session_id = setup_chat_session["session"]["id"]
        
        chat_data = {
            "session_id": session_id,
            "message": "Hello! Can you help me with cooking?"
        }
        
        response = client.post("/api/v1/chat", json=chat_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "response" in data
        assert len(data["response"]) > 0
        assert "user_message_id" in data
        assert "ai_message_id" in data
        
        # Response should be cooking-related
        response_text = data["response"].lower()
        cooking_keywords = ["cook", "recipe", "help", "assistant", "kitchen", "food"]
        assert any(keyword in response_text for keyword in cooking_keywords)
    
    def test_chat_with_ingredients(self, client: TestClient, setup_chat_session):
        """Test chat with ingredients list."""
        session_id = setup_chat_session["session"]["id"]
        
        chat_data = {
            "session_id": session_id,
            "message": "What can I make with these ingredients?",
            "ingredients": [
                {"name": "chicken breast", "quantity": "2", "unit": "pieces"},
                {"name": "rice", "quantity": "1", "unit": "cup"},
                {"name": "broccoli", "quantity": "200", "unit": "g"}
            ]
        }
        
        response = client.post("/api/v1/chat", json=chat_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "response" in data
        
        # Response should mention the ingredients
        response_text = data["response"].lower()
        assert "chicken" in response_text or "rice" in response_text or "broccoli" in response_text
    
    def test_chat_recipe_request(self, client: TestClient, setup_chat_session):
        """Test requesting a recipe."""
        session_id = setup_chat_session["session"]["id"]
        
        chat_data = {
            "session_id": session_id,
            "message": "Can you give me a recipe for pasta carbonara?"
        }
        
        response = client.post("/api/v1/chat", json=chat_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        response_text = data["response"].lower()
        
        # Should contain recipe elements
        recipe_elements = ["ingredients", "instructions", "pasta", "carbonara"]
        assert any(element in response_text for element in recipe_elements)
    
    def test_chat_streaming(self, client: TestClient, setup_chat_session):
        """Test streaming chat endpoint."""
        session_id = setup_chat_session["session"]["id"]
        
        chat_data = {
            "session_id": session_id,
            "message": "Tell me about Italian cuisine"
        }
        
        with client.stream("POST", "/api/v1/chat/stream", json=chat_data) as response:
            assert response.status_code == 200
            assert response.headers["content-type"] == "text/event-stream"
            
            chunks = []
            for line in response.iter_lines():
                if line.startswith("data:"):
                    data_part = line[5:].strip()  # Remove "data:" prefix
                    if data_part:
                        try:
                            chunk_data = json.loads(data_part)
                            chunks.append(chunk_data)
                        except json.JSONDecodeError:
                            continue
            
            # Should have received chunks and final completion
            assert len(chunks) > 0
            
            # Last chunk should indicate completion
            final_chunk = chunks[-1]
            assert final_chunk.get("done") is True
            assert "message_id" in final_chunk
    
    def test_chat_invalid_session(self, client: TestClient):
        """Test chat with invalid session ID."""
        chat_data = {
            "session_id": 99999,
            "message": "Hello"
        }
        
        response = client.post("/api/v1/chat", json=chat_data)
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_chat_conversation_continuity(self, client: TestClient, setup_chat_session):
        """Test that conversation history is maintained."""
        session_id = setup_chat_session["session"]["id"]
        
        # First message
        chat_data1 = {
            "session_id": session_id,
            "message": "My name is Alice and I love Italian food"
        }
        response1 = client.post("/api/v1/chat", json=chat_data1)
        assert response1.status_code == 200
        
        # Second message referring to previous context
        chat_data2 = {
            "session_id": session_id,
            "message": "What's my name and what cuisine do I like?"
        }
        response2 = client.post("/api/v1/chat", json=chat_data2)
        assert response2.status_code == 200
        
        # Should remember Alice and Italian food
        response_text = response2.json()["response"].lower()
        assert "alice" in response_text
        assert "italian" in response_text or "italy" in response_text


class TestImageEndpoints:
    """Test image analysis endpoints."""
    
    @pytest.fixture
    def setup_image_session(self, client: TestClient):
        """Create user and session for image tests."""
        # Create user
        user_data = {"device_id": "image-test-device-404"}
        user_response = client.post("/api/v1/users/", json=user_data)
        user = user_response.json()
        
        # Create session
        session_data = {
            "user_id": user["id"],
            "title": "Image Analysis Session"
        }
        session_response = client.post("/api/v1/sessions/", json=session_data)
        session = session_response.json()
        
        return {"user": user, "session": session}
    
    @pytest.fixture
    def sample_image(self):
        """Create a sample image for testing."""
        # Create a simple test image
        image = Image.new('RGB', (100, 100), color='red')
        
        # Add some text to make it look like a fridge photo
        try:
            from PIL import ImageDraw, ImageFont
            draw = ImageDraw.Draw(image)
            draw.text((10, 10), "FRIDGE", fill='white')
            draw.rectangle([20, 30, 80, 50], fill='green', outline='black')  # Mock vegetable
            draw.rectangle([20, 60, 80, 80], fill='yellow', outline='black')  # Mock item
        except:
            pass  # If fonts not available, just use basic image
        
        # Convert to bytes
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='JPEG')
        img_buffer.seek(0)
        
        return img_buffer.getvalue()
    
    def test_analyze_images_success(self, client: TestClient, setup_image_session, sample_image):
        """Test successful image analysis."""
        session_id = setup_image_session["session"]["id"]
        
        # Prepare form data
        files = {
            "files": ("test_fridge.jpg", sample_image, "image/jpeg")
        }
        data = {
            "session_id": session_id
        }
        
        response = client.post("/api/v1/analyze-images", files=files, data=data)
        
        assert response.status_code == 200
        response_data = response.json()
        
        assert response_data["success"] is True
        assert "ingredients" in response_data
        assert "message" in response_data
        assert isinstance(response_data["ingredients"], list)
    
    def test_analyze_multiple_images(self, client: TestClient, setup_image_session, sample_image):
        """Test analyzing multiple images."""
        session_id = setup_image_session["session"]["id"]
        
        # Create second image
        image2 = Image.new('RGB', (100, 100), color='blue')
        img_buffer2 = io.BytesIO()
        image2.save(img_buffer2, format='JPEG')
        img_buffer2.seek(0)
        sample_image2 = img_buffer2.getvalue()
        
        # Prepare form data with multiple files
        files = [
            ("files", ("fridge1.jpg", sample_image, "image/jpeg")),
            ("files", ("fridge2.jpg", sample_image2, "image/jpeg"))
        ]
        data = {
            "session_id": session_id
        }
        
        response = client.post("/api/v1/analyze-images", files=files, data=data)
        
        assert response.status_code == 200
        response_data = response.json()
        
        assert response_data["success"] is True
        assert "ingredients" in response_data
    
    def test_analyze_images_no_files(self, client: TestClient, setup_image_session):
        """Test image analysis with no files."""
        session_id = setup_image_session["session"]["id"]
        
        data = {
            "session_id": session_id
        }
        
        response = client.post("/api/v1/analyze-images", data=data)
        
        assert response.status_code == 422  # Validation error for missing files
    
    def test_analyze_images_invalid_session(self, client: TestClient, sample_image):
        """Test image analysis with invalid session."""
        files = {
            "files": ("test.jpg", sample_image, "image/jpeg")
        }
        data = {
            "session_id": 99999
        }
        
        response = client.post("/api/v1/analyze-images", files=files, data=data)
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


class TestFullUserJourney:
    """Test complete user journey from signup to chat."""
    
    def test_complete_user_flow(self, client: TestClient, sample_image):
        """Test complete flow: user creation -> session -> chat -> image analysis."""
        
        # 1. Create user
        user_data = {
            "device_id": "journey-device-505",
            "username": "journey_user",
            "email": "journey@example.com"
        }
        user_response = client.post("/api/v1/users/", json=user_data)
        assert user_response.status_code == 200
        user = user_response.json()
        
        # 2. Create session
        session_data = {
            "user_id": user["id"],
            "title": "My Cooking Journey"
        }
        session_response = client.post("/api/v1/sessions/", json=session_data)
        assert session_response.status_code == 200
        session = session_response.json()
        
        # 3. Start chat conversation
        chat_data1 = {
            "session_id": session["id"],
            "message": "Hi! I'm new to cooking. Can you help me?"
        }
        chat_response1 = client.post("/api/v1/chat", json=chat_data1)
        assert chat_response1.status_code == 200
        assert chat_response1.json()["success"] is True
        
        # 4. Ask for recipe recommendations
        chat_data2 = {
            "session_id": session["id"],
            "message": "What are some easy recipes for beginners?"
        }
        chat_response2 = client.post("/api/v1/chat", json=chat_data2)
        assert chat_response2.status_code == 200
        
        # 5. Analyze fridge image
        files = {
            "files": ("my_fridge.jpg", sample_image, "image/jpeg")
        }
        data = {
            "session_id": session["id"]
        }
        image_response = client.post("/api/v1/analyze-images", files=files, data=data)
        assert image_response.status_code == 200
        
        # 6. Continue chat about the ingredients found
        chat_data3 = {
            "session_id": session["id"],
            "message": "Based on the ingredients you found, what can I cook?"
        }
        chat_response3 = client.post("/api/v1/chat", json=chat_data3)
        assert chat_response3.status_code == 200
        
        # 7. Verify session has all messages
        session_detail = client.get(f"/api/v1/sessions/{session['id']}")
        assert session_detail.status_code == 200
        
        # 8. Verify user sessions list
        user_sessions = client.get(f"/api/v1/users/{user['id']}/sessions/")
        assert user_sessions.status_code == 200
        assert len(user_sessions.json()) >= 1


@pytest.fixture
def sample_image():
    """Create a sample image for testing."""
    # Create a simple test image
    image = Image.new('RGB', (100, 100), color='red')
    
    # Convert to bytes
    img_buffer = io.BytesIO()
    image.save(img_buffer, format='JPEG')
    img_buffer.seek(0)
    
    return img_buffer.getvalue() 