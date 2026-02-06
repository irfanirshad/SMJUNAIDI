import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { productAPI, productTypeAPI } from '../services/api';
import { useCategories } from '../hooks/useApi';
import {
  Product,
  Category,
  HomeScreenNavigationProp,
  ProductType,
} from '../../types';
import {
  HomeCategoryRender,
  HomeProductRender,
} from '../components/renderItems/home-items';
import { CategorySkeleton, ProductSkeleton } from '../components/skeletons';
import colors from '../constants/colors';
import HomeNavbar from '../components/common/HomeNavbar';
import Banner from '../components/common/Banner';
import AdsBanner from '../components/common/AdsBanner';
import BecomeVendor from '../components/common/BecomeVendor';

const PER_PAGE = 20;
const { width } = Dimensions.get('window');
const HORIZONTAL_CARD_WIDTH = width * 0.46; // Smaller cards for horizontal scroll
const CARD_GAP = 5;

// Different emojis for product type sections
const PRODUCT_TYPE_EMOJIS = [
  '🎯',
  '🌟',
  '🎨',
  '🎁',
  '✨',
  '🔥',
  '💎',
  '🎪',
  '🎭',
  '🎸',
];
const getProductTypeEmoji = (index: number) => {
  return PRODUCT_TYPE_EMOJIS[index % PRODUCT_TYPE_EMOJIS.length];
};

