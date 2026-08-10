from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AgentCreate(BaseModel):
    id: str  # e.g., 'A001'
    name: str
    type: str  # customer_support | research | sales
    description: Optional[str] = None
    token_budget: Optional[int] = 10000
    latency_threshold_ms: Optional[float] = 3000.0
    failure_threshold: Optional[float] = 0.30
    loop_threshold: Optional[int] = 10

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    token_budget: Optional[int] = None
    latency_threshold_ms: Optional[float] = None
    failure_threshold: Optional[float] = None
    loop_threshold: Optional[int] = None
    is_active: Optional[bool] = None

class AgentRead(BaseModel):
    id: str
    name: str
    type: str
    description: Optional[str] = None
    token_budget: int
    latency_threshold_ms: float
    failure_threshold: float
    loop_threshold: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AgentReliabilityRead(BaseModel):
    agent_id: str
    score: float
    tool_success_rate: float
    token_efficiency: float
    latency_score: float
    loop_frequency_score: float
    risk_level: str
    predicted_failure_prob: float
    calculated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
