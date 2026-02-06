import { useState, useEffect, useCallback } from 'react';
import {
  authAPI,
  productAPI,
  categoryAPI,
  brandAPI,
  ProductsResponse,
} from '../services/api';
import { User, Product, Category, Brand } from '../../types';

// Generic hook for API calls with loading and error states
export function useAsyncData<T>(asyncFunction: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  useEffect(() => {
    execute();
  }, [execute]);

  const refetch = () => execute();

  return { data, loading, error, refetch };
}

// Hook for authentication operations
export const useAuthOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (
    email: string,
    password: string,
  ): Promise<User | null> => {
    try {
      setLoading(true);
      setError(null);
      const user = await authAPI.login({ email, password });
      return user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
  ): Promise<User | null> => {
    try {
      setLoading(true);
      setError(null);
      const user = await authAPI.register({ name, email, password });
      return user;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (token: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await authAPI.logout(token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, register, logout, loading, error };
};

// Hook for products with pagination
export const useProducts = (page: number = 1, limit: number = 20) => {
  const {
    data: productsResponse,
    loading,
    error,
    refetch,
  } = useAsyncData<ProductsResponse>(() => productAPI.getProducts(page, limit));

  return {
    products: productsResponse?.products || [],
    total: productsResponse?.total || 0,
    loading,
    error,
    refetch,
  };
};

// Hook for products with infinite loading/pagination
export const useProductsPaginated = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      try {
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const response = await productAPI.getProducts(pageNum, 20);

        setTotal(response.total);
        setHasMore(response.products.length === 20);

        if (reset || pageNum === 1) {
          setProducts(response.products);
          setPage(1);
        } else {
          setProducts(prev => [...prev, ...response.products]);
          setPage(pageNum);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch products',
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchProducts(page + 1, false);
    }
  }, [fetchProducts, page, loadingMore, hasMore]);

  const refresh = useCallback(() => {
    fetchProducts(1, true);
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts(1, true);
  }, [fetchProducts]);

  return {
    products,
    total,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
};

// Hook for a single product
export const useProduct = (productId: string) => {
  const fetchProduct = useCallback(() => {
    return productAPI.getProductById(productId);
  }, [productId]);

  const {
    data: product,
    loading,
    error,
    refetch,
  } = useAsyncData<Product>(fetchProduct);

  return { product, loading, error, refetch };
};

// Hook for user profile
export const useUserProfile = (token: string | null) => {
  const {
    data: user,
    loading,
    error,
    refetch,
  } = useAsyncData<User | null>(() =>
    token ? authAPI.getUserProfile(token) : Promise.resolve(null),
  );

  return { user, loading, error, refetch };
};

// Hook for categories
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryAPI.getCategories();
      setCategories(response.categories || []);
      setTotal(response.total || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch categories',
      );
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const refetch = useCallback(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    total,
    loading,
    error,
    refetch,
  };
};

// Hook for brands
export const useBrands = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await brandAPI.getBrands();
      setBrands(response || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch brands');
      console.error('Error fetching brands:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const refetch = useCallback(() => {
    fetchBrands();
  }, [fetchBrands]);

  return {
    brands,
    loading,
    error,
    refetch,
  };
};
