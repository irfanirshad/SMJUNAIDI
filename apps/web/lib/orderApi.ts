const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/";

const getApiUrl = (endpoint: string) => {
  const base = API_BASE_URL.replace(/\/$/, "");
  const path = endpoint.startsWith("/api") ? endpoint : `/api${endpoint}`;
  return `${base}${path}`;
};

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface StatusUpdate {
  timestamp: string;
  by?: {
    _id: string;
    name: string;
    role: string;
  };
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status:
    | "pending"
    | "address_confirmed"
    | "confirmed"
    | "processing"
    | "packed"
    | "shipped"
    | "delivering"
    | "delivered"
    | "completed"
    | "cancelled";
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  paymentMethod?: "razorpay" | "cod";
  shippingAddress: ShippingAddress;
  paymentIntentId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  isPaid?: boolean;
  payment_info?: {
    gateway?: "razorpay" | "cod";
    razorpay?: {
      orderId?: string;
      paymentId?: string;
      signature?: string;
      method?: string;
      cardLast4?: string;
      cardNetwork?: string;
      vpa?: string;
    };
    paidAmount?: number;
    currency?: string;
    paidAt?: string;
  };
  status_updates?: {
    pending?: StatusUpdate;
    address_confirmed?: StatusUpdate;
    confirmed?: StatusUpdate;
    packed?: StatusUpdate;
    delivering?: StatusUpdate;
    delivered?: StatusUpdate;
    completed?: StatusUpdate;
    cancelled?: StatusUpdate;
  };
}

export interface CreateOrderResponse {
  success: boolean;
  order: Order;
  message?: string;
}

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

// Create order from cart
export const createOrderFromCart = async (
  token: string,
  cartItems: CartItem[],
  shippingAddress: ShippingAddress
): Promise<CreateOrderResponse> => {
  try {
    // Validate shipping address has all required fields
    const requiredFields = ["street", "city", "state", "country", "postalCode"];
    const missingFields = requiredFields.filter(
      (field) => !shippingAddress[field as keyof ShippingAddress]
    );

    if (missingFields.length > 0) {
      const error = `Missing required address fields: ${missingFields.join(", ")}`;
      console.error("❌", error);
      console.error("Address received:", shippingAddress);
      throw new Error(error);
    }

    const payload = {
      items: cartItems,
      shippingAddress,
    };

    const response = await fetch(getApiUrl("/orders"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Error response:", errorData);
      throw new Error(errorData.message || "Failed to create order");
    }

    const orderData = await response.json();

    return {
      success: true,
      order: orderData.order || orderData,
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      success: false,
      order: {} as Order,
      message:
        error instanceof Error ? error.message : "Failed to create order",
    };
  }
};

// Get user orders
export const getUserOrders = async (token: string): Promise<Order[]> => {
  try {
    const response = await fetch(getApiUrl("/orders"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch orders");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

// Get all orders (admin/staff)
export const getAllOrders = async (
  token: string,
  params?: {
    page?: number;
    perPage?: number;
    status?: string;
    paymentStatus?: string;
    sortOrder?: string;
  }
): Promise<{ orders: Order[]; total: number; totalPages: number }> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.perPage)
      queryParams.append("perPage", params.perPage.toString());
    if (params?.status) queryParams.append("status", params.status);
    if (params?.paymentStatus)
      queryParams.append("paymentStatus", params.paymentStatus);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const url = getApiUrl(
      `/orders/admin${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
    );
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch orders");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { orders: [], total: 0, totalPages: 0 };
  }
};

// Get order by ID
export const getOrderById = async (
  orderId: string,
  token: string
): Promise<Order | null> => {
  try {
    const response = await fetch(getApiUrl(`/orders/${orderId}`), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch order");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
};

// Delete order
export const deleteOrder = async (
  orderId: string,
  token: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(getApiUrl(`/orders/${orderId}`), {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete order");
    }

    return {
      success: true,
      message: "Order deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting order:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete order",
    };
  }
};

// Update order status (for order fulfillment - admin use)
export const updateOrderStatus = async (
  orderId: string,
  status:
    | "pending"
    | "address_confirmed"
    | "confirmed"
    | "processing"
    | "packed"
    | "shipped"
    | "delivering"
    | "delivered"
    | "completed"
    | "cancelled",
  token: string
): Promise<{ success: boolean; order?: Order; message?: string }> => {
  try {
    const response = await fetch(getApiUrl(`/orders/${orderId}/status`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update order status");
    }

    const data = await response.json();
    return {
      success: true,
      order: data.order,
      message: data.message,
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update order status",
    };
  }
};

// Update payment status (for payment updates - webhook/success page)
export const updatePaymentStatus = async (
  orderId: string,
  status: "paid" | "pending" | "failed" | "refunded",
  token?: string,
  razorpayOrderId?: string,
  razorpayPaymentId?: string,
  razorpaySignature?: string,
  paidAmount?: number,
  currency?: string
): Promise<{ success: boolean; order?: Order; message?: string }> => {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add authorization header only if token is provided
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/orders/${orderId}/webhook-status`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          status,
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          paidAmount,
          currency,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update payment status");
    }

    const data = await response.json();
    return {
      success: true,
      order: data.order,
      message: data.message,
    };
  } catch (error) {
    console.error("Error updating payment status:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update payment status",
    };
  }
};

export const createRazorpayPaymentOrder = async (
  orderId: string,
  amount: number,
  token: string,
  currency?: string
): Promise<
  | { success: true; orderId: string; amount: number; currency: string; keyId: string }
  | { success: false; message: string }
> => {
  try {
    const response = await fetch(getApiUrl(`/payments/razorpay/order`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId, amount, currency }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to create Razorpay order");
    }

    return {
      success: true,
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency,
      keyId: data.keyId,
    };
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create Razorpay order",
    };
  }
};

export const verifyRazorpayPayment = async (
  orderId: string,
  token: string,
  payload: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }
): Promise<{ success: boolean; order?: Order; message?: string }> => {
  try {
    const response = await fetch(getApiUrl(`/payments/razorpay/verify`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId, ...payload }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to verify Razorpay payment");
    }

    return { success: true, order: data.order, message: data.message };
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to verify Razorpay payment",
    };
  }
};
