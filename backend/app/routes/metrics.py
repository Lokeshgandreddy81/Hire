from fastapi import APIRouter
from app.core.logging import get_metrics

router = APIRouter()

@router.get("/metrics")
async def metrics_endpoint():
    """
    Expose metrics snapshot for monitoring.
    In production, this should be:
    - Protected by auth or IP whitelist
    - Exported to Prometheus/Datadog/CloudWatch
    - Not publicly accessible
    """
    return get_metrics()
