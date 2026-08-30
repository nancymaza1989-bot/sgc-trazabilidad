from fastapi import APIRouter
from src.interfaces.api.v1.endpoints import auth, incidencias, dashboard, trabajos, documentos, configuracion, usuarios, reportes

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
router.include_router(trabajos.router, prefix="/trabajos", tags=["Trabajos"])
router.include_router(incidencias.router, prefix="/incidencias", tags=["Incidencias"])
router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
router.include_router(documentos.router, prefix="/documentos", tags=["Documentos PDF"])
router.include_router(configuracion.router, prefix="/configuracion", tags=["Configuración"])
router.include_router(usuarios.router, prefix="/usuarios", tags=["Usuarios"])
router.include_router(reportes.router, prefix="/reportes", tags=["Reportes"])