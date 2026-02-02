"""
Tests for vendor endpoints: /api/v1/vendors/*
"""

import uuid
import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers

API = "/api/v1/vendors"


# ---------------------------------------------------------------------------
# Register vendor
# ---------------------------------------------------------------------------

class TestRegisterVendor:

    @pytest.mark.asyncio
    async def test_register_vendor_success(self, client: AsyncClient, customer_user):
        user, token = customer_user
        resp = await client.post(
            f"{API}/register",
            json={
                "business_name": "My New Shop",
                "business_email": "shop@example.com",
                "description": "A great shop",
                "business_phone": "+1234567890",
                "country": "US",
            },
            headers=auth_headers(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["business_name"] == "My New Shop"
        assert data["status"] == "pending"
        assert data["slug"] == "my-new-shop"

    @pytest.mark.asyncio
    async def test_register_vendor_duplicate(self, client: AsyncClient, customer_user):
        user, token = customer_user
        payload = {
            "business_name": "Duplicate Shop",
            "business_email": "dup@example.com",
            "country": "US",
        }
        resp1 = await client.post(f"{API}/register", json=payload, headers=auth_headers(token))
        assert resp1.status_code == 201

        resp2 = await client.post(f"{API}/register", json=payload, headers=auth_headers(token))
        assert resp2.status_code == 400
        assert "already registered" in resp2.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_register_vendor_unauthenticated(self, client: AsyncClient):
        resp = await client.post(f"{API}/register", json={
            "business_name": "No Auth Shop",
            "business_email": "noauth@example.com",
            "country": "US",
        })
        assert resp.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Get vendor profile (own)
# ---------------------------------------------------------------------------

class TestVendorProfile:

    @pytest.mark.asyncio
    async def test_get_my_vendor_profile(self, client: AsyncClient, vendor_user):
        user, token, vendor = vendor_user
        resp = await client.get(f"{API}/me", headers=auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["business_name"] == "Test Vendor Store"

    @pytest.mark.asyncio
    async def test_get_vendor_profile_not_a_vendor(self, client: AsyncClient, customer_user):
        user, token = customer_user
        resp = await client.get(f"{API}/me", headers=auth_headers(token))
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Update vendor profile
# ---------------------------------------------------------------------------

class TestUpdateVendorProfile:

    @pytest.mark.asyncio
    async def test_update_vendor_profile(self, client: AsyncClient, vendor_user):
        user, token, vendor = vendor_user
        resp = await client.put(
            f"{API}/me",
            json={"description": "Updated description"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert resp.json()["description"] == "Updated description"


# ---------------------------------------------------------------------------
# List vendors (public)
# ---------------------------------------------------------------------------

class TestListVendors:

    @pytest.mark.asyncio
    async def test_list_approved_vendors(self, client: AsyncClient, vendor_user):
        resp = await client.get(API)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["status"] == "approved"

    @pytest.mark.asyncio
    async def test_list_vendors_empty(self, client: AsyncClient):
        resp = await client.get(API)
        assert resp.status_code == 200
        assert resp.json() == []


# ---------------------------------------------------------------------------
# Get vendor by slug (public)
# ---------------------------------------------------------------------------

class TestGetVendorBySlug:

    @pytest.mark.asyncio
    async def test_get_vendor_by_slug(self, client: AsyncClient, vendor_user):
        resp = await client.get(f"{API}/test-vendor-store")
        assert resp.status_code == 200
        assert resp.json()["business_name"] == "Test Vendor Store"

    @pytest.mark.asyncio
    async def test_get_vendor_by_id(self, client: AsyncClient, vendor_user):
        _, _, vendor = vendor_user
        resp = await client.get(f"{API}/{str(vendor.id)}")
        assert resp.status_code == 200
        assert resp.json()["business_name"] == "Test Vendor Store"

    @pytest.mark.asyncio
    async def test_get_vendor_not_found(self, client: AsyncClient):
        resp = await client.get(f"{API}/nonexistent-vendor-slug")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Vendor products (public)
# ---------------------------------------------------------------------------

class TestVendorPublicProducts:

    @pytest.mark.asyncio
    async def test_get_vendor_public_products(self, client: AsyncClient, vendor_user, sample_products):
        _, _, vendor = vendor_user
        resp = await client.get(f"{API}/{vendor.slug}/products")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert data["total"] >= 1

    @pytest.mark.asyncio
    async def test_get_vendor_public_products_not_found(self, client: AsyncClient):
        resp = await client.get(f"{API}/nonexistent/products")
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Vendor dashboard
# ---------------------------------------------------------------------------

class TestVendorDashboard:

    @pytest.mark.asyncio
    async def test_get_dashboard_stats(self, client: AsyncClient, vendor_user):
        user, token, vendor = vendor_user
        resp = await client.get(f"{API}/me/dashboard", headers=auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "total_products" in data
        assert "total_orders" in data
        assert "total_revenue" in data

    @pytest.mark.asyncio
    async def test_dashboard_not_a_vendor(self, client: AsyncClient, customer_user):
        user, token = customer_user
        resp = await client.get(f"{API}/me/dashboard", headers=auth_headers(token))
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Vendor products CRUD (authenticated)
# ---------------------------------------------------------------------------

class TestVendorProductsCRUD:

    @pytest.mark.asyncio
    async def test_get_vendor_products(self, client: AsyncClient, vendor_user, sample_products):
        user, token, vendor = vendor_user
        resp = await client.get(f"{API}/me/products", headers=auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert data["total"] >= 1

    @pytest.mark.asyncio
    async def test_create_vendor_product(self, client: AsyncClient, vendor_user, sample_category):
        user, token, vendor = vendor_user
        resp = await client.post(
            f"{API}/me/products",
            json={
                "name": "Brand New Widget",
                "price": 29.99,
                "stock": 50,
                "description": "A fantastic widget",
                "category_id": str(sample_category.id),
            },
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data
        assert data["slug"] == "brand-new-widget"

    @pytest.mark.asyncio
    async def test_delete_vendor_product(self, client: AsyncClient, vendor_user, sample_products):
        user, token, vendor = vendor_user
        product_id = str(sample_products[0].id)
        resp = await client.delete(
            f"{API}/me/products/{product_id}",
            headers=auth_headers(token),
        )
        assert resp.status_code == 200
        assert "deleted" in resp.json()["message"].lower()


# ---------------------------------------------------------------------------
# Vendor orders (authenticated)
# ---------------------------------------------------------------------------

class TestVendorOrders:

    @pytest.mark.asyncio
    async def test_get_vendor_orders_empty(self, client: AsyncClient, vendor_user):
        user, token, vendor = vendor_user
        resp = await client.get(f"{API}/me/orders", headers=auth_headers(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert data["total"] == 0


# ---------------------------------------------------------------------------
# Admin vendor management
# ---------------------------------------------------------------------------

class TestAdminVendorManagement:

    @pytest.mark.asyncio
    async def test_list_pending_vendors(self, client: AsyncClient, admin_user):
        user, token = admin_user
        resp = await client.get(f"{API}/admin/pending", headers=auth_headers(token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    @pytest.mark.asyncio
    async def test_list_pending_vendors_not_admin(self, client: AsyncClient, customer_user):
        user, token = customer_user
        resp = await client.get(f"{API}/admin/pending", headers=auth_headers(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_approve_vendor(self, client: AsyncClient, admin_user, db_session):
        """Create a pending vendor and approve it."""
        from app.models.user import User, UserRole, AuthProvider
        from app.models.vendor import Vendor, VendorStatus
        from app.core.security import get_password_hash

        admin, admin_token = admin_user

        # Create a user + pending vendor
        new_user = User(
            id=uuid.uuid4(),
            email="pendingvendor@test.com",
            password_hash=get_password_hash("TestPass1"),
            first_name="Pending",
            last_name="Vendor",
            role=UserRole.VENDOR,
            auth_provider=AuthProvider.LOCAL,
        )
        db_session.add(new_user)
        await db_session.flush()

        pending_vendor = Vendor(
            id=uuid.uuid4(),
            user_id=new_user.id,
            business_name="Pending Biz",
            slug="pending-biz",
            business_email="pending@example.com",
            status=VendorStatus.PENDING,
        )
        db_session.add(pending_vendor)
        await db_session.commit()

        resp = await client.put(
            f"{API}/admin/{str(pending_vendor.id)}/approve",
            headers=auth_headers(admin_token),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "approved"

    @pytest.mark.asyncio
    async def test_reject_vendor_not_found(self, client: AsyncClient, admin_user):
        user, token = admin_user
        fake_id = str(uuid.uuid4())
        resp = await client.put(
            f"{API}/admin/{fake_id}/reject",
            headers=auth_headers(token),
        )
        assert resp.status_code == 404
