# Infera Platform: Technical Architecture, Python SDK & Working Documentation

---

## 1. System Overview & Problem Statement

**Infera** is a real-time observability, telemetry tracing, explainable anomaly detection, and reliability engineering platform designed specifically for autonomous **Large Language Model (LLM) agents**.

### The Observability Gap in Autonomous AI
Traditional Application Performance Monitoring (APM) systems (e.g., Datadog, Prometheus, Dynatrace) assume deterministic call graphs, standard request-response lifecycles, and predictable compute metrics. Autonomous LLM agents invalidate these core assumptions:
1. **Non-deterministic reasoning & tool orchestration**: An agent selects tools dynamically based on user prompts and intermediate tool outputs.
2. **Resource consumption spikes**: Token utilization can burst unexpectedly during recursive chain-of-thought planning.
3. **Behavioral pathologies**: AI agents fail in unique ways unknown to standard microservices — such as infinite tool reasoning loops, semantic drift, dependency failure cascades, hallucinations, and non-terminating sub-task loops.

### Infera Solution & Ecosystem Architecture
Infera bridges this gap through a multi-tier platform architecture:
- **`infera-sdk` Python Client**: Official lightweight, non-blocking telemetry & tracing client for Python AI applications (LangChain, LlamaIndex, OpenAI, AutoGen, or custom agent frameworks).
- **High-Throughput FastAPI Ingress Engine**: RESTful ingestion endpoint with idempotency checks (`external_event_id`) and multi-source telemetry routing (`simulator` vs `sdk`).
- **10-Dimensional Spatial-Temporal Feature Extraction**: Transforms heterogeneous event spans into dense 10D feature vectors ($\mathbf{x} \in \mathbb{R}^{10}$).
- **Online Unsupervised Machine Learning Models**: Isolation Forest (`IFModel`) and Local Outlier Factor (`LOFModel`) anomaly estimators operating without pre-labeled failure datasets.
- **Explainable Anomaly Detection Engine**: Root-cause diagnostic generator translating ML anomaly scores and telemetry deviations into human-readable explanatory reasons.
- **Context-Aware Action Recommendations Engine**: Automated remediation engine mapping anomaly alert types to priority-ranked action items (`critical`, `high`, `medium`, `low`).
- **Agent Reliability Score (ARS)**: A composite health index ($0\text{--}100$) evaluating real-time operational stability and calculating failure probabilities $P(\text{failure})$.
- **Session Replay & Trace Analysis Engine**: Step-by-step interactive replay module visualizing complete agent reasoning traces, latency bottlenecks, and per-step token/USD costs.
- **Synthetic Multi-Agent Simulator & Perturbation Engine**: Built-in simulator generating telemetry across 4 agent archetypes ($A_{001}$–$A_{004}$) with automated fault injection (`token_spike`, `infinite_loop`, `high_latency`, `tool_failure_cascade`, `behavioral_drift`).
- **Real LLM Agent (A004 / Groq)**: A live agent backed by Groq's inference API (`llama-3.1-8b-instant`) that emits genuine token counts, latency, and status measurements from real LLM calls.
- **Obsidian Dark Real-Time Analytics Command Center**: React 18 / Vite dashboard featuring Directed Acyclic Graph (DAG) tool visualizations, live telemetry streams, explainable alerts, session replays, agent comparison matrices, and a Real Agent Playground.

> **Important Boundary & Scope Clarification**: Infera observes applications that send telemetry via the `infera-sdk` or REST API endpoints. It **does NOT** automatically capture un-instrumented third-party web browser applications (such as ChatGPT in a browser window) unless integrated via code or middleware.

---

## 2. High-Level Architecture & Multi-Source Ingestion Pipeline

