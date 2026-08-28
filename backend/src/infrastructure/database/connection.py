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

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
