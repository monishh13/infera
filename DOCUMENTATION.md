# Infera Platform: Technical Architecture, Python SDK & Working Documentation

---

## 1. System Overview & Problem Statement

**Infera** is a real-time observability, telemetry tracing, and unsupervised anomaly detection platform engineered specifically for autonomous **Large Language Model (LLM) agents**.

### The Observability Gap in Autonomous AI
Traditional Application Performance Monitoring (APM) systems (e.g., Datadog, Prometheus, Dynatrace) assume deterministic call graphs, standard request-response lifecycles, and predictable compute metrics. Autonomous LLM agents invalidate these core assumptions:
1. **Non-deterministic reasoning & tool orchestration**: An agent selects tools dynamically based on user prompts and intermediate tool outputs.
2. **Resource consumption spikes**: Token utilization can burst unexpectedly during recursive chain-of-thought planning.
3. **Behavioral pathologies**: AI agents fail in unique ways unknown to standard microservices—such as infinite tool reasoning loops, semantic drift, dependency failure cascades, hallucinations, and non-terminating sub-task loops.

### Infera Solution & Ecosystem Architecture
Infera bridges this gap through a multi-tier platform architecture:
- **`infera-sdk` Python Client**: Official lightweight, non-blocking telemetry & tracing client for Python AI applications (LangChain, LlamaIndex, OpenAI, AutoGen, or custom agent frameworks).
- **High-Throughput FastAPI Ingress Engine**: RESTful ingestion endpoint with idempotency checks (`external_event_id`) and multi-source telemetry routing (`simulator` vs `sdk`).
- **10-Dimensional Spatial-Temporal Feature Extraction**: Transforms heterogeneous event spans into dense 10D feature vectors ($\mathbf{x} \in \mathbb{R}^{10}$).
- **Online Unsupervised Machine Learning Models**: Isolation Forest (`IFModel`) and Local Outlier Factor (`LOFModel`) anomaly estimators operating without pre-labeled failure datasets.
- **Agent Reliability Score (ARS)**: A composite health index ($0 \text{--} 100$) evaluating real-time operational stability and calculating failure probabilities $P(\text{failure})$.
- **Synthetic Multi-Agent Simulator & Perturbation Engine**: Built-in simulator generating telemetry across 3 agent archetypes ($A_{001}, A_{002}, A_{003}$) with automated fault injection (`token_spike`, `infinite_loop`, `high_latency`, `tool_failure_cascade`, `behavioral_drift`).
- **Obsidian Dark Real-Time Analytics Command Center**: React 18 / Vite dashboard featuring Directed Acyclic Graph (DAG) tool visualizations, live telemetry streams, and session trace breakdowns.

> **Important Boundary & Scope Clarification**: Infera observes applications that send telemetry via the `infera-sdk` or REST API endpoints. It **does NOT** automatically capture un-instrumented third-party web browser applications (such as ChatGPT in a browser window) unless integrated via code or middleware.

---

## 2. High-Level Architecture & Multi-Source Ingestion Pipeline

