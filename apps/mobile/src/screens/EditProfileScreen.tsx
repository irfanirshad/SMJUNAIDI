import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useAuth } from '../hooks/useAuth';
import colors from '../constants/colors';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  UserIcon,
  Camera01Icon,
  Tick02Icon,
  Cancel01Icon,
} from '@hugeicons/core-free-icons';
import { launchImageLibrary } from 'react-native-image-picker';

type EditProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'EditProfile'
>;

interface Props {
  navigation: EditProfileScreenNavigationProp;
}

const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || ''); // Email is read-only
  const [avatarUri, setAvatarUri] = useState<string | null>(
    user?.avatar || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleImagePicker = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      },
      response => {
        if (response.didCancel) {
          return;
        }

        if (response.errorCode) {
          Alert.alert('Error', 'Failed to select image');
          return;
        }

        if (response.assets && response.assets[0]) {
          const uri = response.assets[0].uri;
          if (uri) {
            setAvatarUri(uri);
            setHasChanges(true);
          }
        }
      },
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return;
    }

    setIsLoading(true);

    try {
      const updates: { name: string; avatar?: string } = {
        name: name.trim(),
      };

      // If avatar changed, include it
      if (avatarUri && avatarUri !== user?.avatar) {
        updates.avatar = avatarUri;
      }

      await updateProfile(updates);

      Alert.alert('Success', 'Profile updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } else {
      navigation.goBack();
    }
  };

  const handleNameChange = (text: string) => {
    setName(text);
    setHasChanges(text !== user?.name);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={24}
              color={colors.primaryText}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[
              styles.headerButton,
              (!hasChanges || isLoading) && styles.headerButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.babyshopSky} />
            ) : (
              <HugeiconsIcon
                icon={Tick02Icon}
                size={24}
                color={hasChanges ? colors.babyshopSky : colors.secondaryText}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <HugeiconsIcon
                  icon={UserIcon}
                  size={50}
                  color={colors.babyWhite}
                />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={handleImagePicker}
            disabled={isLoading}
          >
            <HugeiconsIcon
              icon={Camera01Icon}
              size={20}
              color={colors.babyshopSky}
            />
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={handleNameChange}
              placeholder="Enter your name"
              placeholderTextColor={colors.secondaryText}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={email}
              editable={false}
              placeholderTextColor={colors.secondaryText}
            />
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          {user?.role && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleContainer}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {user.role.toUpperCase()}
                  </Text>
                </View>
                {user.employee_role && (
                  <View style={[styles.roleBadge, styles.employeeRoleBadge]}>
                    <Text style={styles.roleBadgeText}>
                      {user.employee_role.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            💡 Your email address is used for login and cannot be modified here.
          </Text>
          <Text style={styles.infoText}>
            🔒 To change your password, please use the password reset feature.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.babyWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightBorder,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: colors.babyWhite,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.babyshopSky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  changePhotoText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.babyshopSky,
  },
  formSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.babyWhite,
    borderWidth: 1,
    borderColor: colors.lightBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.primaryText,
  },
  inputDisabled: {
    backgroundColor: colors.background,
    color: colors.secondaryText,
  },
  helperText: {
    fontSize: 12,
    color: colors.secondaryText,
    marginTop: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  employeeRoleBadge: {
    backgroundColor: '#3b82f6',
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 20,
  },
});

export default EditProfileScreen;
