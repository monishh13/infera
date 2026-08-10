import os
import json
import time
import csv
import numpy as np
from datetime import datetime
from typing import Dict, List, Any

from app.ml.feature_engineering import extract_features
from app.ml.isolation_forest import IFModel
from app.ml.lof_baseline import LOFModel

def calculate_metrics(y_true: List[bool], y_pred: List[bool]) -> Dict[str, float]:
    tp = sum(1 for gt, pred in zip(y_true, y_pred) if gt and pred)
    fp = sum(1 for gt, pred in zip(y_true, y_pred) if not gt and pred)
    fn = sum(1 for gt, pred in zip(y_true, y_pred) if gt and not pred)
    tn = sum(1 for gt, pred in zip(y_true, y_pred) if not gt and not pred)

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0

    return {
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "fpr": round(fpr, 4),
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "tn": tn
    }

def generate_normal_event(agent_type: str = "A001") -> Dict[str, Any]:
    if agent_type == "A001":
        tok = int(np.random.normal(115, 12))
        lat = float(np.random.normal(400, 50))
        loop = 2 if np.random.random() < 0.05 else 1
        status = "SUCCESS" if np.random.random() <= 0.95 else "FAILURE"
    elif agent_type == "A002":
        tok = int(np.random.normal(300, 30))
        lat = float(np.random.normal(1200, 100))
        loop = int(np.random.choice([1, 2, 3], p=[0.7, 0.2, 0.1]))
        status = "SUCCESS" if np.random.random() <= 0.85 else "FAILURE"
    else:  # A003
        tok = int(np.random.normal(150, 15))
        lat = float(np.random.normal(600, 60))
        loop = 2 if np.random.random() < 0.1 else 1
        status = "SUCCESS" if np.random.random() <= 0.90 else "FAILURE"

    return {
        'agent_type': agent_type,
        'tokens_used': max(30, tok),
        'latency_ms': max(100.0, lat),
        'loop_count': max(1, loop),
        'status': status
    }

def inject_anomaly_event(anomaly_type: str, agent_type: str = "A001") -> Dict[str, Any]:
    base = generate_normal_event(agent_type)
    if anomaly_type == "token_spike":
        base['tokens_used'] = base['tokens_used'] * np.random.randint(6, 12)
    elif anomaly_type == "infinite_loop":
        base['loop_count'] = np.random.randint(11, 25)
    elif anomaly_type == "high_latency":
        base['latency_ms'] = base['latency_ms'] * np.random.uniform(5.0, 10.0)
    elif anomaly_type == "tool_failure_cascade":
        base['status'] = "FAILURE"
        base['tokens_used'] = int(base['tokens_used'] * 1.5)
    elif anomaly_type == "behavioral_drift":
        base['tokens_used'] = int(base['tokens_used'] * 2.8)
        base['latency_ms'] = base['latency_ms'] * 2.5

    return base

