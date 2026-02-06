import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

export interface GoogleUserData {
  id: string;
  email: string;
  name: string;
  photo?: string;
  givenName?: string;
  familyName?: string;
}

export interface BackendUserData {
  name: string;
  email: string;
  avatar?: string;
  authProvider: string;
  authUid: string;
  isOAuthUser: boolean;
}

class GoogleAuthService {
  private isConfigured = false;

  /**
   * Configure Google Sign-In
   * Must be called before using any other methods
   */
  configure(): void {
    if (this.isConfigured) {
      return;
    }

    try {
      // Get the Web Client ID from google-services.json
      // For Android: This is automatically read from google-services.json
      // For iOS: You need to add it manually from GoogleService-Info.plist

      GoogleSignin.configure({
        // Web Client ID is required for getting ID token
        // This should match the one in your Firebase console
        webClientId: Platform.select({
          // Add your Web Client ID here from Firebase Console
          // This is different from your Android/iOS client IDs
          ios: '789634856731-1si3rnj1k1f7a08hm394fl518gj25fis.apps.googleusercontent.com',
          android:
            '789634856731-sptqmdk3n82fu51c08e0u8ciadjqd3k8.apps.googleusercontent.com',
        }),
        // iOS Client ID from GoogleService-Info.plist
        // This is needed if the plist file is not automatically detected
        iosClientId:
          '789634856731-1si3rnj1k1f7a08hm394fl518gj25fis.apps.googleusercontent.com',
        offlineAccess: false,
        forceCodeForRefreshToken: false,
      });

      this.isConfigured = true;
    } catch (error) {
      console.error('❌ Error configuring Google Sign-In:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google
   * Returns user data that can be sent to backend
   */
  async signIn(): Promise<GoogleUserData | null> {
    try {
      // Ensure configuration
      if (!this.isConfigured) {
        this.configure();
      }

      // Check if device supports Google Play Services (Android)
      await GoogleSignin.hasPlayServices();

      // Perform sign in
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo || !userInfo.data) {
        console.error('❌ No user info returned from Google Sign-In');
        return null;
      }

      const { user } = userInfo.data;

      if (!user) {
        console.error('❌ No user data in sign-in response');
        return null;
      }

      // Extract user data
      const userData: GoogleUserData = {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        photo: user.photo || undefined,
        givenName: user.givenName || undefined,
        familyName: user.familyName || undefined,
      };

      console.log('✅ Google Sign-In successful:', {
        email: userData.email,
        name: userData.name,
        id: userData.id, // Log the Google User ID
        hasPhoto: !!userData.photo,
      });

      console.log(
        '📋 Full user data from Google:',
        JSON.stringify(userData, null, 2),
      );

      return userData;
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);

      // Handle specific error codes
      if (error.code) {
        switch (error.code) {
          case 'SIGN_IN_CANCELLED':
            console.log('User cancelled the sign-in');
            break;
          case 'IN_PROGRESS':
            console.log('Sign-in is already in progress');
            break;
          case 'PLAY_SERVICES_NOT_AVAILABLE':
            console.error('Play Services not available or outdated');
            break;
          default:
            console.error('Unknown error code:', error.code);
        }
      }

      return null;
    }
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<boolean> {
    try {
      await GoogleSignin.signOut();
      console.log('✅ Google Sign-Out successful');
      return true;
    } catch (error) {
      console.error('❌ Google Sign-Out error:', error);
      return false;
    }
  }

  /**
   * Check if user is signed in
   */
  async checkSignedIn(): Promise<boolean> {
    try {
      const currentUser = await this.getCurrentUser();
      return currentUser !== null;
    } catch (error) {
      console.error('❌ Error checking Google Sign-In status:', error);
      return false;
    }
  }

  /**
   * Get current user info (if signed in)
   */
  async getCurrentUser(): Promise<GoogleUserData | null> {
    try {
      const userInfo = await GoogleSignin.getCurrentUser();

      if (!userInfo?.user) {
        return null;
      }

      const user = userInfo.user;

      return {
        id: user.id,
        email: user.email,
        name: user.name || user.email.split('@')[0],
        photo: user.photo || undefined,
        givenName: user.givenName || undefined,
        familyName: user.familyName || undefined,
      };
    } catch (error) {
      console.error('❌ Error getting current Google user:', error);
      return null;
    }
  }

  /**
   * Convert Google user data to backend format
   */
  convertToBackendUser(googleUser: GoogleUserData): BackendUserData {
    const backendData = {
      name: googleUser.name || googleUser.email.split('@')[0],
      email: googleUser.email,
      avatar:
        googleUser.photo && googleUser.photo.trim() !== ''
          ? googleUser.photo
          : undefined,
      authProvider: 'google',
      authUid: googleUser.id,
      isOAuthUser: true,
    };

    return backendData;
  }
}

// Export singleton instance
export const googleAuthService = new GoogleAuthService();
export default googleAuthService;
