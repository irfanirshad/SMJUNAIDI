import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
} from 'react-native';
import { HomeScreenNavigationProp, Product } from '../../../types';
import colors from '../../constants/colors';
import { formatPrice } from '../../config/environment';

import { HugeiconsIcon } from '@hugeicons/react-native';
import { FavouriteIcon } from '@hugeicons/core-free-icons';
import AddToCartButton from '../common/AddToCartButton';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 45) / 2; // 45 = padding + gap

interface Props {
  item: Product;
  navigation: HomeScreenNavigationProp;
  isHorizontal?: boolean;
}

const HomeProductRender: React.FC<Props> = ({
  item,
  navigation,
  isHorizontal = false,
}) => {
  // Calculate discounted price if there's a discount (using a fallback)
  const discountPercentage = (item as any).discountPercentage || 0;
  const hasDiscount = discountPercentage > 0;
  const discountedPrice = hasDiscount
    ? item.price * (1 - discountPercentage / 100)
    : item.price;

  return (
    <View style={styles.productCard}>
      {/* Image Section with Overlay Elements */}
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={
          () => navigation.navigate('SingleProduct', { productId: item._id })
          //   console.log('item', item)
        }
        activeOpacity={0.7}
      >
        <Image source={{ uri: item.image }} style={styles.productImage} />

        {/* Discount Badge */}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercentage}%</Text>
          </View>
        )}

        {/* Wishlist Button */}
        <TouchableOpacity style={styles.wishlistButton} activeOpacity={0.7}>
          <HugeiconsIcon
            icon={FavouriteIcon}
            size={16}
            color={colors.secondaryText}
            strokeWidth={1.5}
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Content Section */}
      <View style={styles.productContent}>
        {/* Category */}
        {item.category && (
          <Text style={styles.categoryText}>
            {item.category.name.toUpperCase()}
          </Text>
        )}

        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>

        {/* Price Container */}
        <View style={styles.priceContainer}>
          {hasDiscount ? (
            <>
              <Text style={styles.originalPrice}>
                {formatPrice(item.price)}
              </Text>
              <Text style={styles.discountedPrice}>
                {formatPrice(discountedPrice)}
              </Text>
            </>
          ) : (
            <Text style={styles.currentPrice}>
              {formatPrice(item.price)}
            </Text>
          )}
        </View>

        {/* Add to Cart Button - Only show in grid view, not horizontal */}
        {!isHorizontal && <AddToCartButton product={item} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  productCard: {
    backgroundColor: colors.babyWhite,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    marginBottom: 15,
    width: ITEM_WIDTH,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: colors.babyWhite,
  },
  productImage: {
    width: '100%',
    height: 128,
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.babyshopRed,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    color: colors.babyshopWhite,
    fontSize: 10,
    fontWeight: '600',
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.babyWhite,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightBorder,
  },
  productContent: {
    padding: 12,
    gap: 4,
  },
  categoryText: {
    fontSize: 10,
    color: colors.babyshopTextLight,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 14,
    color: colors.primaryText,
    lineHeight: 18,
    fontWeight: '500',
    height: 38,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.babyshopTextLight,
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  discountedPrice: {
    fontSize: 14,
    color: colors.babyshopRed,
    fontWeight: '600',
  },
  currentPrice: {
    fontSize: 14,
    color: colors.babyshopSky,
    fontWeight: '600',
  },
});

export { HomeProductRender };
