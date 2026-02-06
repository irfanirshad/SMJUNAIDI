import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Product } from '../../types';
import colors from '../constants/colors';
import CommonNavbar from '../components/common/CommonNavbar';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useWishlistStore } from '../store';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Delete02Icon,
  ShoppingBag02Icon,
  FavouriteIcon,
} from '@hugeicons/core-free-icons';

type WishlistScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Wishlist'
>;

interface Props {
  navigation: WishlistScreenNavigationProp;
}

const WishlistScreen: React.FC<Props> = ({ navigation }) => {
  const { cartCount, addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const {
    wishlistProducts,
    wishlistIds,
    isLoading,
    removeFromWishlist,
    clearWishlist,
    syncWishlistFromServer,
    fetchWishlistProducts,
  } = useWishlistStore();

  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      syncWishlistFromServer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (wishlistIds.length > 0) {
      fetchWishlistProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wishlistIds]);

  const handleRemoveItem = async (productId: string) => {
    setRemoving(productId);
    try {
      await removeFromWishlist(productId);
    } catch (error) {
      Alert.alert('Error', 'Failed to remove item from wishlist');
    } finally {
      setRemoving(null);
    }
  };

  const handleClearWishlist = () => {
    Alert.alert(
      'Clear Wishlist',
      'Are you sure you want to clear all items from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearWishlist();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear wishlist');
            }
          },
        },
      ],
    );
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addToCart(product, 1);
      Alert.alert('Success', `${product.name} added to cart`);
    } catch (error) {
      console.error('Failed to add to cart:', error);

      // Extract meaningful error message
      let errorMessage = 'Failed to add item to cart';
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

      Alert.alert('Cannot Add to Cart', errorMessage);
    }
  };

  const renderWishlistItem = ({ item }: { item: Product }) => {
    const discountedPrice = item.discountPercentage
      ? item.price * (1 - item.discountPercentage / 100)
      : item.price;

    return (
      <View style={styles.itemCard}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('SingleProduct', { productId: item._id })
          }
          style={styles.imageContainer}
        >
          <Image
            source={{ uri: item.image }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {item.discountPercentage && item.discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{item.discountPercentage}%
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.itemDetails}>
          <Text style={styles.categoryText}>{item.category.name}</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('SingleProduct', { productId: item._id })
            }
          >
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
          </TouchableOpacity>

          <View style={styles.priceContainer}>
            {item.discountPercentage && item.discountPercentage > 0 ? (
              <>
                <Text style={styles.originalPrice}>
                  ${item.price.toFixed(2)}
                </Text>
                <Text style={styles.discountedPrice}>
                  ${discountedPrice.toFixed(2)}
                </Text>
              </>
            ) : (
              <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            )}
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveItem(item._id)}
              disabled={removing === item._id}
            >
              {removing === item._id ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <HugeiconsIcon
                  icon={Delete02Icon}
                  size={18}
                  color={colors.error}
                  strokeWidth={2}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={() => handleAddToCart(item)}
            >
              <HugeiconsIcon
                icon={ShoppingBag02Icon}
                size={16}
                color="#fff"
                strokeWidth={2}
              />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyWishlist = () => (
    <View style={styles.emptyContainer}>
      <HugeiconsIcon
        icon={FavouriteIcon}
        size={64}
        color={colors.lightGray}
        strokeWidth={2}
      />
      <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
      <Text style={styles.emptySubtitle}>
        Save your favorite products here to buy them later
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('MainTabs')}
      >
        <Text style={styles.shopButtonText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <CommonNavbar
          title="Your Wishlist"
          cartCount={cartCount}
          showIcons={{ cart: true, orders: true, profile: true }}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Please Sign In</Text>
          <Text style={styles.emptySubtitle}>
            Sign in to view your wishlist
          </Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.shopButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CommonNavbar
        title="Your Wishlist"
        cartCount={cartCount}
        showIcons={{ cart: true, orders: true, profile: true }}
      />

      {isLoading && wishlistProducts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.babyshopSky} />
          <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
      ) : wishlistProducts.length === 0 ? (
        renderEmptyWishlist()
      ) : (
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {wishlistIds.length} {wishlistIds.length === 1 ? 'item' : 'items'}
            </Text>
            {wishlistProducts.length > 0 && (
              <TouchableOpacity onPress={handleClearWishlist}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={wishlistProducts}
            renderItem={renderWishlistItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.babyWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
  },
  clearAllText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  categoryText: {
    fontSize: 11,
    color: colors.secondaryText,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.secondaryText,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.error,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.babyshopSky,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  addToCartText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.secondaryText,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: colors.babyshopSky,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: colors.babyWhite,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WishlistScreen;
