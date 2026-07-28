from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SessionStartRequest(BaseModel):
    agent_id: str
    session_id: Optional[str] = None

class SessionEndRequest(BaseModel):
    status: str = "completed"  # completed | failed | terminated

class SessionRead(BaseModel):
    id: str
    agent_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: str
    total_tokens: int
    total_cost_usd: float
    total_tool_calls: int
    failed_tool_calls: int

    class Config:
        from_attributes = True
