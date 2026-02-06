"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Package,
  ArrowRight,
  Home,
  ShoppingBag,
  Calendar,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { getOrderById, type Order } from "@/lib/orderApi";
import { useUserStore, useCartStore } from "@/lib/store";
import {
  handlePaymentSuccess,
  pollOrderStatus,
  needsPaymentUpdate,
} from "@/lib/paymentUtils";
import PriceFormatter from "@/components/common/PriceFormatter";
import Cookies from "js-cookie";
import Container from "@/components/common/Container";
import { SuccessPageSkeleton } from "@/components/skeleton";

const SuccessPageClient = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [statusUpdated, setStatusUpdated] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { auth_token, authUser, verifyAuth } = useUserStore();
  const { clearCart } = useCartStore();

  const orderId = searchParams.get("orderId");
  const sessionId = searchParams.get("session_id"); // Stripe adds this parameter
  const paymentStatus = searchParams.get("payment"); // SSLCommerz adds this parameter

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

  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth check
    }

    if (!orderId) {
      router.push("/user/orders");
      return;
    }

    const fetchOrder = async () => {
      // Check token in cookies first, then fallback to store
      const token = Cookies.get("auth_token") || auth_token;



      if (!token) {
        toast.error("Authentication required");
        router.push("/auth/signin");
        return;
      }

      try {
        setLoading(true);
        const orderData = await getOrderById(orderId, token);
        if (orderData) {
          setOrder(orderData);

          // Clear cart when arriving at success page (for both Stripe and SSLCommerz)
          if (
            orderData.isPaid ||
            orderData.paymentStatus === "paid" ||
            paymentStatus === "success"
          ) {
            await clearCart();
          }

          // Handle payment status update
          if (
            sessionId &&
            needsPaymentUpdate(orderData, sessionId) &&
            !statusUpdated
          ) {

            try {
              const paymentResult = await handlePaymentSuccess(
                orderId,
                sessionId,
                token
              );

              if (paymentResult.success && paymentResult.order) {
                setOrder(paymentResult.order);
                setStatusUpdated(true);
              } else {

              }
            } catch (error) {
              console.error("Success: Error in payment status update:", error);
            }
          } else if (orderData.paymentStatus === "paid" && sessionId) {
            // Order is already paid, probably updated by webhook
            toast.success("Payment confirmed!");
            setStatusUpdated(true);
          } else {

          }
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, auth_token, router, authLoading, sessionId, statusUpdated]);

  useEffect(() => {
    // Show success toast when component mounts
    if (!authLoading && !loading) {
      toast.success("Payment completed successfully!");
    }
  }, [authLoading, loading]);

  // Periodically check if order status needs updating (fallback mechanism)
  useEffect(() => {
    if (!order || !sessionId || statusUpdated || order.status !== "pending") {
      return;
    }

    const token = Cookies.get("auth_token") || auth_token;
    if (!token || !orderId) return;


    const startPolling = async () => {
      try {
        const pollResult = await pollOrderStatus(
          orderId,
          token,
          "paid",
          6,
          5000
        );

        if (pollResult.success && pollResult.order) {
          setOrder(pollResult.order);
          setStatusUpdated(true);
          toast.success("Payment status updated!");
        } else {
        }
      } catch (error) {
        console.error("Success: Error in polling:", error);
      }
    };

    startPolling();
  }, [order, sessionId, statusUpdated, orderId, auth_token]);

  if (loading || authLoading) {
    return <SuccessPageSkeleton />;
  }

  return (
    <Container className="py-4 sm:py-8">
      <PageBreadcrumb
        items={[{ label: "Checkout", href: "/checkout" }]}
        currentPage="Success"
        showSocialShare={false}
      />

      <div className="max-w-6xl mx-auto">
        {/* Success Hero Section */}
        <div className="bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl sm:rounded-3xl border-2 border-green-100 shadow-xl p-6 sm:p-8 md:p-12 text-center mb-6 sm:mb-8 overflow-hidden relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.4),transparent_50%)]"></div>
          </div>

          <div className="relative z-10">
            {/* Animated Success Icon */}
            <div className="relative inline-block mb-6 sm:mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-linear-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center animate-[bounce_1s_ease-in-out_3] shadow-lg">
                <CheckCircle
                  className="w-12 h-12 sm:w-14 sm:h-14 text-white"
                  strokeWidth={2.5}
                />
              </div>

              {/* Celebration Particles */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-2 -left-2 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                <div className="absolute -top-4 -right-2 w-2 h-2 bg-blue-400 rounded-full animate-ping animation-delay-200"></div>
                <div className="absolute -bottom-2 -left-4 w-2.5 h-2.5 bg-purple-400 rounded-full animate-ping animation-delay-400"></div>
                <div className="absolute -bottom-3 -right-3 w-2 h-2 bg-pink-400 rounded-full animate-ping animation-delay-600"></div>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 sm:mb-4">
              Payment Successful! 🎉
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Thank you for your purchase! Your order has been confirmed and is
              being processed with care.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4">
              <Link href="/user/orders" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 sm:px-8 py-3 sm:py-6 rounded-xl sm:rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <Package className="w-5 h-5 mr-2" />
                  View Order Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>

              <Link href="/shop" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 px-6 sm:px-8 py-3 sm:py-6 rounded-xl sm:rounded-full transition-all"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Order Info Cards */}
        {order && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Order ID Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <Package className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">
                    Order ID
                  </p>
                  <p className="font-mono text-lg sm:text-xl font-bold text-gray-900 break-all">
                    #{order._id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Status Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 sm:gap-4">
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0 ${
                    order.paymentStatus === "paid"
                      ? "bg-green-100"
                      : "bg-yellow-100"
                  }`}
                >
                  {order.paymentStatus === "paid" ? (
                    <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">
                    Payment Status
                  </p>
                  <p
                    className={`text-lg sm:text-xl font-bold ${
                      order.paymentStatus === "paid"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {order.paymentStatus === "paid" ? "Paid" : "Processing"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {order.payment_info?.gateway?.toUpperCase() || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Amount Card */}
            <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl border-2 border-green-200 p-4 sm:p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-green-700 mb-1 font-medium">
                    Total Paid
                  </p>
                  <PriceFormatter
                    amount={order.total}
                    className="text-2xl sm:text-3xl font-bold text-green-600"
                  />
                  <p className="text-xs text-green-600 mt-1">
                    Payment Confirmed
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Details Section */}
        {order && order.payment_info && (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              Payment Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Gateway */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">
                  Payment Gateway
                </p>
                <p className="font-semibold text-gray-900 text-sm sm:text-base uppercase">
                  {order.payment_info.gateway === "stripe"
                    ? "Stripe"
                    : order.payment_info.gateway === "sslcommerz"
                      ? "SSLCommerz"
                      : "Cash on Delivery"}
                </p>
              </div>

              {/* Currency */}
              {order.payment_info.currency && (
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">
                    Currency
                  </p>
                  <p className="font-semibold text-gray-900 text-sm sm:text-base">
                    {order.payment_info.currency}
                  </p>
                </div>
              )}

              {/* Stripe Payment Details */}
              {order.payment_info.gateway === "stripe" &&
                order.payment_info.stripe && (
                  <>
                    {order.payment_info.stripe.paymentMethodType && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">
                          Payment Method
                        </p>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base capitalize">
                          {order.payment_info.stripe.paymentMethodType}
                        </p>
                      </div>
                    )}

                    {order.payment_info.stripe.cardBrand && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">
                          Card
                        </p>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base uppercase">
                          {order.payment_info.stripe.cardBrand}
                          {order.payment_info.stripe.cardLast4 &&
                            ` •••• ${order.payment_info.stripe.cardLast4}`}
                        </p>
                      </div>
                    )}
                  </>
                )}

              {/* SSLCommerz Payment Details */}
              {order.payment_info.gateway === "sslcommerz" &&
                order.payment_info.sslcommerz && (
                  <>
                    {order.payment_info.sslcommerz.paymentMethod && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">
                          Payment Method
                        </p>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base capitalize">
                          {order.payment_info.sslcommerz.paymentMethod ===
                          "mobile_banking"
                            ? order.payment_info.sslcommerz.mobileProvider ||
                              "Mobile Banking"
                            : order.payment_info.sslcommerz.paymentMethod.replace(
                                "_",
                                " "
                              )}
                        </p>
                      </div>
                    )}

                    {order.payment_info.sslcommerz.cardBrand && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">
                          Card Brand
                        </p>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base uppercase">
                          {order.payment_info.sslcommerz.cardBrand}
                        </p>
                      </div>
                    )}

                    {order.payment_info.sslcommerz.cardIssuer && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">
                          Card Issuer
                        </p>
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">
                          {order.payment_info.sslcommerz.cardIssuer}
                        </p>
                      </div>
                    )}

                    {order.payment_info.sslcommerz.transactionId && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-3">
                        <p className="text-xs sm:text-sm text-gray-500 mb-1">
                          Transaction ID
                        </p>
                        <p className="font-mono text-xs sm:text-sm font-semibold text-gray-900 break-all">
                          {order.payment_info.sslcommerz.transactionId}
                        </p>
                      </div>
                    )}
                  </>
                )}
            </div>
          </div>
        )}

        {/* Order Items Section */}
        {order && (
          <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              Order Items ({order.items.length})
            </h2>

            <div className="space-y-3 sm:space-y-4">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-300 transition-all"
                >
                  {/* Product Image */}
                  <div className="w-full sm:w-20 h-40 sm:h-20 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-10 h-10 text-gray-300" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base line-clamp-2">
                      {item.name}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Qty:</span>{" "}
                        {item.quantity}
                      </span>
                      <span className="hidden sm:inline text-gray-300">•</span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium">Price:</span>
                        <PriceFormatter amount={item.price} />
                      </span>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="w-full sm:w-auto text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">
                      Subtotal
                    </p>
                    <PriceFormatter
                      amount={item.price * item.quantity}
                      className="text-base sm:text-lg font-bold text-gray-900"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Order Total */}
            <div className="border-t-2 border-gray-200 pt-4 sm:pt-6 mt-4 sm:mt-6">
              <div className="bg-linear-to-br from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border-2 border-green-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <p className="text-sm text-green-700 mb-1">Grand Total</p>
                    <p className="text-xs text-gray-600">
                      {order.items.length} item
                      {order.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <PriceFormatter
                    amount={order.total}
                    className="text-2xl sm:text-3xl font-bold text-green-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* What's Next Timeline */}
        <div className="bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl border-2 border-blue-200 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 text-center flex items-center justify-center gap-2">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            What Happens Next?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white/80 backdrop-blur rounded-xl p-4 sm:p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <span className="text-white font-bold text-lg sm:text-xl">
                  1
                </span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">
                Order Confirmation
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                You&apos;ll receive an email with your order details and
                tracking information
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-xl p-4 sm:p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <span className="text-white font-bold text-lg sm:text-xl">
                  2
                </span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">
                Processing
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Our team will carefully prepare and package your order with care
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-xl p-4 sm:p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-linear-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <span className="text-white font-bold text-lg sm:text-xl">
                  3
                </span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">
                Delivery
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Track your package in real-time as it makes its way to your
                doorstep
              </p>
            </div>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 text-center">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            Need Help?
          </h3>
          <p className="text-sm text-gray-600 mb-4 sm:mb-6 max-w-2xl mx-auto">
            If you have any questions about your order, feel free to contact our
            customer support team or view your order details.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/user/orders" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-blue-500 text-blue-600 hover:bg-blue-50"
              >
                <Package className="w-4 h-4 mr-2" />
                My Orders
              </Button>
            </Link>
            <Link href="/" className="w-full sm:w-auto">
              <Button
                variant="ghost"
                className="w-full sm:w-auto hover:bg-gray-100"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
};

const SuccessPage = () => {
  return (
    <Suspense fallback={<SuccessPageSkeleton />}>
      <SuccessPageClient />
    </Suspense>
  );
};

export default SuccessPage;
