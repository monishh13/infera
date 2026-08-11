import asyncio
import logging
from datetime import datetime, timedelta
import numpy as np
from sqlalchemy import select

from app.database import AsyncSessionLocal, engine, Base
from app.models.user import User
from app.models.agent import Agent
from app.models.session import Session
from app.models.telemetry import TelemetryEvent
from app.models.reliability import AgentReliabilityScore
from app.services.auth_service import get_password_hash
from app.ml.isolation_forest import IFModel
from app.ml.model_store import set_active_model
from app.ml.feature_engineering import extract_features

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_admin")

async def seed():
    from app.config import settings
    import app.database as db_module
    try:
        async with db_module.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as err:
        logger.error(
            f"Seed: Cannot connect to PostgreSQL — {err}. "
            "Ensure Postgres is running (docker-compose up db) and DATABASE_URL is correct."
        )
        raise

    async with db_module.AsyncSessionLocal() as db:
        # 1. Seed Admin User
        stmt = select(User).where(User.username == "admin")
        admin_user = (await db.execute(stmt)).scalars().first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@infera.ai",
                hashed_password=get_password_hash("secret123"),
                is_active=True
            )
            db.add(admin_user)
            await db.flush()
            logger.info("Admin user 'admin' created with password 'secret123'")

        # 2. Seed Initial 3 Agents
        agents_data = [
            {
                "id": "A001",
                "name": "Customer Support Agent",
                "type": "customer_support",
                "description": "Handles tier-1 customer inquiries, FAQ lookups, and support ticket escalations.",
                "token_budget": 2000,
                "latency_threshold_ms": 1500.0,
                "failure_threshold": 0.20,
                "loop_threshold": 8,
                "owner_id": admin_user.id
            },
            {
                "id": "A002",
                "name": "Deep Research Agent",
                "type": "research",
                "description": "Performs web searches, multi-document synthesis, and academic citation parsing.",
                "token_budget": 8000,
                "latency_threshold_ms": 4000.0,
                "failure_threshold": 0.30,
                "loop_threshold": 12,
                "owner_id": admin_user.id
            },
            {
                "id": "A003",
                "name": "Sales Representative Agent",
                "type": "sales",
                "description": "Manages CRM leads, scores prospect interactions, and schedules follow-up meetings.",
                "token_budget": 4000,
                "latency_threshold_ms": 2500.0,
                "failure_threshold": 0.25,
                "loop_threshold": 10,
                "owner_id": admin_user.id
            }
        ]

        for ad in agents_data:
            stmt_a = select(Agent).where(Agent.id == ad["id"])
            existing_a = (await db.execute(stmt_a)).scalars().first()
            if not existing_a:
                agent_obj = Agent(**ad)
                db.add(agent_obj)
                logger.info(f"Seeded Agent {ad['id']} - {ad['name']}")

        await db.commit()

        # 3. Generate 500 Synthetic Baseline Events for initial IF training
        logger.info("Generating 500 synthetic baseline events for Isolation Forest initialization...")
        baseline_features = []
        for i in range(500):
            agent_id = "A001" if i % 3 == 0 else ("A002" if i % 3 == 1 else "A003")
            tok = int(np.random.normal(120, 20)) if agent_id == "A001" else (int(np.random.normal(300, 50)) if agent_id == "A002" else int(np.random.normal(150, 25)))
            tok = max(30, tok)
            lat = float(np.random.normal(400, 80)) if agent_id == "A001" else (float(np.random.normal(1200, 200)) if agent_id == "A002" else float(np.random.normal(600, 100)))
            lat = max(100.0, lat)
            
            ev_dict = {
                'tokens_used': tok,
                'latency_ms': lat,
                'loop_count': 1,
                'status': 'SUCCESS'
            }
            feats = extract_features(ev_dict, [])
            baseline_features.append(feats)

        feature_matrix = np.array(baseline_features)
        if_model = IFModel()
        if_model.train(feature_matrix)
        set_active_model(if_model, agent_id=None)
        logger.info("Isolation Forest model trained and saved on 500 baseline events!")

if __name__ == "__main__":
    asyncio.run(seed())
