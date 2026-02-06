import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  FlatList,
} from 'react-native';
import { Address } from '../../../types';
import colors from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { AVAILABLE_COUNTRIES } from '../../config/environment';
import { addressAPI } from '../../services/api';

import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Cancel01Icon,
  Add01Icon,
  Delete02Icon,
} from '@hugeicons/core-free-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAddressAdded: (address: Address) => void;
  onAddressSelected?: (address: Address) => void;
  selectedAddress?: Address | null;
}

interface AddressForm {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

const AddressModal: React.FC<Props> = ({
  visible,
  onClose,
  onAddressAdded,
  onAddressSelected,
  selectedAddress: _selectedAddress,
}) => {
  const { user } = useAuth();
  const auth_token = user?.token;

  const [showAddForm, setShowAddForm] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [form, setForm] = useState<AddressForm>({
    street: '',
    city: '',
    state: '',
    country: AVAILABLE_COUNTRIES[0], // Default to Bangladesh
    postalCode: '',
    isDefault: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has addresses and set initial view accordingly
  React.useEffect(() => {
    if (visible) {
      const hasAddresses = user?.addresses && user.addresses.length > 0;
      setShowAddForm(!hasAddresses); // Show form immediately if no addresses
    }
  }, [visible, user?.addresses]);

  const handleInputChange = (
    field: keyof AddressForm,
    value: string | boolean,
  ) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!form.street.trim()) {
      Alert.alert('Validation Error', 'Street address is required');
      return false;
    }
    if (!form.city.trim()) {
      Alert.alert('Validation Error', 'City is required');
      return false;
    }
    if (!form.state.trim()) {
      Alert.alert('Validation Error', 'State is required');
      return false;
    }
    if (!form.country.trim()) {
      Alert.alert('Validation Error', 'Country is required');
      return false;
    }
    if (!form.postalCode.trim()) {
      Alert.alert('Validation Error', 'Postal code is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    if (!auth_token) {
      Alert.alert('Authentication Error', 'Please login to add an address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await addressAPI.addAddress(auth_token, form);

      if (response.success && response.address) {
        Alert.alert('Success', 'Address added successfully');
        onAddressAdded(response.address);
        handleClose();
      } else {
        Alert.alert('Error', response.message || 'Failed to add address');
      }
    } catch (error) {
      console.error('❌ Add address error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAddress = (address: Address) => {
    if (onAddressSelected) {
      onAddressSelected(address);
    }
    handleClose();
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!auth_token) {
      Alert.alert('Authentication Error', 'Please login to delete an address');
      return;
    }

    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const response = await addressAPI.deleteAddress(
                auth_token,
                addressId,
              );

              if (response.success) {
                Alert.alert('Success', 'Address deleted successfully');

                // Call onAddressAdded with a dummy address to trigger refresh and selection logic
                // The parent component (PlaceOrderScreen) will handle the address selection logic
                onAddressAdded({} as Address);
              } else {
                Alert.alert(
                  'Error',
                  response.message || 'Failed to delete address',
                );
              }
            } catch (error) {
              console.error('❌ Delete address error:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleClose = () => {
    setForm({
      street: '',
      city: '',
      state: '',
      country: AVAILABLE_COUNTRIES[0], // Reset to Bangladesh
      postalCode: '',
      isDefault: false,
    });
    setShowAddForm(false);
    onClose();
  };

  console.log('av', AVAILABLE_COUNTRIES);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={24}
                color={colors.text}
                strokeWidth={2}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {showAddForm ? 'Add New Address' : 'Select Address'}
            </Text>
            {showAddForm ? (
              <TouchableOpacity
                style={[styles.saveButton, isLoading && styles.disabledButton]}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.babyshopSky} />
                ) : (
                  <HugeiconsIcon
                    icon={Add01Icon}
                    size={24}
                    color={colors.babyshopSky}
                    strokeWidth={2}
                  />
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => setShowAddForm(true)}
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  size={24}
                  color={colors.babyshopSky}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        {showAddForm ? (
          // Add New Address Form
          <>
            <ScrollView
              style={styles.form}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Country *</Text>
                <TouchableOpacity
                  style={styles.countrySelector}
                  onPress={() => setShowCountryPicker(true)}
                >
                  <Text style={styles.countrySelectorText}>
                    {form.country || 'Select your country'}
                  </Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Street Address *</Text>
                <TextInput
                  style={styles.input}
                  value={form.street}
                  onChangeText={value => handleInputChange('street', value)}
                  placeholder="Enter your street address"
                  placeholderTextColor={colors.mutedText}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  value={form.city}
                  onChangeText={value => handleInputChange('city', value)}
                  placeholder="Enter your city"
                  placeholderTextColor={colors.mutedText}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>State *</Text>
                <TextInput
                  style={styles.input}
                  value={form.state}
                  onChangeText={value => handleInputChange('state', value)}
                  placeholder="Enter your state"
                  placeholderTextColor={colors.mutedText}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Postal Code *</Text>
                <TextInput
                  style={styles.input}
                  value={form.postalCode}
                  onChangeText={value => handleInputChange('postalCode', value)}
                  placeholder="Enter your postal code"
                  placeholderTextColor={colors.mutedText}
                />
              </View>

              <TouchableOpacity
                style={styles.defaultOption}
                onPress={() => handleInputChange('isDefault', !form.isDefault)}
              >
                <View
                  style={[
                    styles.checkbox,
                    form.isDefault && styles.checkedCheckbox,
                  ]}
                >
                  {form.isDefault && (
                    <HugeiconsIcon
                      icon={Add01Icon}
                      size={16}
                      color={colors.white}
                      strokeWidth={3}
                    />
                  )}
                </View>
                <Text style={styles.defaultOptionText}>
                  Set as default address
                </Text>
              </TouchableOpacity>

              {user?.addresses && user.addresses.length > 0 && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={styles.backButtonText}>
                    ← Back to Address List
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            {/* Save Button */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity
                style={[
                  styles.saveAddressButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.white} />
                    <Text style={styles.loadingText}>Saving...</Text>
                  </View>
                ) : (
                  <Text style={styles.saveAddressButtonText}>Save Address</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // Address Selection List
          <ScrollView
            style={styles.addressList}
            showsVerticalScrollIndicator={false}
          >
            {user?.addresses && user.addresses.length > 0 ? (
              user.addresses.map(address => (
                <View key={address._id} style={styles.addressItem}>
                  <View style={styles.addressContent}>
                    <View style={styles.addressHeader}>
                      <Text style={styles.addressTitle}>
                        {address.isDefault ? 'Default Address' : 'Address'}
                      </Text>
                      {address.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.addressText}>{address.street}</Text>
                    <Text style={styles.addressText}>
                      {address.city}, {address.state} {address.postalCode}
                    </Text>
                    <Text style={styles.addressText}>{address.country}</Text>

                    {/* Select button aligned with address text */}
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => handleSelectAddress(address)}
                    >
                      <Text style={styles.selectButtonText}>Select</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Delete button at bottom right */}
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteAddress(address._id)}
                    disabled={isLoading}
                  >
                    <HugeiconsIcon
                      icon={Delete02Icon}
                      size={18}
                      color={colors.error}
                      strokeWidth={2}
                    />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No addresses found</Text>
                <TouchableOpacity
                  style={styles.addFirstAddressButton}
                  onPress={() => setShowAddForm(true)}
                >
                  <HugeiconsIcon
                    icon={Add01Icon}
                    size={20}
                    color={colors.white}
                    strokeWidth={2}
                  />
                  <Text style={styles.addFirstAddressButtonText}>
                    Add Your First Address
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <TouchableOpacity
          style={styles.countryModalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryPicker(false)}
        >
          <View style={styles.countryModalContent}>
            <View style={styles.countryModalHeader}>
              <Text style={styles.countryModalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => setShowCountryPicker(false)}
                style={styles.countryModalClose}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={20}
                  color={colors.text}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={AVAILABLE_COUNTRIES}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    form.country === item && styles.selectedCountryItem,
                  ]}
                  onPress={() => {
                    handleInputChange('country', item);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.countryItemText,
                      form.country === item && styles.selectedCountryItemText,
                    ]}
                  >
                    {item}
                  </Text>
                  {form.country === item && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  saveButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  disabledButton: {
    opacity: 0.5,
  },
  form: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  countrySelector: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
  },
  countrySelectorText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: colors.mutedText,
    marginLeft: 8,
  },
  countryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  countryModalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    width: '100%',
    maxHeight: '70%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  countryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
  },
  countryModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  countryModalClose: {
    padding: 4,
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
  },
  selectedCountryItem: {
    backgroundColor: colors.lightGray,
  },
  countryItemText: {
    fontSize: 16,
    color: colors.text,
  },
  selectedCountryItemText: {
    color: colors.babyshopSky,
    fontWeight: '600',
  },
  checkMark: {
    fontSize: 18,
    color: colors.babyshopSky,
    fontWeight: 'bold',
  },
  defaultOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.lightBorder,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedCheckbox: {
    backgroundColor: colors.babyshopSky,
    borderColor: colors.babyshopSky,
  },
  defaultOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightBorder,
  },
  saveAddressButton: {
    backgroundColor: colors.babyshopSky,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveAddressButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 8,
  },
  // Address List Styles
  addressList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  addressItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  defaultBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  addressText: {
    fontSize: 14,
    color: colors.mutedText,
    marginBottom: 2,
  },
  selectButton: {
    backgroundColor: colors.babyshopSky,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  deleteButton: {
    backgroundColor: colors.lightGray,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
    alignSelf: 'flex-end',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.mutedText,
    marginBottom: 24,
  },
  addFirstAddressButton: {
    backgroundColor: colors.babyshopSky,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstAddressButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginLeft: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: colors.babyshopSky,
    fontWeight: '500',
  },
});

export default AddressModal;
