"""Version stripe indexes while preserving existing v1 manifests."""

import sqlalchemy as sa
from alembic import op

revision = "0003_manifest_index_v2"
down_revision = "0002_striped_files"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "file_manifests",
        sa.Column("index_version", sa.Integer(), nullable=False, server_default="1"),
    )


def downgrade():
    op.drop_column("file_manifests", "index_version")
