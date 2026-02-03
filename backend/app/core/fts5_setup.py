"""
SQLite FTS5 Full-Text Search Setup

This module handles the creation and management of FTS5 virtual tables for full-text search.
FTS5 provides advanced search capabilities including:
- Relevance ranking (BM25)
- Phrase queries
- Prefix matching
- Token matching
"""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)


# SQL for creating FTS5 virtual table
CREATE_FTS5_TABLE = """
CREATE VIRTUAL TABLE IF NOT EXISTS product_fts USING fts5(
    name,
    description,
    tags,
    category_name,
    product_id UNINDEXED,
    tokenize='porter unicode61'
);
"""

# Trigger to sync FTS5 when product is inserted
CREATE_INSERT_TRIGGER = """
CREATE TRIGGER IF NOT EXISTS product_fts_insert
AFTER INSERT ON products
BEGIN
    INSERT INTO product_fts(product_id, name, description, tags, category_name)
    SELECT
        NEW.id,
        NEW.name,
        COALESCE(NEW.description, '') || ' ' || COALESCE(NEW.short_description, ''),
        COALESCE(NEW.tags, ''),
        COALESCE((SELECT name FROM categories WHERE id = NEW.category_id), '')
    ;
END;
"""

# Trigger to sync FTS5 when product is updated
CREATE_UPDATE_TRIGGER = """
CREATE TRIGGER IF NOT EXISTS product_fts_update
AFTER UPDATE ON products
BEGIN
    UPDATE product_fts
    SET
        name = NEW.name,
        description = COALESCE(NEW.description, '') || ' ' || COALESCE(NEW.short_description, ''),
        tags = COALESCE(NEW.tags, ''),
        category_name = COALESCE((SELECT name FROM categories WHERE id = NEW.category_id), '')
    WHERE product_id = NEW.id;
END;
"""

# Trigger to sync FTS5 when product is deleted
CREATE_DELETE_TRIGGER = """
CREATE TRIGGER IF NOT EXISTS product_fts_delete
AFTER DELETE ON products
BEGIN
    DELETE FROM product_fts WHERE product_id = OLD.id;
END;
"""

# Trigger to update FTS5 when category name changes
CREATE_CATEGORY_UPDATE_TRIGGER = """
CREATE TRIGGER IF NOT EXISTS product_fts_category_update
AFTER UPDATE OF name ON categories
BEGIN
    UPDATE product_fts
    SET category_name = NEW.name
    WHERE product_id IN (
        SELECT id FROM products WHERE category_id = NEW.id
    );
END;
"""


async def create_fts5_table(db: AsyncSession) -> bool:
    """
    Create FTS5 virtual table and triggers for automatic synchronization.

    Args:
        db: Database session

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Create FTS5 virtual table
        await db.execute(text(CREATE_FTS5_TABLE))
        logger.info("Created FTS5 virtual table 'product_fts'")

        # Create triggers for auto-sync
        await db.execute(text(CREATE_INSERT_TRIGGER))
        logger.info("Created INSERT trigger for FTS5 sync")

        await db.execute(text(CREATE_UPDATE_TRIGGER))
        logger.info("Created UPDATE trigger for FTS5 sync")

        await db.execute(text(CREATE_DELETE_TRIGGER))
        logger.info("Created DELETE trigger for FTS5 sync")

        await db.execute(text(CREATE_CATEGORY_UPDATE_TRIGGER))
        logger.info("Created CATEGORY UPDATE trigger for FTS5 sync")

        await db.commit()
        return True

    except Exception as e:
        logger.error(f"Failed to create FTS5 table: {e}")
        await db.rollback()
        return False


async def populate_fts5_table(db: AsyncSession) -> int:
    """
    Populate FTS5 table from existing products.

    Args:
        db: Database session

    Returns:
        int: Number of products indexed
    """
    try:
        # Clear existing FTS5 data
        await db.execute(text("DELETE FROM product_fts"))

        # Populate from existing products
        populate_sql = """
        INSERT INTO product_fts(product_id, name, description, tags, category_name)
        SELECT
            p.id,
            p.name,
            COALESCE(p.description, '') || ' ' || COALESCE(p.short_description, ''),
            COALESCE(p.tags, ''),
            COALESCE(c.name, '')
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'active'
        """

        await db.execute(text(populate_sql))

        # Get count of indexed products
        result = await db.execute(text("SELECT COUNT(*) FROM product_fts"))
        count = result.scalar()

        await db.commit()
        logger.info(f"Populated FTS5 table with {count} products")
        return count

    except Exception as e:
        logger.error(f"Failed to populate FTS5 table: {e}")
        await db.rollback()
        return 0


async def check_fts5_exists(db: AsyncSession) -> bool:
    """
    Check if FTS5 table exists.

    Args:
        db: Database session

    Returns:
        bool: True if FTS5 table exists
    """
    try:
        result = await db.execute(text(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='product_fts'"
        ))
        return result.scalar() is not None
    except Exception:
        return False


async def rebuild_fts5_index(db: AsyncSession) -> bool:
    """
    Rebuild FTS5 index for optimization.

    Args:
        db: Database session

    Returns:
        bool: True if successful
    """
    try:
        await db.execute(text("INSERT INTO product_fts(product_fts) VALUES('rebuild')"))
        await db.commit()
        logger.info("Rebuilt FTS5 index")
        return True
    except Exception as e:
        logger.error(f"Failed to rebuild FTS5 index: {e}")
        await db.rollback()
        return False


async def optimize_fts5_index(db: AsyncSession) -> bool:
    """
    Optimize FTS5 index to improve performance.

    Args:
        db: Database session

    Returns:
        bool: True if successful
    """
    try:
        await db.execute(text("INSERT INTO product_fts(product_fts) VALUES('optimize')"))
        await db.commit()
        logger.info("Optimized FTS5 index")
        return True
    except Exception as e:
        logger.error(f"Failed to optimize FTS5 index: {e}")
        await db.rollback()
        return False


async def get_fts5_stats(db: AsyncSession) -> dict:
    """
    Get FTS5 statistics.

    Args:
        db: Database session

    Returns:
        dict: Statistics about the FTS5 index
    """
    try:
        # Get total indexed products
        result = await db.execute(text("SELECT COUNT(*) FROM product_fts"))
        total = result.scalar()

        # Get FTS5 table size (in pages)
        result = await db.execute(text(
            "SELECT page_count * page_size as size FROM pragma_page_count('product_fts'), pragma_page_size()"
        ))
        size_info = result.first()

        return {
            "total_products": total,
            "index_size_bytes": size_info[0] if size_info else 0,
            "status": "active"
        }
    except Exception as e:
        logger.error(f"Failed to get FTS5 stats: {e}")
        return {"status": "error", "error": str(e)}
