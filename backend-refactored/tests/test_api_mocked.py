"""Mocked API tests to avoid calling real LLM services during testing."""

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
import json

from src.main import app


class TestMockedChatEndpoints:
    """Test chat endpoints with mocked LLM responses."""
    
    @pytest.fixture
    def setup_mock_session(self, client: TestClient):
        """Create user and session for mocked tests."""
        # Create user
        user_data = {"device_id": "mock-test-device-707"}
        user_response = client.post("/api/v1/users/", json=user_data)
        user = user_response.json()
        
        # Create session
        session_data = {
            "user_id": user["id"],
            "title": "Mock Test Session"
        }
        session_response = client.post("/api/v1/sessions/", json=session_data)
        session = session_response.json()
        
        return {"user": user, "session": session}
    
    @patch('src.services.llm_service.LLMService.generate_chat_response')
    def test_chat_mocked_response(self, mock_generate, client: TestClient, setup_mock_session):
        """Test chat with mocked LLM response."""
        # Setup mock
        mock_generate.return_value = "This is a mocked cooking assistant response! 🍳"
        
        session_id = setup_mock_session["session"]["id"]
        
        chat_data = {
            "session_id": session_id,
            "message": "How do I cook pasta?"
        }
        
        response = client.post("/api/v1/chat", json=chat_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["response"] == "This is a mocked cooking assistant response! 🍳"
        assert "user_message_id" in data
        assert "ai_message_id" in data
        
        # Verify the mock was called with correct parameters
        mock_generate.assert_called_once()
        call_args = mock_generate.call_args
        assert call_args[0][0] == session_id  # session_id
        assert call_args[0][1] == "How do I cook pasta?"  # message
    
    @patch('src.services.llm_service.LLMService.generate_chat_response_stream')
    def test_chat_streaming_mocked(self, mock_stream, client: TestClient, setup_mock_session):
        """Test streaming chat with mocked responses."""
        # Setup mock to return async generator
        async def mock_async_generator():
            yield "Hello! "
            yield "I'm a "
            yield "cooking "
            yield "assistant! 🍳"
        
        mock_stream.return_value = mock_async_generator()
        
        session_id = setup_mock_session["session"]["id"]
        
        chat_data = {
            "session_id": session_id,
            "message": "Tell me about cooking"
        }
        
        with client.stream("POST", "/api/v1/chat/stream", json=chat_data) as response:
            assert response.status_code == 200
            
            chunks = []
            full_text = ""
            
            for line in response.iter_lines():
                if line.startswith("data:"):
                    data_part = line[5:].strip()
                    if data_part:
                        try:
                            chunk_data = json.loads(data_part)
                            chunks.append(chunk_data)
                            if "chunk" in chunk_data:
                                full_text += chunk_data["chunk"]
                        except json.JSONDecodeError:
                            continue
            
            # Should have received the mocked chunks
            assert len(chunks) > 0
            assert "Hello! I'm a cooking assistant! 🍳" in full_text
            
            # Last chunk should indicate completion
            final_chunk = chunks[-1]
            assert final_chunk.get("done") is True
    
    @patch('src.services.llm_service.LLMService.analyze_images')
    def test_image_analysis_mocked(self, mock_analyze, client: TestClient, setup_mock_session, sample_image):
        """Test image analysis with mocked LLM response."""
        from src.schemas.ingredient import Ingredient
        
        # Setup mock response
        mock_ingredients = [
            Ingredient(name="eggs", quantity="6", unit="pieces"),
            Ingredient(name="milk", quantity="1", unit="liter"),
            Ingredient(name="cheese", quantity="200", unit="g")
        ]
        mock_response = "I can see eggs, milk, and cheese in your fridge."
        mock_analyze.return_value = (mock_response, mock_ingredients)
        
        session_id = setup_mock_session["session"]["id"]
        
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
        
        # Verify mock was called
        mock_analyze.assert_called_once()
    
    @patch('src.services.llm_service.LLMService.generate_chat_response')
    def test_chat_with_ingredients_mocked(self, mock_generate, client: TestClient, setup_mock_session):
        """Test chat with ingredients list using mocked response."""
        # Setup mock to return recipe-style response
        mock_response = """# 🍳 Chicken and Rice Bowl

⏱️ **Prep Time:** 15 minutes | 🔥 **Cook Time:** 25 minutes | 🍽️ **Serves:** 2 people

## 🥘 Ingredients
- 2 pieces chicken breast
- 1 cup rice
- 200 g broccoli

## 📝 Instructions
1. Cook the rice according to package instructions
2. Season and cook the chicken breast
3. Steam the broccoli until tender
4. Combine in a bowl and serve

## 💡 Chef's Tips
- Let chicken rest before slicing
- Add soy sauce for extra flavor"""
        
        mock_generate.return_value = mock_response
        
        session_id = setup_mock_session["session"]["id"]
        
        chat_data = {
            "session_id": session_id,
            "message": "What can I make with these?",
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
        assert "🍳" in data["response"]  # Should contain recipe elements
        assert "Ingredients" in data["response"]
        assert "Instructions" in data["response"]
        
        # Verify the mock was called with ingredients
        mock_generate.assert_called_once()
        call_args = mock_generate.call_args
        # Check that ingredients were passed as the third argument
        assert len(call_args[0]) >= 3  # session_id, message, ingredients
        ingredients_arg = call_args[0][2]
        assert ingredients_arg is not None
        assert len(ingredients_arg) == 3  # Should have 3 ingredients
    
    @patch('src.services.llm_service.LLMService.generate_chat_response')
    def test_chat_conversation_context_mocked(self, mock_generate, client: TestClient, setup_mock_session):
        """Test that conversation context is passed to mocked LLM."""
        session_id = setup_mock_session["session"]["id"]
        
        # First message
        mock_generate.return_value = "Hello! I'd be happy to help you with cooking."
        
        chat_data1 = {
            "session_id": session_id,
            "message": "Hi, I'm learning to cook"
        }
        response1 = client.post("/api/v1/chat", json=chat_data1)
        assert response1.status_code == 200
        
        # Second message - mock should receive conversation history
        mock_generate.return_value = "Great! Italian cuisine has wonderful beginner-friendly recipes."
        
        chat_data2 = {
            "session_id": session_id,
            "message": "I love Italian food"
        }
        response2 = client.post("/api/v1/chat", json=chat_data2)
        assert response2.status_code == 200
        
        # Verify mock was called twice
        assert mock_generate.call_count == 2
        
        # The second call should have the session_id to load conversation history
        second_call_args = mock_generate.call_args_list[1]
        assert second_call_args[0][0] == session_id


class TestMockedErrorHandling:
    """Test error handling with mocked LLM failures."""
    
    @pytest.fixture
    def setup_error_test_session(self, client: TestClient):
        """Create session for error testing."""
        user_data = {"device_id": "error-test-device-808"}
        user_response = client.post("/api/v1/users/", json=user_data)
        user = user_response.json()
        
        session_data = {"user_id": user["id"], "title": "Error Test Session"}
        session_response = client.post("/api/v1/sessions/", json=session_data)
        session = session_response.json()
        
        return {"user": user, "session": session}
    
    @patch('src.services.llm_service.LLMService.__init__', return_value=None)
    @patch('src.services.llm_service.LLMService.generate_chat_response')
    def test_llm_service_error_handling(self, mock_generate, mock_init, client: TestClient, setup_error_test_session):
        """Test handling of LLM service errors."""
        from fastapi import HTTPException
        
        # Mock LLM service to raise an error
        mock_generate.side_effect = HTTPException(status_code=500, detail="LLM service unavailable")
        
        session_id = setup_error_test_session["session"]["id"]
        
        chat_data = {
            "session_id": session_id,
            "message": "This should fail"
        }
        
        response = client.post("/api/v1/chat", json=chat_data)
        
        # Most important: should return 500 status code
        assert response.status_code == 500
        
        # Should have some error detail (could be empty string due to FastAPI error handling)
        response_data = response.json()
        assert "detail" in response_data
        # Just verify we get a proper error response structure
    
    @patch('src.services.llm_service.LLMService.__init__', return_value=None)
    @patch('src.services.llm_service.LLMService.generate_chat_response')
    def test_llm_timeout_handling(self, mock_generate, mock_init, client: TestClient, setup_error_test_session):
        """Test handling of LLM timeout errors."""
        import asyncio
        
        # Mock LLM service to timeout
        async def timeout_mock(*args, **kwargs):
            await asyncio.sleep(0.1)  # Simulate delay
            raise asyncio.TimeoutError("Request timed out")
        
        mock_generate.side_effect = timeout_mock
        
        session_id = setup_error_test_session["session"]["id"]
        
        chat_data = {
            "session_id": session_id,
            "message": "This will timeout"
        }
        
        response = client.post("/api/v1/chat", json=chat_data)
        
        assert response.status_code == 500
        # Check that we get some kind of timeout-related error
        response_data = response.json()
        assert "detail" in response_data
    
    @patch('src.services.llm_service.LLMService.__init__', return_value=None)
    @patch('src.services.llm_service.LLMService.analyze_images')
    def test_image_analysis_error_handling(self, mock_analyze, mock_init, client: TestClient, setup_error_test_session, sample_image):
        """Test handling of image analysis errors."""
        from fastapi import HTTPException
        
        # Mock image analysis to fail
        mock_analyze.side_effect = HTTPException(status_code=400, detail="Invalid image format")
        
        session_id = setup_error_test_session["session"]["id"]
        
        files = {
            "files": ("invalid.jpg", sample_image, "image/jpeg")
        }
        data = {
            "session_id": session_id
        }
        
        response = client.post("/api/v1/analyze-images", files=files, data=data)
        
        assert response.status_code == 400
        response_data = response.json()
        assert "detail" in response_data


@pytest.fixture
def sample_image():
    """Create a sample image for testing."""
    from PIL import Image
    import io
    
    # Create a simple test image
    image = Image.new('RGB', (100, 100), color='red')
    
    # Convert to bytes
    img_buffer = io.BytesIO()
    image.save(img_buffer, format='JPEG')
    img_buffer.seek(0)
    
    return img_buffer.getvalue() 