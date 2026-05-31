"""add user_custom_symbols

Revision ID: a4e2f90b1c73
Revises: 2601de5c1bba
Create Date: 2026-05-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'a4e2f90b1c73'
down_revision: Union[str, None] = '2601de5c1bba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'user_custom_symbols',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('width', sa.Integer(), nullable=False),
        sa.Column('height', sa.Integer(), nullable=False),
        sa.Column('paths', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('anchors', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_user_custom_symbols_user_id'), 'user_custom_symbols', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_custom_symbols_user_id'), table_name='user_custom_symbols')
    op.drop_table('user_custom_symbols')
