// Type và hằng số dùng chung giữa apps/api và apps/web.

export const ROLES = ['USER', 'MANAGER', 'ADMIN'] as const;
/** GUEST = chưa đăng nhập, không lưu trong DB. */
export type Role = (typeof ROLES)[number];
export type ActorRole = Role | 'GUEST';

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ['COD'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PRODUCT_SORTS = [
  'newest',
  'price_asc',
  'price_desc',
  'name_asc',
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export interface AddressDto {
  id: string;
  receiverName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  /** Đường dẫn đầy đủ, ví dụ `giay/co-nhan-tao`. */
  path: string;
  sortOrder: number;
  children: CategoryNode[];
}

export interface BrandSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface ProductVariantDto {
  id: string;
  sku: string;
  size: string;
  color: string;
  studType: string | null;
  price: number;
  stock: number;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  /** Giá niêm yết (VND). Biến thể có thể có giá riêng, xem ProductDetail.variants. */
  basePrice: number;
  imageUrl: string | null;
  brand: BrandSummary;
  categorySlug: string;
  inStock: boolean;
}

export interface ProductDetail extends ProductListItem {
  description: string;
  images: string[];
  model3dUrl: string | null;
  category: { id: string; name: string; slug: string; path: string };
  variants: ProductVariantDto[];
}

export interface CartItemDto {
  id: string;
  variantId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  size: string;
  color: string;
  studType: string | null;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  /** Tồn kho hiện tại của biến thể, để giao diện giới hạn số lượng. */
  stock: number;
}

export interface CartDto {
  id: string | null;
  /** Token giỏ hàng của khách chưa đăng nhập (gửi lại qua header `x-cart-token`). */
  token: string | null;
  items: CartItemDto[];
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
}

export interface ShippingInfo {
  name: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
}

export interface OrderItemDto {
  id: string;
  productName: string;
  size: string;
  color: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  customName: string | null;
  customNumber: string | null;
}

export interface OrderDto {
  id: string;
  code: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingFee: number;
  total: number;
  note: string | null;
  createdAt: string;
  shipping: ShippingInfo;
  guestEmail: string | null;
  items: OrderItemDto[];
}

export interface ProductFacets {
  brands: Array<BrandSummary & { count: number }>;
  sizes: string[];
  minPrice: number;
  maxPrice: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
