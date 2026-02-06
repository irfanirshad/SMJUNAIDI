import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import colors from '../../constants/colors';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Cancel01Icon,
  CreditCardIcon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectMethod: (method: 'stripe' | 'sslcommerz') => void;
  totalAmount: number;
}

const PaymentMethodModal: React.FC<Props> = ({
  visible,
  onClose,
  onSelectMethod,
  totalAmount,
}) => {
  const [selectedMethod, setSelectedMethod] = React.useState<
    'stripe' | 'sslcommerz' | null
  >(null);

  const handleConfirm = () => {
    if (selectedMethod) {
      onSelectMethod(selectedMethod);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={24}
                color={colors.text}
                strokeWidth={2}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Select Payment Method</Text>
            <View style={styles.placeholder} />
          </View>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.amountText}>
            Amount to Pay: ${totalAmount.toFixed(2)}
          </Text>

          <Text style={styles.sectionTitle}>Choose Payment Gateway:</Text>

          {/* Stripe Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedMethod === 'stripe' && styles.paymentOptionSelected,
            ]}
            onPress={() => setSelectedMethod('stripe')}
          >
            <View style={styles.paymentOptionContent}>
              <HugeiconsIcon
                icon={CreditCardIcon}
                size={32}
                color={
                  selectedMethod === 'stripe'
                    ? colors.babyshopSky
                    : colors.secondaryText
                }
                strokeWidth={2}
              />
              <View style={styles.paymentOptionText}>
                <Text
                  style={[
                    styles.paymentOptionTitle,
                    selectedMethod === 'stripe' &&
                      styles.paymentOptionTitleSelected,
                  ]}
                >
                  Stripe
                </Text>
                <Text style={styles.paymentOptionDescription}>
                  International cards (USD)
                </Text>
                <Text style={styles.paymentOptionFeatures}>
                  • Visa, Mastercard, American Express
                </Text>
                <Text style={styles.paymentOptionFeatures}>
                  • Secure payment processing
                </Text>
              </View>
            </View>
            {selectedMethod === 'stripe' && (
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={24}
                color={colors.babyshopSky}
                strokeWidth={2}
              />
            )}
          </TouchableOpacity>

          {/* SSLCommerz Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedMethod === 'sslcommerz' && styles.paymentOptionSelected,
            ]}
            onPress={() => setSelectedMethod('sslcommerz')}
          >
            <View style={styles.paymentOptionContent}>
              <HugeiconsIcon
                icon={CreditCardIcon}
                size={32}
                color={
                  selectedMethod === 'sslcommerz'
                    ? colors.babyshopSky
                    : colors.secondaryText
                }
                strokeWidth={2}
              />
              <View style={styles.paymentOptionText}>
                <Text
                  style={[
                    styles.paymentOptionTitle,
                    selectedMethod === 'sslcommerz' &&
                      styles.paymentOptionTitleSelected,
                  ]}
                >
                  SSLCommerz
                </Text>
                <Text style={styles.paymentOptionDescription}>
                  Local payment methods (BDT)
                </Text>
                <Text style={styles.paymentOptionFeatures}>
                  • bKash, Nagad, Rocket
                </Text>
                <Text style={styles.paymentOptionFeatures}>
                  • Local bank cards & internet banking
                </Text>
              </View>
            </View>
            {selectedMethod === 'sslcommerz' && (
              <HugeiconsIcon
                icon={CheckmarkCircle02Icon}
                size={24}
                color={colors.babyshopSky}
                strokeWidth={2}
              />
            )}
          </TouchableOpacity>

          <Text style={styles.noteText}>
            Note: SSLCommerz will redirect you to their secure payment page.
            You'll return to the app after completing payment.
          </Text>
        </ScrollView>

        {/* Confirm Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              !selectedMethod && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!selectedMethod}
          >
            <Text
              style={[
                styles.confirmButtonText,
                !selectedMethod && styles.confirmButtonTextDisabled,
              ]}
            >
              {selectedMethod
                ? `Pay with ${
                    selectedMethod === 'stripe' ? 'Stripe' : 'SSLCommerz'
                  }`
                : 'Select a payment method'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 16,
  },
  paymentOption: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.lightBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentOptionSelected: {
    borderColor: colors.babyshopSky,
    backgroundColor: colors.babyshopSky + '10',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  paymentOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4,
  },
  paymentOptionTitleSelected: {
    color: colors.babyshopSky,
  },
  paymentOptionDescription: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 8,
  },
  paymentOptionFeatures: {
    fontSize: 12,
    color: colors.mutedText,
    marginBottom: 2,
  },
  noteText: {
    fontSize: 12,
    color: colors.mutedText,
    fontStyle: 'italic',
    marginTop: 16,
    paddingHorizontal: 8,
    lineHeight: 18,
  },
  bottomContainer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightBorder,
  },
  confirmButton: {
    backgroundColor: colors.babyshopSky,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonTextDisabled: {
    color: colors.mutedText,
  },
});

export default PaymentMethodModal;
