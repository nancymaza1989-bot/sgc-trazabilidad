from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from src.core.config import DATABASE_URL
import os

if "sqlite" in DATABASE_URL:
    async_database_url = DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///")
else:
    async_database_url = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    async_database_url,
    echo=False,
    pool_pre_ping=True,
    **({"pool_size": 20, "max_overflow": 40} if "sqlite" not in DATABASE_URL else {})
)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


async def _migrar_columna(conn, tabla: str, columna: str, definicion: str):
    """Agrega una columna a una tabla ya existente si no existe (idempotente)."""
    is_sqlite = "sqlite" in DATABASE_URL
    if is_sqlite:
        # SQLite (aiosqlite) no soporta IF NOT EXISTS en todas las versiones;
        # se consulta PRAGMA table_info para verificar.
        filas = (await conn.exec_driver_sql(f"PRAGMA table_info({tabla})")).fetchall()
        columnas = {fila[1] for fila in filas}
        if columna not in columnas:
            await conn.exec_driver_sql(f"ALTER TABLE {tabla} ADD COLUMN {columna} {definicion}")
    else:
        await conn.exec_driver_sql(
            f"ALTER TABLE {tabla} ADD COLUMN IF NOT EXISTS {columna} {definicion}"
        )


async def init_db():
    async with engine.begin() as conn:
        # Crea tablas nuevas (proyectos, adjuntos_trabajo, asignaciones, ...) si no existen.
        await conn.run_sync(Base.metadata.create_all)
        # Migraciones ligeras sobre tablas preexistentes (sin migraciones formales):
        # 1. Columna "asignacion_id" en "trabajos" (nueva FK a asignaciones).
        await _migrar_columna(conn, "trabajos", "asignacion_id", "VARCHAR(36)")
        # 2. Verificar que las tablas nuevas existen (create_all las creó).

