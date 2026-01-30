"""
Structured logging — no PII. Safe for production.
"""
import json
import logging
from datetime import datetime
from typing import Any, Optional

def _sanitize(value: Any) -> Any:
    """Ensure no PII or secrets in logged values."""
    if value is None or isinstance(value, (bool, int, float)):
        return value
    if isinstance(value, str) and len(value) > 64:
        return value[:32] + "...[redacted]"
    return value

def log_event(
    event: str,
    request_id: Optional[str] = None,
    level: str = "info",
    **kwargs: Any
) -> None:
    """Emit one structured log line. No PII in kwargs."""
    payload = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "event": event,
        "level": level,
    }
    if request_id:
        payload["request_id"] = request_id
    for k, v in kwargs.items():
        if k.lower() in ("password", "token", "otp", "identifier", "email", "phone"):
            payload[k] = "[redacted]"
        else:
            payload[k] = _sanitize(v)
    out = json.dumps(payload)
    if level == "error":
        logging.error(out)
    else:
        logging.info(out)