```
+---------------------------------------------------------------------------------------------------+
|                                      INFERA PLATFORM ARCHITECTURE                                 |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +------------------------+   +------------------------+   +----------------------------+         |
|  | Multi-Agent Simulator  |   | External Python Agent  |   |  React Observability Hub   |         |
|  | A001/A002/A003/A004    |   | (Using infera-sdk)     |   | (Session Replay & DAGs)   |         |
|  +------------------------+   +------------------------+   +----------------------------+         |
|               |                          |                              ^                         |
|               v                          v                              |                         |
|     +-------------------------------------------------------------------+   (REST / Poll)         |
|     |           FastAPI Ingress Endpoint (Idempotency Check)            +--------+                |
|     |      POST /api/v1/telemetry/ingest  (external_event_id)           |        |                |
|     +-------------------------------------------------------------------+        |                |
|                                       |                                                           |
|                                       v                                                           |
|     +-------------------------------------------------------------------+                         |
|     |          Session State Manager & Source Attribution Engine        |                         |
|     |        (Attributes source: "simulator" | "sdk", Updates Session)  |                         |
|     +-------------------------------------------------------------------+                         |
|                                       |                                                           |
|                                       v                                                           |
|     +-------------------------------------------------------------------+                         |
|     |              10D Feature Engineering Matrix Engine                |                         |
|     |    (Tokens, Latency, Z-Scores, Velocity, Failure Rate, Age Ratio) |                         |
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
|     |        (PostgreSQL persistence via Async SQLAlchemy)              |                         |
|     +-------------------------------------------------------------------+                         |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Official `infera-sdk` Python Telemetry Library

Located under [`sdk/`](sdk/).

The `infera-sdk` provides an intuitive context-manager and decorator-based tracing interface for Python AI agents.

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

### 3.3. SDK Architecture

The SDK exposes three tracer classes — all imported from `infera_sdk`:

| Class | Role |
|---|---|
| `Infera` | Top-level client; bootstraps config, transport, and agent registration |
| `AgentTracer` | Bound to an agent ID; creates `SessionTracer` instances via `.session()` |
| `SessionTracer` | Context manager for a single execution session; creates `SpanTracer` instances via `.trace()` |
| `SpanTracer` | Context manager for a single step / tool call; measures latency and collects token data |

Key SDK architecture features:
1. **Automatic Latency Measurement**: Every `session.trace()` block measures `latency_ms` automatically on exit.
2. **Asynchronous Non-Blocking Transport**: Spans are queued and dispatched in batches by background worker threads ([`sdk/infera_sdk/transport.py`](sdk/infera_sdk/transport.py)).
3. **Resilient Error Boundary**: Telemetry network errors **never** crash primary application logic.
4. **Unhandled Exception Interception**: Exceptions inside a trace block auto-set `status = "FAILURE"` and safely re-raise.
5. **Metadata Redaction Engine**: Keys matching `api_key`, `secret`, `password`, `authorization` are masked before transmission.
6. **Session Auto-Flush**: The `SessionTracer.__exit__` method automatically calls `transport.flush()` when the session ends.

---

## 4. Telemetry Processing & Idempotency Pipeline

Located in [`backend/app/routers/telemetry.py`](backend/app/routers/telemetry.py):

The `process_single_telemetry(req, db)` function is the core ingestion pipeline:

1. **Idempotency Guard** — Returns early if `external_event_id` already exists in the database.
2. **Agent Lookup / Auto-Provision** — Fetches the registered `Agent` record; raises HTTP 404 if not found (unless `ALLOW_AUTO_PROVISION_AGENTS=True`).
3. **Session Lookup / Creation** — Fetches or creates the `Session` associated with `session_id`.
4. **Feature Extraction** — Calls `extract_features(event_dict, hist_dicts)` to produce a 10D vector from the event and last 50 historical events.
5. **ML Scoring** — Runs the active `IFModel` (agent-specific → falls back to global); uses a heuristic rule if the model has not been trained yet.
6. **TelemetryEvent Persistence** — Writes a new `TelemetryEvent` record with anomaly score & flag.
7. **Session Statistics Update** — Increments `total_tokens`, `total_cost_usd`, `total_tool_calls`, `failed_tool_calls`.
8. **Alert Evaluation** — Calls `check_and_create_alert(...)` for rule-based and ML-based alert generation.
9. **ARS Computation** — Recalculates `AgentReliabilityScore` and persists it.

```python
# POST /api/v1/telemetry/ingest — unauthenticated (supports lightweight SDK clients)
# POST /api/v1/telemetry/batch  — unauthenticated batch ingestion
# GET  /api/v1/telemetry/{agent_id}        — authenticated; returns paginated event list
# GET  /api/v1/telemetry/{agent_id}/stats  — authenticated; returns aggregate stats
```

---

## 5. Alert Classification & Rule Engine

Located in [`backend/app/services/alert_service.py`](backend/app/services/alert_service.py):

The rule engine runs on every ingestion and evaluates events in priority order:

| Priority | Rule | Alert Type | Severity |
|---|---|---|---|
| 1 | `loop_count >= agent.loop_threshold` | `infinite_loop` | `CRITICAL` |
| 2 | `rolling_fail_count >= 5` OR (`status == FAILURE` AND `rolling_fail_count >= 3`) | `tool_failure_cascade` | `CRITICAL` |
| 3 (ML) | `is_anomaly` AND `tokens_used > 20% token_budget` | `token_spike` | `CRITICAL / WARNING / INFO` |
| 3 (ML) | `is_anomaly` AND `latency_ms > latency_threshold_ms` | `high_latency` | `CRITICAL / WARNING / INFO` |
| 3 (ML) | `is_anomaly` (catch-all) | `behavioral_drift` | `CRITICAL / WARNING / INFO` |

ML alert severity is determined by `anomaly_score`:
- `score <= -0.7` → `CRITICAL`
- `score <= -0.55` → `WARNING`
- otherwise → `INFO`

---

## 6. Explainable Anomaly Detection & Recommendation Engines

Located in [`backend/app/routers/enhanced.py`](backend/app/routers/enhanced.py):

### 6.1. Explainable Anomaly Reasons Engine

`GET /api/v1/enhanced/alerts/{alert_id}/reasons`

When an anomaly alert fires, Infera generates root-cause diagnostic explanations comparing the event to historical baselines:

| Diagnostic Indicator | Detection Condition | Example Output |
|---|---|---|
| **Isolation Forest Score** | `anomaly_score < -0.5` | `IF score = -0.74 (lower is more anomalous)` |
| **Token Usage Spike** | `tokens_used > 2× avg_tokens` | `Token usage 8.2× higher than baseline (1850 vs avg 225)` |
| **High Execution Latency** | `latency_ms > 2× avg_latency` | `Latency 6.4× above average (3200ms vs avg 500ms)` |
| **Tool Execution Failure** | `status in ["FAILURE", "TIMEOUT"]` | `Tool 'vector_search' returned status: FAILURE` |
| **Excessive Looping** | `loop_count > 3` | `Loop count reached 7 iterations` |
| **Threshold Violation** | `latency_ms > agent.latency_threshold_ms` | `Configured threshold: 1000ms, actual: 3200ms` |
| **Alert Type Reason** | Always appended | Pattern-specific label (e.g., `Tool Failure Cascade`) |

`GET /api/v1/enhanced/alerts/recent-explained` — Returns recent alerts pre-annotated with reasons.

---

### 6.2. Context-Aware Recommendations Engine

`GET /api/v1/enhanced/alerts/{alert_id}/recommendations`

Maps specific anomaly patterns to prioritized remediation actions:

| Alert Pattern | Priority | Action |
|---|---|---|
| `token_spike` | `high` | Reduce Token Budget |
| `token_spike` | `high` | Inspect Prompt Template |
| `token_spike` | `medium` | Review Model Selection |
| `high_latency` | `high` | Review API Timeout |
| `high_latency` | `high` | Check External Services |
| `high_latency` | `medium` | Scale Infrastructure |
| `infinite_loop` | `critical` | Restart Session |
| `infinite_loop` | `high` | Review Loop Guard |
| `infinite_loop` | `high` | Inspect Agent Logic |
| `tool_failure_cascade` | `critical` | Investigate Tool Failure |
| `tool_failure_cascade` | `high` | Check Service Status |
| `tool_failure_cascade` | `medium` | Enable Fallback Tools |
| `behavioral_drift` | `high` | Retrain ML Model |
| `behavioral_drift` | `medium` | Review Agent Configuration |
| `behavioral_drift` | `medium` | Analyze Historical Patterns |

---

## 7. Agent Health Report

`GET /api/v1/enhanced/agents/{agent_id}/health`

Returns a comprehensive health profile including:
- `overall_health` / `reliability_score` (0–100)
- `risk_level`: `LOW | MEDIUM | HIGH | CRITICAL`
- `status`: `healthy | degraded | at_risk | critical`
- `trend`: `improving | stable | degrading` (derived from last 6 ARS records)
- `tool_success_rate`, `avg_latency`, `avg_tokens`, `token_efficiency`, `failure_probability`, `loop_frequency`
- `top_reasons`: list of health sub-score degradations (e.g., tool failures, high latency, token inefficiency, excessive looping)
- `reliability_trend`: last 20 ARS time-series data points
- `latency_trend` / `token_trend`: last 50 telemetry events

---

## 8. Metric Trend Detection & Baseline Comparison

`GET /api/v1/enhanced/agents/{agent_id}/trends`

Compares a 1-hour recent window against the 24-hour historical baseline:

$$\Delta\% = \left(\frac{\text{recent\_value} - \text{baseline\_value}}{\max(|\text{baseline\_value}|, 0.001)}\right) \times 100$$

Returns five trend objects — each with `current`, `baseline`, `unit`, `direction` (`increasing | stable | decreasing`), `change_pct`, and `improving_direction`:

| Metric | Unit | Improving Direction |
|---|---|---|
| Latency | ms | decreasing |
| Token Usage | tokens | decreasing |
| Reliability | % | increasing |
| Cost | USD/hr | decreasing |
| Failure Rate | % | decreasing |

---

## 9. Multi-Agent Comparison Matrix

`GET /api/v1/enhanced/agents/compare?agent_ids=A001,A002,A003`

Returns side-by-side benchmarking data for comma-separated agent IDs:
- `reliability` (0–100), `avg_latency`, `avg_tokens`
- `tool_success_rate` (%), `failure_rate` (%)
- `total_cost` (USD cumulative), `avg_loop_count`
- `risk_level`

Frontend page: [`frontend/src/pages/AgentComparison.jsx`](frontend/src/pages/AgentComparison.jsx)

---

## 10. Session Replay & Interactive Step Trace Analysis

`GET /api/v1/enhanced/sessions/{session_id}/detail`

Returns comprehensive session data:
- Session metadata: `status`, `started_at`, `ended_at`, `agent_name`
- Per-event step list (ordered by timestamp): `step`, `tool_name`, `tokens_used`, `latency_ms`, `status`, `loop_count`, `cost_usd`, `anomaly_score`, `is_anomaly`, `error_message`, `prompt_length`, `response_length`
- Aggregate stats: `total_events`, `total_tokens`, `total_cost_usd`, `avg_latency_ms`, `execution_duration_ms`, `total_tools_used`, `retries`, `failure_count`

Frontend page: [`frontend/src/pages/SessionDetail.jsx`](frontend/src/pages/SessionDetail.jsx)

---

## 11. 13-Dimensional Spatial-Temporal Feature Engineering

In [`backend/app/ml/feature_engineering.py`](backend/app/ml/feature_engineering.py), telemetry events are transformed into a feature vector $\mathbf{x} \in \mathbb{R}^{13}$:

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
| $f_{11}$ | `cost_per_token` | $\frac{\text{cost}_i}{\max(T_i, 1.0)}$ | Cost anomalies independent of token volume |
| $f_{12}$ | `prompt_response_ratio` | $\frac{\text{prompt\_length}_i}{\max(\text{response\_length}_i, 1.0)}$ | Ratio detecting degenerate or empty outputs |
| $f_{13}$ | `rolling_latency_cv` | $\frac{\sigma_{L,\text{last10}}}{\mu_{L,\text{last10}} + 10^{-6}}$ | Coefficient of variation for rolling execution latency |

History vectors are derived from the last **50** events fetched from the database.

---

## 12. Machine Learning Anomaly Detection Architecture

### Primary Estimator: Isolation Forest (`IFModel`)
Located in [`backend/app/ml/isolation_forest.py`](backend/app/ml/isolation_forest.py):
- **Algorithm**: `sklearn.ensemble.IsolationForest`
- **Scaler**: `sklearn.preprocessing.RobustScaler` (quantile/IQR based to resist extreme outliers)
- **Config**: `n_estimators=200`, dynamic `contamination` (bounded to $[0.01, 0.15]$), `random_state=42`, `n_jobs=-1`
- **Scoring & Classification**:
  - `score_samples(X)` yields decision values (lower = more anomalous).
  - Anomaly condition: `predict(X) == -1` OR `score < -0.5`.
  - Heuristic cold-start fallback when historical events < 200:
    $$\text{is\_anomaly} = (T_i > 500) \lor (L_i > L_{\text{threshold}}) \lor (N_{\text{loop}} \ge N_{\text{threshold}})$$

### Secondary Estimator: Local Outlier Factor (`LOFModel`)
Located in [`backend/app/ml/lof_baseline.py`](backend/app/ml/lof_baseline.py):
- `LocalOutlierFactor(n_neighbors=20, contamination=0.05, novelty=True)` using `RobustScaler` for benchmark comparison via `GET /api/v1/ml/compare`.

### Model Store
Located in [`backend/app/ml/model_store.py`](backend/app/ml/model_store.py):
- Maintains a global model registry keyed by `agent_id` (or `None` for the global model).
- Models are serialized to `backend/models/` using `joblib`.
- `get_active_model(agent_id)` performs agent-specific → global fallback lookup.

### Periodic Retraining Scheduler & Dynamic Evaluation Harness
Located in [`backend/app/services/scheduler.py`](backend/app/services/scheduler.py):
- Uses **APScheduler** (`AsyncIOScheduler`) to run `retrain_models_job()` every `MODEL_RETRAIN_INTERVAL_MINUTES` (default: 30).
- Requires ≥ 200 events; fetches up to 5000 events and extracts 13D feature matrix.
- Computes actual contamination rate from historical failure proportion (clamped to $[0.01, 0.15]$).
- Performs an 80/20 chronological train/eval split to evaluate true **Precision**, **Recall**, and **F1** scores using ground-truth failure pseudo-labels.
- Automatically retrains specialized per-agent models for any agent with ≥ 200 historical events.
- Persists `MLModelMetadata` records with dynamically calculated metrics to DB.

---

## 13. Agent Reliability Score (ARS) & Dynamic Risk Engine

Located in [`backend/app/ml/reliability_score.py`](backend/app/ml/reliability_score.py):

$$\text{ARS} = \Big(0.40 \cdot S_{\text{tool}} + 0.20 \cdot S_{\text{token}} + 0.20 \cdot S_{\text{latency}} + 0.20 \cdot S_{\text{loop}}\Big) \times 100$$

### Sub-Score Definitions:
1. **Tool Success Rate**: $S_{\text{tool}} = \frac{\text{successful\_calls}}{\text{total\_calls}}$
2. **Token Efficiency**: $S_{\text{token}} = \min\left(\frac{\text{expected\_tokens}}{\max(\text{actual\_tokens}, 1.0)}, 1.0\right)$
3. **Latency Score**: $S_{\text{latency}} = \max\left(0.0, 1.0 - \frac{\max(0.0, \frac{\text{avg\_lat}}{\text{base\_lat}} - 1.0)}{2.0}\right)$
4. **Loop Frequency Score**: $S_{\text{loop}} = \max\left(0.0, 1.0 - \max(0.0, \text{avg\_loop} - 1.0) \times 0.1\right)$

`baseline_latency` is derived as `agent.latency_threshold_ms / 2.0`.

### Risk Matrix & Non-Linear Failure Prediction

| Score Range | Risk Level | Failure Probability Formula $P(\text{failure})$ |
|---|---|---|
| $85 \le \text{ARS} \le 100$ | `LOW` | $\max\left(0.01, \frac{100 - \text{ARS}}{300}\right)$ |
| $65 \le \text{ARS} < 85$ | `MEDIUM` | $0.05 + (85 - \text{ARS}) \times 0.0075$ |
| $40 \le \text{ARS} < 65$ | `HIGH` | $0.20 + (65 - \text{ARS}) \times 0.012$ |
| $0 \le \text{ARS} < 40$ | `CRITICAL` | $\min\left(0.95, 0.50 + (40 - \text{ARS}) \times 0.01125\right)$ |

---

## 14. Multi-Agent Simulator & Perturbation Framework

Located in [`backend/app/simulator/`](backend/app/simulator/):

### Synthetic Agent Archetypes

| Agent ID | Name | Type | Token Budget | Tick Interval |
|---|---|---|---|---|
| `A001` | Customer Support Agent | `customer_support` | 2,000 | 2.0 s |
| `A002` | Deep Research Agent | `research` | 8,000 | 2.0 s |
| `A003` | Sales Representative Agent | `sales` | 4,000 | 2.0 s |
| `A004` | Real LLM Agent (Groq) | `real_llm` | 5,000 | 5.0 s |

**A001** — High frequency, low latency, token light (~200–400 tokens/event).  
**A002** — Heavy reasoning, high latency, token intensive (~1500–3000 tokens/event).  
**A003** — Multi-step interactive tool workflow (~300–600 tokens/event).  
**A004** — Live Groq API-backed agent; executes a 4-step pipeline: `weather_lookup → currency_converter → database_search → text_summarizer`. Falls back to `FAILURE` telemetry if `GROQ_API_KEY` is missing.

### Fault Injectors ([`simulator/anomaly_injector.py`](backend/app/simulator/anomaly_injector.py))
- `token_spike`: Spikes token consumption by $8\times$.
- `infinite_loop`: Overrides loop count to $4\text{--}8$ recursive iterations.
- `high_latency`: Multiplies execution duration by $6\times$.
- `tool_failure_cascade`: Forces step failure status with error stack traces.
- `behavioral_drift`: Gradually increases token usage and latency by $+8\%$ per step.

### Simulator API
```
POST /api/v1/simulator/start          — Start all 4 agent loops
POST /api/v1/simulator/stop           — Stop all agents and cancel tasks
GET  /api/v1/simulator/status         — Per-agent RUNNING/STOPPED status & event count
POST /api/v1/simulator/inject-anomaly — Inject a fault into a specific agent
POST /api/v1/simulator/real-llm/execute — Trigger a single Real LLM (A004) step
```

---

## 15. Authentication & User Management

Located in [`backend/app/routers/auth.py`](backend/app/routers/auth.py) and [`backend/app/services/auth_service.py`](backend/app/services/auth_service.py):

- **JWT-based authentication**: `python-jose` with HS256 signing.
- **Access token**: expires in `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 30).
- **Refresh token**: expires in `REFRESH_TOKEN_EXPIRE_DAYS` (default: 7).
- **Password hashing**: `passlib[bcrypt]`.
- Default seeded admin credentials: `admin` / `secret123` (from `app/scripts/seed_admin.py`).

