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
    scenarios,
    sustainability,
    ingestion,
    copilot,
    weather,
    gov_data,
    geospatial,
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
api_v1_router.include_router(scenarios.router)
api_v1_router.include_router(sustainability.router)
api_v1_router.include_router(ingestion.router)
api_v1_router.include_router(copilot.router)
api_v1_router.include_router(weather.router)
api_v1_router.include_router(gov_data.router)
api_v1_router.include_router(geospatial.router)
