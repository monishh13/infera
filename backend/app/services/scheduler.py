import logging
import numpy as np
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.config import settings
from app.database import AsyncSessionLocal
from app.models.telemetry import TelemetryEvent
from app.models.ml_metadata import MLModelMetadata
from app.ml.feature_engineering import extract_features
from app.ml.isolation_forest import IFModel
from app.ml.model_store import set_active_model, get_model_path

logger = logging.getLogger("infera.scheduler")
scheduler = AsyncIOScheduler()

async def retrain_models_job():
    """
    Periodic job that retrains the Isolation Forest model on historical telemetry events.
    Runs every MODEL_RETRAIN_INTERVAL_MINUTES.
    Computes real precision, recall, and F1 evaluation metrics on held-out 20% eval split.
    Also trains specialized per-agent models for agents with >= 200 events.
    """
    logger.info("Running periodic Isolation Forest model retraining job...")
    async with AsyncSessionLocal() as db:
        stmt = select(TelemetryEvent).order_by(TelemetryEvent.timestamp.desc()).limit(5000)
        result = await db.execute(stmt)
        events = result.scalars().all()
        
        if len(events) < 200:
            logger.info(f"Insufficient events for retraining ({len(events)} < 200). Skipping.")
            return

        # Prepare ordered event dicts (oldest to newest)
        chrono_events = list(reversed(events))
        events_dicts = [
            {
                'tokens_used': e.tokens_used,
                'latency_ms': e.latency_ms,
                'loop_count': e.loop_count,
                'status': e.status,
                'prompt_length': e.prompt_length,
                'response_length': e.response_length,
                'agent_id': e.agent_id
            }
            for e in chrono_events
        ]

        # Build per-agent histories so baselines are not contaminated by other
        # agents with different normal token and latency distributions.
        feature_list = []
        y_list = []
        histories = {}
        for i, ev in enumerate(events_dicts):
            agent_history = histories.setdefault(ev['agent_id'], [])
            history = agent_history[-50:]
            feats = extract_features(ev, history)
            feature_list.append(feats)
            y_list.append(1 if ev['status'] != 'SUCCESS' else 0)
            agent_history.append(ev)

        feature_matrix = np.array(feature_list)
        y_matrix = np.array(y_list)

        # Train only on successful telemetry. An unsupervised detector should
        # model normal behavior, not absorb known failures as normal.
        split_idx = int(len(feature_matrix) * 0.8)
        train_mask = y_matrix[:split_idx] == 0
        X_train = feature_matrix[:split_idx][train_mask]
        X_eval = feature_matrix[split_idx:]
        y_eval = y_matrix[split_idx:]

        if len(X_train) < 200:
            X_train = feature_matrix[y_matrix == 0]
        if len(X_train) < 200:
            logger.info("Insufficient successful events for clean retraining. Skipping.")
            return

        # Keep the configured cutoff stable across datasets; calibrate it from
        # the held-out labels instead of deriving it from failure prevalence.
        contamination = 0.05

        # 3. Global Model Training & Evaluation
        global_model = IFModel(contamination=contamination)
        global_model.train(X_train)
        global_model.calibrate(X_eval, y_eval)
        set_active_model(global_model, agent_id=None)

        precision, recall, f1 = global_model.evaluate(X_eval, y_eval)

        # Save metadata record for global model
        meta = MLModelMetadata(
            model_type="isolation_forest",
            agent_id=None,
            model_path=get_model_path(None),
            trained_on_count=len(feature_matrix),
            contamination=contamination,
            precision_score=precision,
            recall_score=recall,
            f1_score=f1,
            trained_at=datetime.utcnow(),
            is_active=True
        )
        db.add(meta)
        await db.commit()
        logger.info(f"Retrained global Isolation Forest on {len(feature_matrix)} events (contam={contamination:.3f}, P={precision}, R={recall}, F1={f1}).")

        # 4. Per-Agent Model Retraining
        agent_events_map = {}
        for ev, feats, y in zip(events_dicts, feature_matrix, y_matrix):
            ag_id = ev.get('agent_id')
            if ag_id:
                if ag_id not in agent_events_map:
                    agent_events_map[ag_id] = {'X': [], 'y': []}
                agent_events_map[ag_id]['X'].append(feats)
                agent_events_map[ag_id]['y'].append(y)

        for ag_id, data in agent_events_map.items():
            ag_X = np.array(data['X'])
            ag_y = np.array(data['y'])
            if len(ag_X) >= 200:
                ag_fail_rate = float(np.sum(ag_y)) / float(len(ag_y)) if len(ag_y) > 0 else 0.05
                ag_split = int(len(ag_X) * 0.8)
                ag_train_mask = ag_y[:ag_split] == 0
                ag_X_train = ag_X[:ag_split][ag_train_mask]
                ag_X_eval = ag_X[ag_split:]
                ag_y_eval = ag_y[ag_split:]

                if len(ag_X_train) < 200:
                    ag_X_train = ag_X[ag_y == 0]
                if len(ag_X_train) < 200:
                    continue

                ag_contam = 0.05
                ag_model = IFModel(contamination=ag_contam)
                ag_model.train(ag_X_train)
                ag_model.calibrate(ag_X_eval, ag_y_eval)
                set_active_model(ag_model, agent_id=ag_id)

                ag_p, ag_r, ag_f1 = ag_model.evaluate(ag_X_eval, ag_y_eval)

                ag_meta = MLModelMetadata(
                    model_type="isolation_forest",
                    agent_id=ag_id,
                    model_path=get_model_path(ag_id),
                    trained_on_count=len(ag_X),
                    contamination=ag_contam,
                    precision_score=ag_p,
                    recall_score=ag_r,
                    f1_score=ag_f1,
                    trained_at=datetime.utcnow(),
                    is_active=True
                )
                db.add(ag_meta)
                await db.commit()
                logger.info(f"Retrained agent model for {ag_id} on {len(ag_X)} events (contam={ag_contam:.3f}, F1={ag_f1}).")

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(
            retrain_models_job,
            'interval',
            minutes=settings.MODEL_RETRAIN_INTERVAL_MINUTES,
            id='retrain_job',
            replace_existing=True
        )
        scheduler.start()
        logger.info(f"APScheduler started. Job registered for every {settings.MODEL_RETRAIN_INTERVAL_MINUTES} mins.")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