| Endpoint | Method | Auth |
|---|---|---|
| `/api/v1/auth/login` | POST | Public |
| `/api/v1/auth/register` | POST | Public |
| `/api/v1/auth/refresh` | POST | Public |
| `/api/v1/auth/me` | GET | Bearer token |

---

## 16. Full API Endpoint Reference

### Auth (`/api/v1/auth`)
| Method | Path | Description |
|---|---|---|
| POST | `/login` | Username/password login; returns access + refresh tokens |
| POST | `/register` | Register new user |
| POST | `/refresh` | Exchange refresh token for new token pair |
| GET | `/me` | Get current authenticated user profile |

### Agents (`/api/v1/agents`)
| Method | Path | Description |
|---|---|---|
| GET | `/` | List all active agents |
| POST | `/` | Create new agent |
| GET | `/{id}` | Get agent details |
| PUT | `/{id}` | Update agent config (name, thresholds, budget) |
| DELETE | `/{id}` | Soft-delete agent (`is_active = False`) |
| GET | `/{id}/sessions` | List agent sessions |
| GET | `/{id}/reliability` | Get latest ARS record |

### Telemetry (`/api/v1/telemetry`)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/ingest` | None | Single-event ingestion (idempotent) |
| POST | `/batch` | None | Batch event ingestion |
| GET | `/{agent_id}` | Bearer | Paginated telemetry events |
| GET | `/{agent_id}/stats` | Bearer | Aggregate stats (avg tokens, latency, success rate) |