```
+---------------------------------------------------------------------------------------------------+
|                                      INFERA PLATFORM ARCHITECTURE                                 |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +------------------------+      +------------------------+      +-----------------------------+  |
|  | Multi-Agent Simulator  |      | External Python Agent  |      |  React Observability Hub    |  |
|  | (Source: "simulator")  |      | (Using infera-sdk)     |      | (Visual DAG & Analytics)    |  |
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
|                   +-------------------+-------------------+                                       |
|                   |                                       |                                       |
|                   v                                       v                                       |
|     +---------------------------+           +---------------------------+                         |
|     | Isolation Forest Estimator|           |  Agent Reliability Score  |                         |
|     |  (Anomaly Score Calculation)          |    (ARS Composite Engine) |                         |
|     +---------------------------+           +---------------------------+                         |
|                   |                                       |                                       |
|                   +-------------------+-------------------+                                       |
|                                       |                                                           |
|                                       v                                                           |
|     +-------------------------------------------------------------------+                         |
|     |            Rule-Based Alert Evaluator & Database Storage          |                         |
|     |        (SQLite / PostgreSQL persistence via Async SQLAlchemy)     |                         |
|     +-------------------------------------------------------------------+                         |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Official `infera-sdk` Python Telemetry Library

Located under [`sdk/`](file:///d:/Study/projects/infera/infera/sdk/).

The `infera-sdk` provides an intuitive context manager and decorator-based tracing interface for Python AI agents.

### 3.1. Installation & Environment Configuration

```bash
pip install -e sdk/
```

| Environment Variable | Default Value | Description |
|---|---|---|
| `INFERA_ENDPOINT` | `http://localhost:8000` | Target FastAPI backend URL |
| `INFERA_API_KEY` | `dev-key` | Authentication API key |
| `INFERA_ENVIRONMENT` | `development` | Environment label (`development`, `staging`, `production`) |

---

### 3.2. Integration Code Example

```python
from infera_sdk import Infera

# 1. Initialize global Infera client
infera = Infera(
    endpoint="http://localhost:8000",
    api_key="dev-key",
    redact=["api_key", "authorization", "password"]
)

# 2. Register / Bind target agent profile
agent = infera.agent(
    id="A001",
    name="Customer Support Agent",
    agent_type="customer_support"
)

# 3. Context-Managed Execution Tracing
with agent.session() as session:
    # Trace LLM Reasoning Step
    with session.trace(name="gpt-4o_reasoning", step_type="llm") as span:
        span.set_tokens(tokens=350, prompt_len=250, response_len=100)
        span.add_metadata("model", "gpt-4o")

    # Trace Tool Call Step
    with session.trace(name="vector_kb_search", step_type="tool") as span:
        # Tool execution logic...
        span.set_tokens(tokens=120)
        span.add_metadata("query", "reset password")

# Flush buffered spans to backend
infera.flush()
```

---

### 3.3. Key SDK Architecture Features

