import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import colors from '../../constants/colors';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AuthHeaderProps {
  onLogoPress: () => void;
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
}

const AuthHeader: React.FC<AuthHeaderProps> = ({
  onLogoPress,
  title,
  subtitle,
  onBackPress,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        {/* Back Button */}
        {onBackPress && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <HugeiconsIcon
              icon={ArrowLeft02Icon}
              size={24}
              color={colors.primaryText}
              strokeWidth={2}
            />
          </TouchableOpacity>
        )}

        {/* Logo Section - Clickable */}
        <TouchableOpacity
          style={styles.logoSection}
          onPress={onLogoPress}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../assets/images/smallLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandText}>Baby Shop</Text>
        </TouchableOpacity>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.babyWhite,
  },
  header: {
    backgroundColor: colors.babyWhite,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
    marginTop: Platform.OS === 'android' ? 50 : 0,
    position: 'relative', // Enable absolute positioning for children
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 25, // Align with logo/header
    zIndex: 10,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  brandText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
  titleSection: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default AuthHeader;
