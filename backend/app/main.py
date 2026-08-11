import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.config import settings
from app.database import engine, Base
from app.routers import all_routers
from app.services.scheduler import start_scheduler, stop_scheduler
from app.scripts.seed_admin import seed

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("infera.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Infera Backend Engine...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as err:
        logger.warning(f"Database setup note ({err}). Retrying schema creation...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    # Auto-seed admin user, default agents, and initial ML model if needed
    try:
        await seed()
    except Exception as e:
        logger.warning(f"Seed execution note: {e}")

    # Start background task scheduler
    start_scheduler()
    
    yield
    
    logger.info("Shutting down Infera Backend Engine...")
    stop_scheduler()

app = FastAPI(
    title="Infera Platform API",
    description="Real-time Observability & Anomaly Detection Platform for LLM AI Agents",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS setup for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api/v1
for router in all_routers:
    app.include_router(router, prefix=settings.API_V1_STR)

@app.get("/health")
async def health_check():
    return {"status": "online", "service": "Infera API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
