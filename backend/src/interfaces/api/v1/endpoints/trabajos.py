from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from uuid import UUID
import json

from sqlalchemy import select, insert
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.constants import EstadoEvaluacion, TipoAtencion, Prioridad, TipoError, PrioridadIncidencia
from src.core.dependencies import get_current_user
from src.infrastructure.database.connection import get_db
from src.infrastructure.database.models.trabajo_model import (
    TrabajoModel,
    EvaluacionModel,
    CasoPruebaModel,
    CasoPruebaItemModel,
    EvidenciaCasoModel,
    EvidenciaCasoItemModel,
    IncidenciaModel,
    EvidenciaModel,
    AdjuntoTrabajoModel,
    AsignacionModel,
    AsignacionAnalistaModel,
    asignacion_trabajos,
)
from src.interfaces.api.v1.endpoints.serializers import (
    trabajo_to_dict,
    evaluacion_to_dict,
    incidencia_to_dict,
    caso_prueba_to_dict,
    caso_item_to_dict,
    evidencia_to_dict,
    asignacion_to_dict,
)

router = APIRouter()


# ------------------------------------------------------------------
# Modelos Pydantic de entrada
# ------------------------------------------------------------------
class AdjuntoRequest(BaseModel):
    nombre: Optional[str] = None
    archivo: str
    tipo_mime: Optional[str] = None
    descripcion: Optional[str] = None


class EvidenciaRequest(BaseModel):
    archivo: str
    descripcion: Optional[str] = None


class CasoPruebaRequest(BaseModel):
    numero_ticket: Optional[str] = None
    numero_caso: Optional[str] = None
    numero_acta_pase: Optional[str] = None
    tipo_pase: Optional[str] = None
    campo_componente: Optional[str] = None
    flujo_componente: Optional[str] = None
    numero_requerimiento: Optional[str] = None
    ambiente: Optional[str] = None
    precondiciones: Optional[str] = None
    datos_prueba: Optional[str] = None
    resultado_esperado: Optional[str] = None
    resultado_prueba: Optional[str] = None
    resultado: Optional[str] = None
    fecha_prueba: Optional[str] = None
    observaciones: Optional[str] = None
    firma_analista: Optional[str] = None
    firma_supervisor: Optional[str] = None


class IncidenciaRequest(BaseModel):
    numero_ticket: Optional[str] = None
    codigo: Optional[str] = None
    version: Optional[str] = None
    tipo_error: Optional[str] = "Otros"
    descripcion: Optional[str] = ""
    prioridad: Optional[str] = "Medio"
    es_bloqueante: Optional[bool] = False
    base_datos: Optional[str] = None
    motor_bd: Optional[str] = None
    firma_analista: Optional[str] = None


class TrabajoRequest(BaseModel):
    numero_ticket: str
    proyecto: str
    tipo_atencion: str
    prioridad: str = "Media"
    instrucciones: str = ""
    documentacion: Optional[str] = None
    fecha_recepcion: Optional[str] = None


class ActualizarTrabajoRequest(BaseModel):
    numero_ticket: Optional[str] = None
    proyecto: Optional[str] = None
    tipo_atencion: Optional[str] = None
    prioridad: Optional[str] = None
    instrucciones: Optional[str] = None
    documentacion: Optional[str] = None
    fecha_recepcion: Optional[str] = None


class AsignacionEvaluacionRequest(BaseModel):
    analista: str
    fecha_asignacion: str
    fecha_programada_entrega: Optional[str] = None


class CambiarEstadoRequest(BaseModel):
    estado: str
    detalle: str = ""


class EntregarRequest(BaseModel):
    fecha_entrega: str
    resultado: str = ""


class AsignacionRequest(BaseModel):
    analista_encargado: str
    fecha_asignacion: str
    fecha_programada_entrega: Optional[str] = None
    nombre: Optional[str] = None
    observaciones: Optional[str] = None
    trabajos_ids: str = ""
    analistas_grupo: str = ""
    # Mapa opcional de reparto del encargado: {"<trabajo_id>": "<analista>"}.
    # Sin reparto, cada ticket se asigna al analista encargado.
    reparto: str = ""


