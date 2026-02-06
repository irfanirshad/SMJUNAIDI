import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../constants/colors';

interface AuthGuardProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  onLoginPress: () => void;
  fallbackMessage?: string;
}

const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  isAuthenticated,
  onLoginPress,
  fallbackMessage = 'Please login to access this feature',
}) => {
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>{fallbackMessage}</Text>
        <TouchableOpacity style={styles.loginButton} onPress={onLoginPress}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: colors.lightGray,
  },
  message: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: colors.babyshopSky,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AuthGuard;
