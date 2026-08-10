# Exact Working & Technical Architecture Documentation of Infera Platform

---

## 1. System Overview & Problem Statement

**Infera** is a real-time observability, telemetry ingestion, and unsupervised anomaly detection platform designed specifically for autonomous **Large Language Model (LLM) agents**.

### The Observability Gap in Autonomous AI
Traditional Application Performance Monitoring (APM) tools (e.g., Datadog, Prometheus) rely on static call graphs, fixed error rate thresholds, and predictable latency profiles. Autonomous LLM agents break these assumptions due to:
1. **Non-deterministic reasoning chains**: An agent may call different tools in variable order depending on user prompts.
2. **Unpredictable resource consumption**: Token consumption can abruptly spike during recursive chain-of-thought processing.
3. **Behavioral failure modes**: Agents suffer from pathologies unknown in microservices, such as infinite tool loops, semantic drift, dependency failure cascades, and non-terminating planning cycles.

### Infera Solution
Infera solves this by providing:
- **High-throughput RESTful Telemetry Ingress** built with FastAPI and async SQLAlchemy.
- **10-Dimensional Spatial-Temporal Feature Extraction** to transform non-deterministic agent event logs into dense numerical feature vectors.
- **Online Unsupervised Isolation Forest (and LOF) Anomaly Estimator** that detects abnormal behavior patterns without requiring labeled failure datasets.
- **Agent Reliability Score (ARS)**, a composite index ($0 \text{--} 100$) evaluating agent health in real time.
- **Synthetic Multi-Agent Simulator & Perturbation Engine** featuring synthetic agent archetypes and automated fault injectors.
- **Real-Time Visual Analytics Command Center** built with React 18, Vite, and custom SVG/Canvas visualization tools (including Directed Acyclic Graphs of tool invocations).

---

## 2. High-Level Architecture & End-to-End Lifecycle

