import { useOrderStore, OrderState } from '../store';

// Custom hook for order functionality
export const useOrders = () => {
  const orders = useOrderStore((state: OrderState) => state.orders);
  const isLoading = useOrderStore((state: OrderState) => state.isLoading);
  const syncOrdersFromServer = useOrderStore(
    (state: OrderState) => state.syncOrdersFromServer,
  );
  const getOrderCount = useOrderStore(
    (state: OrderState) => state.getOrderCount,
  );
  const addOrder = useOrderStore((state: OrderState) => state.addOrder);
  const clearOrders = useOrderStore((state: OrderState) => state.clearOrders);

  return {
    orders,
    isLoading,
    orderCount: getOrderCount(),
    syncOrdersFromServer,
    addOrder,
    clearOrders,
  };
};

export default useOrders;
