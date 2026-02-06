import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, User, Order } from '../../types';
import {
  cartAPI,
  CartItem as APICartItem,
  authAPI,
  orderAPI,
  wishlistAPI,
} from '../services/api';

// Cart state with Product and quantity
interface CartProductWithQuantity {
  product: Product;
  quantity: number;
}

// Helper function to map API cart item to our Product format
const mapCartItemToProduct = (item: APICartItem): CartProductWithQuantity => ({
  product: {
    _id: item.productId._id,
    name: item.productId.name,
    description: item.productId.description,
    price: item.productId.price,
    image: item.productId.image,
    category: item.productId.category,
    brand: item.productId.brand,
    stock: item.productId.stock,
    rating: item.productId.rating,
    numReviews: item.productId.numReviews,
  },
  quantity: item.quantity,
});

// Cart State interface
interface CartState {
  cartItems: Product[];
  cartItemsWithQuantities: CartProductWithQuantity[];
  isLoading: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateCartItemQuantity: (
    productId: string,
    quantity: number,
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  setCartItems: (items: CartProductWithQuantity[]) => void;
  getCartItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
  getCartCount: () => number;
  getTotalPrice: () => number;
  syncCartFromServer: () => Promise<void>;
}

// User State interface
interface UserState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  auth_token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: { name?: string; avatar?: string }) => Promise<void>;
  setUser: (user: User | null) => void;
  setAuthToken: (token: string | null) => void;
  checkStoredAuth: () => Promise<void>;
}

// Order State interface
interface OrderState {
  orders: Order[];
  isLoading: boolean;
  syncOrdersFromServer: () => Promise<void>;
  getOrderCount: () => number;
  addOrder: (order: Order) => void;
  clearOrders: () => void;
}

