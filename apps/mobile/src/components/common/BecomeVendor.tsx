import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HomeScreenNavigationProp } from '../../../types';
import { useAuth } from '../../hooks/useAuth';
import colors from '../../constants/colors';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  CheckmarkCircle02Icon,
  Store01Icon,
  PackageIcon,
  Analytics01Icon,
} from '@hugeicons/core-free-icons';

interface BecomeVendorProps {
  navigation: HomeScreenNavigationProp;
}

const BecomeVendor: React.FC<BecomeVendorProps> = ({ navigation }) => {
  const { user } = useAuth();

  // If user is a vendor, show welcome message
  if (user?.role === 'vendor') {
    return (
      <View style={styles.vendorContainer}>
        <View style={styles.vendorContent}>
          <View style={styles.vendorHeader}>
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              size={32}
              color={colors.babyWhite}
              strokeWidth={2}
            />
            <Text style={styles.vendorTitle}>Welcome Back, Vendor!</Text>
          </View>
          <Text style={styles.vendorDescription}>
            You're already part of our vendor community. Manage your products,
            track orders, and grow your business.
          </Text>

          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <HugeiconsIcon
                icon={Store01Icon}
                size={24}
                color={colors.babyWhite}
                strokeWidth={2}
              />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Your Store</Text>
                <Text style={styles.featureSubtitle}>Manage products</Text>
              </View>
            </View>
            <View style={styles.featureCard}>
              <HugeiconsIcon
                icon={PackageIcon}
                size={24}
                color={colors.babyWhite}
                strokeWidth={2}
              />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Orders</Text>
                <Text style={styles.featureSubtitle}>Track sales</Text>
              </View>
            </View>
            <View style={styles.featureCard}>
              <HugeiconsIcon
                icon={Analytics01Icon}
                size={24}
                color={colors.babyWhite}
                strokeWidth={2}
              />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Analytics</Text>
                <Text style={styles.featureSubtitle}>View insights</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('VendorDashboard')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Default: Invite to become a vendor
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Become a Vendor on Babymart</Text>
        <Text style={styles.description}>
          Join our marketplace and reach thousands of customers. Sell your baby
          products with ease and grow your business today.
        </Text>
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => navigation.navigate('BecomeVendor')}
            activeOpacity={0.8}
          >
            <Text style={styles.applyButtonText}>Apply Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.learnMoreButton}
            onPress={() => navigation.navigate('VendorGuide')}
            activeOpacity={0.8}
          >
            <Text style={styles.learnMoreButtonText}>Learn More</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primaryText,
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 15,
    marginVertical: 10,
    overflow: 'hidden',
  },
  content: {
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.babyWhite,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.softGray,
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  applyButton: {
    flex: 1,
    backgroundColor: colors.babyshopSky,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.babyWhite,
    fontSize: 15,
    fontWeight: '600',
  },
  learnMoreButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.babyWhite,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  learnMoreButtonText: {
    color: colors.babyWhite,
    fontSize: 15,
    fontWeight: '600',
  },
  // Vendor-specific styles
  vendorContainer: {
    backgroundColor: '#10b981', // green-600
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 15,
    marginVertical: 10,
    overflow: 'hidden',
  },
  vendorContent: {
    zIndex: 10,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  vendorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.babyWhite,
    flex: 1,
  },
  vendorDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 20,
    lineHeight: 22,
  },
  featuresGrid: {
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.babyWhite,
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  primaryButton: {
    backgroundColor: colors.babyWhite,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default BecomeVendor;