### Dashboard (`/api/v1/dashboard`)
| Method | Path | Description |
|---|---|---|
| GET | `/overview` | Platform summary: active agents, 24h alerts, avg ARS, daily cost |
| GET | `/agents/active` | Per-agent metrics list with latest ARS |
| GET | `/metrics/token-usage` | Bucketed token usage over time window (1h/6h/24h) |
| GET | `/metrics/costs` | Per-agent cumulative USD costs |
| GET | `/metrics/latency` | Per-tool average latency |
| GET | `/alerts/recent` | Recent anomaly alerts (up to 20) |

### Enhanced Observability (`/api/v1/enhanced`)
| Method | Path | Description |
|---|---|---|
| GET | `/alerts/{alert_id}/reasons` | Explainable root-cause reasons for an alert |
| GET | `/alerts/recent-explained` | Recent alerts pre-annotated with explanations |
| GET | `/alerts/{alert_id}/recommendations` | Prioritized remediation actions |
| GET | `/agents/{agent_id}/health` | Comprehensive agent health profile |
| GET | `/agents/{agent_id}/trends` | Metric trends vs 24h baseline |
| GET | `/agents/compare` | Side-by-side multi-agent comparison |
| GET | `/sessions/{session_id}/detail` | Extended session trace & step breakdown |

