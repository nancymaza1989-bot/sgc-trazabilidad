from datetime import datetime, date
from typing import Optional, List
from uuid import UUID, uuid4
from src.core.constants import (
    EstadoEvaluacion,
    TipoAtencion,
    Prioridad,
    TipoError,
    PrioridadIncidencia,
)


class Trabajo:
    """Entrada del proceso de Calidad, registrada por el Coordinador.

    Representa el pase, versión, pase puntual o requerimiento que el Coordinador
    recibe por correo. Aún NO tiene asignación.
    """

    def __init__(
        self,
        numero_ticket: str,
        proyecto: str,
        tipo_atencion: TipoAtencion,
        prioridad: Prioridad,
        instrucciones: str,
        fecha_recepcion: date,
        documentacion: Optional[str] = None,
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
        self.coordinador = coordinador
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.evaluaciones = []

    @property
    def pendiente_asignacion(self) -> bool:
        return len(self.evaluaciones) == 0

    def actualizar_campos(self, **campos) -> None:
        for campo, valor in campos.items():
            if hasattr(self, campo) and getattr(self, campo) != valor:
                setattr(self, campo, valor)
        self.updated_at = datetime.utcnow()

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
            "coordinador": self.coordinador,
            "pendiente_asignacion": self.pendiente_asignacion,
            "evaluaciones": [e.to_dict() for e in self.evaluaciones],
        }


class Evaluacion:
    """Asignación de un Trabajo a un Analista de Calidad por parte del Coordinador.

    Contiene el contexto heredado del trabajo (proyecto, ticket, tipo de pase,
    fechas) más la asignación. Aquí el Analista registra sus hallazgos:
    incidencias y casos de prueba (resultados/evidencias de la evaluación).
    """

    def __init__(
        self,
        trabajo: Trabajo,
        analista: str,
        fecha_asignacion: date,
        fecha_programada_entrega: Optional[date] = None,
        analista_id: Optional[str] = None,
    ):
        self.id = uuid4()
        self.trabajo = trabajo
        self.analista = analista
        self.analista_id = analista_id
        self.fecha_asignacion = fecha_asignacion
        self.fecha_programada_entrega = fecha_programada_entrega
        self.fecha_real_entrega = None
        self.estado = EstadoEvaluacion.EN_PROCESO
        self.resultado = None
        self.incidencias: List[Incidencia] = []
        self.casos_prueba: List[CasoPrueba] = []
        self.historial = []
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self._anotar(f"Asignada a {analista} el {fecha_asignacion}")

    def _anotar(self, detalle: str) -> None:
        self.historial.append({"detalle": detalle, "fecha": datetime.utcnow().isoformat()})

    def cambiar_estado(self, nuevo: EstadoEvaluacion, detalle: str = "") -> None:
        self.estado = nuevo
        self.updated_at = datetime.utcnow()
        self._anotar(f"Estado: {nuevo.value}. {detalle}")

    def entregar(self, fecha_entrega: date, resultado: str = "") -> None:
        self.fecha_real_entrega = fecha_entrega
        self.resultado = resultado
        self.estado = EstadoEvaluacion.ENTREGADO
        self.updated_at = datetime.utcnow()
        self._anotar(f"Entregado el {fecha_entrega}. Resultado: {resultado or 'N/P'}")

    def agregar_incidencia(self, incidencia: "Incidencia") -> None:
        self.incidencias.append(incidencia)
        self.updated_at = datetime.utcnow()
        self._anotar(f"Se registró la incidencia {incidencia.correlativo}")

    def agregar_caso_prueba(self, caso: "CasoPrueba") -> None:
        self.casos_prueba.append(caso)
        self.updated_at = datetime.utcnow()

    def es_vencido(self, hoy: date = None) -> bool:
        hoy = hoy or date.today()
        return bool(self.fecha_programada_entrega and self.fecha_real_entrega is None
                    and self.estado not in (EstadoEvaluacion.CERRADO,) and self.fecha_programada_entrega < hoy)

    def es_proximo_a_vencer(self, hoy: date = None, dias: int = 3) -> bool:
        hoy = hoy or date.today()
        if self.fecha_programada_entrega and self.fecha_real_entrega is None and self.estado != EstadoEvaluacion.CERRADO:
            d = (self.fecha_programada_entrega - hoy).days
            return 0 <= d <= dias
        return False

    def to_dict(self) -> dict:
        t = self.trabajo
        return {
            "id": str(self.id),
            "trabajo_id": str(t.id),
            "numero_ticket": t.numero_ticket,
            "proyecto": t.proyecto,
            "tipo_atencion": t.tipo_atencion.value,
            "prioridad": t.prioridad.value,
            "instrucciones": t.instrucciones,
            "documentacion": t.documentacion,
            "fecha_recepcion": t.fecha_recepcion.isoformat(),
            "analista": self.analista,
            "analista_id": self.analista_id,
            "fecha_asignacion": self.fecha_asignacion.isoformat(),
            "fecha_programada_entrega": self.fecha_programada_entrega.isoformat() if self.fecha_programada_entrega else None,
            "fecha_real_entrega": self.fecha_real_entrega.isoformat() if self.fecha_real_entrega else None,
            "estado": self.estado.value,
            "resultado": self.resultado,
            "vencido": self.es_vencido(),
            "proximo_a_vencer": self.es_proximo_a_vencer(),
            "historial": self.historial,
        }


