import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SignupScreenNavigationProp } from '../../types';
import { useAuth } from '../hooks/useAuth';
import colors from '../constants/colors';
import AuthHeader from '../components/common/AuthHeader';
import { FormSkeleton } from '../components/skeletons';

const SignupScreen: React.FC<{ navigation: SignupScreenNavigationProp }> = ({
  navigation,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();

  const handleSignup = async () => {
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password);
      Alert.alert('Success', 'Account created successfully!');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      Alert.alert('Success', 'Account created with Google successfully!');
      navigation.goBack();
    } catch (error: any) {
      // Only show error if it's not a user cancellation
      if (!error.message?.toLowerCase().includes('cancel')) {
        Alert.alert(
          'Google Sign-Up Failed',
          error.message || 'Failed to sign up with Google. Please try again.',
        );
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogoPress = () => {
    // Navigate to MainTabs (Home)
    navigation.navigate('MainTabs');
  };

  return (
    <View style={styles.container}>
      <AuthHeader
        onLogoPress={handleLogoPress}
        title="Create Account"
        subtitle="Join our baby shop community"
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity
              style={[styles.signupButton, isLoading && styles.disabledButton]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            {/* Google Sign-Up Button */}
            <TouchableOpacity
              style={[
                styles.googleButton,
                isGoogleLoading && styles.disabledButton,
              ]}
              onPress={handleGoogleSignup}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#4285F4" />
              ) : (
                <>
                  <Image
                    source={{
                      uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                    }}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Loading Overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <FormSkeleton />
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightGray,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 50,
  },
  formContainer: {
    backgroundColor: colors.babyWhite,
    borderRadius: 12,
    padding: 30,
    shadowColor: colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: colors.lightGray,
  },
  signupButton: {
    backgroundColor: colors.babyshopSky,
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.lightBorder,
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 8,
    paddingVertical: 15,
    marginBottom: 10,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: colors.babyshopSky,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
});

export default SignupScreen;
