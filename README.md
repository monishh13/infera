# Infera — AI Agent Monitoring & Anomaly Detection Platform

[![Phase](https://img.shields.io/badge/Phase-1%20MVP-blue.svg)](https://github.com/infera/infera)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Infera** is a real-time monitoring and anomaly detection platform built specifically for autonomous AI agents powered by Large Language Models (LLMs). Traditional APM tools (Datadog, New Relic) are designed for deterministic software and cannot capture LLM-specific failure modes such as token consumption spikes, infinite reasoning loops, tool failure cascades, or behavioral drift. Infera fills this gap.

---

## Key Phase 1 Features

- **Real-Time Telemetry Ingestion API**: FAST REST API for receiving structured JSON execution events from LLM agent actions.
- **Unsupervised Machine Learning Pipeline**: 10-dimensional feature engineering paired with an Isolation Forest model detecting non-deterministic behavioral anomalies.
- **Agent Reliability Score (ARS)**: Original composite health index (0–100) combining tool success rate (40%), token efficiency (20%), latency score (20%), and loop frequency score (20%).
- **Multi-Agent Telemetry Simulator**: Built-in simulator with 3 agent archetypes (*Customer Support A001*, *Deep Research A002*, *Sales Rep A003*).
- **On-Demand Anomaly Injector**: Live trigger panel for injecting `token_spike`, `infinite_loop`, `high_latency`, `tool_failure_cascade`, and `behavioral_drift`.
- **Modern Dark Glassmorphism Dashboard**: React dashboard with live Recharts token/latency/cost analytics, interactive SVG tool invocation DAG graph, and audio alerts on CRITICAL events.

---

## Quickstart Instructions

### Method 1: Running with Docker Compose (Recommended)

1. **Clone & Setup Environment**:
   ```bash
   cp .env.example .env
   ```

2. **Launch All Services**:
   ```bash
   docker-compose up -d --build
   ```

3. **Access Services**:
   - **React Dashboard**: [http://localhost:3000](http://localhost:3000)
   - **FastAPI Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Login Credentials**: `admin` / `secret123`

---

### Method 2: Running Locally (Development Mode)

#### 1. Backend Setup:
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

#### 2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```

---

## 10-Minute Viva Demonstration Script

1. **Launch Platform & Login**:
   - Start Docker Compose or local dev server. Open `http://localhost:3000` and login as `admin` / `secret123`.
2. **Show Monitored Agent Fleet**:
   - Observe initial 3 Agent cards (A001, A002, A003) displaying green Reliability Scores (85+).
3. **Show FastAPI Auto-Generated Swagger Docs**:
   - Open `http://localhost:8000/docs` to demonstrate REST endpoints.
4. **Start Telemetry Stream**:
   - Click **Start Telemetry Stream** in the TopBar to launch the multi-agent simulator emitting telemetry in real-time.
5. **Inject Anomaly Live**:
   - Navigate to **Settings & Injector**. Select `Customer Support Agent (A001)` and anomaly type `Token Consumption Spike`. Click **Inject Anomaly Live**.
6. **Observe Live Anomaly Detection**:
   - Return to Dashboard. Notice A001 token consumption chart spike sharply, a CRITICAL alert appearing in the Live Anomaly Log, an audio alert playing, and A001's card turning RED (score dropping to ~40).
7. **Deep-Dive into Agent Detail**:
   - Click A001 Agent Card. Inspect the semicircle Reliability Gauge breakdown and the Tool Invocation Sequence DAG graph.
8. **Check Machine Learning Model Stats**:
   - Navigate to `http://localhost:8000/api/v1/ml/model/stats` or Swagger UI to demonstrate Isolation Forest model metadata trained in-process.

---

## Project Structure

```
Infera/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point & lifespan
│   │   ├── config.py            # Environment settings
│   │   ├── database.py          # Async SQLAlchemy engine
│   │   ├── models/              # User, Agent, Session, Telemetry, Alert, Reliability ORM
│   │   ├── schemas/             # Pydantic request/response validation schemas
│   │   ├── services/            # Auth, Alert evaluation & APScheduler
│   │   ├── ml/                  # 10D feature engineering & Isolation Forest model
│   │   ├── simulator/           # Built-in agents & anomaly injection engine
│   │   ├── routers/             # Auth, Agents, Sessions, Telemetry, Anomalies, Dashboard, ML
│   │   └── scripts/             # seed_admin.py script
│   ├── alembic/                 # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios client with JWT interceptor
│   │   ├── context/             # AuthContext state
│   │   ├── hooks/               # useAgents & useTelemetry polling hooks
│   │   ├── components/          # Layout, AgentCard, Charts, AnomalyLog, Gauge, ToolGraph
│   │   └── pages/               # Login, Dashboard, AgentDetail, AnomalyHistory, Settings
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
└── README.md
```
