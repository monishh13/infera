from typing import Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.alert import AnomalyAlert
from app.models.agent import Agent
from app.models.telemetry import TelemetryEvent

async def check_and_create_alert(
    db: AsyncSession,
    agent: Agent,
    event: TelemetryEvent,
    anomaly_score: float,
    is_anomaly: bool,
    rolling_fail_count: int = 0
) -> Tuple[bool, Optional[AnomalyAlert]]:
    """
    Evaluates telemetry event and IF score to determine if an AnomalyAlert should be generated.
    Returns (alert_generated: bool, alert_object: Optional[AnomalyAlert])
    """
    alert_type = None
    severity = None
    description = None
    threshold_val = None
    actual_val = None

    # 1. Rule-based check: Infinite loop
    if event.loop_count >= agent.loop_threshold:
        alert_type = "infinite_loop"
        severity = "CRITICAL"
        description = f"Infinite loop detected: iteration {event.loop_count} exceeded threshold {agent.loop_threshold}"
        threshold_val = float(agent.loop_threshold)
        actual_val = float(event.loop_count)

    # 2. Rule-based check: Tool failure cascade
    elif rolling_fail_count >= 5 or (event.status in ["FAILURE", "TIMEOUT"] and rolling_fail_count >= 3):
        alert_type = "tool_failure_cascade"
        severity = "CRITICAL"
        description = f"Tool failure cascade: {rolling_fail_count} consecutive tool failures observed"
        threshold_val = 5.0
        actual_val = float(rolling_fail_count)

    # 3. ML Anomaly checks (Isolation Forest score)
    elif is_anomaly or anomaly_score < -0.3:
        if anomaly_score < -0.7:
            severity = "CRITICAL"
        elif anomaly_score < -0.5:
            severity = "WARNING"
        else:
            severity = "INFO"

        # Determine anomaly classification
        if event.tokens_used > 500:
            alert_type = "token_spike"
            description = f"Token consumption spike: {event.tokens_used} tokens (IF score: {round(anomaly_score, 2)})"
            actual_val = float(event.tokens_used)
        elif event.latency_ms > agent.latency_threshold_ms:
            alert_type = "high_latency"
            description = f"High latency spike: {round(event.latency_ms, 1)} ms vs threshold {agent.latency_threshold_ms} ms (IF score: {round(anomaly_score, 2)})"
            threshold_val = agent.latency_threshold_ms
            actual_val = event.latency_ms
        else:
            alert_type = "behavioral_drift"
            description = f"Behavioral drift anomaly detected across 10D feature space (IF score: {round(anomaly_score, 2)})"

    if alert_type and severity:
        alert = AnomalyAlert(
            agent_id=agent.id,
            session_id=event.session_id,
            telemetry_event_id=event.id,
            alert_type=alert_type,
            severity=severity,
            anomaly_score=anomaly_score,
            description=description,
            threshold_value=threshold_val,
            actual_value=actual_val,
            is_acknowledged=False
        )
        db.add(alert)
        await db.flush()
        return True, alert

    return False, None
