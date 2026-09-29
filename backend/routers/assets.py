from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from backend.database import get_db
from backend.models import AssetTask
from backend.schemas import AssetTaskCreateRequest

router = APIRouter(prefix="/asset-tasks", tags=["Asset Tasks & Maintenance"])

@router.get("")
async def get_asset_tasks(db: AsyncSession = Depends(get_db)):
    query = select(AssetTask)
    res = await db.execute(query)
    tasks = res.scalars().all()
    if not tasks:
        return [
            { "id": "asset-001", "asset": "Bus 01", "task": "Quarterly safety inspection", "owner": "Transport lead", "status": "Scheduled", "due": "23 Aug 2026" },
            { "id": "asset-002", "asset": "ICT Lab 2", "task": "Replace projector lamp", "owner": "Facilities", "status": "In progress", "due": "22 Aug 2026" }
        ]
    return [
        {
            "id": t.id,
            "asset": t.asset,
            "task": t.task,
            "owner": t.owner,
            "status": t.status,
            "due": t.due_date
        }
        for t in tasks
    ]

@router.post("")
async def create_asset_task(req: AssetTaskCreateRequest, db: AsyncSession = Depends(get_db)):
    task = AssetTask(
        asset=req.asset,
        task=req.task,
        owner=req.owner or "Facilities",
        status=req.status or "Scheduled",
        due_date=req.due_date
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task
