from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.alert import AnomalyAlert
from app.schemas.alert import AlertRead, AlertStats
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter(prefix="/anomalies", tags=["Anomalies"])

@router.get("/", response_model=List[AlertRead])
async def list_anomalies(
    agent_id: Optional[str] = None,
    severity: Optional[str] = None,
    alert_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AnomalyAlert).order_by(AnomalyAlert.created_at.desc())
    if agent_id:
        stmt = stmt.where(AnomalyAlert.agent_id == agent_id)
    if severity:
        stmt = stmt.where(AnomalyAlert.severity == severity)
    if alert_type:
        stmt = stmt.where(AnomalyAlert.alert_type == alert_type)
    
    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/unacknowledged", response_model=List[AlertRead])
async def get_unacknowledged(db: AsyncSession = Depends(get_db)):
    stmt = select(AnomalyAlert).where(AnomalyAlert.is_acknowledged == False).order_by(AnomalyAlert.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/stats", response_model=AlertStats)
async def get_anomaly_stats(db: AsyncSession = Depends(get_db)):
    stmt = select(AnomalyAlert)
    alerts = (await db.execute(stmt)).scalars().all()
    
    by_severity = {"INFO": 0, "WARNING": 0, "CRITICAL": 0}
    by_type = {}
    unacked = 0
    
    for a in alerts:
        by_severity[a.severity] = by_severity.get(a.severity, 0) + 1
        by_type[a.alert_type] = by_type.get(a.alert_type, 0) + 1
        if not a.is_acknowledged:
            unacked += 1
            
    return AlertStats(
        total_24h=len(alerts),
        by_severity=by_severity,
        by_type=by_type,
        unacknowledged_count=unacked
    )

@router.get("/{agent_id}", response_model=List[AlertRead])
async def get_agent_anomalies(agent_id: str, limit: int = 50, db: AsyncSession = Depends(get_db)):
    stmt = select(AnomalyAlert).where(AnomalyAlert.agent_id == agent_id).order_by(AnomalyAlert.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.put("/{id}/acknowledge", response_model=AlertRead)
async def acknowledge_alert(id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(AnomalyAlert).where(AnomalyAlert.id == id)
    alert = (await db.execute(stmt)).scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.is_acknowledged = True
    await db.commit()
    await db.refresh(alert)
    return alert
