"""Endpoints del módulo Configuración: catálogo de proyectos (combobox editable)."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import get_current_user
from src.infrastructure.database.connection import get_db
from src.infrastructure.database.models.trabajo_model import ProyectoModel
from src.interfaces.api.v1.endpoints.serializers import proyecto_to_dict

router = APIRouter()


@router.get("/proyectos")
async def listar_proyectos(current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(ProyectoModel).order_by(ProyectoModel.nombre)
    items = list((await db.execute(stmt)).scalars().all())
    return {"items": [proyecto_to_dict(p) for p in items], "total": len(items)}


@router.post("/proyectos", status_code=status.HTTP_201_CREATED)
async def crear_proyecto(nombre: str, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    nombre = (nombre or "").strip()
    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre del proyecto es obligatorio")
    existe = (await db.execute(select(ProyectoModel).where(ProyectoModel.nombre == nombre))).scalar_one_or_none()
    if existe:
        raise HTTPException(status_code=400, detail="El proyecto ya existe")
    p = ProyectoModel(nombre=nombre, activo=True)
    db.add(p)
    await db.commit()
    creado = (await db.execute(select(ProyectoModel).where(ProyectoModel.id == p.id))).scalar_one()
    return proyecto_to_dict(creado)


@router.patch("/proyectos/{proyecto_id}")
async def actualizar_proyecto(
    proyecto_id: str,
    nombre: str = None,
    activo: bool = None,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    p = (await db.execute(select(ProyectoModel).where(ProyectoModel.id == proyecto_id))).scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    if nombre is not None:
        n = nombre.strip()
        if not n:
            raise HTTPException(status_code=400, detail="El nombre del proyecto es obligatorio")
        duplicado = (await db.execute(
            select(ProyectoModel).where(ProyectoModel.nombre == n, ProyectoModel.id != proyecto_id)
        )).scalar_one_or_none()
        if duplicado:
            raise HTTPException(status_code=400, detail="El proyecto ya existe")
        p.nombre = n
    if activo is not None:
        p.activo = activo
    await db.commit()
    actualizado = (await db.execute(select(ProyectoModel).where(ProyectoModel.id == proyecto_id))).scalar_one()
    return proyecto_to_dict(actualizado)


@router.delete("/proyectos/{proyecto_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_proyecto(proyecto_id: str, current_user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    p = (await db.execute(select(ProyectoModel).where(ProyectoModel.id == proyecto_id))).scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    await db.delete(p)
    await db.commit()
