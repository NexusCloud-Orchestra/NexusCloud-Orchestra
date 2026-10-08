from typing import Optional
from app.models.user import User
from app.services.auth import AuthService
from app.core.security import decode_jwt_token

class AuthContext:
    @staticmethod
    def get_current_user_from_token(token: str) -> Optional[User]:
        if not token:
            return None
        payload = decode_jwt_token(token)
        if not payload or payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        return AuthService.get_user_by_id(user_id)
