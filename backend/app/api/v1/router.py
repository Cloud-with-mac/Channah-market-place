from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    vendors,
    products,
    categories,
    cart,
    orders,
    reviews,
    addresses,
    payments,
    ai,
    admin,
    notifications,
    search,
    upload,
    customer_vendor_chat,
    websocket,
)

api_router = APIRouter()

# Authentication
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Users
api_router.include_router(users.router, prefix="/users", tags=["Users"])

# Vendors
api_router.include_router(vendors.router, prefix="/vendors", tags=["Vendors"])

# Products
api_router.include_router(products.router, prefix="/products", tags=["Products"])

# Categories
api_router.include_router(categories.router, prefix="/categories", tags=["Categories"])

# Cart
api_router.include_router(cart.router, prefix="/cart", tags=["Cart"])

# Orders
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])

# Reviews
api_router.include_router(reviews.router, prefix="/reviews", tags=["Reviews"])

# Addresses
api_router.include_router(addresses.router, prefix="/addresses", tags=["Addresses"])

# Payments
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])

# AI Features
api_router.include_router(ai.router, prefix="/ai", tags=["AI"])

# Search
api_router.include_router(search.router, prefix="/search", tags=["Search"])

# Upload
api_router.include_router(upload.router, prefix="/upload", tags=["Upload"])

# Notifications
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])

# Admin
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])

# Customer-Vendor Chat
api_router.include_router(customer_vendor_chat.router, prefix="/chats", tags=["Customer-Vendor Chat"])

# WebSocket
api_router.include_router(websocket.router, tags=["WebSocket"])
