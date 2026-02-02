"""
Tests for search endpoints: /api/v1/search/*
"""

import pytest
from httpx import AsyncClient

API = "/api/v1/search"


# ---------------------------------------------------------------------------
# Global search
# ---------------------------------------------------------------------------

class TestGlobalSearch:

    @pytest.mark.asyncio
    async def test_search_returns_results(self, client: AsyncClient, sample_products):
        resp = await client.get(API, params={"q": "Test"})
        assert resp.status_code == 200
        data = resp.json()
        assert "products" in data
        assert "categories" in data
        assert "vendors" in data
        assert data["query"] == "Test"
        assert data["total_results"] >= 1

    @pytest.mark.asyncio
    async def test_search_by_product_name(self, client: AsyncClient, sample_products):
        resp = await client.get(API, params={"q": "Product 1"})
        assert resp.status_code == 200
        products = resp.json()["products"]
        assert any("Product 1" in p["name"] for p in products)

    @pytest.mark.asyncio
    async def test_search_no_results(self, client: AsyncClient, sample_products):
        resp = await client.get(API, params={"q": "zzzznonexistent"})
        assert resp.status_code == 200
        assert resp.json()["total_results"] == 0

    @pytest.mark.asyncio
    async def test_search_missing_query(self, client: AsyncClient):
        resp = await client.get(API)
        assert resp.status_code == 422  # q is required

    @pytest.mark.asyncio
    async def test_search_empty_query(self, client: AsyncClient):
        resp = await client.get(API, params={"q": ""})
        assert resp.status_code == 422  # min_length=1

    @pytest.mark.asyncio
    async def test_search_with_limit(self, client: AsyncClient, sample_products):
        resp = await client.get(API, params={"q": "Test", "limit": 1})
        assert resp.status_code == 200
        assert len(resp.json()["products"]) <= 1

    @pytest.mark.asyncio
    async def test_search_finds_categories(self, client: AsyncClient, sample_products, sample_category):
        resp = await client.get(API, params={"q": "Electronics"})
        assert resp.status_code == 200
        assert len(resp.json()["categories"]) >= 1


# ---------------------------------------------------------------------------
# Product search with filters
# ---------------------------------------------------------------------------

class TestProductSearch:

    @pytest.mark.asyncio
    async def test_product_search_basic(self, client: AsyncClient, sample_products):
        resp = await client.get(f"{API}/products", params={"q": "Test"})
        assert resp.status_code == 200
        data = resp.json()
        assert "products" in data
        assert "total" in data
        assert "page" in data
        assert data["total"] >= 1

    @pytest.mark.asyncio
    async def test_product_search_no_query(self, client: AsyncClient, sample_products):
        # Should return all active products
        resp = await client.get(f"{API}/products")
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    @pytest.mark.asyncio
    async def test_product_search_price_filter(self, client: AsyncClient, sample_products):
        resp = await client.get(f"{API}/products", params={"min_price": 20, "max_price": 25})
        assert resp.status_code == 200
        for p in resp.json()["products"]:
            assert float(p["price"]) >= 20
            assert float(p["price"]) <= 25

    @pytest.mark.asyncio
    async def test_product_search_sort_price_asc(self, client: AsyncClient, sample_products):
        resp = await client.get(f"{API}/products", params={"sort": "price_asc"})
        assert resp.status_code == 200
        prices = [float(p["price"]) for p in resp.json()["products"]]
        assert prices == sorted(prices)

    @pytest.mark.asyncio
    async def test_product_search_sort_price_desc(self, client: AsyncClient, sample_products):
        resp = await client.get(f"{API}/products", params={"sort": "price_desc"})
        assert resp.status_code == 200
        prices = [float(p["price"]) for p in resp.json()["products"]]
        assert prices == sorted(prices, reverse=True)

    @pytest.mark.asyncio
    async def test_product_search_pagination(self, client: AsyncClient, sample_products):
        resp = await client.get(f"{API}/products", params={"page": 1, "page_size": 2})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["products"]) <= 2
        assert data["total_pages"] >= 1

    @pytest.mark.asyncio
    async def test_product_search_by_category(self, client: AsyncClient, sample_products, sample_category):
        resp = await client.get(f"{API}/products", params={"category": "electronics"})
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1


# ---------------------------------------------------------------------------
# Autocomplete
# ---------------------------------------------------------------------------

class TestAutocomplete:

    @pytest.mark.asyncio
    async def test_autocomplete_returns_suggestions(self, client: AsyncClient, sample_products):
        resp = await client.get(f"{API}/autocomplete", params={"q": "Test"})
        assert resp.status_code == 200
        data = resp.json()
        assert "suggestions" in data
        assert len(data["suggestions"]) >= 1

    @pytest.mark.asyncio
    async def test_autocomplete_no_match(self, client: AsyncClient, sample_products):
        resp = await client.get(f"{API}/autocomplete", params={"q": "zzznonexistent"})
        assert resp.status_code == 200
        assert len(resp.json()["suggestions"]) == 0

    @pytest.mark.asyncio
    async def test_autocomplete_missing_query(self, client: AsyncClient):
        resp = await client.get(f"{API}/autocomplete")
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_autocomplete_with_limit(self, client: AsyncClient, sample_products):
        resp = await client.get(f"{API}/autocomplete", params={"q": "Test", "limit": 1})
        assert resp.status_code == 200
        assert len(resp.json()["suggestions"]) <= 1


# ---------------------------------------------------------------------------
# Trending
# ---------------------------------------------------------------------------

class TestTrending:

    @pytest.mark.asyncio
    async def test_trending_searches(self, client: AsyncClient, sample_products, sample_category):
        resp = await client.get(f"{API}/trending")
        assert resp.status_code == 200
        data = resp.json()
        assert "trending" in data
        assert "popular_categories" in data
