import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_root_health_endpoint():
    """Verify that the root /health endpoint responds with 200 and valid schema."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "portos-backend"
        assert data["version"] == "0.1.0"
        assert "timestamp" in data
        assert data["demo_mode"] is True


@pytest.mark.asyncio
async def test_api_v1_health_endpoint():
    """Verify that /api/v1/health responds with 200 and matches root health."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "portos-backend"


@pytest.mark.asyncio
async def test_api_v1_system_status_endpoint():
    """Verify that /api/v1/system/status reports detailed demo and offline status."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/system/status")
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "portos-backend"
        assert data["demo_mode"] is True
        assert data["timezone"] == "Asia/Dhaka"
        assert data["data_status"] == "SIMULATED"
        assert data["gemini_status"] == "offline_demo_mode"

