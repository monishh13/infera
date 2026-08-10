import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import engine, Base

@pytest.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.mark.anyio
async def test_telemetry_ingest_produces_scores_and_alerts():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Ingest a telemetry event that crosses threshold (e.g. loop_count=12)
        payload = {
            "agent_id": "A001",
            "session_id": "S1001",
            "tokens_used": 1500,  # token spike > 20% of 2000 budget
            "latency_ms": 500.0,
            "status": "SUCCESS",
            "loop_count": 12  # infinite loop
        }
        res = await ac.post("/api/v1/telemetry/ingest", json=payload)
        assert res.status_code == 200
        data = res.json()

        assert "event_id" in data
        assert "anomaly_score" in data
        assert "is_anomaly" in data
        assert "reliability_score" in data
        assert data["alert_generated"] is True
        assert data["alert_id"] is not None
