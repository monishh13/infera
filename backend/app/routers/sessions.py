from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.session import Session
from app.models.telemetry import TelemetryEvent
from app.models.user import User
from app.schemas.session import SessionStartRequest, SessionEndRequest, SessionRead
from app.schemas.telemetry import TelemetryRead
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.post("/start", response_model=SessionRead)
async def start_session(req: SessionStartRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    sess_id = req.session_id or f"S_{req.agent_id}_{int(datetime.utcnow().timestamp())}"
    session = Session(
        id=sess_id,
        agent_id=req.agent_id,
        started_at=datetime.utcnow(),
        status="active"
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session

@router.put("/{id}/end", response_model=SessionRead)
async def end_session(id: str, req: SessionEndRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Session).where(Session.id == id)
    session = (await db.execute(stmt)).scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.ended_at = datetime.utcnow()
    session.status = req.status
    await db.commit()
    await db.refresh(session)
    return session

@router.get("/{id}", response_model=SessionRead)
async def get_session(id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Session).where(Session.id == id)
    session = (await db.execute(stmt)).scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.get("/{id}/events", response_model=List[TelemetryRead])
async def get_session_events(id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(TelemetryEvent).where(TelemetryEvent.session_id == id).order_by(TelemetryEvent.timestamp.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{id}/tool-graph")
async def get_session_tool_graph(id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Returns ordered tool invocation DAG with nodes and sequence edges for visualization."""
    stmt = select(TelemetryEvent).where(TelemetryEvent.session_id == id).order_by(TelemetryEvent.timestamp.asc())
    events = (await db.execute(stmt)).scalars().all()

    nodes = []
    edges = []
    agent_relationships = {}
    anomalous_agents = {event.agent_id for event in events if event.is_anomaly}
    
    for idx, e in enumerate(events):
        node_id = f"node_{e.id}"
        tool_name = e.tool_name or "LLM Reasoning"
        nodes.append({
            "id": node_id,
            "label": tool_name,
            "status": e.status,
            "latency_ms": e.latency_ms,
            "tokens_used": e.tokens_used,
            "loop_count": e.loop_count,
            "step": idx + 1,
            "is_anomaly": e.is_anomaly,
            "agent_id": e.agent_id,
            "parent_agent_id": e.parent_agent_id,
            "interaction_type": e.interaction_type,
            "impact_status": e.impact_status,
        })
        if e.parent_agent_id and e.parent_agent_id != e.agent_id:
            relationship_key = (e.parent_agent_id, e.agent_id)
            relationship = agent_relationships.setdefault(relationship_key, {
                "upstream_agent": e.parent_agent_id,
                "downstream_agent": e.agent_id,
                "interaction_types": set(),
                "event_count": 0,
                "observed_anomaly": False,
                "dependency_impact": False,
                "upstream_anomaly": e.parent_agent_id in anomalous_agents,
            })
            if e.interaction_type:
                relationship["interaction_types"].add(e.interaction_type)
            relationship["event_count"] += 1
            relationship["observed_anomaly"] = relationship["observed_anomaly"] or bool(e.is_anomaly)
            relationship["dependency_impact"] = relationship["dependency_impact"] or e.impact_status == "dependency_impact"
            relationship["upstream_anomaly"] = relationship["upstream_anomaly"] or e.parent_agent_id in anomalous_agents
        if idx > 0:
            edges.append({
                "source": f"node_{events[idx-1].id}",
                "target": node_id,
                "label": f"Step {idx}"
            })
        if e.parent_event_id and any(parent.id == e.parent_event_id for parent in events):
            edges.append({
                "source": f"node_{e.parent_event_id}",
                "target": node_id,
                "label": "agent dependency",
                "relationship": "cross_agent",
            })

    relationship_rows = []
    for relationship in agent_relationships.values():
        relationship["interaction_types"] = sorted(relationship["interaction_types"])
        relationship["observed_cascade"] = (
            relationship["dependency_impact"] and relationship["upstream_anomaly"]
        )
        relationship_rows.append(relationship)

    return {
        "session_id": id,
        "nodes": nodes,
        "edges": edges,
        "agent_relationships": relationship_rows,
        "total_steps": len(nodes)
    }
