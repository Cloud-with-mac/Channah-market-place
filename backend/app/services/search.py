"""
Search service with FTS5 full-text search support

Provides advanced search functionality using SQLite FTS5 including:
- BM25 relevance ranking
- Phrase queries
- Prefix matching
- Highlighting of matching terms
- Spell correction suggestions
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select, or_
from sqlalchemy.orm import selectinload
from typing import List, Dict, Optional, Tuple
import re
import logging

from app.models.product import Product, ProductStatus
from app.models.category import Category

logger = logging.getLogger(__name__)


class SearchService:
    """Service for full-text search operations"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self._fts5_available = None

    async def is_fts5_available(self) -> bool:
        """Check if FTS5 table is available"""
        if self._fts5_available is not None:
            return self._fts5_available

        try:
            result = await self.db.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='product_fts'"
            ))
            self._fts5_available = result.scalar() is not None
            return self._fts5_available
        except Exception:
            self._fts5_available = False
            return False

    def prepare_fts5_query(self, query: str) -> str:
        """
        Prepare query for FTS5 search.

        Handles:
        - Phrase queries (words in quotes)
        - Prefix matching (words ending with *)
        - Boolean operators (AND, OR, NOT)

        Args:
            query: User's search query

        Returns:
            FTS5-formatted query string
        """
        if not query:
            return ""

        # Remove special characters that might break FTS5
        query = re.sub(r'[^\w\s\*"+-]', ' ', query)

        # Handle phrase queries (text in quotes)
        parts = []
        in_phrase = False
        current = []

        for char in query:
            if char == '"':
                if in_phrase and current:
                    parts.append(f'"{" ".join(current)}"')
                    current = []
                in_phrase = not in_phrase
            elif char.isspace():
                if current:
                    word = ''.join(current)
                    if not in_phrase:
                        # Add prefix matching for non-phrase terms
                        if not word.endswith('*'):
                            word = f'{word}*'
                    parts.append(word)
                    current = []
            else:
                current.append(char)

        if current:
            word = ''.join(current)
            if not in_phrase and not word.endswith('*'):
                word = f'{word}*'
            parts.append(word)

        # Join with OR for broader results
        return ' OR '.join(parts) if parts else query

    async def search_products_fts5(
        self,
        query: str,
        limit: int = 20,
        offset: int = 0,
        min_rank: float = -10.0
    ) -> Tuple[List[Dict], int]:
        """
        Search products using FTS5 with BM25 ranking.

        Args:
            query: Search query
            limit: Maximum results to return
            offset: Number of results to skip
            min_rank: Minimum BM25 rank score (more negative = less relevant)

        Returns:
            Tuple of (results list, total count)
        """
        try:
            fts5_query = self.prepare_fts5_query(query)

            # Search with BM25 ranking
            search_sql = text("""
                SELECT
                    p.id,
                    p.name,
                    p.slug,
                    p.price,
                    p.compare_at_price,
                    p.currency,
                    p.quantity,
                    p.rating,
                    p.review_count,
                    bm25(pf.product_fts) as rank,
                    snippet(pf.product_fts, 0, '<mark>', '</mark>', '...', 32) as name_snippet,
                    snippet(pf.product_fts, 1, '<mark>', '</mark>', '...', 64) as description_snippet
                FROM product_fts pf
                JOIN products p ON p.id = pf.product_id
                WHERE pf.product_fts MATCH :query
                    AND p.status = 'active'
                    AND bm25(pf.product_fts) > :min_rank
                ORDER BY rank
                LIMIT :limit OFFSET :offset
            """)

            result = await self.db.execute(
                search_sql,
                {"query": fts5_query, "limit": limit, "offset": offset, "min_rank": min_rank}
            )
            rows = result.all()

            # Get total count
            count_sql = text("""
                SELECT COUNT(*)
                FROM product_fts pf
                JOIN products p ON p.id = pf.product_id
                WHERE pf.product_fts MATCH :query
                    AND p.status = 'active'
                    AND bm25(pf.product_fts) > :min_rank
            """)
            count_result = await self.db.execute(
                count_sql,
                {"query": fts5_query, "min_rank": min_rank}
            )
            total = count_result.scalar() or 0

            # Format results
            results = []
            for row in rows:
                results.append({
                    "id": str(row[0]),
                    "name": row[1],
                    "slug": row[2],
                    "price": float(row[3]),
                    "compare_at_price": float(row[4]) if row[4] else None,
                    "currency": row[5],
                    "in_stock": row[6] > 0,
                    "rating": row[7],
                    "review_count": row[8],
                    "rank": row[9],
                    "name_highlight": row[10],
                    "description_highlight": row[11]
                })

            return results, total

        except Exception as e:
            logger.error(f"FTS5 search failed: {e}")
            raise

    async def search_products_like(
        self,
        query: str,
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[List[Dict], int]:
        """
        Fallback search using LIKE operator.

        Args:
            query: Search query
            limit: Maximum results to return
            offset: Number of results to skip

        Returns:
            Tuple of (results list, total count)
        """
        search_term = f"%{query}%"

        # Build query
        stmt = select(Product).where(
            Product.status == ProductStatus.ACTIVE,
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
                Product.short_description.ilike(search_term)
            )
        ).options(
            selectinload(Product.images),
            selectinload(Product.category)
        ).order_by(
            Product.rating.desc(),
            Product.sales_count.desc()
        )

        # Get total count
        from sqlalchemy import func, select as sql_select
        count_stmt = sql_select(func.count()).select_from(
            select(Product.id).where(
                Product.status == ProductStatus.ACTIVE,
                or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term),
                    Product.short_description.ilike(search_term)
                )
            ).subquery()
        )
        count_result = await self.db.execute(count_stmt)
        total = count_result.scalar() or 0

        # Get results
        stmt = stmt.offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        products = result.scalars().all()

        # Format results
        results = []
        for p in products:
            results.append({
                "id": str(p.id),
                "name": p.name,
                "slug": p.slug,
                "price": float(p.price),
                "compare_at_price": float(p.compare_at_price) if p.compare_at_price else None,
                "currency": p.currency,
                "in_stock": p.quantity > 0,
                "rating": p.rating,
                "review_count": p.review_count,
                "image": p.images[0].url if p.images else None,
                "category_name": p.category.name if p.category else None
            })

        return results, total

    async def search_products(
        self,
        query: str,
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[List[Dict], int]:
        """
        Search products using FTS5 if available, otherwise fall back to LIKE.

        Args:
            query: Search query
            limit: Maximum results to return
            offset: Number of results to skip

        Returns:
            Tuple of (results list, total count)
        """
        if await self.is_fts5_available():
            try:
                return await self.search_products_fts5(query, limit, offset)
            except Exception as e:
                logger.warning(f"FTS5 search failed, falling back to LIKE: {e}")
                return await self.search_products_like(query, limit, offset)
        else:
            return await self.search_products_like(query, limit, offset)

    async def get_suggestions(self, query: str, limit: int = 5) -> List[str]:
        """
        Get search suggestions based on FTS5 matching.

        Args:
            query: Partial search query
            limit: Maximum suggestions to return

        Returns:
            List of suggested search terms
        """
        try:
            if not await self.is_fts5_available():
                return await self._get_suggestions_like(query, limit)

            # Use FTS5 prefix matching for suggestions
            fts5_query = f"{query}*"

            sql = text("""
                SELECT DISTINCT p.name
                FROM product_fts pf
                JOIN products p ON p.id = pf.product_id
                WHERE pf.product_fts MATCH :query
                    AND p.status = 'active'
                ORDER BY p.sales_count DESC, p.rating DESC
                LIMIT :limit
            """)

            result = await self.db.execute(sql, {"query": fts5_query, "limit": limit})
            suggestions = [row[0] for row in result.all()]

            return suggestions

        except Exception as e:
            logger.error(f"Failed to get suggestions: {e}")
            return []

    async def _get_suggestions_like(self, query: str, limit: int = 5) -> List[str]:
        """Fallback suggestions using LIKE"""
        search_term = f"{query}%"

        stmt = select(Product.name).where(
            Product.status == ProductStatus.ACTIVE,
            Product.name.ilike(search_term)
        ).order_by(
            Product.sales_count.desc(),
            Product.rating.desc()
        ).limit(limit).distinct()

        result = await self.db.execute(stmt)
        return [row[0] for row in result.all()]

    async def get_did_you_mean(self, query: str) -> Optional[str]:
        """
        Suggest alternative query for typos using simple edit distance.

        This is a basic implementation. For production, consider using
        a proper spell checker library like pyspellchecker or SymSpell.

        Args:
            query: Search query

        Returns:
            Suggested alternative query or None
        """
        try:
            # Get popular product names and category names
            sql = text("""
                SELECT DISTINCT name
                FROM (
                    SELECT name FROM products
                    WHERE status = 'active'
                    ORDER BY sales_count DESC, rating DESC
                    LIMIT 100
                    UNION
                    SELECT name FROM categories
                    WHERE is_active = 1
                )
            """)

            result = await self.db.execute(sql)
            candidates = [row[0].lower() for row in result.all()]

            # Simple word-by-word matching
            query_words = query.lower().split()
            suggestion_words = []

            for word in query_words:
                # Find closest match using simple character overlap
                best_match = word
                best_score = 0

                for candidate in candidates:
                    for candidate_word in candidate.split():
                        if len(candidate_word) < 3:
                            continue

                        # Calculate similarity (very simple approach)
                        if candidate_word == word:
                            best_match = word
                            best_score = 100
                            break

                        # Check if word is prefix
                        if candidate_word.startswith(word) or word.startswith(candidate_word):
                            score = 50
                            if score > best_score:
                                best_match = candidate_word
                                best_score = score

                suggestion_words.append(best_match)

            suggestion = ' '.join(suggestion_words)

            # Only return if different from original
            if suggestion != query.lower() and best_score > 0:
                return suggestion

            return None

        except Exception as e:
            logger.error(f"Failed to get 'did you mean' suggestion: {e}")
            return None

    async def get_popular_searches(self, limit: int = 10) -> List[Dict]:
        """
        Get popular search terms from search_queries table.

        Args:
            limit: Maximum results to return

        Returns:
            List of popular search terms with counts
        """
        try:
            sql = text("""
                SELECT
                    query,
                    COUNT(*) as search_count,
                    AVG(results_count) as avg_results,
                    SUM(clicked) as total_clicks
                FROM search_queries
                WHERE created_at >= datetime('now', '-7 days')
                    AND results_count > 0
                GROUP BY query
                ORDER BY search_count DESC
                LIMIT :limit
            """)

            result = await self.db.execute(sql, {"limit": limit})
            rows = result.all()

            return [
                {
                    "query": row[0],
                    "search_count": row[1],
                    "avg_results": int(row[2]),
                    "click_rate": row[3] / row[1] if row[1] > 0 else 0
                }
                for row in rows
            ]

        except Exception as e:
            logger.error(f"Failed to get popular searches: {e}")
            return []

    async def get_zero_result_queries(self, limit: int = 20) -> List[Dict]:
        """
        Get search queries that returned zero results.

        Useful for improving the product catalog or search algorithm.

        Args:
            limit: Maximum results to return

        Returns:
            List of zero-result queries
        """
        try:
            sql = text("""
                SELECT
                    query,
                    COUNT(*) as search_count,
                    MAX(created_at) as last_searched
                FROM search_queries
                WHERE results_count = 0
                    AND created_at >= datetime('now', '-30 days')
                GROUP BY query
                ORDER BY search_count DESC
                LIMIT :limit
            """)

            result = await self.db.execute(sql, {"limit": limit})
            rows = result.all()

            return [
                {
                    "query": row[0],
                    "search_count": row[1],
                    "last_searched": row[2]
                }
                for row in rows
            ]

        except Exception as e:
            logger.error(f"Failed to get zero-result queries: {e}")
            return []