// Create User Store first (needed by cart and order stores)
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      auth_token: null,

      setUser: user => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      setAuthToken: token => {
        set({ auth_token: token });
      },

      checkStoredAuth: async () => {
        try {
          set({ isLoading: true });
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            const user = JSON.parse(storedUser);
            // Verify token is still valid
            try {
              await authAPI.getUserProfile(user.token);
              set({
                user,
                auth_token: user.token,
                isAuthenticated: true,
                isLoading: false,
              });

              // Sync cart and orders after auth verification
              const { syncCartFromServer } = useCartStore.getState();
              const { syncOrdersFromServer } = useOrderStore.getState();
              const { syncWishlistFromServer } = useWishlistStore.getState();
              await Promise.all([
                syncCartFromServer(),
                syncOrdersFromServer(),
                syncWishlistFromServer(),
              ]);
            } catch (error) {
              // Token is invalid, remove stored user
              await AsyncStorage.removeItem('user');
              set({
                user: null,
                auth_token: null,
                isAuthenticated: false,
                isLoading: false,
              });
            }
          } else {
            set({
              user: null,
              auth_token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            user: null,
            auth_token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      login: async (email, password) => {
        try {
          set({ isLoading: true });
          const user = await authAPI.login({ email, password });
          await AsyncStorage.setItem('user', JSON.stringify(user));
          set({
            user,
            auth_token: user.token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Sync cart and orders after login
          const { syncCartFromServer } = useCartStore.getState();
          const { syncOrdersFromServer } = useOrderStore.getState();
          const { syncWishlistFromServer } = useWishlistStore.getState();
          await Promise.all([
            syncCartFromServer(),
            syncOrdersFromServer(),
            syncWishlistFromServer(),
          ]);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (name, email, password) => {
        try {
          set({ isLoading: true });
          const user = await authAPI.register({ name, email, password });
          await AsyncStorage.setItem('user', JSON.stringify(user));
          set({
            user,
            auth_token: user.token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Sync cart and orders after registration
          const { syncCartFromServer } = useCartStore.getState();
          const { syncOrdersFromServer } = useOrderStore.getState();
          const { syncWishlistFromServer } = useWishlistStore.getState();
          await Promise.all([
            syncCartFromServer(),
            syncOrdersFromServer(),
            syncWishlistFromServer(),
          ]);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithGoogle: async () => {
        try {
          set({ isLoading: true });

          // Import dynamically to avoid initialization issues
          const { googleAuthService } = await import(
            '../services/googleAuthService'
          );

          // Sign in with Google
          const googleUser = await googleAuthService.signIn();

          if (!googleUser) {
            throw new Error('Google sign-in was cancelled or failed');
          }

          // Convert to backend format
          const backendUserData =
            googleAuthService.convertToBackendUser(googleUser);

          console.log('🔐 Authenticating with backend...');

          // Authenticate with backend
          const user = await authAPI.oauthAuthentication(backendUserData);

          await AsyncStorage.setItem('user', JSON.stringify(user));
          set({
            user,
            auth_token: user.token,
            isAuthenticated: true,
            isLoading: false,
          });

          console.log('✅ OAuth login successful');

          // Sync cart and orders after login
          const { syncCartFromServer } = useCartStore.getState();
          const { syncOrdersFromServer } = useOrderStore.getState();
          const { syncWishlistFromServer } = useWishlistStore.getState();
          await Promise.all([
            syncCartFromServer(),
            syncOrdersFromServer(),
            syncWishlistFromServer(),
          ]);
        } catch (error: any) {
          set({ isLoading: false });

          // Provide more helpful error messages
          if (error.message?.includes('Authentication mismatch')) {
            throw new Error(
              'This email is already registered with a different sign-in method. ' +
                'Please use your original sign-in method or contact support.',
            );
          } else if (error.message?.includes('already registered')) {
            throw new Error(error.message);
          } else if (error.message?.includes('cancel')) {
            throw error; // Pass through cancellation errors
          } else {
            console.error('❌ OAuth login error:', error);
            throw new Error('Failed to sign in with Google. Please try again.');
          }
        }
      },

      logout: async () => {
        const { auth_token } = get();
        try {
          if (auth_token) {
            await authAPI.logout(auth_token);
          }
        } catch (error) {
          // Continue with logout even if API call fails
          console.error('Logout API call failed:', error);
        } finally {
          await AsyncStorage.removeItem('user');
          set({
            user: null,
            auth_token: null,
            isAuthenticated: false,
            isLoading: false,
          });

          // Clear cart and orders after logout
          const { setCartItems } = useCartStore.getState();
          const { clearOrders } = useOrderStore.getState();
          setCartItems([]);
          clearOrders();

          // Clear wishlist after logout
          useWishlistStore.setState({
            wishlistIds: [],
            wishlistProducts: [],
          });
        }
      },

      refreshUser: async () => {
        const { auth_token } = get();
        if (!auth_token) return;

        try {
          const updatedUser = await authAPI.getUserProfile(auth_token);
          const userWithToken = { ...updatedUser, token: auth_token };

          await AsyncStorage.setItem('user', JSON.stringify(userWithToken));
          set({ user: userWithToken });
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },

      updateProfile: async (updates: { name?: string; avatar?: string }) => {
        const { user, auth_token } = get();
        if (!user || !auth_token) {
          throw new Error('User not authenticated');
        }

        try {
          set({ isLoading: true });
          const updatedUser = await authAPI.updateUser(
            user._id,
            updates,
            auth_token,
          );
          const userWithToken = { ...updatedUser, token: auth_token };

          await AsyncStorage.setItem('user', JSON.stringify(userWithToken));
          set({
            user: userWithToken,
            isLoading: false,
          });
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message || 'Failed to update profile');
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// Create Cart Store
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartItems: [],
      cartItemsWithQuantities: [],
      isLoading: false,

      addToCart: async (product, quantity = 1) => {
        const { auth_token } = useUserStore.getState();
        if (!auth_token) {
          throw new Error('Authentication required');
        }

        const productId = product._id;

        set({ isLoading: true });
        try {
          const response = await cartAPI.addToCart(
            auth_token,
            productId,
            quantity,
          );

          if (response.success) {
            const cartItemsWithQuantities =
              response.cart.map(mapCartItemToProduct);

            set({
              cartItemsWithQuantities,
              cartItems: cartItemsWithQuantities.map(item => item.product),
            });
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          console.error('❌ Add to cart error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      removeFromCart: async productId => {
        const { auth_token } = useUserStore.getState();
        if (!auth_token) {
          throw new Error('Authentication required');
        }

        set({ isLoading: true });
        try {
          const response = await cartAPI.removeFromCart(auth_token, productId);

          if (response.success) {
            const cartItemsWithQuantities =
              response.cart.map(mapCartItemToProduct);

            set({
              cartItemsWithQuantities,
              cartItems: cartItemsWithQuantities.map(item => item.product),
            });
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          console.error('❌ Remove from cart error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateCartItemQuantity: async (productId, quantity) => {
        const { auth_token } = useUserStore.getState();
        if (!auth_token) {
          throw new Error('Authentication required');
        }

        set({ isLoading: true });
        try {
          const response = await cartAPI.updateCartItem(
            auth_token,
            productId,
            quantity,
          );

          if (response.success) {
            const cartItemsWithQuantities =
              response.cart.map(mapCartItemToProduct);

            set({
              cartItemsWithQuantities,
              cartItems: cartItemsWithQuantities.map(item => item.product),
            });
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          console.error('❌ Update cart item error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearCart: async () => {
        const { auth_token } = useUserStore.getState();
        if (!auth_token) {
          throw new Error('Authentication required');
        }

        set({ isLoading: true });
        try {
          const response = await cartAPI.clearCart(auth_token);

          if (response.success) {
            set({
              cartItemsWithQuantities: [],
              cartItems: [],
            });
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          console.error('❌ Clear cart error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      setCartItems: items => {
        set({
          cartItemsWithQuantities: items,
          cartItems: items.map(item => item.product),
        });
      },

      getCartItemQuantity: productId => {
        const state = get();
        const cartItem = state.cartItemsWithQuantities.find(
          item => item.product._id === productId,
        );
        return cartItem ? cartItem.quantity : 0;
      },

      isInCart: productId => {
        const state = get();
        return state.cartItems.some(item => item._id === productId);
      },

      getCartCount: () => {
        const state = get();
        // Return the number of unique products in cart, not total quantity
        return state.cartItemsWithQuantities.length;
      },

      getTotalPrice: () => {
        const state = get();
        return state.cartItemsWithQuantities.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0,
        );
      },

      syncCartFromServer: async () => {
        const { auth_token } = useUserStore.getState();
        if (!auth_token) {
          set({ cartItems: [], cartItemsWithQuantities: [] });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await cartAPI.getUserCart(auth_token);

          if (response.success) {
            const cartItemsWithQuantities =
              response.cart.map(mapCartItemToProduct);

            set({
              cartItemsWithQuantities,
              cartItems: cartItemsWithQuantities.map(item => item.product),
            });
          }
        } catch (error) {
          console.error('❌ Sync cart from server error:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// Create Order Store
export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      isLoading: false,

      syncOrdersFromServer: async () => {
        const { auth_token } = useUserStore.getState();
        if (!auth_token) {
          set({ orders: [] });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await orderAPI.getUserOrders(auth_token);

          if (response.success && response.orders) {
            set({ orders: response.orders });
          } else {
            console.error('❌ Failed to sync orders:', response.message);
            set({ orders: [] });
          }
        } catch (error) {
          console.error('❌ Sync orders error:', error);
          set({ orders: [] });
        } finally {
          set({ isLoading: false });
        }
      },

      getOrderCount: () => {
        const state = get();
        return state.orders.length;
      },

      addOrder: (order: Order) => {
        const state = get();
        set({ orders: [order, ...state.orders] });
      },

      clearOrders: () => {
        set({ orders: [] });
      },
    }),
    {
      name: 'order-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// Wishlist State interface
interface WishlistState {
  wishlistIds: string[];
  wishlistProducts: Product[];
  isLoading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  syncWishlistFromServer: () => Promise<void>;
  fetchWishlistProducts: (page?: number, limit?: number) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  getWishlistCount: () => number;
}

// Create Wishlist Store
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlistIds: [],
      wishlistProducts: [],
      isLoading: false,

      addToWishlist: async (productId: string) => {
        const { auth_token } = useUserStore.getState();
        if (!auth_token) {
          throw new Error('Authentication required');
        }

        set({ isLoading: true });
        try {
          const response = await wishlistAPI.addToWishlist(
            auth_token,
            productId,
          );

          if (response.success) {
            set({ wishlistIds: response.wishlist });
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          console.error('❌ Add to wishlist error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      removeFromWishlist: async (productId: string) => {
        const { auth_token } = useUserStore.getState();
        if (!auth_token) {
          throw new Error('Authentication required');
        }

        set({ isLoading: true });
        try {
          const response = await wishlistAPI.removeFromWishlist(
            auth_token,
            productId,
          );

          if (response.success) {
            set({
              wishlistIds: response.wishlist,
              wishlistProducts: get().wishlistProducts.filter(
                p => p._id !== productId,
              ),
            });
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          console.error('❌ Remove from wishlist error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearWishlist: async () => {
        const { auth_token } = useUserStore.getState();
        if (!auth_token) {
          throw new Error('Authentication required');
        }

        set({ isLoading: true });
        try {
          const response = await wishlistAPI.clearWishlist(auth_token);

          if (response.success) {
            set({ wishlistIds: [], wishlistProducts: [] });
          } else {
            throw new Error(response.message);
          }
        } catch (error) {
          console.error('❌ Clear wishlist error:', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      syncWishlistFromServer: async () => {
        const { auth_token } = useUserStore.getState();
        if (!auth_token) {
          set({ wishlistIds: [], wishlistProducts: [] });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await wishlistAPI.getUserWishlist(auth_token);

          if (response.success) {
            set({ wishlistIds: response.wishlist });
          }
        } catch (error) {
          console.error('❌ Sync wishlist from server error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchWishlistProducts: async (page = 1, limit = 20) => {
        const { auth_token } = useUserStore.getState();
        const { wishlistIds } = get();

        if (!auth_token || wishlistIds.length === 0) {
          set({ wishlistProducts: [] });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await wishlistAPI.getWishlistProducts(
            auth_token,
            wishlistIds,
            page,
            limit,
          );

          if (response.success) {
            set({ wishlistProducts: response.products });
          }
        } catch (error) {
          console.error('❌ Fetch wishlist products error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      isInWishlist: (productId: string) => {
        const state = get();
        return state.wishlistIds.includes(productId);
      },

      getWishlistCount: () => {
        const state = get();
        return state.wishlistIds.length;
      },
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// Export types for convenience
export type {
  CartProductWithQuantity,
  CartState,
  UserState,
  OrderState,
  WishlistState,
};