```
+---------------------------------------------------------------------------------------------------+
|                                      INFERA PLATFORM ARCHITECTURE                                 |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  +------------------------+      +------------------------+      +-----------------------------+  |
|  | Multi-Agent Simulator  |      | External Agent Telemetry|      |  Real-Time React Dashboard  |  |
|  | (A001, A002, A003)    |      | (HTTP Ingestion Client)|      | (Visual Graph & Analytics)  |  |
|  +------------------------+      +------------------------+      +-----------------------------+  |
|               |                              |                                  ^                 |
|               v                              v                                  |                 |
|     +-------------------------------------------------------------------+       | (REST / Poll)   |
|     |                     FastAPI Telemetry Ingress Endpoint           |       |                 |
|     |                     POST /api/v1/telemetry/ingest                 |-------+                 |
|     +-------------------------------------------------------------------+                         |
|                                       |                                                           |
|                                       v                                                           |
|     +-------------------------------------------------------------------+                         |
|     |            Session State Manager & DB Entity Sync                 |                         |
|     |          (Fetch/Create Agent, Session, Query History)             |                         |
|     +-------------------------------------------------------------------+                         |
|                                       |                                                           |
|                                       v                                                           |
|     +-------------------------------------------------------------------+                         |
|     |              10D Feature Engineering Engine                       |                         |
|     |     (Tokens, Latency, Z-Scores, Loop Counts, Rolling Rates)       |                         |
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
|     |             Rule-Based Alerting Engine & Database Persistence     |                         |
|     |         (Persistence to SQLite/Postgres via Async SQLAlchemy)     |                         |
|     +-------------------------------------------------------------------+                         |
|                                       |                                                           |
|                                       v                                                           |
|     +-------------------------------------------------------------------+                         |
|     |             Background Task Scheduler (APScheduler)               |                         |
|     |    (Periodic Model Re-training, Data Purge, Metric Maintenance)   |                         |
|     +-------------------------------------------------------------------+                         |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Core Technical Modules & Working Details

### 3.1. Telemetry Ingress & Processing Pipeline

The entry point for telemetry events is located in [`backend/app/routers/telemetry.py`](file:///d:/Study/projects/infera/infera/backend/app/routers/telemetry.py). 

When a payload is posted to `/api/v1/telemetry/ingest` or `/api/v1/telemetry/batch`:
1. **Agent Lookup / Provisioning**: The server checks if `Agent` with `agent_id` exists in DB. If absent, a default agent profile is dynamically provisioned.
2. **Session Verification**: The server verifies or creates an active `Session` tracking cumulative session statistics (total tokens, USD cost, total tool calls, failed calls).
3. **Historical Context Retrieval**: The latest 50 events for the target `agent_id` are fetched to provide temporal context.
4. **Feature Vector Extraction**: The raw payload and historical context are passed into `extract_features(...)` in [`backend/app/ml/feature_engineering.py`](file:///d:/Study/projects/infera/infera/backend/app/ml/feature_engineering.py).
5. **Isolation Forest Model Scoring**: The active model (`IFModel`) scales the 10D feature vector using `StandardScaler` and scores it via `IsolationForest.score_samples()`.
6. **Telemetry Event Database Record**: The event is recorded in the `telemetry_events` table along with its anomaly score and boolean flag.
7. **Session Aggregates & Rolling Stats Update**: Cumulative tool calls, token usage, and costs are incremented.
8. **Alert Evaluation**: The rule-based alert engine checks anomaly scores, token counts, latency thresholds, failure cascades, and loop counts.
9. **Agent Reliability Score Calculation**: The composite ARS metric is computed and saved into `agent_reliability_scores`.

---

### 3.2. 10-Dimensional Feature Engineering Engine

In [`backend/app/ml/feature_engineering.py`](file:///d:/Study/projects/infera/infera/backend/app/ml/feature_engineering.py), every telemetry event is converted into a 10D feature vector $\mathbf{x} \in \mathbb{R}^{10}$:

| Dimension | Feature Name | Description & Mathematical Derivation |
|---|---|---|
| $f_1$ | `tokens` | Raw token count consumed by the event: $T_i$ |
| $f_2$ | `tokens_zscore` | Normalized token deviation relative to agent history: $\frac{T_i - \mu_T}{\sigma_T + 10^{-6}}$ |
| $f_3$ | `latency` | Raw response execution latency in milliseconds: $L_i$ |
| $f_4$ | `latency_zscore` | Normalized latency deviation relative to agent history: $\frac{L_i - \mu_L}{\sigma_L + 10^{-6}}$ |
| $f_5$ | `loop_count` | Number of recursive tool iterations or sub-step loop iterations |
| $f_6$ | `is_failure` | Binary error indicator: $1.0$ if status $\neq \text{"SUCCESS"}$, else $0.0$ |
| $f_7$ | `tokens_per_ms` | Consumption velocity ratio: $\frac{T_i}{L_i + 10^{-6}}$ |
| $f_8$ | `rolling_fail_rate` | Rolling failure probability over recent 10 events: $\frac{\sum_{k=i-9}^i \mathbb{I}(\text{status}_k \neq \text{"SUCCESS"})}{\max(N_{window}, 1)}$ |
| $f_9$ | `rolling_avg_tokens` | Moving average token usage over recent 10 events: $\frac{1}{N_{window}}\sum_{k=i-9}^i T_k$ |
| $f_{10}$ | `session_age_ratio` | Session lifetime progression ratio: $\min\left(1.0, \frac{\text{event\_count}}{100}\right)$ |

---

### 3.3. Machine Learning Anomaly Detection Architecture

#### Primary Estimator: Online Isolation Forest (`IFModel`)
Located in [`backend/app/ml/isolation_forest.py`](file:///d:/Study/projects/infera/infera/backend/app/ml/isolation_forest.py):
- **Model Parameters**: 
  - `n_estimators`: 100 isolation trees
  - `contamination`: 0.05 (5% baseline expectation of extreme outliers)
  - `random_state`: 42
  - `n_jobs`: -1 (Parallelized execution)
- **Scaling**: Features are transformed using Scikit-Learn `StandardScaler`.
- **Anomaly Scoring & Thresholding**:
  - `score_samples(X)` returns negative decision values (lower = more anomalous).
  - An anomaly is flagged if `predict(X) == -1` OR decision score $< -0.5$.
  - Fallback logic: If fewer than 10 events exist (model un-trained), a deterministic heuristic rule is applied:
    $$\text{is\_anomaly} = (T_i > 500) \lor (L_i > L_{threshold}) \lor (\text{loop\_count} \ge \text{loop}_{threshold})$$

#### Alternative Baseline Estimator: Local Outlier Factor (`LOFModel`)
Located in [`backend/app/ml/lof_baseline.py`](file:///d:/Study/projects/infera/infera/backend/app/ml/lof_baseline.py):
- Uses density-based outlier detection (`n_neighbors=20`, `novelty=True`).
- Serves as a comparative model benchmark to evaluate Isolation Forest accuracy.

#### Model Persistence & Training Store (`model_store.py`)
- Models are persisted as atomic `.joblib` files under `backend/app/ml/saved_models/`.
- Per-agent models (`if_agent_{id}.joblib`) and global model fallback (`if_global.joblib`) are dynamically loaded into memory with thread-safe caching.

---

### 3.4. Agent Reliability Score (ARS) Engine

Located in [`backend/app/ml/reliability_score.py`](file:///d:/Study/projects/infera/infera/backend/app/ml/reliability_score.py), the Agent Reliability Score quantifies agent operational stability on a $0 \text{--} 100$ scale.

#### Composite Formula
$$\text{ARS} = \Big( 0.40 \cdot S_{\text{tool}} + 0.20 \cdot S_{\text{token}} + 0.20 \cdot S_{\text{latency}} + 0.20 \cdot S_{\text{loop}} \Big) \times 100$$

Where component scores are normalized to $[0.0, 1.0]$:
1. **Tool Success Rate ($S_{\text{tool}}$)**:
   $$S_{\text{tool}} = \frac{\text{successful\_calls}}{\text{total\_calls}}$$
2. **Token Efficiency Score ($S_{\text{token}}$)**:
   $$S_{\text{token}} = \min\left( \frac{\text{expected\_tokens}}{\max(\text{actual\_tokens}, 1.0)}, 1.0 \right)$$
3. **Latency Normalization Score ($S_{\text{latency}}$)**:
   $$R_{\text{lat}} = \frac{\text{avg\_latency}}{\text{baseline\_latency}}$$
   $$S_{\text{latency}} = \max\left( 0.0, 1.0 - \frac{\max(0.0, R_{\text{lat}} - 1.0)}{2.0} \right)$$
4. **Loop Frequency Penalty Score ($S_{\text{loop}}$)**:
   $$S_{\text{loop}} = \max\left( 0.0, 1.0 - \max(0.0, \text{avg\_loop\_count} - 1.0) \times 0.1 \right)$$

#### Risk Level & Non-Linear Failure Probability Mapping

| Score Range | Risk Level | Predicted Failure Probability $P(\text{failure})$ Formula |
|---|---|---|
| $85 \le \text{ARS} \le 100$ | `LOW` | $\max\left(0.01, \frac{100 - \text{ARS}}{300}\right)$ |
| $65 \le \text{ARS} < 85$ | `MEDIUM` | $0.05 + (85 - \text{ARS}) \times 0.0075$ |
| $40 \le \text{ARS} < 65$ | `HIGH` | $0.20 + (65 - \text{ARS}) \times 0.012$ |
| $0 \le \text{ARS} < 40$ | `CRITICAL` | $\min\left(0.95, 0.50 + (40 - \text{ARS}) \times 0.01125\right)$ |

---

### 3.5. Real-Time Alerting Engine

Located in [`backend/app/services/alert_service.py`](file:///d:/Study/projects/infera/infera/backend/app/services/alert_service.py):

When a telemetry event is ingested, `check_and_create_alert(...)` evaluates rule conditions:
1. **Anomaly Score Alert**: Triggered if `is_anomaly == True` or `anomaly_score < -0.5`. Severity: `CRITICAL` if score $< -0.6$, else `WARNING`.
2. **Token Consumption Spike Alert**: Triggered if `tokens_used > agent.token_budget * 0.20`. Severity: `WARNING`.
3. **Latency Exceeded Alert**: Triggered if `latency_ms > agent.latency_threshold_ms`. Severity: `WARNING`.
4. **Failure Cascade Alert**: Triggered if rolling failures in last 5 events $\ge 3$. Severity: `CRITICAL`.
5. **Infinite Loop Alert**: Triggered if `loop_count >= agent.loop_threshold`. Severity: `CRITICAL`.

Alerts automatically trigger status state transitions on the affected `Agent` model (`ACTIVE` $\rightarrow$ `DEGRADED` or `CRITICAL`).

---

### 3.6. Multi-Agent Simulator & Perturbation Framework

Located in [`backend/app/simulator/`](file:///d:/Study/projects/infera/infera/backend/app/simulator/):

#### Agent Archetypes

1. **Customer Support Agent (`A001`)**:
   - Focus: High volume, low latency, modest token usage (~200-400 tokens/step).
   - Tools: `search_knowledge_base`, `fetch_user_profile`, `escalate_ticket`, `send_response`.
2. **Deep Research Agent (`A002`)**:
   - Focus: Heavy compute, long responses (~1500-3000 tokens/step), high baseline latency (~800-1500ms).
   - Tools: `web_search`, `summarize_paper`, `vector_db_query`, `synthesize_report`.
3. **Sales Representative Agent (`A003`)**:
   - Focus: Interactive multi-step dialogs (~300-600 tokens/step).
   - Tools: `qualify_lead`, `check_pricing`, `schedule_demo`, `send_email`.

#### Fault Injection Modules (`anomaly_injector.py`)

Users can inject synthetic perturbations via API or settings UI:

| Anomaly Type | Function | Mechanism |
|---|---|---|
| `token_spike` | `make_token_spike(multiplier=8.0, duration=3)` | Multiplies token output by $8\times$ for target duration. |
| `infinite_loop` | `make_infinite_loop(duration=5)` | Overrides `loop_count` to $4\text{--}8$ recursive steps per event. |
| `high_latency` | `make_high_latency(multiplier=6.0, duration=3)` | Multiplies event execution duration by $6\times$. |
| `tool_failure_cascade` | `make_failure_cascade(duration=5)` | Forces event status to `FAILURE` with cascading dependency error strings. |
| `behavioral_drift` | `make_behavioral_drift(duration=15)` | Gradually drifts token and latency usage upward by $+8\%$ per step. |

---

### 3.7. Database Schema & Data Models

Infera uses SQLAlchemy (with AsyncEngine) targeting SQLite (`infera.db`) or PostgreSQL.

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
                                | (Manages/Monitors)
                                v
                      +-------------------+
                      |       Agent       |
                      +-------------------+
                      | id (PK, e.g. A001)|
                      | name              |
                      | type              |
                      | status            |
                      | token_budget      |
                      | latency_thresh_ms |
                      | loop_threshold    |
                      +-------------------+
                                |
             +------------------+------------------+
             |                                     |
             v                                     v
   +-------------------+                 +-------------------+
   |      Session      |                 |   TelemetryEvent  |
   +-------------------+                 +-------------------+
   | id (PK, e.g. S_..) |                 | id (PK, Autoincrement)
   | agent_id (FK)     |                 | agent_id (FK)     |
   | total_tokens      |                 | session_id (FK)   |
   | total_cost_usd    |                 | timestamp         |
   | total_tool_calls  |                 | tokens_used       |
   | failed_tool_calls |                 | tool_name         |
   | status            |                 | latency_ms        |
   +-------------------+                 | status            |
             |                           | loop_count        |
             |                           | anomaly_score     |
             v                           | is_anomaly        |
   +---------------------------+         +-------------------+
   |  AgentReliabilityScore    |                   |
   +---------------------------+                   v
   | id (PK)                   |         +-------------------+
   | agent_id (FK)             |         |       Alert       |
   | session_id (FK)           |         +-------------------+
   | score (0-100)             |         | id (PK)           |
   | tool_success_rate         |         | agent_id (FK)     |
   | token_efficiency          |         | event_id (FK)     |
   | latency_score             |         | alert_type        |
   | loop_frequency_score      |         | severity          |
   | risk_level                |         | message           |
   | predicted_failure_prob    |         | status (NEW/ACK)  |
   +---------------------------+         +-------------------+
```