1. **Automatic Latency Measurement**: Every `session.trace()` block measures execution duration in milliseconds (`latency_ms`) automatically upon exit.
2. **Asynchronous Non-Blocking Transport**: Spans are collected in a thread-safe queue and dispatched in batches by background worker threads ([`sdk/infera_sdk/transport.py`](file:///d:/Study/projects/infera/infera/sdk/infera_sdk/transport.py)).
3. **Resilient Error Boundary**: Telemetry network errors or server downtime will **never** crash your primary Python application logic.
4. **Unhandled Exception Interception**: Unhandled exceptions inside a trace block automatically mark step status as `FAILURE`, log the error stack summary, and safely re-raise the exception to host code.
5. **Metadata Redaction Engine**: Keys matching sensitive strings (`api_key`, `secret`, `password`, `authorization`) are automatically masked prior to payload transmission.

---

## 4. Telemetry Processing & Idempotency Pipeline

Located in [`backend/app/routers/telemetry.py`](file:///d:/Study/projects/infera/infera/backend/app/routers/telemetry.py):

```python
async def process_single_telemetry(req: TelemetryIngestRequest, db: AsyncSession):
    # 0. Idempotency Guard (Prevents duplicate processing on HTTP retries)
    if req.external_event_id:
        stmt_existing = select(TelemetryEvent).where(
            TelemetryEvent.external_event_id == req.external_event_id
        )
        existing_ev = (await db.execute(stmt_existing)).scalars().first()
        if existing_ev:
            return TelemetryIngestResponse(
                event_id=existing_ev.id,
                anomaly_score=round(existing_ev.anomaly_score or 0.0, 4),
                is_anomaly=existing_ev.is_anomaly,
                alert_generated=False,
                reliability_score=100.0
            )

    source_val = req.source or "simulator"
    # Proceed with Agent/Session lookup, feature extraction, ML scoring, and DB persistence...
```

### Ingestion Lifecycle Steps:
1. **Idempotency Verification**: If `external_event_id` is supplied, duplicate payload execution is bypassed.
2. **Source Tagging**: Requests tag `source="sdk"` or `source="simulator"` on `Agent`, `Session`, and `TelemetryEvent` records.
3. **Historical Window Fetch**: Fetches the latest 50 events for the agent to construct moving statistical baselines.
4. **10D Feature Engineering**: Computes numerical features across token deviations, latencies, loop rates, and throughput.
5. **Isolation Forest Model Scoring**: Transformed via `StandardScaler` and evaluated using `IFModel.score(...)`.
6. **Session & Aggregates Update**: Increments session token totals, tool counts, failure tallies, and estimated USD costs.
7. **Alert Evaluation & Dynamic Thresholds**: Checks for critical conditions (Token Spikes, Failure Cascades, Infinite Loops).
8. **Agent Reliability Score Calculation**: Re-computes real-time ARS ($0\text{--}100$) and failure probability $P(\text{failure})$.

---

## 5. 10-Dimensional Spatial-Temporal Feature Engineering

In [`backend/app/ml/feature_engineering.py`](file:///d:/Study/projects/infera/infera/backend/app/ml/feature_engineering.py), telemetry events are transformed into feature vector $\mathbf{x} \in \mathbb{R}^{10}$:

| Index | Feature | Mathematical Expression | Description |
|---|---|---|---|
| $f_1$ | `tokens` | $T_i$ | Raw token usage count |
| $f_2$ | `tokens_zscore` | $\frac{T_i - \mu_T}{\sigma_T + 10^{-6}}$ | Standard score relative to agent token history |
| $f_3$ | `latency` | $L_i$ | Execution duration in milliseconds |
| $f_4$ | `latency_zscore` | $\frac{L_i - \mu_L}{\sigma_L + 10^{-6}}$ | Standard score relative to agent latency history |
| $f_5$ | `loop_count` | $N_{\text{loop}}$ | Sub-step loop iteration count |
| $f_6$ | `is_failure` | $\mathbb{I}(\text{status} \neq \text{"SUCCESS"})$ | Binary failure flag ($1.0$ or $0.0$) |
| $f_7$ | `tokens_per_ms` | $\frac{T_i}{L_i + 10^{-6}}$ | Compute consumption velocity |
| $f_8$ | `rolling_fail_rate` | $\frac{1}{10}\sum_{k=i-9}^i f_{6,k}$ | Moving average failure rate over last 10 steps |
| $f_9$ | `rolling_avg_tokens` | $\frac{1}{10}\sum_{k=i-9}^i T_k$ | Moving average token consumption over last 10 steps |
| $f_{10}$ | `session_age_ratio` | $\min\left(1.0, \frac{\text{step\_count}}{100}\right)$ | Normalized session lifetime progression ratio |

---

## 6. Machine Learning Anomaly Detection Architecture

### Primary Estimator: Isolation Forest (`IFModel`)
Located in [`backend/app/ml/isolation_forest.py`](file:///d:/Study/projects/infera/infera/backend/app/ml/isolation_forest.py):
- **Algorithm**: `sklearn.ensemble.IsolationForest`
- **Config**: `n_estimators=100`, `contamination=0.05`, `random_state=42`, `n_jobs=-1`
- **Scoring & Classification**:
  - `score_samples(X)` yields decision values (lower = more anomalous).
  - Anomaly condition: `predict(X) == -1` OR `score < -0.5`.
  - Heuristic Cold-Start Fallback: Applies when historical events $< 10$:
    $$\text{is\_anomaly} = (T_i > 500) \lor (L_i > L_{\text{threshold}}) \lor (N_{\text{loop}} \ge N_{\text{threshold}})$$

### Secondary Estimator: Local Outlier Factor (`LOFModel`)
Located in [`backend/app/ml/lof_baseline.py`](file:///d:/Study/projects/infera/infera/backend/app/ml/lof_baseline.py):
- `LocalOutlierFactor(n_neighbors=20, contamination=0.05, novelty=True)` used for benchmark model comparison via `/api/v1/ml/compare`.

---

## 7. Agent Reliability Score (ARS) & Dynamic Risk Engine

Located in [`backend/app/ml/reliability_score.py`](file:///d:/Study/projects/infera/infera/backend/app/ml/reliability_score.py):

$$\text{ARS} = \Big(0.40 \cdot S_{\text{tool}} + 0.20 \cdot S_{\text{token}} + 0.20 \cdot S_{\text{latency}} + 0.20 \cdot S_{\text{loop}}\Big) \times 100$$

### Sub-Score Definitions:
1. **Tool Success Rate**: $S_{\text{tool}} = \frac{\text{successful\_calls}}{\text{total\_calls}}$
2. **Token Efficiency**: $S_{\text{token}} = \min\left(\frac{\text{expected\_tokens}}{\max(\text{actual\_tokens}, 1.0)}, 1.0\right)$
3. **Latency Score**: $S_{\text{latency}} = \max\left(0.0, 1.0 - \frac{\max(0.0, \frac{\text{avg\_lat}}{\text{base\_lat}} - 1.0)}{2.0}\right)$
4. **Loop Frequency Score**: $S_{\text{loop}} = \max\left(0.0, 1.0 - \max(0.0, \text{avg\_loop} - 1.0) \times 0.1\right)$

### Risk Matrix & Non-Linear Failure Prediction

| Score Range | Risk Level | Failure Probability Formula $P(\text{failure})$ |
|---|---|---|
| $85 \le \text{ARS} \le 100$ | `LOW` | $\max\left(0.01, \frac{100 - \text{ARS}}{300}\right)$ |
| $65 \le \text{ARS} < 85$ | `MEDIUM` | $0.05 + (85 - \text{ARS}) \times 0.0075$ |
| $40 \le \text{ARS} < 65$ | `HIGH` | $0.20 + (65 - \text{ARS}) \times 0.012$ |
| $0 \le \text{ARS} < 40$ | `CRITICAL` | $\min\left(0.95, 0.50 + (40 - \text{ARS}) \times 0.01125\right)$ |

---

## 8. Multi-Agent Simulator & Perturbation Framework

Located in [`backend/app/simulator/`](file:///d:/Study/projects/infera/infera/backend/app/simulator/):

### Synthetic Archetypes
- **Customer Support Agent (`A001`)**: High frequency, low latency, token light (~200-400 tokens/event).
- **Deep Research Agent (`A002`)**: Heavy reasoning, high latency, token intensive (~1500-3000 tokens/event).
- **Sales Representative Agent (`A003`)**: Multi-step interactive tool workflow (~300-600 tokens/event).

### Fault Injectors ([`simulator/anomaly_injector.py`](file:///d:/Study/projects/infera/infera/backend/app/simulator/anomaly_injector.py))
- `token_spike`: Spikes token consumption by $8\times$.
- `infinite_loop`: Overrides loop count to $4\text{--}8$ recursive iterations.
- `high_latency`: Multiplies execution duration by $6\times$.
- `tool_failure_cascade`: Forces step failure status with error stack traces.
- `behavioral_drift`: Gradually increases token usage and latency by $+8\%$ per step.

---

## 9. Database Data Models & Schema

Updated SQLAlchemy database models:

```
                      +-------------------+
                      |       User        |
                      +-------------------+
                      | id (PK)           |
                      | username (Unique) |
                      | hashed_password   |
                      | role              |
                      +-------------------+
                                |
                                v
                      +-------------------+
                      |       Agent       |
                      +-------------------+
                      | id (PK)           |
                      | name              |
                      | type              |
                      | status            |
                      | source (NEW)      |  <-- "simulator" | "sdk"
                      | token_budget      |
                      | latency_thresh_ms |
                      +-------------------+
                                |
             +------------------+------------------+
             |                                     |
             v                                     v
   +-------------------+                 +-------------------+
   |      Session      |                 |   TelemetryEvent  |
   +-------------------+                 +-------------------+
   | id (PK)           |                 | id (PK)           |
   | agent_id (FK)     |                 | agent_id (FK)     |
   | source (NEW)      |                 | session_id (FK)   |
   | total_tokens      |                 | source (NEW)      |  <-- "simulator" | "sdk"
   | total_cost_usd    |                 | external_event_id |  <-- Idempotency key
   | total_tool_calls  |                 | timestamp         |
   | failed_tool_calls |                 | tokens_used       |
   +-------------------+                 | latency_ms        |
             |                           | status            |
             v                           | anomaly_score     |
   +---------------------------+         | is_anomaly        |
   |  AgentReliabilityScore    |         +-------------------+
   +---------------------------+                   |
   | id (PK)                   |                   v
   | agent_id (FK)             |         +-------------------+
   | score (0-100)             |         |       Alert       |
   | risk_level                |         +-------------------+
   | predicted_failure_prob    |         | id (PK)           |
   +---------------------------+         | agent_id (FK)     |
                                         | alert_type        |
                                         | severity          |
                                         +-------------------+
```

---

## 10. Visual Analytics Command Center (Frontend)

React 18 / Vite frontend located in [`frontend/src/`](file:///d:/Study/projects/infera/infera/frontend/src/):

- **Obsidian Obsidian Dark Design System**: Defined in [`frontend/src/index.css`](file:///d:/Study/projects/infera/infera/frontend/src/index.css) using CSS design tokens, glowing risk status indicators, and smooth animations.
- **Source Attribution Badges**: UI components display clear `SDK` vs `SIMULATOR` badges on Agent cards, event timelines, and session details.
- **Interactive DAG Tool Graph**: Rendered via SVG/Canvas showing tool transitions, execution counts, latency averages, and error nodes.
- **Real-Time Data Hooks**: Custom hooks (`useTelemetryStream`, `useMetricsData`) polling backend API endpoints for live chart updates.

---

## 11. Complete System API Endpoint Index

### Auth (`/api/v1/auth`)
- `POST /login`: Authenticates user and returns JWT bearer token.
- `GET /me`: Returns logged-in user profile.

### Telemetry (`/api/v1/telemetry`)
- `POST /ingest`: Ingests single telemetry payload with idempotency check (`external_event_id`).
- `POST /batch`: Batch telemetry ingestion endpoint.
- `GET /history/{agent_id}`: Paginated event history for target agent.

### Agents & Sessions (`/api/v1/agents`, `/api/v1/sessions`)
- `GET /agents`: Fleet agent list with health status and source badges.
- `GET /agents/{id}`: Detailed telemetry metrics and thresholds for target agent.
- `GET /sessions`: Active and historical session list.
- `GET /sessions/{id}`: Step-by-step trace timeline for target session.

### Simulator (`/api/v1/simulator`)
- `POST /start`: Starts background agent simulator loops.
- `POST /stop`: Stops background simulation task.
- `POST /inject-anomaly`: Injects target anomaly perturbation into simulator agent.

### Machine Learning (`/api/v1/ml`)
- `GET /model/stats`: Active model hyper-parameters and feature statistics.
- `POST /model/retrain`: Manually triggers model retraining on stored telemetry vectors.
- `GET /compare`: Benchmark comparison between Isolation Forest and Local Outlier Factor.

---

## 12. Deployment & Execution Instructions

### Local Development Setup

#### Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m app.scripts.seed_admin
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### SDK Quickstart Test
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

#### Containerized Execution (Docker Compose)
```bash
docker-compose up -d --build
```
- React Dashboard: `http://localhost:3000` (or `http://localhost:5173` in Vite dev mode)
- API Documentation (Swagger): `http://localhost:8000/docs`
