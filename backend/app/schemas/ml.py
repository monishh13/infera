from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MLRetrainResponse(BaseModel):
    message: str
    trained_on_count: int
    contamination: float
    trained_at: datetime

class MLModelStats(BaseModel):
    trained_on_count: int
    contamination: float
    precision_score: Optional[float] = None
    recall_score: Optional[float] = None
    f1_score: Optional[float] = None
    trained_at: Optional[datetime] = None

class MLPredictRequest(BaseModel):
    agent_id: str
    tokens_used: int
    latency_ms: float
    loop_count: int = 1
    status: str = "SUCCESS"

class MLPredictResponse(BaseModel):
    anomaly_score: float
    is_anomaly: bool
