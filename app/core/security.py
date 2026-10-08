import hashlib
import json
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from jwt.exceptions import PyJWTError

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(password: str, digest: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), digest.encode())
    except ValueError:
        return False


def digest_token(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _key() -> bytes:
    # Domain-separated key derivation avoids using a text secret as raw AES material.
    return hashlib.sha256(("nexuscloud:credentials:" + settings.ENCRYPTION_KEY).encode()).digest()


def encrypt_credentials(credentials: dict) -> bytes:
    nonce = secrets.token_bytes(12)
    encrypted = AESGCM(_key()).encrypt(nonce, json.dumps(credentials, separators=(",", ":")).encode(), None)
    return nonce + encrypted


def decrypt_credentials(ciphertext: bytes) -> dict:
    return json.loads(AESGCM(_key()).decrypt(ciphertext[:12], ciphertext[12:], None))


def issue_token(user_id: uuid.UUID, token_version: int, kind: str, ttl: timedelta) -> tuple[str, str, datetime]:
    expires = datetime.now(timezone.utc) + ttl
    jti = secrets.token_urlsafe(24)
    claims = {"sub": str(user_id), "ver": token_version, "typ": kind, "jti": jti, "exp": expires}
    return jwt.encode(claims, settings.SECRET_KEY, algorithm="HS256"), jti, expires


def parse_token(token: str, expected_type: str) -> dict:
    try:
        claims = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"], options={"require": ["exp", "sub", "jti"]})
        if claims.get("typ") != expected_type or not claims.get("sub") or not claims.get("jti"):
            raise ValueError("Invalid token type")
        return claims
    except (PyJWTError, ValueError) as exc:
        raise ValueError("Invalid or expired token") from exc