class CasoPruebaItemRequest(BaseModel):
    numero: Optional[str] = None
    descripcion: str = ""
    severidad: Optional[str] = "Media"


# ------------------------------------------------------------------
# Utilidades de acceso a datos (modelos SQLAlchemy async)
# ------------------------------------------------------------------

async def _buscar_trabajo(db: AsyncSession, trabajo_id: UUID) -> TrabajoModel:
    stmt = select(TrabajoModel).where(TrabajoModel.id == str(trabajo_id))
    t = (await db.execute(stmt)).scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Trabajo no encontrado")
    return t


async def _mapa_asignacion_por_trabajo(db: AsyncSession, trabajo_ids) -> dict:
    """Devuelve {trabajo_id: asignacion_id} consultando la tabla puente directamente.

    Evita el eager-loading de la relacion many-to-many (asignaciones) que en modo
    asíncrono producia bloqueos en /trabajos/.
    """
    if not trabajo_ids:
        return {}
    stmt = select(asignacion_trabajos.c.trabajo_id, asignacion_trabajos.c.asignacion_id).where(
        asignacion_trabajos.c.trabajo_id.in_(trabajo_ids)
    )
    filas = (await db.execute(stmt)).all()
    return {row.trabajo_id: row.asignacion_id for row in filas}


async def _buscar_evaluacion(db: AsyncSession, trabajo_id: UUID, evaluacion_id: UUID) -> EvaluacionModel:
    t = await _buscar_trabajo(db, trabajo_id)
    e = next((x for x in t.evaluaciones if x.id == str(evaluacion_id)), None)
    if not e:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")
    return e


def _agregar_historial(e: EvaluacionModel, detalle: str) -> None:
    items = []
    if e.historial:
        try:
            items = json.loads(e.historial)
        except (ValueError, TypeError):
            items = []
    if not isinstance(items, list):
        items = []
    items.append({"detalle": detalle, "fecha": datetime.utcnow().isoformat()})
    e.historial = json.dumps(items, ensure_ascii=False)


def _estado_valido(estado: str, entidad: str = "Estado") -> EstadoEvaluacion:
    try:
        return EstadoEvaluacion(estado)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"{entidad} inválido")


# ------------------------------------------------------------------
# 1. TRABAJOS (registro del Coordinador, entrada del proceso)
# ------------------------------------------------------------------

@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear_trabajo(
    payload: TrabajoRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        tipo = TipoAtencion(payload.tipo_atencion)
        prio = Prioridad(payload.prioridad)
        fecha_rec = date.fromisoformat(payload.fecha_recepcion) if payload.fecha_recepcion else date.today()
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=f"Valor inválido: {e}")

    trabajo = TrabajoModel(
        numero_ticket=payload.numero_ticket,
        proyecto=payload.proyecto,
        tipo_atencion=tipo.value,
        prioridad=prio.value,
        instrucciones=payload.instrucciones,
        documentacion=payload.documentacion,
        fecha_recepcion=fecha_rec,
        coordinador="Coordinador de Calidad",
    )
    db.add(trabajo)
    await db.commit()
    creado = (await db.execute(select(TrabajoModel).where(TrabajoModel.id == trabajo.id))).scalar_one()
    return trabajo_to_dict(creado)