---

## 4. Frontend Command Center & Visual Analytics

Built with **React 18**, **Vite**, **Lucide Icons**, and custom responsive CSS (`index.css`).

### Key Views & Pages

1. **Authentication (`/login`)**:
   - JWT Token Authentication via POST `/api/v1/auth/login`. Default credentials: `admin` / `secret123`.
2. **Primary Command Dashboard (`/`)**:
   - Top-level metrics overview: Total Active Agents, Telemetry Ingestion Velocity, Overall Fleet ARS Score, Anomaly Alert Counters.
   - Real-time live streaming charts showing token usage, latency distribution, and anomaly events.
   - Interactive Agent Fleet Status Cards with live ARS score gauges.
3. **Agent Detail & Tool Execution Graph (`/agents/:id`)**:
   - Detailed inspection of an individual agent's telemetry timeline.
   - **Interactive Directed Acyclic Graph (DAG)** of tool invocation paths, transition rates, and bottleneck nodes.
   - Historical ARS score decay graphs and active alerts list.
4. **Session Detail View (`/sessions/:id`)**:
   - Deep inspection of a single execution session step-by-step.
   - Raw JSON payload inspector, error trace breakdown, and step latencies.
5. **Anomaly History & Log Matrix (`/anomalies`)**:
   - Searchable, filterable audit log of all flagged anomaly events across the system.
   - Filter by severity (`CRITICAL`, `WARNING`), anomaly type, or agent ID.
