from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.agent import Agent
from app.models.session import Session
from app.models.telemetry import TelemetryEvent
from app.models.alert import AnomalyAlert
from app.models.reliability import AgentReliabilityScore
from app.schemas.dashboard import DashboardOverview, ActiveAgentMetrics, CostMetricPoint, LatencyMetricPoint
from app.schemas.alert import AlertRead

from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/overview", response_model=DashboardOverview)
async def get_dashboard_overview(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Active agents count
    stmt_agents = select(func.count(Agent.id)).where(Agent.is_active == True)
    active_count = (await db.execute(stmt_agents)).scalar() or 0

    # 2. Total alerts last 24h
    since_24h = datetime.utcnow() - timedelta(hours=24)
    stmt_alerts = select(func.count(AnomalyAlert.id)).where(AnomalyAlert.created_at >= since_24h)
    alerts_24h = (await db.execute(stmt_alerts)).scalar() or 0

    # 3. Avg reliability score across active agents
    subq = select(
        AgentReliabilityScore.score,
        func.row_number().over(
            partition_by=AgentReliabilityScore.agent_id,
            order_by=AgentReliabilityScore.calculated_at.desc()
        ).label("rn")
    ).subquery()
    
    stmt_scores = select(func.avg(subq.c.score)).where(subq.c.rn == 1)
    avg_score = (await db.execute(stmt_scores)).scalar()
    avg_score_val = round(float(avg_score), 1) if avg_score is not None else 100.0

    # 4. Total cost today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    stmt_cost = select(func.sum(Session.total_cost_usd)).where(Session.started_at >= today_start)
    cost_sum = (await db.execute(stmt_cost)).scalar()
    cost_val = round(float(cost_sum), 4) if cost_sum is not None else 0.0

    return DashboardOverview(
        active_agents=active_count,
        alerts_today=alerts_24h,
        avg_reliability_score=avg_score_val,
        cost_today_usd=cost_val
    )

@router.get("/agents/active", response_model=List[ActiveAgentMetrics])
async def get_active_agents_metrics(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Agent).where(Agent.is_active == True)
    agents = (await db.execute(stmt)).scalars().all()

    result = []
    for agent in agents:
        # Fetch latest reliability score
        stmt_score = select(AgentReliabilityScore).where(
            AgentReliabilityScore.agent_id == agent.id
        ).order_by(AgentReliabilityScore.calculated_at.desc())
        latest_score = (await db.execute(stmt_score)).scalars().first()

        # Fetch latest event timestamp
        stmt_event = select(TelemetryEvent).where(
            TelemetryEvent.agent_id == agent.id
        ).order_by(TelemetryEvent.timestamp.desc())
        latest_event = (await db.execute(stmt_event)).scalars().first()

        # Current total tokens today
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        stmt_tokens = select(func.sum(Session.total_tokens)).where(
            Session.agent_id == agent.id, Session.started_at >= today_start
        )
        cur_tokens = (await db.execute(stmt_tokens)).scalar() or 0

        score_val = latest_score.score if latest_score else 100.0
        risk_val = latest_score.risk_level if latest_score else "LOW"

        result.append(ActiveAgentMetrics(
            id=agent.id,
            name=agent.name,
            type=agent.type,
            reliability_score=score_val,
            risk_level=risk_val,
            last_event_time=latest_event.timestamp if latest_event else None,
            token_budget=agent.token_budget,
            current_tokens=cur_tokens,
            is_active=agent.is_active
        ))

    return result

@router.get("/metrics/token-usage")
async def get_token_usage_metrics(window: str = Query("1h", pattern="^(1h|6h|24h)$"), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    hours = 1 if window == "1h" else (6 if window == "6h" else 24)
    since_time = datetime.utcnow() - timedelta(hours=hours)

    stmt = select(TelemetryEvent).where(
        TelemetryEvent.timestamp >= since_time
    ).order_by(TelemetryEvent.timestamp.asc())
    events = (await db.execute(stmt)).scalars().all()

    # Bucket events by minute or 5-min intervals
    data_points = []
    bucket_map: Dict[str, Dict[str, int]] = {}

    for e in events:
        bucket_key = e.timestamp.strftime("%H:%M")
        if bucket_key not in bucket_map:
            bucket_map[bucket_key] = {}
        bucket_map[bucket_key][e.agent_id] = bucket_map[bucket_key].get(e.agent_id, 0) + e.tokens_used

    for time_str, agent_tokens in bucket_map.items():
        point = {"timestamp": time_str}
        point.update(agent_tokens)
        data_points.append(point)

    return data_points

@router.get("/metrics/costs", response_model=List[CostMetricPoint])
async def get_cost_metrics(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Agent).where(Agent.is_active == True)
    agents = (await db.execute(stmt)).scalars().all()

    result = []
    for a in agents:
        stmt_cost = select(func.sum(Session.total_cost_usd)).where(Session.agent_id == a.id)
        cost_sum = (await db.execute(stmt_cost)).scalar() or 0.0
        result.append(CostMetricPoint(
            agent_id=a.id,
            agent_name=a.name,
            cost_usd=round(float(cost_sum), 4)
        ))
    return result

@router.get("/metrics/latency", response_model=List[LatencyMetricPoint])
async def get_latency_metrics(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(
        TelemetryEvent.tool_name,
        func.avg(TelemetryEvent.latency_ms).label("avg_lat")
    ).where(
        TelemetryEvent.tool_name.isnot(None)
    ).group_by(TelemetryEvent.tool_name)
    
    rows = (await db.execute(stmt)).all()
    return [
        LatencyMetricPoint(
            tool_name=row[0] or "Unknown",
            avg_latency_ms=round(float(row[1]), 1)
        )
        for row in rows
    ]

@router.get("/alerts/recent", response_model=List[AlertRead])
async def get_recent_alerts(limit: int = 20, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(AnomalyAlert).order_by(AnomalyAlert.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()
