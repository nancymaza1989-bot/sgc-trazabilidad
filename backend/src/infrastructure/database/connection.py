from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
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


async def init_db():
    async with engine.begin() as conn:
        # Crea cualquier tabla nueva (incluida la tabla puente asignacion_trabajos)
        # si no existe todavía. No se modifica "trabajos" para evitar locks en prod.
        await conn.run_sync(Base.metadata.create_all)
    await _sembrar_usuarios()

