import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useOrders } from '../../hooks/useOrders';
import colors from '../../constants/colors';

import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft02Icon,
  ShoppingBag01Icon,
  FolderCheckIcon,
  FavouriteIcon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { HomeScreenNavigationProp } from '../../../types';
import { logo } from '../../assets/image';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CommonNavbarProps {
  title?: string;
  showLogo?: boolean;
  showBackButton?: boolean;
  cartCount?: number;
  showIcons?: {
    cart?: boolean;
    orders?: boolean;
    wishlist?: boolean;
    profile?: boolean;
  };
}

const CommonNavbar: React.FC<CommonNavbarProps> = ({
  title,
  showLogo = false,
  showBackButton = true,
  showIcons = {},
}) => {
  const navigation: HomeScreenNavigationProp = useNavigation();
  const { user } = useAuth();
  const { cartItems } = useCart();
  const { orderCount } = useOrders();

  const handleCartPress = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('Cart');
  };

  const handleOrdersPress = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('Orders');
  };

  const handleWishlistPress = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('Wishlist');
  };

  const handleProfilePress = () => {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    // Navigate to profile screen when available
    navigation.navigate('Profile');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.navbar}>
        {/* Left Section - Back Button or Logo */}
        <View style={styles.navigationContainer}>
          {showLogo ? (
            // Show Logo for Home Screen
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <View style={styles.logoSection}>
                <Image source={logo} style={styles.logo} resizeMode="contain" />
              </View>
            </TouchableOpacity>
          ) : (
            // Show Back Button and Title for other screens
            <>
              {showBackButton && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <HugeiconsIcon
                    icon={ArrowLeft02Icon}
                    size={24}
                    color={colors.primaryText}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              )}

              {/* Title */}
              {title && (
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {title}
                </Text>
              )}
            </>
          )}
        </View>

        {/* Icons Container */}
        <View style={styles.iconsContainer}>
          {/* Cart Icon with Badge */}
          <TouchableOpacity
            style={[styles.iconButton, !showIcons.cart && styles.mutedIcon]}
            onPress={showIcons.cart ? handleCartPress : undefined}
            disabled={!showIcons.cart}
          >
            <View style={styles.iconWrapper}>
              <HugeiconsIcon
                icon={ShoppingBag01Icon}
                size={22}
                color={showIcons.cart ? colors.primaryText : colors.mutedText}
                strokeWidth={2}
              />
              {showIcons.cart && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartItems?.length ? cartItems?.length : 0}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Orders Icon */}
          <TouchableOpacity
            style={[styles.iconButton, !showIcons.orders && styles.mutedIcon]}
            onPress={showIcons.orders ? handleOrdersPress : undefined}
            disabled={!showIcons.orders}
          >
            <View style={styles.iconWrapper}>
              <HugeiconsIcon
                icon={FolderCheckIcon}
                size={22}
                color={showIcons.orders ? colors.primaryText : colors.mutedText}
                strokeWidth={2}
              />
              {showIcons.orders && orderCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{orderCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Wishlist Icon */}
          <TouchableOpacity
            style={[styles.iconButton, !showIcons.wishlist && styles.mutedIcon]}
            onPress={showIcons.wishlist ? handleWishlistPress : undefined}
            disabled={!showIcons.wishlist}
          >
            <HugeiconsIcon
              icon={FavouriteIcon}
              size={22}
              color={showIcons.wishlist ? colors.primaryText : colors.mutedText}
              strokeWidth={2}
            />
          </TouchableOpacity>

          {/* Profile Icon */}
          <TouchableOpacity
            style={[styles.iconButton, !showIcons.profile && styles.mutedIcon]}
            onPress={showIcons.profile ? handleProfilePress : undefined}
            disabled={!showIcons.profile}
          >
            <HugeiconsIcon
              icon={UserIcon}
              size={22}
              color={showIcons.profile ? colors.primaryText : colors.mutedText}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.babyWhite,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 0.5,
    backgroundColor: colors.babyWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  backButton: {
    marginRight: 7,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryText,
    flex: 1,
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.babyshopSky,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.babyWhite,
  },
  badgeText: {
    color: colors.babyWhite,
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  mutedIcon: {
    opacity: 0.3,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 32,
    marginRight: 8,
  },
  brandText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
});

export default CommonNavbar;
