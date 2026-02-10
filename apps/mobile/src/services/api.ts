import {
  Product,
  User,
  Category,
  Brand,
  CategoriesResponse,
  Order,
  Address,
  ProductType,
  ProductTypesResponse,
} from '../../types';
import { getApiBaseUrl } from '../config/environment';

// Get API Base URL from environment configuration
const API_BASE_URL = getApiBaseUrl();

// Debug: Log the API base URL being used
console.log('🌐 API Base URL:', API_BASE_URL);

export interface ProductsResponse {
  products: Product[];
  total: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface OAuthData {
  name: string;
  email: string;
  avatar?: string;
  authProvider: string;
  authUid: string;
  isOAuthUser: boolean;
}

// Modern API request function
const makeRequest = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<any> => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;

    // Ensure proper headers structure
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    // Add additional headers from options (will override defaults if needed)
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
      body: options.body,
    };

    // Debug logging for payment and order requests
    // if (endpoint.includes('payment') || endpoint.includes('orders')) {
    //   if (options.body) {
    //     console.log('  Body:', options.body);
    //     console.log('  Body type:', typeof options.body);
    //     if (typeof options.body === 'string') {
    //       console.log('  Body length:', options.body.length);
    //     }
    //   }
    //   console.log('  Full request options:', requestOptions);
    // }

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      let errorMessage = 'An error occurred';
      let errorDetails = null;
      try {
        const errorData = await response.json();
        errorMessage =
          errorData.message || `HTTP error! status: ${response.status}`;
        errorDetails = errorData;
      } catch {
        errorMessage = `HTTP error! status: ${response.status}`;
      }

      console.error('API Error:', response.status, errorMessage);

      // Log more details for OAuth errors
      if (endpoint.includes('oauth')) {
        console.error('OAuth Error Details:', {
          status: response.status,
          message: errorMessage,
          details: errorDetails,
        });
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    return data;
  } catch (error) {
    console.error('Network Error:', error);
    if (
      error instanceof TypeError &&
      error.message === 'Network request failed'
    ) {
      throw new Error(
        'Unable to connect to server. Please check if the server is running.',
      );
    }
    throw error;
  }
};