### Anomalies (`/api/v1/anomalies`)
| Method | Path | Description |
|---|---|---|
| GET | `/` | List anomaly alerts (filterable) |
| GET | `/{id}` | Get single alert |
| PATCH | `/{id}/acknowledge` | Mark alert as acknowledged |

### Sessions (`/api/v1/sessions`)
| Method | Path | Description |
|---|---|---|
| GET | `/` | List sessions |
| GET | `/{id}` | Get session |

### Simulator (`/api/v1/simulator`)
| Method | Path | Description |
|---|---|---|
| POST | `/start` | Start all 4 simulator agents |
| POST | `/stop` | Stop all simulator agents |
| GET | `/status` | Per-agent run status & event count |
| POST | `/inject-anomaly` | Inject fault into a simulator agent |
| POST | `/real-llm/execute` | Execute one Real LLM (A004) step |

### Machine Learning (`/api/v1/ml`)
| Method | Path | Description |
|---|---|---|
| POST | `/retrain` | Trigger immediate model retraining |
| GET | `/model/stats` | Latest ML model metadata & performance metrics |
| POST | `/predict` | Score a single hypothetical event |

### System
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Platform health check |
| GET | `/docs` | Swagger / OpenAPI documentation |
| GET | `/redoc` | ReDoc API documentation |

