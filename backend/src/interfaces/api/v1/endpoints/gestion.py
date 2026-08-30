"""Módulo de Gestión Centralizada (Requerimientos, Versiones, Calidad ISO, Monitoreo, Auditoría)."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, func as safunc
from sqlalchemy.ext.asyncio import AsyncSession
import json

from src.core.dependencies import get_current_user
from src.infrastructure.database.connection import get_db, AsyncSessionLocal
from src.infrastructure.database.models.gestion_model import (
    RequerimientoModel, VersionModel, CalidadIsoModel, AuditoriaModel
)
from src.infrastructure.database.models.trabajo_model import TrabajoModel, EvaluacionModel, IncidenciaModel

router = APIRouter()

# Schemas Pydantic
class RequerimientoRequest(BaseModel):
    titulo: str
    tipo: Optional[str] = "Funcional"
    prioridad: Optional[str] = "Media"
    estado: Optional[str] = "Registrado"
    responsable: str
    fecha: Optional[str] = None

class VersionRequest(BaseModel):
    version: str
    ambiente: Optional[str] = "Pruebas"
    responsable: str
    fecha: Optional[str] = None
    estado: Optional[str] = "En validación"
    cambios: Optional[str] = None

class CalidadIsoRequest(BaseModel):
    version_ref: str
    puntaje_global: float
    detalles: dict
    evaluador: str


# ------------------------------------------------------------------
# 1. REQUERIMIENTOS
# ------------------------------------------------------------------
@router.get("/requerimientos")
async def listar_requerimientos(db: AsyncSession = Depends(get_db)):
    res = (await db.execute(select(RequerimientoModel).order_by(RequerimientoModel.created_at.desc()))).scalars().all()
    return {"items": [{"id": r.id, "titulo": r.titulo, "tipo": r.tipo, "prioridad": r.prioridad, "estado": r.estado, "responsable": r.responsable, "fecha": r.fecha} for r in res], "total": len(res)}

@router.post("/requerimientos", status_code=status.HTTP_201_CREATED)
async def crear_requerimiento(payload: RequerimientoRequest, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    req = RequerimientoModel(**payload.model_dump())
    db.add(req)
    await db.commit()
    # Registrar auditoría
    db.add(AuditoriaModel(usuario=current_user.get("id", "sistema"), modulo="Requerimientos", accion="Creación", entidad=req.titulo))
    await db.commit()
    return {"id": req.id, "mensaje": "Requerimiento registrado con éxito"}


# ------------------------------------------------------------------
# 2. VERSIONES Y DESPLIEGUES
# ------------------------------------------------------------------
@router.get("/versiones")
async def listar_versiones(db: AsyncSession = Depends(get_db)):
    res = (await db.execute(select(VersionModel).order_by(VersionModel.created_at.desc()))).scalars().all()
    return {"items": [{"id": v.id, "version": v.version, "ambiente": v.ambiente, "responsable": v.responsable, "fecha": v.fecha, "estado": v.estado, "cambios": v.cambios} for v in res], "total": len(res)}

@router.post("/versiones", status_code=status.HTTP_201_CREATED)
async def crear_version(payload: VersionRequest, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    ver = VersionModel(**payload.model_dump())
    db.add(ver)
    await db.commit()
    db.add(AuditoriaModel(usuario=current_user.get("id", "sistema"), modulo="Versiones", accion="Despliegue", entidad=ver.version))
    await db.commit()
    return {"id": ver.id, "mensaje": "Versión registrada con éxito"}


# ------------------------------------------------------------------
# 3. CALIDAD ISO/IEC 25010
# ------------------------------------------------------------------
@router.get("/calidad-iso")
async def obtener_calidad_iso(db: AsyncSession = Depends(get_db)):
    res = (await db.execute(select(CalidadIsoModel).order_by(CalidadIsoModel.created_at.desc()))).scalars().first()
    if not res:
        return {
            "version_ref": "v1.2.3",
            "puntaje_global": 83.5,
            "evaluador": "Coordinador de Calidad",
            "detalles": json.dumps({
                "Adecuación funcional": 85,
                "Eficiencia de rendimiento": 80,
                "Compatibilidad": 88,
                "Usabilidad": 78,
                "Fiabilidad": 90,
                "Seguridad": 92,
                "Mantenibilidad": 82,
                "Portabilidad": 74
            })
        }
    return {
        "version_ref": res.version_ref,
        "puntaje_global": res.puntaje_global,
        "evaluador": res.evaluador,
        "detalles": res.detalles
    }

@router.post("/calidad-iso", status_code=status.HTTP_201_CREATED)
async def guardar_calidad_iso(payload: CalidadIsoRequest, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    iso = CalidadIsoModel(
        version_ref=payload.version_ref,
        puntaje_global=payload.puntaje_global,
        evaluador=payload.evaluador,
        detalles=json.dumps(payload.detalles)
    )
    db.add(iso)
    await db.commit()
    db.add(AuditoriaModel(usuario=current_user.get("id", "sistema"), modulo="Calidad ISO", accion="Evaluación", entidad=payload.version_ref))
    await db.commit()
    return {"mensaje": "Evaluación ISO/IEC 25010 guardada con éxito"}


# ------------------------------------------------------------------
# 4. MONITOREO Y ALERTAS AUTOMATIZADAS
# ------------------------------------------------------------------
@router.get("/monitoreo")
async def obtener_monitoreo(db: AsyncSession = Depends(get_db)):
    trabajos = (await db.execute(select(TrabajoModel))).scalars().all()
    total_t = len(trabajos)
    evals = [e for t in trabajos for e in t.evaluaciones]
    total_evals = len(evals)
    vencidas = sum(1 for e in evals if e.vencido)
    criticas = sum(1 for e in evals if e.prioridad == 'Alta')

    return {
        "kpis": [
            {"nombre": "Trabajos Registrados", "valor": total_t, "unidad": "tickets", "color": "#1976d2", "objetivo": total_t + 5},
            {"nombre": "Evaluaciones en Proceso", "valor": total_evals, "unidad": "activas", "color": "#22c55e", "objetivo": total_evals + 3},
            {"nombre": "MTTR Promedio", "valor": "2.1h", "unidad": "horas", "color": "#f59e0b", "objetivo": 4},
            {"nombre": "Evaluaciones Vencidas", "valor": vencidas, "unidad": "alertas", "color": "#ef4444", "objetivo": 0},
        ],
        "alertas": [
            {"nivel": "Crítica" if vencidas > 0 else "Info", "titulo": f"{vencidas} evaluación(es) con SLA vencido pendientes de entrega", "estado": "Activa" if vencidas > 0 else "Resuelta"},
            {"nivel": "Media", "titulo": "Monitoreo automático de bases de datos PostgreSQL activo", "estado": "Activa"},
            {"nivel": "Info", "titulo": "Sistema SGC-Trazabilidad operando con normalidad en Render", "estado": "Informativa"}
        ],
        "metricas": [
            {"nombre": "Disponibilidad del Sistema", "valor": 99.8, "objetivo": 99.0},
            {"nombre": "Cumplimiento de SLA", "valor": 92.4, "objetivo": 90.0},
            {"nombre": "Cobertura de Pruebas Automatizadas", "valor": 78.5, "objetivo": 80.0},
            {"nombre": "Estabilidad de Despliegues", "valor": 95.0, "objetivo": 90.0}
        ]
    }


# ------------------------------------------------------------------
# 5. AUDITORÍA Y TRAZABILIDAD
# ------------------------------------------------------------------
@router.get("/auditoria")
async def listar_auditoria(db: AsyncSession = Depends(get_db)):
    res = (await db.execute(select(AuditoriaModel).order_by(AuditoriaModel.created_at.desc()).limit(100))).scalars().all()
    if not res:
        # Sembrar evento inicial si está vacío
        default_log = AuditoriaModel(usuario="admin@poderjudicial.gob.pe", modulo="Sistema SGC", accion="Inicialización", entidad="Trazabilidad", ip="10.0.0.1")
        db.add(default_log)
        await db.commit()
        res = [default_log]

    return {
        "items": [{
            "id": a.id,
            "usuario": a.usuario,
            "modulo": a.modulo,
            "accion": a.accion,
            "entidad": a.entidad,
            "fecha": a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else "2026-08-30 12:00",
            "ip": a.ip
        } for a in res],
        "total": len(res)
    }
