# Infera Python SDK

`infera-sdk` is the official Python telemetry & tracing client for the **Infera AI Agent Observability Platform**.

---

### What Infera Does
Infera provides real-time observability, telemetry tracing, Isolation Forest anomaly detection, failure prediction, and reliability analysis for autonomous LLM AI agents.

### What the SDK Does
The Infera SDK enables you to instrument your Python AI agent applications (custom agents, OpenAI scripts, LangChain/LlamaIndex pipelines, etc.) to capture step-by-step telemetry, latency, token usage, tool calls, LLM parameters, and runtime errors, transmitting them directly to your Infera platform.

> **Important Distinction**: Infera monitors applications that explicitly send telemetry via the SDK or REST API. It **does NOT** automatically observe unrelated third-party applications running inside external tools (such as ChatGPT running in a web browser) without code integration or middleware.

---

## Installation & Configuration

```bash
pip install infera-sdk
```

Or install locally:

```bash
pip install -e sdk/
```

### Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `INFERA_ENDPOINT` | `http://localhost:8000` | URL of your Infera FastAPI backend engine |
| `INFERA_API_KEY` | `dev-key` | API Key for authorization |
| `INFERA_ENVIRONMENT` | `development` | Environment label (`development`, `staging`, `production`) |

---

## Quickstart

```python
from infera_sdk import Infera

# 1. Initialize Client
infera = Infera(
    endpoint="http://localhost:8000",
    api_key="dev-key",
    redact=["api_key", "authorization"]
)

# 2. Register / Bind AI Agent
agent = infera.agent(
    id="A001",
    name="Customer Support Agent",
    agent_type="customer_support"
)

# 3. Trace Monitored Session
with agent.session() as session:
    # Trace LLM Reasoning Step
    with session.trace(name="gpt-4o_reasoning", step_type="llm") as span:
        span.set_tokens(tokens=350, prompt_len=250, response_len=100)
        span.add_metadata("model", "gpt-4o")

    # Trace Tool Execution
    with session.trace(name="vector_kb_search", step_type="tool") as span:
        # Perform tool call logic...
        span.set_tokens(tokens=120)
        span.add_metadata("query", "reset password")

infera.flush()
```

---

## Features

* **Automatic Latency Measurement**: Latency (`latency_ms`) is calculated automatically for every `session.trace()` block.
* **Non-Blocking Telemetry Transport**: Telemetry spans are buffered in memory and transmitted asynchronously in HTTP batches.
* **Automatic Error Capture**: Unhandled exceptions within a trace block set status to `FAILURE`, record the error message, and safely re-raise the exception to your application logic.
* **Metadata Redaction**: Automatically redacts sensitive keys (e.g. `api_key`, `authorization`, `password`).
* **Resilient Error Boundary**: Telemetry transmission failures will never crash your primary AI agent application.

---

## Running the Demo Agent

To test real telemetry ingestion end-to-end:

```bash
python sdk/examples/basic_agent.py
```

Then open the Infera React Dashboard at `http://localhost:5173` to observe your execution session!
