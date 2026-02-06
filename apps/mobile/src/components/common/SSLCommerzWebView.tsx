import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import colors from '../../constants/colors';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

interface Props {
  visible: boolean;
  paymentUrl: string;
  orderId: string;
  onSuccess: () => void;
  onFailure: () => void;
  onCancel: () => void;
}

const SSLCommerzWebView: React.FC<Props> = ({
  visible,
  paymentUrl,
  orderId,
  onSuccess,
  onFailure,
  onCancel,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState('');

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    setCurrentUrl(url);

    console.log('📱 WebView navigated to:', url);

    // Check for success URL
    if (url.includes('/success') || url.includes('payment=success')) {
      console.log('✅ Payment successful detected');
      setTimeout(() => {
        onSuccess();
      }, 1000);
    }
    // Check for failure URL
    else if (url.includes('/fail') || url.includes('payment=failed')) {
      console.log('❌ Payment failed detected');
      setTimeout(() => {
        onFailure();
      }, 1000);
    }
    // Check for cancel URL
    else if (url.includes('/cancel') || url.includes('payment=cancelled')) {
      console.log('🚫 Payment cancelled detected');
      setTimeout(() => {
        onCancel();
      }, 1000);
    }
  };

  const handleClose = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel this payment?',
      [
        {
          text: 'No, Continue',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: onCancel,
        },
      ],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
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
            <View style={styles.headerTitle}>
              <Text style={styles.headerTitleText}>SSLCommerz Payment</Text>
              <Text style={styles.headerSubtitle}>
                Order: {orderId.slice(-8).toUpperCase()}
              </Text>
            </View>
            <View style={styles.placeholder} />
          </View>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.babyshopSky} />
            <Text style={styles.loadingText}>Loading payment gateway...</Text>
          </View>
        )}

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={syntheticEvent => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ WebView error:', nativeEvent);
            Alert.alert(
              'Payment Error',
              'Failed to load payment page. Please try again.',
              [
                {
                  text: 'OK',
                  onPress: onFailure,
                },
              ],
            );
          }}
          style={styles.webView}
          startInLoadingState={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
        />

        {/* Current URL Display (for debugging) */}
        {__DEV__ && currentUrl && (
          <View style={styles.debugBar}>
            <Text style={styles.debugText} numberOfLines={1}>
              {currentUrl}
            </Text>
          </View>
        )}
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
    paddingTop: 50,
    paddingBottom: 16,
    shadowColor: colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.secondaryText,
  },
  webView: {
    flex: 1,
    backgroundColor: colors.white,
  },
  debugBar: {
    backgroundColor: colors.lightGray,
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: colors.lightBorder,
  },
  debugText: {
    fontSize: 10,
    color: colors.mutedText,
  },
});

export default SSLCommerzWebView;
