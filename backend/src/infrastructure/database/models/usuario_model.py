import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func

from src.infrastructure.database.connection import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class UsuarioModel(Base):
    """Usuario del sistema con control de acceso basado en roles (RBAC)."""

    __tablename__ = "usuarios"

    id = Column(String(36), primary_key=True, default=_uuid)
    nombre = Column(String(255), nullable=False, default="")
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    rol = Column(String(100), nullable=False, default="analista")
    area = Column(String(255), nullable=True, default="Calidad")
    estado = Column(String(50), nullable=False, default="Activo")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
