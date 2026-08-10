# Infera: Real-Time Telemetry, Explainable Anomaly Detection & Reliability Platform for Autonomous LLM Agents

[![Build Status](https://img.shields.io/badge/Status-Active%20Research-blue.svg)](https://github.com/infera/infera)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org/)

---

## Abstract

**Infera** is a real-time telemetry tracing, explainable anomaly detection, and reliability engineering platform engineered specifically for autonomous Large Language Model (LLM) agents. 

Conventional Application Performance Monitoring (APM) tools (e.g., Datadog, Prometheus) rely on static call graphs, fixed error rate thresholds, and predictable compute metrics. Autonomous LLM agents invalidate these assumptions due to non-deterministic reasoning paths, unexpected token consumption bursts, infinite tool execution loops, dependency failure cascades, and semantic drift.

Infera solves these challenges by combining:
- **`infera-sdk` Python Client**: Official lightweight, non-blocking telemetry tracing library for Python AI agent frameworks (LangChain, LlamaIndex, OpenAI, AutoGen, custom agents).
- **10-Dimensional Spatial-Temporal Feature Engineering**: Converts raw agent execution spans into dense numerical feature vectors incorporating token dynamics, temporal intervals, tool interaction patterns, and loop rates.
- **Unsupervised Anomaly Detection Architecture**: Employs online **Isolation Forest** (`IFModel`) and **Local Outlier Factor** (`LOFModel`) algorithms trained in-process without labeled failure datasets.
- **Explainable Anomaly Detection Engine**: Generates root-cause diagnostic explanations comparing anomalous spans against historical agent baselines.
- **Context-Aware Action Recommendations Engine**: Provides priority-ranked remediation guidance (`critical`, `high`, `medium`, `low`) for operational alerts.
- **Agent Reliability Score (ARS)**: Quantitative composite metric ($0 \text{--} 100$) evaluating agent stability and estimating failure probabilities $P(\text{failure})$.
- **Session Replay & Step Trace Analysis**: Interactive step-by-step trace playback displaying per-step latencies, token consumption, and USD cost breakdown.
- **Obsidian Dark Real-Time Analytics Command Center**: React 18 / Vite dashboard providing real-time visual telemetry, Directed Acyclic Graph (DAG) state representations of tool interactions, side-by-side agent comparison matrices, and metric trend analysis.

---

## System Architecture

```
+---------------------------------------------------------------------------------------------------+
|                                      INFERA PLATFORM ARCHITECTURE                                 |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +------------------------+      +------------------------+      +-----------------------------+  |
|  | Multi-Agent Simulator  |      | External Python Agent  |      |  React Observability Hub    |  |
|  | (Source: "simulator")  |      | (Using infera-sdk)     |      | (Session Replay & DAGs)     |  |
|  +------------------------+      +------------------------+      +-----------------------------+  |
|               |                              |                                  ^                 |
|               v                              v                                  |                 |
|     +-------------------------------------------------------------------+       | (REST / Poll)   |
|     |           FastAPI Ingress Endpoint (Idempotency Check)            |       |                 |
|     |           POST /api/v1/telemetry/ingest (external_event_id)       |-------+                 |
|     +-------------------------------------------------------------------+                         |
|                                       |                                                           |
|                                       v                                                           |
|     +-------------------------------------------------------------------+                         |
|     |          Session State Manager & Source Attribution Engine        |                         |
|     |        (Attributes source: "simulator" | "sdk", Updates Session)    |                         |
|     +-------------------------------------------------------------------+                         |
|                                       |                                                           |
|                                       v                                                           |
|     +-------------------------------------------------------------------+                         |
|     |              10D Feature Engineering Matrix Engine                |                         |
|     |    (Tokens, Latency, Z-Scores, Velocity, Failure Rate, Age Ratio)  |                         |
|     +-------------------------------------------------------------------+                         |
|                                       |                                                           |
|       +-------------------------------+-------------------------------+                           |
|       |                               |                               |                           |
|       v                               v                               v                           |
| +---------------------------+   +---------------------------+   +---------------------------+     |
| | Isolation Forest Estimator|   | Explainability & Rec Engine|   |  Agent Reliability Score  |     |
| | (Anomaly Score & LOF)     |   | (Root-Cause & Action Recs)|   |    (ARS Composite Engine) |     |
| +---------------------------+   +---------------------------+   +---------------------------+     |
|       |                               |                               |                           |
|       +-------------------------------+-------------------------------+                           |
|                                       |                                                           |
|                                       v                                                           |
|     +-------------------------------------------------------------------+                         |
|     |            Rule-Based Alert Evaluator & Database Storage          |                         |
|     |        (SQLite / PostgreSQL persistence via Async SQLAlchemy)     |                         |
|     +-------------------------------------------------------------------+                         |
+---------------------------------------------------------------------------------------------------+
```

---

## Python SDK (`infera-sdk`) Integration

Instrument your Python AI agents in just a few lines of code:

```bash
pip install -e sdk/
```

```python
from infera_sdk import Infera

# 1. Initialize Client
infera = Infera(
    endpoint="http://localhost:8000",
    api_key="dev-key",
    redact=["api_key", "authorization"]
)

# 2. Register Target Agent Profile
agent = infera.agent(
    id="A001",
    name="Customer Support Agent",
    agent_type="customer_support"
)

# 3. Context-Managed Tracing
with agent.session() as session:
    # Trace LLM reasoning step
    with session.trace(name="gpt-4o_reasoning", step_type="llm") as span:
        span.set_tokens(tokens=350, prompt_len=250, response_len=100)
        span.add_metadata("model", "gpt-4o")

    # Trace Tool execution step
    with session.trace(name="vector_kb_search", step_type="tool") as span:
        # Perform tool call logic...
        span.set_tokens(tokens=120)
        span.add_metadata("query", "reset password")

infera.flush()
```

> **Telemetry Scope Note**: Infera monitors applications instrumented via `infera-sdk` or the REST API. It **does NOT** spy on or automatically intercept un-instrumented third-party web browser applications (such as ChatGPT in a web browser) without code integration.

---

## Core Capabilities

1. **Idempotent Telemetry Ingress**: FastAPI endpoint equipped with `external_event_id` deduplication and source attribution (`simulator` vs `sdk`).
2. **10D Spatial-Temporal Feature Engineering**: Extracts numerical vectors ($\mathbf{x} \in \mathbb{R}^{10}$) measuring token deviations (z-scores), latencies, failure rates, compute velocity, and session age ratios.
3. **Unsupervised Isolation Forest Engine**: In-process ML detection trained on dense feature vectors to flag non-deterministic runtime anomalies without labeled datasets.
4. **Explainable Anomaly Reasons Engine**: Diagnostics module generating root-cause explanations (e.g. `Token usage 8.2× higher than baseline`, `IF score = -0.74`).
5. **Context-Aware Recommendations Engine**: Actionable remediation steps with priority levels (`critical`, `high`, `medium`, `low`).
6. **Agent Reliability Score (ARS)**: Quantitative composite index ($0 \text{--} 100$) evaluating agent stability:
   $$\text{ARS} = 0.40 \cdot S_{\text{tool}} + 0.20 \cdot S_{\text{token}} + 0.20 \cdot S_{\text{latency}} + 0.20 \cdot S_{\text{loop}}$$
7. **Session Replay & Step Trace Visualizer**: Step-by-step playback with execution timing, token usage, USD cost, and tool DAG highlights.
8. **Multi-Agent Simulation & Perturbation Framework**: Synthetic agent generator ($A_{001}, A_{002}, A_{003}$) with explicit fault injection (`token_spike`, `infinite_loop`, `high_latency`, `tool_failure_cascade`, `behavioral_drift`).

---

## Deployment & Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker Engine 24.0+ & Docker Compose v2.20+ (for containerized execution)

---

### Method 1: Containerized Execution (Recommended)

```bash
# 1. Environment Configuration
cp .env.example .env

# 2. Build and Deploy Containers
docker-compose up -d --build
```

- **Visual Analytics Command Center**: `http://localhost:3000`
- **OpenAPI / Swagger Documentation**: `http://localhost:8000/docs`
- **Default Credentials**: `admin` / `secret123`

---

### Method 2: Local Development Environment

#### Backend Setup

```bash
cd backend
python -m venv venv

# Activate Virtual Environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install Dependencies & Seed Initial Data
pip install -r requirements.txt
python -m app.scripts.seed_admin

# Launch ASGI Server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Test SDK Example Agent

```bash
pip install -e sdk/
python sdk/examples/basic_agent.py
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Repository Structure

```
Infera/
├── backend/
│   ├── app/
│   │   ├── main.py              # Application entry point and lifecycle manager
│   │   ├── config.py            # Platform configuration and environment binding
│   │   ├── database.py          # Asynchronous ORM engine setup
│   │   ├── models/              # Relational schemas (User, Agent, Telemetry, Alert)
│   │   ├── schemas/             # Data validation schemas (Pydantic)
│   │   ├── services/            # Alert evaluation, auth, scheduler
│   │   ├── ml/                  # 10D feature engineering & Isolation Forest estimator
│   │   ├── simulator/           # Synthetic agent telemetry and fault injectors
│   │   ├── routers/             # API endpoints (telemetry, enhanced, simulator, ml)
│   │   └── scripts/             # Administrative data seeding scripts
│   ├── alembic/                 # Database schema migration scripts
│   ├── requirements.txt         # Backend Python dependencies
│   └── Dockerfile               # Backend container recipe
├── sdk/
│   ├── infera_sdk/              # Official Python Telemetry & Tracing SDK
│   │   ├── client.py            # Client entry point
│   │   ├── tracer.py            # Context manager & span collector
│   │   ├── transport.py         # Asynchronous non-blocking HTTP transport
│   │   └── config.py            # Environment configuration
│   ├── examples/                # Example agent implementation scripts
│   ├── pyproject.toml           # SDK package manifest
│   └── README.md                # SDK documentation
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios HTTP client & interceptors
│   │   ├── context/             # Global Auth state provider
│   │   ├── hooks/               # Custom streaming telemetry hooks
│   │   ├── components/          # Reusable UI components (AnomalyLog, Timeline, DAGs)
│   │   └── pages/               # Views (Dashboard, AgentDetail, SessionDetail, Comparison)
│   ├── package.json             # Frontend dependency manifest
│   ├── vite.config.js           # Vite build configuration
│   └── Dockerfile               # Frontend container recipe
├── docker-compose.yml           # Multi-container orchestration specification
├── DOCUMENTATION.md             # Complete technical architecture documentation
├── .env.example                 # Environment configuration template
└── README.md                    # Project landing README
```

---

## Technical Documentation

For complete, in-depth architectural specs, mathematical derivations, API schemas, and feature engineering vector definitions, view [DOCUMENTATION.md](DOCUMENTATION.md).

---

## Citation & License

This software is released under the [MIT License](LICENSE).

```bibtex
@article{infera2026,
  title={Infera: Real-Time Telemetry, Explainable Anomaly Detection & Reliability Platform for Autonomous LLM Agents},
  author={Infera Research Team},
  year={2026},
  journal={Repository & Technical Report}
}
```
