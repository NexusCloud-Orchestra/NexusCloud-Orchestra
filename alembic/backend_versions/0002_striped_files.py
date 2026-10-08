"""Add logical manifests and per-chunk hashes for cross-cloud striping."""

import sqlalchemy as sa
from alembic import op

revision = "0002_striped_files"
down_revision = "0001_backend_baseline"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "file_manifests",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("original_name", sa.String(255), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("mime_type", sa.String(255), nullable=False),
        sa.Column("index_hash", sa.String(64), nullable=False),
        sa.Column("chunk_count", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("upload_expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_file_manifests_user_id", "file_manifests", ["user_id"])
    op.create_index("ix_manifest_user_hash", "file_manifests", ["user_id", "index_hash"])
    with op.batch_alter_table("file_records") as batch:
        batch.add_column(sa.Column("manifest_id", sa.Uuid(), nullable=True))
        batch.add_column(sa.Column("chunk_index", sa.Integer(), nullable=True))
        batch.add_column(sa.Column("sha256", sa.String(64), nullable=True))
        batch.create_foreign_key("fk_file_manifest", "file_manifests", ["manifest_id"], ["id"])
        batch.create_unique_constraint("uq_file_chunk_index", ["manifest_id", "chunk_index"])
        batch.create_index("ix_file_records_manifest_id", ["manifest_id"])


def downgrade():
    with op.batch_alter_table("file_records") as batch:
        batch.drop_index("ix_file_records_manifest_id")
        batch.drop_constraint("uq_file_chunk_index", type_="unique")
        batch.drop_constraint("fk_file_manifest", type_="foreignkey")
        batch.drop_column("sha256")
        batch.drop_column("chunk_index")
        batch.drop_column("manifest_id")
    op.drop_index("ix_manifest_user_hash", table_name="file_manifests")
    op.drop_index("ix_file_manifests_user_id", table_name="file_manifests")
    op.drop_table("file_manifests")
