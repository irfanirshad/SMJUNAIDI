import { Platform } from 'react-native';

// Environment Configuration for Babymart Mobile App
// This configuration matches the web app structure

// API Configuration
const isDevelopment = __DEV__;

export const getApiBaseUrl = (): string => {
  if (isDevelopment) {
    // Android emulator uses 10.0.2.2 to access localhost
    // iOS simulator uses localhost directly
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:8000/api'
      : 'http://localhost:8000/api';
  }
  // Production API URL
  return 'https://api.babymart.reactbd.com/api';
};

export const API_CONFIG = {
  baseUrl: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Tax & Shipping Configuration
export const TAX_AMOUNT = 0; // No tax applied
export const FREE_DELIVERY_THRESHOLD = 999; // Free delivery above this amount
export const SHIPPING_FEE = 50; // Standard shipping fee

// Calculate shipping cost based on cart total
export const calculateShippingCost = (cartTotal: number): number => {
  return cartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : SHIPPING_FEE;
};

// Calculate tax amount
export const calculateTax = (subtotal: number): number => {
  return subtotal * TAX_AMOUNT;
};

// Calculate order total
export const calculateOrderTotal = (subtotal: number): number => {
  const tax = calculateTax(subtotal);
  const shipping = calculateShippingCost(subtotal);
  return subtotal + tax + shipping;
};

// Available Countries
export const AVAILABLE_COUNTRIES = [
  'Bangladesh',
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'India',
  'Japan',
  'China',
];

// Payment Configuration
export const STRIPE_PUBLISHABLE_KEY = isDevelopment
  ? ''
  : ''; // Replace with actual live key

// Firebase Configuration
export const FIREBASE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: '',
};

// Console Protection
export const SHOW_CONSOLE_WARNING = true;

// Apply console protection if enabled
if (SHOW_CONSOLE_WARNING && !isDevelopment) {
  const noop = () => {};
  console.log = noop;
  console.warn = noop;
  console.error = noop;
}

// Environment
export const APP_ENV = {
  isDevelopment,
  isProduction: !isDevelopment,
  platform: Platform.OS,
};

// Export all configuration
export default {
  API_CONFIG,
  TAX_AMOUNT,
  FREE_DELIVERY_THRESHOLD,
  SHIPPING_FEE,
  AVAILABLE_COUNTRIES,
  STRIPE_PUBLISHABLE_KEY,
  FIREBASE_CONFIG,
  SHOW_CONSOLE_WARNING,
  APP_ENV,
  // Helper functions
  calculateShippingCost,
  calculateTax,
  calculateOrderTotal,
  getApiBaseUrl,
};
