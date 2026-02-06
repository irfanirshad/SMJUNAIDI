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
import PaymentMethodModal from '../components/common/PaymentMethodModal';
import SSLCommerzWebView from '../components/common/SSLCommerzWebView';
import { useAuth } from '../hooks/useAuth';
import { orderAPI, paymentAPI } from '../services/api';
import { useOrderStore } from '../store';
import { usePaymentSheet } from '@stripe/stripe-react-native';

import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  CreditCardIcon,
  CheckmarkCircle01Icon,
  LocationIcon,
  CalendarIcon,
  ShoppingBag01Icon,
} from '@hugeicons/core-free-icons';

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
  const { orderId } = route.params;
  const { user } = useAuth();
  const { syncOrdersFromServer } = useOrderStore();
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  const auth_token = user?.token;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showSSLCommerzWebView, setShowSSLCommerzWebView] = useState(false);
  const [sslCommerzPaymentUrl, setSSLCommerzPaymentUrl] = useState('');

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
          setOrder(response.order);
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

  const handlePayNow = async () => {
    if (!order || !auth_token) return;

    // Show payment method selection modal
    setShowPaymentMethodModal(true);
  };

  const handlePaymentMethodSelect = async (method: 'stripe' | 'sslcommerz') => {
    if (method === 'stripe') {
      await handleStripePayment();
    } else if (method === 'sslcommerz') {
      await handleSSLCommerzPayment();
    }
  };

  const handleStripePayment = async () => {
    if (!order || !auth_token) return;

    setIsProcessingPayment(true);

    try {
      // Step 1: Create payment intent on the server
      const paymentIntentResponse = await paymentAPI.createPaymentIntent(
        auth_token,
        order._id,
        getTotalPrice(order),
        'usd',
      );

      if (!paymentIntentResponse.success) {
        throw new Error(
          paymentIntentResponse.message || 'Failed to create payment intent',
        );
      }

      // Step 2: Initialize the payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Baby Shop',
        paymentIntentClientSecret: paymentIntentResponse.clientSecret!,
        defaultBillingDetails: {
          name: user?.name || 'Customer',
          email: user?.email || '',
        },
        returnURL: 'babyshop://payment-complete',
      });

      if (initError) {
        throw new Error(initError.message || 'Failed to initialize payment');
      }

      // Step 3: Present the payment sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        throw new Error(paymentError.message || 'Payment was declined');
      }

      // Payment succeeded - now update order payment status
      let orderStatusUpdated = false;

      try {
        // Step 4: Update order payment status to paid
        const updateResponse = await orderAPI.updateOrderPaymentStatus(
          auth_token,
          order._id,
          'paid',
          paymentIntentResponse.paymentIntentId || 'pi_demo_' + Date.now(),
        );

        if (updateResponse.success) {
          orderStatusUpdated = true;
          // Update local order state to reflect paid status
          setOrder(prev =>
            prev
              ? {
                  ...prev,
                  paymentStatus: 'paid',
                  isPaid: true,
                  paidAt: new Date(),
                }
              : null,
          );

          // Sync orders to update the real-time order count and status
          await syncOrdersFromServer();
        } else {
          console.error(
            '❌ Payment status update failed:',
            updateResponse.message,
          );
        }
      } catch (error) {
        console.error('❌ Payment status update error:', error);
      }

      // Show appropriate success message even if order status update failed
      // (since payment was successful)
      if (orderStatusUpdated) {
        Alert.alert(
          'Payment Successful! 🎉',
          `Your payment of $${getTotalPrice(order).toFixed(
            2,
          )} has been processed successfully. Your order is now confirmed.`,
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
      } else {
        // Payment succeeded but order status update failed
        Alert.alert(
          'Payment Successful ✅',
          `Your payment of $${getTotalPrice(order).toFixed(
            2,
          )} has been processed successfully. However, there was an issue updating your order status. Your order will be updated shortly. 

Order ID: ${order._id.slice(-8).toUpperCase()}`,
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

        // Try to sync orders in background to get updated status from webhook
        try {
          await syncOrdersFromServer();
        } catch (syncError) {
          console.error('Background sync failed:', syncError);
        }
      }
    } catch (error) {
      console.error('💥 Payment error:', error);

      Alert.alert(
        'Payment Failed',
        error instanceof Error
          ? error.message
          : 'There was an issue processing your payment. Please try again or use a different payment method.',
        [
          {
            text: 'Try Again',
            style: 'default',
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSSLCommerzPayment = async () => {
    if (!order || !auth_token) return;

    setIsProcessingPayment(true);

    try {
      const totalAmount = getTotalPrice(order);

      // Call SSLCommerz init API
      const response = await paymentAPI.initSSLCommerzPayment(
        auth_token,
        order._id,
        totalAmount,
        'BDT',
      );

      if (!response.success || !response.gatewayUrl) {
        throw new Error(
          response.message || 'Failed to initialize SSLCommerz payment',
        );
      }

      // Open WebView with SSLCommerz payment URL
      setSSLCommerzPaymentUrl(response.gatewayUrl);
      setShowSSLCommerzWebView(true);
      setIsProcessingPayment(false);
    } catch (error) {
      console.error('💥 SSLCommerz payment error:', error);

      Alert.alert(
        'Payment Failed',
        error instanceof Error
          ? error.message
          : 'There was an issue initializing SSLCommerz payment. Please try again or use a different payment method.',
        [
          {
            text: 'Try Again',
            style: 'default',
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
      );
      setIsProcessingPayment(false);
    }
  };

  const handleSSLCommerzSuccess = async () => {
    setShowSSLCommerzWebView(false);
    setIsProcessingPayment(true);

    try {
      // Update order payment status to paid
      if (auth_token && order) {
        console.log('💳 Updating order payment status to paid (SSLCommerz)...');
        const updateResponse = await orderAPI.updateOrderPaymentStatus(
          auth_token,
          order._id,
          'paid',
        );

        if (updateResponse.success) {
          console.log('✅ Order payment status updated to paid');
        } else {
          console.error(
            '❌ Payment status update failed:',
            updateResponse.message,
          );
        }
      }

      // Sync orders to get updated status from backend
      await syncOrdersFromServer();

      // Fetch the latest order status
      if (auth_token && order) {
        const response = await orderAPI.getOrderById(auth_token, order._id);
        if (response.success && response.order) {
          setOrder(response.order);
        }
      }

      Alert.alert(
        'Payment Successful! 🎉',
        'Your payment has been processed successfully through SSLCommerz. Your order is now confirmed.',
        [
          {
            text: 'View Order',
            onPress: () => {
              navigation.navigate('SingleOrder', { orderId: order!._id });
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
      console.error('Error refreshing order:', error);
      Alert.alert(
        'Payment Successful ✅',
        'Your payment was successful! However, there was an issue refreshing your order. Please check your orders list.',
        [
          {
            text: 'View Orders',
            onPress: () => navigation.navigate('Orders'),
          },
        ],
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSSLCommerzFailure = () => {
    setShowSSLCommerzWebView(false);
    setIsProcessingPayment(false);

    Alert.alert(
      'Payment Failed',
      'Your payment was not successful. Please try again or use a different payment method.',
      [
        {
          text: 'Try Again',
          onPress: () => setShowPaymentMethodModal(true),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  };

  const handleSSLCommerzCancel = () => {
    setShowSSLCommerzWebView(false);
    setIsProcessingPayment(false);

    Alert.alert(
      'Payment Cancelled',
      'You have cancelled the payment. Would you like to try again?',
      [
        {
          text: 'Try Again',
          onPress: () => setShowPaymentMethodModal(true),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
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
          <Text style={styles.statusTitle}>Order Placed Successfully!</Text>
          <Text style={styles.statusSubtitle}>
            Order ID: #{order._id.slice(-8).toUpperCase()}
          </Text>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                $
                {(
                  getTotalPrice(order) -
                  getShippingPrice(order) -
                  getTaxPrice(order)
                ).toFixed(2)}
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
                  : `$${getShippingPrice(order).toFixed(2)}`}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>
                ${getTaxPrice(order).toFixed(2)}
              </Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ${getTotalPrice(order).toFixed(2)}
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
                    ${getItemPrice(item).toFixed(2)} x {item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  ${(getItemPrice(item) * item.quantity).toFixed(2)}
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
                <Text style={styles.paymentMethod}>{order.paymentMethod}</Text>
                <Text
                  style={[
                    styles.paymentStatus,
                    getIsPaid(order) ? styles.paidStatus : styles.unpaidStatus,
                  ]}
                >
                  {getIsPaid(order) ? 'Paid' : 'Payment Pending'}
                </Text>
              </View>
            </View>
            {getIsPaid(order) && order.paidAt && (
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
            onPress={handlePayNow}
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.loadingButtonText}>Processing...</Text>
              </View>
            ) : (
              <Text style={styles.payNowButtonText}>
                Pay Now - ${getTotalPrice(order).toFixed(2)}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Payment Method Modal */}
      <PaymentMethodModal
        visible={showPaymentMethodModal}
        onClose={() => setShowPaymentMethodModal(false)}
        onSelectMethod={handlePaymentMethodSelect}
        totalAmount={order ? getTotalPrice(order) : 0}
      />

      {/* SSLCommerz WebView */}
      {order && (
        <SSLCommerzWebView
          visible={showSSLCommerzWebView}
          paymentUrl={sslCommerzPaymentUrl}
          orderId={order._id}
          onSuccess={handleSSLCommerzSuccess}
          onFailure={handleSSLCommerzFailure}
          onCancel={handleSSLCommerzCancel}
        />
      )}
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
