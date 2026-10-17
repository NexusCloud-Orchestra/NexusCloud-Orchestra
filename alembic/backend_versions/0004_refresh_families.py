"""Group refresh sessions into rotation families and record why each was revoked."""

import sqlalchemy as sa
from alembic import op

revision = "0004_refresh_families"
down_revision = "0003_manifest_index_v2"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("refresh_sessions") as batch:
        batch.add_column(sa.Column("family_id", sa.Uuid(), nullable=True))
        batch.add_column(sa.Column("revoked_reason", sa.String(20), nullable=True))
    # Each pre-existing session becomes the root of its own family.
    op.execute("UPDATE refresh_sessions SET family_id = id")
    with op.batch_alter_table("refresh_sessions") as batch:
        batch.alter_column("family_id", existing_type=sa.Uuid(), nullable=False)
        batch.create_index("ix_refresh_sessions_family_id", ["family_id"])


def downgrade():
    with op.batch_alter_table("refresh_sessions") as batch:
        batch.drop_index("ix_refresh_sessions_family_id")
        batch.drop_column("revoked_reason")
        batch.drop_column("family_id")