// Modern functional API methods
export const authAPI = {
  login: async (loginData: LoginData): Promise<User> =>
    makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    }),

  register: async (registerData: RegisterData): Promise<User> =>
    makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerData),
    }),

  oauthAuthentication: async (oauthData: OAuthData): Promise<User> => {
    const response = await makeRequest('/auth/oauth', {
      method: 'POST',
      body: JSON.stringify(oauthData),
    });

    // OAuth endpoint returns { success: true, data: { token, ...userData } }
    // Extract the data object if it exists
    return response.data || response;
  },

  getUserProfile: async (token: string): Promise<User> =>
    makeRequest('/auth/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  updateUser: async (
    userId: string,
    updates: { name?: string; avatar?: string },
    token: string,
  ): Promise<User> =>
    makeRequest(`/users/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    }),

  logout: async (token: string): Promise<void> =>
    makeRequest('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
};

export const productAPI = {
  getProducts: async (
    page: number = 1,
    limit: number = 20,
    filters?: {
      category?: string;
      brand?: string;
      priceMin?: number;
      priceMax?: number;
      search?: string;
      sortOrder?: 'asc' | 'desc';
      productType?: string;
    },
  ): Promise<ProductsResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters) {
      if (filters.category) params.append('category', filters.category);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.priceMin)
        params.append('priceMin', filters.priceMin.toString());
      if (filters.priceMax)
        params.append('priceMax', filters.priceMax.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
      if (filters.productType)
        params.append('productType', filters.productType);
    }

    return makeRequest(`/products?${params.toString()}`);
  },

  getProductById: async (id: string): Promise<Product> =>
    makeRequest(`/products/${id}`),

  // Get product name suggestions for search
  getProductNameSuggestions: async (searchTerm: string): Promise<string[]> => {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    try {
      const response = await makeRequest(
        `/products?page=1&limit=10&search=${encodeURIComponent(searchTerm)}`,
      );

      // Extract unique product names from the response
      const productNames = response.products
        .map((product: Product) => product.name)
        .filter(
          (name: string, index: number, array: string[]) =>
            array.indexOf(name) === index,
        )
        .slice(0, 5); // Limit to 5 suggestions

      return productNames;
    } catch (error) {
      console.error('Error fetching product name suggestions:', error);
      return [];
    }
  },

  searchByImage: async (formData: FormData): Promise<ProductsResponse> => {
    const url = `${API_BASE_URL}/products/search-by-image`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Image search failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Image search error:', error);
      throw error;
    }
  },
};

export const categoryAPI = {
  getCategories: async (
    params?: {
      page?: number;
      perPage?: number;
      search?: string;
      sortOrder?: string;
    },
    token?: string,
  ): Promise<CategoriesResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.perPage)
      queryParams.append('perPage', params.perPage.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const headers: any = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return makeRequest(`/categories/?${queryParams.toString()}`, {
      headers,
    });
  },

  getCategoryById: async (id: string): Promise<Category> =>
    makeRequest(`/categories/${id}`),

  createCategory: async (categoryData: any, token: string): Promise<Category> =>
    makeRequest('/categories', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(categoryData),
    }),

  updateCategory: async (
    id: string,
    categoryData: any,
    token: string,
  ): Promise<Category> =>
    makeRequest(`/categories/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(categoryData),
    }),

  deleteCategory: async (id: string, token: string): Promise<any> =>
    makeRequest(`/categories/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
};

export const bannerAPI = {
  getBanners: async (): Promise<any[]> => {
    return makeRequest('/banners');
  },
};

export const adsBannerAPI = {
  getAdsBanners: async (): Promise<any> => {
    return makeRequest('/ads-banners');
  },
};

export const productTypeAPI = {
  getProductTypes: async (): Promise<ProductTypesResponse> => {
    return makeRequest('/product-types');
  },

  getProductTypeById: async (id: string): Promise<ProductType> => {
    return makeRequest(`/product-types/${id}`);
  },
};

export const brandAPI = {
  getBrands: async (
    params?: {
      page?: number;
      perPage?: number;
      search?: string;
      sortOrder?: string;
    },
    token?: string,
  ): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.perPage)
      queryParams.append('perPage', params.perPage.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const headers: any = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return makeRequest(`/brands/?${queryParams.toString()}`, {
      headers,
    });
  },

  getBrandById: async (id: string): Promise<Brand> =>
    makeRequest(`/brands/${id}`),

  createBrand: async (brandData: any, token: string): Promise<Brand> =>
    makeRequest('/brands', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(brandData),
    }),

  updateBrand: async (
    id: string,
    brandData: any,
    token: string,
  ): Promise<Brand> =>
    makeRequest(`/brands/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(brandData),
    }),

  deleteBrand: async (id: string, token: string): Promise<any> =>
    makeRequest(`/brands/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
};

// Cart API functions
export interface CartItem {
  productId: {
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: {
      _id: string;
      name: string;
    };
    brand: string;
    stock: number;
    rating: number;
    numReviews: number;
  };
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  cart: CartItem[];
  message: string;
}

export const cartAPI = {
  getUserCart: async (token: string): Promise<CartResponse> => {
    try {
      // Direct fetch call for consistency
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Get cart response error:', errorData);
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();

      return {
        success: true,
        cart: data.cart || [],
        message: data.message || 'Cart retrieved successfully',
      };
    } catch (error) {
      console.error('Get cart error:', error);
      return {
        success: false,
        cart: [],
        message: 'Failed to get cart',
      };
    }
  },

  addToCart: async (
    token: string,
    productId: string,
    quantity: number = 1,
  ): Promise<CartResponse> => {
    try {
      // Direct fetch call like the client
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Response error:', errorData);
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();

      return {
        success: true,
        cart: data.cart || [],
        message: data.message || 'Item added to cart successfully',
      };
    } catch (error) {
      console.error('❌ Cart API - Error:', error);
      return {
        success: false,
        cart: [],
        message:
          error instanceof Error ? error.message : 'Failed to add to cart',
      };
    }
  },

  updateCartItem: async (
    token: string,
    productId: string,
    quantity: number,
  ): Promise<CartResponse> => {
    try {
      // Direct fetch call like addToCart for consistency
      const response = await fetch(`${API_BASE_URL}/cart/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Update cart response error:', errorData);
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();

      return {
        success: true,
        cart: data.cart || [],
        message: data.message || 'Cart item updated successfully',
      };
    } catch (error) {
      console.error('Update cart item error:', error);
      return {
        success: false,
        cart: [],
        message: 'Failed to update cart item',
      };
    }
  },

  removeFromCart: async (
    token: string,
    productId: string,
  ): Promise<CartResponse> => {
    try {
      // Direct fetch call for consistency
      const response = await fetch(`${API_BASE_URL}/cart/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Remove cart response error:', errorData);
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();

      return {
        success: true,
        cart: data.cart || [],
        message: data.message || 'Item removed from cart successfully',
      };
    } catch (error) {
      console.error('Remove from cart error:', error);
      return {
        success: false,
        cart: [],
        message: 'Failed to remove from cart',
      };
    }
  },

  clearCart: async (token: string): Promise<CartResponse> => {
    try {
      // Direct fetch call for consistency
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Clear cart response error:', errorData);
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();

      return {
        success: true,
        cart: [],
        message: data.message || 'Cart cleared successfully',
      };
    } catch (error) {
      console.error('Clear cart error:', error);
      return {
        success: false,
        cart: [],
        message: 'Failed to clear cart',
      };
    }
  },
};

// Order API
export const orderAPI = {
  // Create a new order
  createOrder: async (
    token: string,
    orderData: {
      items: {
        _id: string;
        name: string;
        price: number;
        quantity: number;
        image: string;
      }[];
      shippingAddress: Address;
      paymentMethod?: string;
    },
  ): Promise<{ success: boolean; order?: Order; message: string }> => {
    try {
      // Backend expects only items and shippingAddress
      // It calculates total, shipping, and tax on the server side
      const payload = {
        items: orderData.items,
        shippingAddress: orderData.shippingAddress,
        paymentMethod: orderData.paymentMethod,
      };

      const response = await makeRequest('/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        order: response.order || response,
        message: response.message || 'Order created successfully',
      };
    } catch (error) {
      console.error('❌ Create order error details:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create order',
      };
    }
  },

  // Get order by ID
  getOrderById: async (
    token: string,
    orderId: string,
  ): Promise<{ success: boolean; order?: Order; message: string }> => {
    try {
      const data = await makeRequest(`/orders/${orderId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Server returns order directly, not wrapped in an object
      return {
        success: true,
        order: data, // The order is the direct response
        message: 'Order fetched successfully',
      };
    } catch (error) {
      console.error('Get order error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch order',
      };
    }
  },

  // Get user orders
  getUserOrders: async (
    token: string,
  ): Promise<{ success: boolean; orders?: Order[]; message: string }> => {
    try {
      const data = await makeRequest('/orders', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        success: true,
        orders: Array.isArray(data) ? data : data.orders || [], // Handle direct array response
        message: data.message || 'Orders fetched successfully',
      };
    } catch (error) {
      console.error('Get user orders error:', error);
      return {
        success: false,
        orders: [],
        message:
          error instanceof Error ? error.message : 'Failed to fetch orders',
      };
    }
  },

  // Update order status
  updateOrderStatus: async (
    token: string,
    orderId: string,
    status: 'pending' | 'paid' | 'completed' | 'cancelled',
    paymentIntentId?: string,
    stripeSessionId?: string,
  ): Promise<{ success: boolean; order?: Order; message: string }> => {
    try {
      console.log('🔄 Updating order status:', {
        orderId,
        status,
        paymentIntentId,
      });

      const data = await makeRequest(`/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          paymentIntentId,
          stripeSessionId,
        }),
      });

      console.log('✅ Order status updated:', data);

      return {
        success: true,
        order: data.order || data, // Handle direct order response
        message: data.message || 'Order status updated successfully',
      };
    } catch (error) {
      console.error('❌ Update order status error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update order status',
      };
    }
  },

  // Update order payment status (webhook endpoint)
  updateOrderPaymentStatus: async (
    token: string,
    orderId: string,
    status: 'paid' | 'pending' | 'failed' | 'refunded',
    paymentIntentId?: string,
    stripeSessionId?: string,
  ): Promise<{ success: boolean; order?: Order; message: string }> => {
    try {
      console.log('💳 Updating order payment status:', {
        orderId,
        status,
        paymentIntentId,
      });

      const data = await makeRequest(`/orders/${orderId}/webhook-status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          paymentIntentId,
          stripeSessionId,
        }),
      });

      console.log('✅ Order payment status updated:', data);

      return {
        success: true,
        order: data.order || data,
        message: data.message || 'Payment status updated successfully',
      };
    } catch (error) {
      console.error('❌ Update payment status error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update payment status',
      };
    }
  },
};

