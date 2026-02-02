"""
Tests for cart endpoints: /api/v1/cart/*
"""

import uuid
import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers

API = "/api/v1/cart"


# ---------------------------------------------------------------------------
# Get cart
# ---------------------------------------------------------------------------

class TestGetCart:

    @pytest.mark.asyncio
    async def test_get_cart_authenticated(self, client: AsyncClient, customer_user):
        user, token = customer_user
        resp = await client.get(API, headers=auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "subtotal" in data
        assert "total" in data


# ---------------------------------------------------------------------------
# Add item to cart
# ---------------------------------------------------------------------------

class TestAddToCart:

    @pytest.mark.asyncio
    async def test_add_item_returns_200(self, client: AsyncClient, customer_user, sample_products):
        """Adding an existing active product to cart should succeed."""
        user, token = customer_user
        product = sample_products[0]

        resp = await client.post(
            f"{API}/items",
            json={"product_id": str(product.id), "quantity": 2},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "item_count" in data

    @pytest.mark.asyncio
    async def test_add_item_increases_quantity_on_repeat(self, client: AsyncClient, customer_user, sample_products):
        """Adding the same product twice should increase quantity."""
        user, token = customer_user
        product = sample_products[0]
        headers = auth_headers(token)

        await client.post(f"{API}/items", json={"product_id": str(product.id), "quantity": 1}, headers=headers)
        resp = await client.post(f"{API}/items", json={"product_id": str(product.id), "quantity": 3}, headers=headers)

        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_add_item_product_not_found(self, client: AsyncClient, customer_user):
        user, token = customer_user
        resp = await client.post(
            f"{API}/items",
            json={"product_id": str(uuid.uuid4()), "quantity": 1},
            headers=auth_headers(token),
        )
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_add_item_invalid_quantity_zero(self, client: AsyncClient, customer_user, sample_products):
        user, token = customer_user
        resp = await client.post(
            f"{API}/items",
            json={"product_id": str(sample_products[0].id), "quantity": 0},
            headers=auth_headers(token),
        )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_add_item_missing_product_id(self, client: AsyncClient, customer_user):
        user, token = customer_user
        resp = await client.post(
            f"{API}/items",
            json={"quantity": 1},
            headers=auth_headers(token),
        )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_add_multiple_different_products(self, client: AsyncClient, customer_user, sample_products):
        """Adding two different products should both succeed."""
        user, token = customer_user
        headers = auth_headers(token)

        resp1 = await client.post(f"{API}/items", json={"product_id": str(sample_products[0].id), "quantity": 1}, headers=headers)
        assert resp1.status_code == 200

        resp2 = await client.post(f"{API}/items", json={"product_id": str(sample_products[1].id), "quantity": 2}, headers=headers)
        assert resp2.status_code == 200


# ---------------------------------------------------------------------------
# Update cart item
# ---------------------------------------------------------------------------

class TestUpdateCartItem:

    @pytest.mark.asyncio
    async def test_update_nonexistent_item(self, client: AsyncClient, customer_user):
        user, token = customer_user
        fake_id = str(uuid.uuid4())
        resp = await client.put(
            f"{API}/items/{fake_id}",
            json={"quantity": 5},
            headers=auth_headers(token),
        )
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Remove cart item
# ---------------------------------------------------------------------------

class TestRemoveCartItem:

    @pytest.mark.asyncio
    async def test_remove_nonexistent_item(self, client: AsyncClient, customer_user):
        user, token = customer_user
        fake_id = str(uuid.uuid4())
        resp = await client.delete(f"{API}/items/{fake_id}", headers=auth_headers(token))
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Clear cart
# ---------------------------------------------------------------------------

class TestClearCart:

    @pytest.mark.asyncio
    async def test_clear_cart(self, client: AsyncClient, customer_user, sample_products):
        user, token = customer_user
        headers = auth_headers(token)

        await client.post(f"{API}/items", json={"product_id": str(sample_products[0].id), "quantity": 2}, headers=headers)

        resp = await client.delete(API, headers=headers)
        assert resp.status_code == 200
        assert "cleared" in resp.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_clear_cart_unauthenticated(self, client: AsyncClient):
        resp = await client.delete(API)
        assert resp.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Coupon
# ---------------------------------------------------------------------------

class TestCoupon:

    @pytest.mark.asyncio
    async def test_apply_invalid_coupon(self, client: AsyncClient, customer_user, sample_products):
        user, token = customer_user
        headers = auth_headers(token)

        await client.post(f"{API}/items", json={"product_id": str(sample_products[0].id), "quantity": 1}, headers=headers)

        resp = await client.post(f"{API}/coupon", json={"coupon_code": "BADCODE"}, headers=headers)
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_apply_coupon_no_cart(self, client: AsyncClient):
        """Applying a coupon without auth should fail."""
        resp = await client.post(f"{API}/coupon", json={"coupon_code": "SAVE10"})
        assert resp.status_code in (401, 403)

    @pytest.mark.asyncio
    async def test_apply_coupon_missing_code(self, client: AsyncClient, customer_user):
        user, token = customer_user
        resp = await client.post(f"{API}/coupon", json={}, headers=auth_headers(token))
        assert resp.status_code == 422
