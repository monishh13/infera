from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from app.database import Base

class TelemetryEvent(Base):
    __tablename__ = "telemetry_events"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    agent_id = Column(String(50), ForeignKey("agents.id"), nullable=False, index=True)
    session_id = Column(String(50), ForeignKey("sessions.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True, default=datetime.utcnow)
    tokens_used = Column(Integer, nullable=False)
    tool_name = Column(String(100), nullable=True)
    latency_ms = Column(Float, nullable=False)
    status = Column(String(20), nullable=False)  # SUCCESS | FAILURE | TIMEOUT
    loop_count = Column(Integer, default=1)
    prompt_length = Column(Integer, nullable=True)
    response_length = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    raw_payload = Column(JSON, nullable=True)
    anomaly_score = Column(Float, nullable=True)
    is_anomaly = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
