from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.core.security import verify_token
from src.core.exceptions import AutenticacionFallidaException

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = verify_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise AutenticacionFallidaException()
        return {"id": user_id, "rol": payload.get("rol")}
    except Exception:
        raise AutenticacionFallidaException()