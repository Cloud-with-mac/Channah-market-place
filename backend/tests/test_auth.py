"""
Tests for authentication endpoints: /api/v1/auth/*
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient

from tests.conftest import auth_headers

API = "/api/v1/auth"


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

class TestRegister:

    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient):
        resp = await client.post(f"{API}/register", json={
            "email": "newuser@example.com",
            "password": "StrongPass1",
            "first_name": "New",
            "last_name": "User",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == "newuser@example.com"
        assert data["user"]["role"] == "customer"
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient):
        payload = {
            "email": "dup@example.com",
            "password": "StrongPass1",
            "first_name": "A",
            "last_name": "B",
        }
        resp1 = await client.post(f"{API}/register", json=payload)
        assert resp1.status_code == 201

        resp2 = await client.post(f"{API}/register", json=payload)
        assert resp2.status_code == 400
        assert "already registered" in resp2.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_register_weak_password(self, client: AsyncClient):
        resp = await client.post(f"{API}/register", json={
            "email": "weak@example.com",
            "password": "short",
            "first_name": "A",
            "last_name": "B",
        })
        assert resp.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_register_password_no_uppercase(self, client: AsyncClient):
        resp = await client.post(f"{API}/register", json={
            "email": "noupper@example.com",
            "password": "alllowercase1",
            "first_name": "A",
            "last_name": "B",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_register_password_no_digit(self, client: AsyncClient):
        resp = await client.post(f"{API}/register", json={
            "email": "nodigit@example.com",
            "password": "NoDigitHere",
            "first_name": "A",
            "last_name": "B",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_register_missing_fields(self, client: AsyncClient):
        resp = await client.post(f"{API}/register", json={
            "email": "miss@example.com",
        })
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client: AsyncClient):
        resp = await client.post(f"{API}/register", json={
            "email": "not-an-email",
            "password": "StrongPass1",
            "first_name": "A",
            "last_name": "B",
        })
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

class TestLogin:

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient):
        # Register first
        await client.post(f"{API}/register", json={
            "email": "login@example.com",
            "password": "StrongPass1",
            "first_name": "L",
            "last_name": "U",
        })

        # Login (OAuth2 form)
        resp = await client.post(f"{API}/login", data={
            "username": "login@example.com",
            "password": "StrongPass1",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == "login@example.com"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient):
        await client.post(f"{API}/register", json={
            "email": "wrongpw@example.com",
            "password": "StrongPass1",
            "first_name": "L",
            "last_name": "U",
        })
        resp = await client.post(f"{API}/login", data={
            "username": "wrongpw@example.com",
            "password": "WrongPassword1",
        })
        assert resp.status_code == 401
        assert "incorrect" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        resp = await client.post(f"{API}/login", data={
            "username": "noone@example.com",
            "password": "DoesNotMatter1",
        })
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Token refresh
# ---------------------------------------------------------------------------

class TestTokenRefresh:

    @pytest.mark.asyncio
    async def test_refresh_token_success(self, client: AsyncClient):
        reg = await client.post(f"{API}/register", json={
            "email": "refresh@example.com",
            "password": "StrongPass1",
            "first_name": "R",
            "last_name": "T",
        })
        refresh_token = reg.json()["refresh_token"]

        resp = await client.post(f"{API}/refresh", json={
            "refresh_token": refresh_token,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self, client: AsyncClient):
        resp = await client.post(f"{API}/refresh", json={
            "refresh_token": "invalid.token.value",
        })
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Get current user (/auth/me)
# ---------------------------------------------------------------------------

class TestGetMe:

    @pytest.mark.asyncio
    async def test_get_me_authenticated(self, client: AsyncClient):
        reg = await client.post(f"{API}/register", json={
            "email": "me@example.com",
            "password": "StrongPass1",
            "first_name": "Me",
            "last_name": "User",
        })
        token = reg.json()["access_token"]

        resp = await client.get(f"{API}/me", headers=auth_headers(token))
        assert resp.status_code == 200
        assert resp.json()["email"] == "me@example.com"

    @pytest.mark.asyncio
    async def test_get_me_unauthenticated(self, client: AsyncClient):
        resp = await client.get(f"{API}/me")
        assert resp.status_code in (401, 403)


# ---------------------------------------------------------------------------
# Password change
# ---------------------------------------------------------------------------

class TestPasswordChange:

    @pytest.mark.asyncio
    async def test_change_password_success(self, client: AsyncClient):
        reg = await client.post(f"{API}/register", json={
            "email": "chpw@example.com",
            "password": "StrongPass1",
            "first_name": "C",
            "last_name": "P",
        })
        token = reg.json()["access_token"]

        resp = await client.post(
            f"{API}/password-change",
            json={"current_password": "StrongPass1", "new_password": "NewStrong2"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 200

        # Verify new password works
        login_resp = await client.post(f"{API}/login", data={
            "username": "chpw@example.com",
            "password": "NewStrong2",
        })
        assert login_resp.status_code == 200

    @pytest.mark.asyncio
    async def test_change_password_wrong_current(self, client: AsyncClient):
        reg = await client.post(f"{API}/register", json={
            "email": "chpw2@example.com",
            "password": "StrongPass1",
            "first_name": "C",
            "last_name": "P",
        })
        token = reg.json()["access_token"]

        resp = await client.post(
            f"{API}/password-change",
            json={"current_password": "WrongCurrent1", "new_password": "NewStrong2"},
            headers=auth_headers(token),
        )
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Password reset request
# ---------------------------------------------------------------------------

class TestPasswordReset:

    @pytest.mark.asyncio
    async def test_password_reset_request_always_200(self, client: AsyncClient):
        # Should succeed even for non-existent email (to prevent enumeration)
        resp = await client.post(f"{API}/password-reset", json={
            "email": "nobody@example.com",
        })
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_password_reset_confirm_invalid_token(self, client: AsyncClient):
        resp = await client.post(f"{API}/password-reset/confirm", json={
            "token": "badtoken",
            "password": "NewStrong1",
        })
        assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

class TestLogout:

    @pytest.mark.asyncio
    async def test_logout(self, client: AsyncClient):
        reg = await client.post(f"{API}/register", json={
            "email": "logout@example.com",
            "password": "StrongPass1",
            "first_name": "L",
            "last_name": "O",
        })
        token = reg.json()["access_token"]

        resp = await client.post(f"{API}/logout", headers=auth_headers(token))
        assert resp.status_code == 200
        assert "logged out" in resp.json()["message"].lower()
