import numpy as np
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.config import settings
from app.database import get_db
from app.models.agent import Agent
from app.models.session import Session
from app.models.telemetry import TelemetryEvent
from app.models.reliability import AgentReliabilityScore
from app.models.user import User
from app.schemas.telemetry import (
    TelemetryIngestRequest, TelemetryIngestResponse, TelemetryBatchRequest, TelemetryRead
)
from app.ml.feature_engineering import extract_features
from app.ml.isolation_forest import IFModel
from app.ml.model_store import get_active_model
from app.ml.reliability_score import compute_reliability_score
from app.services.alert_service import check_and_create_alert
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])

async def process_single_telemetry(req: TelemetryIngestRequest, db: AsyncSession) -> TelemetryIngestResponse:
    # 1. Fetch or create Agent
    stmt_agent = select(Agent).where(Agent.id == req.agent_id)
    agent = (await db.execute(stmt_agent)).scalars().first()
    if not agent:
        agent = Agent(
            id=req.agent_id,
            name=f"Agent {req.agent_id}",
            type="customer_support" if "001" in req.agent_id else ("research" if "002" in req.agent_id else "sales"),
            token_budget=10000
        )
        db.add(agent)
        await db.flush()

    # 2. Fetch or create Session
    stmt_session = select(Session).where(Session.id == req.session_id)
    session = (await db.execute(stmt_session)).scalars().first()
    if not session:
        session = Session(id=req.session_id, agent_id=req.agent_id, started_at=datetime.utcnow(), status="active")
        db.add(session)
        await db.flush()

    # 3. Retrieve agent history for feature extraction
    stmt_hist = select(TelemetryEvent).where(TelemetryEvent.agent_id == req.agent_id).order_by(TelemetryEvent.timestamp.desc()).limit(50)
    hist_events = (await db.execute(stmt_hist)).scalars().all()
    hist_dicts = [
        {
            'tokens_used': e.tokens_used,
            'latency_ms': e.latency_ms,
            'loop_count': e.loop_count,
            'status': e.status
        }
        for e in reversed(hist_events)
    ]

    event_dict = {
        'tokens_used': req.tokens_used,
        'latency_ms': req.latency_ms,
        'loop_count': req.loop_count or 1,
        'status': req.status
    }

    # 4. Extract 10D feature vector & score with IF model
    feature_vector = extract_features(event_dict, hist_dicts)
    if_model = get_active_model(agent.id)
    if not if_model.fitted:
        if_model = get_active_model(None)  # fallback to global model

    if if_model.fitted:
        anomaly_score, is_anomaly = if_model.score(feature_vector)
    else:
        # Heuristic fallback if model not trained yet
        is_anomaly = (req.tokens_used > 500 or req.latency_ms > agent.latency_threshold_ms or (req.loop_count or 1) >= agent.loop_threshold)
        anomaly_score = -0.75 if is_anomaly else 0.10

    # 5. Create TelemetryEvent
    ts = req.timestamp or datetime.utcnow()
    event = TelemetryEvent(
        agent_id=req.agent_id,
        session_id=req.session_id,
        timestamp=ts,
        tokens_used=req.tokens_used,
        tool_name=req.tool_name,
        latency_ms=req.latency_ms,
        status=req.status,
        loop_count=req.loop_count or 1,
        prompt_length=req.prompt_length,
        response_length=req.response_length,
        error_message=req.error_message,
        raw_payload=req.raw_payload,
        anomaly_score=anomaly_score,
        is_anomaly=is_anomaly
    )
    db.add(event)
    await db.flush()

    # 6. Update Session Stats
    session.total_tokens += req.tokens_used
    session.total_cost_usd += (req.tokens_used * settings.COST_PER_1K_TOKENS / 1000.0)
    session.total_tool_calls += 1
    if req.status in ["FAILURE", "TIMEOUT"]:
        session.failed_tool_calls += 1

    # Calculate rolling failure count for cascade detection
    last5_failures = sum(1 for e in hist_events[:4] if e.status in ["FAILURE", "TIMEOUT"]) + (1 if req.status in ["FAILURE", "TIMEOUT"] else 0)

    # 7. Evaluate and Create Alert
    alert_gen, alert_obj = await check_and_create_alert(
        db=db,
        agent=agent,
        event=event,
        anomaly_score=anomaly_score,
        is_anomaly=is_anomaly,
        rolling_fail_count=last5_failures
    )

    # 8. Recalculate Agent Reliability Score
    successful_calls = session.total_tool_calls - session.failed_tool_calls
    expected_tok = 800.0 if "001" in agent.id else (2500.0 if "002" in agent.id else 1200.0)
    avg_lat = req.latency_ms if not hist_events else float(np.mean([e.latency_ms for e in hist_events[:10]] + [req.latency_ms]))
    avg_loop = float(req.loop_count or 1) if not hist_events else float(np.mean([e.loop_count for e in hist_events[:10]] + [req.loop_count or 1]))

    session_stats = {
        'successful_calls': successful_calls,
        'total_calls': session.total_tool_calls,
        'expected_tokens': expected_tok,
        'actual_tokens': max(float(session.total_tokens), 1.0),
        'avg_latency': avg_lat,
        'baseline_latency': agent.latency_threshold_ms / 2.0,
        'avg_loop_count': avg_loop
    }

    rel_res = compute_reliability_score(session_stats)
    rel_score_obj = AgentReliabilityScore(
        agent_id=agent.id,
        session_id=session.id,
        score=rel_res['score'],
        tool_success_rate=rel_res['tool_success_rate'],
        token_efficiency=rel_res['token_efficiency'],
        latency_score=rel_res['latency_score'],
        loop_frequency_score=rel_res['loop_frequency_score'],
        risk_level=rel_res['risk_level'],
        predicted_failure_prob=rel_res['predicted_failure_prob'],
        calculated_at=datetime.utcnow()
    )
    db.add(rel_score_obj)
    await db.commit()

    return TelemetryIngestResponse(
        event_id=event.id,
        anomaly_score=round(anomaly_score, 4),
        is_anomaly=is_anomaly,
        alert_generated=alert_gen,
        alert_id=alert_obj.id if alert_obj else None,
        reliability_score=rel_res['score']
    )

