import asyncio
import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db, AsyncSessionLocal
from app.models.agent import Agent
from app.schemas.simulator import SimulatorInjectRequest, SimulatorStatus, AgentStatusInfo
from app.schemas.telemetry import TelemetryIngestRequest
from app.routers.telemetry import process_single_telemetry
from app.simulator.customer_support import CustomerSupportAgent
from app.simulator.research_agent import ResearchAgent
from app.simulator.sales_agent import SalesAgent
from app.simulator.real_llm_agent import RealLLMAgent
from app.simulator.anomaly_injector import get_anomaly_injector

from app.models.user import User
from app.services.auth_service import get_current_user
from app.ml.multi_agent import evaluate_interactions, generate_scenario

logger = logging.getLogger("infera.simulator")
router = APIRouter(prefix="/simulator", tags=["Simulator"])

_simulator_state = {
    "running": False,
    "agents": {},
    "tasks": []
}

@router.get("/scenario/{scenario}")
async def get_reproducible_scenario(
    scenario: str,
    current_user: User = Depends(get_current_user),
):
    """Run a deterministic multi-agent scenario and return evaluated impact."""
    try:
        events = generate_scenario(scenario)
    except ValueError as err:
        raise HTTPException(status_code=422, detail=str(err)) from err
    return {
        "scenario": scenario,
        "events": [event.__dict__ for event in events],
        "evaluation": evaluate_interactions(events),
    }

def _init_simulators():
    if not _simulator_state["agents"]:
        _simulator_state["agents"] = {
            "A001": CustomerSupportAgent(),
            "A002": ResearchAgent(),
            "A003": SalesAgent(),
            "A004": RealLLMAgent()
        }

async def _agent_loop(agent_instance):
    agent_instance._running = True
    agent_instance.start_session()
    logger.info(f"Simulator agent {agent_instance.agent_id} started session {agent_instance.session_id}")

    while agent_instance._running and _simulator_state["running"]:
        event_dict = agent_instance.next_step()
        try:
            async with AsyncSessionLocal() as db:
                req = TelemetryIngestRequest(**event_dict)
                await process_single_telemetry(req, db)
        except Exception as err:
            logger.error(f"Error in simulator emit for {agent_instance.agent_id}: {err}")

        tick = agent_instance.profile.get('tick_interval', 2.0)
        await asyncio.sleep(tick)

    logger.info(f"Simulator agent {agent_instance.agent_id} stopped.")

async def _ensure_simulator_agents_exist(db: AsyncSession):
    sim_data = [
        {"id": "A001", "name": "Customer Support Agent", "type": "customer_support", "token_budget": 2000},
        {"id": "A002", "name": "Deep Research Agent", "type": "research", "token_budget": 8000},
        {"id": "A003", "name": "Sales Representative Agent", "type": "sales", "token_budget": 4000},
        {"id": "A004", "name": "Real LLM Agent (Google Flash / Groq)", "type": "real_llm", "token_budget": 5000},
    ]
    for data in sim_data:
        stmt = select(Agent).where(Agent.id == data["id"])
        existing = (await db.execute(stmt)).scalars().first()
        if not existing:
            agent = Agent(
                id=data["id"],
                name=data["name"],
                type=data["type"],
                token_budget=data["token_budget"],
                is_active=True,
                source="simulator"
            )
            db.add(agent)
    await db.commit()

