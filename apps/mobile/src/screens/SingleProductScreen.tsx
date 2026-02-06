import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { SingleProductScreenNavigationProp } from '../../types';
import { useProduct } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import colors from '../constants/colors';
import CommonNavbar from '../components/common/CommonNavbar';
import { SingleProductSkeleton } from '../components/skeletons';
import AddToCartButton from '../components/common/AddToCartButton';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Cancel01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';

const { width, height } = Dimensions.get('window');

interface Props {
  navigation: SingleProductScreenNavigationProp;
  route: {
    params: {
      productId: string;
    };
  };
}

const SingleProductScreen: React.FC<Props> = ({ navigation, route }) => {
  const { productId } = route.params;
  const { product, loading, error, refetch } = useProduct(productId);
  const { user } = useAuth();
  const { cartCount } = useCart();

  // Image gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isCarouselOpen, setIsCarouselOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Get all product images
  const getProductImages = () => {
    if (!product) return [];
    const images = [product.image];
    if (product.images && Array.isArray(product.images)) {
      images.push(
        ...product.images.filter((img: string) => img !== product.image),
      );
    }
    return images;
  };

  const productImages = getProductImages();

  const handleThumbnailPress = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleMainImagePress = () => {
    setCarouselIndex(selectedImageIndex);
    setIsCarouselOpen(true);
  };

  const handlePrevImage = () => {
    setCarouselIndex(prev =>
      prev === 0 ? productImages.length - 1 : prev - 1,
    );
  };

  const handleNextImage = () => {
    setCarouselIndex(prev =>
      prev === productImages.length - 1 ? 0 : prev + 1,
    );
  };

  const handleBuyNow = () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to make a purchase', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    // TODO: Implement buy now functionality
    Alert.alert('Buy Now', `Proceeding to checkout for ${product?.name}`);
  };

  // Early error check for invalid route params
  if (!route || !route.params) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Navigation error: Invalid route</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if productId is missing
  if (!productId) {
    console.error('SingleProductScreen: Missing productId');
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Invalid product ID</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonNavbar
          title="Product Details"
          showIcons={{
            cart: true,
            orders: true,
            wishlist: true,
            profile: true,
          }}
        />
        <SingleProductSkeleton />
      </View>
    );
  }

  if (error) {
    console.error('SingleProductScreen: Error state:', error);
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.debugText}>Product ID: {productId}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <Text style={styles.debugText}>Product ID: {productId}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonNavbar
        title={product?.name || 'Loading...'}
        cartCount={cartCount}
        showIcons={{
          cart: true,
          orders: true,
          wishlist: true,
          profile: true,
        }}
      />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Image */}
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={handleMainImagePress} activeOpacity={0.9}>
            <Image
              source={{ uri: productImages[selectedImageIndex] }}
              style={styles.productImage}
            />
            <View style={styles.imageOverlay}>
              <Text style={styles.imageOverlayText}>Tap to view full size</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Thumbnail Images */}
        {productImages.length > 1 && (
          <View style={styles.thumbnailContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailScrollContent}
            >
              {productImages.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleThumbnailPress(index)}
                  style={[
                    styles.thumbnail,
                    selectedImageIndex === index && styles.thumbnailSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Image
                    source={{ uri: image }}
                    style={styles.thumbnailImage}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.contentContainer}>
          <View style={styles.headerSection}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productPrice}>${product.price}</Text>
          </View>

          <View style={styles.metaSection}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Rating:</Text>
              <Text style={styles.ratingText}>
                ⭐ {product.rating} ({product.numReviews} reviews)
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Stock:</Text>
              <Text
                style={[
                  styles.stockText,
                  product.stock > 0 ? styles.inStock : styles.outOfStock,
                ]}
              >
                {product.stock > 0
                  ? `${product.stock} available`
                  : 'Out of stock'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Category:</Text>
              <Text style={styles.metaValue}>
                {typeof product.category === 'object' &&
                (product.category as any)?.name
                  ? (product.category as any).name
                  : product.category || 'N/A'}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Brand:</Text>
              <Text style={styles.metaValue}>
                {typeof product.brand === 'object' &&
                (product.brand as any)?.name
                  ? (product.brand as any).name
                  : product.brand || 'N/A'}
              </Text>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.actionSection}>
            <AddToCartButton
              product={product}
              customStyle={styles.addToCartButton}
            />
            {/* <TouchableOpacity
              style={[
                styles.addToCartButton,
                product.stock === 0 && styles.disabledButton,
              ]}
              onPress={handleAddToCart}
              disabled={product.stock === 0}
            >
              <Text style={styles.addToCartButtonText}>
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Text>
            </TouchableOpacity> */}

            <TouchableOpacity
              style={[
                styles.buyNowButton,
                product.stock === 0 && styles.disabledButton,
              ]}
              onPress={handleBuyNow}
              disabled={product.stock === 0}
            >
              <Text style={styles.buyNowButtonText}>
                {product.stock === 0 ? 'Unavailable' : 'Buy Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Image Carousel Modal */}
      <Modal
        visible={isCarouselOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCarouselOpen(false)}
      >
        <View style={styles.carouselModalContainer}>
          <View style={styles.carouselHeader}>
            <Text style={styles.carouselTitle}>
              {carouselIndex + 1} / {productImages.length}
            </Text>
            <TouchableOpacity
              onPress={() => setIsCarouselOpen(false)}
              style={styles.closeButton}
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={28}
                color={colors.babyWhite}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.carouselContent}>
            <TouchableOpacity
              onPress={handlePrevImage}
              style={styles.carouselNavButton}
              activeOpacity={0.7}
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={20}
                color={colors.babyWhite}
                strokeWidth={2.5}
              />
            </TouchableOpacity>

            <Image
              source={{ uri: productImages[carouselIndex] }}
              style={styles.carouselImage}
              resizeMode="contain"
            />

            <TouchableOpacity
              onPress={handleNextImage}
              style={styles.carouselNavButton}
              activeOpacity={0.7}
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={20}
                color={colors.babyWhite}
                strokeWidth={2.5}
              />
            </TouchableOpacity>
          </View>

          {/* Carousel Thumbnails */}
          <View style={styles.carouselThumbnailContainer}>
            <FlatList
              horizontal
              data={productImages}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => setCarouselIndex(index)}
                  style={[
                    styles.carouselThumbnail,
                    carouselIndex === index && styles.carouselThumbnailSelected,
                  ]}
                >
                  <Image
                    source={{ uri: item }}
                    style={styles.carouselThumbnailImage}
                  />
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselThumbnailList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.babyShopLightWhite,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: colors.babyShopLightWhite,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.babyShopLightWhite,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.babyShopLightWhite,
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 18,
    color: colors.babyshopRed,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: colors.babyshopSky,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: colors.babyWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  imageContainer: {
    backgroundColor: colors.babyWhite,
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  productImage: {
    width: width - 24,
    height: width - 24,
    resizeMode: 'contain',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  imageOverlayText: {
    color: colors.babyWhite,
    fontSize: 12,
    fontWeight: '500',
  },
  thumbnailContainer: {
    backgroundColor: colors.babyWhite,
    marginHorizontal: 12,
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  thumbnailScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailSelected: {
    borderColor: colors.babyshopSky,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  carouselModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  carouselHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  carouselTitle: {
    color: colors.babyWhite,
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  carouselContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  carouselNavButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  carouselImage: {
    width: width - 100,
    height: height * 0.6,
  },
  carouselThumbnailContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  carouselThumbnailList: {
    paddingHorizontal: 10,
    gap: 10,
  },
  carouselThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  carouselThumbnailSelected: {
    borderColor: colors.babyshopSky,
  },
  carouselThumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentContainer: {
    backgroundColor: colors.babyWhite,
    marginHorizontal: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 16,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginBottom: 20,
  },
  headerSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
  },
  productName: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primaryText,
    marginBottom: 8,
    lineHeight: 32,
  },
  productPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.babyshopSky,
  },
  metaSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 4,
  },
  metaLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
  },
  metaValue: {
    fontSize: 16,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  ratingText: {
    fontSize: 16,
    color: colors.babyYellow,
    fontWeight: '600',
  },
  stockText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inStock: {
    color: colors.babyGreen,
  },
  outOfStock: {
    color: colors.babyshopRed,
  },
  descriptionSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primaryText,
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: colors.secondaryText,
    lineHeight: 26,
    fontWeight: '400',
  },
  actionSection: {
    gap: 16,
  },
  addToCartButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  addToCartButtonText: {
    color: colors.babyWhite,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buyNowButton: {
    backgroundColor: colors.babyshopSky,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  buyNowButtonText: {
    color: colors.babyWhite,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disabledButton: {
    backgroundColor: colors.mediumGray,
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  debugText: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  secondaryButton: {
    backgroundColor: colors.softGray,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 12,
    elevation: 1,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});

export default SingleProductScreen;
