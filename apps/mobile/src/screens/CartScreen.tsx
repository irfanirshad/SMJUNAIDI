import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Image,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import colors from '../constants/colors';
import CommonNavbar from '../components/common/CommonNavbar';
import { useCart } from '../hooks/useCart';
import {
  TAX_AMOUNT,
  FREE_DELIVERY_THRESHOLD,
  SHIPPING_FEE,
} from '../config/environment';

import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ShoppingBag01Icon,
  TruckIcon,
  ShieldIcon,
  TagIcon,
  Add01Icon,
  Remove01Icon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';
import { useToast } from '../context/ToastContext';

type CartScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Cart'>;

interface Props {
  navigation: CartScreenNavigationProp;
}

const CartScreen: React.FC<Props> = ({ navigation }) => {
  const {
    cartCount,
    cartItemsWithQuantities,
    totalPrice,
    updateQuantity,
    removeFromCart,
    clearCart,
    isLoading,
  } = useCart();

  const { showToast } = useToast();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        delay: 200,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  const handleQuantityUpdate = async (
    productId: string,
    newQuantity: number,
  ) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);

      // Extract meaningful error message
      let errorMessage = 'Failed to update quantity';
      if (error instanceof Error) {
        // Check if it's a stock availability error
        if (error.message.includes('available in stock')) {
          errorMessage = error.message;
        } else if (error.message.includes('stock')) {
          errorMessage = error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      Alert.alert('Cannot Update Quantity', errorMessage);
    }
  };

  const handleResetCart = async () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCart();
            } catch (error) {
              console.error('Failed to clear cart:', error);
              Alert.alert('Error', 'Failed to clear cart');
            }
          },
        },
      ],
    );
  };

  const handleRemoveItem = async (productId: string, productName: string) => {
    try {
      await removeFromCart(productId);
      showToast(`${productName} removed from cart`, 'success');
    } catch (error) {
      console.error('Failed to remove item:', error);
      showToast('Failed to remove item', 'error');
    }
  };

  const renderCartItem = (item: any, _index: number) => (
    <Animated.View
      key={item.product._id}
      style={[
        styles.cartItem,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Image source={{ uri: item.product.image }} style={styles.productImage} />

      <View style={styles.productDetails}>
        <View style={styles.productHeader}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.product.name}
          </Text>
          <Text style={styles.itemTotal}>
            ${(item.product.price * item.quantity).toFixed(2)}
          </Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>
            ${item.product.price.toFixed(2)}
          </Text>
        </View>

        <View style={styles.controlsContainer}>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                (item.quantity <= 1 || isLoading) && styles.disabledButton,
              ]}
              onPress={() =>
                handleQuantityUpdate(item.product._id, item.quantity - 1)
              }
              disabled={item.quantity <= 1 || isLoading}
            >
              <HugeiconsIcon
                icon={Remove01Icon}
                size={18}
                color={
                  item.quantity <= 1 || isLoading
                    ? colors.mutedText
                    : colors.primaryText
                }
                strokeWidth={2}
              />
            </TouchableOpacity>

            <Text style={styles.quantityText}>{item.quantity}</Text>

            <TouchableOpacity
              style={[
                styles.quantityButton,
                isLoading && styles.disabledButton,
              ]}
              onPress={() =>
                handleQuantityUpdate(item.product._id, item.quantity + 1)
              }
              disabled={isLoading}
            >
              <HugeiconsIcon
                icon={Add01Icon}
                size={18}
                color={isLoading ? colors.mutedText : colors.primaryText}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.removeButton, isLoading && styles.disabledButton]}
            onPress={() =>
              handleRemoveItem(item.product._id, item.product.name)
            }
            disabled={isLoading}
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              size={20}
              color={isLoading ? colors.mutedText : colors.error}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const renderCartSummary = () => {
    const subtotal = totalPrice;
    const shippingFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : SHIPPING_FEE;
    const tax = TAX_AMOUNT * subtotal;
    const finalTotal = subtotal + shippingFee + tax;

    return (
      <Animated.View
        style={[
          styles.summaryContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <TouchableOpacity
            style={[styles.resetButton, isLoading && styles.disabledButton]}
            onPress={handleResetCart}
            disabled={isLoading}
          >
            <Text style={styles.resetButtonText}>Clear Cart</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal ({cartCount} items)</Text>
          <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping</Text>
          <Text
            style={[styles.summaryValue, shippingFee === 0 && styles.freeText]}
          >
            {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax</Text>
          <Text style={styles.summaryValue}>$0.00</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${finalTotal.toFixed(2)}</Text>
        </View>

        {subtotal < FREE_DELIVERY_THRESHOLD && (
          <Text style={styles.freeShippingNote}>
            Add ${(FREE_DELIVERY_THRESHOLD - subtotal).toFixed(2)} more for free
            shipping!
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.checkoutButton,
            (isLoading || cartItemsWithQuantities.length === 0) &&
              styles.disabledButton,
          ]}
          onPress={() => {
            if (cartItemsWithQuantities.length === 0) {
              Alert.alert(
                'Empty Cart',
                'Please add some items to your cart before placing an order.',
              );
              return;
            }

            if (totalPrice <= 0) {
              Alert.alert(
                'Invalid Order',
                'Order total must be greater than $0.',
              );
              return;
            }

            navigation.navigate('PlaceOrder');
          }}
          disabled={isLoading || cartItemsWithQuantities.length === 0}
        >
          <Text
            style={[
              styles.checkoutButtonText,
              (isLoading || cartItemsWithQuantities.length === 0) &&
                styles.disabledButtonText,
            ]}
          >
            {isLoading ? 'Processing...' : 'Place Order'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <CommonNavbar
        title="Your Cart"
        cartCount={cartCount}
        showIcons={{ orders: true, wishlist: true, profile: true }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {cartItemsWithQuantities.length > 0 ? (
          // Show cart items and summary
          <>
            <View style={styles.cartItemsContainer}>
              {cartItemsWithQuantities.map((item, index) =>
                renderCartItem(item, index),
              )}
            </View>
            {renderCartSummary()}
          </>
        ) : (
          // Show empty cart state
          <Animated.View
            style={[
              styles.emptyCartCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Main Empty State */}
            <View style={styles.emptyStateContainer}>
              {/* Illustration Container with Gradient Background */}
              <Animated.View
                style={[
                  styles.illustrationWrapper,
                  {
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <View style={styles.iconContainer}>
                  <HugeiconsIcon
                    icon={ShoppingBag01Icon}
                    size={80}
                    color={colors.babyshopSky}
                    strokeWidth={1.5}
                  />
                </View>
                {/* Decorative circles */}
                <View style={styles.decorativeCircle1} />
                <View style={styles.decorativeCircle2} />
              </Animated.View>

              {/* Main Message */}
              <Animated.View
                style={[
                  styles.messageContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <Text style={styles.mainTitle}>Your Cart is Empty</Text>
                <Text style={styles.subtitle}>
                  Looks like you haven't added anything to your cart yet.
                  {'\n'}
                  Start shopping now!
                </Text>
              </Animated.View>

              {/* Call to Action Buttons */}
              <Animated.View
                style={[
                  styles.buttonContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => navigation.navigate('MainTabs')}
                  activeOpacity={0.8}
                >
                  <HugeiconsIcon
                    icon={ShoppingBag01Icon}
                    size={20}
                    color={colors.babyWhite}
                    strokeWidth={2}
                  />
                  <Text style={styles.primaryButtonText}>Start Shopping</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Features Section */}
            <Animated.View
              style={[
                styles.featuresContainer,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <View style={styles.featuresGrid}>
                <View style={styles.featureItem}>
                  <View
                    style={[styles.featureIconContainer, styles.qualityIcon]}
                  >
                    <HugeiconsIcon
                      icon={ShieldIcon}
                      size={28}
                      color={colors.babyshopSky}
                      strokeWidth={2}
                    />
                  </View>
                  <Text style={styles.featureTitle}>Quality Products</Text>
                  <Text style={styles.featureDescription}>
                    Verified quality for your peace of mind
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <View style={[styles.featureIconContainer, styles.priceIcon]}>
                    <HugeiconsIcon
                      icon={TagIcon}
                      size={28}
                      color={colors.babyGreen}
                      strokeWidth={2}
                    />
                  </View>
                  <Text style={styles.featureTitle}>Best Prices</Text>
                  <Text style={styles.featureDescription}>
                    Competitive prices & great deals
                  </Text>
                </View>

                <View style={styles.featureItem}>
                  <View
                    style={[styles.featureIconContainer, styles.shippingIcon]}
                  >
                    <HugeiconsIcon
                      icon={TruckIcon}
                      size={28}
                      color={colors.babyshopPurple}
                      strokeWidth={2}
                    />
                  </View>
                  <Text style={styles.featureTitle}>Fast Delivery</Text>
                  <Text style={styles.featureDescription}>
                    Quick & reliable shipping
                  </Text>
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  emptyCartCard: {
    backgroundColor: colors.babyWhite,
    borderRadius: 20,
    marginVertical: 10,
    overflow: 'hidden',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  illustrationWrapper: {
    position: 'relative',
    marginBottom: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.babyshopSky + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.babyshopSky + '30',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.babyGreen + '30',
    top: 10,
    right: -10,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.babyshopPurple + '30',
    bottom: 5,
    left: -5,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: colors.babyshopSky,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.babyshopSky,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: colors.babyWhite,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  featuresContainer: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: colors.lightGray + '50',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  qualityIcon: {
    backgroundColor: colors.babyshopSky + '20',
  },
  priceIcon: {
    backgroundColor: colors.babyGreen + '20',
  },
  shippingIcon: {
    backgroundColor: colors.babyshopPurple + '20',
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 11,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 16,
  },
  // Cart Items Styles
  cartItemsContainer: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    shadowColor: colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cartItem: {
    backgroundColor: colors.babyWhite,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    lineHeight: 20,
    flex: 1,
    marginRight: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.error,
    textDecorationLine: 'line-through',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.babyWhite,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightBorder,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: colors.lightGray,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  itemActions: {
    alignItems: 'flex-end',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
  removeButton: {
    padding: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 6,
  },
  // Summary Styles
  summaryContainer: {
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    shadowColor: colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  resetButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  resetButtonText: {
    color: colors.babyWhite,
    fontSize: 12,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
  },
  freeText: {
    color: colors.babyGreen,
    fontWeight: 'bold',
  },
  discountText: {
    color: colors.babyGreen,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.lightBorder,
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
  freeShippingNote: {
    fontSize: 12,
    color: colors.babyshopSky,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  checkoutButton: {
    backgroundColor: colors.babyshopSky,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  checkoutButtonText: {
    color: colors.babyWhite,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButtonText: {
    color: colors.lightGray,
  },
});

export default CartScreen;
