import os
import sys
import time
import json
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import RobustScaler

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.ml.feature_engineering import extract_features
from app.ml.isolation_forest import IFModel, IF_CONFIG
from app.ml.lof_baseline import LOFModel
from app.ml.reliability_score import compute_reliability_score
from app.scripts.evaluate import generate_normal_event, inject_anomaly_event, calculate_metrics

def benchmark_retraining_time():
    print("\n--- BENCHMARK 1: IF Retraining Time vs Training Set Size ---")
    sizes = [50, 100, 200, 500, 1000, 5000]
    results = {}
    
    # Generate maximum events needed
    agent_histories = {"A001": [], "A002": [], "A003": []}
    all_features = []
    
    for i in range(5000):
        atype = ["A001", "A002", "A003"][i % 3]
        ev = generate_normal_event(atype)
        feats = extract_features(ev, agent_histories[atype])
        all_features.append(feats)
        agent_histories[atype].append(ev)
        
    X_pool = np.array(all_features)
    
    for n in sizes:
        X_sub = X_pool[:n]
        times = []
        # Run multiple trials for stability (more trials for small N, fewer for large N)
        trials = 20 if n <= 500 else 10
        for _ in range(trials):
            scaler = RobustScaler()
            model = IsolationForest(**IF_CONFIG)
            
            t0 = time.perf_counter()
            X_scaled = scaler.fit_transform(X_sub)
            model.fit(X_scaled)
            t1 = time.perf_counter()
            
            times.append((t1 - t0) * 1000.0) # in ms
            
        mean_time = float(np.mean(times))
        std_time = float(np.std(times))
        median_time = float(np.median(times))
        p95_time = float(np.percentile(times, 95))
        
        results[str(n)] = {
            "n_samples": n,
            "mean_ms": round(mean_time, 2),
            "std_ms": round(std_time, 2),
            "median_ms": round(median_time, 2),
            "p95_ms": round(p95_time, 2),
            "trials": trials
        }
        print(f"  N = {n:5d} events: {mean_time:7.2f} ms ± {std_time:5.2f} ms (median: {median_time:7.2f} ms)")
        
    return results

def benchmark_latency_distribution():
    print("\n--- BENCHMARK 2: End-to-End and Component Latency Distribution ---")
    
    # Train IF model on 500 events
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
    
    # Generate 1,050 test events (800 normal + 250 anomalies)
    anomaly_types = ["token_spike", "infinite_loop", "high_latency", "tool_failure_cascade", "behavioral_drift"]
    test_events = []
    for i in range(800):
        test_events.append(generate_normal_event(["A001", "A002", "A003"][i % 3]))
    for atype in anomaly_types:
        for i in range(50):
            test_events.append(inject_anomaly_event(atype, ["A001", "A002", "A003"][i % 3]))
            
    eval_histories = {"A001": list(agent_histories["A001"]), "A002": list(agent_histories["A002"]), "A003": list(agent_histories["A003"])}
    
    feature_ext_latencies = []
    scoring_latencies = []
    alert_rule_latencies = []
    ars_latencies = []
    pipeline_latencies = []
    
    for ev in test_events:
        atype = ev.get('agent_type', 'A001')
        
        t_start = time.perf_counter()
        
        # 1. Feature extraction
        t0 = time.perf_counter()
        feats = extract_features(ev, eval_histories[atype])
        t1 = time.perf_counter()
        feature_ext_latencies.append((t1 - t0) * 1000.0)
        
        # 2. Model scoring
        t2 = time.perf_counter()
        score, is_anom = if_model.score(feats)
        t3 = time.perf_counter()
        scoring_latencies.append((t3 - t2) * 1000.0)
        
        # 3. Alert rule evaluation (simulated)
        t4 = time.perf_counter()
        hist_tok = [e['tokens_used'] for e in eval_histories[atype][-50:]] if eval_histories[atype] else [150]
        mean_tok = np.mean(hist_tok)
        is_loop = ev['loop_count'] >= 10
        is_cascade = ev['status'] != 'SUCCESS'
        is_token_spike = is_anom and (ev['tokens_used'] > 3.0 * mean_tok)
        t5 = time.perf_counter()
        alert_rule_latencies.append((t5 - t4) * 1000.0)
        
        # 4. ARS calculation
        t6 = time.perf_counter()
        recent_evs = eval_histories[atype][-20:] + [ev]
        succ_calls = sum(1 for e in recent_evs if e['status'] == 'SUCCESS')
        tot_calls = len(recent_evs)
        avg_lat = float(np.mean([e['latency_ms'] for e in recent_evs]))
        tot_tok = sum(e['tokens_used'] for e in recent_evs)
        avg_loops = float(np.mean([e['loop_count'] for e in recent_evs]))
        ars_res = compute_reliability_score({
            'successful_calls': succ_calls,
            'total_calls': tot_calls,
            'expected_tokens': 150.0 * tot_calls,
            'actual_tokens': tot_tok,
            'avg_latency': avg_lat,
            'baseline_latency': 400.0,
            'avg_loop_count': avg_loops
        })
        t7 = time.perf_counter()
        ars_latencies.append((t7 - t6) * 1000.0)
        
        t_end = time.perf_counter()
        pipeline_latencies.append((t_end - t_start) * 1000.0)
        
        if ev['status'] == 'SUCCESS' and ev['loop_count'] <= 3:
            eval_histories[atype].append(ev)
            
    def compute_distribution(arr):
        return {
            "mean_ms": round(float(np.mean(arr)), 3),
            "std_ms": round(float(np.std(arr)), 3),
            "median_ms": round(float(np.median(arr)), 3),
            "p50_ms": round(float(np.percentile(arr, 50)), 3),
            "p90_ms": round(float(np.percentile(arr, 90)), 3),
            "p95_ms": round(float(np.percentile(arr, 95)), 3),
            "p99_ms": round(float(np.percentile(arr, 99)), 3),
            "min_ms": round(float(np.min(arr)), 3),
            "max_ms": round(float(np.max(arr)), 3)
        }
        
    latency_summary = {
        "feature_extraction": compute_distribution(feature_ext_latencies),
        "model_scoring_if": compute_distribution(scoring_latencies),
        "alert_rule_eval": compute_distribution(alert_rule_latencies),
        "ars_computation": compute_distribution(ars_latencies),
        "end_to_end_pipeline": compute_distribution(pipeline_latencies)
    }
    
    print("Scoring Latency (IF Model):", latency_summary["model_scoring_if"])
    print("End-to-End Pipeline Latency:", latency_summary["end_to_end_pipeline"])
    
    return latency_summary

def run_all_benchmarks():
    retrain_res = benchmark_retraining_time()
    latency_res = benchmark_latency_distribution()
    
    full_artifact = {
        "retraining_benchmarks": retrain_res,
        "latency_distribution": latency_res
    }
    
    out_path = os.path.join(os.path.dirname(__file__), "paper_benchmark_supplement.json")
    with open(out_path, "w") as f:
        json.dump(full_artifact, f, indent=2)
    print(f"\nAll benchmark measurements written to: {out_path}")

if __name__ == "__main__":
    run_all_benchmarks()
