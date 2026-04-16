"""baseline users table

Represents the `users` table that was created by hand before Alembic
was introduced. Fresh environments will create it via this migration;
existing environments should be stamped to this revision.

Revision ID: 737ca094f592
Revises:
Create Date: 2026-04-16 18:44:21.702127
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "737ca094f592"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.Identity(always=False),
            nullable=False,
        ),
        sa.Column("username", sa.String(length=20), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("user_id", name="users_pkey"),
        sa.UniqueConstraint("username", name="users_username_key"),
    )


def downgrade() -> None:
    op.drop_table("users")