def run_evaluation():
    print("=" * 60)
    print("INFERA EVALUATION HARNESS - BENCHMARK RUN")
    print("=" * 60)

    # 1. Train models on 500 normal events per agent history
    print("[1/5] Training Isolation Forest & LOF models on 500 normal baseline events...")
    agent_histories = {"A001": [], "A002": [], "A003": []}
    feature_matrix_list = []

    for i in range(500):
        atype = ["A001", "A002", "A003"][i % 3]
        ev = generate_normal_event(atype)
        feats = extract_features(ev, agent_histories[atype])
        feature_matrix_list.append(feats)
        agent_histories[atype].append(ev)

    X_train = np.array(feature_matrix_list)

    if_model = IFModel()
    if_model.train(X_train)

    lof_model = LOFModel()
    lof_model.train(X_train)
    print("      Model training complete.")

    # 2. Build test dataset (800 normal + 250 injected anomalies: 50 per type)
    print("[2/5] Constructing test dataset (800 normal + 250 injected anomalies across 5 types)...")
    anomaly_types = ["token_spike", "infinite_loop", "high_latency", "tool_failure_cascade", "behavioral_drift"]
    
    test_events = []
    ground_truth = []
    anomaly_categories = []

    for i in range(800):
        atype = ["A001", "A002", "A003"][i % 3]
        test_events.append(generate_normal_event(atype))
        ground_truth.append(False)
        anomaly_categories.append("normal")

    for atype in anomaly_types:
        for i in range(50):
            agent_type = ["A001", "A002", "A003"][i % 3]
            test_events.append(inject_anomaly_event(atype, agent_type))
            ground_truth.append(True)
            anomaly_categories.append(atype)

    # 3. Evaluate models & compute detection latency
    print("[3/5] Scoring events & measuring detection latency...")
    if_preds = []
    lof_preds = []
    thresh_preds = []
    latencies_ms = []

    eval_histories = {"A001": list(agent_histories["A001"]), "A002": list(agent_histories["A002"]), "A003": list(agent_histories["A003"])}

    for ev in test_events:
        atype = ev.get('agent_type', 'A001')
        feats = extract_features(ev, eval_histories[atype])
        
        t0 = time.perf_counter()
        if_score, if_anom = if_model.score(feats)
        t1 = time.perf_counter()
        latencies_ms.append((t1 - t0) * 1000.0)

        lof_score, lof_anom = lof_model.score(feats)

        # Threshold rules
        hist_tok = [e['tokens_used'] for e in eval_histories[atype][-50:]] if eval_histories[atype] else [150]
        mean_tok = np.mean(hist_tok)
        thresh_anom = (ev['tokens_used'] > 3.0 * mean_tok) or (ev['loop_count'] >= 10) or (ev['status'] != 'SUCCESS')

        if_preds.append(if_anom)
        lof_preds.append(lof_anom)
        thresh_preds.append(thresh_anom)

        # Update history with normal baseline progression
        if ev['status'] == 'SUCCESS' and ev['loop_count'] <= 3:
            eval_histories[atype].append(ev)

    avg_detection_latency_ms = round(float(np.mean(latencies_ms)), 3)

    # 4. Idle / Normal FPR evaluation (1000 normal events over 2h simulation)
    print("[4/5] Running 2-hour idle simulation (1000 normal events) for FPR check...")
    idle_events = [generate_normal_event(["A001", "A002", "A003"][i % 3]) for i in range(1000)]
    idle_histories = {"A001": list(agent_histories["A001"]), "A002": list(agent_histories["A002"]), "A003": list(agent_histories["A003"])}
    idle_if_preds = []
    for ev in idle_events:
        atype = ev['agent_type']
        feats = extract_features(ev, idle_histories[atype])
        _, is_anom = if_model.score(feats)
        idle_if_preds.append(is_anom)
        idle_histories[atype].append(ev)

    idle_fpr = round(sum(1 for p in idle_if_preds if p) / len(idle_if_preds), 4)

    # 5. Compute Metrics per Anomaly Type and Overall
    print("[5/5] Computing final evaluation metrics...")
    
    type_results = {}
    for atype in anomaly_types:
        indices = [i for i, cat in enumerate(anomaly_categories) if cat == atype or cat == "normal"]
        sub_gt = [ground_truth[i] for i in indices]
        sub_if = [if_preds[i] for i in indices]
        sub_lof = [lof_preds[i] for i in indices]
        sub_thresh = [thresh_preds[i] for i in indices]

        type_results[atype] = {
            "Isolation Forest": calculate_metrics(sub_gt, sub_if),
            "LOF Baseline": calculate_metrics(sub_gt, sub_lof),
            "Threshold Rules": calculate_metrics(sub_gt, sub_thresh)
        }

    overall_results = {
        "Isolation Forest": calculate_metrics(ground_truth, if_preds),
        "LOF Baseline": calculate_metrics(ground_truth, lof_preds),
        "Threshold Rules": calculate_metrics(ground_truth, thresh_preds)
    }

    report = {
        "timestamp": datetime.now().isoformat(),
        "total_events_evaluated": len(test_events),
        "injected_anomalies_count": 250,
        "avg_detection_latency_ms": avg_detection_latency_ms,
        "idle_false_positive_rate": idle_fpr,
        "overall": overall_results,
        "per_type": type_results
    }

    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "evaluation_results.json")
    csv_path = os.path.join(script_dir, "evaluation_results.csv")

    with open(json_path, "w") as f:
        json.dump(report, f, indent=2)

    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Model", "Anomaly Type", "Precision", "Recall", "F1 Score", "FPR"])
        for model_name in ["Isolation Forest", "LOF Baseline", "Threshold Rules"]:
            m = overall_results[model_name]
            writer.writerow([model_name, "OVERALL", m["precision"], m["recall"], m["f1"], m["fpr"]])
            for atype in anomaly_types:
                tm = type_results[atype][model_name]
                writer.writerow([model_name, atype, tm["precision"], tm["recall"], tm["f1"], tm["fpr"]])

    print("\n" + "=" * 80)
    print("EVALUATION RESULTS SUMMARY TABLE (FOR RESEARCH PAPER SECTION 7)")
    print("=" * 80)
    print(f"Average Scoring Latency: {avg_detection_latency_ms} ms | Normal Operation FPR: {idle_fpr * 100:.2f}%\n")
    print(f"{'Model':<20} | {'Anomaly Type':<22} | {'Precision':<10} | {'Recall':<10} | {'F1 Score':<10}")
    print("-" * 80)
    for model_name in ["Isolation Forest", "LOF Baseline", "Threshold Rules"]:
        m = overall_results[model_name]
        print(f"{model_name:<20} | {'OVERALL':<22} | {m['precision']:<10.4f} | {m['recall']:<10.4f} | {m['f1']:<10.4f}")
        for atype in anomaly_types:
            tm = type_results[atype][model_name]
            print(f"{'':<20} | {atype:<22} | {tm['precision']:<10.4f} | {tm['recall']:<10.4f} | {tm['f1']:<10.4f}")
        print("-" * 80)

    print(f"\nResults saved to {json_path} and {csv_path}")

if __name__ == "__main__":
    run_evaluation()
