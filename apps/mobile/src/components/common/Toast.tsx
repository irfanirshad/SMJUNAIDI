import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  AlertCircleIcon,
} from '@hugeicons/core-free-icons';
import colors from '../../constants/colors';

const { width } = Dimensions.get('window');

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide: () => void;
}

const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'success',
  duration = 3000,
  onHide,
}) => {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return CheckmarkCircle02Icon;
      case 'error':
        return Cancel01Icon;
      case 'info':
        return AlertCircleIcon;
      default:
        return CheckmarkCircle02Icon;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return colors.babyGreen;
      case 'error':
        return colors.error;
      case 'info':
        return colors.babyshopSky;
      default:
        return colors.babyGreen;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={hideToast}
        activeOpacity={0.9}
      >
        <HugeiconsIcon
          icon={getIcon()}
          size={24}
          color={getIconColor()}
          strokeWidth={2}
        />
        <Text style={styles.message}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    zIndex: 9999,
    elevation: 10,
  },
  toastContent: {
    backgroundColor: colors.primaryText,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    color: colors.babyWhite,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});

export default Toast;
