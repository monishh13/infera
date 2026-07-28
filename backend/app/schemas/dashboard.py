from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class DashboardOverview(BaseModel):
    active_agents: int
    alerts_today: int
    avg_reliability_score: float
    cost_today_usd: float

class ActiveAgentMetrics(BaseModel):
    id: str
    name: str
    type: str
    reliability_score: float
    risk_level: str
    last_event_time: Optional[datetime] = None
    token_budget: int
    current_tokens: int = 0
    is_active: bool

class TokenMetricPoint(BaseModel):
    timestamp: str
    tokens: Dict[str, int]  # agent_id -> tokens_used

class CostMetricPoint(BaseModel):
    agent_id: str
    agent_name: str
    cost_usd: float

class LatencyMetricPoint(BaseModel):
    tool_name: str
    avg_latency_ms: float
