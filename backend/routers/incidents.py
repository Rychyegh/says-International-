from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from backend.database import get_db
from backend.models import Incident
from backend.schemas import IncidentCreateRequest

router = APIRouter(prefix="/incidents", tags=["Incidents & Safeguarding"])

@router.get("")
async def get_incidents(db: AsyncSession = Depends(get_db)):
    query = select(Incident)
    res = await db.execute(query)
    incidents = res.scalars().all()
    return [
        {
            "id": inc.id,
            "category": inc.category,
            "person": inc.person,
            "severity": inc.severity,
            "status": inc.status,
            "loggedAt": inc.logged_at
        }
        for inc in incidents
    ]

@router.post("")
async def create_incident(req: IncidentCreateRequest, db: AsyncSession = Depends(get_db)):
    incident = Incident(
        category=req.category,
        person=req.person,
        severity=req.severity or "Restricted",
        status=req.status or "Under review"
    )
    db.add(incident)
    await db.commit()
    await db.refresh(incident)
    return incident
