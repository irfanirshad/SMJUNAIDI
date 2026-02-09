"use client";
import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Container from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle,
  Package,
  Home,
  Eye,
  Trash2,
  CreditCard,
  RefreshCw,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useUserStore } from "@/lib/store";
import {
  getUserOrders,
  getAllOrders,
  deleteOrder,
  Order,
} from "@/lib/orderApi";
import { OrderTableSkeleton } from "@/components/skeleton/OrderSkeleton";
import OrderDetailsModal from "@/components/pages/OrderDetailsModal";
import PaymentGatewayDialog from "@/components/shared/PaymentGatewayDialog";
import {
  createCheckoutSession,
  redirectToCheckout,
  type StripeCheckoutItem,
} from "@/lib/stripe";

const OrdersPageContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { authUser, auth_token, isAuthenticated, verifyAuth } = useUserStore();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [orderToPay, setOrderToPay] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<string | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<
    "stripe" | "sslcommerz" | null
  >(null);

  const success = searchParams.get("success");
  const orderId = searchParams.get("orderId");

  // Verify authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      setAuthLoading(true);
      if (auth_token && !authUser) {
        await verifyAuth();
      }
      setAuthLoading(false);
    };

    checkAuth();
  }, [auth_token, authUser, verifyAuth]);

  const fetchOrders = useCallback(async () => {
    if (!auth_token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check if user is admin or staff to fetch all orders
      const isAdminOrStaff =
        authUser?.role === "admin" || authUser?.role === "employee";

      if (isAdminOrStaff) {
        // Fetch all orders for admin/staff with pagination
        const result = await getAllOrders(auth_token, {
          page: 1,
          perPage: 100, // Get more orders for admin
          sortOrder: "desc",
        });
        setOrders(result.orders);
      } else {
        // Fetch only user's orders for regular users
        const fetchedOrders = await getUserOrders(auth_token);
        setOrders(fetchedOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [auth_token, authUser]);

  useEffect(() => {
    if (success === "true") {
      toast.success(
        "Payment completed successfully! Your order has been placed."
      );
      // Remove the success params from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("success");
      newSearchParams.delete("orderId");
      router.replace(`/user/orders?${newSearchParams.toString()}`);

      // Refresh orders to get the latest status
      setTimeout(() => {
        fetchOrders();
      }, 1000); // Wait a second for the webhook to process
    }
  }, [success, searchParams, router, fetchOrders]);

  useEffect(() => {
    // Only fetch orders after auth check is complete
    if (!authLoading) {
      fetchOrders();
    }
  }, [fetchOrders, authLoading]);

  // Auto-refresh orders with pending status
  useEffect(() => {
    if (orders.length === 0) return;

    const hasPendingOrders = orders.some((order) => order.status === "pending");
    if (!hasPendingOrders) return;

    // Show a one-time notification about pending orders
    const notificationShown = sessionStorage.getItem(
      "pendingOrderNotification"
    );
    if (!notificationShown) {
      toast.info(
        "Orders with pending status will be automatically updated when payment is confirmed.",
        {
          duration: 5000,
        }
      );
      sessionStorage.setItem("pendingOrderNotification", "true");
    }

    // Check for updates every 30 seconds if there are pending orders
    const interval = setInterval(() => {
      fetchOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, [orders, fetchOrders]);

  const handleDeleteOrder = async (orderIdToDelete: string) => {
    if (!auth_token) return;

    try {
      setDeletingOrder(orderIdToDelete);
      const result = await deleteOrder(orderIdToDelete, auth_token);

      if (result.success) {
        toast.success("Order deleted successfully");
        setOrders(orders.filter((order) => order._id !== orderIdToDelete));
      } else {
        toast.error(result.message || "Failed to delete order");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    } finally {
      setDeletingOrder(null);
    }
  };

  const handlePayNow = (order: Order) => {
    // Open payment confirmation modal
    setOrderToPay(order);
    setShowPaymentConfirm(true);
  };

  const calculateShipping = (order: Order) => {
    const subtotal = order.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const freeDeliveryThreshold = parseFloat(
      process.env.NEXT_PUBLIC_FREE_DELIVERY_THRESHOLD || "999"
    );
    return subtotal > freeDeliveryThreshold ? 0 : 15;
  };

  const calculateTax = (order: Order) => {
    const subtotal = order.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const taxRate = parseFloat(process.env.NEXT_PUBLIC_TAX_AMOUNT || "0");
    return subtotal * taxRate;
  };

  const processPayment = async (gateway: "stripe" | "sslcommerz") => {
    if (!orderToPay || !authUser) return;

    setShowPaymentConfirm(false); // Close modal first
    setProcessingPayment(true);

    try {
      if (gateway === "sslcommerz") {
        // Handle SSLCommerz payment
        const total = orderToPay.total;

        // Construct API URL correctly ensuring /api prefix exists
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const baseUrl = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;

        const response = await fetch(`${baseUrl}/payments/sslcommerz/init`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth_token}`,
          },
          body: JSON.stringify({
            orderId: orderToPay._id,
            amount: total,
            currency: "BDT",
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Non-JSON response:", text.substring(0, 200));
          throw new Error(
            "Server returned an invalid response. Please check your payment gateway configuration."
          );
        }

        const data = await response.json();

        if (data.success && data.gatewayUrl) {
          // Redirect to SSLCommerz payment page
          window.location.href = data.gatewayUrl;
        } else {
          throw new Error(
            data.message || "Failed to initialize SSLCommerz payment"
          );
        }
        return;
      }

      // Stripe payment flow
      // Convert order items to Stripe format
      const stripeItems: StripeCheckoutItem[] = orderToPay.items.map(
        (item) => ({
          name: item.name,
          description: `Quantity: ${item.quantity}`,
          amount: Math.round(item.price * 100),
          currency: "inr",
          quantity: item.quantity,
          images: item.image ? [item.image] : undefined,
        })
      );

      // Add shipping and tax
      const shipping = calculateShipping(orderToPay);
      const tax = calculateTax(orderToPay);

      if (shipping > 0) {
        stripeItems.push({
          name: "Shipping",
          description: "Standard shipping",
          amount: Math.round(shipping * 100),
          currency: "inr",
          quantity: 1,
        });
      }

      if (tax > 0) {
        stripeItems.push({
          name: "Tax",
          description: "Sales tax",
          amount: Math.round(tax * 100),
          currency: "inr",
          quantity: 1,
        });
      }

      const result = await createCheckoutSession({
        items: stripeItems,
        customerEmail: authUser?.email,
        successUrl: `${window.location.origin}/user/orders/${orderToPay._id}?success=true`,
        cancelUrl: `${window.location.origin}/user/orders`,
        metadata: {
          orderId: orderToPay._id,
          shippingAddress: JSON.stringify(orderToPay.shippingAddress),
        },
      });

      if ("url" in result && result.url) {
        await redirectToCheckout(result.url);
      } else if ("error" in result) {
        throw new Error(result.error);
      } else {
        throw new Error("Failed to get checkout session URL");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setProcessingPayment(false);
      setOrderToPay(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "paid":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusIcon = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <CreditCard className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <CreditCard className="w-4 h-4 text-red-500" />;
      case "refunded":
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      default:
        return <CreditCard className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPaymentStatusText = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case "paid":
        return "Paid";
      case "pending":
        return "Pending";
      case "failed":
        return "Failed";
      case "refunded":
        return "Refunded";
      default:
        return "Pending";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (success === "true" && orderId) {
    return (
      <Container className="py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-babyshopWhite rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-babyshopSky" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Order Placed Successfully!
            </h1>

            <p className="text-gray-600 mb-6 text-lg">
              Thank you for your purchase. Your order has been received and is
              being processed.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Order ID</p>
              <p className="font-mono text-lg font-semibold text-gray-900">
                {orderId}
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                You will receive an email confirmation shortly with your order
                details and tracking information.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/shop">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Continue Shopping
                  </Button>
                </Link>

                <Link href="/">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-babyshopBlack hover:bg-gray-800"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Homepage
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (authLoading) {
    return (
      <Container className="py-8">
        <OrderTableSkeleton />
      </Container>
    );
  }

  if (!authUser || !isAuthenticated) {
    return (
      <Container className="py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-babyshopWhite rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Please Sign In
            </h2>
            <p className="text-gray-600 mb-6">
              You need to sign in to view your orders.
            </p>
            <Link href="/auth/signin">
              <Button size="lg" className="bg-babyshopBlack hover:bg-gray-800">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            My Orders
          </h1>
          <p className="text-gray-600">View and manage your order history</p>
        </div>
        <Button
          onClick={fetchOrders}
          variant="outline"
          size="sm"
          disabled={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {loading ? (
        <OrderTableSkeleton />
      ) : orders.length === 0 ? (
        <div className="bg-babyshopWhite rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Orders Yet
            </h2>
            <p className="text-gray-600 mb-6">
              You haven&apos;t placed any orders yet.
            </p>
            <Link href="/shop">
              <Button size="lg" className="bg-babyshopBlack hover:bg-gray-800">
                Start Shopping
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-babyshopWhite rounded-lg border border-gray-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Order ID</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Items</TableHead>
                  <TableHead className="font-semibold">Total</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Payment</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id} className="hover:bg-gray-50">
                    <TableCell className="font-mono text-sm">
                      {order._id.slice(-8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(order.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {order.items.length} item
                        {order.items.length > 1 ? "s" : ""}
                      </span>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(order.status)} capitalize`}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPaymentStatusIcon(order.paymentStatus)}
                        <span className="text-sm text-gray-600">
                          {getPaymentStatusText(order.paymentStatus)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/user/orders/${order?._id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            // onClick={() => handleViewDetails(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>

                        {order.paymentStatus !== "paid" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handlePayNow(order)}
                              className="bg-babyshopSky hover:bg-babyshopSky/90 text-babyshopWhite"
                            >
                              <CreditCard className="w-4 h-4 mr-1" />
                              Pay Now
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={deletingOrder === order._id}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Order
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this order?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteOrder(order._id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Order</span>
                      <span className="font-mono text-sm font-medium">
                        #{order._id.slice(-8)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(order.status)} capitalize`}
                    >
                      {order.status}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {getPaymentStatusIcon(order.paymentStatus)}
                      <span className="text-xs text-gray-500">
                        {getPaymentStatusText(order.paymentStatus)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600">
                    {order.items.length} item{order.items.length > 1 ? "s" : ""}
                  </div>
                  <div className="text-lg font-semibold">
                    {formatPrice(order.total)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link href={`/user/orders/${order?._id}`} className="w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      // onClick={() => handleViewDetails(order)}
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                  </Link>

                  {order.paymentStatus !== "paid" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handlePayNow(order)}
                        className="bg-babyshopSky hover:bg-babyshopSky/90 text-babyshopWhite flex-1 min-w-0"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay Now
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={deletingOrder === order._id}
                            className="px-3"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="mx-4">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Order</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this order? This
                              action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteOrder(order._id)}
                              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <OrderDetailsModal
        order={selectedOrder}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrder(null);
        }}
      />

      {/* Payment Gateway Selection Dialog */}
      <PaymentGatewayDialog
        isOpen={showPaymentConfirm}
        onClose={() => {
          setShowPaymentConfirm(false);
          setOrderToPay(null);
          setPaymentGateway(null);
        }}
        orderTotal={orderToPay?.total || 0}
        selectedGateway={paymentGateway}
        onGatewaySelect={setPaymentGateway}
        onConfirm={processPayment}
        isProcessing={processingPayment}
      />
    </Container>
  );
};

const OrdersPage = () => {
  return (
    <Suspense
      fallback={
        <Container className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </Container>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
};

export default OrdersPage;
