import asyncio
import logging
from app.database import engine, Base
from app.models import *
from app.scripts.seed_admin import seed

logging.basicConfig(level=logging.INFO)

async def reset_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    await seed()
    print("Database tables recreated successfully with SQLite autoincrement primary keys!")

if __name__ == "__main__":
    asyncio.run(reset_db())
