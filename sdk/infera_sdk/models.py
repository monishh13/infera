import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Any, Optional

@dataclass
class TelemetrySpan:
    event_id: str = field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:12]}")
    agent_id: str = ""
    session_id: str = ""
    name: str = "llm_step"
    step_type: str = "tool"  # tool | llm | reasoning
    status: str = "SUCCESS"  # SUCCESS | FAILURE | TIMEOUT
    latency_ms: float = 0.0
    tokens_used: int = 0
    prompt_length: Optional[int] = None
    response_length: Optional[int] = None
    error_message: Optional[str] = None
    loop_count: int = 1
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.utcnow)
    source: str = "sdk"

    def to_ingest_dict(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "session_id": self.session_id,
            "timestamp": self.timestamp.isoformat(),
            "tokens_used": self.tokens_used,
            "tool_name": self.name,
            "latency_ms": round(self.latency_ms, 2),
            "status": self.status,
            "loop_count": self.loop_count,
            "prompt_length": self.prompt_length,
            "response_length": self.response_length,
            "error_message": self.error_message,
            "raw_payload": self.metadata,
            "source": self.source,
            "external_event_id": self.event_id,
        }
