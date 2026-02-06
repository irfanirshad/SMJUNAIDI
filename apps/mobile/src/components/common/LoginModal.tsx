import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import colors from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  title?: string;
  description?: string;
}

/**
 * Global LoginModal Component
 *
 * A reusable login modal that can be called from anywhere in the app.
 * Features:
 * - Bottom sheet design with backdrop
 * - Email/password validation
 * - Password visibility toggle
 * - Loading states
 * - Error handling
 * - Navigation to signup
 * - Success callback support
 *
 * @example
 * ```tsx
 * const [showLoginModal, setShowLoginModal] = useState(false);
 *
 * const handleLoginSuccess = () => {
 *   console.log('User logged in successfully');
 *   // Refresh data, update UI, etc.
 * };
 *
 * return (
 *   <>
 *     <Button onPress={() => setShowLoginModal(true)}>Login</Button>
 *     <LoginModal
 *       visible={showLoginModal}
 *       onClose={() => setShowLoginModal(false)}
 *       onLoginSuccess={handleLoginSuccess}
 *       title="Login Required"
 *       description="Please login to continue"
 *     />
 *   </>
 * );
 * ```
 */
const LoginModal: React.FC<LoginModalProps> = ({
  visible,
  onClose,
  onLoginSuccess,
  title = 'Login Required',
  description = 'Please login to continue',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigation = useNavigation();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setError('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Use the login function from useAuth which handles everything
      await login(email, password);

      // Close modal and reset form
      handleClose();

      // Call success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupPress = () => {
    handleClose();
    // @ts-ignore - navigation types
    navigation.navigate('Signup');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>{description}</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={text => {
                setEmail(text);
                setError('');
              }}
              placeholder="your@email.com"
              placeholderTextColor={colors.mediumGray}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  setError('');
                }}
                placeholder="Enter password"
                placeholderTextColor={colors.mediumGray}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                <HugeiconsIcon
                  icon={showPassword ? ViewIcon : ViewOffIcon}
                  size={20}
                  color={colors.mediumGray}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.babyWhite} />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupLink}
            onPress={handleSignupPress}
          >
            <Text style={styles.signupText}>
              Don't have an account?{' '}
              <Text style={styles.signupTextBold}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.babyWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryText,
  },
  modalClose: {
    fontSize: 28,
    color: colors.mediumGray,
    fontWeight: '300',
  },
  modalDescription: {
    fontSize: 15,
    color: colors.secondaryText,
    marginBottom: 24,
    lineHeight: 22,
  },
  errorBanner: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44',
  },
  errorBannerText: {
    color: '#c00',
    fontSize: 14,
    fontWeight: '500',
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
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.primaryText,
    backgroundColor: colors.lightGray,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.primaryText,
  },
  passwordToggle: {
    paddingHorizontal: 12,
  },
  loginButton: {
    backgroundColor: colors.babyshopSky,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: colors.mediumGray,
    opacity: 0.6,
  },
  loginButtonText: {
    color: colors.babyWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  signupLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    fontSize: 15,
    color: colors.secondaryText,
  },
  signupTextBold: {
    color: colors.babyshopSky,
    fontWeight: '600',
  },
});

export default LoginModal;
