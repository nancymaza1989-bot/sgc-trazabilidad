from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional
from datetime import date, datetime
from uuid import UUID

from src.core.constants import EstadoTrabajo, TipoAtencion, Prioridad
from src.domain.trabajos.entities import Trabajo
from src.core.dependencies import get_current_user

router = APIRouter()

trabajos_db = []


@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear_trabajo(
    numero_ticket: str,
    proyecto: str,
    tipo_atencion: str,
    prioridad: str = "Media",
    instrucciones: str = "",
    documentacion: Optional[str] = None,
    fecha_recepcion: str = None,
    fecha_programada_entrega: Optional[str] = None,
    analista_asignado: Optional[str] = None,
    fecha_asignacion: Optional[str] = None,
    current_user = Depends(get_current_user),
):
    try:
        tipo = TipoAtencion(tipo_atencion)
        prio = Prioridad(prioridad)
        fecha_rec = date.fromisoformat(fecha_recepcion) if fecha_recepcion else date.today()
        fecha_prog = date.fromisoformat(fecha_programada_entrega) if fecha_programada_entrega else None
        fecha_asig = date.fromisoformat(fecha_asignacion) if fecha_asignacion else None
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
        fecha_programada_entrega=fecha_prog,
        analista_asignado=analista_asignado,
        fecha_asignacion=fecha_asig,
    )

    if analista_asignado and fecha_asig:
        trabajo.asignar_analista(analista_asignado, fecha_asig)

    trabajos_db.append(trabajo)
    return trabajo.to_dict()


@router.get("/")
async def listar_trabajos(
    estado: Optional[str] = None,
    analista: Optional[str] = None,
    proyecto: Optional[str] = None,
    vencidos: Optional[bool] = None,
    proximos: Optional[bool] = None,
    current_user = Depends(get_current_user),
):
    items = trabajos_db
    if estado:
        items = [t for t in items if t.estado.value == estado]
    if analista:
        items = [t for t in items if t.analista_asignado == analista]
    if proyecto:
        items = [t for t in items if t.proyecto == proyecto]
    if vencidos:
        items = [t for t in items if t.es_vencido()]
    if proximos:
        items = [t for t in items if t.es_proximo_a_vencer()]

    return {
        "items": [t.to_dict() for t in items],
        "total": len(items),
    }


@router.get("/{trabajo_id}")
async def obtener_trabajo(trabajo_id: UUID, current_user = Depends(get_current_user)):
    for t in trabajos_db:
        if t.id == trabajo_id:
            return t.to_dict()
    raise HTTPException(status_code=404, detail="Trabajo no encontrado")


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
    fecha_programada_entrega: Optional[str] = None,
    current_user = Depends(get_current_user),
):
    trabajo = next((t for t in trabajos_db if t.id == trabajo_id), None)
    if not trabajo:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")

    campos = {}
    if numero_ticket is not None:
        campos["numero_ticket"] = numero_ticket
    if proyecto is not None:
        campos["proyecto"] = proyecto
    if tipo_atencion is not None:
        campos["tipo_atencion"] = TipoAtencion(tipo_atencion)
    if prioridad is not None:
        campos["prioridad"] = Prioridad(prioridad)
    if instrucciones is not None:
        campos["instrucciones"] = instrucciones
    if documentacion is not None:
        campos["documentacion"] = documentacion
    if fecha_recepcion is not None:
        campos["fecha_recepcion"] = date.fromisoformat(fecha_recepcion)
    if fecha_programada_entrega is not None:
        campos["fecha_programada_entrega"] = date.fromisoformat(fecha_programada_entrega)

    trabajo.actualizar_campos(**campos)
    return trabajo.to_dict()


@router.post("/{trabajo_id}/asignar")
async def asignar_trabajo(
    trabajo_id: UUID,
    analista: str,
    fecha_asignacion: str,
    current_user = Depends(get_current_user),
):
    trabajo = next((t for t in trabajos_db if t.id == trabajo_id), None)
    if not trabajo:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    trabajo.asignar_analista(analista, date.fromisoformat(fecha_asignacion))
    return trabajo.to_dict()


@router.post("/{trabajo_id}/entregar")
async def entregar_trabajo(
    trabajo_id: UUID,
    fecha_entrega: str,
    current_user = Depends(get_current_user),
):
    trabajo = next((t for t in trabajos_db if t.id == trabajo_id), None)
    if not trabajo:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    trabajo.registrar_entrega(date.fromisoformat(fecha_entrega))
    return trabajo.to_dict()


@router.post("/{trabajo_id}/cambiar-estado")
async def cambiar_estado_trabajo(
    trabajo_id: UUID,
    estado: str,
    detalle: str = "",
    current_user = Depends(get_current_user),
):
    trabajo = next((t for t in trabajos_db if t.id == trabajo_id), None)
    if not trabajo:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    try:
        nuevo_estado = EstadoTrabajo(estado)
    except ValueError:
        raise HTTPException(status_code=400, detail="Estado inválido")
    trabajo.cambiar_estado(nuevo_estado, detalle)
    return trabajo.to_dict()


@router.get("/dashboard/resumen")
async def resumen_trabajos(current_user = Depends(get_current_user)):
    total = len(trabajos_db)
    pendientes_asignacion = [t for t in trabajos_db if t.estado == EstadoTrabajo.PENDIENTE_ASIGNACION]
    en_proceso = [t for t in trabajos_db if t.estado in (
        EstadoTrabajo.ASIGNADO, EstadoTrabajo.EN_REVISION,
        EstadoTrabajo.EN_EVALUACION, EstadoTrabajo.PENDIENTE_ENTREGA)]
    vencidos = [t for t in trabajos_db if t.es_vencido()]
    proximos = [t for t in trabajos_db if t.es_proximo_a_vencer()]
    entregados = [t for t in trabajos_db if t.fecha_real_entrega is not None]

    total_incidencias = sum(len(t.incidencias) for t in trabajos_db)
    total_casos = sum(len(t.casos_prueba) for t in trabajos_db)

    # Carga por analista
    carga_analista: dict = {}
    for t in trabajos_db:
        if t.analista_asignado:
            carga_analista[t.analista_asignado] = carga_analista.get(t.analista_asignado, 0) + 1

    # Estado por proyecto
    estado_proyecto: dict = {}
    for t in trabajos_db:
        estado_proyecto.setdefault(t.proyecto, {}).update({})
    for t in trabajos_db:
        key = t.estado.value
        estado_proyecto.setdefault(t.proyecto, {})[key] = estado_proyecto[t.proyecto].get(key, 0) + 1

    return {
        "total_trabajos": total,
        "pendientes_asignacion": len(pendientes_asignacion),
        "en_proceso": len(en_proceso),
        "vencidos": len(vencidos),
        "proximos_a_vencer": len(proximos),
        "entregados": len(entregados),
        "total_incidencias": total_incidencias,
        "total_casos_prueba": total_casos,
        "carga_por_analista": carga_analista,
        "estado_por_proyecto": estado_proyecto,
    }
