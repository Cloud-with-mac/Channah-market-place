"""Add banner_images table for proper relational design

Revision ID: 002_add_banner_images_table
Revises: 001_add_payout_system
Create Date: 2026-02-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid
import json


# revision identifiers, used by Alembic.
revision = '002_add_banner_images_table'
down_revision = '001_add_payout_system'
branch_labels = None
depends_on = None


def upgrade():
    # Create banner_images table
    op.create_table(
        'banner_images',
        sa.Column('id', sa.String(36), primary_key=True, default=lambda: str(uuid.uuid4())),
        sa.Column('banner_id', sa.String(36), sa.ForeignKey('banners.id', ondelete='CASCADE'), nullable=False),
        sa.Column('image_url', sa.String(500), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False, default=0),
        sa.Column('alt_text', sa.String(200), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    # Create index on banner_id for faster lookups
    op.create_index('ix_banner_images_banner_id', 'banner_images', ['banner_id'])

    # Migrate existing JSON data from banners.images to banner_images table
    connection = op.get_bind()

    # Get all banners with images
    result = connection.execute(sa.text("SELECT id, images FROM banners WHERE images IS NOT NULL"))
    banners = result.fetchall()

    for banner in banners:
        banner_id = banner[0]
        images_json = banner[1]

        if images_json:
            try:
                # Parse JSON
                image_urls = json.loads(images_json)
                if isinstance(image_urls, list):
                    # Insert each image as a separate row
                    for idx, url in enumerate(image_urls[:10]):  # Max 10 images
                        connection.execute(
                            sa.text(
                                "INSERT INTO banner_images (id, banner_id, image_url, sort_order, created_at) "
                                "VALUES (:id, :banner_id, :image_url, :sort_order, CURRENT_TIMESTAMP)"
                            ),
                            {
                                "id": str(uuid.uuid4()),
                                "banner_id": banner_id,
                                "image_url": url,
                                "sort_order": idx
                            }
                        )
            except (json.JSONDecodeError, TypeError):
                # Skip invalid JSON
                pass

    # Note: Keep the banners.images column for backward compatibility
    # It can be removed in a future migration once all clients are updated


def downgrade():
    # Drop index
    op.drop_index('ix_banner_images_banner_id', table_name='banner_images')

    # Drop table
    op.drop_table('banner_images')
