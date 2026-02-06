import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Order } from '../../types';
import colors from '../constants/colors';
import CommonNavbar from '../components/common/CommonNavbar';
import OrderPaymentModal from '../components/common/OrderPaymentModal';
import { useAuth } from '../hooks/useAuth';
import { orderAPI } from '../services/api';
import { useOrderStore } from '../store';

import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ShoppingBag01Icon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  CreditCardIcon,
  CancelCircleIcon,
} from '@hugeicons/core-free-icons';

type SingleOrderScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SingleOrder'
>;

interface Props {
  navigation: SingleOrderScreenNavigationProp;
  route: {
    params: {
      orderId: string;
    };
  };
}

const SingleOrderScreen: React.FC<Props> = ({ navigation, route }) => {
  const { orderId } = route.params;
  const { user } = useAuth();
  const { syncOrdersFromServer } = useOrderStore();
  const auth_token = user?.token;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [animatedLines] = useState(new Animated.Value(0));

  // Helper functions to handle both server and client order formats
  const getOrderItems = (orderData: Order) => {
    return orderData.items || orderData.orderItems || [];
  };

  const getTotalPrice = (orderData: Order) => {
    return orderData.total || orderData.totalPrice || 0;
  };

  const getIsPaid = (orderData: Order) => {
    return orderData.paymentStatus === 'paid' || orderData.isPaid || false;
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

  const fetchOrder = useCallback(async () => {
    if (!auth_token) {
      setLoading(false);
      Alert.alert('Error', 'Please log in to view order details');
      navigation.navigate('Login');
      return;
    }

    if (!orderId) {
      setLoading(false);
      Alert.alert('Error', 'Invalid order ID');
      navigation.goBack();
      return;
    }

    try {
      const response = await orderAPI.getOrderById(auth_token, orderId);

      if (response.success && response.order) {
        setOrder(response.order);
      } else {
        console.error('❌ Order fetch failed:', response.message);
        console.error('❌ Full response:', response);
        Alert.alert(
          'Error',
          response.message || 'Failed to load order details. Please try again.',
        );
        navigation.goBack();
      }
    } catch (error) {
      console.error('❌ Fetch order error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      Alert.alert(
        'Error',
        'Unable to load order details. Please check your connection and try again.',
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [auth_token, orderId, navigation]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Animate timeline lines when order is loaded
  useEffect(() => {
    if (order && !loading) {
      setTimeout(() => {
        Animated.timing(animatedLines, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
      }, 300);
    }
  }, [order, loading, animatedLines]);

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOrderStatus = (order: Order) => {
    return order.status || 'pending';
  };

  const getPaymentStatus = (order: Order) => {
    return order.paymentStatus || (order.isPaid ? 'paid' : 'pending');
  };

  const renderTimelineStep = (
    stepStatus: string,
    title: string,
    description: string,
    timestamp: string | Date | undefined,
    isCompleted: boolean,
    updatedBy?: string,
    isLast?: boolean,
  ) => {
    const orderStatus = getOrderStatus(order!);
    const isCancelled = orderStatus === 'cancelled';

    // Calculate line color and animation
    const lineHeight = animatedLines.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.timelineStep}>
        <View style={styles.timelineIconContainer}>
          <View
            style={[
              styles.timelineIcon,
              isCompleted
                ? isCancelled
                  ? styles.timelineIconCancelled
                  : styles.timelineIconCompleted
                : styles.timelineIconPending,
            ]}
          >
            <HugeiconsIcon
              icon={isCancelled ? CancelCircleIcon : CheckmarkCircle01Icon}
              size={16}
              color={isCompleted ? colors.white : colors.mutedText}
              strokeWidth={2}
            />
          </View>
          {!isLast && (
            <View style={styles.timelineLine}>
              <Animated.View
                style={[
                  styles.timelineLineAnimated,
                  {
                    backgroundColor: isCompleted
                      ? isCancelled
                        ? colors.error
                        : colors.babyshopSky
                      : 'transparent',
                    height: lineHeight,
                  },
                ]}
              />
            </View>
          )}
        </View>
        <View style={styles.timelineContent}>
          <Text
            style={[
              styles.timelineTitle,
              isCompleted && styles.timelineTitleCompleted,
              isCancelled && isCompleted && styles.timelineTitleCancelled,
            ]}
          >
            {title}
          </Text>
          <Text style={styles.timelineDescription}>{description}</Text>
          {timestamp && (
            <Text style={styles.timelineTimestamp}>
              {formatShortDate(timestamp)}
            </Text>
          )}
          {updatedBy && (
            <Text style={styles.timelineUpdatedBy}>by {updatedBy}</Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonNavbar title="Order Details" />
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Order Header Skeleton */}
          <View style={styles.skeletonSection}>
            <View style={styles.skeletonOrderHeader}>
              <View style={styles.skeletonOrderId} />
              <View style={styles.skeletonBadge} />
            </View>
            <View style={styles.skeletonDate} />
          </View>

          {/* Timeline Skeleton */}
          <View style={styles.skeletonSection}>
            <View style={styles.skeletonSectionTitle} />
            {[1, 2, 3, 4, 5].map(i => (
              <View key={i} style={styles.skeletonTimelineItem}>
                <View style={styles.skeletonTimelineIcon} />
                <View style={styles.skeletonTimelineContent}>
                  <View style={styles.skeletonTimelineTitle} />
                  <View style={styles.skeletonTimelineDescription} />
                </View>
              </View>
            ))}
          </View>

          {/* Order Items Skeleton */}
          <View style={styles.skeletonSection}>
            <View style={styles.skeletonSectionTitle} />
            {[1, 2].map(i => (
              <View key={i} style={styles.skeletonOrderItem}>
                <View style={styles.skeletonItemImage} />
                <View style={styles.skeletonItemDetails}>
                  <View style={styles.skeletonItemName} />
                  <View style={styles.skeletonItemPrice} />
                </View>
                <View style={styles.skeletonItemTotal} />
              </View>
            ))}
          </View>

          {/* Summary Skeleton */}
          <View style={styles.skeletonSection}>
            <View style={styles.skeletonSectionTitle} />
            <View style={styles.skeletonSummaryRow}>
              <View style={styles.skeletonSummaryLabel} />
              <View style={styles.skeletonSummaryValue} />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <CommonNavbar
          title="Order Details"
          showIcons={{
            cart: true,
            orders: true,
            wishlist: true,
            profile: true,
          }}
        />
        <View style={styles.errorContainer}>
          <HugeiconsIcon
            icon={AlertCircleIcon}
            size={64}
            color={colors.error}
            strokeWidth={1.5}
          />
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
      <CommonNavbar
        title="Order Details"
        showIcons={{
          cart: true,
          orders: true,
          wishlist: true,
          profile: true,
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Header */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderIdText}>
            Order #{order._id.slice(-8).toUpperCase()}
          </Text>
          <Text style={styles.orderDateText}>
            Placed on {formatDate(order.createdAt)}
          </Text>

          {/* Order Status */}
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: getIsPaid(order)
                    ? colors.success
                    : colors.warning,
                },
              ]}
            >
              <Text style={styles.statusText}>
                {getIsPaid(order) ? 'Paid' : 'Pending Payment'}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Timeline</Text>
          <View style={styles.timeline}>
            {/* Order Placed */}
            {renderTimelineStep(
              'pending',
              'Order Placed',
              'Your order has been received',
              order.createdAt,
              [
                'pending',
                'address_confirmed',
                'confirmed',
                'packed',
                'delivering',
                'delivered',
                'completed',
              ].includes(getOrderStatus(order)),
            )}

            {/* Address Confirmed */}
            {renderTimelineStep(
              'address_confirmed',
              'Address Confirmed',
              'Delivery address has been verified',
              order.status_updates?.address_confirmed?.timestamp,
              [
                'address_confirmed',
                'confirmed',
                'packed',
                'delivering',
                'delivered',
                'completed',
              ].includes(getOrderStatus(order)),
            )}

            {/* Order Confirmed */}
            {renderTimelineStep(
              'confirmed',
              'Order Confirmed',
              'Your order has been confirmed',
              order.status_updates?.confirmed?.timestamp,
              [
                'confirmed',
                'packed',
                'delivering',
                'delivered',
                'completed',
              ].includes(getOrderStatus(order)),
            )}

            {/* Payment Status */}
            <View style={styles.timelineStep}>
              <View style={styles.timelineIconContainer}>
                <View
                  style={[
                    styles.timelineIcon,
                    getPaymentStatus(order) === 'paid'
                      ? styles.timelineIconCompleted
                      : styles.timelineIconPending,
                  ]}
                >
                  <HugeiconsIcon
                    icon={CreditCardIcon}
                    size={16}
                    color={
                      getPaymentStatus(order) === 'paid'
                        ? colors.white
                        : colors.mutedText
                    }
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineContent}>
                <Text
                  style={[
                    styles.timelineTitle,
                    getPaymentStatus(order) === 'paid' &&
                      styles.timelineTitleCompleted,
                  ]}
                >
                  Payment{' '}
                  {getPaymentStatus(order) === 'paid' ? 'Completed' : 'Pending'}
                </Text>
                <Text style={styles.timelineDescription}>
                  {getPaymentStatus(order) === 'paid'
                    ? 'Payment received successfully'
                    : 'Payment is pending for this order'}
                </Text>
                {order.paidAt && (
                  <Text style={styles.timelineTimestamp}>
                    {formatShortDate(order.paidAt)}
                  </Text>
                )}
              </View>
            </View>

            {/* Order Packed */}
            {renderTimelineStep(
              'packed',
              'Order Packed',
              'Your order has been packed and ready for shipment',
              order.status_updates?.packed?.timestamp,
              ['packed', 'delivering', 'delivered', 'completed'].includes(
                getOrderStatus(order),
              ),
            )}

            {/* Out for Delivery */}
            {renderTimelineStep(
              'delivering',
              'Out for Delivery',
              'Your order is on the way',
              order.status_updates?.delivering?.timestamp,
              ['delivering', 'delivered', 'completed'].includes(
                getOrderStatus(order),
              ),
              order.status_updates?.delivering?.by?.name,
            )}

            {/* Delivered */}
            {renderTimelineStep(
              'delivered',
              'Delivered',
              'Order has been delivered successfully',
              order.status_updates?.delivered?.timestamp,
              ['delivered', 'completed'].includes(getOrderStatus(order)),
              undefined,
              getOrderStatus(order) !== 'cancelled', // Only mark as last if not cancelled
            )}

            {/* Cancelled - Only show if order is cancelled */}
            {getOrderStatus(order) === 'cancelled' && (
              <View style={styles.timelineStep}>
                <View style={styles.timelineIconContainer}>
                  <View style={styles.timelineIconCancelled}>
                    <HugeiconsIcon
                      icon={CancelCircleIcon}
                      size={16}
                      color={colors.white}
                      strokeWidth={2}
                    />
                  </View>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitleCancelled}>
                    Order Cancelled
                  </Text>
                  <Text style={styles.timelineDescription}>
                    This order has been cancelled
                  </Text>
                  {order.status_updates?.cancelled?.timestamp && (
                    <Text style={styles.timelineTimestamp}>
                      {formatShortDate(
                        order.status_updates.cancelled.timestamp,
                      )}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {getOrderItems(order).map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Image
                source={{
                  uri: getItemImage(item) || 'https://via.placeholder.com/60',
                }}
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

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.totalValue}>
              ${getTotalPrice(order).toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {(() => {
          const isPaid = getIsPaid(order);
          const canPay =
            !isPaid &&
            order.status !== 'delivering' &&
            order.status !== 'delivered' &&
            order.status !== 'completed' &&
            order.status !== 'cancelled';

          return canPay ? (
            <TouchableOpacity
              style={styles.payNowButton}
              onPress={() => setPaymentModalVisible(true)}
            >
              <HugeiconsIcon
                icon={ShoppingBag01Icon}
                size={20}
                color={colors.white}
                strokeWidth={2}
              />
              <Text style={styles.payNowButtonText}>Pay Now</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <HugeiconsIcon
                icon={ShoppingBag01Icon}
                size={20}
                color={colors.white}
                strokeWidth={2}
              />
              <Text style={styles.continueButtonText}>Continue Shopping</Text>
            </TouchableOpacity>
          );
        })()}
      </View>

      {/* Payment Modal */}
      {order && (
        <OrderPaymentModal
          visible={paymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          order={order}
          onPaymentSuccess={async () => {
            await syncOrdersFromServer();
            fetchOrder();
          }}
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
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.mutedText,
    fontFamily: 'Poppins-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: colors.error,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: colors.babyshopSky,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  orderHeader: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderIdText: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: colors.text,
    marginBottom: 4,
  },
  orderDateText: {
    fontSize: 14,
    color: colors.mutedText,
    fontFamily: 'Poppins-Regular',
  },
  statusContainer: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: colors.text,
    marginBottom: 16,
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
    backgroundColor: colors.lightGray,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: colors.text,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 12,
    color: colors.mutedText,
    fontFamily: 'Poppins-Regular',
  },
  itemTotal: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.mutedText,
    fontFamily: 'Poppins-Regular',
  },
  totalValue: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: colors.babyshopSky,
  },
  actionContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightBorder,
  },
  continueButton: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 8,
  },
  payNowButton: {
    backgroundColor: colors.babyshopSky,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.babyshopSky,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  payNowButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 8,
  },
  timeline: {
    position: 'relative',
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineIconContainer: {
    position: 'relative',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.lightBorder,
    backgroundColor: colors.white,
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    top: 32,
    left: 15,
    width: 2,
    height: 44,
    backgroundColor: colors.lightBorder,
    overflow: 'hidden',
  },
  timelineLineAnimated: {
    width: 2,
  },
  timelineIconCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  timelineIconPending: {
    backgroundColor: colors.white,
    borderColor: colors.lightBorder,
  },
  timelineIconCancelled: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.error,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: colors.mutedText,
    marginBottom: 4,
  },
  timelineTitleCompleted: {
    color: colors.babyshopSky,
    fontWeight: '600',
  },
  timelineTitleCancelled: {
    color: colors.error,
  },
  timelineDescription: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: colors.mutedText,
    marginBottom: 4,
  },
  timelineTimestamp: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: colors.mutedText,
    marginTop: 2,
  },
  timelineUpdatedBy: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: colors.mutedText,
    fontStyle: 'italic',
  },
  // Skeleton styles
  skeletonSection: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  skeletonOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonOrderId: {
    width: 120,
    height: 20,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
  },
  skeletonBadge: {
    width: 80,
    height: 26,
    backgroundColor: colors.lightGray,
    borderRadius: 13,
  },
  skeletonDate: {
    width: 180,
    height: 14,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
  },
  skeletonSectionTitle: {
    width: 120,
    height: 18,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    marginBottom: 16,
  },
  skeletonTimelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  skeletonTimelineIcon: {
    width: 32,
    height: 32,
    backgroundColor: colors.lightGray,
    borderRadius: 16,
    marginRight: 12,
  },
  skeletonTimelineContent: {
    flex: 1,
  },
  skeletonTimelineTitle: {
    width: '70%',
    height: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTimelineDescription: {
    width: '90%',
    height: 14,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
  },
  skeletonOrderItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  skeletonItemImage: {
    width: 60,
    height: 60,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    marginRight: 12,
  },
  skeletonItemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonItemName: {
    width: '80%',
    height: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonItemPrice: {
    width: '50%',
    height: 14,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
  },
  skeletonItemTotal: {
    width: 60,
    height: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    alignSelf: 'center',
  },
  skeletonSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonSummaryLabel: {
    width: 80,
    height: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
  },
  skeletonSummaryValue: {
    width: 100,
    height: 24,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
  },
});

export default SingleOrderScreen;
