"""Add payout system tables

Revision ID: 001_add_payout_system
Revises:
Create Date: 2024-02-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_add_payout_system'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create payouts table
    op.create_table(
        'payouts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('vendor_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('vendors.id', ondelete='CASCADE'), nullable=False),
        sa.Column('amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='USD'),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('payment_method', sa.String(50), nullable=False),
        sa.Column('stripe_transfer_id', sa.String(255), nullable=True),
        sa.Column('transaction_id', sa.String(255), nullable=True),
        sa.Column('scheduled_date', sa.DateTime, nullable=True),
        sa.Column('paid_date', sa.DateTime, nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('admin_notes', sa.Text, nullable=True),
        sa.Column('failure_reason', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    # Create indexes for payouts
    op.create_index('ix_payouts_vendor_id', 'payouts', ['vendor_id'])
    op.create_index('ix_payouts_status', 'payouts', ['status'])
    op.create_index('ix_payouts_created_at', 'payouts', ['created_at'])

    # Create payout_items table
    op.create_table(
        'payout_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('payout_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('payouts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('orders.id', ondelete='SET NULL'), nullable=True),
        sa.Column('order_amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('commission_amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('vendor_amount', sa.Numeric(12, 2), nullable=False),
        sa.Column('created_at', sa.DateTime, nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    # Create indexes for payout_items
    op.create_index('ix_payout_items_payout_id', 'payout_items', ['payout_id'])
    op.create_index('ix_payout_items_order_id', 'payout_items', ['order_id'])


def downgrade():
    # Drop payout_items table and its indexes
    op.drop_index('ix_payout_items_order_id', table_name='payout_items')
    op.drop_index('ix_payout_items_payout_id', table_name='payout_items')
    op.drop_table('payout_items')

    # Drop payouts table and its indexes
    op.drop_index('ix_payouts_created_at', table_name='payouts')
    op.drop_index('ix_payouts_status', table_name='payouts')
    op.drop_index('ix_payouts_vendor_id', table_name='payouts')
    op.drop_table('payouts')