class CasoPrueba:
    """Documento/encabezado del Formato de Caso de Prueba (RA-105).

    El Analista lo registra DENTRO de una evaluación asignada. Contiene una
    lista dinámica de 'casos' (Caso #1, #2...) cada uno con sus evidencias,
    más el resultado de la prueba y las firmas del Analista y del Supervisor
    (Coordinador).
    """

    def __init__(
        self,
        evaluacion: Evaluacion,
        correlativo: str,
        flujo_componente: Optional[str] = None,
        campo_componente: Optional[str] = None,
        resultado: Optional[str] = None,
        resultado_prueba: Optional[str] = None,
        numero_ticket: Optional[str] = None,
        numero_caso: Optional[str] = None,
        numero_acta_pase: Optional[str] = None,
        nombre_analista: Optional[str] = None,
        tipo_pase: Optional[str] = None,
        fecha_prueba: Optional[date] = None,
        observaciones: Optional[str] = None,
        firma_analista: Optional[str] = None,
        firma_supervisor: Optional[str] = None,
    ):
        self.id = uuid4()
        self.evaluacion = evaluacion
        self.correlativo = correlativo
        # Nº de caso: correlativo numérico automático PERO editable.
        self.numero_caso = numero_caso or correlativo
        self.numero_ticket = numero_ticket or getattr(evaluacion.trabajo, "numero_ticket", None)
        self.numero_acta_pase = numero_acta_pase
        self.nombre_analista = nombre_analista
        self.tipo_pase = tipo_pase
        self.fecha_prueba = fecha_prueba or date.today()
        # 'flujo_componente' se conserva como alias de compatibilidad de 'campo_componente'.
        self.campo_componente = campo_componente or flujo_componente
        self.flujo_componente = self.campo_componente
        self.resultado_prueba = resultado_prueba or resultado or "Pendiente"
        self.resultado = self.resultado_prueba
        self.observaciones = observaciones
        self.firma_analista = firma_analista
        self.firma_supervisor = firma_supervisor
        self.casos: List[Caso] = []
        # Evidencias directas del documento (compatibilidad con el flujo anterior).
        self.evidencias: List[EvidenciaCaso] = []
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def agregar_evidencia(self, archivo: str, descripcion: str) -> "EvidenciaCaso":
        """Evidencia directa del documento RA-105 (compatibilidad)."""
        correlativo = str(len(self.evidencias) + 1)
        ev = EvidenciaCaso(self, correlativo, archivo, descripcion)
        self.evidencias.append(ev)
        return ev

    def agregar_caso(self, descripcion: str, numero: Optional[str] = None) -> "Caso":
        numero = numero or str(len(self.casos) + 1)
        caso = Caso(self, numero, descripcion)
        self.casos.append(caso)
        self.updated_at = datetime.utcnow()
        return caso

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "correlativo": self.correlativo,
            "numero_caso": self.numero_caso,
            "numero_ticket": self.numero_ticket,
            "numero_acta_pase": self.numero_acta_pase,
            "nombre_analista": self.nombre_analista,
            "tipo_pase": self.tipo_pase,
            "fecha_prueba": self.fecha_prueba.isoformat() if self.fecha_prueba else None,
            "flujo_componente": self.campo_componente,
            "campo_componente": self.campo_componente,
            "resultado": self.resultado_prueba,
            "resultado_prueba": self.resultado_prueba,
            "observaciones": self.observaciones,
            "firma_analista": self.firma_analista,
            "firma_supervisor": self.firma_supervisor,
            "evidencias": [e.to_dict() for e in self.evidencias],
            "casos": [c.to_dict() for c in self.casos],
        }


