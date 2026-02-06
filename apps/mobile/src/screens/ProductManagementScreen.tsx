import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { adminAPI, categoryAPI, brandAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getRolePermissions } from '../utils/rolePermissions';
import { formatPrice } from '../utils/formatPrice';
import CommonNavbar from '../components/common/CommonNavbar';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  SearchIcon,
  FilterIcon,
  RefreshIcon,
  PlusSignIcon,
  Edit02Icon,
  Delete02Icon,
  Cancel01Icon,
  PackageIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Tick02Icon,
  StarIcon,
} from '@hugeicons/core-free-icons';

const colors = {
  primaryText: '#1a1a1a',
  secondaryText: '#666',
  babyshopSky: '#7dd3fc',
  white: '#fff',
  border: '#e0e0e0',
  background: '#f5f5f5',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
};

type ProductManagementScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ProductManagement'
>;

interface Product {
  _id: string;
  name: string;
  description?: string;
  category?: { _id: string; name: string };
  brand?: { _id: string; name: string };
  price: number;
  discountPrice?: number;
  discountPercentage?: number;
  stock: number;
  image?: string;
  images?: string[];
  status: 'active' | 'inactive' | 'out_of_stock';
  productType?: string;
  averageRating?: number;
  numReviews?: number;
}

interface Category {
  _id: string;
  name: string;
}

interface Brand {
  _id: string;
  name: string;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  discountPercentage: string;
  stock: string;
  category: string;
  brand: string;
  image: string;
  productType: string;
}

