import time
import uuid
import logging
from typing import Optional, Dict, Any
from infera_sdk.models import TelemetrySpan
from infera_sdk.transport import HTTPTransport
from infera_sdk.config import InferaConfig

logger = logging.getLogger("infera_sdk.tracer")

class SpanTracer:
    def __init__(
        self,
        transport: HTTPTransport,
        config: InferaConfig,
        agent_id: str,
        session_id: str,
        name: str,
        step_type: str = "tool",
        loop_count: int = 1,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.transport = transport
        self.config = config
        self.agent_id = agent_id
        self.session_id = session_id
        self.name = name
        self.step_type = step_type
        self.loop_count = loop_count
        self.metadata = config.sanitize_metadata(metadata or {})
        self.tokens_used = 0
        self.prompt_length = None
        self.response_length = None
        self.status = "SUCCESS"
        self.error_message = None
        self.start_time = 0.0

    def __enter__(self):
        self.start_time = time.time()
        return self

    def set_tokens(self, tokens: int, prompt_len: Optional[int] = None, response_len: Optional[int] = None):
        self.tokens_used = tokens
        if prompt_len is not None:
            self.prompt_length = prompt_len
        if response_len is not None:
            self.response_length = response_len

    def add_metadata(self, key: str, value: Any):
        if key.lower() not in self.config.redact:
            self.metadata[key] = value

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration_ms = (time.time() - self.start_time) * 1000.0

        if exc_type is not None:
            self.status = "FAILURE"
            self.error_message = str(exc_val) or exc_type.__name__

        span = TelemetrySpan(
            agent_id=self.agent_id,
            session_id=self.session_id,
            name=self.name,
            step_type=self.step_type,
            status=self.status,
            latency_ms=duration_ms,
            tokens_used=self.tokens_used,
            prompt_length=self.prompt_length,
            response_length=self.response_length,
            error_message=self.error_message,
            loop_count=self.loop_count,
            metadata=self.metadata,
            source="sdk"
        )
        self.transport.queue_span(span)
        return False  # Re-raise exceptions normally


class SessionTracer:
    def __init__(
        self,
        transport: HTTPTransport,
        config: InferaConfig,
        agent_id: str,
        session_id: Optional[str] = None
    ):
        self.transport = transport
        self.config = config
        self.agent_id = agent_id
        self.session_id = session_id or f"S_{agent_id}_{uuid.uuid4().hex[:8]}"

    def __enter__(self):
        return self

    def trace(
        self,
        name: str,
        step_type: str = "tool",
        loop_count: int = 1,
        metadata: Optional[Dict[str, Any]] = None
    ) -> SpanTracer:
        return SpanTracer(
            transport=self.transport,
            config=self.config,
            agent_id=self.agent_id,
            session_id=self.session_id,
            name=name,
            step_type=step_type,
            loop_count=loop_count,
            metadata=metadata
        )

    def __exit__(self, exc_type, exc_val, exc_tb):
        # Auto-flush transport buffer when session finishes
        self.transport.flush()
        return False


class AgentTracer:
    def __init__(
        self,
        transport: HTTPTransport,
        config: InferaConfig,
        agent_id: str,
        name: Optional[str] = None,
        agent_type: Optional[str] = None
    ):
        self.transport = transport
        self.config = config
        self.agent_id = agent_id
        self.name = name or f"Agent {agent_id}"
        self.agent_type = agent_type or "customer_support"

    def session(self, session_id: Optional[str] = None) -> SessionTracer:
        return SessionTracer(
            transport=self.transport,
            config=self.config,
            agent_id=self.agent_id,
            session_id=session_id
        )
