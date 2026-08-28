from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
from datetime import date
from uuid import UUID

from src.core.constants import EstadoEvaluacion, TipoAtencion, Prioridad, TipoError
from src.domain.trabajos.entities import Trabajo, Evaluacion, Incidencia, CasoPrueba
from src.core.dependencies import get_current_user

router = APIRouter()

trabajos_db = []


def _buscar_trabajo(trabajo_id: UUID) -> Trabajo:
    for t in trabajos_db:
        if t.id == trabajo_id:
            return t
    raise HTTPException(status_code=404, detail="Trabajo no encontrado")


def _buscar_evaluacion(trabajo_id: UUID, evaluacion_id: UUID) -> Evaluacion:
    t = _buscar_trabajo(trabajo_id)
    for e in t.evaluaciones:
        if e.id == evaluacion_id:
            return e
    raise HTTPException(status_code=404, detail="Evaluación no encontrada")


# ------------------------------------------------------------------
# 1. TRABAJOS (registro del Coordinador, entrada del proceso)
# ------------------------------------------------------------------

@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear_trabajo(
    numero_ticket: str,
    proyecto: str,
    tipo_atencion: str,
    prioridad: str = "Media",
    instrucciones: str = "",
    documentacion: Optional[str] = None,
    fecha_recepcion: str = None,
    current_user = Depends(get_current_user),
):
    try:
        tipo = TipoAtencion(tipo_atencion)
        prio = Prioridad(prioridad)
        fecha_rec = date.fromisoformat(fecha_recepcion) if fecha_recepcion else date.today()
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=f"Valor inválido: {e}")

    trabajo = Trabajo(
        numero_ticket=numero_ticket,
        proyecto=proyecto,
        tipo_atencion=tipo,
        prioridad=prio,
        instrucciones=instrucciones,
        documentacion=documentacion,
        fecha_recepcion=fecha_rec,
    )
    trabajos_db.append(trabajo)
    return trabajo.to_dict()


@router.get("/")
async def listar_trabajos(
    pendientes: Optional[bool] = None,
    current_user = Depends(get_current_user),
):
    items = trabajos_db
    if pendientes:
        items = [t for t in items if t.pendiente_asignacion]
    return {"items": [t.to_dict() for t in items], "total": len(items)}


@router.get("/{trabajo_id}")
async def obtener_trabajo(trabajo_id: UUID, current_user = Depends(get_current_user)):
    return _buscar_trabajo(trabajo_id).to_dict()


@router.patch("/{trabajo_id}")
async def actualizar_trabajo(
    trabajo_id: UUID,
    numero_ticket: Optional[str] = None,
    proyecto: Optional[str] = None,
    tipo_atencion: Optional[str] = None,
    prioridad: Optional[str] = None,
    instrucciones: Optional[str] = None,
    documentacion: Optional[str] = None,
    fecha_recepcion: Optional[str] = None,
    current_user = Depends(get_current_user),
):
    trabajo = _buscar_trabajo(trabajo_id)
    campos = {}
    if numero_ticket is not None: campos["numero_ticket"] = numero_ticket
    if proyecto is not None: campos["proyecto"] = proyecto
    if tipo_atencion is not None: campos["tipo_atencion"] = TipoAtencion(tipo_atencion)
    if prioridad is not None: campos["prioridad"] = Prioridad(prioridad)
    if instrucciones is not None: campos["instrucciones"] = instrucciones
    if documentacion is not None: campos["documentacion"] = documentacion
    if fecha_recepcion is not None: campos["fecha_recepcion"] = date.fromisoformat(fecha_recepcion)
    trabajo.actualizar_campos(**campos)
    return trabajo.to_dict()


