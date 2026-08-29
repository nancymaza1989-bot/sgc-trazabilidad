from sqlalchemy import Column, String, Text, DateTime, Boolean, Date, ForeignKey, Integer, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from src.infrastructure.database.connection import Base


def _uuid() -> str:
    """UUID en formato string (36) compatible con SQLite Y PostgreSQL."""
    return str(uuid.uuid4())


class TrabajoModel(Base):
    __tablename__ = "trabajos"

    id = Column(String(36), primary_key=True, default=_uuid)
    numero_ticket = Column(String(255), nullable=False)
    proyecto = Column(String(255), nullable=False)
    tipo_atencion = Column(String(100), nullable=False)
    prioridad = Column(String(50), nullable=False, default="Media")
    instrucciones = Column(Text, nullable=True)
    documentacion = Column(Text, nullable=True)
    fecha_recepcion = Column(Date, nullable=True)
    coordinador = Column(String(255), nullable=True, default="Coordinador de Calidad")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    evaluaciones = relationship("EvaluacionModel", back_populates="trabajo",
                                cascade="all, delete-orphan", lazy="selectin")
    adjuntos = relationship("AdjuntoTrabajoModel", back_populates="trabajo",
                            cascade="all, delete-orphan", lazy="selectin")


class EvaluacionModel(Base):
    __tablename__ = "evaluaciones"

    id = Column(String(36), primary_key=True, default=_uuid)
    trabajo_id = Column(String(36), ForeignKey("trabajos.id"), nullable=False)
    analista = Column(String(255), nullable=False)
    analista_id = Column(String(255), nullable=True)
    fecha_asignacion = Column(Date, nullable=False)
    fecha_programada_entrega = Column(Date, nullable=True)
    fecha_real_entrega = Column(Date, nullable=True)
    estado = Column(String(100), nullable=False, default="Proceso de evaluación")
    resultado = Column(Text, nullable=True)
    historial = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    trabajo = relationship("TrabajoModel", back_populates="evaluaciones", lazy="selectin")
    incidencias = relationship("IncidenciaModel", back_populates="evaluacion",
                               cascade="all, delete-orphan", lazy="selectin")
    casos_prueba = relationship("CasoPruebaModel", back_populates="evaluacion",
                                cascade="all, delete-orphan", lazy="selectin")


class CasoPruebaModel(Base):
    """Encabezado del Formato de Caso de Prueba (RA-105)."""

    __tablename__ = "casos_prueba"

    id = Column(String(36), primary_key=True, default=_uuid)
    evaluacion_id = Column(String(36), ForeignKey("evaluaciones.id"), nullable=False)
    correlativo = Column(String(20), nullable=False)
    numero_caso = Column(String(50), nullable=True)
    numero_ticket = Column(String(255), nullable=True)
    numero_acta_pase = Column(String(100), nullable=True)
    nombre_analista = Column(String(255), nullable=True)
    tipo_pase = Column(String(100), nullable=True)
    fecha_prueba = Column(Date, nullable=True)
    flujo_componente = Column(String(255), nullable=False, default="")
    campo_componente = Column(String(255), nullable=True)
    resultado = Column(String(50), nullable=False, default="Pendiente")
    resultado_prueba = Column(String(50), nullable=True)
    observaciones = Column(Text, nullable=True)
    firma_analista = Column(Text, nullable=True)
    firma_supervisor = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    evaluacion = relationship("EvaluacionModel", back_populates="casos_prueba", lazy="selectin")
    casos = relationship("CasoPruebaItemModel", back_populates="caso_prueba",
                         cascade="all, delete-orphan", lazy="selectin")
    evidencias = relationship("EvidenciaCasoModel", back_populates="caso",
                              cascade="all, delete-orphan", lazy="selectin")


class CasoPruebaItemModel(Base):
    """Caso de prueba de la lista dinámica DENTRO del documento RA-105."""

    __tablename__ = "casos_prueba_items"

    id = Column(String(36), primary_key=True, default=_uuid)
    caso_prueba_id = Column(String(36), ForeignKey("casos_prueba.id"), nullable=False)
    numero = Column(String(20), nullable=False)
    descripcion = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    caso_prueba = relationship("CasoPruebaModel", back_populates="casos", lazy="selectin")
    evidencias = relationship("EvidenciaCasoItemModel", back_populates="caso_item",
                              cascade="all, delete-orphan", lazy="selectin")


class EvidenciaCasoModel(Base):
    """Evidencia directa del documento RA-105 (compatibilidad con flujo anterior)."""

    __tablename__ = "evidencias_caso"

    id = Column(String(36), primary_key=True, default=_uuid)
    caso_id = Column(String(36), ForeignKey("casos_prueba.id"), nullable=False)
    correlativo = Column(String(20), nullable=False)
    archivo = Column(String(500), nullable=False)
    descripcion = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    caso = relationship("CasoPruebaModel", back_populates="evidencias", lazy="selectin")


