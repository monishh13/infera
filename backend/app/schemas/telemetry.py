from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime

class TelemetryIngestRequest(BaseModel):
    agent_id: str
    session_id: str
    timestamp: Optional[datetime] = None
    tokens_used: int
    tool_name: Optional[str] = None
    latency_ms: float
    status: str  # SUCCESS | FAILURE | TIMEOUT
    loop_count: Optional[int] = 1
    prompt_length: Optional[int] = None
    response_length: Optional[int] = None
    error_message: Optional[str] = None
    raw_payload: Optional[Dict[str, Any]] = None

class TelemetryIngestResponse(BaseModel):
    event_id: int
    anomaly_score: float
    is_anomaly: bool
    alert_generated: bool
    alert_id: Optional[int] = None
    reliability_score: float

class TelemetryBatchRequest(BaseModel):
    events: List[TelemetryIngestRequest]

class TelemetryRead(BaseModel):
    id: int
    agent_id: str
    session_id: str
    timestamp: datetime
    tokens_used: int
    tool_name: Optional[str] = None
    latency_ms: float
    status: str
    loop_count: int
    prompt_length: Optional[int] = None
    response_length: Optional[int] = None
    error_message: Optional[str] = None
    anomaly_score: Optional[float] = None
    is_anomaly: bool
    created_at: datetime

    class Config:
        from_attributes = True
