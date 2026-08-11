import os
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

logger = logging.getLogger("infera.database")

def get_engine(db_url: str):
    return create_async_engine(
        db_url,
        echo=False,
        future=True,
        pool_pre_ping=True,
    )

def _init_db():
    target_url = settings.DATABASE_URL
    # Remap docker-compose service hostname to localhost when running outside Docker
    if "db:5432" in target_url and not os.path.exists("/.dockerenv"):
        target_url = target_url.replace("db:5432", "localhost:5432")
    eng = get_engine(target_url)
    session_factory = async_sessionmaker(
        bind=eng,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )
    return eng, session_factory

engine, AsyncSessionLocal = _init_db()

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
