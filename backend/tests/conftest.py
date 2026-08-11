import pytest
import os

# Test suite requires a running PostgreSQL instance.
# Start with: docker-compose up db  (from the project root)
# Uses a separate 'infera_test' database to avoid polluting dev data.
os.environ["DATABASE_URL"] = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://Infera:changeme123@localhost:5432/Infera"
)
os.environ["ALLOW_AUTO_PROVISION_AGENTS"] = "True"

@pytest.fixture
def anyio_backend():
    return 'asyncio'
