"""Performance and load tests for API endpoints."""

import pytest
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi.testclient import TestClient


class TestAPIPerformance:
    """Test API performance and response times."""
    
    @pytest.fixture
    def setup_user_and_session(self, client: TestClient):
        """Setup user and session for performance tests."""
        # Create user
        user_data = {"device_id": "perf-test-device-606"}
        user_response = client.post("/api/v1/users/", json=user_data)
        user = user_response.json()
        
        # Create session
        session_data = {
            "user_id": user["id"],
            "title": "Performance Test Session"
        }
        session_response = client.post("/api/v1/sessions/", json=session_data)
        session = session_response.json()
        
        return {"user": user, "session": session}
    
    def test_user_creation_performance(self, client: TestClient):
        """Test user creation response time."""
        user_data = {
            "device_id": f"perf-user-{int(time.time())}",
            "username": "perf_user"
        }
        
        start_time = time.time()
        response = client.post("/api/v1/users/", json=user_data)
        end_time = time.time()
        
        assert response.status_code == 200
        response_time = end_time - start_time
        assert response_time < 1.0  # Should respond within 1 second
        print(f"User creation took: {response_time:.3f}s")
    
    def test_session_creation_performance(self, client: TestClient):
        """Test session creation response time."""
        # Create user first
        user_data = {"device_id": f"perf-session-{int(time.time())}"}
        user_response = client.post("/api/v1/users/", json=user_data)
        user = user_response.json()
        
        # Test session creation time
        session_data = {
            "user_id": user["id"],
            "title": "Performance Session"
        }
        
        start_time = time.time()
        response = client.post("/api/v1/sessions/", json=session_data)
        end_time = time.time()
        
        assert response.status_code == 200
        response_time = end_time - start_time
        assert response_time < 2.0  # Should respond within 2 seconds (includes system message creation)
        print(f"Session creation took: {response_time:.3f}s")
    
    def test_chat_response_performance(self, client: TestClient, setup_user_and_session):
        """Test chat response time."""
        session_id = setup_user_and_session["session"]["id"]
        
        chat_data = {
            "session_id": session_id,
            "message": "What's a quick recipe for dinner?"
        }
        
        start_time = time.time()
        response = client.post("/api/v1/chat", json=chat_data)
        end_time = time.time()
        
        assert response.status_code == 200
        response_time = end_time - start_time
        assert response_time < 10.0  # LLM responses can take longer
        print(f"Chat response took: {response_time:.3f}s")
    
    def test_concurrent_user_creation(self, client: TestClient):
        """Test creating multiple users concurrently."""
        def create_user(index):
            user_data = {
                "device_id": f"concurrent-user-{index}-{int(time.time())}",
                "username": f"user_{index}"
            }
            return client.post("/api/v1/users/", json=user_data)
        
        start_time = time.time()
        
        # Create 5 users concurrently
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(create_user, i) for i in range(5)]
            responses = [future.result() for future in futures]
        
        end_time = time.time()
        
        # All should succeed
        for response in responses:
            assert response.status_code == 200
        
        total_time = end_time - start_time
        print(f"Created 5 users concurrently in: {total_time:.3f}s")
        assert total_time < 5.0  # Should complete within 5 seconds
    
    def test_conversation_length_performance(self, client: TestClient, setup_user_and_session):
        """Test performance with longer conversation history."""
        session_id = setup_user_and_session["session"]["id"]
        
        # Build up conversation history
        messages = [
            "Hello, I'm learning to cook",
            "What ingredients do I need for pasta?",
            "How do I cook pasta properly?",
            "What sauce goes well with pasta?",
            "Can you give me a complete pasta recipe?"
        ]
        
        response_times = []
        
        for i, message in enumerate(messages):
            chat_data = {
                "session_id": session_id,
                "message": message
            }
            
            start_time = time.time()
            response = client.post("/api/v1/chat", json=chat_data)
            end_time = time.time()
            
            assert response.status_code == 200
            response_time = end_time - start_time
            response_times.append(response_time)
            
            print(f"Message {i+1} response time: {response_time:.3f}s")
        
        # Response times shouldn't increase dramatically with conversation length
        avg_time = sum(response_times) / len(response_times)
        assert avg_time < 15.0  # Average should be reasonable
        
        # Last message shouldn't be much slower than first
        if len(response_times) > 1:
            time_increase = response_times[-1] / response_times[0]
            assert time_increase < 3.0  # No more than 3x slower


