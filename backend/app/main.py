from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
import os

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.core.fts5_setup import create_fts5_table, populate_fts5_table, check_fts5_exists
from app.api.v1.router import api_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("Starting up MarketHub API...")
    await init_db()
    logger.info("Database initialized")

    # Initialize FTS5 for SQLite
    if settings.DATABASE_URL.startswith("sqlite"):
        logger.info("Initializing FTS5 full-text search...")
        async with AsyncSessionLocal() as db:
            try:
                # Check if FTS5 table already exists
                fts5_exists = await check_fts5_exists(db)

                if not fts5_exists:
                    logger.info("Creating FTS5 table and triggers...")
                    success = await create_fts5_table(db)
                    if success:
                        logger.info("FTS5 table created successfully")

                        # Populate FTS5 table with existing products
                        count = await populate_fts5_table(db)
                        logger.info(f"FTS5 table populated with {count} products")
                    else:
                        logger.error("Failed to create FTS5 table")
                else:
                    logger.info("FTS5 table already exists")

            except Exception as e:
                logger.error(f"Failed to initialize FTS5: {e}")
    else:
        logger.info("FTS5 is only supported for SQLite databases")

    yield
    # Shutdown
    logger.info("Shutting down MarketHub API...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="Multi-vendor e-commerce marketplace API with AI features",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
    # redirect_slashes=True by default - handles both /path and /path/
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)


# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    if not settings.DEBUG:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' https: data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https:; font-src 'self' https: data:;"
    return response


# Request size limit middleware
@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    # 10MB max request size
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > 10 * 1024 * 1024:
        return JSONResponse(status_code=413, content={"detail": "Request body too large"})
    return await call_next(request)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred"}
    )


# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION}


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
