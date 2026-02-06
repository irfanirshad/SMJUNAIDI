import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import Voice, { MicIcon, MicOffIcon } from 'react-native-voice-ts';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { productAPI } from '../services/api';
import { Product } from '../../types';
import colors from '../constants/colors';
import ProductSkeleton from '../components/skeletons/ProductSkeleton';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Search01Icon,
  Cancel01Icon,
  ArrowRight01Icon,
  Camera01Icon,
} from '@hugeicons/core-free-icons';

const PER_PAGE = 20;

const SearchScreen: React.FC<any> = ({ navigation }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isImageSearching, setIsImageSearching] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const onSpeechStart = () => {
    setIsRecording(true);
  };

  const onSpeechEnd = () => {
    setIsRecording(false);
  };

  const onSpeechResults = (event: any) => {
    // Don't update search query if we're in the process of clearing
    if (isClearing) return;

    if (event.value && event.value.length > 0) {
      const recognizedText = event.value[0];
      console.log('Voice recognized:', recognizedText);
      // Set search query without triggering auto-search
      setSearchQuery(recognizedText);
      // Directly call search to avoid duplicate searches
      handleSearch(recognizedText);
      // Keep microphone active - don't stop until user presses X
    }
  };

  const onSpeechError = (event: any) => {
    console.error('Speech recognition error:', event.error);
    setIsRecording(false);
    Alert.alert(
      'Voice Search Error',
      'Could not recognize speech. Please try again.',
    );
  };

  // Load featured products on mount
  useEffect(() => {
    fetchFeaturedProducts();

    // Setup voice recognition handlers
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startVoiceSearch = async () => {
    try {
      setIsRecording(true);
      await Voice.start('en-US');
    } catch (error) {
      console.error('Error starting voice search:', error);
      setIsRecording(false);
      Alert.alert(
        'Voice Search Unavailable',
        'Please check microphone permissions and try again.',
      );
    }
  };

  const stopVoiceSearch = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping voice search:', error);
      setIsRecording(false);
    }
  };

  const handleImageSearch = () => {
    Alert.alert(
      'Image Search',
      'Choose an option to search by image',
      [
        {
          text: 'Take Photo',
          onPress: () => handleImagePicker('camera'),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => handleImagePicker('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true },
    );
  };

  const handleImagePicker = async (source: 'camera' | 'gallery') => {
    try {
      const options = {
        mediaType: 'photo' as const,
        quality: 0.8 as const,
        maxWidth: 1024,
        maxHeight: 1024,
      };

      const result =
        source === 'camera'
          ? await launchCamera(options)
          : await launchImageLibrary(options);

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to pick image');
        return;
      }

      if (result.assets && result.assets[0]) {
        await performImageSearch(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const performImageSearch = async (imageAsset: any) => {
    try {
      setIsImageSearching(true);
      setHasSearched(true);
      setIsLoading(true);
      setSelectedImageUri(imageAsset.uri);

      const formData = new FormData();
      formData.append('image', {
        uri: imageAsset.uri,
        type: imageAsset.type || 'image/jpeg',
        name: imageAsset.fileName || 'image.jpg',
      } as any);

      const response = await productAPI.searchByImage(formData);

      setProducts(response.products || []);
      setSearchQuery('');
      setHasMorePages(false);

      if (!response.products || response.products.length === 0) {
        Alert.alert(
          'No Results',
          'No similar products found. Try a different image.',
        );
      }
    } catch (error) {
      console.error('Error performing image search:', error);
      Alert.alert(
        'Search Failed',
        'Could not search by image. Please try again.',
      );
    } finally {
      setIsImageSearching(false);
      setIsLoading(false);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      setIsLoading(true);
      const response = await productAPI.getProducts(1, 10, {
        sortOrder: 'desc',
      });
      setFeaturedProducts(response.products);
    } catch (error) {
      console.error('Error fetching featured products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    // Don't process if we're clearing
    if (isClearing) return;

    setSearchQuery(text);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Auto-search when user types more than 2 characters
    if (text.trim().length >= 2) {
      const timeout = setTimeout(() => {
        handleSearch(text);
      }, 500);
      setSearchTimeout(timeout);
    } else {
      // Clear results if search query is less than 2 characters
      setProducts([]);
      setHasSearched(false);
    }
  };

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    console.log('Searching for:', searchTerm);
    if (!searchTerm.trim() || searchTerm.trim().length < 2) return;

    setIsLoading(true);
    setHasSearched(true);
    setCurrentPage(1);

    try {
      const response = await productAPI.getProducts(1, PER_PAGE, {
        search: searchTerm,
      });

      console.log('Search results count:', response.products.length);
      setProducts(response.products);
      setHasMorePages(response.products.length >= PER_PAGE);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreProducts = async () => {
    if (!hasMorePages || isLoading || !searchQuery.trim()) return;

    setIsLoading(true);
    const nextPage = currentPage + 1;

    try {
      const response = await productAPI.getProducts(nextPage, PER_PAGE, {
        search: searchQuery,
      });

      if (response.products.length > 0) {
        setProducts(prev => [...prev, ...response.products]);
        setCurrentPage(nextPage);
        setHasMorePages(response.products.length >= PER_PAGE);
      } else {
        setHasMorePages(false);
      }
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSearch = async () => {
    console.log('Clearing search...');
    // Set clearing flag to prevent voice callbacks
    setIsClearing(true);

    // Clear any pending search timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }

    // Stop and destroy voice recording if active
    if (isRecording) {
      try {
        await Voice.stop();
        await Voice.cancel();
        await Voice.destroy();
        setIsRecording(false);
      } catch (error) {
        console.error('Error stopping voice:', error);
      }
    } else {
      // Even if not recording, ensure voice is stopped
      try {
        await Voice.stop();
        await Voice.cancel();
      } catch (error) {
        // Ignore errors if voice is not active
      }
    }

    // Clear all states and return to default (featured products view)
    setSearchQuery('');
    setProducts([]);
    setHasSearched(false);
    setCurrentPage(1);
    setSelectedImageUri(null);
    setHasMorePages(true);
    setIsLoading(false); // Ensure loading is false

    // Reinitialize voice listeners after destroying
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;

    // Reset clearing flag after a short delay
    setTimeout(() => {
      setIsClearing(false);
      console.log('Search cleared - showing featured products');
    }, 300);
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('SingleProduct', { productId: product._id });
  };

  const renderFeaturedItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.featuredItem}
      onPress={() => handleProductPress(item)}
    >
      <View style={styles.featuredLeft}>
        <HugeiconsIcon
          icon={Search01Icon}
          size={20}
          color={colors.mediumGray}
          strokeWidth={2}
        />
        <Text style={styles.featuredName} numberOfLines={1}>
          {item.name}
        </Text>
      </View>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        size={20}
        color={colors.mediumGray}
        strokeWidth={2}
      />
    </TouchableOpacity>
  );

  const renderProductListItem = ({ item }: { item: Product }) => {
    const isHighMatch = !!item.similarity && item.similarity >= 90;

    return (
      <TouchableOpacity
        style={[styles.productListItem, isHighMatch && styles.highMatchBorder]}
        onPress={() => handleProductPress(item)}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {item.similarity && item.similarity >= 90 && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchBadgeText}>
                {Math.round(item.similarity)}% Match
              </Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productBrand} numberOfLines={1}>
            {typeof item.brand === 'object' && (item.brand as any)?.name
              ? (item.brand as any).name
              : typeof item.brand === 'string'
              ? item.brand
              : 'No Brand'}
          </Text>
          <Text style={styles.productRating}>
            ⭐ {(item.rating || 0).toFixed(1)} ({item.numReviews || 0})
          </Text>
          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              {item.discountPercentage ? (
                <>
                  <Text style={styles.salePrice}>${item.price.toFixed(2)}</Text>
                  <Text style={styles.originalPrice}>
                    ${(item.originalPrice || item.price).toFixed(2)}
                  </Text>
                </>
              ) : (
                <Text style={styles.salePrice}>${item.price.toFixed(2)}</Text>
              )}
            </View>
            {item.stock > 0 ? (
              <Text style={styles.inStock}>In Stock</Text>
            ) : (
              <Text style={styles.outOfStock}>Out of Stock</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <HugeiconsIcon
          icon={Search01Icon}
          size={22}
          color={colors.babyshopSky}
          strokeWidth={2}
        />
        {selectedImageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: selectedImageUri }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
            <Text style={styles.imageSearchLabel}>Searching by image...</Text>
          </View>
        ) : (
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products..."
            placeholderTextColor={colors.mediumGray}
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
        )}
        {searchQuery.length > 0 || selectedImageUri ? (
          <TouchableOpacity
            onPress={handleClearSearch}
            style={styles.clearButton}
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={20}
              color={colors.mediumGray}
              strokeWidth={2}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              onPress={isRecording ? stopVoiceSearch : startVoiceSearch}
              style={styles.voiceButton}
              disabled={isImageSearching}
            >
              {isRecording ? (
                <MicOffIcon size={22} color="#ef4444" />
              ) : (
                <MicIcon size={22} color={colors.babyshopSky} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleImageSearch}
              style={styles.imageButton}
              disabled={isRecording || isImageSearching}
            >
              <HugeiconsIcon
                icon={Camera01Icon}
                size={22}
                color={isImageSearching ? '#ef4444' : colors.babyshopSky}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (isLoading) return null;

    // Only show featured products when there's no search query
    if (!hasSearched && !searchQuery.trim()) {
      return (
        <View style={styles.featuredSection}>
          <Text style={styles.featuredTitle}>Featured Products</Text>
          <FlatList
            data={featuredProducts}
            renderItem={renderFeaturedItem}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.featuredList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      );
    }

    // Show "No Products Found" only if user has searched
    if (hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Products Found</Text>
          <Text style={styles.emptyStateText}>
            Try adjusting your search terms
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.babyshopSky} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}

      {isLoading && hasSearched ? (
        <View style={styles.loadingContainer}>
          <ProductSkeleton count={6} variant="list" />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductListItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          onEndReached={loadMoreProducts}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.babyshopLightBg,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.babyWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
    paddingTop: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.primaryText,
    fontWeight: '400',
  },
  imagePreviewContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  imagePreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  imageSearchLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  voiceButton: {
    padding: 4,
  },
  imageButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 20,
  },
  featuredSection: {
    flex: 1,
    backgroundColor: colors.babyWhite,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
    paddingHorizontal: 15,
    paddingTop: 20,
    paddingBottom: 15,
  },
  featuredList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  featuredItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.babyWhite,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightBorder,
  },
  featuredLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  featuredName: {
    fontSize: 14,
    color: colors.primaryText,
    flex: 1,
  },
  productListItem: {
    flexDirection: 'row',
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  highMatchBorder: {
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  matchBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  matchBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 13,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  productRating: {
    fontSize: 12,
    color: colors.secondaryText,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  salePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.babyshopSky,
  },
  originalPrice: {
    fontSize: 13,
    color: colors.secondaryText,
    textDecorationLine: 'line-through',
  },
  inStock: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: '#d1fae5',
    borderRadius: 4,
  },
  outOfStock: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 4,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default SearchScreen;
