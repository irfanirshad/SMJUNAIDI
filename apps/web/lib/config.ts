/**
 * Configuration utility for API endpoints
 * Handles both development and production environments
 */

interface ApiConfig {
  baseUrl: string;
  isProduction: boolean;
}

/**
 * Get API configuration based on environment
 */
export const getApiConfig = (): ApiConfig => {
  // Check if we're in browser or server environment
  const isClient = typeof window !== "undefined";

  let baseUrl: string;

  if (isClient) {
    // Client-side: use NEXT_PUBLIC_API_URL
    baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/";
  } else {
    // Server-side: use API_ENDPOINT or NEXT_PUBLIC_API_URL as fallback
    // During build, NEXT_PUBLIC_API_URL might be the only one available
    baseUrl =
      process.env.API_ENDPOINT ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000/";
  }

  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_APP_ENV === "production";

  return {
    baseUrl,
    isProduction,
  };
};

/**
 * Enhanced fetch function with better error handling
 */
export async function fetchWithConfig<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const { baseUrl } = getApiConfig();

  // Ensure endpoint starts with / and prepend /api
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  const apiEndpoint = normalizedEndpoint.startsWith("/api")
    ? normalizedEndpoint
    : `/api${normalizedEndpoint}`;

  const url = `${baseUrl.replace(/\/$/, "")}${apiEndpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 100 },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options?.headers,
    },
  };

  try {
    const response = await fetch(url, mergedOptions);

    if (!response.ok) {
      // Try to parse error message from response body
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // If parsing fails, use default error message
      }
      throw new Error(errorMessage);
    }

    const data: T = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Get authentication headers for API requests
 */
export const getAuthHeaders = (token?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Build query string from parameters
 */
export const buildQueryString = (
  params: Record<string, string | number | boolean>
): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

/**
 * Common API endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  REFRESH: "/auth/refresh",

  // Products
  PRODUCTS: "/products",
  PRODUCT_BY_ID: (id: string) => `/products/${id}`,

  // Categories
  CATEGORIES: "/categories",
  CATEGORY_BY_ID: (id: string) => `/categories/${id}`,

  // Brands
  BRANDS: "/brands",
  BRAND_BY_ID: (id: string) => `/brands/${id}`,

  // Users
  USERS: "/users",
  USER_BY_ID: (id: string) => `/users/${id}`,
  USER_PROFILE: "/users/profile",

  // Orders
  ORDERS: "/orders",
  ORDER_BY_ID: (id: string) => `/orders/${id}`,
  USER_ORDERS: (userId: string) => `/orders/user/${userId}`,

  // Cart
  CART: "/cart",
  ADD_TO_CART: "/cart/add",
  REMOVE_FROM_CART: "/cart/remove",

  // Stats & Analytics
  STATS: "/stats",
  ANALYTICS: "/analytics",
} as const;
