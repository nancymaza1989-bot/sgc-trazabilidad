from sqlalchemy import Column, String, Text, DateTime, UUID, Enum, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from src.infrastructure.database.connection import Base
from src.core.constants import EstadoIncidencia, Prioridad, Severidad

class IncidenciaModel(Base):
    __tablename__ = "incidencias"
    
    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    titulo = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=False)
    pasos_reproducir = Column(Text, nullable=True)
    severidad = Column(Enum(Severidad), nullable=False, default=Severidad.MEDIA)
    prioridad = Column(Enum(Prioridad), nullable=False, default=Prioridad.MEDIA)
    categoria = Column(String(100), nullable=True)
    estado = Column(Enum(EstadoIncidencia), nullable=False, default=EstadoIncidencia.REPORTADO)
    asignado_a = Column(PGUUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=True)
    reportado_por = Column(PGUUID(as_uuid=True), ForeignKey("usuarios.id"), nullable=False)
    fecha_reporte = Column(DateTime(timezone=True), server_default=func.now())
    fecha_resolucion = Column(DateTime(timezone=True), nullable=True)
    tiempo_resolucion = Column(Float, nullable=True)
    tiempo_respuesta = Column(Float, nullable=True)
    version_afectada = Column(String(50), nullable=True)
    version_resuelta = Column(String(50), nullable=True)
    ia_categoria = Column(String(100), nullable=True)
    ia_prioridad = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)