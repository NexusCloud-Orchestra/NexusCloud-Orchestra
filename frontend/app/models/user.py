from datetime import datetime
import uuid
from typing import Optional

class User:
    """User entity model representing user record in database."""
    def __init__(
        self,
        id: Optional[str] = None,
        email: str = "",
        full_name: str = "",
        password_hash: str = "",
        is_active: bool = True,
        created_at: Optional[datetime] = None,
        updated_at: Optional[datetime] = None,
    ):
        self.id = id or str(uuid.uuid4())
        self.email = email
        self.full_name = full_name
        self.password_hash = password_hash
        self.is_active = is_active
        self.created_at = created_at or datetime.utcnow()
        self.updated_at = updated_at or datetime.utcnow()
