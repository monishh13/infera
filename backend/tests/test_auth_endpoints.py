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
    await engine.dispose()

@pytest.mark.anyio
async def test_register_and_refresh_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register new user
        reg_res = await ac.post("/api/v1/auth/register", json={
            "username": "testuser",
            "email": "test@infera.ai",
            "password": "securepassword123"
        })
        assert reg_res.status_code == 201
        data = reg_res.json()
        assert data["username"] == "testuser"
        assert "password" not in data

        # 2. Login user
        login_res = await ac.post("/api/v1/auth/login", json={
            "username": "testuser",
            "password": "securepassword123"
        })
        assert login_res.status_code == 200
        tokens = login_res.json()
        assert "access_token" in tokens
        assert "refresh_token" in tokens

        # 3. Refresh token
        refresh_res = await ac.post("/api/v1/auth/refresh", json={
            "refresh_token": tokens["refresh_token"]
        })
        assert refresh_res.status_code == 200
        new_tokens = refresh_res.json()
        assert "access_token" in new_tokens
        assert "refresh_token" in new_tokens
