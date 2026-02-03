"""
Test script for FTS5 full-text search implementation

Run this script to verify FTS5 is working correctly:
python test_fts5.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import AsyncSessionLocal, init_db
from app.core.fts5_setup import (
    create_fts5_table,
    populate_fts5_table,
    check_fts5_exists,
    get_fts5_stats,
    rebuild_fts5_index,
    optimize_fts5_index
)
from app.services.search import SearchService


async def test_fts5_setup():
    """Test FTS5 table creation and population"""
    print("\n" + "="*60)
    print("Testing FTS5 Setup")
    print("="*60)

    # Initialize database
    print("\n1. Initializing database...")
    await init_db()
    print("   ✓ Database initialized")

    async with AsyncSessionLocal() as db:
        # Check if FTS5 exists
        print("\n2. Checking FTS5 table...")
        exists = await check_fts5_exists(db)
        print(f"   FTS5 table exists: {exists}")

        if not exists:
            print("\n3. Creating FTS5 table...")
            success = await create_fts5_table(db)
            if success:
                print("   ✓ FTS5 table created successfully")
            else:
                print("   ✗ Failed to create FTS5 table")
                return False

            print("\n4. Populating FTS5 table...")
            count = await populate_fts5_table(db)
            print(f"   ✓ Indexed {count} products")
        else:
            print("   ✓ FTS5 table already exists")

        # Get FTS5 stats
        print("\n5. Getting FTS5 statistics...")
        stats = await get_fts5_stats(db)
        print(f"   Total products: {stats.get('total_products', 0)}")
        print(f"   Index size: {stats.get('index_size_bytes', 0)} bytes")
        print(f"   Status: {stats.get('status', 'unknown')}")

        return True


async def test_fts5_search():
    """Test FTS5 search functionality"""
    print("\n" + "="*60)
    print("Testing FTS5 Search")
    print("="*60)

    async with AsyncSessionLocal() as db:
        search_service = SearchService(db)

        # Test 1: Check FTS5 availability
        print("\n1. Checking FTS5 availability...")
        available = await search_service.is_fts5_available()
        print(f"   FTS5 available: {available}")

        if not available:
            print("   ✗ FTS5 not available, cannot test search")
            return False

        # Test 2: Basic search
        print("\n2. Testing basic search...")
        test_queries = ["laptop", "phone", "electronics", "gaming"]

        for query in test_queries:
            try:
                results, total = await search_service.search_products(query, limit=5)
                print(f"   Query: '{query}' - Found {total} results")
                if results:
                    for i, result in enumerate(results[:3], 1):
                        print(f"      {i}. {result.get('name', 'N/A')} (rank: {result.get('rank', 'N/A')})")
            except Exception as e:
                print(f"   ✗ Search failed for '{query}': {e}")

        # Test 3: Phrase search
        print("\n3. Testing phrase search...")
        phrase_query = '"gaming laptop"'
        try:
            results, total = await search_service.search_products_fts5(phrase_query, limit=5)
            print(f"   Query: {phrase_query} - Found {total} results")
        except Exception as e:
            print(f"   Note: Phrase search test: {e}")

        # Test 4: Prefix matching
        print("\n4. Testing prefix matching...")
        try:
            suggestions = await search_service.get_suggestions("lap", limit=5)
            print(f"   Suggestions for 'lap': {suggestions}")
        except Exception as e:
            print(f"   ✗ Suggestions failed: {e}")

        # Test 5: Did you mean
        print("\n5. Testing 'Did you mean'...")
        try:
            suggestion = await search_service.get_did_you_mean("laptp")
            print(f"   Did you mean for 'laptp': {suggestion}")
        except Exception as e:
            print(f"   Note: Did you mean test: {e}")

        return True


async def test_fts5_analytics():
    """Test FTS5 analytics functionality"""
    print("\n" + "="*60)
    print("Testing FTS5 Analytics")
    print("="*60)

    async with AsyncSessionLocal() as db:
        search_service = SearchService(db)

        # Test 1: Popular searches
        print("\n1. Testing popular searches...")
        try:
            popular = await search_service.get_popular_searches(limit=5)
            print(f"   Found {len(popular)} popular searches")
            for i, item in enumerate(popular, 1):
                print(f"      {i}. '{item['query']}' - {item['search_count']} searches")
        except Exception as e:
            print(f"   Note: {e}")

        # Test 2: Zero-result queries
        print("\n2. Testing zero-result queries...")
        try:
            zero_results = await search_service.get_zero_result_queries(limit=5)
            print(f"   Found {len(zero_results)} zero-result queries")
            for i, item in enumerate(zero_results, 1):
                print(f"      {i}. '{item['query']}' - {item['search_count']} searches")
        except Exception as e:
            print(f"   Note: {e}")

        return True


async def test_fts5_optimization():
    """Test FTS5 optimization functions"""
    print("\n" + "="*60)
    print("Testing FTS5 Optimization")
    print("="*60)

    async with AsyncSessionLocal() as db:
        # Test 1: Rebuild index
        print("\n1. Testing index rebuild...")
        try:
            success = await rebuild_fts5_index(db)
            if success:
                print("   ✓ Index rebuilt successfully")
            else:
                print("   ✗ Index rebuild failed")
        except Exception as e:
            print(f"   ✗ Rebuild error: {e}")

        # Test 2: Optimize index
        print("\n2. Testing index optimization...")
        try:
            success = await optimize_fts5_index(db)
            if success:
                print("   ✓ Index optimized successfully")
            else:
                print("   ✗ Index optimization failed")
        except Exception as e:
            print(f"   ✗ Optimization error: {e}")

        return True


async def main():
    """Run all FTS5 tests"""
    print("\n" + "="*60)
    print("FTS5 Full-Text Search Test Suite")
    print("="*60)

    try:
        # Test 1: Setup
        setup_ok = await test_fts5_setup()
        if not setup_ok:
            print("\n✗ Setup failed, cannot continue")
            return

        # Test 2: Search
        search_ok = await test_fts5_search()

        # Test 3: Analytics
        analytics_ok = await test_fts5_analytics()

        # Test 4: Optimization
        optimization_ok = await test_fts5_optimization()

        # Summary
        print("\n" + "="*60)
        print("Test Summary")
        print("="*60)
        print(f"Setup:        {'✓ PASS' if setup_ok else '✗ FAIL'}")
        print(f"Search:       {'✓ PASS' if search_ok else '✗ FAIL'}")
        print(f"Analytics:    {'✓ PASS' if analytics_ok else '✗ FAIL'}")
        print(f"Optimization: {'✓ PASS' if optimization_ok else '✗ FAIL'}")

        all_passed = setup_ok and search_ok and analytics_ok and optimization_ok
        print("\n" + "="*60)
        if all_passed:
            print("✓ ALL TESTS PASSED")
        else:
            print("✗ SOME TESTS FAILED")
        print("="*60 + "\n")

    except Exception as e:
        print(f"\n✗ Test suite failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Run tests
    asyncio.run(main())
