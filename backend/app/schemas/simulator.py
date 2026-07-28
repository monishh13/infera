from pydantic import BaseModel
from typing import List, Optional

class SimulatorInjectRequest(BaseModel):
    agent_id: str
    anomaly_type: str  # token_spike | infinite_loop | high_latency | tool_failure_cascade | behavioral_drift
    duration_events: Optional[int] = 3

class AgentStatusInfo(BaseModel):
    id: str
    status: str
    event_count: int

class SimulatorStatus(BaseModel):
    running: bool
    agents: List[AgentStatusInfo]
