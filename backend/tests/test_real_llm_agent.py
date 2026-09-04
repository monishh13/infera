import pytest
from unittest.mock import patch, MagicMock
from app.simulator.real_llm_agent import RealLLMAgent
from app.config import settings

def test_real_llm_agent_fallback_without_api_key():
    # Force GROQ_API_KEY to empty string
    with patch.object(settings, 'GROQ_API_KEY', ''):
        agent = RealLLMAgent()
        agent.start_session()
        event = agent.next_step()

        assert event['agent_id'] == 'A004'
        assert event['status'] == 'FAILURE'
        assert event['tokens_used'] == 0
        assert event['error_message'] == 'GROQ_API_KEY not configured or invalid API key'
        assert event['tool_name'] == 'weather_lookup'

def test_real_llm_agent_successful_api_call():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [
            {"message": {"content": "Weather in Tokyo is 18°C Partly Cloudy."}}
        ],
        "usage": {
            "prompt_tokens": 30,
            "completion_tokens": 25,
            "total_tokens": 55
        }
    }

    with patch.object(settings, 'GROQ_API_KEY', 'gsk_test_key_12345'):
        with patch('httpx.Client.post', return_value=mock_response):
            agent = RealLLMAgent()
            agent.start_session()
            event = agent.next_step()

            assert event['agent_id'] == 'A004'
            assert event['status'] == 'SUCCESS'
            assert event['tokens_used'] == 55
            assert event['latency_ms'] > 0
            assert event['tool_name'] == 'weather_lookup'
            assert event['error_message'] is None

def test_real_llm_agent_multi_step_progression():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "choices": [{"message": {"content": "Step complete"}}],
        "usage": {"total_tokens": 40}
    }

    with patch.object(settings, 'GROQ_API_KEY', 'gsk_test_key_12345'):
        with patch('httpx.Client.post', return_value=mock_response):
            agent = RealLLMAgent()
            agent.start_session()
            
            ev1 = agent.next_step()
            assert ev1['tool_name'] == 'weather_lookup'
            assert ev1['loop_count'] == 1

            ev2 = agent.next_step()
            assert ev2['tool_name'] == 'currency_converter'
            assert ev2['loop_count'] == 2

            ev3 = agent.next_step()
            assert ev3['tool_name'] == 'database_search'
            assert ev3['loop_count'] == 3

            ev4 = agent.next_step()
            assert ev4['tool_name'] == 'text_summarizer'
            assert ev4['loop_count'] == 4

@pytest.fixture
async def setup_db():
    from app.database import engine, Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

@pytest.mark.anyio
async def test_real_llm_execute_endpoint(setup_db):
    from httpx import AsyncClient, ASGITransport
    from app.main import app
    from app.services.auth_service import get_current_user
    from app.models.user import User

    mock_user = User(id="u1", username="admin", email="admin@infera.ai")
    app.dependency_overrides[get_current_user] = lambda: mock_user

    try:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "Execution result message"}}],
            "usage": {"total_tokens": 62}
        }

        with patch.object(settings, 'GROQ_API_KEY', 'gsk_test_key_12345'):
            with patch('httpx.Client.post', return_value=mock_response):
                async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
                    res = await ac.post("/api/v1/simulator/real-llm/execute", json={"prompt": "Test query"})
                    assert res.status_code == 200
                    data = res.json()
                    assert data["agent_id"] == "A004"
                    assert data["tokens_used"] == 62
                    assert "anomaly_score" in data
                    assert "reliability_score" in data
    finally:
        app.dependency_overrides.clear()



