export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  employee_role?: string; // For employees: packer, deliveryman, accounts, incharge, call_center
  token: string;
  avatar?: string;
  addresses?: Address[];
}

export interface Address {
  _id: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault?: boolean;
}

export interface Order {
  _id: string;
  orderId?: string; // Order ID display
  userId?: string; // Server format
  user?: string | { _id: string; name: string; email: string }; // Client format or populated
  items?: {
    // Server format
    productId: Product;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
  orderItems?: {
    // Client format
    product: Product;
    quantity: number;
    price: number;
  }[];
  shippingAddress: Address;
  paymentMethod?: string;
  total?: number; // Server format
  totalAmount?: number; // Alternative format
  totalPrice?: number; // Client format
  shippingPrice?: number;
  taxPrice?: number;
  status?:
    | 'pending'
    | 'paid'
    | 'address_confirmed'
    | 'confirmed'
    | 'packed'
    | 'delivering'
    | 'delivered'
    | 'completed'
    | 'cancelled'; // Server format
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded' | 'cod_collected';
  status_updates?: {
    address_confirmed?: {
      timestamp?: string | Date;
      by?: { name?: string };
    };
    confirmed?: {
      timestamp?: string | Date;
      by?: { name?: string };
    };
    packed?: {
      timestamp?: string | Date;
      by?: { name?: string };
    };
    delivering?: {
      timestamp?: string | Date;
      by?: { name?: string };
    };
    delivered?: {
      timestamp?: string | Date;
      by?: { name?: string };
    };
    cancelled?: {
      timestamp?: string | Date;
      by?: { name?: string };
      reason?: string;
    };
  };
  isPaid?: boolean; // Client format
  paidAt?: Date;
  isDelivered?: boolean;
  deliveredAt?: Date;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number; // Original price before discount
  discountPercentage?: number; // Discount percentage (0-100)
  image: string;
  category: {
    _id: string;
    name: string;
  };
  brand: string;
  stock: number;
  rating: number;
  numReviews: number;
  similarity?: number; // Similarity score for image search (0-100)
}

export interface Category {
  _id: string;
  name: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  _id: string;
  name: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductType {
  _id: string;
  name: string;
  type: string;
  displayOrder: number;
  color?: string;
  isActive: boolean;
  icon?: string;
  bannerImages?: string[];
}

export interface ProductTypesResponse {
  productTypes: ProductType[];
}

export interface CategoriesResponse {
  categories: Category[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// Navigation Types
export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Signup: undefined;
  SingleProduct: { productId: string };
  ProductList: {
    categoryId?: string;
    categoryName?: string;
    productType?: string;
    productTypeName?: string;
  };
  Cart: undefined;
  PlaceOrder: undefined;
  Checkout: { orderId: string; paymentMethod?: 'stripe' | 'sslcommerz' };
  SingleOrder: { orderId: string };
  Orders: undefined;
  Wishlist: undefined;
  EditProfile: undefined;
  BecomeVendor: undefined;
  VendorGuide: undefined;
  VendorDashboard: undefined;
  OrderManagement: undefined;
  ProductManagement: undefined;
  UserManagement: undefined;
  CategoryManagement: undefined;
  BrandManagement: undefined;
  ReviewManagement: undefined;
  AnalyticsScreen: undefined;
};

export type TabParamList = {
  Home: undefined;
  Shop: undefined;
  Search: undefined;
  Profile: undefined;
};

// Navigation Props Types
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

export type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Profile'>,
  StackNavigationProp<RootStackParamList>
>;

export type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

export type SignupScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Signup'
>;

export type SingleProductScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SingleProduct'
>;

export type ProductListScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ProductList'
>;