export default function ProductManagementScreen() {
  const navigation = useNavigation<ProductManagementScreenNavigationProp>();
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchFilterVisible, setSearchFilterVisible] = useState(true);

  // Product form data
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    discountPercentage: '0',
    stock: '0',
    category: '',
    brand: '',
    image: '',
    productType: 'base',
  });

  // Get permissions
  const permissions = getRolePermissions(user?.role || '', user?.employee_role);

  // Check if user has access
  useEffect(() => {
    if (!permissions.canAccessProducts) {
      Alert.alert('Access Denied', 'You do not have access to this section.');
      navigation.goBack();
    }
  }, [permissions, navigation]);

  // Load products
  const loadProducts = useCallback(
    async (page = 1, refresh = false) => {
      if (!user?.token) return;

      try {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const filters: any = {};
        if (selectedStatus !== 'all') {
          filters.status = selectedStatus;
        }
        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }

        const response = await adminAPI.getAllProducts(
          user.token,
          page,
          20,
          filters,
        );

        if (refresh) {
          setProducts(response.products);
        } else if (page === 1) {
          setProducts(response.products);
        } else {
          setProducts(prev => [...prev, ...response.products]);
        }

        setHasMore(response.hasMore);
        setCurrentPage(page);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to load products');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.token, selectedStatus, searchQuery],
  );

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      const response = await categoryAPI.getCategories();
      setCategories(response.categories || []);
    } catch (error: any) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  // Load brands
  const loadBrands = useCallback(async () => {
    try {
      const response = await brandAPI.getBrands();
      setBrands(response);
    } catch (error: any) {
      console.error('Failed to load brands:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadProducts(1);
    loadCategories();
    loadBrands();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers
  const handleSearch = () => {
    setCurrentPage(1);
    loadProducts(1);
  };

  const handleRefresh = () => {
    loadProducts(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadProducts(currentPage + 1);
    }
  };

  const handleFilterApply = (status: string) => {
    setSelectedStatus(status);
    setShowFilterModal(false);
    setCurrentPage(1);
    loadProducts(1);
  };

  const openProductModal = (product?: Product) => {
    if (product) {
      // Edit mode
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        discountPercentage: (product.discountPercentage || 0).toString(),
        stock: product.stock.toString(),
        category: product.category?._id || '',
        brand: product.brand?._id || '',
        image: product.image || '',
        productType: product.productType || 'base',
      });
    } else {
      // Add mode
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        discountPercentage: '0',
        stock: '0',
        category: '',
        brand: '',
        image: '',
        productType: 'base',
      });
    }
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      discountPercentage: '0',
      stock: '0',
      category: '',
      brand: '',
      image: '',
      productType: 'base',
    });
  };

  const handleSaveProduct = async () => {
    if (!user?.token) return;

    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Product name is required');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Validation Error', 'Description is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      Alert.alert('Validation Error', 'Valid price is required');
      return;
    }
    if (!formData.category) {
      Alert.alert('Validation Error', 'Category is required');
      return;
    }
    if (!formData.brand) {
      Alert.alert('Validation Error', 'Brand is required');
      return;
    }
    if (!formData.image.trim()) {
      Alert.alert('Validation Error', 'Product image is required');
      return;
    }

    try {
      setIsSaving(true);

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        discountPercentage: parseFloat(formData.discountPercentage) || 0,
        stock: parseInt(formData.stock, 10) || 0,
        category: formData.category,
        brand: formData.brand,
        image: formData.image,
        productType: formData.productType,
      };

      if (editingProduct) {
        // Update existing product
        await adminAPI.updateProduct(
          user.token,
          editingProduct._id,
          productData,
        );
        Alert.alert('Success', 'Product updated successfully');
      } else {
        // Create new product
        await adminAPI.createProduct(user.token, productData);
        Alert.alert('Success', 'Product created successfully');
      }

      closeProductModal();
      handleRefresh();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProduct = () => {
    if (!permissions.canCreateProducts) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to create products.',
      );
      return;
    }
    openProductModal();
  };

  const handleEditProduct = (product: Product) => {
    if (!permissions.canEditProducts) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to edit products.',
      );
      return;
    }
    openProductModal(product);
  };

  const handleDeleteProduct = (productId: string, productName: string) => {
    if (!permissions.canDeleteProducts) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to delete products.',
      );
      return;
    }

    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${productName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.token) return;

            try {
              setIsLoading(true);
              await adminAPI.deleteProduct(user.token, productId);
              Alert.alert('Success', 'Product deleted successfully');
              handleRefresh();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete product');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'inactive':
        return colors.secondaryText;
      case 'out_of_stock':
        return colors.error;
      default:
        return colors.secondaryText;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return status;
    }
  };

  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => {
    const discountPrice = item.discountPercentage
      ? item.price * (1 - item.discountPercentage / 100)
      : item.discountPrice;

    const hasDiscount = !!discountPrice && discountPrice < item.price;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => handleEditProduct(item)}
        activeOpacity={0.7}
      >
        <View style={styles.productImageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <HugeiconsIcon
                icon={PackageIcon}
                size={32}
                color={colors.secondaryText}
              />
            </View>
          )}
          {/* Discount Badge */}
          {item.discountPercentage && item.discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>
                -{item.discountPercentage}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          {item.description && (
            <Text style={styles.productDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.productMeta}>
            {item.category && (
              <Text style={styles.productCategory}>{item.category.name}</Text>
            )}
            {item.brand && (
              <Text style={styles.productBrand}> • {item.brand.name}</Text>
            )}
          </View>

          <View style={styles.productPricing}>
            {hasDiscount ? (
              <>
                <Text style={styles.productDiscountPrice}>
                  {formatPrice(discountPrice)}
                </Text>
                <Text style={styles.productOriginalPrice}>
                  {formatPrice(item.price)}
                </Text>
              </>
            ) : (
              <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
            )}
          </View>

          <View style={styles.productFooter}>
            <View style={styles.productStock}>
              <Text
                style={[
                  styles.stockText,
                  item.stock === 0 && styles.stockTextOut,
                ]}
              >
                Stock: {item.stock}
              </Text>
            </View>

            {item.productType && item.productType !== 'base' && (
              <View style={styles.productTypeBadge}>
                <Text style={styles.productTypeText}>
                  {item.productType.replace('-', ' ')}
                </Text>
              </View>
            )}

            {item.averageRating && item.averageRating > 0 && (
              <View style={styles.ratingContainer}>
                <HugeiconsIcon
                  icon={StarIcon}
                  size={14}
                  color={colors.warning}
                />
                <Text style={styles.ratingText}>
                  {item.averageRating.toFixed(1)} ({item.numReviews || 0})
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.productActions}>
          {permissions.canEditProducts && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditProduct(item)}
            >
              <HugeiconsIcon
                icon={Edit02Icon}
                size={20}
                color={colors.babyshopSky}
              />
            </TouchableOpacity>
          )}

          {permissions.canDeleteProducts && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteProduct(item._id, item.name)}
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                size={20}
                color={colors.error}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <CommonNavbar
        title="Product Management"
        showBackButton={true}
        showIcons={{
          cart: false,
          orders: false,
          wishlist: false,
          profile: true,
        }}
      />

      {/* Collapsible Search and Filter Section */}
      {searchFilterVisible && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <HugeiconsIcon
              icon={SearchIcon}
              size={20}
              color={colors.secondaryText}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <HugeiconsIcon icon={FilterIcon} size={20} color="#fff" />
            {selectedStatus !== 'all' && <View style={styles.filterBadge} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <HugeiconsIcon icon={RefreshIcon} size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Toggle Search/Filter Button */}
      <TouchableOpacity
        style={styles.toggleSearchButton}
        onPress={() => setSearchFilterVisible(!searchFilterVisible)}
      >
        <HugeiconsIcon
          icon={searchFilterVisible ? ArrowUp01Icon : ArrowDown01Icon}
          size={16}
          color={colors.secondaryText}
        />
        <Text style={styles.toggleSearchText}>
          {searchFilterVisible ? 'Hide' : 'Show'} Search & Filter
        </Text>
      </TouchableOpacity>

      {/* Add Product Button */}
      {permissions.canCreateProducts && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
          <HugeiconsIcon icon={PlusSignIcon} size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add New Product</Text>
        </TouchableOpacity>
      )}

      {/* Products List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.babyshopSky} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <HugeiconsIcon
            icon={PackageIcon}
            size={64}
            color={colors.secondaryText}
          />
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubtext}>
            Try adjusting your search or filter
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContent}
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoading && !isRefreshing ? (
              <ActivityIndicator
                size="small"
                color={colors.babyshopSky}
                style={styles.loadingFooter}
              />
            ) : null
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Products</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={24}
                  color={colors.primaryText}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.filterLabel}>Product Status</Text>

              <TouchableOpacity
                style={[
                  styles.filterOption,
                  selectedStatus === 'all' && styles.filterOptionSelected,
                ]}
                onPress={() => handleFilterApply('all')}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedStatus === 'all' && styles.filterOptionTextSelected,
                  ]}
                >
                  All Products
                </Text>
              </TouchableOpacity>

              {['active', 'inactive', 'out_of_stock'].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterOption,
                    selectedStatus === status && styles.filterOptionSelected,
                  ]}
                  onPress={() => handleFilterApply(status)}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: getStatusColor(status) },
                    ]}
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedStatus === status &&
                        styles.filterOptionTextSelected,
                    ]}
                  >
                    {getStatusLabel(status)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Product Add/Edit Modal - Bottom Sheet */}
      <Modal
        visible={showProductModal}
        transparent
        animationType="slide"
        onRequestClose={closeProductModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeProductModal}
          />
          <View style={styles.productModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </Text>
              <TouchableOpacity onPress={closeProductModal}>
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={24}
                  color={colors.primaryText}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {/* Product Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Product Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={text =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="Enter product name"
                  placeholderTextColor={colors.secondaryText}
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description *</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={formData.description}
                  onChangeText={text =>
                    setFormData({ ...formData, description: text })
                  }
                  placeholder="Enter product description"
                  placeholderTextColor={colors.secondaryText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Price and Discount */}
              <View style={styles.formRow}>
                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.formLabel}>Price (USD) *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.price}
                    onChangeText={text =>
                      setFormData({ ...formData, price: text })
                    }
                    placeholder="0.00"
                    placeholderTextColor={colors.secondaryText}
                    keyboardType="decimal-pad"
                  />
                </View>

                <View style={[styles.formGroup, styles.formGroupHalf]}>
                  <Text style={styles.formLabel}>Discount %</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.discountPercentage}
                    onChangeText={text =>
                      setFormData({ ...formData, discountPercentage: text })
                    }
                    placeholder="0"
                    placeholderTextColor={colors.secondaryText}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {/* Stock */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Stock Quantity *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.stock}
                  onChangeText={text =>
                    setFormData({ ...formData, stock: text })
                  }
                  placeholder="0"
                  placeholderTextColor={colors.secondaryText}
                  keyboardType="number-pad"
                />
              </View>

              {/* Category Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.pickerScroll}
                >
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat._id}
                      style={[
                        styles.pickerOption,
                        formData.category === cat._id &&
                          styles.pickerOptionSelected,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, category: cat._id })
                      }
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          formData.category === cat._id &&
                            styles.pickerOptionTextSelected,
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Brand Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Brand *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.pickerScroll}
                >
                  {brands.map(brand => (
                    <TouchableOpacity
                      key={brand._id}
                      style={[
                        styles.pickerOption,
                        formData.brand === brand._id &&
                          styles.pickerOptionSelected,
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, brand: brand._id })
                      }
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          formData.brand === brand._id &&
                            styles.pickerOptionTextSelected,
                        ]}
                      >
                        {brand.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Product Type */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Product Type</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.pickerScroll}
                >
                  {['base', 'trending', 'featured', 'deals', 'new-arrival'].map(
                    type => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.pickerOption,
                          formData.productType === type &&
                            styles.pickerOptionSelected,
                        ]}
                        onPress={() =>
                          setFormData({ ...formData, productType: type })
                        }
                      >
                        <Text
                          style={[
                            styles.pickerOptionText,
                            formData.productType === type &&
                              styles.pickerOptionTextSelected,
                          ]}
                        >
                          {type
                            .split('-')
                            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(' ')}
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </ScrollView>
              </View>

              {/* Image URL */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Image URL *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.image}
                  onChangeText={text =>
                    setFormData({ ...formData, image: text })
                  }
                  placeholder="Enter base64 image or URL"
                  placeholderTextColor={colors.secondaryText}
                  multiline
                  numberOfLines={2}
                />
                <Text style={styles.formHint}>
                  Paste a base64 encoded image string or an image URL
                </Text>
              </View>

              {/* Image Preview */}
              {formData.image && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Image Preview</Text>
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: formData.image }}
                      style={styles.imagePreview}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  isSaving && styles.saveButtonDisabled,
                ]}
                onPress={handleSaveProduct}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <HugeiconsIcon icon={Tick02Icon} size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.modalBottomSpacer} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: colors.white,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.primaryText,
  },
  filterButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.babyshopSky,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: colors.error,
    borderRadius: 4,
  },
  refreshButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.babyshopSky,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImageContainer: {
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
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  discountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
  },
  productDescription: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 4,
    lineHeight: 18,
  },
  productMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  productCategory: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  productBrand: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  productPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
  },
  productDiscountPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.error,
  },
  productOriginalPrice: {
    fontSize: 14,
    color: colors.secondaryText,
    textDecorationLine: 'line-through',
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  productStock: {
    flex: 0,
  },
  stockText: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  stockTextOut: {
    color: colors.error,
    fontWeight: '600',
  },
  productTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: colors.babyshopSky,
  },
  productTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
    textTransform: 'capitalize',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  productStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  productStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
  },
  productActions: {
    gap: 8,
    justifyContent: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingFooter: {
    paddingVertical: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
  },
  modalBody: {
    padding: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondaryText,
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.background,
    gap: 10,
  },
  filterOptionSelected: {
    backgroundColor: colors.babyshopSky,
  },
  filterOptionText: {
    fontSize: 15,
    color: colors.primaryText,
  },
  filterOptionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // New styles for collapsible search and product modal
  toggleSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 6,
  },
  toggleSearchText: {
    fontSize: 13,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
  },
  productModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 0,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.primaryText,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formGroupHalf: {
    flex: 1,
  },
  formHint: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 6,
    fontStyle: 'italic',
  },
  pickerScroll: {
    flexGrow: 0,
  },
  pickerOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  pickerOptionSelected: {
    backgroundColor: colors.babyshopSky,
    borderColor: colors.babyshopSky,
  },
  pickerOptionText: {
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  imagePreviewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  modalBottomSpacer: {
    height: 40,
  },
});
