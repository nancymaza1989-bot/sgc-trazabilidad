from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from src.core.config import DATABASE_URL

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


async def _sembrar_usuarios():
    # Crear los 3 roles por defecto si la tabla está vacía (para que el login
    # funcione desde el primer arranque, sustituyendo al diccionario hardcodeado).
    from sqlalchemy import select, func as safunc
    from src.infrastructure.database.models.usuario_model import UsuarioModel
    from src.core.security import hash_password

    async with AsyncSessionLocal() as session:
        total = (await session.execute(safunc.count(UsuarioModel.id))).scalar()
        if total and total > 0:
            return
        por_defecto = [
            ("Administrador SGC", "admin@poderjudicial.gob.pe", "Admin2024Secure", "administrador", "Calidad"),
            ("Coordinador de Calidad", "coordinador@poderjudicial.gob.pe", "Coord2024Secure", "coordinador", "Calidad"),
            ("Analista de Calidad", "analista@poderjudicial.gob.pe", "Analista2024Secure", "analista", "Calidad"),
        ]
        for nombre, email, passw, rol, area in por_defecto:
            session.add(UsuarioModel(
                nombre=nombre, email=email,
                password_hash=hash_password(passw), rol=rol, area=area, estado="Activo",
            ))
        await session.commit()


async def _aplicar_migraciones():
    """Alteras DDL idempotentes para tablas ya existentes.

    ``Base.metadata.create_all`` solo crea tablas NUEVAS; no añade columnas a las
    ya creadas en producción. Aquí aplicamos ``ALTER TABLE ... ADD COLUMN IF NOT
    EXISTS`` (postgres) de forma re-ejecutable para incorporar campos nuevos
    (RA-105 avanzado) sin necesidad de una migración completa de Alembic.
    """
    if "sqlite" in DATABASE_URL:
        return
    alteraciones = [
        # Criticidad/severidad por caso de prueba (ítem dentro del RA-105)
        "ALTER TABLE casos_prueba_items ADD COLUMN IF NOT EXISTS severidad VARCHAR(50) NOT NULL DEFAULT 'Media'",
        # Campos adicionales de la plantilla RA-105 (encabezado/conclusión)
        "ALTER TABLE casos_prueba ADD COLUMN IF NOT EXISTS numero_requerimiento VARCHAR(100)",
        "ALTER TABLE casos_prueba ADD COLUMN IF NOT EXISTS ambiente VARCHAR(100)",
        "ALTER TABLE casos_prueba ADD COLUMN IF NOT EXISTS precondiciones TEXT",
        "ALTER TABLE casos_prueba ADD COLUMN IF NOT EXISTS datos_prueba TEXT",
        "ALTER TABLE casos_prueba ADD COLUMN IF NOT EXISTS resultado_esperado TEXT",
    ]
    async with engine.begin() as conn:
        for ddl in alteraciones:
            try:
                await conn.execute(text(ddl))
            except Exception:  # No bloquear el arranque si una columna ya existe o la tabla no existe
                pass


async def init_db():
    async with engine.begin() as conn:
        # Crea cualquier tabla nueva (incluida la tabla puente asignacion_trabajos)
        # si no existe todavía. No se modifica "trabajos" para evitar locks en prod.
        await conn.run_sync(Base.metadata.create_all)
    await _aplicar_migraciones()
    await _sembrar_usuarios()