@router.delete("/{trabajo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_trabajo(trabajo_id: UUID, current_user = Depends(get_current_user)):
    t = _buscar_trabajo(trabajo_id)
    if t.evaluaciones:
        raise HTTPException(status_code=400, detail="No se puede eliminar un trabajo con evaluaciones asignadas")
    trabajos_db.remove(t)


# ------------------------------------------------------------------
# 2. EVALUACIONES (asignación del Coordinador al Analista)
# ------------------------------------------------------------------

@router.post("/{trabajo_id}/evaluaciones", status_code=status.HTTP_201_CREATED)
async def asignar_evaluacion(
    trabajo_id: UUID,
    analista: str,
    fecha_asignacion: str,
    fecha_programada_entrega: Optional[str] = None,
    current_user = Depends(get_current_user),
):
    t = _buscar_trabajo(trabajo_id)
    fecha_asig = date.fromisoformat(fecha_asignacion)
    fecha_prog = date.fromisoformat(fecha_programada_entrega) if fecha_programada_entrega else None
    ev = Evaluacion(t, analista, fecha_asig, fecha_prog)
    t.evaluaciones.append(ev)
    return ev.to_dict()


@router.get("/{trabajo_id}/evaluaciones")
async def listar_evaluaciones(trabajo_id: UUID, current_user = Depends(get_current_user)):
    t = _buscar_trabajo(trabajo_id)
    return {"items": [e.to_dict() for e in t.evaluaciones], "total": len(t.evaluaciones)}


@router.get("/{trabajo_id}/evaluaciones/{evaluacion_id}")
async def obtener_evaluacion(trabajo_id: UUID, evaluacion_id: UUID, current_user = Depends(get_current_user)):
    e = _buscar_evaluacion(trabajo_id, evaluacion_id)
    data = e.to_dict()
    data["incidencias"] = [i.to_dict() for i in e.incidencias]
    data["casos_prueba"] = [c.to_dict() for c in e.casos_prueba]
    return data


@router.post("/{trabajo_id}/evaluaciones/{evaluacion_id}/cambiar-estado")
async def cambiar_estado_evaluacion(
    trabajo_id: UUID,
    evaluacion_id: UUID,
    estado: str,
    detalle: str = "",
    current_user = Depends(get_current_user),
):
    e = _buscar_evaluacion(trabajo_id, evaluacion_id)
    try:
        nuevo = EstadoEvaluacion(estado)
    except ValueError:
        raise HTTPException(status_code=400, detail="Estado inválido")
    e.cambiar_estado(nuevo, detalle)
    return e.to_dict()


@router.post("/{trabajo_id}/evaluaciones/{evaluacion_id}/entregar")
async def entregar_evaluacion(
    trabajo_id: UUID,
    evaluacion_id: UUID,
    fecha_entrega: str,
    resultado: str = "",
    current_user = Depends(get_current_user),
):
    e = _buscar_evaluacion(trabajo_id, evaluacion_id)
    e.entregar(date.fromisoformat(fecha_entrega), resultado)
    return e.to_dict()


# ------------------------------------------------------------------
# 3. CASOS DE PRUEBA (evidencias dentro de la evaluación)
# ------------------------------------------------------------------

@router.post("/{trabajo_id}/evaluaciones/{evaluacion_id}/casos-prueba", status_code=status.HTTP_201_CREATED)
async def agregar_caso_prueba(
    trabajo_id: UUID,
    evaluacion_id: UUID,
    nombre: str,
    resultado: str = "Pendiente",
    current_user = Depends(get_current_user),
):
    e = _buscar_evaluacion(trabajo_id, evaluacion_id)
    caso = CasoPrueba(e, nombre, resultado)
    e.agregar_caso_prueba(caso)
    return caso.to_dict()


# ------------------------------------------------------------------
# 4. INCIDENCIAS / HALLAZGOS (DENTRO de una evaluación asignada)
# ------------------------------------------------------------------

@router.post("/{trabajo_id}/evaluaciones/{evaluacion_id}/incidencias", status_code=status.HTTP_201_CREATED)
async def registrar_incidencia(
    trabajo_id: UUID,
    evaluacion_id: UUID,
    codigo: Optional[str] = None,
    version: Optional[str] = None,
    tipo_error: str = "Otros",
    descripcion: str = "",
    prioridad: str = "Media",
    es_bloqueante: bool = False,
    base_datos: Optional[str] = None,
    motor_bd: Optional[str] = None,
    current_user = Depends(get_current_user),
):
    e = _buscar_evaluacion(trabajo_id, evaluacion_id)
    try:
        tipo = TipoError(tipo_error)
    except ValueError:
        raise HTTPException(status_code=400, detail="Tipo de error inválido")

    correlativo = str(len(e.incidencias) + 1)
    inc = Incidencia(
        evaluacion=e,
        correlativo=correlativo,
        codigo=codigo,
        version=version,
        tipo_error=tipo,
        descripcion=descripcion,
        prioridad=prioridad,
        es_bloqueante=es_bloqueante,
        base_datos=base_datos,
        motor_bd=motor_bd,
    )
    e.agregar_incidencia(inc)
    return inc.to_dict()


@router.post("/{trabajo_id}/evaluaciones/{evaluacion_id}/incidencias/{incidencia_id}/evidencias", status_code=status.HTTP_201_CREATED)
async def agregar_evidencia(
    trabajo_id: UUID,
    evaluacion_id: UUID,
    incidencia_id: UUID,
    archivo: str,
    descripcion: str = "",
    current_user = Depends(get_current_user),
):
    e = _buscar_evaluacion(trabajo_id, evaluacion_id)
    inc = next((i for i in e.incidencias if i.id == incidencia_id), None)
    if not inc:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")
    ev = inc.agregar_evidencia(archivo, descripcion)
    return ev.to_dict()


# ------------------------------------------------------------------
# 5. DASHBOARD DEL COORDINADOR
# ------------------------------------------------------------------

@router.get("/dashboard/resumen")
async def resumen_trabajos(current_user = Depends(get_current_user)):
    total_trabajos = len(trabajos_db)
    pendientes_asignacion = sum(1 for t in trabajos_db if t.pendiente_asignacion)

    todas_evaluaciones = [e for t in trabajos_db for e in t.evaluaciones]
    en_proceso = sum(1 for e in todas_evaluaciones if e.estado in (
        EstadoEvaluacion.EN_PROCESO, EstadoEvaluacion.PENDIENTE_ENTREGA))
    vencidos = sum(1 for e in todas_evaluaciones if e.es_vencido())
    proximos = sum(1 for e in todas_evaluaciones if e.es_proximo_a_vencer())
    entregados = sum(1 for e in todas_evaluaciones if e.fecha_real_entrega is not None)

    total_incidencias = sum(len(e.incidencias) for e in todas_evaluaciones)
    total_casos = sum(len(e.casos_prueba) for e in todas_evaluaciones)

    carga_analista: dict = {}
    for e in todas_evaluaciones:
        if e.analista:
            carga_analista[e.analista] = carga_analista.get(e.analista, 0) + 1

    estado_por_proyecto: dict = {}
    for e in todas_evaluaciones:
        estado_por_proyecto.setdefault(e.trabajo.proyecto, {})[e.estado.value] = \
            estado_por_proyecto.get(e.trabajo.proyecto, {}).get(e.estado.value, 0) + 1

    return {
        "total_trabajos": total_trabajos,
        "pendientes_asignacion": pendientes_asignacion,
        "en_proceso": en_proceso,
        "vencidos": vencidos,
        "proximos_a_vencer": proximos,
        "entregados": entregados,
        "total_incidencias": total_incidencias,
        "total_casos_prueba": total_casos,
        "carga_por_analista": carga_analista,
        "estado_por_proyecto": estado_por_proyecto,
    }
