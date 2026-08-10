import os
from typing import List, Optional

class InferaConfig:
    def __init__(
        self,
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        environment: Optional[str] = None,
        batch_size: int = 10,
        redact: Optional[List[str]] = None,
    ):
        self.endpoint = (endpoint or os.getenv("INFERA_ENDPOINT") or "http://localhost:8000").rstrip("/")
        self.api_key = api_key or os.getenv("INFERA_API_KEY") or "dev-key"
        self.environment = environment or os.getenv("INFERA_ENVIRONMENT") or "development"
        self.batch_size = batch_size
        self.redact = set(redact or ["api_key", "authorization", "password", "secret", "token"])

    def sanitize_metadata(self, metadata: dict) -> dict:
        """Lightweight metadata key redaction filter."""
        if not metadata or not isinstance(metadata, dict):
            return metadata or {}

        sanitized = {}
        for key, val in metadata.items():
            if key.lower() in self.redact:
                sanitized[key] = "[REDACTED]"
            elif isinstance(val, dict):
                sanitized[key] = self.sanitize_metadata(val)
            else:
                sanitized[key] = val
        return sanitized
