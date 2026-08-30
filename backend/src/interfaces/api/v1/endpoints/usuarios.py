"""Endpoints de gestión de usuarios (RBAC). Solo el administrador puede gestionar usuarios."""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import get_current_user
from src.core.security import hash_password, verify_password
from src.infrastructure.database.connection import get_db
from src.infrastructure.database.models.usuario_model import UsuarioModel

router = APIRouter()

ROLES_VALIDOS = {"administrador", "coordinador", "analista"}
ESTADOS_VALIDOS = {"Activo", "Inactivo"}


class UsuarioCreate(BaseModel):
    nombre: str
    email: str
    password: str
    rol: str = "analista"
    area: Optional[str] = "Calidad"
    estado: str = "Activo"


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[str] = None
    rol: Optional[str] = None
    area: Optional[str] = None
    estado: Optional[str] = None
    password: Optional[str] = None


def _requiere_admin(current_user: dict) -> None:
    if current_user.get("rol") != "administrador":
        raise HTTPException(status_code=403, detail="Solo el administrador puede gestionar usuarios")


def _usuario_a_dict(u: UsuarioModel) -> dict:
    return {
        "id": u.id,
        "nombre": u.nombre,
        "email": u.email,
        "rol": u.rol,
        "area": u.area,
        "estado": u.estado,
    }


@router.get("/")
async def listar_usuarios(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    _requiere_admin(current_user)
    items = list((await db.execute(select(UsuarioModel).order_by(UsuarioModel.nombre))).scalars().all())
    return [_usuario_a_dict(u) for u in items]


@router.get("/analistas")
async def listar_analistas(current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Devuelve los analistas activos (rol='analista', estado='Activo') para poblar
    los desplegables 'Analista encargado' y 'Grupo de analistas' del módulo de
    asignación de pase de versión. Accesible a cualquier usuario autenticado."""
    stmt = select(UsuarioModel).where(
        UsuarioModel.rol == "analista",
        UsuarioModel.estado == "Activo",
    ).order_by(UsuarioModel.nombre)
    items = list((await db.execute(stmt)).scalars().all())
    return {"items": [{"id": u.id, "nombre": u.nombre, "email": u.email} for u in items], "total": len(items)}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear_usuario(
    data: UsuarioCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _requiere_admin(current_user)
    nombre = (data.nombre or "").strip()
    email = (data.email or "").strip().lower()
    password = data.password or ""
    if not nombre or not email or not password:
        raise HTTPException(status_code=400, detail="Nombre, correo y contraseña son obligatorios")
    if data.rol not in ROLES_VALIDOS:
        raise HTTPException(status_code=400, detail="Rol inválido")
    if data.estado not in ESTADOS_VALIDOS:
        raise HTTPException(status_code=400, detail="Estado inválido")
    existe = (await db.execute(select(UsuarioModel).where(UsuarioModel.email == email))).scalar_one_or_none()
    if existe:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    u = UsuarioModel(
        nombre=nombre,
        email=email,
        password_hash=hash_password(password),
        rol=data.rol,
        area=data.area or None,
        estado=data.estado,
    )
    db.add(u)
    await db.commit()
    creado = (await db.execute(select(UsuarioModel).where(UsuarioModel.id == u.id))).scalar_one()
    return _usuario_a_dict(creado)


@router.put("/{usuario_id}")
async def actualizar_usuario(
    usuario_id: str,
    data: UsuarioUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _requiere_admin(current_user)
    u = (await db.execute(select(UsuarioModel).where(UsuarioModel.id == usuario_id))).scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if data.nombre is not None:
        u.nombre = data.nombre.strip()
    if data.email is not None:
        nuevo_email = data.email.strip().lower()
        dup = (await db.execute(select(UsuarioModel).where(
            UsuarioModel.email == nuevo_email, UsuarioModel.id != usuario_id
        ))).scalar_one_or_none()
        if dup:
            raise HTTPException(status_code=400, detail="El correo ya está registrado")
        u.email = nuevo_email
    if data.rol is not None:
        if data.rol not in ROLES_VALIDOS:
            raise HTTPException(status_code=400, detail="Rol inválido")
        u.rol = data.rol
    if data.area is not None:
        u.area = data.area or None
    if data.estado is not None:
        if data.estado not in ESTADOS_VALIDOS:
            raise HTTPException(status_code=400, detail="Estado inválido")
        u.estado = data.estado
    if data.password:
        u.password_hash = hash_password(data.password)
    await db.commit()
    actualizado = (await db.execute(select(UsuarioModel).where(UsuarioModel.id == usuario_id))).scalar_one()
    return _usuario_a_dict(actualizado)


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_usuario(usuario_id: str, current_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    _requiere_admin(current_user)
    u = (await db.execute(select(UsuarioModel).where(UsuarioModel.id == usuario_id))).scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if u.id == current_user.get("id"):
        raise HTTPException(status_code=400, detail="No puede eliminar su propio usuario")
    await db.delete(u)
    await db.commit()


@router.put("/{usuario_id}/cambiar-password")
async def cambiar_password_propio(
    usuario_id: str,
    password_actual: str,
    password_nuevo: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    u = (await db.execute(select(UsuarioModel).where(UsuarioModel.id == usuario_id))).scalar_one_or_none()
    if not u:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if u.id != current_user.get("id"):
        _requiere_admin(current_user)
    if not verify_password(password_actual, u.password_hash):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")
    if not password_nuevo:
        raise HTTPException(status_code=400, detail="La nueva contraseña es obligatoria")
    u.password_hash = hash_password(password_nuevo)
    await db.commit()
    return {"detail": "Contraseña actualizada"}
