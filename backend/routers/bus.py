from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime

from backend.database import get_db
from backend.models import BusRoute
from backend.schemas import BusTelemetryRequest

router = APIRouter(prefix="/bus", tags=["Bus Tracking & Telemetry"])

@router.get("/routes")
async def get_bus_routes(db: AsyncSession = Depends(get_db)):
    query = select(BusRoute)
    res = await db.execute(query)
    routes = res.scalars().all()
    return [
        {
            "id": r.id,
            "name": r.route_name,
            "busNumber": r.bus_number,
            "driver": r.driver_name,
            "phone": r.driver_phone,
            "status": r.status,
            "currentLocation": { "lat": r.current_lat, "lng": r.current_lng },
            "speed": r.speed
        }
        for r in routes
    ]

@router.post("/telemetry")
async def update_bus_telemetry(req: BusTelemetryRequest, db: AsyncSession = Depends(get_db)):
    query = select(BusRoute).where(BusRoute.id == req.routeId)
    res = await db.execute(query)
    route = res.scalars().first()
    if route:
        route.current_lat = req.lat
        route.current_lng = req.lng
        route.speed = req.speed
        route.updated_at = datetime.utcnow()
        await db.commit()

    return {
        "success": True,
        "message": f"Telemetry updated for {req.routeId}",
        "lat": req.lat,
        "lng": req.lng,
        "speed": req.speed
    }
