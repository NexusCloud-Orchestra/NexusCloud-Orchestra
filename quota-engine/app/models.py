"""
Database models using SQLAlchemy ORM.

This module defines the database schema for the Quota Engine project.
It uses modern SQLAlchemy 2.0 type mapping (Mapped and mapped_column)
to declare database tables, columns, constraints, and relationships.
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import ForeignKey, String, BigInteger, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base



class User(Base):
    """
    SQLAlchemy model representing the 'users' table.
    """
    __tablename__ = "users"

    # Primary key, indexed for fast lookups.
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # User's full name.
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Email field, which is indexed and must be unique.
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    
    # Timestamp marking when the user was created. Default is set to the current database server time.
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    
    files: Mapped[List["File"]] = relationship(
        back_populates="user", 
        cascade="all, delete-orphan"
    )

    # One-to-One: A user has exactly one storage quota dashboard.
    # - Optional["Quota"]: Indicates that the quota object could be None initially.
    # - back_populates="user": Links with the Quota.user field.
    # - cascade="all, delete-orphan": Automatically deletes the quota if the user is deleted.
    quota: Mapped[Optional["Quota"]] = relationship(
        back_populates="user", 
        cascade="all, delete-orphan"
    )


# ==============================================================================
# 2. File Model
# ==============================================================================
# The File model tracks metadata of stored files.
#
# Comments on ORM concepts:
# - ForeignKey("users.id"): Creates a constraint pointing to the 'users' table's primary key.
#   This ensures database-level referential integrity.
# - BigInteger: Used for file size in bytes to prevent integer overflow for large files.
class File(Base):
    """
    SQLAlchemy model representing the 'files' table.
    """
    __tablename__ = "files"

    # Primary key.
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Foreign key referencing User.id. If the user is deleted, their files are deleted.
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), 
        index=True, 
        nullable=False
    )
    
    # Name of the file.
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Size of the file in bytes (mapped to SQL BIGINT).
    size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    
    # Storage provider used, e.g., 'backblaze', 'aws_s3'.
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Timestamp marking when the file was uploaded.
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # RELATIONSHIPS
    #
    # Back-reference linking this File to its owning User.
    user: Mapped["User"] = relationship(back_populates="files")


# ==============================================================================
# 3. Quota Model
# ==============================================================================
# The Quota model stores the storage quota allocation and consumption details.
#
# Comments on ORM concepts:
# - onupdate=func.now(): SQLAlchemy will automatically update this field with the current
#   timestamp whenever the row is modified in the database.
class Quota(Base):
    """
    SQLAlchemy model representing the 'quotas' table.
    """
    __tablename__ = "quotas"

    # Primary key.
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    
    # Foreign key referencing User.id. It is unique to enforce the One-to-One relationship constraint.
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), 
        unique=True, 
        index=True, 
        nullable=False
    )
    
    # Total storage allowed (in bytes).
    total_storage: Mapped[int] = mapped_column(BigInteger, nullable=False)
    
    # Storage currently consumed by files (in bytes).
    used_storage: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    
    # Storage space remaining (in bytes).
    remaining_storage: Mapped[int] = mapped_column(BigInteger, nullable=False)
    
    # Timestamp showing when the quota details were last updated.
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        server_default=func.now(), 
        onupdate=func.now()
    )

    # RELATIONSHIPS
    #
    # Back-reference linking this Quota to its corresponding User.
    user: Mapped["User"] = relationship(back_populates="quota")
