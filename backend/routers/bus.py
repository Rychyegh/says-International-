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
    if not routes:
        # Return default Bogoso school bus routes
        return [
            {
                "id": "route-01",
                "name": "Route A · Bogoso Anikoko - Shining Star",
                "busNumber": "WR-4412-24",
                "driver": "Mr. Isaac Mensah",
                "phone": "024 100 2001",
                "status": "In Transit",
                "currentLocation": { "lat": 5.5824, "lng": -2.0123 },
                "speed": 34,
                "stops": ["Shining Star Hotel", "Anikoko Junction", "REMALJ Campus"]
            },
            {
                "id": "route-02",
                "name": "Route B · Prestea Mining Highway",
                "busNumber": "WR-8821-25",
                "driver": "Mr. Joseph Quaye",
                "phone": "024 100 2002",
                "status": "On Route",
                "currentLocation": { "lat": 5.5711, "lng": -2.0234 },
                "speed": 28,
                "stops": ["Prestea Barrier", "Market Circle", "REMALJ Campus"]
            }
        ]
    return routes

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
