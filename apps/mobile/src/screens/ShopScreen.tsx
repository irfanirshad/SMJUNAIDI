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
import { formatPrice } from '../config/environment';
import ProductSkeleton from '../components/skeletons/ProductSkeleton';

const PER_PAGE = 20;

const ShopScreen: React.FC<any> = ({ navigation }) => {
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
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
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
      const minPrice = formatPrice(Number(priceMin || 0));
      const maxPrice = priceMax ? formatPrice(Number(priceMax)) : '∞';
      filters.push(`${minPrice} - ${maxPrice}`);
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
      <FlatList
        data={[1, 2, 3, 4, 5, 6, 7, 8]}
        renderItem={() => <ProductSkeleton />}
        keyExtractor={item => item.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        scrollEnabled={false}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <CommonNavbar
        title="Shop All Products"
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
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.babyshopSky,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonText: {
    color: colors.babyWhite,
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.mediumBorder,
  },
  resetButtonText: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  activeFiltersContainer: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.babyshopLightBg,
    borderRadius: 6,
  },
  activeFiltersText: {
    fontSize: 13,
    color: colors.secondaryText,
  },
  listHeader: {
    marginBottom: 15,
  },
  productsCount: {
    fontSize: 14,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  productList: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerLoaderText: {
    marginTop: 10,
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
    fontSize: 28,
    color: colors.secondaryText,
    fontWeight: '300',
  },
  filtersContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  filterSection: {
    marginBottom: 25,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 12,
  },
  searchContainer: {
    position: 'relative',
  },
  searchInput: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.primaryText,
    borderWidth: 1,
    borderColor: colors.mediumBorder,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: colors.babyWhite,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.mediumBorder,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
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
    paddingVertical: 10,
    backgroundColor: colors.lightGray,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.mediumBorder,
  },
  selectedFilter: {
    backgroundColor: colors.babyshopSky,
    borderColor: colors.babyshopSky,
  },
  filterOptionText: {
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: '500',
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  priceInput: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.primaryText,
    borderWidth: 1,
    borderColor: colors.mediumBorder,
  },
  priceSeparator: {
    fontSize: 16,
    color: colors.secondaryText,
    fontWeight: '600',
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  sortOption: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mediumBorder,
  },
  selectedSort: {
    backgroundColor: colors.babyshopSky,
    borderColor: colors.babyshopSky,
  },
  sortOptionText: {
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: '500',
  },
  filtersFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: colors.mediumBorder,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mediumBorder,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.babyshopSky,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.babyWhite,
  },
});

export default ShopScreen;