6. **Multi-Agent Comparison Matrix (`/compare`)**:
   - Side-by-side performance benchmarking across agent profiles ($A_{001}, A_{002}, A_{003}$).
   - Metrics overlay: Latency distributions, token efficiency ratios, and reliability score distributions.
7. **System Architecture Topology (`/architecture`)**:
   - Visual architectural diagram explaining feature extraction, ML estimation, and platform pipelines.
8. **Settings & Perturbation Control Panel (`/settings`)**:
   - Control panel to Start / Stop background telemetry simulator.
   - Interactive anomaly injection suite allowing real-time fault triggers (`token_spike`, `infinite_loop`, `high_latency`, `tool_failure_cascade`, `behavioral_drift`).
   - Trigger manual ML model re-training.

---

## 5. Complete API Endpoints Specification

### Authentication (`/api/v1/auth`)
- `POST /login`: Authenticates credentials and returns JWT bearer access token.
- `GET /me`: Returns details of authenticated user profile.

### Telemetry Ingress (`/api/v1/telemetry`)
- `POST /ingest`: Single telemetry payload ingestion, feature extraction, ML scoring, and database write.
- `POST /batch`: Batch ingestion endpoint processing multiple telemetry payloads.
- `GET /history/{agent_id}`: Retrieves historical telemetry events for target agent with optional limit/offset pagination.

