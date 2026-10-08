import os
import hashlib
import hmac
import base64
import json
import time
from typing import Optional, Dict, Any

JWT_SECRET = os.getenv("JWT_SECRET", "nexuscloud-secure-production-jwt-key-32b-min")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 900  # 15 minutes
REFRESH_TOKEN_EXPIRE_SECONDS = 604800  # 7 days

def hash_password(password: str) -> str:
    """Hash a password using salted PBKDF2-HMAC-SHA256."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"{salt.hex()}:{key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against salted PBKDF2 hash."""
    try:
        salt_hex, key_hex = hashed_password.split(":")
        salt = bytes.fromhex(salt_hex)
        expected_key = bytes.fromhex(key_hex)
        test_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100000)
        return hmac.compare_digest(expected_key, test_key)
    except Exception:
        return False

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")

def _base64url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("utf-8"))

def create_jwt_token(payload: Dict[str, Any], expires_in: int) -> str:
    """Create a signed JWT token."""
    header = {"alg": "HS256", "typ": "JWT"}
    exp_time = int(time.time()) + expires_in
    data = {**payload, "exp": exp_time, "iat": int(time.time())}
    
    header_b64 = _base64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    payload_b64 = _base64url_encode(json.dumps(data, separators=(",", ":")).encode("utf-8"))
    
    signature = hmac.new(
        JWT_SECRET.encode("utf-8"),
        f"{header_b64}.{payload_b64}".encode("utf-8"),
        hashlib.sha256
    ).digest()
    sig_b64 = _base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify a signed JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig_b64 = parts
        
        expected_sig = hmac.new(
            JWT_SECRET.encode("utf-8"),
            f"{header_b64}.{payload_b64}".encode("utf-8"),
            hashlib.sha256
        ).digest()
        
        provided_sig = _base64url_decode(sig_b64)
        if not hmac.compare_digest(expected_sig, provided_sig):
            return None
            
        payload = json.loads(_base64url_decode(payload_b64).decode("utf-8"))
        if payload.get("exp", 0) < time.time():
            return None  # expired
        return payload
    except Exception:
        return None
