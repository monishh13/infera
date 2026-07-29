from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime

class AlertRead(BaseModel):
    id: int
    agent_id: str
    session_id: Optional[str] = None
    telemetry_event_id: Optional[int] = None
    alert_type: str
    severity: str
    anomaly_score: float
    description: str
    threshold_value: Optional[float] = None
    actual_value: Optional[float] = None
    is_acknowledged: bool
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    status: Optional[str] = "created"
    created_at: datetime

    class Config:
        from_attributes = True

class AlertStats(BaseModel):
    total_24h: int
    by_severity: Dict[str, int]
    by_type: Dict[str, int]
    unacknowledged_count: int