### Agents & Sessions (`/api/v1/agents`, `/api/v1/sessions`)
- `GET /agents`: Lists all registered agents and their baseline metrics.
- `GET /agents/{id}`: Returns complete details, thresholds, and recent stats for a specific agent.
- `PUT /agents/{id}`: Updates agent operational thresholds (latency limit, token budget, loop limit).
- `GET /sessions`: Returns list of agent execution sessions.
- `GET /sessions/{id}`: Returns detailed trace logs and session statistics.

### Simulator & Perturbation Engine (`/api/v1/simulator`)
- `POST /start`: Starts background synthetic agent simulation loops.
- `POST /stop`: Stops background simulation task loops.
- `GET /status`: Returns execution status of simulator and agent event counters.
- `POST /inject-anomaly`: Injects target anomaly perturbation (`token_spike`, `infinite_loop`, `high_latency`, `tool_failure_cascade`, `behavioral_drift`).

### Machine Learning & Model Admin (`/api/v1/ml`)
- `GET /model/stats`: Returns current Isolation Forest model parameters, status, and feature importance.
- `POST /model/retrain`: Triggers online model re-training using historical database telemetry vectors.
- `GET /compare`: Computes comparative model statistics (Isolation Forest vs Local Outlier Factor).

### Analytics & Dashboard (`/api/v1/dashboard`)
- `GET /overview`: High-level aggregate metrics across total agents, total events, total cost, and fleet health.
- `GET /trends`: Time-series aggregate data for charting token velocity, latency percentiles, and anomaly frequency over time.
- `GET /graph/{agent_id}`: Generates DAG node and edge data structures for tool transition graphs.