class Caso:
    """Caso de prueba DENTRO del documento RA-105 (lista dinámica).

    Cada caso (Caso #1, #2...) tiene descripción y evidencias numeradas.
    """

    def __init__(self, caso_prueba: CasoPrueba, numero: str, descripcion: str = ""):
        self.id = uuid4()
        self.caso_prueba = caso_prueba
        self.numero = numero
        self.descripcion = descripcion
        self.evidencias: List[EvidenciaCaso] = []
        self.created_at = datetime.utcnow()

    def agregar_evidencia(self, archivo: str, descripcion: str) -> "EvidenciaCaso":
        correlativo = str(len(self.evidencias) + 1)
        ev = EvidenciaCaso(self, correlativo, archivo, descripcion)
        self.evidencias.append(ev)
        return ev

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "numero": self.numero,
            "descripcion": self.descripcion,
            "evidencias": [e.to_dict() for e in self.evidencias],
        }


class EvidenciaCaso:
    """Evidencia (archivo/imagen) asociada a un caso de prueba, con numeración correlativa."""

    def __init__(self, caso: CasoPrueba, correlativo: str, archivo: str, descripcion: str):
        self.id = uuid4()
        self.caso = caso
        self.correlativo = correlativo
        self.archivo = archivo
        self.descripcion = descripcion
        self.created_at = datetime.utcnow()

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "correlativo": self.correlativo,
            "archivo": self.archivo,
            "descripcion": self.descripcion,
        }


class Incidencia:
    """Hallazgo registrado por el Analista DENTRO de una evaluación asignada.

    NO es el inicio del proceso: es un RESULTADO de la evaluación del Analista.
    El contexto (proyecto, ticket, tipo, analista, fechas) se hereda de la
    Evaluacion asignada por el Coordinador.
    """

    def __init__(
        self,
        evaluacion: Evaluacion,
        correlativo: str,
        numero_ticket: Optional[str] = None,
        codigo: Optional[str] = None,
        version: Optional[str] = None,
        tipo_error: TipoError = TipoError.OTROS,
        descripcion: str = "",
        prioridad: str = PrioridadIncidencia.MEDIO.value,
        es_bloqueante: bool = False,
        base_datos: Optional[str] = None,
        motor_bd: Optional[str] = None,
        firma_analista: Optional[str] = None,
    ):
        self.id = uuid4()
        self.evaluacion = evaluacion
        self.correlativo = correlativo
        # El ticket normalmente se hereda de la evaluación, pero es editable.
        self.numero_ticket = numero_ticket or getattr(evaluacion.trabajo, "numero_ticket", None)
        self.codigo = codigo
        self.version = version
        self.tipo_error = tipo_error
        self.descripcion = descripcion
        self.prioridad = prioridad
        self.es_bloqueante = es_bloqueante
        self.base_datos = base_datos
        self.motor_bd = motor_bd
        self.firma_analista = firma_analista
        self.evidencias: List[Evidencia] = []
        self.created_at = datetime.utcnow()

    def agregar_evidencia(self, archivo: str, descripcion: str) -> "Evidencia":
        correlativo = str(len(self.evidencias) + 1)
        ev = Evidencia(self, correlativo, archivo, descripcion)
        self.evidencias.append(ev)
        return ev

    def to_dict(self) -> dict:
        t = self.evaluacion.trabajo
        return {
            "id": str(self.id),
            "correlativo": self.correlativo,
            "evaluacion_id": str(self.evaluacion.id),
            # Contexto heredado de la evaluación (NO ingresado por el analista):
            "numero_ticket": self.numero_ticket,
            "proyecto": t.proyecto,
            "tipo_atencion": t.tipo_atencion.value,
            "analista": self.evaluacion.analista,
            "fecha_asignacion": self.evaluacion.fecha_asignacion.isoformat(),
            "fecha_programada_entrega": self.evaluacion.fecha_programada_entrega.isoformat() if self.evaluacion.fecha_programada_entrega else None,
            # Datos propios del hallazgo (formulario real del Poder Judicial):
            "codigo": self.codigo,
            "version": self.version,
            "tipo_error": self.tipo_error.value,
            "descripcion": self.descripcion,
            "prioridad": self.prioridad,
            "es_bloqueante": self.es_bloqueante,
            "base_datos": self.base_datos,
            "motor_bd": self.motor_bd,
            "firma_analista": self.firma_analista,
            "evidencias": [e.to_dict() for e in self.evidencias],
        }


class Evidencia:
    """Evidencia (archivo/imagen) asociada a una incidencia, con numeración correlativa."""

    def __init__(self, incidencia: Incidencia, correlativo: str, archivo: str, descripcion: str):
        self.id = uuid4()
        self.incidencia = incidencia
        self.correlativo = correlativo
        self.archivo = archivo
        self.descripcion = descripcion
        self.created_at = datetime.utcnow()

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "correlativo": self.correlativo,
            "archivo": self.archivo,
            "descripcion": self.descripcion,
        }
