import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { ProfileScreenNavigationProp } from '../../types';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useWishlistStore } from '../store';
import colors from '../constants/colors';
import HomeNavbar from '../components/common/HomeNavbar';

import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  UserIcon,
  Login02Icon,
  ShoppingBag01Icon,
  ShoppingCart01Icon,
  FavouriteIcon,
  Logout03Icon,
  Settings02Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';

interface MenuItem {
  title: string;
  icon: any;
  color: string;
  badge?: number;
  onPress: () => void;
}

const ProfileScreen: React.FC<{ navigation: ProfileScreenNavigationProp }> = ({
  navigation,
}) => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { getWishlistCount } = useWishlistStore();
  const wishlistCount = getWishlistCount();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    if (!user) {
      // Start animations when component mounts and user is not logged in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [user, fadeAnim, slideAnim, scaleAnim]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          Alert.alert('Success', 'Logged out successfully');
        },
      },
    ]);
  };

  // Define account menu items
  const accountMenuItems: MenuItem[] = [
    {
      title: 'My Orders',
      icon: ShoppingBag01Icon,
      color: colors.babyshopSky,
      onPress: () => navigation.navigate('Orders'),
    },
    {
      title: 'Shopping Cart',
      icon: ShoppingCart01Icon,
      color: '#10b981',
      badge: cartCount,
      onPress: () => navigation.navigate('Cart'),
    },
    {
      title: 'Wishlist',
      icon: FavouriteIcon,
      color: '#ef4444',
      badge: wishlistCount,
      onPress: () => navigation.navigate('Wishlist'),
    },
    {
      title: 'Profile Settings',
      icon: Settings02Icon,
      color: '#8b5cf6',
      onPress: () => navigation.navigate('EditProfile'),
    },
  ];

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Animated.View
            style={[
              styles.emptyStateCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            {/* Animated Icon */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <HugeiconsIcon
                icon={UserIcon}
                size={64}
                color={colors.babyshopSky}
                strokeWidth={1.5}
              />
            </Animated.View>

            {/* Welcome Message */}
            <Animated.View
              style={[
                styles.messageContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text style={styles.welcomeTitle}>Welcome to Baby Shop!</Text>
              <Text style={styles.welcomeSubtitle}>
                Create an account or sign in to access your profile, track
                orders, and enjoy personalized shopping.
              </Text>
            </Animated.View>

            {/* Action Buttons */}
            <Animated.View
              style={[
                styles.buttonContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.8}
              >
                <HugeiconsIcon
                  icon={Login02Icon}
                  size={20}
                  color={colors.babyWhite}
                  strokeWidth={2}
                />
                <Text style={styles.primaryButtonText}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Signup')}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Create Account</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Features Preview */}
            <Animated.View
              style={[
                styles.featuresContainer,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <View style={styles.featureItem}>
                <HugeiconsIcon
                  icon={ShoppingBag01Icon}
                  size={20}
                  color={colors.babyshopSky}
                  strokeWidth={2}
                />
                <Text style={styles.featureText}>Track your orders</Text>
              </View>
              <View style={styles.featureItem}>
                <HugeiconsIcon
                  icon={UserIcon}
                  size={20}
                  color={colors.babyshopSky}
                  strokeWidth={2}
                />
                <Text style={styles.featureText}>Manage your profile</Text>
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HomeNavbar navigation={navigation as any} />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              {(user.role === 'admin' ||
                user.role === 'vendor' ||
                user.employee_role) && (
                <View style={styles.roleBadgeContainer}>
                  <View
                    style={[
                      styles.roleBadgeSmall,
                      user.role === 'vendor' && styles.vendorBadge,
                    ]}
                  >
                    <Text style={styles.roleBadgeText}>
                      {user.employee_role
                        ? user.employee_role.replace('_', ' ').toUpperCase()
                        : user.role.toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Admin/Management Section */}
        {(user.role === 'admin' || user.employee_role) && (
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Management</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Dashboard')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: '#3b82f6' },
                  ]}
                >
                  <HugeiconsIcon
                    icon={Settings02Icon}
                    size={20}
                    color="#fff"
                    strokeWidth={2}
                  />
                </View>
                <Text style={styles.menuItemText}>Dashboard</Text>
              </View>
              <View style={styles.menuItemRight}>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={20}
                  color={colors.secondaryText}
                  strokeWidth={2}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('OrderManagement')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: '#6366f1' },
                  ]}
                >
                  <HugeiconsIcon
                    icon={ShoppingBag01Icon}
                    size={20}
                    color="#fff"
                    strokeWidth={2}
                  />
                </View>
                <Text style={styles.menuItemText}>Order Management</Text>
              </View>
              <View style={styles.menuItemRight}>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={20}
                  color={colors.secondaryText}
                  strokeWidth={2}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Vendor Navigation Section */}
        {user.role === 'vendor' && (
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Vendor Dashboard</Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('VendorDashboard')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: '#f59e0b' },
                  ]}
                >
                  <HugeiconsIcon
                    icon={ShoppingBag01Icon}
                    size={20}
                    color="#fff"
                    strokeWidth={2}
                  />
                </View>
                <Text style={styles.menuItemText}>My Vendor Dashboard</Text>
              </View>
              <View style={styles.menuItemRight}>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={20}
                  color={colors.secondaryText}
                  strokeWidth={2}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('VendorGuide')}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: '#10b981' },
                  ]}
                >
                  <HugeiconsIcon
                    icon={Settings02Icon}
                    size={20}
                    color="#fff"
                    strokeWidth={2}
                  />
                </View>
                <Text style={styles.menuItemText}>Vendor Guide</Text>
              </View>
              <View style={styles.menuItemRight}>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={20}
                  color={colors.secondaryText}
                  strokeWidth={2}
                />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Account Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>My Account</Text>
          {accountMenuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <View
                  style={[
                    styles.menuIconContainer,
                    { backgroundColor: item.color },
                  ]}
                >
                  <HugeiconsIcon
                    icon={item.icon}
                    size={20}
                    color="#fff"
                    strokeWidth={2}
                  />
                </View>
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <View style={styles.menuItemRight}>
                {item.badge !== undefined && item.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={20}
                  color={colors.secondaryText}
                  strokeWidth={2}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <HugeiconsIcon
              icon={Logout03Icon}
              size={20}
              color={colors.error}
              strokeWidth={2}
            />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  emptyStateCard: {
    backgroundColor: colors.babyWhite,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    width: '100%',
  },
  iconContainer: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: colors.background,
    borderRadius: 50,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: colors.babyshopSky,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.babyshopSky,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: colors.babyWhite,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.babyshopSky,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.babyshopSky,
    fontSize: 16,
    fontWeight: '600',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.lightBorder,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: 6,
  },
  // Logged In Styles
  headerSection: {
    backgroundColor: colors.babyWhite,
    paddingTop: 20,
    paddingBottom: 24,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.babyshopSky,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.babyWhite,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 8,
  },
  roleBadgeContainer: {
    flexDirection: 'row',
  },
  roleBadgeSmall: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  vendorBadge: {
    backgroundColor: '#f59e0b',
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  menuSection: {
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primaryText,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  logoutSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
});

export default ProfileScreen;
