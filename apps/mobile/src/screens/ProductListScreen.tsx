import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { productAPI, categoryAPI, brandAPI } from '../services/api';
import { useCart } from '../hooks/useCart';
import { Product, Category, Brand } from '../../types';
import colors from '../constants/colors';
import CommonNavbar from '../components/common/CommonNavbar';
import { HomeProductRender } from '../components/renderItems/home-product';
import ProductSkeleton from '../components/skeletons/ProductSkeleton';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 45) / 2;
const PER_PAGE = 20;

const ProductListScreen: React.FC<any> = ({ navigation, route }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // New states for search suggestions
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(
    route?.params?.categoryId || '',
  );
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [productType] = useState(route?.params?.productType || '');
  const { cartCount } = useCart();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [categoriesResponse, brandsResponse] = await Promise.all([
        categoryAPI.getCategories(),
        brandAPI.getBrands(),
      ]);
      setCategories(categoriesResponse.categories);
      setBrands(brandsResponse);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  // Function to get active filters info
  const getActiveFiltersInfo = () => {
    const filters = [];

    if (selectedCategory) {
      const category = categories.find(cat => cat._id === selectedCategory);
      if (category) filters.push(category.name);
    }

    if (selectedBrand) {
      const brand = brands.find(br => br._id === selectedBrand);
      if (brand) filters.push(brand.name);
    }

    if (priceMin || priceMax) {
      filters.push(`$${priceMin || '0'} - $${priceMax || '∞'}`);
    }

    if (searchQuery) {
      filters.push(`"${searchQuery}"`);
    }

    if (sortOrder === 'desc') {
      filters.push('Price: High to Low');
    }

    return {
      count: filters.length,
      display:
        filters.slice(0, 2).join(', ') + (filters.length > 2 ? '...' : ''),
    };
  };

  // Function to search product names
  const searchProductNames = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
      return;
    }

    try {
      const suggestions = await productAPI.getProductNameSuggestions(query);
      setSearchSuggestions(suggestions);
      setShowSearchSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Error searching product names:', error);
      setSearchSuggestions([]);
      setShowSearchSuggestions(false);
    }
  };

  // Handle search input with debouncing
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for search suggestions
    const timeout = setTimeout(() => {
      searchProductNames(text);
    }, 300);

    setSearchTimeout(timeout);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSearchSuggestions(false);
    setSearchSuggestions([]);
  };

  const fetchProducts = useCallback(
    async (page: number = 1, reset: boolean = false) => {
      try {
        if (page === 1) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const filters = {
          category: selectedCategory || undefined,
          brand: selectedBrand || undefined,
          priceMin: priceMin ? Number(priceMin) : undefined,
          priceMax: priceMax ? Number(priceMax) : undefined,
          search: searchQuery || undefined,
          sortOrder,
          productType: productType || undefined,
        };

        const response = await productAPI.getProducts(page, PER_PAGE, filters);

        setTotalProducts(response.total);
        setHasMorePages(response.products.length === PER_PAGE);

        if (reset || page === 1) {
          setProducts(response.products);
          setCurrentPage(1);
        } else {
          setProducts(prev => [...prev, ...response.products]);
          setCurrentPage(page);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch products');
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [
      selectedCategory,
      selectedBrand,
      priceMin,
      priceMax,
      sortOrder,
      searchQuery,
      productType,
    ],
  );

  useEffect(() => {
    fetchProducts(1, true);
  }, [fetchProducts]);

  const loadMoreProducts = () => {
    if (!isLoadingMore && hasMorePages) {
      fetchProducts(currentPage + 1, false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(1, true);
    setRefreshing(false);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setPriceMin('');
    setPriceMax('');
    setSortOrder('asc');
    setSearchQuery('');
    setSearchSuggestions([]);
    setShowSearchSuggestions(false);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    setShowFilters(false); // Close the modal
  };

  const quickReset = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setPriceMin('');
    setPriceMax('');
    setSortOrder('asc');
    setSearchQuery('');
    setSearchSuggestions([]);
    setShowSearchSuggestions(false);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    // Don't close the modal when using quick reset
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <HomeProductRender item={item} navigation={navigation} />
  );

  const renderFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.babyshopSky} />
        <Text style={styles.footerLoaderText}>Loading more products...</Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.productsCount}>
        {route?.params?.categoryName ? `${route.params.categoryName} - ` : ''}
        {products.length} of {totalProducts} products
      </Text>
    </View>
  );

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.filtersContainer}>
        <View style={styles.filtersHeader}>
          <Text style={styles.filtersTitle}>Filters</Text>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filtersContent}>
          {/* Search */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Search</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search products..."
                placeholderTextColor={colors.mutedText}
                onFocus={() => {
                  if (searchQuery.length >= 2) {
                    searchProductNames(searchQuery);
                  }
                }}
              />

              {/* Search Suggestions */}
              {showSearchSuggestions && searchSuggestions.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <ScrollView
                    style={styles.suggestionsList}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                  >
                    {searchSuggestions.map((item, index) => (
                      <TouchableOpacity
                        key={`${item}-${index}`}
                        style={styles.suggestionItem}
                        onPress={() => handleSuggestionSelect(item)}
                      >
                        <Text style={styles.suggestionText}>{item}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Category */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !selectedCategory && styles.selectedFilter,
                  ]}
                  onPress={() => setSelectedCategory('')}
                >
                  <Text style={styles.filterOptionText}>All</Text>
                </TouchableOpacity>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category._id}
                    style={[
                      styles.filterOption,
                      selectedCategory === category._id &&
                        styles.selectedFilter,
                    ]}
                    onPress={() => setSelectedCategory(category._id)}
                  >
                    <Text style={styles.filterOptionText}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Brand */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Brand</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !selectedBrand && styles.selectedFilter,
                  ]}
                  onPress={() => setSelectedBrand('')}
                >
                  <Text style={styles.filterOptionText}>All</Text>
                </TouchableOpacity>
                {brands.map(brand => (
                  <TouchableOpacity
                    key={brand._id}
                    style={[
                      styles.filterOption,
                      selectedBrand === brand._id && styles.selectedFilter,
                    ]}
                    onPress={() => setSelectedBrand(brand._id)}
                  >
                    <Text style={styles.filterOptionText}>{brand.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Price Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Price Range</Text>
            <View style={styles.priceInputs}>
              <TextInput
                style={styles.priceInput}
                value={priceMin}
                onChangeText={setPriceMin}
                placeholder="Min"
                keyboardType="numeric"
                placeholderTextColor={colors.mutedText}
              />
              <Text style={styles.priceSeparator}>-</Text>
              <TextInput
                style={styles.priceInput}
                value={priceMax}
                onChangeText={setPriceMax}
                placeholder="Max"
                keyboardType="numeric"
                placeholderTextColor={colors.mutedText}
              />
            </View>
          </View>

          {/* Sort Order */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort by Price</Text>
            <View style={styles.sortOptions}>
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortOrder === 'asc' && styles.selectedSort,
                ]}
                onPress={() => setSortOrder('asc')}
              >
                <Text style={styles.sortOptionText}>Low to High</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortOrder === 'desc' && styles.selectedSort,
                ]}
                onPress={() => setSortOrder('desc')}
              >
                <Text style={styles.sortOptionText}>High to Low</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.filtersFooter}>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderSkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      <View style={styles.row}>
        <ProductSkeleton />
        <ProductSkeleton />
      </View>
      <View style={styles.row}>
        <ProductSkeleton />
        <ProductSkeleton />
      </View>
      <View style={styles.row}>
        <ProductSkeleton />
        <ProductSkeleton />
      </View>
      <View style={styles.row}>
        <ProductSkeleton />
        <ProductSkeleton />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <CommonNavbar
        title={
          route?.params?.productTypeName ||
          route?.params?.categoryName ||
          'Products'
        }
        cartCount={cartCount}
        showIcons={{ cart: true, orders: true, wishlist: true, profile: true }}
      />

      {isLoading && products?.length === 0 ? (
        <>
          <View style={styles.header}>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilters(true)}
              >
                <Text style={styles.filterButtonText}>
                  Filters & Sort
                  {getActiveFiltersInfo().count > 0 &&
                    ` (${getActiveFiltersInfo().count})`}
                </Text>
              </TouchableOpacity>

              {getActiveFiltersInfo().count > 0 && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={quickReset}
                >
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>

            {getActiveFiltersInfo().count > 0 && (
              <View style={styles.activeFiltersContainer}>
                <Text style={styles.activeFiltersText} numberOfLines={1}>
                  {getActiveFiltersInfo().display}
                </Text>
              </View>
            )}
          </View>
          {renderSkeletonLoader()}
        </>
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilters(true)}
              >
                <Text style={styles.filterButtonText}>
                  Filters & Sort
                  {getActiveFiltersInfo().count > 0 &&
                    ` (${getActiveFiltersInfo().count})`}
                </Text>
              </TouchableOpacity>

              {getActiveFiltersInfo().count > 0 && (
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={quickReset}
                >
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>

            {getActiveFiltersInfo().count > 0 && (
              <View style={styles.activeFiltersContainer}>
                <Text style={styles.activeFiltersText} numberOfLines={1}>
                  {getActiveFiltersInfo().display}
                </Text>
              </View>
            )}
          </View>

          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={item => item._id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.productList}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            onEndReached={loadMoreProducts}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {renderFiltersModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  skeletonContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.babyWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumBorder,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
  filterButton: {
    backgroundColor: colors.babyshopSky,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  filterButtonText: {
    color: colors.babyWhite,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetButtonText: {
    color: colors.babyWhite,
    fontWeight: '600',
    fontSize: 14,
  },
  activeFiltersContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.lightGray,
    borderRadius: 6,
    alignSelf: 'flex-start',
    maxWidth: width - 40,
  },
  activeFiltersText: {
    fontSize: 12,
    color: colors.babyshopSky,
    fontWeight: '500',
  },
  listHeader: {
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  productsCount: {
    fontSize: 14,
    color: colors.mediumGray,
    fontWeight: '500',
  },
  productList: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  productCard: {
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    marginBottom: 15,
    width: ITEM_WIDTH,
    shadowColor: colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: 4,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.babyBlue,
    marginBottom: 6,
  },
  productDescription: {
    fontSize: 12,
    color: colors.secondaryText,
    lineHeight: 16,
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productRating: {
    fontSize: 12,
    color: colors.orange,
    fontWeight: '500',
  },
  productStock: {
    fontSize: 12,
    color: colors.babyGreen,
    fontWeight: '500',
  },
  addToCartBtn: {
    backgroundColor: colors.babyGreen,
    margin: 12,
    marginTop: 0,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartText: {
    color: colors.babyWhite,
    fontSize: 12,
    fontWeight: '600',
  },
  disabledBtn: {
    backgroundColor: colors.mediumGray,
    opacity: 0.6,
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
  filtersContainer: {
    flex: 1,
    backgroundColor: colors.babyWhite,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.mediumBorder,
  },
  filtersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
  closeButton: {
    fontSize: 24,
    color: colors.secondaryText,
  },
  filtersContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginVertical: 15,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 10,
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.mediumBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.primaryText,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: colors.babyWhite,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.mediumBorder,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    shadowColor: colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.primaryText,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.mediumBorder,
    backgroundColor: colors.babyshopTextLight,
  },
  selectedFilter: {
    backgroundColor: colors.babyshopSky,
    borderColor: colors.babyshopSky,
  },
  filterOptionText: {
    fontSize: 14,
    color: colors.babyshopWhite,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.mediumBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.primaryText,
  },
  priceSeparator: {
    fontSize: 16,
    color: colors.secondaryText,
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  sortOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.mediumBorder,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
  },
  selectedSort: {
    backgroundColor: colors.babyshopSky,
    borderColor: colors.babyshopSky,
  },
  sortOptionText: {
    fontSize: 14,
    color: colors.primaryText,
  },
  filtersFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: colors.mediumBorder,
    gap: 10,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: 'center',
  },
  clearButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.babyshopSky,
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.babyWhite,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductListScreen;
