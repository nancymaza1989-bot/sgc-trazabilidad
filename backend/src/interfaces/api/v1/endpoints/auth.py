from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select

from src.core.security import create_access_token, verify_password
from src.core.dependencies import get_current_user
from src.infrastructure.database.connection import get_db
from src.infrastructure.database.models.usuario_model import UsuarioModel

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 10080

@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest, db = Depends(get_db)):
    email = (data.email or "").strip().lower()
    result = await db.execute(select(UsuarioModel).where(UsuarioModel.email == email))
    usuario = result.scalar_one_or_none()
    if not usuario or not verify_password(data.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    if usuario.estado != "Activo":
        raise HTTPException(status_code=403, detail="Usuario inactivo")
    access_token = create_access_token({"sub": usuario.id, "rol": usuario.rol})
    return LoginResponse(access_token=access_token)

@router.get("/me")
async def get_me(current_user = Depends(get_current_user)):
    return current_user
