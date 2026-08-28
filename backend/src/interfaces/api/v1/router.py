from fastapi import APIRouter
from src.interfaces.api.v1.endpoints import auth, incidencias, dashboard

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
router.include_router(incidencias.router, prefix="/incidencias", tags=["Incidencias"])
router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])