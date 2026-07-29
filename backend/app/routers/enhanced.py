"""
Enhanced API endpoints for the professional observability features.
These are additive and do not modify any existing endpoints.
"""
import numpy as np
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.agent import Agent
from app.models.session import Session
from app.models.telemetry import TelemetryEvent
from app.models.alert import AnomalyAlert
from app.models.reliability import AgentReliabilityScore
from app.config import settings

router = APIRouter(prefix="/enhanced", tags=["Enhanced"])


# ──────────────────────────────────────────────
# P2: Explainable Anomaly Detection
# ──────────────────────────────────────────────

def _compute_anomaly_reasons(alert: AnomalyAlert, event: Optional[TelemetryEvent],
                              agent: Optional[Agent], baseline_stats: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Compute human-readable reasons explaining why an anomaly was generated."""
    reasons = []

    # Reason: Isolation Forest score
    if alert.anomaly_score is not None:
        severity = "critical" if alert.anomaly_score < -0.7 else ("warning" if alert.anomaly_score < -0.5 else "info")
        reasons.append({
            "icon": "brain",
            "label": "Isolation Forest Anomaly Score",
            "detail": f"IF score = {round(alert.anomaly_score, 2)} (lower is more anomalous)",
            "severity": severity
        })

    if event:
        avg_tokens = baseline_stats.get("avg_tokens", 200)
        avg_latency = baseline_stats.get("avg_latency", 500)
        avg_success_rate = baseline_stats.get("success_rate", 1.0)

        # Reason: Token spike
        if avg_tokens > 0 and event.tokens_used > avg_tokens * 2:
            multiplier = round(event.tokens_used / max(avg_tokens, 1), 1)
            reasons.append({
                "icon": "zap",
                "label": "Token Usage Spike",
                "detail": f"Token usage {multiplier}× higher than baseline ({event.tokens_used} vs avg {round(avg_tokens)})",
                "severity": "critical" if multiplier > 5 else "warning"
            })

        # Reason: Latency spike
        if avg_latency > 0 and event.latency_ms > avg_latency * 2:
            multiplier = round(event.latency_ms / max(avg_latency, 1), 1)
            reasons.append({
                "icon": "clock",
                "label": "High Latency",
                "detail": f"Latency {multiplier}× above average ({round(event.latency_ms)}ms vs avg {round(avg_latency)}ms)",
                "severity": "critical" if multiplier > 5 else "warning"
            })

        # Reason: Tool failure
        if event.status in ["FAILURE", "TIMEOUT"]:
            reasons.append({
                "icon": "x-circle",
                "label": "Tool Execution Failed",
                "detail": f"Tool '{event.tool_name or 'Unknown'}' returned status: {event.status}",
                "severity": "critical" if event.status == "FAILURE" else "warning"
            })

        # Reason: Loop count
        if event.loop_count and event.loop_count > 3:
            reasons.append({
                "icon": "repeat",
                "label": "Excessive Loop Iterations",
                "detail": f"Loop count reached {event.loop_count} iterations",
                "severity": "critical" if event.loop_count >= 10 else "warning"
            })

    if agent:
        # Reason: Threshold violations
        if event and event.latency_ms > agent.latency_threshold_ms:
            reasons.append({
                "icon": "alert-triangle",
                "label": "Latency Threshold Exceeded",
                "detail": f"Configured threshold: {agent.latency_threshold_ms}ms, actual: {round(event.latency_ms)}ms",
                "severity": "warning"
            })

    # Reason from alert type
    type_reasons = {
        "tool_failure_cascade": {
            "icon": "layers",
            "label": "Tool Failure Cascade",
            "detail": "Multiple consecutive tool failures detected within sliding window",
            "severity": "critical"
        },
        "behavioral_drift": {
            "icon": "trending-up",
            "label": "Behavioral Drift Detected",
            "detail": "Agent behavior deviating from learned baseline across 10D feature space",
            "severity": "warning"
        }
    }
    if alert.alert_type in type_reasons and not any(r["label"] == type_reasons[alert.alert_type]["label"] for r in reasons):
        reasons.append(type_reasons[alert.alert_type])

    return reasons


@router.get("/alerts/{alert_id}/reasons")
async def get_alert_reasons(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Returns explainable reasons for why a specific anomaly alert was generated."""
    stmt = select(AnomalyAlert).where(AnomalyAlert.id == alert_id)
    alert = (await db.execute(stmt)).scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    # Fetch the triggering event
    event = None
    if alert.telemetry_event_id:
        stmt_ev = select(TelemetryEvent).where(TelemetryEvent.id == alert.telemetry_event_id)
        event = (await db.execute(stmt_ev)).scalars().first()

    # Fetch agent
    stmt_ag = select(Agent).where(Agent.id == alert.agent_id)
    agent = (await db.execute(stmt_ag)).scalars().first()

    # Compute baseline stats
    stmt_baseline = select(
        func.avg(TelemetryEvent.tokens_used).label("avg_tokens"),
        func.avg(TelemetryEvent.latency_ms).label("avg_latency"),
    ).where(TelemetryEvent.agent_id == alert.agent_id)
    baseline_row = (await db.execute(stmt_baseline)).first()
    baseline_stats = {
        "avg_tokens": float(baseline_row[0] or 200) if baseline_row else 200,
        "avg_latency": float(baseline_row[1] or 500) if baseline_row else 500,
    }

    reasons = _compute_anomaly_reasons(alert, event, agent, baseline_stats)
    return {"alert_id": alert_id, "reasons": reasons}


@router.get("/alerts/recent-explained")
async def get_recent_alerts_explained(limit: int = 20, db: AsyncSession = Depends(get_db)):
    """Returns recent alerts with pre-computed explanations."""
    stmt = select(AnomalyAlert).order_by(AnomalyAlert.created_at.desc()).limit(limit)
    alerts = (await db.execute(stmt)).scalars().all()

    # Get global baseline
    stmt_baseline = select(
        func.avg(TelemetryEvent.tokens_used).label("avg_tokens"),
        func.avg(TelemetryEvent.latency_ms).label("avg_latency"),
    )
    baseline_row = (await db.execute(stmt_baseline)).first()
    baseline_stats = {
        "avg_tokens": float(baseline_row[0] or 200) if baseline_row else 200,
        "avg_latency": float(baseline_row[1] or 500) if baseline_row else 500,
    }

    results = []
    for alert in alerts:
        event = None
        if alert.telemetry_event_id:
            stmt_ev = select(TelemetryEvent).where(TelemetryEvent.id == alert.telemetry_event_id)
            event = (await db.execute(stmt_ev)).scalars().first()

        stmt_ag = select(Agent).where(Agent.id == alert.agent_id)
        agent = (await db.execute(stmt_ag)).scalars().first()

        reasons = _compute_anomaly_reasons(alert, event, agent, baseline_stats)

        results.append({
            "id": alert.id,
            "agent_id": alert.agent_id,
            "session_id": alert.session_id,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "anomaly_score": alert.anomaly_score,
            "description": alert.description,
            "threshold_value": alert.threshold_value,
            "actual_value": alert.actual_value,
            "is_acknowledged": alert.is_acknowledged,
            "created_at": alert.created_at.isoformat() if alert.created_at else None,
            "acknowledged_at": alert.acknowledged_at.isoformat() if hasattr(alert, 'acknowledged_at') and alert.acknowledged_at else None,
            "resolved_at": alert.resolved_at.isoformat() if hasattr(alert, 'resolved_at') and alert.resolved_at else None,
            "status": getattr(alert, 'status', 'created') or 'created',
            "reasons": reasons
        })

    return results


# ──────────────────────────────────────────────
# P5: Agent Health Report
# ──────────────────────────────────────────────

@router.get("/agents/{agent_id}/health")
async def get_agent_health(agent_id: str, db: AsyncSession = Depends(get_db)):
    """Returns comprehensive agent health report."""
    stmt_ag = select(Agent).where(Agent.id == agent_id)
    agent = (await db.execute(stmt_ag)).scalars().first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Latest reliability score
    stmt_rel = select(AgentReliabilityScore).where(
        AgentReliabilityScore.agent_id == agent_id
    ).order_by(AgentReliabilityScore.calculated_at.desc())
    latest_rel = (await db.execute(stmt_rel)).scalars().first()

    # Reliability score history (last 20)
    stmt_rel_hist = select(AgentReliabilityScore).where(
        AgentReliabilityScore.agent_id == agent_id
    ).order_by(AgentReliabilityScore.calculated_at.desc()).limit(20)
    rel_history = (await db.execute(stmt_rel_hist)).scalars().all()
    rel_trend_data = [{"score": r.score, "ts": r.calculated_at.isoformat()} for r in reversed(rel_history)]

    # Recent telemetry for trend computation
    stmt_recent = select(TelemetryEvent).where(
        TelemetryEvent.agent_id == agent_id
    ).order_by(TelemetryEvent.timestamp.desc()).limit(50)
    recent_events = (await db.execute(stmt_recent)).scalars().all()

    latency_trend = [{"value": e.latency_ms, "ts": e.timestamp.isoformat()} for e in reversed(recent_events)]
    token_trend = [{"value": e.tokens_used, "ts": e.timestamp.isoformat()} for e in reversed(recent_events)]

    # Compute aggregate stats
    if recent_events:
        avg_latency = float(np.mean([e.latency_ms for e in recent_events]))
        avg_tokens = float(np.mean([e.tokens_used for e in recent_events]))
        success_count = sum(1 for e in recent_events if e.status == "SUCCESS")
        tool_success_rate = success_count / len(recent_events)
        failure_count = len(recent_events) - success_count
        avg_loop = float(np.mean([e.loop_count for e in recent_events]))
    else:
        avg_latency = 0
        avg_tokens = 0
        tool_success_rate = 1.0
        failure_count = 0
        avg_loop = 1.0

    # Determine status
    if latest_rel:
        score = latest_rel.score
        risk = latest_rel.risk_level
        failure_prob = latest_rel.predicted_failure_prob
    else:
        score = 100.0
        risk = "LOW"
        failure_prob = 0.02

    # Determine overall trend from reliability history
    if len(rel_history) >= 3:
        recent_avg = np.mean([r.score for r in rel_history[:3]])
        older_avg = np.mean([r.score for r in rel_history[-3:]])
        if recent_avg > older_avg + 2:
            trend = "improving"
        elif recent_avg < older_avg - 2:
            trend = "degrading"
        else:
            trend = "stable"
    else:
        trend = "stable"

    status = "healthy" if score >= 85 else ("degraded" if score >= 65 else ("at_risk" if score >= 40 else "critical"))

    # Top reasons affecting score
    top_reasons = []
    if latest_rel:
        if latest_rel.tool_success_rate < 0.9:
            top_reasons.append({
                "label": "Tool failures increasing",
                "severity": "critical" if latest_rel.tool_success_rate < 0.7 else "warning",
                "detail": f"Tool success rate: {round(latest_rel.tool_success_rate * 100)}%"
            })
        if latest_rel.latency_score < 0.7:
            top_reasons.append({
                "label": "High latency detected",
                "severity": "warning",
                "detail": f"Latency score: {round(latest_rel.latency_score * 100)}%"
            })
        if latest_rel.token_efficiency < 0.6:
            top_reasons.append({
                "label": "Token inefficiency",
                "severity": "warning",
                "detail": f"Token efficiency: {round(latest_rel.token_efficiency * 100)}%"
            })
        if latest_rel.loop_frequency_score < 0.7:
            top_reasons.append({
                "label": "Excessive looping",
                "severity": "warning",
                "detail": f"Loop frequency score: {round(latest_rel.loop_frequency_score * 100)}%"
            })

    return {
        "agent_id": agent_id,
        "agent_name": agent.name,
        "agent_type": agent.type,
        "overall_health": round(score, 1),
        "reliability_score": round(score, 1),
        "risk_level": risk,
        "status": status,
        "trend": trend,
        "tool_success_rate": round(tool_success_rate, 4),
        "avg_latency": round(avg_latency, 1),
        "avg_tokens": round(avg_tokens, 1),
        "token_efficiency": round(latest_rel.token_efficiency, 4) if latest_rel else 1.0,
        "failure_probability": round(failure_prob, 4),
        "loop_frequency": round(avg_loop, 2),
        "failure_count": failure_count,
        "top_reasons": top_reasons,
        "reliability_trend": rel_trend_data,
        "latency_trend": latency_trend,
        "token_trend": token_trend
    }


# ──────────────────────────────────────────────
# P6: Recommendations Engine
# ──────────────────────────────────────────────

RECOMMENDATIONS_MAP = {
    "token_spike": [
        {"action": "Reduce Token Budget", "description": "Lower the agent's token budget to enforce stricter limits.", "priority": "high", "icon": "scissors"},
        {"action": "Inspect Prompt Template", "description": "Review and optimize the prompt template to reduce token consumption.", "priority": "high", "icon": "file-text"},
        {"action": "Review Model Selection", "description": "Consider using a more token-efficient model variant.", "priority": "medium", "icon": "cpu"},
    ],
    "high_latency": [
        {"action": "Review API Timeout", "description": "Check and adjust API timeout configuration settings.", "priority": "high", "icon": "clock"},
        {"action": "Check External Services", "description": "Verify external service health and network connectivity.", "priority": "high", "icon": "globe"},
        {"action": "Scale Infrastructure", "description": "Consider scaling compute resources to handle the load.", "priority": "medium", "icon": "server"},
    ],
    "infinite_loop": [
        {"action": "Restart Session", "description": "Terminate the current session and start fresh.", "priority": "critical", "icon": "refresh-cw"},
        {"action": "Review Loop Guard", "description": "Adjust the loop threshold configuration for this agent.", "priority": "high", "icon": "shield"},
        {"action": "Inspect Agent Logic", "description": "Debug the agent's decision-making to identify infinite loop cause.", "priority": "high", "icon": "search"},
    ],
    "tool_failure_cascade": [
        {"action": "Investigate Tool Failure", "description": "Check the failing tool's logs and error messages.", "priority": "critical", "icon": "alert-triangle"},
        {"action": "Check Service Status", "description": "Verify the external service the tool depends on is operational.", "priority": "high", "icon": "activity"},
        {"action": "Enable Fallback Tools", "description": "Configure backup tool alternatives for resilience.", "priority": "medium", "icon": "git-branch"},
    ],
    "behavioral_drift": [
        {"action": "Retrain ML Model", "description": "Trigger Isolation Forest retraining with recent data.", "priority": "high", "icon": "brain"},
        {"action": "Review Agent Configuration", "description": "Check if recent config changes caused behavior shift.", "priority": "medium", "icon": "settings"},
        {"action": "Analyze Historical Patterns", "description": "Compare current behavior with historical baselines.", "priority": "medium", "icon": "bar-chart-2"},
    ],
}


@router.get("/alerts/{alert_id}/recommendations")
async def get_alert_recommendations(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Returns context-aware recommended actions for a specific alert."""
    stmt = select(AnomalyAlert).where(AnomalyAlert.id == alert_id)
    alert = (await db.execute(stmt)).scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    recs = RECOMMENDATIONS_MAP.get(alert.alert_type, [
        {"action": "Investigate Alert", "description": "Review the alert details and related telemetry.", "priority": "medium", "icon": "search"},
        {"action": "Monitor Closely", "description": "Continue monitoring this agent for further anomalies.", "priority": "low", "icon": "eye"},
    ])

    return {"alert_id": alert_id, "alert_type": alert.alert_type, "recommendations": recs}


# ──────────────────────────────────────────────
# P7: Trend Detection
# ──────────────────────────────────────────────

@router.get("/agents/{agent_id}/trends")
async def get_agent_trends(agent_id: str, db: AsyncSession = Depends(get_db)):
    """Computes metric trends by comparing recent window vs historical baseline."""
    now = datetime.utcnow()
    recent_since = now - timedelta(hours=1)
    baseline_since = now - timedelta(hours=24)

    # Recent window events
    stmt_recent = select(TelemetryEvent).where(
        TelemetryEvent.agent_id == agent_id,
        TelemetryEvent.timestamp >= recent_since
    )
    recent_events = (await db.execute(stmt_recent)).scalars().all()

    # Baseline window events (full 24h)
    stmt_baseline = select(TelemetryEvent).where(
        TelemetryEvent.agent_id == agent_id,
        TelemetryEvent.timestamp >= baseline_since
    )
    baseline_events = (await db.execute(stmt_baseline)).scalars().all()

    def compute_trend(recent_val, baseline_val):
        if baseline_val == 0:
            return {"direction": "stable", "change_pct": 0}
        pct = round(((recent_val - baseline_val) / max(abs(baseline_val), 0.001)) * 100, 1)
        if pct > 5:
            direction = "increasing"
        elif pct < -5:
            direction = "decreasing"
        else:
            direction = "stable"
        return {"direction": direction, "change_pct": pct}

    if recent_events:
        r_lat = float(np.mean([e.latency_ms for e in recent_events]))
        r_tok = float(np.mean([e.tokens_used for e in recent_events]))
        r_fail = sum(1 for e in recent_events if e.status != "SUCCESS") / len(recent_events)
    else:
        r_lat = 0
        r_tok = 0
        r_fail = 0

    if baseline_events:
        b_lat = float(np.mean([e.latency_ms for e in baseline_events]))
        b_tok = float(np.mean([e.tokens_used for e in baseline_events]))
        b_fail = sum(1 for e in baseline_events if e.status != "SUCCESS") / len(baseline_events)
    else:
        b_lat = r_lat
        b_tok = r_tok
        b_fail = r_fail

    # Reliability trend
    stmt_rel_recent = select(AgentReliabilityScore).where(
        AgentReliabilityScore.agent_id == agent_id
    ).order_by(AgentReliabilityScore.calculated_at.desc()).limit(5)
    recent_rels = (await db.execute(stmt_rel_recent)).scalars().all()

    stmt_rel_older = select(AgentReliabilityScore).where(
        AgentReliabilityScore.agent_id == agent_id
    ).order_by(AgentReliabilityScore.calculated_at.desc()).offset(5).limit(5)
    older_rels = (await db.execute(stmt_rel_older)).scalars().all()

    r_rel = float(np.mean([r.score for r in recent_rels])) if recent_rels else 100.0
    b_rel = float(np.mean([r.score for r in older_rels])) if older_rels else r_rel

    # Cost trend
    r_cost = sum(e.tokens_used * settings.COST_PER_1K_TOKENS / 1000.0 for e in recent_events)
    b_cost = sum(e.tokens_used * settings.COST_PER_1K_TOKENS / 1000.0 for e in baseline_events) / max(1, 24)  # hourly avg

    trends = [
        {
            "metric": "Latency",
            "current": round(r_lat, 1),
            "baseline": round(b_lat, 1),
            "unit": "ms",
            **compute_trend(r_lat, b_lat),
            "improving_direction": "decreasing"
        },
        {
            "metric": "Token Usage",
            "current": round(r_tok, 1),
            "baseline": round(b_tok, 1),
            "unit": "tokens",
            **compute_trend(r_tok, b_tok),
            "improving_direction": "decreasing"
        },
        {
            "metric": "Reliability",
            "current": round(r_rel, 1),
            "baseline": round(b_rel, 1),
            "unit": "%",
            **compute_trend(r_rel, b_rel),
            "improving_direction": "increasing"
        },
        {
            "metric": "Cost",
            "current": round(r_cost, 4),
            "baseline": round(b_cost, 4),
            "unit": "USD/hr",
            **compute_trend(r_cost, b_cost),
            "improving_direction": "decreasing"
        },
        {
            "metric": "Failure Rate",
            "current": round(r_fail * 100, 1),
            "baseline": round(b_fail * 100, 1),
            "unit": "%",
            **compute_trend(r_fail, b_fail),
            "improving_direction": "decreasing"
        }
    ]

    return {"agent_id": agent_id, "trends": trends}


# ──────────────────────────────────────────────
# P8: Agent Comparison
# ──────────────────────────────────────────────

@router.get("/agents/compare")
async def compare_agents(agent_ids: str = Query(..., description="Comma-separated agent IDs"), db: AsyncSession = Depends(get_db)):
    """Returns comparison data for multiple agents."""
    ids = [a.strip() for a in agent_ids.split(",") if a.strip()]

    result = []
    for aid in ids:
        stmt_ag = select(Agent).where(Agent.id == aid)
        agent = (await db.execute(stmt_ag)).scalars().first()
        if not agent:
            continue

        # Latest reliability
        stmt_rel = select(AgentReliabilityScore).where(
            AgentReliabilityScore.agent_id == aid
        ).order_by(AgentReliabilityScore.calculated_at.desc())
        rel = (await db.execute(stmt_rel)).scalars().first()

        # Telemetry stats
        stmt_events = select(TelemetryEvent).where(TelemetryEvent.agent_id == aid)
        events = (await db.execute(stmt_events)).scalars().all()

        if events:
            avg_latency = float(np.mean([e.latency_ms for e in events]))
            avg_tokens = float(np.mean([e.tokens_used for e in events]))
            success_rate = sum(1 for e in events if e.status == "SUCCESS") / len(events)
            failure_rate = 1 - success_rate
            avg_loop = float(np.mean([e.loop_count for e in events]))
        else:
            avg_latency = 0
            avg_tokens = 0
            success_rate = 1.0
            failure_rate = 0
            avg_loop = 1.0

        # Cost
        stmt_cost = select(func.sum(Session.total_cost_usd)).where(Session.agent_id == aid)
        total_cost = (await db.execute(stmt_cost)).scalar() or 0.0

        result.append({
            "agent_id": aid,
            "agent_name": agent.name,
            "agent_type": agent.type,
            "reliability": round(rel.score if rel else 100.0, 1),
            "avg_latency": round(avg_latency, 1),
            "avg_tokens": round(avg_tokens, 1),
            "tool_success_rate": round(success_rate * 100, 1),
            "failure_rate": round(failure_rate * 100, 1),
            "total_cost": round(float(total_cost), 4),
            "avg_loop_count": round(avg_loop, 2),
            "risk_level": rel.risk_level if rel else "LOW"
        })

    return {"agents": result}


# ──────────────────────────────────────────────
# P1: Session Detail (extended stats)
# ──────────────────────────────────────────────

@router.get("/sessions/{session_id}/detail")
async def get_session_detail(session_id: str, db: AsyncSession = Depends(get_db)):
    """Returns comprehensive session detail with events and computed stats."""
    stmt = select(Session).where(Session.id == session_id)
    session = (await db.execute(stmt)).scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    stmt_events = select(TelemetryEvent).where(
        TelemetryEvent.session_id == session_id
    ).order_by(TelemetryEvent.timestamp.asc())
    events = (await db.execute(stmt_events)).scalars().all()

    # Compute per-event cost and duration
    event_list = []
    for i, e in enumerate(events):
        cost = e.tokens_used * settings.COST_PER_1K_TOKENS / 1000.0
        duration = e.latency_ms
        event_list.append({
            "id": e.id,
            "step": i + 1,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "tool_name": e.tool_name or "LLM Reasoning",
            "tokens_used": e.tokens_used,
            "latency_ms": round(e.latency_ms, 1),
            "status": e.status,
            "loop_count": e.loop_count,
            "cost_usd": round(cost, 6),
            "anomaly_score": round(e.anomaly_score, 4) if e.anomaly_score is not None else None,
            "is_anomaly": e.is_anomaly,
            "error_message": e.error_message,
            "prompt_length": e.prompt_length,
            "response_length": e.response_length,
        })

    # Aggregate stats
    total_tokens = sum(e.tokens_used for e in events) if events else 0
    total_cost = total_tokens * settings.COST_PER_1K_TOKENS / 1000.0
    avg_latency = float(np.mean([e.latency_ms for e in events])) if events else 0
    retries = sum(1 for e in events if e.loop_count and e.loop_count > 1)
    failure_count = sum(1 for e in events if e.status in ["FAILURE", "TIMEOUT"])
    total_tools = len(set(e.tool_name for e in events if e.tool_name))

    # Execution duration
    if events and len(events) >= 2:
        exec_duration_ms = (events[-1].timestamp - events[0].timestamp).total_seconds() * 1000
    else:
        exec_duration_ms = 0

    # Fetch agent info
    stmt_ag = select(Agent).where(Agent.id == session.agent_id)
    agent = (await db.execute(stmt_ag)).scalars().first()

    return {
        "session_id": session.id,
        "agent_id": session.agent_id,
        "agent_name": agent.name if agent else session.agent_id,
        "status": session.status,
        "started_at": session.started_at.isoformat() if session.started_at else None,
        "ended_at": session.ended_at.isoformat() if session.ended_at else None,
        "events": event_list,
        "stats": {
            "total_events": len(events),
            "total_tokens": total_tokens,
            "total_cost_usd": round(total_cost, 6),
            "avg_latency_ms": round(avg_latency, 1),
            "execution_duration_ms": round(exec_duration_ms, 1),
            "total_tools_used": total_tools,
            "retries": retries,
            "failure_count": failure_count,
        }
    }
