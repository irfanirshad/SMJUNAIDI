import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import colors from '../constants/colors';
import CommonNavbar from '../components/common/CommonNavbar';
import LoginModal from '../components/common/LoginModal';
import { vendorAPI } from '../services/api';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Time01Icon,
} from '@hugeicons/core-free-icons';

interface VendorFormData {
  storeName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface VendorStatus {
  _id: string;
  status: 'pending' | 'approved' | 'rejected';
  storeName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  createdAt: string;
}

const BecomeVendorScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [vendorStatus, setVendorStatus] = useState<VendorStatus | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [formData, setFormData] = useState<VendorFormData>({
    storeName: '',
    description: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });

  const [errors, setErrors] = useState<Partial<VendorFormData>>({});

  const fetchVendorStatus = useCallback(async () => {
    if (!user || !user.token) {
      setCheckingStatus(false);
      return;
    }

    try {
      const result = await vendorAPI.getMyVendorStatus(user.token);
      setVendorStatus(result.data);

      // If rejected, pre-fill form
      if (result.data.status === 'rejected') {
        setFormData({
          storeName: result.data.storeName,
          description: result.data.description,
          contactEmail: result.data.contactEmail,
          contactPhone: result.data.contactPhone,
          street: result.data.address.street,
          city: result.data.address.city,
          state: result.data.address.state,
          country: result.data.address.country,
          postalCode: result.data.address.postalCode,
        });
      }
    } catch (error: any) {
      // 404 means no vendor application found - this is fine
      if (error.message?.includes('404')) {
        setVendorStatus(null);
      } else {
        console.error('Error fetching vendor status:', error);
      }
    } finally {
      setCheckingStatus(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVendorStatus();
  }, [fetchVendorStatus]);

  const validateForm = (): boolean => {
    const newErrors: Partial<VendorFormData> = {};

    if (!formData.storeName.trim())
      newErrors.storeName = 'Store name is required';
    if (!formData.description.trim())
      newErrors.description = 'Description is required';
    if (!formData.contactEmail.trim())
      newErrors.contactEmail = 'Email is required';
    if (!formData.contactPhone.trim())
      newErrors.contactPhone = 'Phone is required';
    if (!formData.street.trim()) newErrors.street = 'Street is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.postalCode.trim())
      newErrors.postalCode = 'Postal code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!user || !user.token) {
      setShowLoginModal(true);
      return;
    }

    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        storeName: formData.storeName,
        description: formData.description,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          postalCode: formData.postalCode,
        },
      };

      await vendorAPI.registerVendor(user.token, payload);

      Alert.alert(
        'Success',
        'Your vendor application has been submitted successfully! We will review it and notify you.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to submit application. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    // Refresh vendor status after successful login
    fetchVendorStatus();
    Alert.alert('Success', 'You have been logged in successfully!');
  };