---

## 17. Frontend Application

Built with **React 18** + **Vite** + **Recharts** + **Lucide-React** + **Motion**.

### Pages

| Route | Component | Description |
|---|---|---|
| `/login` | `Login.jsx` | JWT login form |
| `/` | `Dashboard.jsx` | Platform overview — KPI cards, active agents, recent alerts |
| `/agents/:id` | `AgentDetail.jsx` | Per-agent deep-dive: ARS gauge, trend charts, session list, DAG |
| `/sessions/:id` | `SessionDetail.jsx` | Step replay, per-step metrics, cost breakdown |
| `/anomalies` | `AnomalyHistory.jsx` | Filterable anomaly alert log with explanations |
| `/architecture` | `Architecture.jsx` | Interactive platform architecture diagram |
| `/compare` | `AgentComparison.jsx` | Side-by-side agent benchmarking |
| `/real-agent` | `RealAgentPlayground.jsx` | Live Groq LLM agent execution playground |
| `/settings` | `Settings.jsx` | Platform configuration & user settings |

### Component Library

| Component Group | Contents |
|---|---|
| `Layout/` | Sidebar navigation, page shell |
| `AgentCard/` | Agent summary card widget |
| `AnomalyLog/` | Alert list with severity badges |
| `Charts/` | Recharts wrappers for token, latency, cost trends |
| `Cost/` | USD cost breakdown displays |
| `Health/` | ARS color-coded status indicators |
| `ReliabilityGauge/` | Circular gauge for ARS visualization |
| `Timeline/` | Session step timeline & replay controls |
| `ToolGraph/` | DAG tool dependency visualization |
| `Trends/` | Metric trend comparison widgets |
| `UI/` | Shared UI primitives (badges, cards, modals) |

