import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { analyticsAPI } from '../services/api';
import { formatPrice } from '../utils/formatPrice';
import colors from '../constants/colors';
import CommonNavbar from '../components/common/CommonNavbar';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  DollarIcon,
  ShoppingBag02Icon,
  PackageIcon,
  UserIcon,
  Alert01Icon,
} from '@hugeicons/core-free-icons';

interface AnalyticsData {
  overview: {
    totalProducts: number;
    totalOrders: number;
    totalUsers: number;
    totalRevenue: number;
  };
  inventory: {
    lowStockCount: number;
    outOfStockCount: number;
  };
  sales: {
    monthlyRevenue: Array<{
      _id: { year: number; month: number };
      revenue: number;
      orders: number;
    }>;
    orderStatusBreakdown: Array<{
      _id: string;
      count: number;
      totalValue: number;
    }>;
  };
}

const AnalyticsScreen: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAnalytics = async () => {
    if (!user?.token) return;

    try {
      const data = await analyticsAPI.getOverview(user.token);
      setAnalytics(data.data);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadAnalytics();
  };

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getMonthName = (month: number) => {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months[month - 1];
  };

  if (isLoading && !analytics) {
    return (
      <View style={styles.container}>
        <CommonNavbar
          title="Analytics"
          showBackButton={true}
          showIcons={{
            cart: false,
            orders: false,
            wishlist: false,
            profile: false,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.babyshopSky} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonNavbar
        title="Analytics"
        showBackButton={true}
        showIcons={{
          cart: false,
          orders: false,
          wishlist: false,
          profile: false,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {analytics && (
          <>
            {/* Overview Cards */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, styles.statCardGreen]}>
                  <HugeiconsIcon icon={DollarIcon} size={24} color="#10b981" />
                  <Text style={styles.statValue}>
                    {formatPrice(analytics.overview.totalRevenue)}
                  </Text>
                  <Text style={styles.statLabel}>Total Revenue</Text>
                </View>

                <View style={[styles.statCard, styles.statCardBlue]}>
                  <HugeiconsIcon
                    icon={ShoppingBag02Icon}
                    size={24}
                    color={colors.babyshopSky}
                  />
                  <Text style={styles.statValue}>
                    {analytics.overview.totalOrders}
                  </Text>
                  <Text style={styles.statLabel}>Total Orders</Text>
                </View>

                <View style={[styles.statCard, styles.statCardPurple]}>
                  <HugeiconsIcon icon={PackageIcon} size={24} color="#8b5cf6" />
                  <Text style={styles.statValue}>
                    {analytics.overview.totalProducts}
                  </Text>
                  <Text style={styles.statLabel}>Products</Text>
                </View>

                <View style={[styles.statCard, styles.statCardOrange]}>
                  <HugeiconsIcon icon={UserIcon} size={24} color="#f59e0b" />
                  <Text style={styles.statValue}>
                    {analytics.overview.totalUsers}
                  </Text>
                  <Text style={styles.statLabel}>Customers</Text>
                </View>
              </View>
            </View>

            {/* Inventory Alerts */}
            {(analytics.inventory.lowStockCount > 0 ||
              analytics.inventory.outOfStockCount > 0) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Inventory Alerts</Text>
                <View style={styles.alertsContainer}>
                  {analytics.inventory.outOfStockCount > 0 && (
                    <View style={[styles.alertCard, styles.alertCardDanger]}>
                      <HugeiconsIcon
                        icon={Alert01Icon}
                        size={20}
                        color="#ef4444"
                      />
                      <View style={styles.alertContent}>
                        <Text style={styles.alertValue}>
                          {analytics.inventory.outOfStockCount}
                        </Text>
                        <Text style={styles.alertLabel}>Out of Stock</Text>
                      </View>
                    </View>
                  )}
                  {analytics.inventory.lowStockCount > 0 && (
                    <View style={[styles.alertCard, styles.alertCardWarning]}>
                      <HugeiconsIcon
                        icon={Alert01Icon}
                        size={20}
                        color="#f59e0b"
                      />
                      <View style={styles.alertContent}>
                        <Text style={styles.alertValue}>
                          {analytics.inventory.lowStockCount}
                        </Text>
                        <Text style={styles.alertLabel}>Low Stock</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Monthly Revenue */}
            {analytics.sales.monthlyRevenue.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Monthly Revenue (Last 6 Months)
                </Text>
                <View style={styles.revenueList}>
                  {analytics.sales.monthlyRevenue.map((item, index) => (
                    <View key={index} style={styles.revenueItem}>
                      <View style={styles.revenueMonth}>
                        <Text style={styles.revenueMonthText}>
                          {getMonthName(item._id.month)} {item._id.year}
                        </Text>
                        <Text style={styles.revenueOrderCount}>
                          {item.orders} orders
                        </Text>
                      </View>
                      <Text style={styles.revenueAmount}>
                        {formatPrice(item.revenue)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Order Status Breakdown */}
            {analytics.sales.orderStatusBreakdown.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Order Status Breakdown</Text>
                <View style={styles.statusList}>
                  {analytics.sales.orderStatusBreakdown.map((item, index) => (
                    <View key={index} style={styles.statusItem}>
                      <View style={styles.statusInfo}>
                        <Text style={styles.statusName}>
                          {item._id.replace('_', ' ').toUpperCase()}
                        </Text>
                        <Text style={styles.statusCount}>
                          {item.count} orders
                        </Text>
                      </View>
                      <Text style={styles.statusValue}>
                        {formatPrice(item.totalValue)}
                      </Text>
                    </View>
                  ))}
                </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.secondaryText,
  },
  section: {
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
  statCardGreen: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  statCardBlue: {
    borderLeftWidth: 4,
    borderLeftColor: colors.babyshopSky,
  },
  statCardPurple: {
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  statCardOrange: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  alertsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  alertCard: {
    flex: 1,
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
  alertCardDanger: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  alertCardWarning: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  alertContent: {
    marginLeft: 12,
  },
  alertValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
  alertLabel: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  revenueList: {
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    overflow: 'hidden',
  },
  revenueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  revenueMonth: {
    flex: 1,
  },
  revenueMonthText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
  },
  revenueOrderCount: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 4,
  },
  revenueAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.babyshopSky,
  },
  statusList: {
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  statusInfo: {
    flex: 1,
  },
  statusName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
  },
  statusCount: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
});

export default AnalyticsScreen;