@router.get("/")
async def listar_trabajos(
    pendientes: Optional[bool] = None,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(TrabajoModel).order_by(TrabajoModel.created_at.desc())
    items = list((await db.execute(stmt)).scalars().all())
    if pendientes:
        items = [t for t in items if len(t.evaluaciones) == 0]
    asignaciones_por_trabajo = await _mapa_asignacion_por_trabajo(db, [t.id for t in items])
    return {"items": [trabajo_to_dict(t, asignaciones_por_trabajo=asignaciones_por_trabajo) for t in items],
            "total": len(items)}


@router.get("/asignaciones")
async def listar_asignaciones(current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(AsignacionModel).order_by(AsignacionModel.created_at.desc())
    items = list((await db.execute(stmt)).scalars().all())
    return {"items": [asignacion_to_dict(a) for a in items], "total": len(items)}


@router.get("/asignaciones/{asignacion_id}")
async def obtener_asignacion(asignacion_id: UUID, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    a = (await db.execute(select(AsignacionModel).where(AsignacionModel.id == str(asignacion_id)))).scalar_one_or_none()
    if not a:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return asignacion_to_dict(a)


@router.get("/{trabajo_id}")
async def obtener_trabajo(trabajo_id: UUID, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t = await _buscar_trabajo(db, trabajo_id)
    return trabajo_to_dict(t)


@router.patch("/{trabajo_id}")
async def actualizar_trabajo(
    trabajo_id: UUID,
    payload: ActualizarTrabajoRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    trabajo = await _buscar_trabajo(db, trabajo_id)
    try:
        if payload.numero_ticket is not None:
            trabajo.numero_ticket = payload.numero_ticket
        if payload.proyecto is not None:
            trabajo.proyecto = payload.proyecto
        if payload.tipo_atencion is not None:
            trabajo.tipo_atencion = TipoAtencion(payload.tipo_atencion).value
        if payload.prioridad is not None:
            trabajo.prioridad = Prioridad(payload.prioridad).value
        if payload.fecha_recepcion is not None:
            trabajo.fecha_recepcion = date.fromisoformat(payload.fecha_recepcion)
    except (ValueError, KeyError) as e:
        raise HTTPException(status_code=400, detail=f"Valor inválido: {e}")
    if payload.instrucciones is not None:
        trabajo.instrucciones = payload.instrucciones
    if payload.documentacion is not None:
        trabajo.documentacion = payload.documentacion
    await db.commit()
    creado = (await db.execute(select(TrabajoModel).where(TrabajoModel.id == str(trabajo_id)))).scalar_one()
    return trabajo_to_dict(creado)


@router.delete("/{trabajo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_trabajo(trabajo_id: UUID, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t = await _buscar_trabajo(db, trabajo_id)
    if t.evaluaciones:
        raise HTTPException(status_code=400, detail="No se puede eliminar un trabajo con evaluaciones asignadas")
    await db.delete(t)
    await db.commit()


# ------------------------------------------------------------------
# 2. EVALUACIONES (asignación del Coordinador al Analista)
# ------------------------------------------------------------------

@router.post("/{trabajo_id}/evaluaciones", status_code=status.HTTP_201_CREATED)
async def asignar_evaluacion(
    trabajo_id: UUID,
    payload: AsignacionEvaluacionRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    t = await _buscar_trabajo(db, trabajo_id)
    try:
        fecha_asig = date.fromisoformat(payload.fecha_asignacion)
        fecha_prog = date.fromisoformat(payload.fecha_programada_entrega) if payload.fecha_programada_entrega else None
    except ValueError:
        raise HTTPException(status_code=400, detail="Fecha de asignación inválida")

    ev = EvaluacionModel(
        trabajo_id=t.id,
        analista=payload.analista,
        fecha_asignacion=fecha_asig,
        fecha_programada_entrega=fecha_prog,
        estado=EstadoEvaluacion.EN_PROCESO.value,
        historial=json.dumps(
            [{"detalle": f"Asignada a {payload.analista} el {fecha_asig.isoformat()}",
              "fecha": datetime.utcnow().isoformat()}],
            ensure_ascii=False,
        ),
    )
    db.add(ev)
    await db.commit()
    creado = (await db.execute(select(EvaluacionModel).where(EvaluacionModel.id == ev.id))).scalar_one()
    return evaluacion_to_dict(creado)


@router.get("/{trabajo_id}/evaluaciones")
async def listar_evaluaciones(trabajo_id: UUID, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    t = await _buscar_trabajo(db, trabajo_id)
    return {"items": [evaluacion_to_dict(e) for e in t.evaluaciones], "total": len(t.evaluaciones)}


@router.get("/{trabajo_id}/evaluaciones/{evaluacion_id}")
async def obtener_evaluacion(trabajo_id: UUID, evaluacion_id: UUID, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    e = await _buscar_evaluacion(db, trabajo_id, evaluacion_id)
    data = evaluacion_to_dict(e)
    data["incidencias"] = [incidencia_to_dict(i) for i in e.incidencias]
    data["casos_prueba"] = [caso_prueba_to_dict(c) for c in e.casos_prueba]
    return data


@router.post("/{trabajo_id}/evaluaciones/{evaluacion_id}/cambiar-estado")
async def cambiar_estado_evaluacion(
    trabajo_id: UUID,
    evaluacion_id: UUID,
    payload: CambiarEstadoRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    e = await _buscar_evaluacion(db, trabajo_id, evaluacion_id)
    nuevo = _estado_valido(payload.estado)
    e.estado = nuevo.value
    _agregar_historial(e, f"Estado: {nuevo.value}. {payload.detalle}")
    await db.commit()
    creado = (await db.execute(select(EvaluacionModel).where(EvaluacionModel.id == e.id))).scalar_one()
    return evaluacion_to_dict(creado)


@router.post("/{trabajo_id}/evaluaciones/{evaluacion_id}/entregar")
async def entregar_evaluacion(
    trabajo_id: UUID,
    evaluacion_id: UUID,
    payload: EntregarRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    e = await _buscar_evaluacion(db, trabajo_id, evaluacion_id)
    try:
        fecha_entrega_dt = date.fromisoformat(payload.fecha_entrega)
    except ValueError:
        raise HTTPException(status_code=400, detail="Fecha de entrega inválida")
    e.fecha_real_entrega = fecha_entrega_dt
    e.resultado = payload.resultado
    e.estado = EstadoEvaluacion.ENTREGADO.value
    _agregar_historial(e, f"Entregado el {fecha_entrega_dt.isoformat()}. Resultado: {payload.resultado or 'N/P'}")
    await db.commit()
    creado = (await db.execute(select(EvaluacionModel).where(EvaluacionModel.id == e.id))).scalar_one()
    return evaluacion_to_dict(creado)


# ------------------------------------------------------------------
# 2.1 ADJUNTOS DE DOCUMENTACIÓN (Registro del Coordinador)
# ------------------------------------------------------------------

@router.post("/{trabajo_id}/adjuntos", status_code=status.HTTP_201_CREATED)
async def agregar_adjunto(
    trabajo_id: UUID,
    payload: AdjuntoRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    t = await _buscar_trabajo(db, trabajo_id)
    adj = AdjuntoTrabajoModel(
        trabajo_id=t.id,
        nombre=(payload.nombre or "").strip() or "documento",
        archivo=payload.archivo,
        tipo_mime=payload.tipo_mime,
        descripcion=payload.descripcion or None,
        creado_por=current_user.get("id"),
    )
    db.add(adj)
    await db.commit()
    creado = (await db.execute(select(AdjuntoTrabajoModel).where(AdjuntoTrabajoModel.id == adj.id))).scalar_one()
    t2 = await _buscar_trabajo(db, trabajo_id)
    return trabajo_to_dict(t2)


@router.delete("/{trabajo_id}/adjuntos/{adjunto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_adjunto(
    trabajo_id: UUID,
    adjunto_id: UUID,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    t = await _buscar_trabajo(db, trabajo_id)
    adj = next((a for a in t.adjuntos if a.id == str(adjunto_id)), None)
    if not adj:
        raise HTTPException(status_code=404, detail="Adjunto no encontrado")
    await db.delete(adj)
    await db.commit()


# ------------------------------------------------------------------
# 2.2 ASIGNACIÓN DE PASE DE VERSIÓN (analista encargado + grupo + multi-ticket)
# ------------------------------------------------------------------

@router.post("/asignaciones", status_code=status.HTTP_201_CREATED)
async def crear_asignacion(
    payload: AsignacionRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from src.infrastructure.database.models.trabajo_model import TrabajoModel
    encargado = (payload.analista_encargado or "").strip()
    if not encargado:
        raise HTTPException(status_code=400, detail="Debe indicar el analista encargado")

    try:
        fecha_asig = date.fromisoformat(payload.fecha_asignacion)
        fecha_prog = date.fromisoformat(payload.fecha_programada_entrega) if payload.fecha_programada_entrega else None
    except ValueError:
        raise HTTPException(status_code=400, detail="Fecha de asignación inválida")

    ids = [x.strip() for x in (payload.trabajos_ids or "").split(",") if x.strip()]
    if not ids:
        raise HTTPException(status_code=400, detail="Debe seleccionar al menos un ticket/trabajo")

    trabajos = []
    for i in ids:
        t = (await db.execute(select(TrabajoModel).where(TrabajoModel.id == i))).scalar_one_or_none()
        if not t:
            raise HTTPException(status_code=404, detail=f"Trabajo {i} no encontrado")
        trabajos.append(t)

    asignacion = AsignacionModel(
        nombre=(payload.nombre or "").strip() or None,
        analista_encargado=encargado,
        fecha_asignacion=fecha_asig,
        fecha_programada_entrega=fecha_prog,
        estado="Asignado",
        observaciones=payload.observaciones or None,
    )
    db.add(asignacion)
    await db.flush()

    # Grupo de analistas
    grupo = [x.strip() for x in (payload.analistas_grupo or "").split(",") if x.strip()]
    for miembro in grupo:
        db.add(AsignacionAnalistaModel(asignacion_id=asignacion.id, analista=miembro))

    # Vincular los tickets a la asignación (tabla puente asignacion_trabajos)
    # Se inserta directamente en la tabla puente para evitar lazy-load async de la
    # relacion many-to-many (MissingGreenlet / bloqueo en modo asíncrono).
    # Ademas, se crea una EVALUACION por cada ticket asignado para que el trabajo
    # aparezca en los módulos Incidencias y Casos de Prueba (mismo flujo que 'Asignar').
    # El analista encargado (o el reparto del encargado) recibe cada evaluación.
    reparto = {}
    if (payload.reparto or "").strip():
        try:
            parsed = json.loads(payload.reparto)
            if isinstance(parsed, dict):
                reparto = {str(k): str(v).strip() for k, v in parsed.items() if str(v).strip()}
        except (ValueError, TypeError):
            reparto = {}

    for t in trabajos:
        await db.execute(insert(asignacion_trabajos).values(
            asignacion_id=asignacion.id,
            trabajo_id=t.id,
        ))
        analista = reparto.get(str(t.id)) or encargado
        ev = EvaluacionModel(
            trabajo_id=t.id,
            analista=analista,
            fecha_asignacion=fecha_asig,
            fecha_programada_entrega=fecha_prog,
            estado=EstadoEvaluacion.EN_PROCESO.value,
            historial=json.dumps(
                [{"detalle": f"Pase de versión asignado a {analista} el {fecha_asig.isoformat()}",
                  "fecha": datetime.utcnow().isoformat()}],
                ensure_ascii=False,
            ),
        )
        db.add(ev)

    await db.commit()
    creado = (await db.execute(select(AsignacionModel).where(AsignacionModel.id == asignacion.id))).scalar_one()
    return asignacion_to_dict(creado)


# ------------------------------------------------------------------
# 3. CASOS DE PRUEBA (Formato RA-105 dentro de la evaluación)
# ------------------------------------------------------------------

@router.post("/{trabajo_id}/evaluaciones/{evaluacion_id}/casos-prueba", status_code=status.HTTP_201_CREATED)
async def agregar_caso_prueba(
    trabajo_id: UUID,
    evaluacion_id: UUID,
    payload: CasoPruebaRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    e = await _buscar_evaluacion(db, trabajo_id, evaluacion_id)
    correlativo = str(len(e.casos_prueba) + 1)
    campo = (payload.campo_componente or payload.flujo_componente or "").strip()
    resultado_final = payload.resultado_prueba or payload.resultado or "Pendiente"

    tipo_pase = payload.tipo_pase
    if tipo_pase is None:
        tipo_pase = {"Pase de versión": "Versión", "Pase puntual": "Puntual"}.get(e.trabajo.tipo_atencion, "Puntual")

    try:
        fecha_prueba_dt = date.fromisoformat(payload.fecha_prueba) if payload.fecha_prueba else date.today()
    except ValueError:
        raise HTTPException(status_code=400, detail="Fecha de prueba inválida")

    caso = CasoPruebaModel(
        evaluacion_id=e.id,
        correlativo=correlativo,
        numero_caso=payload.numero_caso or correlativo,
        numero_ticket=payload.numero_ticket or e.trabajo.numero_ticket,
        numero_acta_pase=payload.numero_acta_pase,
        nombre_analista=current_user.get("id"),
        tipo_pase=tipo_pase,
        fecha_prueba=fecha_prueba_dt,
        flujo_componente=campo,
        campo_componente=campo or None,
        numero_requerimiento=payload.numero_requerimiento,
        ambiente=payload.ambiente,
        precondiciones=payload.precondiciones,
        datos_prueba=payload.datos_prueba,
        resultado_esperado=payload.resultado_esperado,
        resultado=resultado_final,
        resultado_prueba=resultado_final,
        observaciones=payload.observaciones,
        firma_analista=payload.firma_analista,
        firma_supervisor=payload.firma_supervisor,
    )
    db.add(caso)
    await db.commit()
    creado = (await db.execute(select(CasoPruebaModel).where(CasoPruebaModel.id == caso.id))).scalar_one()
    return caso_prueba_to_dict(creado)


@router.post("/{trabajo_id}/evaluaciones/{evaluacion_id}/casos-prueba/{caso_id}/casos", status_code=status.HTTP_201_CREATED)
async def agregar_caso_prueba_item(
    trabajo_id: UUID,
    evaluacion_id: UUID,
    caso_id: UUID,
    payload: CasoPruebaItemRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    e = await _buscar_evaluacion(db, trabajo_id, evaluacion_id)
    caso = next((c for c in e.casos_prueba if c.id == str(caso_id)), None)
    if not caso:
        raise HTTPException(status_code=404, detail="Caso de prueba no encontrado")
    numero_valor = payload.numero or str(len(caso.casos) + 1)
    item = CasoPruebaItemModel(
        caso_prueba_id=caso.id,
        numero=numero_valor,
        descripcion=payload.descripcion,
        severidad=(payload.severidad or "Media").strip() or "Media",
    )
    db.add(item)
    await db.commit()
    creado = (await db.execute(select(CasoPruebaItemModel).where(CasoPruebaItemModel.id == item.id))).scalar_one()
    return caso_item_to_dict(creado)


@router.post("/{trabajo_id}/evaluaciones/{evaluacion_id}/casos-prueba/{caso_id}/casos/{caso_item_id}/evidencias",
             status_code=status.HTTP_201_CREATED)
async def agregar_evidencia_caso_item(
    trabajo_id: UUID,
    evaluacion_id: UUID,
    caso_id: UUID,
    caso_item_id: UUID,
    payload: EvidenciaRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    e = await _buscar_evaluacion(db, trabajo_id, evaluacion_id)
    caso = next((c for c in e.casos_prueba if c.id == str(caso_id)), None)
    if not caso:
        raise HTTPException(status_code=404, detail="Caso de prueba no encontrado")
    item = next((x for x in caso.casos if x.id == str(caso_item_id)), None)
    if not item:
        raise HTTPException(status_code=404, detail="Caso de prueba (ítem) no encontrado")
    correlativo = str(len(item.evidencias) + 1)
    ev = EvidenciaCasoItemModel(caso_item_id=item.id, correlativo=correlativo, archivo=payload.archivo, descripcion=payload.descripcion)
    db.add(ev)
    await db.commit()
    return evidencia_to_dict(ev)


@router.post("/{trabajo_id}/evaluaciones/{evaluacion_id}/casos-prueba/{caso_id}/evidencias",
             status_code=status.HTTP_201_CREATED)
async def agregar_evidencia_caso(
    trabajo_id: UUID,
    evaluacion_id: UUID,
    caso_id: UUID,
    payload: EvidenciaRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Evidencia directa del documento RA-105 (compatibilidad con el flujo anterior)."""
    e = await _buscar_evaluacion(db, trabajo_id, evaluacion_id)
    caso = next((c for c in e.casos_prueba if c.id == str(caso_id)), None)
    if not caso:
        raise HTTPException(status_code=404, detail="Caso de prueba no encontrado")
    correlativo = str(len(caso.evidencias) + 1)
    ev = EvidenciaCasoModel(caso_id=caso.id, correlativo=correlativo, archivo=payload.archivo, descripcion=payload.descripcion)
    db.add(ev)
    await db.commit()
    return evidencia_to_dict(ev)


# ------------------------------------------------------------------
# 4. INCIDENCIAS / HALLAZGOS (Formato de Incidencia DENTRO de la evaluación)
# ------------------------------------------------------------------

@router.post("/{trabajo_id}/evaluaciones/{evaluacion_id}/incidencias", status_code=status.HTTP_201_CREATED)
async def registrar_incidencia(
    trabajo_id: UUID,
    evaluacion_id: UUID,
    payload: IncidenciaRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    e = await _buscar_evaluacion(db, trabajo_id, evaluacion_id)
    try:
        tipo = TipoError(payload.tipo_error)
    except ValueError:
        raise HTTPException(status_code=400, detail="Tipo de error inválido")

    try:
        prio = PrioridadIncidencia(payload.prioridad).value
    except ValueError:
        prio = payload.prioridad

    correlativo = str(len(e.incidencias) + 1)
    inc = IncidenciaModel(
        evaluacion_id=e.id,
        correlativo=correlativo,
        numero_ticket=payload.numero_ticket or e.trabajo.numero_ticket,
        codigo=payload.codigo,
        version=payload.version,
        tipo_error=tipo.value,
        descripcion=payload.descripcion,
        prioridad=prio,
        es_bloqueante=payload.es_bloqueante,
        base_datos=payload.base_datos,
        motor_bd=payload.motor_bd,
        firma_analista=payload.firma_analista,
    )
    db.add(inc)
    await db.commit()
    creado = (await db.execute(select(IncidenciaModel).where(IncidenciaModel.id == inc.id))).scalar_one()
    return incidencia_to_dict(creado)


@router.post("/{trabajo_id}/evaluaciones/{evaluacion_id}/incidencias/{incidencia_id}/evidencias",
             status_code=status.HTTP_201_CREATED)
async def agregar_evidencia(
    trabajo_id: UUID,
    evaluacion_id: UUID,
    incidencia_id: UUID,
    payload: EvidenciaRequest,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    e = await _buscar_evaluacion(db, trabajo_id, evaluacion_id)
    inc = next((i for i in e.incidencias if i.id == str(incidencia_id)), None)
    if not inc:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")
    correlativo = str(len(inc.evidencias) + 1)
    ev = EvidenciaModel(incidencia_id=inc.id, correlativo=correlativo, archivo=payload.archivo, descripcion=payload.descripcion)
    db.add(ev)
    await db.commit()
    return evidencia_to_dict(ev)


# ------------------------------------------------------------------
# 5. DASHBOARD DEL COORDINADOR
# ------------------------------------------------------------------

@router.get("/dashboard/resumen")
async def resumen_trabajos(current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    rows = list((await db.execute(select(TrabajoModel))).scalars().all())
    total_trabajos = len(rows)
    pendientes_asignacion = sum(1 for t in rows if len(t.evaluaciones) == 0)

    todas_evaluaciones = [e for t in rows for e in t.evaluaciones]
    en_proceso = sum(1 for e in todas_evaluaciones if e.estado in (
        EstadoEvaluacion.EN_PROCESO.value, EstadoEvaluacion.PENDIENTE_ENTREGA.value))
    vencidos = sum(1 for e in todas_evaluaciones if e.fecha_programada_entrega and e.fecha_real_entrega is None
                   and e.estado != EstadoEvaluacion.CERRADO.value and e.fecha_programada_entrega < date.today())
    proximos = sum(1 for e in todas_evaluaciones if e.fecha_programada_entrega and e.fecha_real_entrega is None
                   and e.estado != EstadoEvaluacion.CERRADO.value
                   and 0 <= (e.fecha_programada_entrega - date.today()).days <= 3)
    entregados = sum(1 for e in todas_evaluaciones if e.fecha_real_entrega is not None)

    total_incidencias = sum(len(e.incidencias) for e in todas_evaluaciones)
    total_casos = sum(len(e.casos_prueba) for e in todas_evaluaciones)

    carga_analista: dict = {}
    for e in todas_evaluaciones:
        if e.analista:
            carga_analista[e.analista] = carga_analista.get(e.analista, 0) + 1

    estado_por_proyecto: dict = {}
    for e in todas_evaluaciones:
        estado_por_proyecto.setdefault(e.trabajo.proyecto, {})
        estado_por_proyecto[e.trabajo.proyecto][e.estado] = \
            estado_por_proyecto.get(e.trabajo.proyecto, {}).get(e.estado, 0) + 1

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