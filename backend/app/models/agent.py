from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey
from app.database import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(50), primary_key=True)  # e.g., 'A001'
    name = Column(String(100), nullable=False)
    type = Column(String(50), nullable=False)  # customer_support | research | sales
    description = Column(Text, nullable=True)
    token_budget = Column(Integer, default=10000)
    latency_threshold_ms = Column(Float, default=3000.0)
    failure_threshold = Column(Float, default=0.30)
    loop_threshold = Column(Integer, default=10)
    is_active = Column(Boolean, default=True)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
