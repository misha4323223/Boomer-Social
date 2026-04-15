export interface Product {
  id: number;
  name: string;
  price: number;
  wholesalePrice?: number | null;
  discountPercent?: number | null;
  imageUrl: string;
  thumbnailUrl?: string;
  hoverThumbnailUrl?: string | null;
  images?: string[];
  category?: string;
  subcategory?: string | null;
  description?: string;
  sku?: string;
  slug?: string;
  color?: string;
  colors?: ProductColor[];
  sizes?: string[];
  sizeStock?: Record<string, number>;
  inStock?: boolean;
  stock?: number;
  isNew?: boolean;
  onSale?: boolean;
  isHidden?: boolean;
  noSize?: boolean;
  composition?: string;
  careInstructions?: string | null;
  additionalCategories?: { category: string; subcategory: string }[];
  lookProducts?: any[];
  measurements?: any[];
}

export interface ProductColor {
  color: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  sizes?: string[];
}

export interface Category {
  id: number | string;
  name: string;
  slug?: string;
  subcategories?: { name: string; slug: string }[];
}

export interface CartItem {
  id: number;
  productId: number;
  sessionId: string;
  size?: string;
  color?: string;
  quantity: number;
  product?: Product;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

export interface Order {
  id: number;
  userId?: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  items?: OrderItem[];
  customerName?: string;
  phone?: string;
  address?: string;
  deliveryMethod?: string;
  trackingNumber?: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  product?: Product;
}

export interface ProductVariant {
  id: number;
  productId: number;
  color: string;
  imageUrl?: string;
  sizes?: string[];
}

export function formatPrice(kopecks: number): string {
  const rubles = Math.round(kopecks / 100);
  return rubles.toLocaleString("ru-RU") + " ₽";
}

export function getDiscountedPrice(price: number, discountPercent: number): number {
  return Math.round(price * (1 - discountPercent / 100));
}
