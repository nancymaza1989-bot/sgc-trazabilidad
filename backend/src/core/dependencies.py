from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.core.security import verify_token
from src.core.exceptions import AutenticacionFallidaException

security = HTTPBearer()

def _rechazar_autenticacion():
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o sesión expirada",
        headers={"WWW-Authenticate": "Bearer"},
    )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = verify_token(token)
        user_id = payload.get("sub")
        if not user_id:
            _rechazar_autenticacion()
        return {"id": user_id, "rol": payload.get("rol")}
    except AutenticacionFallidaException:
        _rechazar_autenticacion()
    except Exception:
        _rechazar_autenticacion()