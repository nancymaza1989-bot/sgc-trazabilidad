import uuid
from sqlalchemy import Column, String, Text, DateTime, Integer, Float
from sqlalchemy.sql import func
from src.infrastructure.database.connection import Base

def _uuid():
    return str(uuid.uuid4())

class RequerimientoModel(Base):
    __tablename__ = "requerimientos"

    id = Column(String(36), primary_key=True, default=_uuid)
    titulo = Column(String(255), nullable=False)
    tipo = Column(String(50), nullable=False, default="Funcional")
    prioridad = Column(String(50), nullable=False, default="Media")
    estado = Column(String(50), nullable=False, default="Registrado")
    responsable = Column(String(100), nullable=False)
    fecha = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class VersionModel(Base):
    __tablename__ = "versiones_despliegue"

    id = Column(String(36), primary_key=True, default=_uuid)
    version = Column(String(50), nullable=False)
    ambiente = Column(String(50), nullable=False, default="Pruebas")
    responsable = Column(String(100), nullable=False)
    fecha = Column(String(50), nullable=True)
    estado = Column(String(50), nullable=False, default="En validación")
    cambios = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CalidadIsoModel(Base):
    __tablename__ = "calidad_iso_evaluaciones"

    id = Column(String(36), primary_key=True, default=_uuid)
    version_ref = Column(String(100), nullable=False)
    puntaje_global = Column(Float, nullable=False, default=80.0)
    detalles = Column(Text, nullable=True)  # JSON string con las 8 características
    evaluador = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditoriaModel(Base):
    __tablename__ = "auditoria_logs"

    id = Column(String(36), primary_key=True, default=_uuid)
    usuario = Column(String(150), nullable=False)
    modulo = Column(String(100), nullable=False)
    accion = Column(String(100), nullable=False)
    entidad = Column(String(100), nullable=False)
    fecha = Column(String(50), nullable=True)
    ip = Column(String(50), nullable=True, default="10.0.0.15")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
