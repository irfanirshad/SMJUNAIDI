import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, Order } from '../../types';
import colors from '../constants/colors';
import CommonNavbar from '../components/common/CommonNavbar';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { orderAPI, paymentAPI } from '../services/api';
import { useOrderStore } from '../store';
import RazorpayCheckout from 'react-native-razorpay';
import { RAZORPAY_KEY_ID, formatPrice } from '../config/environment';

import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  CreditCardIcon,
  CheckmarkCircle01Icon,
  LocationIcon,
  CalendarIcon,
  ShoppingBag01Icon,
} from '@hugeicons/core-free-icons';

type RazorpaySuccessResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type CheckoutScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Checkout'
>;

type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>;

interface Props {
  navigation: CheckoutScreenNavigationProp;
  route: CheckoutScreenRouteProp;
}

const CheckoutScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId, paymentMethod } = route.params;
  const { user } = useAuth();
  const { clearCart } = useCart();
  const { syncOrdersFromServer } = useOrderStore();
  const auth_token = user?.token;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Helper functions to handle both server and client order formats
  const getOrderItems = (orderData: Order) => {
    return orderData.items || orderData.orderItems || [];
  };

  const getTotalPrice = (orderData: Order) => {
    return orderData.total || orderData.totalPrice || 0;
  };

  const getShippingPrice = (orderData: Order) => {
    return orderData.shippingPrice || 0;
  };

  const getTaxPrice = (orderData: Order) => {
    return orderData.taxPrice || 0;
  };

  const getIsPaid = (orderData: Order) => {
    return orderData.status === 'paid' || orderData.isPaid || false;
  };

  const getItemImage = (item: any) => {
    return item.image || item.product?.image || '';
  };

  const getItemName = (item: any) => {
    return item.name || item.product?.name || 'Unknown Product';
  };

  const getItemPrice = (item: any) => {
    return item.price || item.product?.price || 0;
  };

  useEffect(() => {
    let retryAttempts = 0;

    const fetchOrder = async (): Promise<void> => {
      if (!auth_token) {
        return;
      }

      setIsLoading(true);
      try {
        // Add a small delay to ensure the order is properly saved in the database
        if (retryAttempts === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const response = await orderAPI.getOrderById(auth_token, orderId);

        if (response.success && response.order) {
          setOrder({
            ...response.order,
            paymentMethod:
              response.order.paymentMethod || paymentMethod || 'razorpay',
          });
        } else {
          console.error('❌ Order fetch failed:', response.message);

          // Retry up to 3 times with increasing delays
          if (retryAttempts < 3) {
            retryAttempts++;
            setIsLoading(false);
            setTimeout(() => {
              fetchOrder();
            }, retryAttempts * 2000); // 2s, 4s, 6s delays
            return;
          }

          Alert.alert(
            'Order Not Found',
            response.message || 'Could not fetch order details.',
          );
          navigation.goBack();
        }
      } catch (error) {
        console.error('💥 Fetch order error:', error);

        // Retry on network error too
        if (retryAttempts < 3) {
          retryAttempts++;
          setIsLoading(false);
          setTimeout(() => {
            fetchOrder();
          }, retryAttempts * 2000);
          return;
        }

        Alert.alert('Error', 'Failed to load order details. Please try again.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    if (auth_token && orderId) {
      fetchOrder();
    } else if (!auth_token) {
      // Set a timeout to redirect to login if auth token is not available after 3 seconds
      const authTimeout = setTimeout(() => {
        if (!auth_token) {
          Alert.alert(
            'Authentication Error',
            'Please login to view your order.',
          );
          navigation.navigate('Login');
        }
      }, 3000);

      return () => clearTimeout(authTimeout);
    }
  }, [orderId, auth_token, navigation]);

  const startRazorpayPayment = async () => {
    if (!order || !auth_token) return;

    setIsProcessingPayment(true);

    try {
      const totalAmount = getTotalPrice(order);
      const preferredCurrency =
        (order.payment_info?.currency || 'INR').toUpperCase();

      const razorpayOrder = await paymentAPI.createRazorpayPaymentOrder(
        auth_token,
        order._id,
        totalAmount,
        preferredCurrency,
      );

      if (!razorpayOrder.success) {
        throw new Error(
          'Failed to start Razorpay payment: ' +
            ((razorpayOrder as { message?: string }).message || 'Unknown error'),
        );
      }

      const keyId = razorpayOrder.keyId || RAZORPAY_KEY_ID;

      if (!razorpayOrder.orderId || !razorpayOrder.amount) {
        throw new Error('Invalid Razorpay order response: missing orderId/amount');
      }

      if (!keyId) {
        throw new Error('Razorpay key is missing. Please set RAZORPAY_KEY_ID.');
      }

      const options = {
        description: `Payment for order #${order._id
          .slice(-8)
          .toUpperCase()}`,
        currency: razorpayOrder.currency || preferredCurrency,
        key: keyId,
        amount: Number(razorpayOrder.amount),
        name: 'Babyshop',
        order_id: razorpayOrder.orderId,
        prefill: {
          email: user?.email || '',
          contact: '',
          name: user?.name || 'Customer',
        },
        theme: { color: colors.babyshopSky },
      };

      if (!RazorpayCheckout || typeof RazorpayCheckout.open !== 'function') {
        throw new Error(
          'Razorpay SDK not initialized. Rebuild the app after installing react-native-razorpay.',
        );
      }

      console.log('💳 Opening Razorpay checkout with options:', options);

      const paymentResult =
        (await RazorpayCheckout.open(options)) as RazorpaySuccessResponse;

      console.log('✅ Razorpay payment result:', paymentResult);

      const verification = await paymentAPI.verifyRazorpayPayment(
        auth_token,
        order._id,
        {
          razorpayOrderId: paymentResult.razorpay_order_id,
          razorpayPaymentId: paymentResult.razorpay_payment_id,
          razorpaySignature: paymentResult.razorpay_signature,
        },
      );

      if (!verification.success) {
        throw new Error(
          verification.message || 'Payment verification failed on server',
        );
      }

      if (verification.order) {
        setOrder({
          ...verification.order,
          paymentMethod:
            verification.order.paymentMethod || paymentMethod || 'razorpay',
        });
      } else {
        setOrder(prev =>
          prev
            ? {
                ...prev,
                paymentStatus: 'paid',
                isPaid: true,
                paidAt: new Date(),
                paymentMethod: 'razorpay',
              }
            : null,
        );
      }

      await syncOrdersFromServer();
      await clearCart();

      Alert.alert(
        'Payment Successful! 🎉',
        `Your payment of ${formatPrice(
          getTotalPrice(order),
        )} was successful. Your order is now confirmed.`,
        [
          {
            text: 'View Order',
            onPress: () => {
              navigation.navigate('SingleOrder', { orderId: order._id });
            },
          },
          {
            text: 'Continue Shopping',
            onPress: () => {
              navigation.navigate('MainTabs');
            },
          },
        ],
      );
    } catch (error) {
      console.error('💥 Razorpay payment error:', error);

      const message =
        error instanceof Error
          ? error.message
          : 'There was an issue processing your payment. Please try again.';

      Alert.alert('Payment Failed', message, [
        {
          text: 'Try Again',
          onPress: () => startRazorpayPayment(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleViewOrder = () => {
    if (order) {
      navigation.navigate('SingleOrder', { orderId: order._id });
    }
  };

  const formatDate = (date: Date | string) => {
    const orderDate = new Date(date);
    return orderDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!auth_token) {
    return (
      <View style={styles.container}>
        <CommonNavbar title="Checkout" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.babyshopSky} />
          <Text style={styles.loadingText}>Authenticating...</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <CommonNavbar title="Checkout" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.babyshopSky} />
          <Text style={styles.loadingText}>Loading order details...</Text>
          <Text style={styles.loadingSubtext}>
            This may take a moment while we process your order.
          </Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <CommonNavbar title="Checkout" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isPaid = getIsPaid(order);

  return (
    <View style={styles.container}>
      <CommonNavbar title="Checkout" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusIconContainer}>
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              size={48}
              color={colors.success}
              strokeWidth={2}
            />
          </View>
          <Text style={styles.statusTitle}>
            {isPaid ? 'Payment Received' : 'Awaiting Payment'}
          </Text>
          <Text style={styles.statusSubtitle}>
            Order ID: #{order._id.slice(-8).toUpperCase()}
          </Text>
          {!isPaid && (
            <Text style={styles.statusSubtle}>
              Complete payment with Razorpay to confirm your order.
            </Text>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(
                  getTotalPrice(order) -
                    getShippingPrice(order) -
                    getTaxPrice(order),
                )}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text
                style={[
                  styles.summaryValue,
                  getShippingPrice(order) === 0 && styles.freeText,
                ]}
              >
                {getShippingPrice(order) === 0
                  ? 'FREE'
                  : formatPrice(getShippingPrice(order))}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(getTaxPrice(order))}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatPrice(getTotalPrice(order))}
              </Text>
            </View>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <HugeiconsIcon
                icon={LocationIcon}
                size={20}
                color={colors.babyshopSky}
                strokeWidth={2}
              />
              <Text style={styles.addressTitle}>Delivery Address</Text>
            </View>
            <Text style={styles.addressText}>
              {order.shippingAddress.street}
            </Text>
            <Text style={styles.addressText}>
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.postalCode}
            </Text>
            <Text style={styles.addressText}>
              {order.shippingAddress.country}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.itemsContainer}>
            {getOrderItems(order).map((item, index) => (
              <View key={index} style={styles.orderItem}>
                <Image
                  source={{ uri: getItemImage(item) }}
                  style={styles.itemImage}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {getItemName(item)}
                  </Text>
                  <Text style={styles.itemPrice}>
                    {formatPrice(getItemPrice(item))} x {item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  {formatPrice(getItemPrice(item) * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Order Date */}
        <View style={styles.section}>
          <View style={styles.dateContainer}>
            <HugeiconsIcon
              icon={CalendarIcon}
              size={20}
              color={colors.babyshopSky}
              strokeWidth={2}
            />
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>Order Placed</Text>
              <Text style={styles.dateValue}>
                {formatDate(order.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.paymentCard}>
            <View style={styles.paymentHeader}>
              <HugeiconsIcon
                icon={CreditCardIcon}
                size={24}
                color={colors.babyshopSky}
                strokeWidth={2}
              />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentMethod}>
                  {order.paymentMethod || paymentMethod || 'Razorpay'} (Default)
                </Text>
                <Text
                  style={[
                    styles.paymentStatus,
                    isPaid ? styles.paidStatus : styles.unpaidStatus,
                  ]}
                >
                  {isPaid ? 'Paid' : 'Payment Pending'}
                </Text>
              </View>
            </View>
            {!isPaid && (
              <Text style={styles.paidAtText}>
                Pay securely with Razorpay to confirm your order.
              </Text>
            )}
            {isPaid && order.paidAt && (
              <Text style={styles.paidAtText}>
                Paid on {formatDate(order.paidAt)}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.viewOrderButton}
          onPress={handleViewOrder}
        >
          <HugeiconsIcon
            icon={ShoppingBag01Icon}
            size={20}
            color={colors.babyshopSky}
            strokeWidth={2}
          />
          <Text style={styles.viewOrderButtonText}>View Order Details</Text>
        </TouchableOpacity>

        {!getIsPaid(order) && (
          <TouchableOpacity
            style={[
              styles.payNowButton,
              isProcessingPayment && styles.disabledButton,
            ]}
            onPress={startRazorpayPayment}
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.loadingButtonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.payNowButtonText}>
                Place Order - {formatPrice(getTotalPrice(order))}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.babyshopSky,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.white,
    marginVertical: 16,
    borderRadius: 12,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIconContainer: {
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  statusSubtle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.secondaryText,
  },
  summaryValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  freeText: {
    color: colors.success,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.lightBorder,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.babyshopSky,
  },
  addressCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  addressText: {
    fontSize: 15,
    color: colors.secondaryText,
    lineHeight: 22,
  },
  itemsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.babyshopSky,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateInfo: {
    marginLeft: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  paymentCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentInfo: {
    marginLeft: 12,
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  paidStatus: {
    color: colors.success,
  },
  unpaidStatus: {
    color: colors.warning,
  },
  paidAtText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: 8,
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightBorder,
  },
  viewOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.babyshopSky,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  viewOrderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.babyshopSky,
    marginLeft: 8,
  },
  payNowButton: {
    backgroundColor: colors.babyshopSky,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payNowButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  disabledButton: {
    backgroundColor: colors.mediumGray,
  },
  loadingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 8,
  },
});

export default CheckoutScreen;
