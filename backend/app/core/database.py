from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool, StaticPool
from sqlalchemy import text
from app.core.config import settings

# Determine if using SQLite
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# Create async engine with appropriate settings
if is_sqlite:
    # SQLite needs special handling for async
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,  # Disable SQL echo for performance (even in debug mode)
        poolclass=StaticPool,
        connect_args={
            "check_same_thread": False,
            "timeout": 30,  # Wait up to 30 seconds for database lock
        },
    )
else:
    # PostgreSQL configuration
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,  # Disable SQL echo for performance
        poolclass=NullPool,
    )

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncSession:
    """Dependency to get database session"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables"""
    # Import all models to ensure they are registered with Base.metadata
    from app.models import (
        User, Vendor, VendorPayout, Category, Product, ProductImage,
        ProductVariant, ProductAttribute, Cart, CartItem, Order, OrderItem,
        OrderStatusHistory, Review, Wishlist, Address, Payment, PaymentMethod,
        Notification, Conversation, Message, SupportChat, SupportChatMessage,
        SearchQuery
    )
    from app.models.contact import ContactSubmission, NewsletterSubscriber

    async with engine.begin() as conn:
        # Enable WAL mode for better concurrent access (SQLite only)
        if is_sqlite:
            await conn.execute(text("PRAGMA journal_mode=WAL"))
            await conn.execute(text("PRAGMA busy_timeout=30000"))  # 30 second timeout
        await conn.run_sync(Base.metadata.create_all)
