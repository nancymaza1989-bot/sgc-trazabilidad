from datetime import datetime, date
from typing import Optional, List
from uuid import UUID, uuid4
from src.core.constants import EstadoTrabajo, TipoAtencion, Prioridad


class Trabajo:
    """Entidad principal del proceso de Calidad.

    El Trabajo (Ticket, GLPI, Pase o Requerimiento) es la ENTRADA del proceso.
    El Coordinador de Calidad lo registra, asigna al Analista y lo monitorea.
    Las Incidencias y Casos de Prueba son resultados/evidencias de la evaluación.
    """

    def __init__(
        self,
        numero_ticket: str,
        proyecto: str,
        tipo_atencion: TipoAtencion,
        prioridad: Prioridad,
        instrucciones: str,
        fecha_recepcion: date,
        fecha_programada_entrega: Optional[date] = None,
        documentacion: Optional[str] = None,
        analista_asignado: Optional[str] = None,
        fecha_asignacion: Optional[date] = None,
        coordinador: str = "Coordinador de Calidad",
    ):
        self.id = uuid4()
        self.numero_ticket = numero_ticket
        self.proyecto = proyecto
        self.tipo_atencion = tipo_atencion
        self.prioridad = prioridad
        self.instrucciones = instrucciones
        self.documentacion = documentacion
        self.fecha_recepcion = fecha_recepcion
        self.fecha_programada_entrega = fecha_programada_entrega
        self.fecha_real_entrega = None
        self.analista_asignado = analista_asignado
        self.fecha_asignacion = fecha_asignacion
        self.coordinador = coordinador
        self.estado = EstadoTrabajo.PENDIENTE_ASIGNACION
        self.incidencias = []
        self.casos_prueba = []
        self.resultado_evaluacion = None
        self.historial = []
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self._anotar_historial("Creación", f"Registrado por {coordinador}")

    def _anotar_historial(self, accion: str, detalle: str) -> None:
        self.historial.append({
            "accion": accion,
            "detalle": detalle,
            "fecha": datetime.utcnow().isoformat(),
        })

    def asignar_analista(self, analista: str, fecha_asignacion: date) -> None:
        self.analista_asignado = analista
        self.fecha_asignacion = fecha_asignacion
        self.estado = EstadoTrabajo.ASIGNADO
        self.updated_at = datetime.utcnow()
        self._anotar_historial("Asignación", f"Asignado a {analista} el {fecha_asignacion}")

    def cambiar_estado(self, nuevo_estado: EstadoTrabajo, detalle: str = "") -> None:
        self.estado = nuevo_estado
        self.updated_at = datetime.utcnow()
        self._anotar_historial("Cambio de estado", f"Nuevo estado: {nuevo_estado.value}. {detalle}")

    def registrar_entrega(self, fecha_entrega: date) -> None:
        self.fecha_real_entrega = fecha_entrega
        self.estado = EstadoTrabajo.ENTREGADO
        self.updated_at = datetime.utcnow()
        self._anotar_historial("Entrega", f"Entregado por el Analista el {fecha_entrega}")

    def set_resultado_evaluacion(self, resultado: str) -> None:
        self.resultado_evaluacion = resultado
        self.updated_at = datetime.utcnow()
        self._anotar_historial("Evaluación", f"Resultado de evaluación: {resultado}")

    def agregar_incidencia(self, incidencia_id: str) -> None:
        if incidencia_id not in self.incidencias:
            self.incidencias.append(incidencia_id)
        self.updated_at = datetime.utcnow()

    def agregar_caso_prueba(self, caso_id: str) -> None:
        if caso_id not in self.casos_prueba:
            self.casos_prueba.append(caso_id)
        self.updated_at = datetime.utcnow()

    def actualizar_campos(self, **campos) -> None:
        editados = []
        for campo, valor in campos.items():
            if hasattr(self, campo) and getattr(self, campo) != valor:
                setattr(self, campo, valor)
                editados.append(campo)
        self.updated_at = datetime.utcnow()
        if editados:
            self._anotar_historial("Edición", f"Campos modificados: {', '.join(editados)}")

    def es_vencido(self, hoy: date = None) -> bool:
        hoy = hoy or date.today()
        if self.fecha_programada_entrega and self.fecha_real_entrega is None:
            return self.fecha_programada_entrega < hoy
        return False

    def es_proximo_a_vencer(self, hoy: date = None, dias: int = 3) -> bool:
        hoy = hoy or date.today()
        if self.fecha_programada_entrega and self.fecha_real_entrega is None and self.estado != EstadoTrabajo.CERRADO:
            diferencia = (self.fecha_programada_entrega - hoy).days
            return 0 <= diferencia <= dias
        return False

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "numero_ticket": self.numero_ticket,
            "proyecto": self.proyecto,
            "tipo_atencion": self.tipo_atencion.value,
            "prioridad": self.prioridad.value,
            "instrucciones": self.instrucciones,
            "documentacion": self.documentacion,
            "fecha_recepcion": self.fecha_recepcion.isoformat(),
            "fecha_programada_entrega": self.fecha_programada_entrega.isoformat() if self.fecha_programada_entrega else None,
            "fecha_real_entrega": self.fecha_real_entrega.isoformat() if self.fecha_real_entrega else None,
            "analista_asignado": self.analista_asignado,
            "fecha_asignacion": self.fecha_asignacion.isoformat() if self.fecha_asignacion else None,
            "coordinador": self.coordinador,
            "estado": self.estado.value,
            "incidencias": self.incidencias,
            "casos_prueba": self.casos_prueba,
            "resultado_evaluacion": self.resultado_evaluacion,
            "vencido": self.es_vencido(),
            "proximo_a_vencer": self.es_proximo_a_vencer(),
            "historial": self.historial,
        }
