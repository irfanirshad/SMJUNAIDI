import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { HomeScreenNavigationProp } from '../../../types';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import colors from '../../constants/colors';

import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ShoppingBag01Icon,
  FolderCheckIcon,
  FavouriteIcon,
} from '@hugeicons/core-free-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  navigation: HomeScreenNavigationProp;
}

const HomeNavbar: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { cartCount } = useCart();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-50)).current;
  const logoScaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const iconsSlideAnim = React.useRef(new Animated.Value(50)).current;
  const iconFadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      // Fade in the entire navbar
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Slide down the navbar
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      // Scale up the logo
      Animated.timing(logoScaleAnim, {
        toValue: 1,
        duration: 700,
        delay: 200,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      // Slide in the icons from right
      Animated.timing(iconsSlideAnim, {
        toValue: 0,
        duration: 600,
        delay: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      // Fade in individual icons
      Animated.timing(iconFadeAnim, {
        toValue: 1,
        duration: 400,
        delay: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, logoScaleAnim, iconsSlideAnim, iconFadeAnim]);

  const handleAuthenticatedNavigation = (
    screenName: 'Cart' | 'Orders' | 'Wishlist',
    screenTitle: string,
  ) => {
    if (!user) {
      Alert.alert('Login Required', `Please login to access ${screenTitle}`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    navigation.navigate(screenName);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <Animated.View
        style={[
          styles.navbar,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Logo Section */}
        <Animated.View
          style={[
            styles.logoSection,
            {
              transform: [{ scale: logoScaleAnim }],
            },
          ]}
        >
          <Image
            source={require('../../assets/images/smallLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandText}>Baby Shop</Text>
        </Animated.View>

        {/* Navigation Icons */}
        <Animated.View
          style={[
            styles.iconsSection,
            {
              transform: [{ translateX: iconsSlideAnim }],
              opacity: iconFadeAnim,
            },
          ]}
        >
          {/* Search Icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleAuthenticatedNavigation('Cart', 'Cart')}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <HugeiconsIcon
                icon={ShoppingBag01Icon}
                size={20}
                color={colors.primaryText}
                strokeWidth={2}
              />
              {cartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.iconLabel}>Cart</Text>
          </TouchableOpacity>

          {/* Wishlist Icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() =>
              handleAuthenticatedNavigation('Wishlist', 'Wishlist')
            }
            activeOpacity={0.7}
          >
            <HugeiconsIcon
              icon={FavouriteIcon}
              size={20}
              color={colors.primaryText}
              strokeWidth={2}
            />
            <Text style={styles.iconLabel}>Wishlist</Text>
          </TouchableOpacity>

          {/* Orders Icon - Only show if user is logged in */}
          {user && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleAuthenticatedNavigation('Orders', 'Orders')}
              activeOpacity={0.7}
            >
              <HugeiconsIcon
                icon={FolderCheckIcon}
                size={20}
                color={colors.primaryText}
                strokeWidth={2}
              />
              <Text style={styles.iconLabel}>Orders</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.babyWhite,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: colors.babyWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.softGray,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 35,
    height: 35,
    marginRight: 8,
  },
  brandText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
  iconsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    alignItems: 'center',
    marginLeft: 15,
    paddingHorizontal: 5,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.babyshopSky,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.babyWhite,
  },
  badgeText: {
    color: colors.babyWhite,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  icon: {
    fontSize: 18,
    marginBottom: 2,
  },
  iconLabel: {
    fontSize: 10,
    color: colors.secondaryText,
    fontWeight: '500',
    marginTop: 2,
  },
});

export default HomeNavbar;