@router.post("/ingest", response_model=TelemetryIngestResponse)
async def ingest_telemetry(req: TelemetryIngestRequest, db: AsyncSession = Depends(get_db)):
    return await process_single_telemetry(req, db)

@router.post("/batch", response_model=List[TelemetryIngestResponse])
async def batch_ingest_telemetry(req: TelemetryBatchRequest, db: AsyncSession = Depends(get_db)):
    results = []
    for item in req.events:
        res = await process_single_telemetry(item, db)
        results.append(res)
    return results

@router.get("/{agent_id}", response_model=List[TelemetryRead])
async def get_agent_telemetry(agent_id: str, limit: int = 50, offset: int = 0, db: AsyncSession = Depends(get_db)):
    stmt = select(TelemetryEvent).where(TelemetryEvent.agent_id == agent_id).order_by(TelemetryEvent.timestamp.desc()).offset(offset).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{agent_id}/stats")
async def get_agent_telemetry_stats(agent_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(TelemetryEvent).where(TelemetryEvent.agent_id == agent_id)
    events = (await db.execute(stmt)).scalars().all()
    if not events:
        return {"agent_id": agent_id, "total_events": 0, "avg_tokens": 0, "avg_latency_ms": 0, "success_rate": 1.0}

    total_tokens = sum(e.tokens_used for e in events)
    total_latency = sum(e.latency_ms for e in events)
    successes = sum(1 for e in events if e.status == "SUCCESS")

    return {
        "agent_id": agent_id,
        "total_events": len(events),
        "avg_tokens": round(total_tokens / len(events), 1),
        "avg_latency_ms": round(total_latency / len(events), 1),
        "success_rate": round(successes / len(events), 4)
    }
