"""Serializadores de los modelos ORM a los diccionarios JSON que consume el frontend.

Mantienen EXACTAMENTE el mismo contrato (nombres de campos y formatos) que
devolvían los ``to_dict()`` de las entidades de dominio en memoria, más los
nuevos campos del Formato de Incidencia y del Formato de Caso de Prueba (RA-105).
"""
import json
from datetime import date

from src.core.constants import EstadoEvaluacion


def _fecha_iso(valor):
    return valor.isoformat() if valor else None


def _es_vencido(e) -> bool:
    hoy = date.today()
    return bool(
        e.fecha_programada_entrega
        and e.fecha_real_entrega is None
        and e.estado not in (EstadoEvaluacion.CERRADO.value,)
        and e.fecha_programada_entrega < hoy
    )


def _es_proximo_a_vencer(e, dias: int = 3) -> bool:
    hoy = date.today()
    if e.fecha_programada_entrega and e.fecha_real_entrega is None and e.estado != EstadoEvaluacion.CERRADO.value:
        d = (e.fecha_programada_entrega - hoy).days
        return 0 <= d <= dias
    return False


def _historial_lista(raw) -> list:
    if not raw:
        return []
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, list) else []
    except (ValueError, TypeError):
        return []


def evidencia_to_dict(v) -> dict:
    return {"id": v.id, "correlativo": v.correlativo, "archivo": v.archivo, "descripcion": v.descripcion}


def caso_item_to_dict(x) -> dict:
    return {
        "id": x.id,
        "numero": x.numero,
        "descripcion": x.descripcion,
        "evidencias": [evidencia_to_dict(e) for e in x.evidencias],
    }


def caso_prueba_to_dict(c) -> dict:
    campo = c.campo_componente or c.flujo_componente
    resultado = c.resultado_prueba or c.resultado
    return {
        "id": c.id,
        "correlativo": c.correlativo,
        "numero_caso": c.numero_caso or c.correlativo,
        "numero_ticket": c.numero_ticket,
        "numero_acta_pase": c.numero_acta_pase,
        "nombre_analista": c.nombre_analista,
        "tipo_pase": c.tipo_pase,
        "fecha_prueba": _fecha_iso(c.fecha_prueba),
        "flujo_componente": campo,
        "campo_componente": campo,
        "resultado": resultado,
        "resultado_prueba": resultado,
        "observaciones": c.observaciones,
        "firma_analista": c.firma_analista,
        "firma_supervisor": c.firma_supervisor,
        "evidencias": [evidencia_to_dict(e) for e in c.evidencias],
        "casos": [caso_item_to_dict(x) for x in c.casos],
    }


def incidencia_to_dict(i) -> dict:
    e = i.evaluacion
    t = e.trabajo
    return {
        "id": i.id,
        "correlativo": i.correlativo,
        "evaluacion_id": e.id,
        # Contexto heredado de la evaluación (el ticket es heredado pero editable):
        "numero_ticket": i.numero_ticket or t.numero_ticket,
        "proyecto": t.proyecto,
        "tipo_atencion": t.tipo_atencion,
        "analista": e.analista,
        "fecha_asignacion": _fecha_iso(e.fecha_asignacion),
        "fecha_programada_entrega": _fecha_iso(e.fecha_programada_entrega),
        # Datos propios del hallazgo (formulario real del Poder Judicial):
        "codigo": i.codigo,
        "version": i.version,
        "tipo_error": i.tipo_error,
        "descripcion": i.descripcion,
        "prioridad": i.prioridad,
        "es_bloqueante": i.es_bloqueante,
        "base_datos": i.base_datos,
        "motor_bd": i.motor_bd,
        "firma_analista": i.firma_analista,
        "evidencias": [evidencia_to_dict(e) for e in i.evidencias],
    }


def evaluacion_to_dict(e) -> dict:
    t = e.trabajo
    return {
        "id": e.id,
        "trabajo_id": t.id,
        "numero_ticket": t.numero_ticket,
        "proyecto": t.proyecto,
        "tipo_atencion": t.tipo_atencion,
        "prioridad": t.prioridad,
        "instrucciones": t.instrucciones,
        "documentacion": t.documentacion,
        "fecha_recepcion": _fecha_iso(t.fecha_recepcion),
        "analista": e.analista,
        "analista_id": e.analista_id,
        "fecha_asignacion": _fecha_iso(e.fecha_asignacion),
        "fecha_programada_entrega": _fecha_iso(e.fecha_programada_entrega),
        "fecha_real_entrega": _fecha_iso(e.fecha_real_entrega),
        "estado": e.estado,
        "resultado": e.resultado,
        "vencido": _es_vencido(e),
        "proximo_a_vencer": _es_proximo_a_vencer(e),
        "historial": _historial_lista(e.historial),
    }


def trabajo_to_dict(t) -> dict:
    adjuntos = []
    for a in t.adjuntos or []:
        adjuntos.append({
            "id": a.id,
            "nombre": a.nombre,
            "tipo_mime": a.tipo_mime,
            "tamano": a.tamano,
            "archivo": a.archivo,
            "descripcion": a.descripcion,
            "created_at": _fecha_iso(a.created_at),
        })
    return {
        "id": t.id,
        "numero_ticket": t.numero_ticket,
        "proyecto": t.proyecto,
        "tipo_atencion": t.tipo_atencion,
        "prioridad": t.prioridad,
        "instrucciones": t.instrucciones,
        "documentacion": t.documentacion,
        "fecha_recepcion": _fecha_iso(t.fecha_recepcion),
        "coordinador": t.coordinador,
        "asignacion_id": t.asignacion_id,
        "pendiente_asignacion": len(t.evaluaciones) == 0,
        "adjuntos": adjuntos,
        "evaluaciones": [evaluacion_to_dict(e) for e in t.evaluaciones],
    }


def proyecto_to_dict(p) -> dict:
    return {
        "id": p.id,
        "nombre": p.nombre,
        "activo": p.activo,
    }


def asignacion_to_dict(a) -> dict:
    return {
        "id": a.id,
        "nombre": a.nombre,
        "analista_encargado": a.analista_encargado,
        "fecha_asignacion": _fecha_iso(a.fecha_asignacion),
        "fecha_programada_entrega": _fecha_iso(a.fecha_programada_entrega),
        "estado": a.estado,
        "observaciones": a.observaciones,
        "analistas": [{"id": x.id, "analista": x.analista} for x in a.analistas or []],
        "trabajos": [trabajo_to_dict(t) for t in a.trabajos or []],
    }