from typing import Optional, Tuple
from app.models.user import User
from app.core.security import (
    hash_password,
    verify_password,
    create_jwt_token,
    decode_jwt_token,
    ACCESS_TOKEN_EXPIRE_SECONDS,
    REFRESH_TOKEN_EXPIRE_SECONDS,
)
import uuid

# In-memory mock storage if database connection is not active
_USERS_DB = {
    "alex.chen@nexuscloud.io": User(
        id="usr-89a1f4b2-03c1-482a-bc93-a417e29cb112",
        email="alex.chen@nexuscloud.io",
        full_name="Alex Chen",
        password_hash=hash_password("NexusCloud2026!"),
        is_active=True,
    ),
    "user@nexuscloud.io": User(
        id="usr-12a9c334-71e8-4221-a3f2-e5681cbb4092",
        email="user@nexuscloud.io",
        full_name="Elena Rostova",
        password_hash=hash_password("NexusCloud2026!"),
        is_active=True,
    ),
    "inactive@nexuscloud.io": User(
        id="usr-99e4f551-84c2-4001-b519-c6892eef8811",
        email="inactive@nexuscloud.io",
        full_name="Inactive User",
        password_hash=hash_password("NexusCloud2026!"),
        is_active=False,
    ),
}

# Active refresh tokens store: token -> user_id
_ACTIVE_REFRESH_TOKENS = {}

class AuthService:
    @staticmethod
    def get_user_by_email(email: str) -> Optional[User]:
        return _USERS_DB.get(email.lower().strip())

    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[User]:
        for user in _USERS_DB.values():
            if user.id == user_id:
                return user
        return None

    @staticmethod
    def authenticate_user(username: str, password: str) -> Tuple[Optional[User], Optional[str]]:
        user = AuthService.get_user_by_email(username)
        if not user or not verify_password(password, user.password_hash):
            return None, "Invalid email or password"
        if not user.is_active:
            return None, "Account is inactive"
        return user, None

    @staticmethod
    def create_tokens_for_user(user: User) -> Tuple[str, str]:
        access_token = create_jwt_token(
            {"sub": user.id, "email": user.email, "type": "access"},
            expires_in=ACCESS_TOKEN_EXPIRE_SECONDS,
        )
        refresh_token = create_jwt_token(
            {"sub": user.id, "jti": str(uuid.uuid4()), "type": "refresh"},
            expires_in=REFRESH_TOKEN_EXPIRE_SECONDS,
        )
        _ACTIVE_REFRESH_TOKENS[refresh_token] = user.id
        return access_token, refresh_token

    @staticmethod
    def rotate_refresh_token(old_refresh_token: str) -> Optional[Tuple[str, str]]:
        if old_refresh_token not in _ACTIVE_REFRESH_TOKENS:
            return None
        payload = decode_jwt_token(old_refresh_token)
        if not payload or payload.get("type") != "refresh":
            _ACTIVE_REFRESH_TOKENS.pop(old_refresh_token, None)
            return None
        
        user_id = payload.get("sub")
        user = AuthService.get_user_by_id(user_id)
        if not user or not user.is_active:
            _ACTIVE_REFRESH_TOKENS.pop(old_refresh_token, None)
            return None
            
        # Invalidate old refresh token (Token Rotation)
        _ACTIVE_REFRESH_TOKENS.pop(old_refresh_token, None)
        return AuthService.create_tokens_for_user(user)

    @staticmethod
    def revoke_refresh_token(refresh_token: str) -> bool:
        if refresh_token in _ACTIVE_REFRESH_TOKENS:
            del _ACTIVE_REFRESH_TOKENS[refresh_token]
            return True
        return False