@router.post("/start", response_model=SimulatorStatus)
async def start_simulator(background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    _init_simulators()
    await _ensure_simulator_agents_exist(db)
    if _simulator_state["running"]:
        return await get_simulator_status(current_user=current_user)

    _simulator_state["running"] = True
    _simulator_state["tasks"] = []

    for agent_id, agent_obj in _simulator_state["agents"].items():
        task = asyncio.create_task(_agent_loop(agent_obj))
        _simulator_state["tasks"].append(task)

    return await get_simulator_status(current_user=current_user)

@router.post("/stop", response_model=SimulatorStatus)
async def stop_simulator(current_user: User = Depends(get_current_user)):
    _simulator_state["running"] = False
    for agent_id, agent_obj in _simulator_state["agents"].items():
        agent_obj.stop()

    for task in _simulator_state.get("tasks", []):
        task.cancel()
    _simulator_state["tasks"] = []

    return await get_simulator_status(current_user=current_user)

@router.get("/status", response_model=SimulatorStatus)
async def get_simulator_status(current_user: User = Depends(get_current_user)):
    _init_simulators()
    agent_infos = []
    for agent_id, agent_obj in _simulator_state["agents"].items():
        status_str = "RUNNING" if (_simulator_state["running"] and agent_obj._running) else "STOPPED"
        agent_infos.append(AgentStatusInfo(
            id=agent_id,
            status=status_str,
            event_count=agent_obj.event_count
        ))

    return SimulatorStatus(
        running=_simulator_state["running"],
        agents=agent_infos
    )

@router.post("/inject-anomaly")
async def inject_anomaly(req: SimulatorInjectRequest, current_user: User = Depends(get_current_user)):
    _init_simulators()
    agent_obj = _simulator_state["agents"].get(req.agent_id)
    if not agent_obj:
        raise HTTPException(status_code=404, detail=f"Agent {req.agent_id} not found in simulator")

    duration = req.duration_events if req.duration_events is not None else 3
    if duration < 1:
        raise HTTPException(status_code=422, detail="duration_events must be at least 1")

    try:
        injector = get_anomaly_injector(req.anomaly_type, duration=duration)
    except ValueError as err:
        raise HTTPException(status_code=422, detail=str(err)) from err

    agent_obj.inject_anomaly(injector)
    return {
        "message": (
            f"Injected {req.anomaly_type} anomaly into {req.agent_id} "
            f"for the next {duration} telemetry events"
        ),
        "agent_id": req.agent_id,
        "anomaly_type": req.anomaly_type,
        "duration_events": duration,
        "simulator_running": _simulator_state["running"],
    }

from pydantic import BaseModel

class RealLLMExecuteRequest(BaseModel):
    prompt: Optional[str] = None
    adversarial_mode: Optional[bool] = False

@router.post("/real-llm/execute")
async def execute_real_llm_step(
    req: RealLLMExecuteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import datetime
    _init_simulators()
    await _ensure_simulator_agents_exist(db)
    agent_obj = _simulator_state["agents"].get("A004")
    if not agent_obj:
        raise HTTPException(status_code=404, detail="Real LLM Agent A004 not initialized")

    if not agent_obj.session_id:
        agent_obj.start_session()

    agent_obj.adversarial_mode = bool(req.adversarial_mode)

    if req.prompt and not req.adversarial_mode:
        raw_event = agent_obj.generate_event(custom_prompt=req.prompt)
    else:
        raw_event = agent_obj.generate_event()

    raw_event["agent_id"] = "A004"
    raw_event["session_id"] = agent_obj.session_id
    raw_event["timestamp"] = datetime.utcnow().isoformat()

    telemetry_req = TelemetryIngestRequest(**raw_event)
    telemetry_res = await process_single_telemetry(telemetry_req, db)

    prompt_label = req.prompt if (req.prompt and not req.adversarial_mode) else ("Adversarial Anomaly Prompt" if req.adversarial_mode else "Multi-Step Workflow Step")

    return {
        "agent_id": "A004",
        "session_id": agent_obj.session_id,
        "event_id": telemetry_res.event_id,
        "prompt_used": prompt_label,
        "tokens_used": raw_event.get("tokens_used", 0),
        "latency_ms": raw_event.get("latency_ms", 0.0),
        "tool_name": raw_event.get("tool_name", "custom_tool"),
        "status": raw_event.get("status", "SUCCESS"),
        "error_message": raw_event.get("error_message"),
        "response_text": raw_event.get("response_text", ""),
        "anomaly_score": telemetry_res.anomaly_score,
        "is_anomaly": telemetry_res.is_anomaly,
        "reliability_score": telemetry_res.reliability_score,
        "alert_generated": telemetry_res.alert_generated,
        "alert_id": telemetry_res.alert_id
    }
