from typing import Dict, Any, Callable

def make_token_spike(multiplier: float = 8.0, duration: int = 3) -> Callable[[Dict[str, Any]], Dict[str, Any]]:
    count = {'n': 0}
    def inject(event: Dict[str, Any]) -> Dict[str, Any]:
        if count['n'] < duration:
            event['tokens_used'] = int(event.get('tokens_used', 100) * multiplier)
            count['n'] += 1
        else:
            event['_restore'] = True
        return event
    return inject

def make_infinite_loop(duration: int = 5) -> Callable[[Dict[str, Any]], Dict[str, Any]]:
    count = {'n': 0}
    def inject(event: Dict[str, Any]) -> Dict[str, Any]:
        if count['n'] < duration:
            count['n'] += 1
            event['loop_count'] = count['n'] + 3
            event['status'] = 'SUCCESS'
        else:
            event['_restore'] = True
        return event
    return inject

def make_high_latency(multiplier: float = 6.0, duration: int = 3) -> Callable[[Dict[str, Any]], Dict[str, Any]]:
    count = {'n': 0}
    def inject(event: Dict[str, Any]) -> Dict[str, Any]:
        if count['n'] < duration:
            event['latency_ms'] = float(event.get('latency_ms', 500.0) * multiplier)
            count['n'] += 1
        else:
            event['_restore'] = True
        return event
    return inject

def make_failure_cascade(duration: int = 5) -> Callable[[Dict[str, Any]], Dict[str, Any]]:
    count = {'n': 0}
    def inject(event: Dict[str, Any]) -> Dict[str, Any]:
        if count['n'] < duration:
            event['status'] = 'FAILURE'
            event['error_message'] = f'Cascading tool failure step {count["n"]+1}: downstream dependency unavailable'
            count['n'] += 1
        else:
            event['_restore'] = True
        return event
    return inject

def make_behavioral_drift(duration: int = 15) -> Callable[[Dict[str, Any]], Dict[str, Any]]:
    count = {'n': 0}
    def inject(event: Dict[str, Any]) -> Dict[str, Any]:
        if count['n'] < duration:
            count['n'] += 1
            drift_factor = 1.0 + (0.08 * count['n'])
            event['tokens_used'] = int(event.get('tokens_used', 100) * drift_factor)
            event['latency_ms'] = float(event.get('latency_ms', 400.0) * drift_factor)
        else:
            event['_restore'] = True
        return event
    return inject

def get_anomaly_injector(anomaly_type: str, duration: int = 3) -> Callable[[Dict[str, Any]], Dict[str, Any]]:
    if anomaly_type == 'token_spike':
        return make_token_spike(multiplier=8.0, duration=duration)
    elif anomaly_type == 'infinite_loop':
        return make_infinite_loop(duration=duration)
    elif anomaly_type == 'high_latency':
        return make_high_latency(multiplier=6.0, duration=duration)
    elif anomaly_type == 'tool_failure_cascade':
        return make_failure_cascade(duration=duration)
    elif anomaly_type == 'behavioral_drift':
        return make_behavioral_drift(duration=duration)
    else:
        raise ValueError(f"Unknown anomaly type: {anomaly_type}")