---

## 18. Configuration Reference

### Backend Environment Variables (`.env`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://Infera:changeme123@localhost:5432/Infera` | Async PostgreSQL connection string |
| `SECRET_KEY` | (SHA256 hash) | JWT signing key — **change in production** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | JWT access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | JWT refresh token lifetime |
| `MODEL_RETRAIN_INTERVAL_MINUTES` | `30` | Isolation Forest periodic retraining interval |
| `ANOMALY_CONTAMINATION_RATE` | `0.05` | Expected anomaly fraction for IF model |
| `TOKEN_SPIKE_THRESHOLD` | `3.0` | Z-score threshold for token spike detection |
| `LATENCY_SPIKE_THRESHOLD` | `3.0` | Z-score threshold for latency spike detection |
| `LOOP_COUNT_THRESHOLD` | `10` | Loop iteration count above which alert fires |
| `FAILURE_CASCADE_WINDOW` | `5` | Rolling window for cascade failure detection |
| `SIMULATOR_TICK_INTERVAL_SEC` | `2.0` | Default simulator event emission interval |
| `COST_PER_1K_TOKENS` | `0.002` | USD cost per 1,000 tokens (used for cost calculation) |
| `GROQ_API_KEY` | `""` | Groq API key for Real LLM Agent (A004) |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | Groq model name for A004 |
| `ALLOW_AUTO_PROVISION_AGENTS` | `False` | Auto-create agent records on unknown agent IDs |

