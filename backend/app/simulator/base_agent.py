import asyncio
import random
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, Any, Optional, Callable

logger = logging.getLogger("infera.simulator")

class BaseAgent(ABC):
    def __init__(self, agent_id: str, profile: Dict[str, Any], api_url: str = "http://localhost:8000/api/v1", token: Optional[str] = None):
        self.agent_id = agent_id
        self.profile = profile
        self.api_url = api_url
        self.token = token
        self.session_id: Optional[str] = None
        self.loop_count: int = 0
        self._running: bool = False
        self._inject: Optional[Callable[[Dict[str, Any]], Dict[str, Any]]] = None
        self.event_count: int = 0

    @abstractmethod
    def generate_event(self) -> Dict[str, Any]:
        """Subclasses return realistic telemetry event values based on profile."""
        pass

    def inject_anomaly(self, anomaly_fn: Callable[[Dict[str, Any]], Dict[str, Any]]):
        self._inject = anomaly_fn

    def clear_inject(self):
        self._inject = None

    def start_session(self):
        self.session_id = f"S_{self.agent_id}_{int(datetime.utcnow().timestamp())}"
        self.event_count = 0

    def next_step(self) -> Dict[str, Any]:
        if not self.session_id:
            self.start_session()
            
        event = self.generate_event()
        event["agent_id"] = self.agent_id
        event["session_id"] = self.session_id
        event["timestamp"] = datetime.utcnow().isoformat()
        
        if self._inject:
            event = self._inject(event)
            if event.pop("_restore", False):
                self._inject = None
                
        self.event_count += 1
        return event

    def stop(self):
        self._running = False