  if (checkingStatus) {
    return (
      <View style={styles.container}>
        <CommonNavbar title="Become a Vendor" cartCount={0} showIcons={{}} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.babyshopSky} />
          <Text style={styles.loadingText}>Checking your vendor status...</Text>
        </View>
      </View>
    );
  }

  // If already approved vendor
  if (vendorStatus?.status === 'approved') {
    return (
      <View style={styles.container}>
        <CommonNavbar title="Become a Vendor" cartCount={0} showIcons={{}} />
        <View style={styles.statusContainer}>
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            size={64}
            color="#10b981"
            strokeWidth={2}
          />
          <Text style={styles.statusTitle}>You're Already a Vendor!</Text>
          <Text style={styles.statusMessage}>
            Your vendor application has been approved. Access your dashboard to
            manage your store.
          </Text>
          <TouchableOpacity
            style={styles.dashboardButton}
            onPress={() => navigation.navigate('VendorDashboard')}
          >
            <Text style={styles.dashboardButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If pending approval
  if (vendorStatus?.status === 'pending') {
    return (
      <View style={styles.container}>
        <CommonNavbar title="Become a Vendor" cartCount={0} showIcons={{}} />
        <View style={styles.statusContainer}>
          <HugeiconsIcon
            icon={Time01Icon}
            size={64}
            color={colors.babyshopSky}
            strokeWidth={2}
          />
          <Text style={styles.statusTitle}>Application Pending</Text>
          <Text style={styles.statusMessage}>
            Your vendor application is currently under review. We'll notify you
            once it's been processed.
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonNavbar
        title={
          vendorStatus?.status === 'rejected'
            ? 'Reapply as Vendor'
            : 'Become a Vendor'
        }
        cartCount={0}
        showIcons={{}}
      />
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          {vendorStatus?.status === 'rejected' && (
            <View style={styles.rejectedBanner}>
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={24}
                color="#dc2626"
                strokeWidth={2}
              />
              <Text style={styles.rejectedText}>
                Your previous application was not approved. You can update your
                information and reapply.
              </Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Store Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Store Name *</Text>
            <TextInput
              style={[styles.input, errors.storeName && styles.inputError]}
              value={formData.storeName}
              onChangeText={text =>
                setFormData({ ...formData, storeName: text })
              }
              placeholder="Enter your store name"
              placeholderTextColor={colors.mediumGray}
            />
            {errors.storeName && (
              <Text style={styles.errorText}>{errors.storeName}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              value={formData.description}
              onChangeText={text =>
                setFormData({ ...formData, description: text })
              }
              placeholder="Describe your store and products"
              placeholderTextColor={colors.mediumGray}
              multiline
              numberOfLines={4}
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, errors.contactEmail && styles.inputError]}
              value={formData.contactEmail}
              onChangeText={text =>
                setFormData({ ...formData, contactEmail: text })
              }
              placeholder="your@email.com"
              placeholderTextColor={colors.mediumGray}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.contactEmail && (
              <Text style={styles.errorText}>{errors.contactEmail}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={[styles.input, errors.contactPhone && styles.inputError]}
              value={formData.contactPhone}
              onChangeText={text =>
                setFormData({ ...formData, contactPhone: text })
              }
              placeholder="+1 234 567 8900"
              placeholderTextColor={colors.mediumGray}
              keyboardType="phone-pad"
            />
            {errors.contactPhone && (
              <Text style={styles.errorText}>{errors.contactPhone}</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>Business Address</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Street Address *</Text>
            <TextInput
              style={[styles.input, errors.street && styles.inputError]}
              value={formData.street}
              onChangeText={text => setFormData({ ...formData, street: text })}
              placeholder="123 Main Street"
              placeholderTextColor={colors.mediumGray}
            />
            {errors.street && (
              <Text style={styles.errorText}>{errors.street}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              value={formData.city}
              onChangeText={text => setFormData({ ...formData, city: text })}
              placeholder="City"
              placeholderTextColor={colors.mediumGray}
            />
            {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>State/Province *</Text>
            <TextInput
              style={[styles.input, errors.state && styles.inputError]}
              value={formData.state}
              onChangeText={text => setFormData({ ...formData, state: text })}
              placeholder="State"
              placeholderTextColor={colors.mediumGray}
            />
            {errors.state && (
              <Text style={styles.errorText}>{errors.state}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Country *</Text>
            <TextInput
              style={[styles.input, errors.country && styles.inputError]}
              value={formData.country}
              onChangeText={text => setFormData({ ...formData, country: text })}
              placeholder="Country"
              placeholderTextColor={colors.mediumGray}
            />
            {errors.country && (
              <Text style={styles.errorText}>{errors.country}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Postal Code *</Text>
            <TextInput
              style={[styles.input, errors.postalCode && styles.inputError]}
              value={formData.postalCode}
              onChangeText={text =>
                setFormData({ ...formData, postalCode: text })
              }
              placeholder="12345"
              placeholderTextColor={colors.mediumGray}
            />
            {errors.postalCode && (
              <Text style={styles.errorText}>{errors.postalCode}</Text>
            )}
          </View>

          {!user && (
            <View style={styles.loginRequiredBanner}>
              <Text style={styles.loginRequiredText}>
                You need to login to submit your vendor application
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (loading || !user) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.babyWhite} />
            ) : (
              <Text style={styles.submitButtonText}>
                {!user
                  ? 'Login Required'
                  : vendorStatus?.status === 'rejected'
                  ? 'Reapply as Vendor'
                  : 'Submit Application'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Login Modal */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
        title="Login Required"
        description="Please login to submit your vendor application"
      />
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
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 15,
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  dashboardButton: {
    backgroundColor: colors.babyshopSky,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  dashboardButtonText: {
    color: colors.babyWhite,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.softGray,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  secondaryButtonText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '600',
  },
  formContainer: {
    padding: 20,
  },
  rejectedBanner: {
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    gap: 12,
  },
  rejectedText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginTop: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.babyWhite,
    borderWidth: 1,
    borderColor: colors.softGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.primaryText,
  },
  textArea: {
    backgroundColor: colors.babyWhite,
    borderWidth: 1,
    borderColor: colors.softGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.primaryText,
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
  },
  loginRequiredBanner: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  loginRequiredText: {
    fontSize: 14,
    color: '#92400e',
    textAlign: 'center',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.babyshopSky,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.babyWhite,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BecomeVendorScreen;
