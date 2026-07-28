from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from app.database import Base

class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(50), primary_key=True)  # e.g., 'S1001'
    agent_id = Column(String(50), ForeignKey("agents.id"), nullable=False, index=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    status = Column(String(20), default="active")  # active | completed | failed | terminated
    total_tokens = Column(Integer, default=0)
    total_cost_usd = Column(Float, default=0.0)
    total_tool_calls = Column(Integer, default=0)
    failed_tool_calls = Column(Integer, default=0)
