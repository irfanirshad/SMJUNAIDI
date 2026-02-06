import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import colors from '../constants/colors';
import CommonNavbar from '../components/common/CommonNavbar';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Store01Icon,
  Package02Icon,
  DollarCircleIcon,
  UserMultipleIcon,
} from '@hugeicons/core-free-icons';

const VendorGuideScreen: React.FC<any> = ({ navigation }) => {
  const benefits = [
    {
      icon: Store01Icon,
      title: 'Easy Store Management',
      description:
        'Manage your products, inventory, and orders all in one place.',
    },
    {
      icon: Package02Icon,
      title: 'Wide Product Range',
      description:
        'Sell various baby products from clothes to toys and accessories.',
    },
    {
      icon: DollarCircleIcon,
      title: 'Competitive Pricing',
      description:
        'Set your own prices and run promotions to attract more customers.',
    },
    {
      icon: UserMultipleIcon,
      title: 'Large Customer Base',
      description:
        'Reach thousands of parents looking for quality baby products.',
    },
  ];

  return (
    <View style={styles.container}>
      <CommonNavbar title="Vendor Guide" cartCount={0} showIcons={{}} />
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Become a Babymart Vendor</Text>
          <Text style={styles.description}>
            Join our growing community of vendors and start selling your baby
            products to thousands of customers across the platform.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why Sell on Babymart?</Text>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <View style={styles.iconContainer}>
                  <HugeiconsIcon
                    icon={benefit.icon}
                    size={28}
                    color={colors.babyshopSky}
                    strokeWidth={2}
                  />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>{benefit.title}</Text>
                  <Text style={styles.benefitDescription}>
                    {benefit.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            <View style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Apply</Text>
                <Text style={styles.stepDescription}>
                  Fill out the vendor application form with your store details
                  and business information.
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Get Approved</Text>
                <Text style={styles.stepDescription}>
                  Our team will review your application and notify you once
                  approved.
                </Text>
              </View>
            </View>

            <View style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Start Selling</Text>
                <Text style={styles.stepDescription}>
                  Add your products, set prices, and start receiving orders from
                  customers.
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => navigation.navigate('BecomeVendor')}
          >
            <Text style={styles.applyButtonText}>Apply Now</Text>
          </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: colors.secondaryText,
    lineHeight: 22,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: 16,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 20,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.babyshopSky,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.babyWhite,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 20,
  },
  applyButton: {
    backgroundColor: colors.babyshopSky,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  applyButtonText: {
    color: colors.babyWhite,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default VendorGuideScreen;
