import { useCartStore, CartState } from '../store';

// Custom hook for cart functionality that mimics the old useCart interface
export const useCart = () => {
  const cartItems = useCartStore((state: CartState) => state.cartItems);
  const cartItemsWithQuantities = useCartStore(
    (state: CartState) => state.cartItemsWithQuantities,
  );
  const addToCart = useCartStore((state: CartState) => state.addToCart);
  const removeFromCart = useCartStore(
    (state: CartState) => state.removeFromCart,
  );
  const updateQuantity = useCartStore(
    (state: CartState) => state.updateCartItemQuantity,
  );
  const clearCart = useCartStore((state: CartState) => state.clearCart);
  const cartCount = useCartStore((state: CartState) => state.getCartCount());
  const totalPrice = useCartStore((state: CartState) => state.getTotalPrice());
  const isLoading = useCartStore((state: CartState) => state.isLoading);
  const getCartItemQuantity = useCartStore(
    (state: CartState) => state.getCartItemQuantity,
  );
  const isInCart = useCartStore((state: CartState) => state.isInCart);
  const syncCartFromServer = useCartStore(
    (state: CartState) => state.syncCartFromServer,
  );

  return {
    cartItems,
    cartItemsWithQuantities,
    cartCount,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isLoading,
    getCartItemQuantity,
    isInCart,
    syncCartFromServer,
  };
};

export default useCart;
