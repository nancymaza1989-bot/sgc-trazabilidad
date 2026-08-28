from datetime import datetime
from typing import Optional, List
from uuid import UUID, uuid4
from src.core.constants import EstadoIncidencia, TRANSICIONES_INCIDENCIA, Prioridad, Severidad
from src.core.exceptions import TransicionEstadoInvalidaException

class Incidencia:
    def __init__(self, titulo: str, descripcion: str, pasos_reproducir: Optional[str] = None,
                 severidad: Severidad = Severidad.MEDIA, prioridad: Prioridad = Prioridad.MEDIA,
                 categoria: Optional[str] = None, version_afectada: Optional[str] = None,
                 asignado_a: Optional[UUID] = None, reportado_por: UUID = None):
        self.id = uuid4()
        self.titulo = titulo
        self.descripcion = descripcion
        self.pasos_reproducir = pasos_reproducir
        self.severidad = severidad
        self.prioridad = prioridad
        self.categoria = categoria
        self.estado = EstadoIncidencia.REPORTADO
        self.version_afectada = version_afectada
        self.version_resuelta = None
        self.asignado_a = asignado_a
        self.reportado_por = reportado_por
        self.fecha_reporte = datetime.utcnow()
        self.fecha_resolucion = None
        self.tiempo_resolucion = None
        self.tiempo_respuesta = None
        self.ia_categoria = None
        self.ia_prioridad = None
        self.comentarios = []
        self.adjuntos = []
        self.historial = []
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def cambiar_estado(self, nuevo_estado: EstadoIncidencia) -> None:
        if nuevo_estado not in TRANSICIONES_INCIDENCIA.get(self.estado, []):
            raise TransicionEstadoInvalidaException(self.estado.value, nuevo_estado.value)
        self.historial.append({
            "estado_anterior": self.estado.value,
            "estado_nuevo": nuevo_estado.value,
            "fecha": datetime.utcnow()
        })
        self.estado = nuevo_estado
        self.updated_at = datetime.utcnow()

    def asignar(self, usuario_id: UUID) -> None:
        self.asignado_a = usuario_id
        self.cambiar_estado(EstadoIncidencia.ASIGNADO)

    def resolver(self, version_resuelta: Optional[str] = None) -> None:
        self.version_resuelta = version_resuelta
        self.cambiar_estado(EstadoIncidencia.RESUELTO)

    def verificar(self) -> None:
        self.cambiar_estado(EstadoIncidencia.VERIFICADO)

    def cerrar(self) -> None:
        self.cambiar_estado(EstadoIncidencia.CERRADO)

    def reabrir(self) -> None:
        self.cambiar_estado(EstadoIncidencia.REABIERTO)

    def agregar_comentario(self, usuario_id: UUID, contenido: str) -> dict:
        comentario = {
            "id": str(uuid4()),
            "usuario_id": str(usuario_id),
            "contenido": contenido,
            "fecha": datetime.utcnow()
        }
        self.comentarios.append(comentario)
        return comentario