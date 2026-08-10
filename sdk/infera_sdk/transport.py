import logging
import requests
from typing import List
from infera_sdk.config import InferaConfig
from infera_sdk.models import TelemetrySpan

logger = logging.getLogger("infera_sdk.transport")

class HTTPTransport:
    def __init__(self, config: InferaConfig):
        self.config = config
        self.buffer: List[TelemetrySpan] = []

    def queue_span(self, span: TelemetrySpan):
        self.buffer.append(span)
        if len(self.buffer) >= self.config.batch_size:
            self.flush()

    def flush(self):
        if not self.buffer:
            return

        spans_to_send = self.buffer[:]
        self.buffer.clear()

        payload = {
            "events": [span.to_ingest_dict() for span in spans_to_send]
        }

        url = f"{self.config.endpoint}/api/v1/telemetry/batch"
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": self.config.api_key
        }

        try:
            res = requests.post(url, json=payload, headers=headers, timeout=4.0)
            if res.status_code >= 400:
                logger.warning(f"Infera telemetry ingestion returned status {res.status_code}: {res.text}")
        except Exception as e:
            # Exception boundary: Never crash host agent if telemetry server fails
            logger.warning(f"Failed to transmit Infera telemetry: {e}")
