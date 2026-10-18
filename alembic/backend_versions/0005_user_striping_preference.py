"""Add the per-user striping opt-in; striped files have no redundancy so it defaults off."""

import sqlalchemy as sa
from alembic import op

revision = "0005_user_striping_preference"
down_revision = "0004_refresh_families"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("striping_enabled", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade():
    with op.batch_alter_table("users") as batch:
        batch.drop_column("striping_enabled")
