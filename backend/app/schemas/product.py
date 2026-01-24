from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
import json
from datetime import datetime
from uuid import UUID
from decimal import Decimal
from app.schemas.common import BaseSchema


class ProductImageCreate(BaseModel):
    url: str
    alt_text: Optional[str] = None
    is_primary: bool = False


class ProductImageResponse(BaseSchema):
    id: UUID
    url: str
    alt_text: Optional[str]
    sort_order: int
    is_primary: bool
    ai_tags: Optional[List[str]]


class ProductVariantCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    price: Decimal
    compare_at_price: Optional[Decimal] = None
    quantity: int = 0
    options: Optional[Dict[str, str]] = None
    image_url: Optional[str] = None


class ProductVariantUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[Decimal] = None
    compare_at_price: Optional[Decimal] = None
    quantity: Optional[int] = None
    options: Optional[Dict[str, str]] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class ProductVariantResponse(BaseSchema):
    id: UUID
    name: str
    sku: Optional[str]
    price: Decimal
    compare_at_price: Optional[Decimal]
    quantity: int
    options: Optional[Dict[str, str]] = None
    image_url: Optional[str]
    is_active: bool

    @field_validator('options', mode='before')
    @classmethod
    def parse_options(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return None
        return v


class ProductAttributeCreate(BaseModel):
    name: str
    value: str
    is_visible: bool = True


class ProductAttributeResponse(BaseSchema):
    id: UUID
    name: str
    value: str
    is_visible: bool


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=500)
    category_id: Optional[UUID] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    price: Decimal = Field(..., gt=0)
    compare_at_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    quantity: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)
    track_inventory: bool = True
    allow_backorder: bool = False
    weight: Optional[float] = None
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    requires_shipping: bool = True
    is_digital: bool = False
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tags: Optional[List[str]] = None
    images: Optional[List[ProductImageCreate]] = None
    variants: Optional[List[ProductVariantCreate]] = None
    attributes: Optional[List[ProductAttributeCreate]] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=500)
    category_id: Optional[UUID] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[Decimal] = None
    compare_at_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    track_inventory: Optional[bool] = None
    allow_backorder: Optional[bool] = None
    weight: Optional[float] = None
    length: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    requires_shipping: Optional[bool] = None
    status: Optional[str] = None
    is_featured: Optional[bool] = None
    is_digital: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tags: Optional[List[str]] = None
    # Image URLs for update (simplified from frontend)
    image_urls: Optional[List[str]] = None
    primary_image: Optional[str] = None
    # Product variants
    variants: Optional[List[ProductVariantCreate]] = None


class VendorSummary(BaseSchema):
    id: UUID
    business_name: str
    slug: str
    logo_url: Optional[str]
    rating: float


class CategorySummary(BaseSchema):
    id: UUID
    name: str
    slug: str


class ProductResponse(BaseSchema):
    id: UUID
    vendor_id: UUID
    category_id: Optional[UUID]
    name: str
    slug: str
    description: Optional[str]
    short_description: Optional[str]
    sku: Optional[str]
    price: Decimal
    compare_at_price: Optional[Decimal]
    currency: str
    quantity: int
    status: str
    is_featured: bool
    is_digital: bool
    rating: float
    review_count: int
    view_count: int
    sales_count: int
    tags: Optional[List[str]]
    created_at: datetime
    published_at: Optional[datetime]

    # Related
    images: List[ProductImageResponse] = []
    variants: List[ProductVariantResponse] = []
    attributes: List[ProductAttributeResponse] = []
    vendor: Optional[VendorSummary] = None
    category: Optional[CategorySummary] = None

    # Computed
    @property
    def primary_image(self) -> Optional[str]:
        if self.images:
            return self.images[0].url
        return None

    @property
    def discount_percentage(self) -> int:
        if self.compare_at_price and self.compare_at_price > self.price:
            return round((1 - float(self.price) / float(self.compare_at_price)) * 100)
        return 0

    @property
    def in_stock(self) -> bool:
        return self.quantity > 0


class ProductListResponse(BaseSchema):
    id: UUID
    name: str
    slug: str
    price: Decimal
    compare_at_price: Optional[Decimal]
    currency: str
    quantity: int
    status: str
    rating: float
    review_count: int
    primary_image: Optional[str]
    vendor_name: Optional[str]
    category_name: Optional[str]


class ProductSearchQuery(BaseModel):
    query: Optional[str] = None
    category_id: Optional[UUID] = None
    vendor_id: Optional[UUID] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    in_stock: Optional[bool] = None
    rating_min: Optional[float] = None
    tags: Optional[List[str]] = None
    sort_by: str = "created_at"
    sort_order: str = "desc"
    page: int = 1
    page_size: int = 20


class BulkProductUpload(BaseModel):
    products: List[ProductCreate]


# Filter Options Schemas
class FilterOptionItem(BaseModel):
    """Individual filter option (e.g., a specific size or color)"""
    value: str
    label: str
    count: int = 0


class FilterSection(BaseModel):
    """A filter section with its options"""
    key: str  # e.g., "size", "color", "brand"
    label: str  # Display name e.g., "Size", "Color", "Brand"
    type: str = "checkbox"  # checkbox, range, rating
    options: List[FilterOptionItem] = []
    # For range type filters
    min_value: Optional[float] = None
    max_value: Optional[float] = None


class VendorFilterOption(BaseModel):
    """Vendor/Seller filter option"""
    id: UUID
    name: str
    rating: float = 0.0
    count: int = 0


class CategoryFiltersResponse(BaseModel):
    """Complete filter options for a category"""
    category_id: Optional[UUID] = None
    category_name: Optional[str] = None

    # Price range
    price_min: Decimal = Decimal("0")
    price_max: Decimal = Decimal("10000")

    # Dynamic attribute filters (Size, Color, Material, etc.)
    attribute_filters: List[FilterSection] = []

    # Vendor/Seller filters
    vendors: List[VendorFilterOption] = []

    # Rating distribution
    rating_counts: Dict[int, int] = {}  # {5: 10, 4: 25, 3: 15, 2: 5, 1: 2}

    # Quick filters availability
    has_on_sale: bool = False
    has_free_shipping: bool = False
    in_stock_count: int = 0
    total_count: int = 0