---

## 19. Deployment & Execution Instructions

### Method 1: Containerized Execution (Recommended)

```bash
cp .env.example .env
# Edit .env to set SECRET_KEY and optionally GROQ_API_KEY

docker-compose up -d --build
```

- **React Dashboard**: `http://localhost:3000`
- **API / Swagger**: `http://localhost:8000/docs`
- **Default Credentials**: `admin` / `secret123`

**Docker services:**
- `db` — PostgreSQL 15 with health check
- `backend` — FastAPI ASGI server (`uvicorn`)
- `frontend` — Nginx serving the Vite production build

### Method 2: Local Development

#### Backend

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

#### Frontend

```bash
cd frontend
npm install
npm run dev
# Dev server: http://localhost:5173
```

#### SDK Quickstart

```bash
pip install -e sdk/
python sdk/examples/basic_agent.py
```

#### Dev Docker Compose

A lightweight `docker-compose.dev.yml` is available for running only the database container during local backend development:

```bash
docker-compose -f docker-compose.dev.yml up db -d
```

---

## 20. Repository Structure

```
Infera/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point, lifespan manager, CORS, router registration
│   │   ├── config.py            # Pydantic settings — loads env vars from .env
│   │   ├── database.py          # Async SQLAlchemy engine, session factory
│   │   ├── models/              # SQLAlchemy ORM models (User, Agent, Session, TelemetryEvent, AnomalyAlert, AgentReliabilityScore, MLModelMetadata)
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # alert_service.py, auth_service.py, scheduler.py
│   │   ├── ml/                  # feature_engineering.py, isolation_forest.py, lof_baseline.py, reliability_score.py, model_store.py
│   │   ├── simulator/           # base_agent.py, customer_support.py, research_agent.py, sales_agent.py, real_llm_agent.py, anomaly_injector.py
│   │   ├── routers/             # auth.py, agents.py, sessions.py, telemetry.py, anomalies.py, dashboard.py, simulator.py, ml.py, enhanced.py
│   │   └── scripts/             # seed_admin.py — seeds admin user and default agents
│   ├── alembic/                 # Database schema migration scripts
│   ├── requirements.txt         # Backend Python dependencies
│   └── Dockerfile               # Backend container recipe
├── sdk/
│   ├── infera_sdk/
│   │   ├── __init__.py          # Public API: Infera, AgentTracer, SessionTracer, SpanTracer, InferaConfig
│   │   ├── client.py            # Infera client — agent registration + flush
│   │   ├── tracer.py            # AgentTracer, SessionTracer, SpanTracer context managers
│   │   ├── transport.py         # Async non-blocking HTTP batch transport
│   │   ├── models.py            # TelemetrySpan Pydantic model
│   │   └── config.py            # InferaConfig — env var loading + metadata redaction
│   ├── examples/                # Example agent implementation scripts
│   ├── pyproject.toml           # SDK package manifest (version: 0.1.0)
│   └── README.md                # SDK documentation
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios HTTP client & interceptors
│   │   ├── context/             # AuthContext — JWT token state & refresh
│   │   ├── hooks/               # Custom streaming telemetry hooks
│   │   ├── components/          # UI components (AgentCard, AnomalyLog, Charts, Health, ReliabilityGauge, Timeline, ToolGraph, Trends, UI)
│   │   └── pages/               # Dashboard, AgentDetail, SessionDetail, AnomalyHistory, AgentComparison, RealAgentPlayground, Architecture, Settings, Login
│   ├── package.json             # Frontend dependency manifest
│   ├── vite.config.js           # Vite build configuration
│   └── Dockerfile               # Frontend container recipe (Nginx)
├── docs/
│   ├── DOCUMENTATION.md         # Extended technical documentation
│   ├── demo.md                  # Demo walkthrough
│   ├── evaluation-results.md    # Evaluation metrics
│   └── research-diary.md        # Research development log
├── docker-compose.yml           # Production multi-container orchestration
├── docker-compose.dev.yml       # Dev-only DB container
├── DOCUMENTATION.md             # This file — complete technical documentation
├── .env.example                 # Environment configuration template
└── README.md                    # Project landing README
```
