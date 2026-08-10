import sys
import os
import unittest
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from infera_sdk import Infera, InferaConfig
from infera_sdk.models import TelemetrySpan
from infera_sdk.transport import HTTPTransport

class TestInferaSDK(unittest.TestCase):

    def test_config_redaction(self):
        config = InferaConfig(redact=["api_key", "secret"])
        meta = {
            "api_key": "sk-12345",
            "model": "gpt-4o",
            "nested": {"secret": "hidden_val", "public": "visible"}
        }
        sanitized = config.sanitize_metadata(meta)
        self.assertEqual(sanitized["api_key"], "[REDACTED]")
        self.assertEqual(sanitized["model"], "gpt-4o")
        self.assertEqual(sanitized["nested"]["secret"], "[REDACTED]")
        self.assertEqual(sanitized["nested"]["public"], "visible")

    def test_span_ingest_dict(self):
        span = TelemetrySpan(
            agent_id="A001",
            session_id="S100",
            name="test_tool",
            latency_ms=150.5,
            tokens_used=200,
            status="SUCCESS",
            source="sdk"
        )
        data = span.to_ingest_dict()
        self.assertEqual(data["agent_id"], "A001")
        self.assertEqual(data["session_id"], "S100")
        self.assertEqual(data["tool_name"], "test_tool")
        self.assertEqual(data["latency_ms"], 150.5)
        self.assertEqual(data["tokens_used"], 200)
        self.assertEqual(data["source"], "sdk")
        self.assertTrue("external_event_id" in data)

    @patch("requests.post")
    def test_end_to_end_tracing(self, mock_post):
        mock_post.return_value.status_code = 200

        infera = Infera(endpoint="http://localhost:8000", batch_size=2)
        agent = infera.agent(id="A001", name="Test Agent")

        with agent.session() as session:
            with session.trace(name="llm_reasoning", step_type="llm") as span:
                span.set_tokens(tokens=100)

            # Test exception capture
            with self.assertRaises(ValueError):
                with session.trace(name="failing_tool", step_type="tool") as span:
                    raise ValueError("Database connection lost")

        # Verify transport sent batches to backend
        self.assertTrue(mock_post.called)
        call_args = mock_post.call_args
        self.assertIn("/api/v1/telemetry/batch", call_args[0][0])

if __name__ == "__main__":
    unittest.main()
