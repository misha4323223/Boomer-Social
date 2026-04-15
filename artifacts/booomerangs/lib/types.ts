export interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  thumbnailUrl?: string;
  sizes?: string[];
  color?: string;
  sku?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  images?: string[];
}

export interface Category {
  id: number | string;
  name: string;
  slug?: string;
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
}

export interface Order {
  id: number;
  userId: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  items?: OrderItem[];
  customerName?: string;
  phone?: string;
  address?: string;
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
