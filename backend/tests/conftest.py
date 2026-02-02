"""
Shared test fixtures for the marketplace API test suite.

Provides:
- In-memory SQLite async test database
- httpx AsyncClient wired to the FastAPI app
- Pre-built authenticated users (customer, vendor, admin)
- Sample categories, products, carts, and orders
"""

import uuid
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal
from typing import AsyncGenerator, Dict

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_access_token, create_refresh_token
from app.models.user import User, UserRole, AuthProvider
from app.models.vendor import Vendor, VendorStatus
from app.models.product import Product, ProductImage, ProductStatus
from app.models.category import Category
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem, OrderStatus, OrderStatusHistory, PaymentStatus
from app.main import app

# Disable rate limiting for tests
import app.api.v1.endpoints.auth as _auth_module
_auth_module.limiter.enabled = False
app.state.limiter.enabled = False


# ---------------------------------------------------------------------------
# Engine & session fixtures
# ---------------------------------------------------------------------------

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    """Create all tables before each test and drop them after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a fresh database session for a single test."""
    async with TestingSessionLocal() as session:
        yield session


async def _override_get_db():
    """FastAPI dependency override - uses a separate session from the test DB pool."""
    async with TestingSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


app.dependency_overrides[get_db] = _override_get_db


# ---------------------------------------------------------------------------
# HTTP client
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """httpx AsyncClient talking to the FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver", follow_redirects=True) as ac:
        yield ac


# ---------------------------------------------------------------------------
# Helper: create a user directly in the DB and return (user, token)
# ---------------------------------------------------------------------------

async def _create_user(
    db: AsyncSession,
    *,
    email: str,
    first_name: str = "Test",
    last_name: str = "User",
    role: UserRole = UserRole.CUSTOMER,
    password: str = "TestPass1",
    is_active: bool = True,
    is_verified: bool = True,
) -> tuple[User, str]:
    user = User(
        id=uuid.uuid4(),
        email=email,
        password_hash=get_password_hash(password),
        first_name=first_name,
        last_name=last_name,
        role=role,
        auth_provider=AuthProvider.LOCAL,
        is_active=is_active,
        is_verified=is_verified,
    )
    db.add(user)
    await db.flush()

    token = create_access_token(data={"sub": str(user.id)})
    return user, token


# ---------------------------------------------------------------------------
# User fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def customer_user(db_session: AsyncSession) -> tuple[User, str]:
    """Return (User, access_token) for a regular customer."""
    user, token = await _create_user(
        db_session,
        email="customer@test.com",
        first_name="Jane",
        last_name="Customer",
    )
    cart = Cart(user_id=user.id)
    db_session.add(cart)
    await db_session.commit()
    return user, token


@pytest_asyncio.fixture
async def vendor_user(db_session: AsyncSession) -> tuple[User, str, Vendor]:
    """Return (User, access_token, Vendor) for an approved vendor."""
    user, token = await _create_user(
        db_session,
        email="vendor@test.com",
        first_name="Bob",
        last_name="Vendor",
        role=UserRole.VENDOR,
    )

    vendor = Vendor(
        id=uuid.uuid4(),
        user_id=user.id,
        business_name="Test Vendor Store",
        slug="test-vendor-store",
        business_email="vendor@test.com",
        status=VendorStatus.APPROVED,
        verified_at=datetime.utcnow(),
        commission_rate=10.0,
        balance=Decimal("500.00"),
        total_sales=Decimal("1000.00"),
        total_earnings=Decimal("900.00"),
        processing_days=2,
        shipping_days=5,
    )
    db_session.add(vendor)
    await db_session.commit()
    return user, token, vendor


@pytest_asyncio.fixture
async def admin_user(db_session: AsyncSession) -> tuple[User, str]:
    """Return (User, access_token) for an admin user."""
    user, token = await _create_user(
        db_session,
        email="admin@test.com",
        first_name="Alice",
        last_name="Admin",
        role=UserRole.ADMIN,
    )
    await db_session.commit()
    return user, token


# ---------------------------------------------------------------------------
# Category / Product fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def sample_category(db_session: AsyncSession) -> Category:
    cat = Category(
        id=uuid.uuid4(),
        name="Electronics",
        slug="electronics",
        description="Electronic gadgets and devices",
        is_active=True,
        is_featured=True,
    )
    db_session.add(cat)
    await db_session.commit()
    return cat


@pytest_asyncio.fixture
async def sample_products(
    db_session: AsyncSession,
    vendor_user: tuple,
    sample_category: Category,
) -> list[Product]:
    """Create 3 sample active products with images."""
    _, _, vendor = vendor_user
    products = []
    for i in range(3):
        product = Product(
            id=uuid.uuid4(),
            vendor_id=vendor.id,
            category_id=sample_category.id,
            name=f"Test Product {i+1}",
            slug=f"test-product-{i+1}",
            description=f"Description for product {i+1}",
            short_description=f"Short desc {i+1}",
            price=Decimal(f"{(i+1)*10}.99"),
            compare_at_price=Decimal(f"{(i+1)*15}.99") if i == 0 else None,
            quantity=100,
            status=ProductStatus.ACTIVE,
            track_inventory=True,
            shipping_cost=Decimal("2.50"),
            rating=4.0 + i * 0.3,
            review_count=i * 5,
            sales_count=i * 10,
            currency="USD",
        )
        db_session.add(product)
        await db_session.flush()

        img = ProductImage(
            id=uuid.uuid4(),
            product_id=product.id,
            url=f"https://example.com/img{i+1}.jpg",
            alt_text=f"Product {i+1}",
            is_primary=True,
            sort_order=0,
        )
        db_session.add(img)
        products.append(product)

    await db_session.commit()
    return products


# ---------------------------------------------------------------------------
# Auth header helpers
# ---------------------------------------------------------------------------

def auth_headers(token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
