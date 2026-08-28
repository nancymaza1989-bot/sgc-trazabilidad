from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from src.core.security import create_access_token, verify_password
from src.core.dependencies import get_current_user

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 1800

@router.post("/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    # Usuario de prueba - En producción, verificar en BD
    usuarios = {
        "admin@poderjudicial.gob.pe": {"password": "Admin2024Secure", "rol": "administrador", "id": "admin"},
        "coordinador@poderjudicial.gob.pe": {"password": "Coord2024Secure", "rol": "coordinador", "id": "coord1"},
        "analista@poderjudicial.gob.pe": {"password": "Analista2024Secure", "rol": "analista", "id": "anal1"},
    }
    usuario = usuarios.get(data.email)
    if usuario and usuario["password"] == data.password:
        access_token = create_access_token({"sub": usuario["id"], "rol": usuario["rol"]})
        return LoginResponse(access_token=access_token)
    raise HTTPException(status_code=401, detail="Credenciales inválidas")

@router.get("/me")
async def get_me(current_user = Depends(get_current_user)):
    return current_user