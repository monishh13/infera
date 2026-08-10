import requests
from typing import Optional, List
from infera_sdk.config import InferaConfig
from infera_sdk.transport import HTTPTransport
from infera_sdk.tracer import AgentTracer

class Infera:
    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        environment: Optional[str] = None,
        batch_size: int = 10,
        redact: Optional[List[str]] = None,
    ):
        self.config = InferaConfig(
            endpoint=endpoint,
            api_key=api_key,
            environment=environment,
            batch_size=batch_size,
            redact=redact
        )
        self.transport = HTTPTransport(self.config)

    def agent(
        self,
        id: str = "A001",
        name: Optional[str] = None,
        agent_type: Optional[str] = None
    ) -> AgentTracer:
        """Get or register an AgentTracer instance."""
        # Optionally attempt background agent registration if API key / endpoint is reachable
        try:
            url = f"{self.config.endpoint}/api/v1/agents/"
            payload = {
                "id": id,
                "name": name or f"Agent {id}",
                "type": agent_type or "customer_support",
                "source": "sdk"
            }
            headers = {"X-API-Key": self.config.api_key}
            requests.post(url, json=payload, headers=headers, timeout=2.0)
        except Exception:
            pass  # Non-blocking registration attempt

        return AgentTracer(
            transport=self.transport,
            config=self.config,
            agent_id=id,
            name=name,
            agent_type=agent_type
        )

    def flush(self):
        """Manually flush buffered telemetry spans."""
        self.transport.flush()
