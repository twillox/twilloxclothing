import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  role: 'customer' | 'admin';
  createdAt: Timestamp;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  category: string;
  stock: number;
  imageUrls: string[];
  sizes: string[];
  colors: string[];
  tags: string[];
  rating: number;
  reviewsCount: number;
  createdAt: Timestamp;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  createdAt: Timestamp;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  imageUrl: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  phone: string;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled';
  tax: number;
  deliveryFee: number;
  paymentMethod: 'COD' | 'ONLINE';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
}

export interface Wishlist {
  userId: string;
  productIds: string[];
  updatedAt: Timestamp;
}

export interface CartItem {
  productId: string;
  quantity: number;
  size: string;
  color: string;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: Timestamp;
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase: number;
  active: boolean;
  createdAt: Timestamp;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  type: 'home' | 'collection' | 'promo';
  createdAt: Timestamp;
}

export interface Notification {
  id: string;
  userId: string; // 'all' for broadcasts or specific UID
  title: string;
  message: string;
  type: 'order_update' | 'promo';
  read: boolean;
  createdAt: Timestamp;
}

export type SectionType = 'hero' | 'manifesto' | 'product_carousel' | 'banner_grid' | 'spacer';

export interface HomepageSection {
  id: string;
  type: SectionType;
  order: number;
  content: {
    title?: string;
    subtitle?: string;
    text?: string;
    imageUrl?: string;
    imageAlt?: string;
    buttonText?: string;
    buttonLink?: string;
    backgroundColor?: string;
    textColor?: string;
    height?: string;
    reversed?: boolean; // For split layouts (image on left vs right)
    categorySlug?: string; // For product carousels
    limit?: number; // Number of products to show
  };
  createdAt: Timestamp;
}

export interface StoreSettings {
  deliveryFee: number;
  taxRate: number; // percentage, e.g., 5 for 5%
  paymentMethods: {
    cod: boolean;
    online: boolean;
  };
}
