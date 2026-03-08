import { NativeModules, Platform } from 'react-native';

// Environment Configuration for Babymart Mobile App
// This configuration matches the web app structure

// API Configuration
const isDevelopment = __DEV__;

// Optional manual override: set your dev machine LAN IP so physical devices can reach it.
// Example override: '192.168.1.4'
const DEV_HOST_OVERRIDE = '192.168.1.12';    /// pc IP address from wifi lan connected.

// Use Metro bundle host when available so physical devices hit your dev box over LAN.
const getDevHost = () => {
  if (DEV_HOST_OVERRIDE) return DEV_HOST_OVERRIDE;
  const scriptURL = NativeModules?.SourceCode?.scriptURL as string | undefined;
  const match = scriptURL?.match(/https?:\/\/([^/:]+)/);
  if (match?.[1]) return match[1];
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
};

const DEV_API_PORT = process.env.API_PORT || '8000';
const DEV_API_PATH = '/api';

export const getApiBaseUrl = (): string => {
  if (isDevelopment) {
    const host = getDevHost();
    return `http://${host}:${DEV_API_PORT}${DEV_API_PATH}`;
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
export const CURRENCY_SYMBOL = '₹';

export const formatPrice = (
  amount: number,
  fractionDigits: number = 2,
): string => `${CURRENCY_SYMBOL}${amount.toFixed(fractionDigits)}`;

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
  "India",
  'Bangladesh',
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  // 'India',
  'Japan',
  'China',
];

// Payment Configuration
export const STRIPE_PUBLISHABLE_KEY = isDevelopment
  ? ''
  : ''; // Replace with actual live key

// Razorpay Configuration
export const RAZORPAY_KEY_ID = isDevelopment
  ? ''
  : ''; // Set your Razorpay key ID for the respective environment

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
  CURRENCY_SYMBOL,
  AVAILABLE_COUNTRIES,
  STRIPE_PUBLISHABLE_KEY,
  RAZORPAY_KEY_ID,
  FIREBASE_CONFIG,
  SHOW_CONSOLE_WARNING,
  APP_ENV,
  // Helper functions
  calculateShippingCost,
  calculateTax,
  calculateOrderTotal,
  getApiBaseUrl,
};
