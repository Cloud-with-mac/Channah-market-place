# FTS5 Full-Text Search - Quick Start Guide

## Setup (Automatic)

FTS5 is automatically initialized when you start the FastAPI application:

```bash
# Start the application
cd backend
python -m uvicorn app.main:app --reload

# FTS5 will automatically:
# 1. Create FTS5 virtual table
# 2. Set up synchronization triggers
# 3. Index existing products
```

You should see logs like:
```
INFO:     Starting up MarketHub API...
INFO:     Database initialized
INFO:     Initializing FTS5 full-text search...
INFO:     Created FTS5 virtual table 'product_fts'
INFO:     FTS5 table populated with 123 products
```

## Basic Usage

### 1. Search Products

```bash
# Simple search
curl "http://localhost:8000/api/v1/search/?q=laptop"

# Search with filters
curl "http://localhost:8000/api/v1/search/products?q=laptop&category=electronics&min_price=500&max_price=2000"
```

### 2. Autocomplete

```bash
curl "http://localhost:8000/api/v1/search/autocomplete?q=lap"
```

Response:
```json
{
  "suggestions": ["Laptop", "Laptop Stand", "Laptop Bag"],
  "categories": ["Laptops", "Laptop Accessories"],
  "did_you_mean": null
}
```

### 3. Trending Searches

```bash
curl "http://localhost:8000/api/v1/search/trending"
```

### 4. Search Analytics (Admin)

```bash
# Popular searches
curl "http://localhost:8000/api/v1/search/analytics/popular" \
  -H "Authorization: Bearer <admin-token>"

# Zero-result queries
curl "http://localhost:8000/api/v1/search/analytics/zero-results" \
  -H "Authorization: Bearer <admin-token>"
```

## Admin Management

### Check FTS5 Status

```bash
curl "http://localhost:8000/api/v1/admin/fts5/status" \
  -H "Authorization: Bearer <admin-token>"
```

Response:
```json
{
  "status": "active",
  "exists": true,
  "statistics": {
    "total_products": 5432,
    "index_size_bytes": 1048576,
    "status": "active"
  }
}
```

### Rebuild Index

After bulk product imports:

```bash
curl -X POST "http://localhost:8000/api/v1/admin/fts5/rebuild" \
  -H "Authorization: Bearer <admin-token>"
```

### Optimize Index

For better performance (run weekly):

```bash
curl -X POST "http://localhost:8000/api/v1/admin/fts5/optimize" \
  -H "Authorization: Bearer <admin-token>"
```

## Search Query Syntax

### Simple Search
```
laptop
```

### Phrase Search
```
"gaming laptop"
```

### Prefix Search (Autocomplete)
```
lap*
```

### Boolean AND
```
laptop AND gaming
```

### Boolean OR
```
laptop OR computer
```

### Boolean NOT
```
laptop NOT refurbished
```

### Combined
```
"gaming laptop" OR "high performance computer" -refurbished
```

## Testing

Run the test suite:

```bash
cd backend
python test_fts5.py
```

Expected output:
```
============================================================
FTS5 Full-Text Search Test Suite
============================================================

Testing FTS5 Setup
============================================================
1. Initializing database...
   ✓ Database initialized
2. Checking FTS5 table...
   FTS5 table exists: True
   ✓ FTS5 table already exists
...
============================================================
✓ ALL TESTS PASSED
============================================================
```

## Integration Examples

### Python Code

```python
from app.services.search import SearchService
from app.core.database import AsyncSessionLocal

async def search_example():
    async with AsyncSessionLocal() as db:
        search_service = SearchService(db)

        # Search products
        results, total = await search_service.search_products(
            query="laptop",
            limit=10
        )

        for result in results:
            print(f"{result['name']} - Rank: {result.get('rank', 'N/A')}")

        # Get suggestions
        suggestions = await search_service.get_suggestions("lap", limit=5)
        print(f"Suggestions: {suggestions}")
```

### Frontend Integration

```javascript
// Search products
async function searchProducts(query) {
  const response = await fetch(
    `http://localhost:8000/api/v1/search/products?q=${encodeURIComponent(query)}`
  );
  const data = await response.json();
  return data;
}

// Autocomplete
async function autocomplete(query) {
  const response = await fetch(
    `http://localhost:8000/api/v1/search/autocomplete?q=${encodeURIComponent(query)}`
  );
  const data = await response.json();
  return data.suggestions;
}

// Usage
const results = await searchProducts("laptop");
const suggestions = await autocomplete("lap");
```

## Common Issues

### Issue: Search not using FTS5

**Check**: Is FTS5 available?
```bash
curl "http://localhost:8000/api/v1/admin/fts5/status"
```

**Solution**: If not initialized, start the application or manually initialize:
```bash
curl -X POST "http://localhost:8000/api/v1/admin/fts5/initialize"
```

### Issue: No search results

**Check**: Is data indexed?
```bash
curl "http://localhost:8000/api/v1/admin/fts5/status"
```

**Solution**: Repopulate the index:
```bash
curl -X POST "http://localhost:8000/api/v1/admin/fts5/repopulate"
```

### Issue: Slow searches

**Solution**: Optimize the index:
```bash
curl -X POST "http://localhost:8000/api/v1/admin/fts5/optimize"
```

## Performance Tips

1. **Pagination**: Always use pagination for large result sets
   ```
   ?q=laptop&page=1&page_size=20
   ```

2. **Filters**: Use filters to narrow results
   ```
   ?q=laptop&category=electronics&in_stock=true
   ```

3. **Optimize regularly**: Run optimization weekly
   ```bash
   curl -X POST ".../admin/fts5/optimize"
   ```

4. **Monitor analytics**: Check for slow queries
   ```bash
   curl ".../search/analytics/popular"
   ```

## Features Summary

✅ **BM25 Ranking** - Industry-standard relevance ranking
✅ **Phrase Queries** - Exact phrase matching with quotes
✅ **Prefix Matching** - Fast autocomplete with wildcards
✅ **Highlighting** - Automatic result highlighting
✅ **Auto-sync** - Triggers keep index synchronized
✅ **Analytics** - Track popular and zero-result queries
✅ **Fallback** - LIKE queries if FTS5 unavailable
✅ **Admin Tools** - Full management interface

## API Endpoints Summary

### Public Endpoints
- `GET /api/v1/search/` - Global search
- `GET /api/v1/search/products` - Product search with filters
- `GET /api/v1/search/autocomplete` - Autocomplete suggestions
- `GET /api/v1/search/trending` - Trending searches
- `GET /api/v1/search/analytics/popular` - Popular searches
- `GET /api/v1/search/analytics/zero-results` - Zero-result queries

### Admin Endpoints (Auth Required)
- `GET /api/v1/admin/fts5/status` - FTS5 status
- `POST /api/v1/admin/fts5/initialize` - Initialize FTS5
- `POST /api/v1/admin/fts5/rebuild` - Rebuild index
- `POST /api/v1/admin/fts5/optimize` - Optimize index
- `POST /api/v1/admin/fts5/repopulate` - Repopulate data

## Documentation

For more details, see:
- **`FTS5_IMPLEMENTATION.md`** - Complete implementation guide
- **`FTS5_FILES_SUMMARY.md`** - File structure and changes
- **`test_fts5.py`** - Test suite

## Support

For issues or questions:
1. Check the troubleshooting section in `FTS5_IMPLEMENTATION.md`
2. Run the test suite: `python test_fts5.py`
3. Check server logs for errors
4. Verify FTS5 status via admin endpoint

---

**That's it!** FTS5 full-text search is now ready to use. 🚀
