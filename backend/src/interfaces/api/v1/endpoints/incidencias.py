from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional
from uuid import UUID
from datetime import datetime

from src.domain.incidencias.entities import Incidencia
from src.domain.incidencias.value_objects import Prioridad, Severidad
from src.core.dependencies import get_current_user

router = APIRouter()

# Datos en memoria para demostración
incidencias_db = []

@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear_incidencia(
    titulo: str,
    descripcion: str,
    prioridad: str = "Media",
    severidad: str = "Media",
    current_user = Depends(get_current_user)
):
    incidencia = Incidencia(
        titulo=titulo,
        descripcion=descripcion,
        prioridad=Prioridad(prioridad),
        severidad=Severidad(severidad),
        reportado_por=UUID(current_user["id"])
    )
    incidencias_db.append(incidencia)
    return {
        "id": str(incidencia.id),
        "titulo": incidencia.titulo,
        "descripcion": incidencia.descripcion,
        "estado": incidencia.estado.value,
        "fecha_reporte": incidencia.fecha_reporte.isoformat()
    }

@router.get("/")
async def listar_incidencias(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    estado: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    items = incidencias_db
    if estado:
        items = [i for i in items if i.estado.value == estado]
    
    total = len(items)
    start = (page - 1) * size
    end = start + size
    paginated = items[start:end]
    
    return {
        "items": [
            {
                "id": str(i.id),
                "titulo": i.titulo,
                "descripcion": i.descripcion,
                "estado": i.estado.value,
                "prioridad": i.prioridad.value,
                "fecha_reporte": i.fecha_reporte.isoformat()
            }
            for i in paginated
        ],
        "total": total,
        "page": page,
        "size": size,
        "pages": (total + size - 1) // size if total > 0 else 1
    }