// Address API
export const addressAPI = {
  // Get user addresses
  getUserAddresses: async (
    token: string,
  ): Promise<{ success: boolean; addresses?: Address[]; message: string }> => {
    try {
      // Get user profile to access addresses
      const data = await makeRequest('/auth/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        success: true,
        addresses: data.addresses || [],
        message: 'Addresses fetched successfully',
      };
    } catch (error) {
      console.error('Get addresses error:', error);
      return {
        success: false,
        addresses: [],
        message:
          error instanceof Error ? error.message : 'Failed to fetch addresses',
      };
    }
  },

  // Add new address
  addAddress: async (
    token: string,
    addressData: Omit<Address, '_id'>,
  ): Promise<{ success: boolean; address?: Address; message: string }> => {
    try {
      // First get the user profile to get the user ID using direct fetch

      const profileResponse = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(
          errorData.message ||
            `Profile fetch failed: ${profileResponse.status}`,
        );
      }

      const profileData = await profileResponse.json();

      if (!profileData._id) {
        throw new Error('Could not get user ID from profile');
      }

      const userId = profileData._id;

      // Now add the address using direct fetch (like cart API)
      const endpoint = `${API_BASE_URL}/users/${userId}/addresses`;
      const requestBody = JSON.stringify(addressData);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: requestBody,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Server error response:', errorData);
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();

      // The server returns { success: true, addresses: [...], message: "..." }
      // We need to extract the newly added address (the last one)
      const newAddress =
        data.addresses && data.addresses.length > 0
          ? data.addresses[data.addresses.length - 1]
          : null;

      return {
        success: true,
        address: newAddress,
        message: data.message || 'Address added successfully',
      };
    } catch (error) {
      console.error('❌ Add address error details:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to add address',
      };
    }
  },

  // Delete address
  deleteAddress: async (
    token: string,
    addressId: string,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // First get the user profile to get the user ID

      const profileResponse = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(
          errorData.message ||
            `Profile fetch failed: ${profileResponse.status}`,
        );
      }

      const profileData = await profileResponse.json();

      if (!profileData._id) {
        throw new Error('Could not get user ID from profile');
      }

      const userId = profileData._id;

      // Now delete the address
      const endpoint = `${API_BASE_URL}/users/${userId}/addresses/${addressId}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Delete server error response:', errorData);
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      const data = await response.json();

      return {
        success: true,
        message: data.message || 'Address deleted successfully',
      };
    } catch (error) {
      console.error('❌ Delete address error details:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete address',
      };
    }
  },
};

// Payment API
export const paymentAPI = {
  // Create payment intent
  createPaymentIntent: async (
    token: string,
    orderId: string,
    amount: number,
    currency: string = 'usd',
  ): Promise<{
    success: boolean;
    clientSecret?: string;
    paymentIntentId?: string;
    message: string;
  }> => {
    try {
      console.log('💳 Creating payment intent:', { orderId, amount, currency });
      console.log(
        '🌐 Payment API URL:',
        `${API_BASE_URL}/payments/create-intent`,
      );

      const data = await makeRequest('/payments/create-intent', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount,
          currency,
        }),
      });

      console.log('✅ Payment intent created:', data);

      return {
        success: true,
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
        message: data.message || 'Payment intent created successfully',
      };
    } catch (error) {
      console.error('❌ Create payment intent error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create payment intent',
      };
    }
  },

  // Initialize SSLCommerz payment
  initSSLCommerzPayment: async (
    token: string,
    orderId: string,
    amount: number,
    currency: string = 'BDT',
  ): Promise<{
    success: boolean;
    gatewayUrl?: string;
    message: string;
  }> => {
    try {
      console.log('💳 Initializing SSLCommerz payment:', {
        orderId,
        amount,
        currency,
      });

      const data = await makeRequest('/payments/sslcommerz/init', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount,
          currency,
        }),
      });

      console.log('✅ SSLCommerz payment initialized:', data);

      return {
        success: true,
        gatewayUrl: data.gatewayUrl,
        message: data.message || 'Payment initialized successfully',
      };
    } catch (error) {
      console.error('❌ Initialize SSLCommerz payment error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to initialize SSLCommerz payment',
      };
    }
  },

  // Create Razorpay order
  createRazorpayPaymentOrder: async (
    token: string,
    orderId: string,
    amount: number,
    currency?: string,
  ): Promise<
    | {
        success: true;
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
      }
    | { success: false; message: string }
  > => {
    try {
      const data = await makeRequest('/payments/razorpay/order', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, amount, currency }),
      });

      return {
        success: true,
        orderId: data.orderId,
        amount: data.amount,
        currency: data.currency,
        keyId: data.keyId,
      };
    } catch (error) {
      console.error('❌ Create Razorpay order error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create Razorpay order',
      };
    }
  },

  // Verify Razorpay payment
  verifyRazorpayPayment: async (
    token: string,
    orderId: string,
    payload: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
  ): Promise<{ success: boolean; order?: Order; message?: string }> => {
    try {
      const data = await makeRequest('/payments/razorpay/verify', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, ...payload }),
      });

      return {
        success: true,
        order: data.order,
        message: data.message,
      };
    } catch (error) {
      console.error('❌ Verify Razorpay payment error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to verify Razorpay payment',
      };
    }
  },
};

// Legacy export for backward compatibility
export const apiService = {
  ...authAPI,
  getProducts: async (
    page: number = 1,
    limit: number = 20,
    filters?: any,
  ): Promise<Product[]> => {
    const response = await productAPI.getProducts(page, limit, filters);
    return response.products;
  },
  getProductById: productAPI.getProductById,
  getCategories: categoryAPI.getCategories,
  getBrands: brandAPI.getBrands,
  ...cartAPI,
};

// Review API
export const reviewAPI = {
  // Add product review
  addProductReview: async (
    token: string,
    productId: string,
    rating: number,
    comment: string,
  ): Promise<{
    success: boolean;
    message: string;
    review?: any;
  }> => {
    try {
      const data = await makeRequest(`/products/${productId}/review`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      });

      return {
        success: true,
        message: data.message || 'Review submitted successfully',
        review: data.review,
      };
    } catch (error) {
      console.error('❌ Add review error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to add review',
      };
    }
  },

  // Get pending reviews (Admin only)
  getPendingReviews: async (
    token: string,
  ): Promise<{
    success: boolean;
    reviews?: any[];
    message: string;
  }> => {
    try {
      const data = await makeRequest('/products/reviews/pending', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        success: true,
        reviews: data.reviews || [],
        message: data.message || 'Reviews fetched successfully',
      };
    } catch (error) {
      console.error('❌ Get pending reviews error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch pending reviews',
      };
    }
  },

  // Approve or reject review (Admin only)
  approveReview: async (
    token: string,
    productId: string,
    reviewId: string,
    approve: boolean,
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      const data = await makeRequest(
        `/products/${productId}/review/${reviewId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ approve }),
        },
      );

      return {
        success: true,
        message: data.message || 'Review updated successfully',
      };
    } catch (error) {
      console.error('❌ Approve review error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update review',
      };
    }
  },
};

