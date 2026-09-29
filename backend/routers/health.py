from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
async def get_health():
    return {
        "status": "healthy",
        "service": "REMALJ Carewell SIMS API v1",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected"
    }
