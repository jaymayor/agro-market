export interface User {
  id: string;
  phone: string;
  username: string;
  role: 'admin' | 'seller' | 'buyer';
  is_verified: boolean;
  avatar?: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent?: string;
  icon?: string;
  children?: Category[];
}

export interface Product {
  id: string;
  name_uz: string;
  name_ru?: string;
  description_uz: string;
  description_ru?: string;
  price: string;
  discount_price?: string;
  unit: 'kg' | 'gramm' | 'tonna' | 'litr' | 'dona' | 'quti';
  min_order_qty: string;
  stock_qty: string;
  origin_region?: string;
  harvest_date?: string;
  expiry_date?: string;
  is_organic: boolean;
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'hidden';
  rating: string;
  views_count: number;
  sales_count: number;
  slug: string;
  shop: Shop;
  category?: Category;
  images?: ProductImage[];
  created_at: string;
}

export interface ProductImage {
  id: string;
  image: string;
  ordering: number;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  region: string;
  district: string;
  address: string;
  latitude?: string;
  longitude?: string;
  status: 'pending' | 'active' | 'suspended' | 'closed';
  rating: string;
  total_sales: number;
  commission: string;
  is_verified: boolean;
  owner: User;
  created_at: string;
}

export interface OrderItem {
  id: string;
  product: Product;
  quantity: string;
  price: string;
}

export interface Order {
  id: string;
  buyer: User;
  shop: Shop;
  status: 'new' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  total_amount: string;
  delivery_fee: string;
  payment_method: 'click' | 'payme' | 'uzcard' | 'cash' | 'card';
  payment_status: string;
  delivery_address: DeliveryAddress;
  tracking_number?: string;
  notes?: string;
  delivered_at?: string;
  items: OrderItem[];
  created_at: string;
}

export interface DeliveryAddress {
  region: string;
  district: string;
  street: string;
  house: string;
  apartment?: string;
  phone: string;
  recipient_name: string;
}

export interface Review {
  id: string;
  user: User;
  product: Product;
  rating: number;
  comment: string;
  reply?: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
