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
            "is_anomaly": e.is_anomaly
        })
        if idx > 0:
            edges.append({
                "source": f"node_{events[idx-1].id}",
                "target": node_id,
                "label": f"Step {idx}"
            })

    return {
        "session_id": id,
        "nodes": nodes,
        "edges": edges,
        "total_steps": len(nodes)
    }
