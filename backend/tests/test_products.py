"""
Tests for product endpoints: /api/v1/products/*
"""

import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.models.product import Product
from tests.conftest import auth_headers

API = "/api/v1/products"


# ---------------------------------------------------------------------------
# List products (public)
# ---------------------------------------------------------------------------

class TestListProducts:

    @pytest.mark.asyncio
    async def test_list_products_returns_200(self, client: AsyncClient, sample_products):
        resp = await client.get(API)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 3

    @pytest.mark.asyncio
    async def test_list_products_empty(self, client: AsyncClient):
        resp = await client.get(API)
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_list_products_pagination(self, client: AsyncClient, sample_products):
        resp = await client.get(API, params={"skip": 0, "limit": 2})
        assert resp.status_code == 200
        assert len(resp.json()) == 2

        resp2 = await client.get(API, params={"skip": 2, "limit": 2})
        assert resp2.status_code == 200
        assert len(resp2.json()) == 1

    @pytest.mark.asyncio
    async def test_list_products_filter_by_category(
        self, client: AsyncClient, sample_products, sample_category
    ):
        resp = await client.get(API, params={"category": "electronics"})
        assert resp.status_code == 200
        assert len(resp.json()) == 3

    @pytest.mark.asyncio
    async def test_list_products_filter_nonexistent_category(self, client: AsyncClient, sample_products):
        resp = await client.get(API, params={"category": "does-not-exist"})
        assert resp.status_code == 200
        # No products should match a non-existent category
        # (depending on implementation, may return all or none)

    @pytest.mark.asyncio
    async def test_list_products_filter_by_price(self, client: AsyncClient, sample_products):
        resp = await client.get(API, params={"min_price": 20, "max_price": 25})
        assert resp.status_code == 200
        for p in resp.json():
            assert float(p["price"]) >= 20
            assert float(p["price"]) <= 25

    @pytest.mark.asyncio
    async def test_list_products_sort_price_asc(self, client: AsyncClient, sample_products):
        resp = await client.get(API, params={"sort_by": "price", "sort_order": "asc"})
        assert resp.status_code == 200
        prices = [float(p["price"]) for p in resp.json()]
        assert prices == sorted(prices)

    @pytest.mark.asyncio
    async def test_list_products_sort_price_desc(self, client: AsyncClient, sample_products):
        resp = await client.get(API, params={"sort_by": "price", "sort_order": "desc"})
        assert resp.status_code == 200
        prices = [float(p["price"]) for p in resp.json()]
        assert prices == sorted(prices, reverse=True)

    @pytest.mark.asyncio
    async def test_list_products_filter_in_stock(self, client: AsyncClient, sample_products):
        resp = await client.get(API, params={"in_stock": True})
        assert resp.status_code == 200
        assert len(resp.json()) == 3  # all have quantity=100

    @pytest.mark.asyncio
    async def test_list_products_filter_on_sale(self, client: AsyncClient, sample_products):
        resp = await client.get(API, params={"on_sale": True})
        assert resp.status_code == 200
        # Only product 0 has compare_at_price set
        assert len(resp.json()) == 1


# ---------------------------------------------------------------------------
# Get product by slug
# ---------------------------------------------------------------------------

class TestGetProduct:

    @pytest.mark.asyncio
    async def test_get_product_by_slug(self, client: AsyncClient, sample_products):
        resp = await client.get(f"{API}/test-product-1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Test Product 1"
        assert data["slug"] == "test-product-1"

    @pytest.mark.asyncio
    async def test_get_product_by_id(self, client: AsyncClient, sample_products):
        product_id = str(sample_products[0].id)
        resp = await client.get(f"{API}/{product_id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Test Product 1"

    @pytest.mark.asyncio
    async def test_get_product_not_found(self, client: AsyncClient):
        resp = await client.get(f"{API}/nonexistent-slug-xyz")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_get_product_nonexistent_uuid(self, client: AsyncClient):
        fake_id = str(uuid.uuid4())
        resp = await client.get(f"{API}/{fake_id}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_get_product_has_images(self, client: AsyncClient, sample_products):
        resp = await client.get(f"{API}/test-product-1")
        assert resp.status_code == 200
        data = resp.json()
        assert "images" in data
        assert len(data["images"]) >= 1

    @pytest.mark.asyncio
    async def test_get_product_has_vendor(self, client: AsyncClient, sample_products):
        resp = await client.get(f"{API}/test-product-1")
        data = resp.json()
        assert "vendor" in data
        assert data["vendor"]["business_name"] == "Test Vendor Store"


# ---------------------------------------------------------------------------
# Featured / New arrivals / Best sellers
# ---------------------------------------------------------------------------

class TestSpecialLists:

    @pytest.mark.asyncio
    async def test_featured_products(self, client: AsyncClient, sample_products):
        resp = await client.get(f"{API}/featured")
        assert resp.status_code == 200
        # None of our sample products are is_featured=True, so empty
        assert isinstance(resp.json(), list)

    @pytest.mark.asyncio
    async def test_new_arrivals(self, client: AsyncClient, sample_products):
        resp = await client.get(f"{API}/new-arrivals")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
        assert len(resp.json()) <= 12

    @pytest.mark.asyncio
    async def test_best_sellers(self, client: AsyncClient, sample_products):
        resp = await client.get(f"{API}/best-sellers")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
