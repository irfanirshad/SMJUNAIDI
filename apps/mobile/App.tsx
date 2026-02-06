import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useUserStore } from './src/store';
import { StripeProvider } from '@stripe/stripe-react-native';
import { LogBox } from 'react-native';
import { ToastProvider, useToast } from './src/context/ToastContext';
import Toast from './src/components/common/Toast';
import { googleAuthService } from './src/services/googleAuthService';

// Ignore the InteractionManager deprecation warning
LogBox.ignoreLogs(['InteractionManager has been deprecated']);

const AppContent = () => {
  const { toastVisible, toastMessage, toastType, hideToast, toastKey } =
    useToast();

  return (
    <>
      <AppNavigator />
      <Toast
        key={toastKey}
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={hideToast}
      />
    </>
  );
};

function App(): React.JSX.Element {
  const { checkStoredAuth } = useUserStore();

  // Stripe publishable key - same as the web client
  const stripePublishableKey =
    '';

  useEffect(() => {
    // Initialize Google Sign-In
    try {
      googleAuthService.configure();
    } catch (error) {
      console.error('❌ Failed to initialize Google Sign-In:', error);
    }

    // Check for stored authentication on app start
    checkStoredAuth();
  }, [checkStoredAuth]);

  return (
    <StripeProvider publishableKey={stripePublishableKey}>
      <GestureHandlerRootView>
        <SafeAreaProvider>
          <ToastProvider>
            <NavigationContainer>
              <AppContent />
            </NavigationContainer>
          </ToastProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </StripeProvider>
  );
}

export default App;