class EvidenciaCasoItemModel(Base):
    """Evidencia de un caso de la lista dinámica del documento RA-105."""

    __tablename__ = "evidencias_caso_item"

    id = Column(String(36), primary_key=True, default=_uuid)
    caso_item_id = Column(String(36), ForeignKey("casos_prueba_items.id"), nullable=False)
    correlativo = Column(String(20), nullable=False)
    archivo = Column(String(500), nullable=False)
    descripcion = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    caso_item = relationship("CasoPruebaItemModel", back_populates="evidencias", lazy="selectin")


class ProyectoModel(Base):
    """Catálogo de proyectos configurable desde el módulo Configuración."""

    __tablename__ = "proyectos"

    id = Column(String(36), primary_key=True, default=_uuid)
    nombre = Column(String(255), nullable=False, unique=True)
    activo = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AdjuntoTrabajoModel(Base):
    """Documentación adjunta a un trabajo (reg. del Coordinador) con vista previa."""

    __tablename__ = "adjuntos_trabajo"

    id = Column(String(36), primary_key=True, default=_uuid)
    trabajo_id = Column(String(36), ForeignKey("trabajos.id", ondelete="CASCADE"), nullable=False)
    nombre = Column(String(500), nullable=False)
    tipo_mime = Column(String(120), nullable=True)
    tamano = Column(Integer, nullable=True)
    archivo = Column(Text, nullable=True)  # data URI (base64) para vista previa/descarga
    descripcion = Column(Text, nullable=True)
    creado_por = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    trabajo = relationship("TrabajoModel", back_populates="adjuntos", lazy="selectin")


asignacion_trabajos = Table(
    "asignacion_trabajos",
    Base.metadata,
    Column("asignacion_id", String(36), ForeignKey("asignaciones.id", ondelete="CASCADE"), primary_key=True),
    Column("trabajo_id", String(36), ForeignKey("trabajos.id", ondelete="CASCADE"), primary_key=True),
)


class AsignacionModel(Base):
    """Asignación de pase de versión: analista encargado + grupo de analistas + varios tickets."""

    __tablename__ = "asignaciones"
    id = Column(String(36), primary_key=True, default=_uuid)
    nombre = Column(String(255), nullable=True)
    analista_encargado = Column(String(255), nullable=False)
    fecha_asignacion = Column(Date, nullable=False)
    fecha_programada_entrega = Column(Date, nullable=True)
    estado = Column(String(100), nullable=False, default="Asignado")
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    trabajos = relationship("TrabajoModel", secondary=asignacion_trabajos,
                            backref="asignaciones")
    analistas = relationship("AsignacionAnalistaModel", back_populates="asignacion",
                             cascade="all, delete-orphan", lazy="selectin")


class AsignacionAnalistaModel(Base):
    """Miembro del grupo de analistas de una asignación de pase de versión."""

    __tablename__ = "asignacion_analistas"

    id = Column(String(36), primary_key=True, default=_uuid)
    asignacion_id = Column(String(36), ForeignKey("asignaciones.id", ondelete="CASCADE"), nullable=False)
    analista = Column(String(255), nullable=False)

    asignacion = relationship("AsignacionModel", back_populates="analistas", lazy="selectin")


class IncidenciaModel(Base):
    """Formato de Incidencia del Poder Judicial (DENTRO de una evaluación)."""

    __tablename__ = "incidencias_evaluacion"

    id = Column(String(36), primary_key=True, default=_uuid)
    evaluacion_id = Column(String(36), ForeignKey("evaluaciones.id"), nullable=False)
    correlativo = Column(String(20), nullable=False)
    numero_ticket = Column(String(255), nullable=True)
    codigo = Column(String(100), nullable=True)
    version = Column(String(100), nullable=True)
    tipo_error = Column(String(100), nullable=False, default="Otros")
    descripcion = Column(Text, nullable=True)
    prioridad = Column(String(50), nullable=False, default="Medio")
    es_bloqueante = Column(Boolean, nullable=False, default=False)
    base_datos = Column(String(255), nullable=True)
    motor_bd = Column(String(255), nullable=True)
    firma_analista = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    evaluacion = relationship("EvaluacionModel", back_populates="incidencias", lazy="selectin")
    evidencias = relationship("EvidenciaModel", back_populates="incidencia",
                              cascade="all, delete-orphan", lazy="selectin")


class EvidenciaModel(Base):
    """Evidencia (archivo/imagen) de una incidencia, con numeración correlativa."""

    __tablename__ = "evidencias_incidencia"

    id = Column(String(36), primary_key=True, default=_uuid)
    incidencia_id = Column(String(36), ForeignKey("incidencias_evaluacion.id"), nullable=False)
    correlativo = Column(String(20), nullable=False)
    archivo = Column(String(500), nullable=False)
    descripcion = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    incidencia = relationship("IncidenciaModel", back_populates="evidencias", lazy="selectin")