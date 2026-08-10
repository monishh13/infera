import pytest
import os

# Override DATABASE_URL for local testing before imports
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["ALLOW_AUTO_PROVISION_AGENTS"] = "True"

@pytest.fixture
def anyio_backend():
    return 'asyncio'
