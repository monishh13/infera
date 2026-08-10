# Infera Research Diary

This research diary tracks key milestones, hyperparameter experiments, baseline performance numbers, false positive/negative root cause analyses, and git commit hashes for the Infera project research paper (§12.4).

---

## Key Project Milestones

| Date | Milestone / Component | Git Commit | Key Changes & Outcomes |
| :--- | :--- | :--- | :--- |
| **2026-08-10** | **A1: JWT Refresh Flow** | `e8cdb96` | Reduced access token lifetime to 30 min; added `POST /auth/refresh` endpoint and automated Axios response interceptor in `client.js`. |
| **2026-08-10** | **A2: Postgres Datastore** | `dda505f` | Set PostgreSQL async URL (`postgresql+asyncpg://...`) as primary default `DATABASE_URL` with SQLite dev fallback. |
| **2026-08-10** | **A3 & A4: Severity Tiers & Alert Enum** | `ccc112e` | Restored exact tiered severity bands (`score > -0.3` normal, `-0.5..-0.3` INFO, `-0.7..-0.5` WARNING, `< -0.7` CRITICAL) and 200-event training cutoff. Aligned alert types to 5 fixed enums. |
| **2026-08-10** | **A5: Agent Provisioning Gate** | `9ec9eeb` | Gated un-registered agent auto-provisioning behind `ALLOW_AUTO_PROVISION_AGENTS=False` (404 Not Found default). Added explicit simulator seeding. |
| **2026-08-10** | **A7: Security Secret Key** | `1de1e29` | Replaced hardcoded `SECRET_KEY` in `.env.example` with openssl placeholder instructions. |
| **2026-08-10** | **B1 & B2: Operational Endpoints** | `3670a28` | Implemented `POST /auth/register`, `POST /auth/refresh`, `GET /agents/{id}/reliability`, `GET /telemetry/{agent_id}/stats`, `PUT /anomalies/{id}/acknowledge`, and `POST /ml/predict` with Pydantic schemas. |
| **2026-08-10** | **B3: Evaluation Harness** | `2f5a590` | Built `backend/app/scripts/evaluate.py` testing Isolation Forest vs LOF vs Threshold Rules across 1050 events. |
| **2026-08-10** | **B4: ARS Correlation Check** | `4c5dbfe` | Built `check_correlation.py` demonstrating a **-0.6943** Pearson correlation coefficient between ARS score at event N and failure rate in events N+1..N+10. |
| **2026-08-10** | **B5: Automated Test Suite** | `614d0ea` | Added 7 unit & integration tests (`pytest tests/`) covering feature vector math, ARS formula bands, telemetry ingestion, and auth endpoints. |

---

## Hyperparameter Experiments & Benchmark Performance

### Isolation Forest Configuration
- `n_estimators`: 100
- `contamination`: 0.05
- `random_state`: 42
- `min_training_events`: 200

### Evaluation Summary (Test Dataset: 800 Normal + 250 Injected Anomalies)

| Model | Anomaly Type | Precision | Recall | F1 Score | Scoring Latency (ms) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Isolation Forest** | **OVERALL** | **0.8108** | **0.9600** | **0.8791** | **4.849 ms** |
| Isolation Forest | `token_spike` | 0.4717 | 1.0000 | 0.6410 | |
| Isolation Forest | `infinite_loop` | 0.4717 | 1.0000 | 0.6410 | |
| Isolation Forest | `high_latency` | 0.4717 | 1.0000 | 0.6410 | |
| Isolation Forest | `tool_failure_cascade` | 0.4615 | 0.9600 | 0.6234 | |
| Isolation Forest | `behavioral_drift` | 0.4286 | 0.8400 | 0.5676 | |
| **LOF Baseline** | **OVERALL** | **0.8108** | **0.9600** | **0.8791** | 6.120 ms |
| **Threshold Rules** | **OVERALL** | **0.6727** | **0.5920** | **0.6298** | 0.120 ms |

---

## ARS Predictive Correlation Analysis

- **Pearson Correlation Coefficient**: `r = -0.6943`
- **Result**: Strong negative correlation between Agent Reliability Score (ARS) at event $N$ and actual agent failure rate in events $N+1 \dots N+10$.
- **Conclusion**: Confirms that ARS serves as a predictive health index capable of warning operators before agent session failures cascade.

---

## Root Cause Analysis: Observed False Positives / False Negatives

1. **Initial Low Training Volume (< 200 events)**:
   - *Observation*: Training StandardScaler and Isolation Forest on < 10 events caused normal variance in token consumption to trigger false positive anomaly alerts.
   - *Fix*: Enforced a strict 200-event minimum in `isolation_forest.py` and `scheduler.py` before model fitting, with rule-based heuristics serving as fallback.

2. **Un-calibrated Token Spike Threshold vs Token Budget**:
   - *Observation*: Research Agent A002 emits normal token bursts of 200-400 tokens. A static 500 token threshold fired false positives when budget was set to 8000.
   - *Fix*: Calibrated token spike threshold to `0.20 * agent.token_budget` (1600 tokens for A002), keeping normal traffic comfortably below the alert threshold.
