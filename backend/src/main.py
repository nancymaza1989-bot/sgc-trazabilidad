from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from src.core.config import settings
from src.core.logging import logger
from src.interfaces.api.v1.router import router as api_v1_router
from src.infrastructure.database.connection import init_db
# Importar los modelos ANTES de init_db() para que create_all registre las tablas.
import src.infrastructure.database.models.trabajo_model  # noqa: F401,E402
import src.infrastructure.database.models.usuario_model  # noqa: F401,E402
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Iniciando {settings.APP_NAME} v{settings.APP_VERSION}...")
    await init_db()
    logger.info("Base de datos inicializada")
    yield
    logger.info(f"Cerrando {settings.APP_NAME}...")

app = FastAPI(
    title=settings.APP_NAME,
    description="Sistema de Gestión de Calidad y Trazabilidad del Poder Judicial del Perú",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_v1_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    from src.core.config import DATABASE_URL
    dialecto = "sqlite" if DATABASE_URL.startswith("sqlite") else ("postgres" if DATABASE_URL.startswith("postgres") else DATABASE_URL.split("/")[0])
    return {"status": "healthy", "version": settings.APP_VERSION, "db": dialecto}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)