const HomeScreen: React.FC<{ navigation: HomeScreenNavigationProp }> = ({
  navigation,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [bestDealsProducts, setBestDealsProducts] = useState<Product[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [productTypeProducts, setProductTypeProducts] = useState<
    Record<string, Product[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingProductTypes, setIsLoadingProductTypes] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(true);
  const {
    categories,
    loading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategories();

  const fetchProducts = useCallback(
    async (page: number = 1, reset: boolean = false) => {
      try {
        // Batch state updates to prevent flickering
        const updates: Partial<{
          isLoading: boolean;
          isLoadingMore: boolean;
          products: Product[];
          currentPage: number;
          totalProducts: number;
          hasMorePages: boolean;
        }> = {};

        // Only show main loading for initial load
        if (page === 1) {
          updates.isLoading = true;
        } else if (page > 1) {
          updates.isLoadingMore = true;
        }

        // Apply loading state immediately
        if (updates.isLoading) setIsLoading(true);
        if (updates.isLoadingMore) setIsLoadingMore(true);

        const response = await productAPI.getProducts(page, PER_PAGE);

        // Batch all updates together to prevent flickering
        if (reset || page === 1) {
          setProducts(response.products);
          setCurrentPage(1);
        } else {
          setProducts(prev => [...prev, ...response.products]);
          setCurrentPage(page);
        }

        setTotalProducts(response.total);
        setHasMorePages(response.products.length === PER_PAGE);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch products');
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [],
  ); // Remove the dependency to prevent circular updates

  const fetchBestDealsProducts = useCallback(async () => {
    try {
      const response = await productAPI.getProducts(1, 10, {
        sortOrder: 'desc',
      });
      setBestDealsProducts(response.products);
    } catch (error) {
      console.error('Error fetching best deals products:', error);
    }
  }, []);

  const fetchProductTypes = useCallback(async () => {
    try {
      setIsLoadingProductTypes(true);
      const response = await productTypeAPI.getProductTypes();
      const activeTypes = (
        Array.isArray(response) ? response : response.productTypes || []
      )
        .filter(pt => pt.isActive && pt.displayOrder !== 0)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      setProductTypes(activeTypes);

      // Fetch products for each product type
      const productsData: Record<string, Product[]> = {};
      await Promise.all(
        activeTypes.map(async productType => {
          try {
            const productsResponse = await productAPI.getProducts(1, 20, {
              productType: productType._id,
            });
            productsData[productType._id] = productsResponse.products;
          } catch (error) {
            console.error(
              `Error fetching products for ${productType.name}:`,
              error,
            );
            productsData[productType._id] = [];
          }
        }),
      );

      setProductTypeProducts(productsData);
    } catch (error) {
      console.error('Error fetching product types:', error);
    } finally {
      setIsLoadingProductTypes(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(1, true);
    fetchBestDealsProducts();
    fetchProductTypes();
  }, [fetchProducts, fetchBestDealsProducts, fetchProductTypes]);

  const loadMoreProducts = () => {
    console.log('load');

    if (!isLoadingMore && hasMorePages) {
      fetchProducts(currentPage + 1, false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh all data
    await Promise.all([
      fetchProducts(1, true),
      fetchBestDealsProducts(),
      fetchProductTypes(),
      refetchCategories(),
    ]);
    setRefreshing(false);
  };

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <HomeProductRender item={item} navigation={navigation} />
    ),
    [navigation],
  );

  const renderHorizontalProduct = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.horizontalProductCard}>
        <HomeProductRender
          item={item}
          navigation={navigation}
          isHorizontal={true}
        />
      </View>
    ),
    [navigation],
  );

  const renderCategory = useCallback(
    ({ item }: { item: Category }) => (
      <HomeCategoryRender
        _id={item?._id}
        name={item?.name}
        image={item?.image}
        navigation={navigation}
      />
    ),
    [navigation],
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.babyshopSky} />
        <Text style={styles.footerLoaderText}>Loading more products...</Text>
      </View>
    );
  }, [isLoadingMore]);

  const renderProductSection = useCallback(
    (
      title: string,
      emoji: string,
      productsList: Product[],
      loading: boolean,
      productType?: string,
    ) => {
      if (loading) {
        return (
          <View style={styles.productSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {emoji} {title}
              </Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() =>
                  navigation.navigate('ProductList', {
                    productType,
                    productTypeName: title,
                  })
                }
              >
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={[1, 2, 3, 4, 5]}
              renderItem={({ item: _item }) => (
                <View style={styles.horizontalProductCard}>
                  <ProductSkeleton />
                </View>
              )}
              keyExtractor={item => `skeleton-${item}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              ItemSeparatorComponent={() => (
                <View style={{ width: CARD_GAP }} />
              )}
            />
          </View>
        );
      }

      if (productsList.length === 0) return null;

      return (
        <View style={styles.productSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {emoji} {title}
            </Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() =>
                navigation.navigate('ProductList', {
                  productType,
                  productTypeName: title,
                })
              }
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={productsList}
            renderItem={renderHorizontalProduct}
            keyExtractor={item => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
          />
        </View>
      );
    },
    [renderHorizontalProduct, navigation],
  );

  const renderListHeader = useCallback(
    () => (
      <View>
        {/* Banner Section */}
        <Banner navigation={navigation} />

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>
            {isLoading ? 'Loading Categories...' : '📂 Categories'}
          </Text>
          {categoriesLoading || isLoading ? (
            <View style={styles.categoriesSkeletonContainer}>
              {[1, 2, 3, 4, 5].map(item => (
                <CategorySkeleton key={item} />
              ))}
            </View>
          ) : (
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={item => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          )}
        </View>

        {/* Product Type Sections */}
        {isLoadingProductTypes
          ? // Show skeleton loaders while fetching product types
            [1, 2, 3].map(skeletonIndex => (
              <View key={`skeleton-type-${skeletonIndex}`}>
                {renderProductSection(
                  'Loading...',
                  getProductTypeEmoji(skeletonIndex - 1),
                  [],
                  true,
                  undefined,
                )}
              </View>
            ))
          : productTypes.map((productType, index) => {
              const typeProducts = productTypeProducts[productType._id] || [];
              if (typeProducts.length === 0) return null;

              return (
                <View key={productType._id}>
                  {renderProductSection(
                    productType.name,
                    getProductTypeEmoji(index),
                    typeProducts,
                    false,
                    productType._id,
                  )}
                  {/* Show AdsBanner after first two product types */}
                  {index === 1 && <AdsBanner />}
                </View>
              );
            })}

        {/* Become Vendor Section */}
        <BecomeVendor navigation={navigation} />

        {/* Best Deals */}
        {renderProductSection(
          'Best Deals',
          '💰',
          bestDealsProducts,
          isLoading,
          'best-deals',
        )}

        {/* All Products Header */}
        <View style={styles.allProductsHeader}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🛍️ All Products</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('ProductList', {})}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.productsCount}>
            {isLoading
              ? 'Loading...'
              : `${products.length} of ${totalProducts} products`}
          </Text>
        </View>
      </View>
    ),
    [
      navigation,
      bestDealsProducts,
      productTypes,
      productTypeProducts,
      categories,
      categoriesLoading,
      isLoading,
      isLoadingProductTypes,
      renderCategory,
      renderProductSection,
      products.length,
      totalProducts,
    ],
  );

  return (
    <View style={styles.container}>
      {/* Navbar */}
      <HomeNavbar navigation={navigation} />

      {/* Unified ScrollView with Categories and Products */}
      {isLoading ? (
        <FlatList
          data={Array.from({ length: 6 }, (_, i) => i)}
          renderItem={({ item }) => <ProductSkeleton key={item} />}
          keyExtractor={item => `skeleton-${item}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.productList}
          ListHeaderComponent={renderListHeader}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={item => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.productList}
          ListHeaderComponent={renderListHeader}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMoreProducts}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={6}
          updateCellsBatchingPeriod={100}
          initialNumToRender={6}
          windowSize={10}
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
  productSection: {
    backgroundColor: colors.babyWhite,
    marginBottom: 10,
    paddingVertical: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewAllText: {
    fontSize: 13,
    color: colors.babyshopSky,
    fontWeight: '600',
  },
  horizontalList: {
    paddingLeft: 15,
    paddingTop: 10,
  },
  horizontalProductCard: {
    width: HORIZONTAL_CARD_WIDTH,
  },
  allProductsHeader: {
    backgroundColor: colors.babyWhite,
    paddingVertical: 12,
    marginBottom: 5,
  },
  productsCount: {
    fontSize: 12,
    color: colors.mediumGray,
    fontWeight: '400',
    marginTop: 5,
    paddingHorizontal: 15,
  },
  productList: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerLoaderText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.secondaryText,
  },
  categoriesSection: {
    backgroundColor: colors.babyWhite,
    paddingHorizontal: 0,
    paddingVertical: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: 5,
    paddingHorizontal: 15,
  },
  categoriesList: {
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  categoriesSkeletonContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
});

export default HomeScreen;
