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
import { categoryAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getRolePermissions } from '../utils/rolePermissions';
import CommonNavbar from '../components/common/CommonNavbar';
import { SkeletonListItem } from '../components/SkeletonLoader';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  SearchIcon,
  RefreshIcon,
  PlusSignIcon,
  Edit02Icon,
  Delete02Icon,
  Cancel01Icon,
  Folder01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Tick02Icon,
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

interface Category {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  image: string;
}

export default function CategoryManagementScreen() {
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchFilterVisible, setSearchFilterVisible] = useState(true);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    image: '',
  });

  // Get permissions
  const permissions = getRolePermissions(user?.role || '', user?.employee_role);

  // Load categories
  const loadCategories = useCallback(
    async (page = 1, refresh = false) => {
      if (!user?.token) return;

      try {
        if (refresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }

        const params: any = {
          page,
          perPage: 20,
          sortOrder: 'desc',
        };

        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        const response = await categoryAPI.getCategories(params, user?.token);

        if (refresh || page === 1) {
          setCategories(response.categories);
        } else {
          setCategories(prev => [...prev, ...response.categories]);
        }

        setHasMore(response.categories.length === 20);
        setCurrentPage(page);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to load categories');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.token, searchQuery],
  );

  // Initial load
  useEffect(() => {
    loadCategories(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers
  const handleSearch = () => {
    setCurrentPage(1);
    loadCategories(1);
  };

  const handleRefresh = () => {
    loadCategories(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadCategories(currentPage + 1);
    }
  };

  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        image: category.image || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        image: '',
      });
    }
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image: '',
    });
  };

  const handleSaveCategory = async () => {
    if (!user?.token) return;

    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Category name is required');
      return;
    }

    try {
      setIsSaving(true);

      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        image: formData.image.trim(),
      };

      if (editingCategory) {
        await categoryAPI.updateCategory(
          editingCategory._id,
          categoryData,
          user.token,
        );
        Alert.alert('Success', 'Category updated successfully');
      } else {
        await categoryAPI.createCategory(categoryData, user.token);
        Alert.alert('Success', 'Category created successfully');
      }

      closeCategoryModal();
      handleRefresh();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCategory = () => {
    if (!permissions.canCreateProducts) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to create categories.',
      );
      return;
    }
    openCategoryModal();
  };

  const handleEditCategory = (category: Category) => {
    if (!permissions.canEditProducts) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to edit categories.',
      );
      return;
    }
    openCategoryModal(category);
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    if (!permissions.canDeleteProducts) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to delete categories.',
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${categoryName}"? This may affect products in this category.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user?.token) return;

            try {
              setIsLoading(true);
              await categoryAPI.deleteCategory(categoryId, user.token);
              Alert.alert('Success', 'Category deleted successfully');
              handleRefresh();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.message || 'Failed to delete category',
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleEditCategory(item)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryImageContainer}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.categoryImage}
            resizeMode="cover"
            onError={error => {
              console.log('Image load error:', error.nativeEvent.error);
            }}
          />
        ) : (
          <View style={styles.categoryImagePlaceholder}>
            <Text style={styles.categoryInitial}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.categoryDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        {item.createdAt && (
          <Text style={styles.categoryDate}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.categoryActions}>
        {permissions.canEditProducts && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={e => {
              e.stopPropagation();
              handleEditCategory(item);
            }}
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
            onPress={e => {
              e.stopPropagation();
              handleDeleteCategory(item._id, item.name);
            }}
          >
            <HugeiconsIcon icon={Delete02Icon} size={20} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSkeleton = () => (
    <View style={styles.listContent}>
      {[1, 2, 3, 4, 5].map(i => (
        <SkeletonListItem key={i} />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <CommonNavbar
        title="Category Management"
        showBackButton={true}
        showIcons={{
          cart: false,
          orders: false,
          wishlist: false,
          profile: true,
        }}
      />

      {/* Collapsible Search Section */}
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
              placeholder="Search categories..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <HugeiconsIcon icon={RefreshIcon} size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Toggle Search Button */}
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
          {searchFilterVisible ? 'Hide' : 'Show'} Search
        </Text>
      </TouchableOpacity>

      {/* Add Category Button */}
      {permissions.canCreateProducts && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
          <HugeiconsIcon icon={PlusSignIcon} size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add New Category</Text>
        </TouchableOpacity>
      )}

      {/* Categories List */}
      {isLoading && !isRefreshing && categories.length === 0 ? (
        renderSkeleton()
      ) : categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <HugeiconsIcon
            icon={Folder01Icon}
            size={64}
            color={colors.secondaryText}
          />
          <Text style={styles.emptyText}>No categories found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? 'Try adjusting your search'
              : 'Create your first category'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
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

      {/* Category Add/Edit Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={closeCategoryModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={closeCategoryModal}
          />
          <View style={styles.categoryModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </Text>
              <TouchableOpacity onPress={closeCategoryModal}>
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
              {/* Category Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.name}
                  onChangeText={text =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="Enter category name"
                  placeholderTextColor={colors.secondaryText}
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={formData.description}
                  onChangeText={text =>
                    setFormData({ ...formData, description: text })
                  }
                  placeholder="Enter category description"
                  placeholderTextColor={colors.secondaryText}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Image URL */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Image URL</Text>
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
                      onError={error => {
                        console.log(
                          'Preview image error:',
                          error.nativeEvent.error,
                        );
                      }}
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
                onPress={handleSaveCategory}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <HugeiconsIcon icon={Tick02Icon} size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>
                      {editingCategory ? 'Update Category' : 'Create Category'}
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
  refreshButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.babyshopSky,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    marginHorizontal: 16,
    marginVertical: 16,
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
  categoryCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.babyshopSky,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  categoryInfo: {
    flex: 1,
    gap: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
  },
  categoryDescription: {
    fontSize: 13,
    color: colors.secondaryText,
    lineHeight: 18,
  },
  categoryDate: {
    fontSize: 11,
    color: colors.secondaryText,
    marginTop: 4,
  },
  categoryActions: {
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
  modalBackdrop: {
    flex: 1,
  },
  categoryModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
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
  formHint: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 6,
    fontStyle: 'italic',
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