class TestAPIStability:
    """Test API stability and error handling."""
    
    def test_malformed_json_handling(self, client: TestClient):
        """Test handling of malformed JSON requests."""
        response = client.post(
            "/api/v1/users/",
            data="invalid json",
            headers={"content-type": "application/json"}
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_missing_required_fields(self, client: TestClient):
        """Test handling of missing required fields."""
        # Missing device_id
        user_data = {
            "username": "test_user",
            "email": "test@example.com"
        }
        
        response = client.post("/api/v1/users/", json=user_data)
        
        assert response.status_code == 422
        error_detail = response.json()["detail"]
        assert any("device_id" in str(error) for error in error_detail)
    
    def test_invalid_field_types(self, client: TestClient):
        """Test handling of invalid field types."""
        user_data = {
            "device_id": 12345,  # Should be string
            "username": "test_user"
        }
        
        response = client.post("/api/v1/users/", json=user_data)
        
        assert response.status_code == 422
    
    def test_very_long_messages(self, client: TestClient):
        """Test handling of extremely long chat messages."""
        # Create user and session
        user_data = {"device_id": "long-message-test"}
        user_response = client.post("/api/v1/users/", json=user_data)
        user = user_response.json()
        
        session_data = {"user_id": user["id"], "title": "Long Message Test"}
        session_response = client.post("/api/v1/sessions/", json=session_data)
        session = session_response.json()
        
        # Create very long message (but within reasonable limits)
        long_message = "Can you help me cook? " * 100  # 1900 characters
        
        chat_data = {
            "session_id": session["id"],
            "message": long_message
        }
        
        response = client.post("/api/v1/chat", json=chat_data)
        
        # Should handle long messages gracefully
        assert response.status_code in [200, 422]  # Either success or validation error
    
    def test_rapid_successive_requests(self, client: TestClient):
        """Test handling of rapid successive requests."""
        # Create user and session
        user_data = {"device_id": "rapid-test-device"}
        user_response = client.post("/api/v1/users/", json=user_data)
        user = user_response.json()
        
        session_data = {"user_id": user["id"], "title": "Rapid Test"}
        session_response = client.post("/api/v1/sessions/", json=session_data)
        session = session_response.json()
        
        # Send 5 rapid requests
        responses = []
        for i in range(5):
            chat_data = {
                "session_id": session["id"],
                "message": f"Quick question {i+1}"
            }
            response = client.post("/api/v1/chat", json=chat_data)
            responses.append(response)
        
        # All should either succeed or fail gracefully
        for response in responses:
            assert response.status_code in [200, 429, 500]  # Success, rate limit, or server error
        
        # At least some should succeed
        successful_responses = [r for r in responses if r.status_code == 200]
        assert len(successful_responses) > 0


class TestAPILimits:
    """Test API limits and edge cases."""
    
    def test_maximum_ingredients_list(self, client: TestClient):
        """Test chat with maximum ingredients list."""
        # Create user and session
        user_data = {"device_id": "max-ingredients-test"}
        user_response = client.post("/api/v1/users/", json=user_data)
        user = user_response.json()
        
        session_data = {"user_id": user["id"], "title": "Max Ingredients Test"}
        session_response = client.post("/api/v1/sessions/", json=session_data)
        session = session_response.json()
        
        # Create large ingredients list
        ingredients = []
        for i in range(50):  # 50 ingredients
            ingredients.append({
                "name": f"ingredient_{i}",
                "quantity": str(i + 1),
                "unit": "pieces"
            })
        
        chat_data = {
            "session_id": session["id"],
            "message": "What can I make with all these ingredients?",
            "ingredients": ingredients
        }
        
        response = client.post("/api/v1/chat", json=chat_data)
        
        # Should handle large ingredient lists
        assert response.status_code in [200, 422]  # Success or validation error
    
    def test_empty_message(self, client: TestClient):
        """Test handling of empty messages."""
        # Create user and session
        user_data = {"device_id": "empty-message-test"}
        user_response = client.post("/api/v1/users/", json=user_data)
        user = user_response.json()
        
        session_data = {"user_id": user["id"], "title": "Empty Message Test"}
        session_response = client.post("/api/v1/sessions/", json=session_data)
        session = session_response.json()
        
        chat_data = {
            "session_id": session["id"],
            "message": ""  # Empty message
        }
        
        response = client.post("/api/v1/chat", json=chat_data)
        
        assert response.status_code == 422  # Should reject empty messages 