---

## 6. Execution, Development & Deployment Setup

### Environment Variables (`.env`)

```env
PROJECT_NAME="Infera Platform"
API_V1_STR="/api/v1"
SECRET_KEY="infera_secret_key_change_in_production"
ACCESS_TOKEN_EXPIRE_MINUTES=1440
DATABASE_URL="sqlite+aiosqlite:///./infera.db"
COST_PER_1K_TOKENS=0.002
ANOMALY_CONTAMINATION=0.05
MAX_SESSION_LEN=100
```

### Local Execution Instructions

#### 1. Backend Service Setup
```bash
cd backend

# Create & activate Python 3.11+ virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed initial admin user and default agent fleet
python -m app.scripts.seed_admin

# Start FastAPI ASGI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Frontend Application Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

#### 3. Containerized Orchestration (Docker)
```bash
# Build and run containers in detached mode
docker-compose up -d --build
```
- Frontend Access: `http://localhost:3000`
- Backend API Docs (Swagger): `http://localhost:8000/docs`

---

## 7. Summary Matrix of Working Components

| System Component | Key Class / File Path | Technology / Algorithm | Purpose |
|---|---|---|---|
| **Ingress Server** | [`app/main.py`](file:///d:/Study/projects/infera/infera/backend/app/main.py), [`routers/telemetry.py`](file:///d:/Study/projects/infera/infera/backend/app/routers/telemetry.py) | FastAPI, Async SQLAlchemy | High-throughput telemetry payload ingestion & routing |
| **Feature Engineer** | [`ml/feature_engineering.py`](file:///d:/Study/projects/infera/infera/backend/app/ml/feature_engineering.py) | NumPy, Scikit-Learn | Translates raw events to 10D spatial-temporal vectors |
| **Anomaly Engine** | [`ml/isolation_forest.py`](file:///d:/Study/projects/infera/infera/backend/app/ml/isolation_forest.py) | Isolation Forest (100 trees, 5% contamination) | Online unsupervised isolation anomaly scoring |
| **Reliability Scorer** | [`ml/reliability_score.py`](file:///d:/Study/projects/infera/infera/backend/app/ml/reliability_score.py) | Custom Multi-Factor Mathematical Model | Computes composite ARS score ($0\text{--}100$) and risk levels |
| **Alert Engine** | [`services/alert_service.py`](file:///d:/Study/projects/infera/infera/backend/app/services/alert_service.py) | Rule-Based State Evaluator | Fires warnings/alerts and updates agent operational health |
| **Agent Simulator** | [`simulator/`](file:///d:/Study/projects/infera/infera/backend/app/simulator/) | Python Asyncio Event Loops | Simulates realistic multi-agent streams ($A_{001}, A_{002}, A_{003}$) |
| **Fault Injector** | [`simulator/anomaly_injector.py`](file:///d:/Study/projects/infera/infera/backend/app/simulator/anomaly_injector.py) | Closure-Based Perturbation Engines | Injects token spikes, loops, latencies, failure cascades, drift |
| **Visual Dashboard** | [`frontend/src/`](file:///d:/Study/projects/infera/infera/frontend/src/) | React 18, Vite, Custom CSS, SVG DAG | Interactive observability command dashboard |
