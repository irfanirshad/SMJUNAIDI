import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Order } from '../../types';
import { adminAPI } from '../services/api';
import { getRolePermissions, getStatusLabel } from '../utils/rolePermissions';
import { formatPrice } from '../utils/formatPrice';
import colors from '../constants/colors';
import CommonNavbar from '../components/common/CommonNavbar';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  SearchIcon,
  FilterIcon,
  RefreshIcon,
  Cancel01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';

type OrderManagementScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'OrderManagement'
>;

interface Props {
  navigation: OrderManagementScreenNavigationProp;
}

const OrderManagementScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const permissions = getRolePermissions(
    user?.role || 'user',
    user?.employee_role, 
  );

  const loadOrders = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (!user?.token) return;

      try {
        if (!append) setIsLoading(true);

        const filters: any = {
          sortOrder: 'desc' as const,
        };

        if (selectedStatus !== 'all') {
          filters.status = selectedStatus;
        }

        if (searchQuery.trim()) {
          filters.search = searchQuery.trim();
        }

        const response = await adminAPI.getAllOrders(
          user.token,
          pageNum,
          20,
          filters,
        );

        if (append) {
          setOrders(prev => [...prev, ...(response.orders || [])]);
        } else {
          setOrders(response.orders || []);
        }

        setHasMore(response.hasNextPage || false);
        setPage(pageNum);
      } catch (error) {
        console.error('Failed to load orders:', error);
        Alert.alert('Error', 'Failed to load orders');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.token, selectedStatus, searchQuery],
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadOrders(1, false);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadOrders(page + 1, true);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadOrders(1, false);
  };

  const handleFilterApply = (status: string) => {
    setSelectedStatus(status);
    setShowFilterModal(false);
    setPage(1);
  };

  const formatCurrency = (amount: number) => {
    return formatPrice(amount);
  };

  const formatDate = (dateString: string | Date) => {
    const date =
      typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status?: string) => {
    const statusColors: { [key: string]: string } = {
      pending: '#f59e0b',
      address_confirmed: '#3b82f6',
      confirmed: '#10b981',
      packed: '#8b5cf6',
      delivering: '#06b6d4',
      delivered: '#22c55e',
      completed: '#14b8a6',
      cancelled: '#ef4444',
    };
    return statusColors[status || 'pending'] || '#6b7280';
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('SingleOrder', { orderId: item._id })}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <Text style={styles.orderId}>
            #{item.orderId || item._id.slice(-8)}
          </Text>
          <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <View
          style={[
            styles.orderStatus,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.orderStatusText}>
            {getStatusLabel(item.status || 'pending')}
          </Text>
        </View>
      </View>

      <View style={styles.orderBody}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>Customer</Text>
          <Text style={styles.orderValue}>
            {typeof item.user === 'object' ? item.user.name : 'N/A'}
          </Text>
        </View>
        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>Amount</Text>
          <Text style={styles.orderAmount}>
            {formatCurrency(item.total || item.totalAmount || 0)}
          </Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={18}
          color={colors.babyshopSky}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <CommonNavbar
        title="Order Management"
        showBackButton={true}
        showIcons={{
          cart: false,
          orders: false,
          wishlist: false,
          profile: true,
        }}
      />

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <HugeiconsIcon
            icon={SearchIcon}
            size={20}
            color={colors.secondaryText}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order ID or customer..."
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

        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <HugeiconsIcon icon={RefreshIcon} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.babyshopSky} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders found</Text>
          <Text style={styles.emptySubtext}>
            Try adjusting your search or filter
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
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
              <Text style={styles.modalTitle}>Filter Orders</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={24}
                  color={colors.primaryText}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.filterLabel}>Order Status</Text>

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
                  All Orders
                </Text>
              </TouchableOpacity>

              {permissions.availableOrderStatuses.map(status => (
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: colors.babyWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: colors.babyWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
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
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  refreshButton: {
    width: 44,
    height: 44,
    backgroundColor: '#10b981',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
  },
  orderHeaderLeft: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  orderStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  orderBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderLabel: {
    fontSize: 12,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  orderValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primaryText,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.babyshopSky,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.babyshopSky,
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.babyWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
  },
  modalBody: {
    padding: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterOptionSelected: {
    backgroundColor: colors.babyshopSky + '10',
    borderColor: colors.babyshopSky,
  },
  filterOptionText: {
    fontSize: 14,
    color: colors.primaryText,
  },
  filterOptionTextSelected: {
    color: colors.babyshopSky,
    fontWeight: '600',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
});

export default OrderManagementScreen;
