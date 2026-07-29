# Infera: Real-Time Telemetry and Unsupervised Anomaly Detection Platform for Autonomous LLM Agents

[![Build Status](https://img.shields.io/badge/Status-Active%20Research-blue.svg)](https://github.com/infera/infera)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org/)

---

## Abstract

**Infera** is a novel telemetry ingestion and unsupervised anomaly detection framework designed specifically for autonomous AI agents powered by Large Language Models (LLMs). Conventional Application Performance Monitoring (APM) systems assume deterministic compute and static call graphs, making them ill-equipped to detect LLM-specific operational pathologies—such as token consumption spikes, infinite reasoning loops, tool failure cascades, and behavioral distribution shifts. 

Infera addresses these challenges by introducing a high-throughput event ingestion pipeline, a multi-dimensional spatial-temporal feature extractor, an online unsupervised **Isolation Forest** detection architecture, and a novel composite health index known as the **Agent Reliability Score (ARS)**.

---

## System Architecture & Key Capabilities

```
+-----------------------------------------------------------------------------------+
|                                  Infera Platform                                  |
+-----------------------------------------------------------------------------------+
|  +---------------------+    +---------------------------+    +-----------------+  |
|  |  Telemetry Ingress  | -->|   10D Feature Extractor   | -->| Isolation Forest|  |
|  | (FastAPI Execution) |    | (Token, Latency, Loops)   |    | Anomaly Engine  |  |
|  +---------------------+    +---------------------------+    +-----------------+  |
|                                           |                                       |
|                                           v                                       |
|                             +---------------------------+                         |
|                             | Agent Reliability Score   |                         |
|                             |    (Composite Metric)     |                         |
|                             +---------------------------+                         |
|                                           |                                       |
|                                           v                                       |
|                             +---------------------------+                         |
|                             | Real-Time React Dashboard |                         |
|                             | (Visual Graph & Analytics)|                         |
|                             +---------------------------+                         |
+-----------------------------------------------------------------------------------+
```

### Core Components

1. **High-Throughput Telemetry Ingress**: RESTful ingestion endpoint implemented in FastAPI, capable of processing structured JSON payloads capturing agent execution traces, tool invocations, token counts, and execution latencies.
2. **10-Dimensional Spatial-Temporal Feature Engineering**: Translates heterogeneous agent execution logs into a dense 10D feature vector incorporating token dynamics, temporal intervals, tool interaction patterns, and contextual repetition indices.
3. **Unsupervised Anomaly Detection**: Employs an Isolation Forest algorithm trained in-process to flag non-deterministic runtime anomalies without requiring labeled failure datasets.
4. **Agent Reliability Score (ARS)**: A quantitative composite index (scale $0 \text{--} 100$) evaluating agent stability:
   $$\text{ARS} = 0.40 \cdot S_{\text{tool}} + 0.20 \cdot S_{\text{token}} + 0.20 \cdot S_{\text{latency}} + 0.20 \cdot S_{\text{loop}}$$
   where $S_{\text{tool}}$, $S_{\text{token}}$, $S_{\text{latency}}$, and $S_{\text{loop}}$ normalize tool success rate, token utilization efficiency, response latencies, and loop frequencies respectively.
5. **Multi-Agent Simulation & Perturbation Framework**: Built-in synthetic telemetry generator featuring three agent archetypes (*Customer Support*, *Deep Research*, *Sales Representative*) and explicit fault injection modules (`token_spike`, `infinite_loop`, `high_latency`, `tool_failure_cascade`, `behavioral_drift`).
6. **Observability & Visual Analytics Dashboard**: React/Vite web application providing real-time visual telemetry, Directed Acyclic Graph (DAG) state representations of tool interactions, and dynamic alert thresholds.

---

## Deployment & Setup

### Prerequisites

- Docker Engine 24.0+ & Docker Compose v2.20+
- Python 3.11+ (for local development)
- Node.js 18+ (for frontend development)

---

### Method 1: Containerized Execution (Recommended)

1. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```

2. **Build and Deploy Containers**:
   ```bash
   docker-compose up -d --build
   ```

3. **Service Interfaces**:
   - **Visual Analytics Dashboard**: `http://localhost:3000`
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

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Experimental Protocol & Demonstration Workflow

To reproduce anomalous state transitions and evaluate system responsiveness:

1. **Initialization & Authentication**:
   Navigate to `http://localhost:3000` and authenticate using administrative credentials (`admin` / `secret123`). Verify baseline fleet status across monitored agents ($A_{001}, A_{002}, A_{003}$).
2. **Telemetry Ingestion Initiation**:
   Trigger the **Start Telemetry Stream** action via the control panel to initiate multi-agent synthetic payload generation.
3. **Controlled Fault Injection**:
   Access **Settings & Perturbation Engine**. Select agent instance $A_{001}$ and execute a `Token Consumption Spike` anomaly injection.
4. **Observation & Metric Evaluation**:
   Monitor real-time updates in the primary telemetry dashboard:
   - Token consumption velocity plot spikes.
   - Anomaly severity logs emit a `CRITICAL` state event.
   - The Agent Reliability Score (ARS) decays dynamically from nominal ($\approx 85+$) to critical ($\le 40$).
5. **Structural Analysis**:
   Select agent $A_{001}$ to inspect the underlying Tool Invocation Sequence DAG and evaluate isolation metrics via the endpoint `/api/v1/ml/model/stats`.

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
│   │   ├── services/            # Authentication, alert evaluation, scheduler
│   │   ├── ml/                  # 10D feature engineering & Isolation Forest estimator
│   │   ├── simulator/           # Synthetic agent telemetry and fault injectors
│   │   ├── routers/             # API routing endpoints
│   │   └── scripts/             # Administrative data seeding scripts
│   ├── alembic/                 # Database schema migration scripts
│   ├── requirements.txt         # Backend Python dependencies
│   └── Dockerfile               # Backend container recipe
├── frontend/
│   ├── src/
│   ├── api/                 # HTTP client and token interception logic
│   ├── context/             # Global state providers (Authentication)
│   ├── hooks/               # Custom hooks for telemetry streaming
│   ├── components/          # Reusable visualization components & graphs
│   └── pages/               # Application view layouts
│   ├── package.json             # Frontend dependency manifest
│   ├── vite.config.js           # Vite build configuration
│   └── Dockerfile               # Frontend container recipe
├── docker-compose.yml           # Multi-container orchestration specification
├── .env.example                 # Environment configuration template
└── README.md                    # Project documentation
```

---

## Citation & License

This software is released under the [MIT License](LICENSE).

```bibtex
@article{infera2026,
  title={Infera: Real-Time Telemetry and Unsupervised Anomaly Detection Platform for Autonomous LLM Agents},
  author={Infera Research Team},
  year={2026},
  journal={Repository & Technical Report}
}
```
