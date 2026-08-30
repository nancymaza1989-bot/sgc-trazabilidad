import uuid
from sqlalchemy import Column, String, Text, Boolean, Integer, DateTime
from sqlalchemy.sql import func
from src.infrastructure.database.connection import Base

def _uuid():
    return str(uuid.uuid4())

class FaqModel(Base):
    __tablename__ = "preguntas_frecuentes"

    id = Column(String(36), primary_key=True, default=_uuid)
    pregunta = Column(String(500), nullable=False)
    respuesta = Column(Text, nullable=False)
    categoria = Column(String(100), nullable=False, default="General")
    activo = Column(Boolean, nullable=False, default=True)
    orden = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class DocumentoNormativoModel(Base):
    __tablename__ = "documentos_normativos"

    id = Column(String(36), primary_key=True, default=_uuid)
    titulo = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=True)
    contenido = Column(Text, nullable=False)  # Texto completo para indexación y RAG
    categoria = Column(String(100), nullable=False, default="Normativa SGC")
    activo = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
