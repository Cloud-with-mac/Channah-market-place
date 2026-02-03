/**
 * Shared TypeScript type definitions for mobile apps
 * Use these instead of 'any' types for better type safety
 */

// ==================== COMMON ====================

export interface ID {
  id: string;
}

export interface Timestamps {
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  results: T[];
  pagination: Pagination;
}

// ==================== USER & AUTH ====================

export type UserRole = 'customer' | 'vendor' | 'admin';

export interface User extends ID, Timestamps {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

// ==================== PRODUCT ====================

export type ProductStatus = 'active' | 'inactive' | 'out_of_stock' | 'draft';

export interface ProductImage extends ID {
  url: string;
  alt_text?: string;
  position: number;
}

export interface ProductVariant extends ID {
  name: string;
  sku?: string;
  price: number;
  compare_at_price?: number;
  quantity: number;
}

export interface Product extends ID, Timestamps {
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price?: number;
  quantity: number;
  sku?: string;
  status: ProductStatus;
  primary_image?: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  category_id?: string;
  category_name?: string;
  vendor_id: string;
  vendor_name: string;
  rating: number;
  review_count: number;
  tags?: string[];
  is_featured?: boolean;
  weight?: number;
  dimensions?: string;
  shipping_cost?: number;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  rating?: number;
  vendor?: string;
  status?: ProductStatus;
  sort_by?: 'price' | 'rating' | 'created_at' | 'name';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ==================== CATEGORY ====================

export interface Category extends ID, Timestamps {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  position: number;
  is_active: boolean;
  product_count?: number;
}

// ==================== CART ====================

export interface CartItem extends ID, Timestamps {
  product_id: string;
  product: Product;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  price: number;
  total: number;
  custom_options?: Record<string, string>;
}

export interface Cart extends ID, Timestamps {
  user_id?: string;
  session_id?: string;
  items: CartItem[];
  item_count: number;
  subtotal: number;
  discount_amount: number;
  total: number;
  coupon_code?: string;
}

// ==================== ORDER ====================

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface OrderItem extends ID {
  order_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  variant_id?: string;
  variant_name?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order extends ID, Timestamps {
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  tracking_number?: string;
  notes?: string;
  payment_method?: string;
  paid_at?: string;
  shipped_at?: string;
  delivered_at?: string;
}

// ==================== ADDRESS ====================

export interface Address extends ID, Timestamps {
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

// ==================== VENDOR ====================

export type VendorStatus = 'pending' | 'approved' | 'suspended' | 'rejected';

export interface Vendor extends ID, Timestamps {
  user_id: string;
  business_name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  business_email: string;
  business_phone?: string;
  business_address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  status: VendorStatus;
  rating: number;
  total_reviews: number;
  product_count?: number;
  is_featured: boolean;
}

// ==================== REVIEW ====================

export interface Review extends ID, Timestamps {
  product_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  is_verified_purchase: boolean;
  helpful_count: number;
}

// ==================== NOTIFICATION ====================

export type NotificationType = 'order' | 'system' | 'promotion' | 'message';

export interface Notification extends ID, Timestamps {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  link?: string;
}

// ==================== RFQ (Request for Quote) ====================

export type RFQStatus = 'draft' | 'submitted' | 'quoted' | 'accepted' | 'rejected' | 'expired';

export interface RFQ extends ID, Timestamps {
  user_id: string;
  title: string;
  description: string;
  quantity: number;
  target_price?: number;
  deadline?: string;
  status: RFQStatus;
  category_id?: string;
  attachments?: string[];
  quotes_count: number;
}

export interface RFQQuote extends ID, Timestamps {
  rfq_id: string;
  vendor_id: string;
  vendor_name: string;
  price: number;
  quantity: number;
  message?: string;
  delivery_time?: string;
  status: 'pending' | 'accepted' | 'rejected';
}

// ==================== PAYOUT ====================

export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface Payout extends ID, Timestamps {
  vendor_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  payment_method: string;
  transaction_id?: string;
  notes?: string;
  paid_date?: string;
}

// ==================== ANALYTICS ====================

export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  total_products: number;
  low_stock_products: number;
  total_customers: number;
  average_order_value: number;
  revenue_growth?: number;
}

export interface RevenueChartData {
  date: string;
  revenue: number;
  orders: number;
}

// ==================== NAVIGATION ====================

export interface NavigationProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
    goBack: () => void;
    replace: (screen: string, params?: Record<string, unknown>) => void;
    reset: (state: unknown) => void;
  };
  route: {
    params?: Record<string, unknown>;
    name: string;
  };
}

// ==================== API RESPONSES ====================

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export interface MessageResponse {
  message: string;
}

export interface SuccessResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

// ==================== FORM DATA ====================

export interface AddressFormData {
  first_name: string;
  last_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

export interface ReviewFormData {
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  compare_at_price?: number;
  quantity: number;
  sku?: string;
  category_id?: string;
  tags?: string[];
  weight?: number;
  dimensions?: string;
  shipping_cost?: number;
}
