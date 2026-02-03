"""Input sanitization utilities to prevent XSS and injection attacks."""
import re
import html


def sanitize_html(text: str | None) -> str | None:
    """Strip HTML tags and escape special characters to prevent XSS."""
    if text is None:
        return None
    # Remove HTML tags
    clean = re.sub(r'<[^>]+>', '', text)
    # Escape remaining HTML entities
    clean = html.escape(clean)
    return clean.strip()


def sanitize_search_query(query: str | None) -> str | None:
    """Sanitize search input — strip tags and limit length."""
    if query is None:
        return None
    query = sanitize_html(query)
    # Limit search query length
    return query[:500] if query else None