import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Order } from '../../types';
import { adminAPI } from '../services/api';
import {
  getRolePermissions,
  getRoleDashboardMessage,
} from '../utils/rolePermissions';
import { formatPrice } from '../utils/formatPrice';
import colors from '../constants/colors';
import HomeNavbar from '../components/common/HomeNavbar';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  PackageIcon,
  ShoppingBag02Icon,
  StarIcon,
  UserIcon,
  ChartHistogramIcon,
  DollarIcon,
  ArrowRight01Icon,
  TagIcon,
  AwardIcon,
} from '@hugeicons/core-free-icons';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface Stats {
  counts: {
    users: number;
    products: number;
    categories: number;
    brands: number;
    orders: number;
    totalRevenue: number;
  };
}

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get role-based permissions
  const permissions = getRolePermissions(
    user?.role || 'user',
    user?.employee_role,
  );
  const dashboardMessage = getRoleDashboardMessage(
    user?.role || 'user',
    user?.employee_role,
  );

  const loadDashboardData = async () => {
    if (!user?.token) return;

    try {
      setIsLoading(true);

      // Load stats and recent orders in parallel
      const [statsData, ordersData] = await Promise.all([
        adminAPI.getStats(user.token),
        adminAPI.getAllOrders(user.token, 1, 5, { sortOrder: 'desc' }), // Get 5 most recent orders
      ]);

      setStats(statsData);
      setRecentOrders(ordersData.orders || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <View style={styles.container}>
      <HomeNavbar navigation={navigation as any} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{dashboardMessage.title}</Text>
          <Text style={styles.headerSubtitle}>
            {dashboardMessage.description}
          </Text>
          <View style={styles.badgesContainer}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user?.role?.toUpperCase() || 'USER'}
              </Text>
            </View>
            {user?.employee_role && (
              <View style={[styles.roleBadge, styles.employeeRoleBadge]}>
                <Text style={styles.roleText}>
                  {user.employee_role.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {isLoading && !isRefreshing ? (
          <SkeletonDashboard />
        ) : (
          <>
            {/* Stats Grid - Only for Admin */}
            {stats && user?.role === 'admin' && (
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Overview</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <View
                      style={[styles.statIconContainer, styles.statIconGreen]}
                    >
                      <HugeiconsIcon icon={DollarIcon} size={20} color="#fff" />
                    </View>
                    <Text style={styles.statValue}>
                      {formatCurrency(stats.counts.totalRevenue)}
                    </Text>
                    <Text style={styles.statLabel}>Revenue</Text>
                  </View>

                  <View style={styles.statCard}>
                    <View
                      style={[styles.statIconContainer, styles.statIconBlue]}
                    >
                      <HugeiconsIcon
                        icon={ShoppingBag02Icon}
                        size={20}
                        color="#fff"
                      />
                    </View>
                    <Text style={styles.statValue}>{stats.counts.orders}</Text>
                    <Text style={styles.statLabel}>Orders</Text>
                  </View>

                  <View style={styles.statCard}>
                    <View
                      style={[styles.statIconContainer, styles.statIconPurple]}
                    >
                      <HugeiconsIcon
                        icon={PackageIcon}
                        size={20}
                        color="#fff"
                      />
                    </View>
                    <Text style={styles.statValue}>
                      {stats.counts.products}
                    </Text>
                    <Text style={styles.statLabel}>Products</Text>
                  </View>

                  <View style={styles.statCard}>
                    <View
                      style={[styles.statIconContainer, styles.statIconOrange]}
                    >
                      <HugeiconsIcon icon={UserIcon} size={20} color="#fff" />
                    </View>
                    <Text style={styles.statValue}>{stats.counts.users}</Text>
                    <Text style={styles.statLabel}>Customers</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Quick Actions - Single Column List */}
            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Management</Text>
              <View style={styles.actionsList}>
                {permissions.canAccessOrders && (
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() =>
                      navigation.navigate('OrderManagement' as any)
                    }
                    activeOpacity={0.7}
                  >
                    <View
                      style={[styles.actionIconCircle, styles.actionIconBlue]}
                    >
                      <HugeiconsIcon
                        icon={ShoppingBag02Icon}
                        size={24}
                        color="#fff"
                      />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>Orders</Text>
                      <Text style={styles.actionSubtitle}>
                        Manage all orders
                      </Text>
                    </View>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={20}
                      color={colors.secondaryText}
                    />
                  </TouchableOpacity>
                )}

                {permissions.canAccessProducts && (
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() =>
                      navigation.navigate('ProductManagement' as any)
                    }
                    activeOpacity={0.7}
                  >
                    <View
                      style={[styles.actionIconCircle, styles.actionIconGreen]}
                    >
                      <HugeiconsIcon
                        icon={PackageIcon}
                        size={24}
                        color="#fff"
                      />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>Products</Text>
                      <Text style={styles.actionSubtitle}>Product catalog</Text>
                    </View>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={20}
                      color={colors.secondaryText}
                    />
                  </TouchableOpacity>
                )}

                {user?.role === 'admin' && (
                  <>
                    <TouchableOpacity
                      style={styles.actionItem}
                      onPress={() =>
                        navigation.navigate('CategoryManagement' as any)
                      }
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.actionIconCircle,
                          styles.actionIconPurple,
                        ]}
                      >
                        <HugeiconsIcon icon={TagIcon} size={24} color="#fff" />
                      </View>
                      <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Categories</Text>
                        <Text style={styles.actionSubtitle}>
                          Manage categories
                        </Text>
                      </View>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={20}
                        color={colors.secondaryText}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionItem}
                      onPress={() =>
                        navigation.navigate('BrandManagement' as any)
                      }
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.actionIconCircle,
                          styles.actionIconOrange,
                        ]}
                      >
                        <HugeiconsIcon
                          icon={AwardIcon}
                          size={24}
                          color="#fff"
                        />
                      </View>
                      <View style={styles.actionContent}>
                        <Text style={styles.actionTitle}>Brands</Text>
                        <Text style={styles.actionSubtitle}>Manage brands</Text>
                      </View>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={20}
                        color={colors.secondaryText}
                      />
                    </TouchableOpacity>
                  </>
                )}

                {permissions.canAccessUsers && (
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => navigation.navigate('UserManagement' as any)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[styles.actionIconCircle, styles.actionIconIndigo]}
                    >
                      <HugeiconsIcon icon={UserIcon} size={24} color="#fff" />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>Users</Text>
                      <Text style={styles.actionSubtitle}>User management</Text>
                    </View>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={20}
                      color={colors.secondaryText}
                    />
                  </TouchableOpacity>
                )}

                {permissions.canAccessReviews && (
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() =>
                      navigation.navigate('ReviewManagement' as any)
                    }
                    activeOpacity={0.7}
                  >
                    <View
                      style={[styles.actionIconCircle, styles.actionIconYellow]}
                    >
                      <HugeiconsIcon icon={StarIcon} size={24} color="#fff" />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>Reviews</Text>
                      <Text style={styles.actionSubtitle}>
                        Customer reviews
                      </Text>
                    </View>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={20}
                      color={colors.secondaryText}
                    />
                  </TouchableOpacity>
                )}

                {permissions.canAccessAnalytics && (
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() =>
                      navigation.navigate('AnalyticsScreen' as any)
                    }
                    activeOpacity={0.7}
                  >
                    <View
                      style={[styles.actionIconCircle, styles.actionIconRed]}
                    >
                      <HugeiconsIcon
                        icon={ChartHistogramIcon}
                        size={24}
                        color="#fff"
                      />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>Analytics</Text>
                      <Text style={styles.actionSubtitle}>Sales analytics</Text>
                    </View>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={20}
                      color={colors.secondaryText}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Recent Orders List */}
            {recentOrders.length > 0 && (
              <View style={styles.ordersSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Orders</Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('OrderManagement' as any)
                    }
                  >
                    <Text style={styles.viewAllText}>View All</Text>
                  </TouchableOpacity>
                </View>

                {recentOrders.map(order => (
                  <TouchableOpacity
                    key={order._id}
                    style={styles.orderCard}
                    onPress={() =>
                      navigation.navigate('SingleOrder', {
                        orderId: order._id,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.orderHeader}>
                      <View>
                        <Text style={styles.orderId}>
                          {order.orderId || order._id.slice(-8)}
                        </Text>
                        <Text style={styles.orderDate}>
                          {formatDate(order.createdAt)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.orderStatus,
                          { backgroundColor: getStatusColor(order.status) },
                        ]}
                      >
                        <Text style={styles.orderStatusText}>
                          {(order.status || 'pending')
                            .replace('_', ' ')
                            .toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.orderDetails}>
                      <View style={styles.orderInfo}>
                        <Text style={styles.orderCustomer}>
                          {typeof order.user === 'object'
                            ? order.user.name
                            : 'Customer'}
                        </Text>
                        <Text style={styles.orderAmount}>
                          {formatCurrency(
                            order.total || order.totalAmount || 0,
                          )}
                        </Text>
                      </View>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={20}
                        color={colors.secondaryText}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    marginBottom: 12,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.babyshopSky,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  employeeRoleBadge: {
    backgroundColor: '#10b981',
  },
  roleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
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
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statIconGreen: {
    backgroundColor: '#10b981',
  },
  statIconBlue: {
    backgroundColor: colors.babyshopSky,
  },
  statIconPurple: {
    backgroundColor: '#8b5cf6',
  },
  statIconOrange: {
    backgroundColor: '#f59e0b',
  },
  statIconIndigo: {
    backgroundColor: '#6366f1',
  },
  statIconRed: {
    backgroundColor: '#ef4444',
  },
  statIconYellow: {
    backgroundColor: '#eab308',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionsList: {
    gap: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionIconGreen: {
    backgroundColor: '#10b981',
  },
  actionIconBlue: {
    backgroundColor: colors.babyshopSky,
  },
  actionIconPurple: {
    backgroundColor: '#8b5cf6',
  },
  actionIconOrange: {
    backgroundColor: '#f59e0b',
  },
  actionIconIndigo: {
    backgroundColor: '#6366f1',
  },
  actionIconYellow: {
    backgroundColor: '#eab308',
  },
  actionIconRed: {
    backgroundColor: '#ef4444',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.secondaryText,
  },
  ordersSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.babyshopSky,
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
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  orderCustomer: {
    fontSize: 14,
    color: colors.primaryText,
    marginBottom: 4,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.babyshopSky,
  },
});

export default DashboardScreen;
