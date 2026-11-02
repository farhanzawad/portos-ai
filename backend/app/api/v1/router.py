from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    terminals,
    berths,
    vessels,
    equipment,
    yard,
    events,
    kpis,
    provenance,
    models,
    berth_planner,
)

api_v1_router = APIRouter(prefix="/api/v1")

# Mount domain sub-routers
api_v1_router.include_router(health.router)
api_v1_router.include_router(terminals.router)
api_v1_router.include_router(berths.router)
api_v1_router.include_router(vessels.router)
api_v1_router.include_router(equipment.router)
api_v1_router.include_router(yard.router)
api_v1_router.include_router(events.router)
api_v1_router.include_router(kpis.router)
api_v1_router.include_router(provenance.router)
api_v1_router.include_router(models.router)
api_v1_router.include_router(berth_planner.router)
