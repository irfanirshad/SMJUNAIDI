import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Address } from '../../../types';
import colors from '../../constants/colors';
import AddressModal from './AddressModal';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Home01Icon,
  Location01Icon,
  Add01Icon,
} from '@hugeicons/core-free-icons';

interface AddressSelectorProps {
  selectedAddress: Address | null;
  onAddressSelect: (address: Address) => void;
  onAddressAdded?: (address: Address) => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  selectedAddress,
  onAddressSelect,
  onAddressAdded,
}) => {
  const [showAddressModal, setShowAddressModal] = useState(false);

  const handleAddressAdded = async (address: Address) => {
    // Select the newly added address
    onAddressSelect(address);
    setShowAddressModal(false);
    // Call the parent's onAddressAdded callback if provided
    // Parent is responsible for refreshing user data
    if (onAddressAdded) {
      onAddressAdded(address);
    }
  };

  return (
    <View style={styles.container}>
      {selectedAddress ? (
        <View style={styles.selectedAddressContainer}>
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <HugeiconsIcon
                icon={Home01Icon}
                size={20}
                color={colors.babyshopSky}
                strokeWidth={2}
              />
              <Text style={styles.addressTitle}>
                {selectedAddress.isDefault
                  ? 'Default Address'
                  : 'Selected Address'}
              </Text>
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressText}>{selectedAddress.street}</Text>
              <Text style={styles.addressText}>
                {selectedAddress.city}, {selectedAddress.state}{' '}
                {selectedAddress.postalCode}
              </Text>
              <Text style={styles.addressText}>{selectedAddress.country}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => setShowAddressModal(true)}
          >
            <Text style={styles.changeButtonText}>Change Address</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noAddressContainer}>
          <HugeiconsIcon
            icon={Location01Icon}
            size={48}
            color={colors.mutedText}
            strokeWidth={1.5}
          />
          <Text style={styles.noAddressText}>No shipping address selected</Text>
          <TouchableOpacity
            style={styles.addAddressButton}
            onPress={() => setShowAddressModal(true)}
          >
            <HugeiconsIcon
              icon={Add01Icon}
              size={20}
              color={colors.white}
              strokeWidth={2}
            />
            <Text style={styles.addAddressButtonText}>Add Address</Text>
          </TouchableOpacity>
        </View>
      )}

      <AddressModal
        visible={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onAddressAdded={handleAddressAdded}
        onAddressSelected={onAddressSelect}
        selectedAddress={selectedAddress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  selectedAddressContainer: {
    width: '100%',
  },
  addressCard: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.babyshopSky,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: colors.babyshopSky,
    marginLeft: 8,
  },
  addressContent: {
    marginLeft: 28,
  },
  addressText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: 'Poppins-Regular',
    marginBottom: 2,
  },
  changeButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.babyshopSky,
  },
  changeButtonText: {
    color: colors.babyshopSky,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  noAddressContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderStyle: 'dashed',
  },
  noAddressText: {
    fontSize: 16,
    color: colors.mutedText,
    fontFamily: 'Poppins-Regular',
    marginTop: 12,
    marginBottom: 16,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.babyshopSky,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addAddressButtonText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginLeft: 8,
  },
});

export default AddressSelector;
