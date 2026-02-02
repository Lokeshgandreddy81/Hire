import json
import logging
import time
from datetime import datetime, timezone
from typing import Any, Optional, Dict, Union
from collections import defaultdict
from contextlib import asynccontextmanager

# =============================================================================
# CONFIGURATION
# =============================================================================
logger = logging.getLogger("HireAppLogger")

# PII Keywords (Case-insensitive) - Anything matching these is scrubbed
SENSITIVE_KEYS = {
    "password", "token", "access_token", "refresh_token", 
    "otp", "secret", "identifier", "email", "phone", 
    "mobile", "credit_card", "ssn", "authorization", 
    "api_key", "cookie"
}

# =============================================================================
# METRICS STORAGE (IN-MEMORY COUNTERS)
# =============================================================================
# Note: For production, export these to Prometheus/Datadog/CloudWatch
_metrics: Dict[str, int] = defaultdict(int)
_latencies: Dict[str, list] = defaultdict(list)

def increment_metric(metric_name: str, value: int = 1) -> None:
    """
    Increment a counter metric.
    Examples: 'otp.sent', 'auth.refresh.success', 'rate_limit.hit'
    """
    _metrics[metric_name] += value
    
def record_latency(metric_name: str, duration_ms: float) -> None:
    """
    Record latency measurement.
    Examples: 'jobs.response_time', 'match.compute_time'
    """
    _latencies[metric_name].append(duration_ms)
    # Keep only last 1000 samples to prevent memory bloat
    if len(_latencies[metric_name]) > 1000:
        _latencies[metric_name] = _latencies[metric_name][-1000:]

def get_metrics() -> Dict[str, Any]:
    """
    Export current metrics snapshot (for /metrics endpoint or logging).
    """
    metrics_snapshot = dict(_metrics)
    
    # Calculate latency stats
    latency_stats = {}
    for key, values in _latencies.items():
        if values:
            latency_stats[f"{key}.p50"] = sorted(values)[len(values) // 2]
            latency_stats[f"{key}.p95"] = sorted(values)[int(len(values) * 0.95)]
            latency_stats[f"{key}.avg"] = sum(values) / len(values)
    
    return {
        "counters": metrics_snapshot,
        "latencies": latency_stats,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@asynccontextmanager
async def measure_latency(operation: str):
    """
    Context manager for measuring async operation latency.
    
    Usage:
        async with measure_latency("jobs.fetch"):
            result = await fetch_jobs()
    """
    start = time.perf_counter()
    try:
        yield
    finally:
        duration_ms = (time.perf_counter() - start) * 1000
        record_latency(operation, duration_ms)
        log_event(
            "latency_measured",
            operation=operation,
            duration_ms=round(duration_ms, 2)
        )

# =============================================================================
# SANITIZATION ENGINE (Recursive & Safe)
# =============================================================================

def _sanitize_value(key: str, value: Any) -> Any:
    """
    Scrub individual values based on key name or content type.
    """
    # 1. Key-based Redaction
    if key.lower() in SENSITIVE_KEYS:
        return "[REDACTED]"
    
    # 2. Type-based Safety
    if value is None:
        return None
    if isinstance(value, (bool, int, float)):
        return value
    
    # 3. String Truncation (Prevent massive log bloat)
    if isinstance(value, str):
        if len(value) > 1024: # Cap logs at 1KB per field
            return value[:64] + "...[TRUNCATED]"
        return value
    
    # 4. Fallback for objects (e.g. ObjectIds, Datetimes)
    return str(value)

def _sanitize_payload(data: Any) -> Any:
    """
    Recursively traverse dictionaries and lists to scrub PII.
    Cook Operational Discipline: Never trust nested data.
    """
    if isinstance(data, dict):
        return {k: _sanitize_payload(v) if k.lower() not in SENSITIVE_KEYS else "[REDACTED]" 
                for k, v in data.items()}
    elif isinstance(data, list):
        return [_sanitize_payload(item) for item in data]
    else:
        return _sanitize_value("generic", data)

# =============================================================================
# LOGGING INTERFACE
# =============================================================================

def log_event(
    event: str,
    request_id: Optional[str] = None,
    level: str = "info",
    error: Optional[Exception] = None,
    **kwargs: Any
) -> None:
    """
    Emit a structured, machine-parsable JSON log.
    
    Args:
        event: The name of the event (e.g., "job_created", "auth_failed")
        request_id: Tracing ID for correlation
        level: "info", "warning", "error", "critical"
        error: Optional Exception object (will be formatted)
        **kwargs: Additional context data
    """
    try:
        # 1. Base Payload
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event": event,
            "level": level.upper(),
            "environment": "production", # In real app, pull from settings
        }

        # 2. Context Injection
        if request_id:
            payload["request_id"] = request_id
            
        if error:
            payload["error_type"] = type(error).__name__
            payload["error_message"] = str(error)

        # 3. Data Sanitization
        sanitized_context = _sanitize_payload(kwargs)
        payload.update(sanitized_context)

        # 4. Serialization
        log_entry = json.dumps(payload, default=str)

        # 5. Emit
        method = getattr(logger, level.lower(), logger.info)
        method(log_entry)

    except Exception as e:
        # Emergency Fallback: If logging fails, print raw string so we don't lose data
        # This prevents the logging system itself from crashing the app
        print(f"LOGGING FAILURE: {event} - {str(e)}")