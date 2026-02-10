import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import colors from '../constants/colors';
import CommonNavbar from '../components/common/CommonNavbar';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Package02Icon,
  ShoppingBasket01Icon,
  DollarCircleIcon,
  InformationCircleIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { useAuth } from '../hooks/useAuth';
import { vendorAPI } from '../services/api';
import { Product } from '../../types';
import { formatPrice } from '../config/environment';

interface VendorStats {
  totalProducts: number;
  pendingProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

const VendorDashboardScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    try {
      const [statsResponse, productsResponse] = await Promise.all([
        vendorAPI.getDashboardStats(user.token),
        vendorAPI.getMyProducts(user.token),
      ]);

      setStats(statsResponse);
      setProducts(productsResponse.products || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleProductPress = (product: Product) => {
    navigation.navigate('SingleProduct', { productId: product._id });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CommonNavbar title="Vendor Dashboard" cartCount={0} showIcons={{}} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.babyshopSky} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  const statsData = [
    {
      icon: Package02Icon,
      label: 'Products',
      value: stats?.totalProducts.toString() || '0',
    },
    {
      icon: ShoppingBasket01Icon,
      label: 'Orders',
      value: stats?.totalOrders.toString() || '0',
    },
    {
      icon: DollarCircleIcon,
      label: 'Revenue',
      value: formatPrice(stats?.totalRevenue || 0),
    },
    {
      icon: InformationCircleIcon,
      label: 'Pending',
      value: stats?.pendingProducts.toString() || '0',
    },
  ];

  return (
    <View style={styles.container}>
      <CommonNavbar title="Vendor Dashboard" cartCount={0} showIcons={{}} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.welcomeText}>Welcome to Your Dashboard</Text>
          <Text style={styles.subtitle}>
            View and manage your store products
          </Text>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {statsData.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <HugeiconsIcon
                  icon={stat.icon}
                  size={32}
                  color={colors.babyshopSky}
                  strokeWidth={2}
                />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <HugeiconsIcon
              icon={InformationCircleIcon}
              size={20}
              color={colors.babyshopSky}
              strokeWidth={2}
            />
            <Text style={styles.infoBannerText}>
              To add or edit products, please use the web dashboard
            </Text>
          </View>

          {/* Products Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Products</Text>
              <Text style={styles.productCount}>
                {products.length}{' '}
                {products.length === 1 ? 'product' : 'products'}
              </Text>
            </View>

            {products.length === 0 ? (
              <View style={styles.emptyState}>
                <HugeiconsIcon
                  icon={Package02Icon}
                  size={48}
                  color={colors.mediumGray}
                  strokeWidth={1.5}
                />
                <Text style={styles.emptyStateTitle}>No Products Yet</Text>
                <Text style={styles.emptyStateText}>
                  Add your first product from the web dashboard to get started
                </Text>
              </View>
            ) : (
              <View style={styles.productsList}>
                {products.map(product => (
                  <TouchableOpacity
                    key={product._id}
                    style={styles.productCard}
                    onPress={() => handleProductPress(product)}
                  >
                    <Image
                      source={{ uri: product.image }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      <Text style={styles.productCategory}>
                        {product.category?.name || 'Uncategorized'}
                      </Text>
                      <View style={styles.productFooter}>
                        <Text style={styles.productPrice}>
                          {formatPrice(product.price)}
                        </Text>
                        <Text style={styles.productStock}>
                          Stock: {product.stock}
                        </Text>
                      </View>
                    </View>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={20}
                      color={colors.mediumGray}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.babyshopLightBg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.secondaryText,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.secondaryText,
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 4,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#075985',
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
  productCount: {
    fontSize: 14,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  productsList: {
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 13,
    color: colors.secondaryText,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.babyshopSky,
  },
  productStock: {
    fontSize: 13,
    color: colors.secondaryText,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
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
});

export default VendorDashboardScreen;
