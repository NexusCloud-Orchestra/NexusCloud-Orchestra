import enum
from sqlalchemy import String, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Plan(str, enum.Enum):
    FREE    = "free"
    STARTER = "starter"
    PRO     = "pro"
    TEAM    = "team"


class User(Base):
    __tablename__ = "users"

    first_name:    Mapped[str]  = mapped_column(String(50), nullable=False)
    last_name:     Mapped[str]  = mapped_column(String(100), nullable=False)
    email:         Mapped[str]  = mapped_column(String(100), unique=True, nullable=False, index=True)
    password:      Mapped[str]  = mapped_column(String(250), nullable=False)
    is_active:     Mapped[bool] = mapped_column(Boolean, default=True)
    plan:          Mapped[str]  = mapped_column(String(20), default="free")

    connections:  Mapped[list["CloudConnection"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    file_records: Mapped[list["FileRecord"]]       = relationship(back_populates="user", cascade="all, delete-orphan")
    audit_logs:   Mapped[list["AuditLog"]]         = relationship(back_populates="user", cascade="all, delete-orphan")
