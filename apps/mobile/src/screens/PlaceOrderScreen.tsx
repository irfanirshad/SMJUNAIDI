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
import { RootStackParamList, Address } from '../../types';
import colors from '../constants/colors';
import CommonNavbar from '../components/common/CommonNavbar';
import AddressSelector from '../components/common/AddressSelector';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useOrders } from '../hooks/useOrders';
import { orderAPI } from '../services/api';
import {
  TAX_AMOUNT,
  calculateShippingCost,
  formatPrice,
} from '../config/environment';

import { HugeiconsIcon } from '@hugeicons/react-native';
import { CreditCardIcon, ShoppingBag01Icon } from '@hugeicons/core-free-icons';

type PlaceOrderScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PlaceOrder'
>;
interface Props {
  navigation: PlaceOrderScreenNavigationProp;
}

const PlaceOrderScreen: React.FC<Props> = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const { cartItemsWithQuantities } = useCart();
  const { addOrder } = useOrders();
  const auth_token = user?.token;

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    // Set default address if user has addresses
    if (user?.addresses && user.addresses.length > 0) {
      const defaultAddress =
        user.addresses.find(addr => addr.isDefault) || user.addresses[0];
      setSelectedAddress(defaultAddress);
    }
  }, [user]); // Function to handle when new address is added or when addresses are updated (including deletion)
  const handleAddressAdded = async (newAddress: Address) => {
    // Store the current selected address ID before refresh
    const currentSelectedId = selectedAddress?._id;

    // Refresh user data to get updated addresses
    await refreshUser();

    // After refresh, handle address selection logic
    setTimeout(() => {
      if (user?.addresses && user.addresses.length > 0) {
        // If newAddress has data (it's a real addition), select it
        if (newAddress._id) {
          setSelectedAddress(newAddress);
        } else {
          // This is a deletion operation (dummy address passed)
          // Check if the previously selected address still exists
          const stillExists = user.addresses.find(
            addr => addr._id === currentSelectedId,
          );

          if (stillExists) {
            setSelectedAddress(stillExists);
          } else {
            // Selected address was deleted, select the first available address
            const firstAddress = user.addresses[0];
            setSelectedAddress(firstAddress);
          }
        }
      } else {
        // No addresses remaining

        setSelectedAddress(null);
      }
    }, 100); // Small delay to ensure user data is updated
  };

  const calculateOrderSummary = () => {
    // Calculate subtotal using original prices (before any discounts)
    const subtotal = cartItemsWithQuantities.reduce((total, item) => {
      const originalPrice = item.product.originalPrice || item.product.price;
      return total + originalPrice * item.quantity;
    }, 0);

    // Calculate total discount amount
    const totalDiscount = cartItemsWithQuantities.reduce(
      (discountSum, item) => {
        const originalPrice = item.product.originalPrice || item.product.price;
        const currentPrice = item.product.price;
        const itemDiscount = (originalPrice - currentPrice) * item.quantity;
        return discountSum + itemDiscount;
      },
      0,
    );

    // Calculate discounted total (what the customer actually pays for products)
    const discountedTotal = cartItemsWithQuantities.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);

    const shippingPrice = calculateShippingCost(discountedTotal);
    const taxPrice = TAX_AMOUNT * discountedTotal;
    const finalTotal = discountedTotal + shippingPrice + taxPrice;

    return {
      subtotal, // Original prices total
      discount: totalDiscount, // Total discount amount
      discountedSubtotal: discountedTotal, // Subtotal after discounts
      shippingPrice,
      taxPrice,
      totalPrice: finalTotal, // Final amount to pay
    };
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert(
        'Address Required',
        'Please select a shipping address to continue.',
      );
      return;
    }

    if (!auth_token) {
      Alert.alert('Authentication Error', 'Please login to place an order.');
      navigation.navigate('Login');
      return;
    }

    if (cartItemsWithQuantities.length === 0) {
      Alert.alert(
        'Empty Cart',
        'Your cart is empty. Please add some items first.',
      );
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Prepare order data - backend calculates totals, shipping, and tax
      const orderData = {
        items: cartItemsWithQuantities.map(item => ({
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image,
        })),
        shippingAddress: selectedAddress,
        paymentMethod: 'razorpay',
      };

      const response = await orderAPI.createOrder(auth_token, orderData);

      if (response.success && response.order) {
        console.log('✅ Order created successfully:', response.order._id);

        // Add the new order to the orders store for real-time updates
        addOrder(response.order);
        console.log('📦 Order added to store:', response.order._id);

        // Navigate to checkout screen for payment
        navigation.navigate('Checkout', {
          orderId: response.order._id,
          paymentMethod: 'razorpay',
        });
      } else {
        Alert.alert(
          'Order Failed',
          response.message || 'Failed to place order. Please try again.',
        );
      }
    } catch (error) {
      console.error('Place order error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const orderSummary = calculateOrderSummary();

  return (
    <View style={styles.container}>
      <CommonNavbar title="Place Order" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Shipping Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Address</Text>
          <AddressSelector
            selectedAddress={selectedAddress}
            onAddressSelect={setSelectedAddress}
            onAddressAdded={handleAddressAdded}
          />
        </View>

        {/* Order Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.itemsContainer}>
            {cartItemsWithQuantities.map(item => (
              <View key={item.product._id} style={styles.orderItem}>
                <Image
                  source={{ uri: item.product.image }}
                  style={styles.itemImage}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <View style={styles.priceContainer}>
                    {item.product.originalPrice &&
                    item.product.originalPrice > item.product.price ? (
                      <View style={styles.priceRow}>
                        <Text style={styles.originalPrice}>
                          {formatPrice(item.product.originalPrice)}
                        </Text>
                        <Text style={[styles.itemPrice, styles.salePrice]}>
                          {formatPrice(item.product.price)} x {item.quantity}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.itemPrice}>
                        {formatPrice(item.product.price)} x {item.quantity}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={styles.itemTotal}>
                  {formatPrice(item.product.price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {/* Payment Method Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentMethod}>
            <HugeiconsIcon
              icon={CreditCardIcon}
              size={24}
              color={colors.babyshopSky}
              strokeWidth={2}
            />
            <Text style={styles.paymentText}>Razorpay (UPI / Cards)</Text>
          </View>
        </View>

        {/* Order Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(orderSummary.subtotal)}
              </Text>
            </View>
            {orderSummary.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -{formatPrice(orderSummary.discount)}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>
                {formatPrice(orderSummary.taxPrice)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text
                style={[
                  styles.summaryValue,
                  orderSummary.shippingPrice === 0 && styles.freeText,
                ]}
              >
                {orderSummary.shippingPrice === 0
                  ? 'FREE'
                  : formatPrice(orderSummary.shippingPrice)}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatPrice(orderSummary.totalPrice)}
              </Text>
            </View>
          </View>
        </View>

      {/* Place Order Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.placeOrderButton,
            (isPlacingOrder ||
              !selectedAddress ||
              cartItemsWithQuantities.length === 0) &&
              styles.disabledButton,
          ]}
          onPress={handlePlaceOrder}
          disabled={
            isPlacingOrder ||
            !selectedAddress ||
            cartItemsWithQuantities.length === 0
          }
        >
          {isPlacingOrder ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.white} />
              <Text style={styles.loadingText}>Placing Order...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <HugeiconsIcon
                icon={ShoppingBag01Icon}
                size={20}
                color={colors.white}
                strokeWidth={2}
              />
              <Text style={styles.buttonText}>
                Continue to Checkout - {formatPrice(orderSummary.totalPrice)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.lightBorder,
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
  priceContainer: {
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.mutedText,
    textDecorationLine: 'line-through',
    fontFamily: 'Poppins-Regular',
  },
  salePrice: {
    color: colors.babyshopSky,
    fontFamily: 'Poppins-Medium',
  },
  itemTotal: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: colors.text,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  paymentText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Poppins-Medium',
  },
  summaryContainer: {
    paddingTop: 8,
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
  summaryValue: {
    fontSize: 14,
    color: colors.text,
    fontFamily: 'Poppins-Medium',
  },
  freeText: {
    color: colors.success,
    fontWeight: 'bold',
  },
  discountLabel: {
    color: colors.success,
  },
  discountValue: {
    color: colors.success,
    fontFamily: 'Poppins-SemiBold',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightBorder,
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: colors.babyshopSky,
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightBorder,
  },
  placeOrderButton: {
    backgroundColor: colors.babyshopSky,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: colors.babyshopSky,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: colors.mutedText,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 8,
  },
  loadingText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    marginLeft: 12,
  },
});

export default PlaceOrderScreen;
