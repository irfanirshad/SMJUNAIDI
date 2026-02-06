import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import colors from '../../constants/colors';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { CreditCardIcon } from '@hugeicons/core-free-icons';
import { useAuth } from '../../hooks/useAuth';
import { orderAPI, paymentAPI } from '../../services/api';
import { useOrderStore } from '../../store';
import { usePaymentSheet } from '@stripe/stripe-react-native';
import SSLCommerzWebView from './SSLCommerzWebView';
import { Order, RootStackParamList } from '../../../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface Props {
  visible: boolean;
  onClose: () => void;
  order: Order;
  onPaymentSuccess?: () => void;
}

const OrderPaymentModal: React.FC<Props> = ({
  visible,
  onClose,
  order,
  onPaymentSuccess,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { syncOrdersFromServer } = useOrderStore();
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  const auth_token = user?.token;

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showSSLCommerzWebView, setShowSSLCommerzWebView] = useState(false);
  const [sslCommerzPaymentUrl, setSSLCommerzPaymentUrl] = useState('');

  const getTotalPrice = (orderData: Order) => {
    return orderData.total || orderData.totalPrice || 0;
  };

  const handlePaymentMethod = async (method: 'stripe' | 'sslcommerz') => {
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

      // Close modal and call success callback
      onClose();
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }

      // Show appropriate success message
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
              text: 'OK',
              style: 'cancel',
            },
          ],
        );
      } else {
        Alert.alert(
          'Payment Successful ✅',
          `Your payment of $${getTotalPrice(order).toFixed(
            2,
          )} has been processed successfully. However, there was an issue updating your order status. Your order will be updated shortly.`,
          [
            {
              text: 'View Order',
              onPress: () => {
                navigation.navigate('SingleOrder', { orderId: order._id });
              },
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ],
        );

        // Try to sync orders in background
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
          : 'Failed to initialize SSLCommerz payment. Please try again.',
        [{ text: 'OK' }],
      );

      setIsProcessingPayment(false);
    }
  };

  const handleSSLCommerzSuccess = async () => {
    setShowSSLCommerzWebView(false);

    // Sync orders to get updated status
    try {
      await syncOrdersFromServer();
    } catch (error) {
      console.error('Failed to sync orders after payment:', error);
    }

    // Close modal and call success callback
    onClose();
    if (onPaymentSuccess) {
      onPaymentSuccess();
    }

    Alert.alert(
      'Payment Successful! 🎉',
      'Your payment has been processed successfully. Your order is now confirmed.',
      [
        {
          text: 'View Order',
          onPress: () => {
            navigation.navigate('SingleOrder', { orderId: order._id });
          },
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ],
    );
  };

  const handleSSLCommerzFailure = () => {
    setShowSSLCommerzWebView(false);
    Alert.alert(
      'Payment Failed',
      'Your payment could not be completed. Please try again.',
      [{ text: 'OK' }],
    );
  };

  const handleSSLCommerzCancel = () => {
    setShowSSLCommerzWebView(false);
  };

  if (showSSLCommerzWebView) {
    return (
      <SSLCommerzWebView
        visible={showSSLCommerzWebView}
        orderId={order._id}
        paymentUrl={sslCommerzPaymentUrl}
        onSuccess={handleSSLCommerzSuccess}
        onFailure={handleSSLCommerzFailure}
        onCancel={handleSSLCommerzCancel}
      />
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContent}
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
        >
          <Text style={styles.modalTitle}>Select Payment Method</Text>
          <Text style={styles.modalSubtitle}>
            Choose your preferred payment method to complete the payment
          </Text>

          <TouchableOpacity
            style={styles.paymentMethodButton}
            onPress={() => handlePaymentMethod('stripe')}
            activeOpacity={0.8}
            disabled={isProcessingPayment}
          >
            <View style={styles.paymentMethodIcon}>
              <HugeiconsIcon
                icon={CreditCardIcon}
                size={24}
                color={colors.babyshopSky}
                strokeWidth={2}
              />
            </View>
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodName}>Stripe</Text>
              <Text style={styles.paymentMethodDesc}>
                Pay with Credit/Debit Card
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.paymentMethodButton}
            onPress={() => handlePaymentMethod('sslcommerz')}
            activeOpacity={0.8}
            disabled={isProcessingPayment}
          >
            <View style={styles.paymentMethodIcon}>
              <HugeiconsIcon
                icon={CreditCardIcon}
                size={24}
                color={colors.babyshopSky}
                strokeWidth={2}
              />
            </View>
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodName}>SSLCommerz</Text>
              <Text style={styles.paymentMethodDesc}>
                Pay with Multiple Options
              </Text>
            </View>
          </TouchableOpacity>

          {isProcessingPayment && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.babyshopSky} />
              <Text style={styles.loadingText}>Processing payment...</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={onClose}
            activeOpacity={0.8}
            disabled={isProcessingPayment}
          >
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.babyWhite,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  paymentMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.babyshopSky + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 4,
  },
  paymentMethodDesc: {
    fontSize: 13,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  modalCancelButton: {
    backgroundColor: colors.lightGray,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondaryText,
  },
});

export default OrderPaymentModal;
