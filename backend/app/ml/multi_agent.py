"""Deterministic multi-agent interaction scenarios and cascade evaluation."""

from dataclasses import dataclass
from typing import Dict, List


@dataclass(frozen=True)
class AgentInteraction:
    event_id: str
    agent_id: str
    session_id: str
    parent_agent_id: str | None = None
    parent_event_id: str | None = None
    status: str = "SUCCESS"
    observed_anomaly: bool = False


def generate_scenario(name: str, seed: int = 42) -> List[AgentInteraction]:
    """Generate reproducible interaction traces for simulator/evaluation use."""
    if name == "independent":
        return [
            AgentInteraction(f"E{i}", agent, "S-independent")
            for i, agent in enumerate(("A001", "A002", "A003"), 1)
        ]
    if name in {"normal_workflow", "failure_cascade", "retry"}:
        statuses = ("SUCCESS", "SUCCESS", "SUCCESS")
        anomalies = (False, False, False)
        if name == "failure_cascade":
            statuses = ("SUCCESS", "FAILURE", "FAILURE")
            anomalies = (False, True, False)
        elif name == "retry":
            statuses = ("SUCCESS", "FAILURE", "SUCCESS")
            anomalies = (False, True, False)
        events = []
        previous = None
        for i, (agent, status, anomaly) in enumerate(
            zip(("A001", "A002", "A003"), statuses, anomalies), 1
        ):
            events.append(
                AgentInteraction(
                    f"E{i}", agent, "S-workflow", "A00%d" % (i - 1) if previous else None,
                    previous, status, anomaly
                )
            )
            previous = f"E{i}"
        return events
    raise ValueError(f"Unknown scenario: {name}")


def evaluate_interactions(events: List[AgentInteraction]) -> Dict[str, object]:
    """Summarize observed anomalies and dependency impact without causal claims."""
    observed = [event for event in events if event.observed_anomaly]
    failed = [event for event in events if event.status != "SUCCESS"]
    failed_ids = {event.event_id for event in failed}
    downstream = [
        event for event in events
        if event.parent_event_id in failed_ids
    ]
    return {
        "failed_agents": [event.agent_id for event in failed],
        "observed_anomalous_agents": [event.agent_id for event in observed],
        "downstream_dependent_agents": [event.agent_id for event in downstream],
        "observed_cascade": bool(
            any(event.parent_event_id in failed_ids and event.status != "SUCCESS" for event in events)
        ),
        "dependency_impact": bool(downstream),
        "causal_inference": False,
    }
