from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Text, Float, Boolean, DateTime, ForeignKey
from app.database import Base

class AnomalyAlert(Base):
    __tablename__ = "anomaly_alerts"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    agent_id = Column(String(50), ForeignKey("agents.id"), nullable=False, index=True)
    session_id = Column(String(50), ForeignKey("sessions.id"), nullable=True)
    telemetry_event_id = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("telemetry_events.id"), nullable=True)
    alert_type = Column(String(50), nullable=False)  # token_spike | infinite_loop | high_latency | tool_failure_cascade | behavioral_drift
    severity = Column(String(20), nullable=False)    # INFO | WARNING | CRITICAL
    anomaly_score = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    threshold_value = Column(Float, nullable=True)
    actual_value = Column(Float, nullable=True)
    is_acknowledged = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