// Wishlist API
export const wishlistAPI = {
  // Get user's wishlist
  getUserWishlist: async (
    token: string,
  ): Promise<{
    success: boolean;
    wishlist: string[];
    message?: string;
  }> => {
    try {
      const data = await makeRequest('/wishlist', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        success: true,
        wishlist: data.wishlist || [],
        message: data.message,
      };
    } catch (error) {
      console.error('❌ Get wishlist error:', error);
      return {
        success: false,
        wishlist: [],
        message:
          error instanceof Error ? error.message : 'Failed to fetch wishlist',
      };
    }
  },

  // Add product to wishlist
  addToWishlist: async (
    token: string,
    productId: string,
  ): Promise<{
    success: boolean;
    wishlist: string[];
    message: string;
  }> => {
    try {
      const data = await makeRequest('/wishlist/add', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      return {
        success: true,
        wishlist: data.wishlist || [],
        message: data.message || 'Added to wishlist',
      };
    } catch (error) {
      console.error('❌ Add to wishlist error:', error);
      return {
        success: false,
        wishlist: [],
        message:
          error instanceof Error ? error.message : 'Failed to add to wishlist',
      };
    }
  },

  // Remove product from wishlist
  removeFromWishlist: async (
    token: string,
    productId: string,
  ): Promise<{
    success: boolean;
    wishlist: string[];
    message: string;
  }> => {
    try {
      const data = await makeRequest('/wishlist/remove', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId }),
      });

      return {
        success: true,
        wishlist: data.wishlist || [],
        message: data.message || 'Removed from wishlist',
      };
    } catch (error) {
      console.error('❌ Remove from wishlist error:', error);
      return {
        success: false,
        wishlist: [],
        message:
          error instanceof Error
            ? error.message
            : 'Failed to remove from wishlist',
      };
    }
  },

  // Get wishlist products with details
  getWishlistProducts: async (
    token: string,
    productIds: string[],
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    success: boolean;
    products: Product[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalProducts: number;
      hasMore: boolean;
      limit: number;
    };
    message?: string;
  }> => {
    try {
      const data = await makeRequest('/wishlist/products', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds, page, limit }),
      });

      return {
        success: true,
        products: data.products || [],
        pagination: data.pagination,
        message: data.message,
      };
    } catch (error) {
      console.error('❌ Get wishlist products error:', error);
      return {
        success: false,
        products: [],
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch wishlist products',
      };
    }
  },

  // Clear entire wishlist
  clearWishlist: async (
    token: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> => {
    try {
      const data = await makeRequest('/wishlist/clear', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return {
        success: true,
        message: data.message || 'Wishlist cleared',
      };
    } catch (error) {
      console.error('❌ Clear wishlist error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to clear wishlist',
      };
    }
  },
};

// Admin API
export const adminAPI = {
  // Get dashboard stats
  getStats: async (token: string): Promise<any> =>
    makeRequest('/stats', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  // Order Management
  getAllOrders: async (
    token: string,
    page: number = 1,
    perPage: number = 20,
    filters?: {
      status?: string;
      paymentStatus?: string;
      search?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<any> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('perPage', perPage.toString());
    if (filters) {
      if (filters.status && filters.status !== 'all')
        params.append('status', filters.status);
      if (filters.paymentStatus && filters.paymentStatus !== 'all')
        params.append('paymentStatus', filters.paymentStatus);
      if (filters.search) params.append('search', filters.search);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    return makeRequest(`/orders/?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  updateOrderStatus: async (
    token: string,
    orderId: string,
    status: string,
    notes?: string,
  ): Promise<any> =>
    makeRequest(`/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, notes }),
    }),

  deleteOrder: async (token: string, orderId: string): Promise<any> =>
    makeRequest(`/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  // Product Management
  createProduct: async (token: string, productData: any): Promise<any> =>
    makeRequest('/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    }),

  updateProduct: async (
    token: string,
    productId: string,
    productData: any,
  ): Promise<any> =>
    makeRequest(`/products/${productId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    }),

  deleteProduct: async (token: string, productId: string): Promise<any> =>
    makeRequest(`/products/${productId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  // User Management
  getAllUsers: async (
    token: string,
    page: number = 1,
    perPage: number = 20,
    filters?: {
      role?: string;
      employee_role?: string;
      search?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<any> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('perPage', perPage.toString());
    if (filters) {
      if (filters.role && filters.role !== 'all')
        params.append('role', filters.role);
      if (filters.employee_role && filters.employee_role !== 'all')
        params.append('employee_role', filters.employee_role);
      if (filters.search) params.append('search', filters.search);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    return makeRequest(`/users?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  createUser: async (token: string, userData: any): Promise<any> =>
    makeRequest('/users', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    }),

  updateUserById: async (
    token: string,
    userId: string,
    userData: any,
  ): Promise<any> =>
    makeRequest(`/users/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    }),

  deleteUser: async (token: string, userId: string): Promise<any> =>
    makeRequest(`/users/${userId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  // Product Management
  getAllProducts: async (
    token: string,
    page: number = 1,
    perPage: number = 20,
    filters?: {
      status?: string;
      category?: string;
      brand?: string;
      search?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<any> => {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
    });

    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.brand) queryParams.append('brand', filters.brand);
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

    const response = await makeRequest(`/products?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Transform response to match expected format
    return {
      products: response.products || [],
      hasMore: response.products?.length === perPage,
      total: response.total || 0,
    };
  },
};

export const analyticsAPI = {
  getOverview: async (token: string): Promise<any> =>
    makeRequest('/analytics/overview', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),

  getProductAnalytics: async (token: string, params?: any): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    return makeRequest(`/analytics/products?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getSalesAnalytics: async (token: string, params?: any): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (params?.period) queryParams.append('period', params.period);
    if (params?.year) queryParams.append('year', params.year.toString());

    return makeRequest(`/analytics/sales?${queryParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getInventoryAlerts: async (
    token: string,
    threshold?: number,
  ): Promise<any> => {
    const queryParams = new URLSearchParams();
    if (threshold) queryParams.append('threshold', threshold.toString());

    return makeRequest(
      `/analytics/inventory-alerts?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
  },
};

// Vendor API
export const vendorAPI = {
  getMyVendorStatus: async (token: string): Promise<any> => {
    return makeRequest('/vendors/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  registerVendor: async (
    token: string,
    data: {
      storeName: string;
      description: string;
      contactEmail: string;
      contactPhone: string;
      address: {
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
      };
    },
  ): Promise<any> => {
    return makeRequest('/vendors', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },

  getDashboardStats: async (token: string): Promise<any> => {
    return makeRequest('/vendors/dashboard/stats', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getMyProducts: async (token: string, status?: string): Promise<any> => {
    const params = status ? `?status=${status}` : '';
    return makeRequest(`/vendors/products${params}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
