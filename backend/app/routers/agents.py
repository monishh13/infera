from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.agent import Agent
from app.models.session import Session
from app.models.reliability import AgentReliabilityScore
from app.models.user import User
from app.schemas.agent import AgentCreate, AgentRead, AgentUpdate
from app.schemas.session import SessionRead
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.get("/", response_model=List[AgentRead])
async def list_agents(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Agent).where(Agent.is_active == True)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/", response_model=AgentRead)
async def create_agent(req: AgentCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Agent).where(Agent.id == req.id)
    existing = (await db.execute(stmt)).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Agent ID {req.id} already exists")

    agent = Agent(
        id=req.id,
        name=req.name,
        type=req.type,
        description=req.description,
        token_budget=req.token_budget or 10000,
        latency_threshold_ms=req.latency_threshold_ms or 3000.0,
        failure_threshold=req.failure_threshold or 0.30,
        loop_threshold=req.loop_threshold or 10,
        owner_id=current_user.id
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent

@router.get("/{id}", response_model=AgentRead)
async def get_agent(id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Agent).where(Agent.id == id)
    agent = (await db.execute(stmt)).scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.put("/{id}", response_model=AgentRead)
async def update_agent(id: str, req: AgentUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Agent).where(Agent.id == id)
    agent = (await db.execute(stmt)).scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if req.name is not None: agent.name = req.name
    if req.description is not None: agent.description = req.description
    if req.token_budget is not None: agent.token_budget = req.token_budget
    if req.latency_threshold_ms is not None: agent.latency_threshold_ms = req.latency_threshold_ms
    if req.failure_threshold is not None: agent.failure_threshold = req.failure_threshold
    if req.loop_threshold is not None: agent.loop_threshold = req.loop_threshold
    if req.is_active is not None: agent.is_active = req.is_active

    await db.commit()
    await db.refresh(agent)
    return agent

@router.delete("/{id}")
async def delete_agent(id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Agent).where(Agent.id == id)
    agent = (await db.execute(stmt)).scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.is_active = False
    await db.commit()
    return {"message": f"Agent {id} soft-deleted"}

@router.get("/{id}/sessions", response_model=List[SessionRead])
async def list_agent_sessions(id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(Session).where(Session.agent_id == id).order_by(Session.started_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{id}/reliability")
async def get_latest_reliability(id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    stmt = select(AgentReliabilityScore).where(AgentReliabilityScore.agent_id == id).order_by(AgentReliabilityScore.calculated_at.desc())
    score_obj = (await db.execute(stmt)).scalars().first()
    if not score_obj:
        return {
            "agent_id": id,
            "score": 100.0,
            "tool_success_rate": 1.0,
            "token_efficiency": 1.0,
            "latency_score": 1.0,
            "loop_frequency_score": 1.0,
            "risk_level": "LOW",
            "predicted_failure_prob": 0.02
        }
    return {
        "agent_id": id,
        "score": score_obj.score,
        "tool_success_rate": score_obj.tool_success_rate,
        "token_efficiency": score_obj.token_efficiency,
        "latency_score": score_obj.latency_score,
        "loop_frequency_score": score_obj.loop_frequency_score,
        "risk_level": score_obj.risk_level,
        "predicted_failure_prob": score_obj.predicted_failure_prob,
        "calculated_at": score_obj.calculated_at
    }
