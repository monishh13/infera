from app.routers.auth import router as auth_router
from app.routers.agents import router as agents_router
from app.routers.sessions import router as sessions_router
from app.routers.telemetry import router as telemetry_router
from app.routers.anomalies import router as anomalies_router
from app.routers.dashboard import router as dashboard_router
from app.routers.simulator import router as simulator_router
from app.routers.ml import router as ml_router

all_routers = [
    auth_router,
    agents_router,
    sessions_router,
    telemetry_router,
    anomalies_router,
    dashboard_router,
    simulator_router,
    ml_router,
]
