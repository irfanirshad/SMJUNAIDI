import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Order } from '../../types';
import colors from '../constants/colors';
import CommonNavbar from '../components/common/CommonNavbar';
import OrderPaymentModal from '../components/common/OrderPaymentModal';
import { useCart } from '../hooks/useCart';
import { useOrders } from '../hooks/useOrders';
import { useAuth } from '../hooks/useAuth';
import { formatPrice } from '../config/environment';

import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  CalendarIcon,
  CreditCardIcon,
  CheckmarkCircle01Icon,
  ShoppingBag01Icon,
  PackageIcon,
  TruckDeliveryIcon,
} from '@hugeicons/core-free-icons';

type OrdersScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Orders'
>;

interface Props {
  navigation: OrdersScreenNavigationProp;
}

const OrdersScreen: React.FC<Props> = ({ navigation }) => {
  const { cartCount } = useCart();
  const { orders, isLoading, syncOrdersFromServer } = useOrders();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        delay: 100,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  useEffect(() => {
    // Sync orders when component mounts if user is authenticated
    if (user?.token) {
      console.log('OrdersScreen: Syncing orders for authenticated user');
      syncOrdersFromServer();
    } else {
      console.log('OrdersScreen: No user token available');
    }
  }, [user?.token, syncOrdersFromServer]);

  // Debug log for orders
  useEffect(() => {
    console.log('OrdersScreen: Orders updated:', orders?.length || 0, 'orders');
    console.log('OrdersScreen: isLoading:', isLoading);
  }, [orders, isLoading]);

  const onRefresh = async () => {
    if (!user?.token) return;

    setRefreshing(true);
    try {
      await syncOrdersFromServer();
    } catch (error) {
      console.error('Error refreshing orders:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Helper functions to handle both server and client order formats
  const getOrderItems = (order: Order) => {
    return order.items || order.orderItems || [];
  };

  const getTotalPrice = (order: Order) => {
    return order.total || order.totalPrice || 0;
  };

  const getIsPaid = (order: Order) => {
    return order.paymentStatus === 'paid' || order.isPaid || false;
  };

  const formatDate = (date: Date | string) => {
    const orderDate = new Date(date);
    return orderDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleOrderPress = (order: Order) => {
    // Navigate to order details
    navigation.navigate('SingleOrder', { orderId: order._id });
  };

  const handlePayNow = (order: Order) => {
    setSelectedOrder(order);
    setPaymentModalVisible(true);
  };

  const handlePaymentSuccess = async () => {
    // Refresh orders after successful payment
    await syncOrdersFromServer();
  };

  const renderOrderItem = ({ item: order }: { item: Order }) => {
    const isPaid = getIsPaid(order);
    const canPay =
      !isPaid &&
      order.status !== 'delivering' &&
      order.status !== 'delivered' &&
      order.status !== 'completed' &&
      order.status !== 'cancelled';

    return (
      <View>
        <TouchableOpacity
          style={styles.orderCard}
          onPress={() => handleOrderPress(order)}
          activeOpacity={0.7}
        >
          {/* Order Header */}
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderId}>
                #{order._id.slice(-8).toUpperCase()}
              </Text>
              <View style={styles.dateContainer}>
                <HugeiconsIcon
                  icon={CalendarIcon}
                  size={14}
                  color={colors.secondaryText}
                  strokeWidth={2}
                />
                <Text style={styles.orderDate}>
                  {formatDate(order.createdAt)}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isPaid
                    ? colors.babyGreen + '20'
                    : colors.warning + '20',
                },
              ]}
            >
              <HugeiconsIcon
                icon={isPaid ? CheckmarkCircle01Icon : CreditCardIcon}
                size={16}
                color={isPaid ? colors.babyGreen : colors.warning}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: isPaid ? colors.babyGreen : colors.warning,
                  },
                ]}
              >
                {isPaid ? 'Paid' : 'Pending'}
              </Text>
            </View>
          </View>

          {/* Order Details */}
          <View style={styles.orderDetails}>
            <View style={styles.detailItem}>
              <HugeiconsIcon
                icon={PackageIcon}
                size={18}
                color={colors.babyshopSky}
                strokeWidth={2}
              />
              <Text style={styles.detailText}>
                {getOrderItems(order).length} item
                {getOrderItems(order).length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>
                {formatPrice(getTotalPrice(order))}
              </Text>
            </View>
          </View>

          {/* Pay Now Button - Show if payment is pending and order not yet delivering */}
          {canPay && (
            <TouchableOpacity
              style={styles.payNowButton}
              onPress={e => {
                e.stopPropagation();
                handlePayNow(order);
              }}
              activeOpacity={0.8}
            >
              <HugeiconsIcon
                icon={CreditCardIcon}
                size={18}
                color={colors.babyWhite}
                strokeWidth={2}
              />
              <Text style={styles.payNowText}>Pay Now</Text>
            </TouchableOpacity>
          )}

          {/* View Details Footer */}
          <View style={styles.viewDetailsFooter}>
            <Text style={styles.viewDetailsText}>Tap to view details</Text>
            <HugeiconsIcon
              icon={TruckDeliveryIcon}
              size={16}
              color={colors.babyshopSky}
              strokeWidth={2}
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <CommonNavbar
          title="Your Orders"
          cartCount={cartCount}
          showIcons={{ cart: true, wishlist: true, profile: true }}
        />
        <View style={styles.ordersList}>
          {[1, 2, 3, 4, 5].map(index => (
            <View key={index} style={styles.skeletonCard}>
              {/* Skeleton Header */}
              <View style={styles.skeletonHeader}>
                <View style={styles.skeletonLeft}>
                  <View style={styles.skeletonOrderId} />
                  <View style={styles.skeletonDate} />
                </View>
                <View style={styles.skeletonBadge} />
              </View>

              {/* Skeleton Details */}
              <View style={styles.skeletonDetails}>
                <View style={styles.skeletonItemCount} />
                <View style={styles.skeletonTotal} />
              </View>

              {/* Skeleton Footer */}
              <View style={styles.skeletonFooter}>
                <View style={styles.skeletonFooterText} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <View style={styles.container}>
        <CommonNavbar
          title="Your Orders"
          cartCount={cartCount}
          showIcons={{ cart: true, wishlist: true, profile: true }}
        />
        <Animated.View
          style={[
            styles.emptyContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.emptyIconContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <HugeiconsIcon
              icon={ShoppingBag01Icon}
              size={80}
              color={colors.babyshopSky}
              strokeWidth={1.5}
            />
          </Animated.View>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your order history will appear here once you make your first
            purchase
          </Text>

          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('MainTabs')}
            activeOpacity={0.8}
          >
            <HugeiconsIcon
              icon={ShoppingBag01Icon}
              size={20}
              color={colors.babyWhite}
              strokeWidth={2}
            />
            <Text style={styles.emptyButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonNavbar
        title="Your Orders"
        cartCount={cartCount}
        showIcons={{ cart: true, wishlist: true, profile: true }}
      />
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.babyshopSky]}
            tintColor={colors.babyshopSky}
            title="Pull to refresh orders..."
            titleColor={colors.mutedText}
          />
        }
      />

      {/* Payment Method Modal */}
      {selectedOrder && (
        <OrderPaymentModal
          visible={paymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          order={selectedOrder}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.babyshopSky + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 3,
    borderColor: colors.babyshopSky + '30',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    maxWidth: 280,
  },
  emptyButton: {
    backgroundColor: colors.babyshopSky,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.babyshopSky,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyButtonText: {
    color: colors.babyWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.primaryText,
    fontWeight: '500',
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: colors.babyWhite,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.lightBorder,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderDate: {
    fontSize: 13,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: '600',
  },
  totalContainer: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: colors.secondaryText,
    marginBottom: 2,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.babyshopSky,
  },
  payNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.babyshopSky,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
    shadowColor: colors.babyshopSky,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  payNowText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.babyWhite,
    letterSpacing: 0.3,
  },
  viewDetailsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  viewDetailsText: {
    fontSize: 14,
    color: colors.babyshopSky,
    fontWeight: '700',
  },
  skeletonCard: {
    backgroundColor: colors.babyWhite,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.lightBorder,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  skeletonLeft: {
    flex: 1,
  },
  skeletonOrderId: {
    width: 120,
    height: 18,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonDate: {
    width: 90,
    height: 14,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
  },
  skeletonBadge: {
    width: 80,
    height: 28,
    backgroundColor: colors.lightGray,
    borderRadius: 20,
  },
  skeletonDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonItemCount: {
    width: 70,
    height: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
  },
  skeletonTotal: {
    width: 100,
    height: 24,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
  },
  skeletonFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    alignItems: 'center',
  },
  skeletonFooterText: {
    width: 120,
    height: 14,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
  },
});

export default OrdersScreen;
