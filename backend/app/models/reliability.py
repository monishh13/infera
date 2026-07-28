from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Float, DateTime, ForeignKey
from app.database import Base

class AgentReliabilityScore(Base):
    __tablename__ = "agent_reliability_scores"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    agent_id = Column(String(50), ForeignKey("agents.id"), nullable=False, index=True)
    session_id = Column(String(50), ForeignKey("sessions.id"), nullable=True)
    score = Column(Float, nullable=False)  # Composite 0-100
    tool_success_rate = Column(Float, nullable=False)
    token_efficiency = Column(Float, nullable=False)
    latency_score = Column(Float, nullable=False)
    loop_frequency_score = Column(Float, nullable=False)
    risk_level = Column(String(20), nullable=False)  # LOW | MEDIUM | HIGH | CRITICAL
    predicted_failure_prob = Column(Float, nullable=False)
    calculated_at = Column(DateTime, default=datetime.utcnow, index=True)
