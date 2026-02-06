# Babymart Mobile App - Complete Configuration Guide

This comprehensive guide covers all configuration aspects of the Babymart mobile application.

---

## Table of Contents

1. [Environment Configuration](#environment-configuration)
2. [App Configuration Structure](#app-configuration-structure)
3. [Platform-Specific Configuration](#platform-specific-configuration)
4. [Build Configuration](#build-configuration)
5. [API & Services Configuration](#api--services-configuration)
6. [Feature Configuration](#feature-configuration)
7. [Assets & Branding](#assets--branding)
8. [Common Configuration Tasks](#common-configuration-tasks)
9. [Troubleshooting](#troubleshooting)

---

## Environment Configuration

### 📁 Location: `apps/mobile/.env`

This is the main configuration file for environment variables.

### Setup

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
nano .env
```

### Configuration Variables

#### API Configuration
```env
# Development (default for local testing)
API_ENDPOINT=http://localhost:8000/api
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Production (uncomment for production builds)
# API_ENDPOINT=https://api.babymart.com/api
# NEXT_PUBLIC_API_URL=https://api.babymart.com/api
```

**Platform-specific API URLs:**
- **Android Emulator**: Use `http://10.0.2.2:8000/api` (automatically handled in code)
- **iOS Simulator**: Use `http://localhost:8000/api`
- **Real Devices**: Use your computer's IP address or production URL

#### Payment Configuration
```env
# Stripe Test Keys (Development)
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY_HERE

# Stripe Live Keys (Production)
# STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY_HERE
```

#### Firebase Configuration
```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
```

#### Business Configuration
```env
# Tax rate (0 = no tax, 0.1 = 10% tax)
TAX_AMOUNT=0

# Free delivery threshold (in currency units)
FREE_DELIVERY_THRESHOLD=999

# Standard shipping fee
SHIPPING_FEE=50
```

#### Security & Features
```env
# Console protection (disable console logs in production)
SHOW_CONSOLE_WARNING=true

# Available countries for shipping
AVAILABLE_COUNTRIES=["Bangladesh","United States","Canada","United Kingdom","Australia","Germany","France","India","Japan","China"]
```

#### Environment Settings
```env
NODE_ENV=development
APP_ENV=development
```

---

## App Configuration Structure

### 📁 Location: `apps/mobile/src/config/environment.ts`

This is the centralized configuration module that exports all constants.

### Key Configuration Exports

```typescript
// API Configuration
export const getApiBaseUrl = (): string => { ... }
export const API_CONFIG = { baseUrl, timeout, headers }

// Business Logic
export const TAX_AMOUNT = 0
export const FREE_DELIVERY_THRESHOLD = 999
export const SHIPPING_FEE = 50

// Countries
export const AVAILABLE_COUNTRIES = [...]

// Payment
export const STRIPE_PUBLISHABLE_KEY = '...'

// Firebase
export const FIREBASE_CONFIG = { ... }

// Helper Functions
export const calculateShippingCost = (cartTotal: number): number => { ... }
export const calculateTax = (subtotal: number): number => { ... }
export const calculateOrderTotal = (subtotal: number): number => { ... }
```

### Usage in Components

```typescript
import { 
  TAX_AMOUNT, 
  FREE_DELIVERY_THRESHOLD, 
  calculateShippingCost,
  AVAILABLE_COUNTRIES 
} from '../config/environment';

// Use in your code
const shipping = calculateShippingCost(subtotal);
const countries = AVAILABLE_COUNTRIES;
```

---

## Platform-Specific Configuration

### iOS Configuration

#### 📁 Location: `apps/mobile/ios/userapp/Info.plist`

```xml
<!-- App Display Name -->
<key>CFBundleDisplayName</key>
<string>Babymart</string>

<!-- Bundle Name -->
<key>CFBundleName</key>
<string>Babymart</string>

<!-- Bundle Identifier -->
<key>CFBundleIdentifier</key>
<string>com.babymart.app</string>

<!-- Version -->
<key>CFBundleShortVersionString</key>
<string>1.0</string>

<!-- Build Number -->
<key>CFBundleVersion</key>
<string>1</string>

<!-- Permissions -->
<key>NSCameraUsageDescription</key>
<string>Upload product images</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>Select photos for products</string>

<key>NSMicrophoneUsageDescription</key>
<string>Voice search feature</string>
```

#### Launch Screen
📁 `apps/mobile/ios/userapp/LaunchScreen.storyboard`

- Background color: `#29beb3` (Babymart turquoise)
- Logo: `SmallLogo` imageset
- Text color: White (`#FFFFFF`)

#### App Icons
📁 `apps/mobile/ios/userapp/Images.xcassets/AppIcon.appiconset/`

Required sizes:
- icon-20@2x.png (40x40)
- icon-20@3x.png (60x60)
- icon-29@2x.png (58x58)
- icon-29@3x.png (87x87)
- icon-40@2x.png (80x80)
- icon-40@3x.png (120x120)
- icon-60@2x.png (120x120)
- icon-60@3x.png (180x180)
- icon-1024.png (1024x1024)

### Android Configuration

#### 📁 Location: `apps/mobile/android/app/src/main/AndroidManifest.xml`

```xml
<!-- App Label -->
<application
    android:label="Babymart"
    android:theme="@style/SplashTheme">
    
    <activity
        android:name=".MainActivity"
        android:label="Babymart">
    </activity>
</application>

<!-- Permissions -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

#### String Resources
📁 `apps/mobile/android/app/src/main/res/values/strings.xml`

```xml
<resources>
    <string name="app_name">Babymart</string>
</resources>
```

#### Colors
📁 `apps/mobile/android/app/src/main/res/values/colors.xml`

```xml
<resources>
    <color name="primary">#29beb3</color>
    <color name="splash_background">#29beb3</color>
    <color name="white">#FFFFFF</color>
</resources>
```

#### Splash Screen
📁 `apps/mobile/android/app/src/main/res/drawable/splash_screen.xml`

```xml
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_background" />
    <item>
        <bitmap
            android:src="@drawable/small_logo"
            android:gravity="center" />
    </item>
</layer-list>
```

#### Build Configuration
📁 `apps/mobile/android/app/build.gradle`

```gradle
android {
    namespace "com.babymart.app"
    compileSdk 35
    
    defaultConfig {
        applicationId "com.babymart.app"
        minSdkVersion 24
        targetSdkVersion 35
        versionCode 1
        versionName "1.0"
    }
    
    signingConfigs {
        release {
            storeFile file('your-keystore.keystore')
            storePassword 'your-store-password'
            keyAlias 'your-key-alias'
            keyPassword 'your-key-password'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt')
        }
    }
}
```

---

## Build Configuration

### Gradle Properties
📁 `apps/mobile/android/gradle.properties`

```properties
# Memory allocation
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m

# AndroidX
android.useAndroidX=true

# Architecture support
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64

# New Architecture (TurboModules/Fabric)
newArchEnabled=true

# Hermes JS Engine
hermesEnabled=true

# Kotlin
android.enableJetifier=true
kotlin.code.style=official
kotlin.jvmTarget=17
kotlin.incremental=true
```

### Package Configuration
📁 `apps/mobile/package.json`

```json
{
  "name": "@babyshop/mobile",
  "version": "1.0.0",
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint ."
  }
}
```

### React Native Configuration
📁 `apps/mobile/app.json`

```json
{
  "name": "Babymart",
  "displayName": "Babymart",
  "expo": {
    "name": "Babymart",
    "slug": "babymart",
    "splash": {
      "backgroundColor": "#29beb3",
      "resizeMode": "contain"
    }
  }
}
```

---

## API & Services Configuration

### API Service
📁 `apps/mobile/src/services/api.ts`

```typescript
import { getApiBaseUrl } from '../config/environment';

const API_BASE_URL = getApiBaseUrl();

// Automatically handles platform differences:
// Android Emulator: http://10.0.2.2:8000/api
// iOS Simulator: http://localhost:8000/api
// Production: https://api.babymart.reactbd.com/api
```

### State Management
📁 `apps/mobile/src/store/index.ts`

Uses Zustand for state management. No additional configuration needed.

---

## Feature Configuration

### Cart Configuration

**Tax Calculation:**
```typescript
// In environment.ts
export const TAX_AMOUNT = 0; // No tax

// Usage in components
const tax = TAX_AMOUNT * subtotal;
```

**Shipping Calculation:**
```typescript
// Free shipping above threshold
const shipping = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : SHIPPING_FEE;
```

**Available Countries:**
```typescript
// Address form dropdown options
import { AVAILABLE_COUNTRIES } from '../config/environment';

// Display in picker/modal
AVAILABLE_COUNTRIES.map(country => (
  <CountryOption key={country} value={country} />
))
```

### Payment Configuration

**Stripe Setup:**
```typescript
import { STRIPE_PUBLISHABLE_KEY } from '../config/environment';

// Initialize Stripe
const { initPaymentSheet } = useStripe();
```

### Console Protection

**Production Logging:**
```typescript
// In environment.ts
if (SHOW_CONSOLE_WARNING && !isDevelopment) {
  console.log = noop;
  console.warn = noop;
  console.error = noop;
}
```

---

## Assets & Branding

### Logo Files
📁 `apps/mobile/assets/`

- **smallLogo.png**: 62x66 pixels (Primary logo)
- **logo.png**: Full-size logo

### Brand Colors
📁 `apps/mobile/src/constants/colors.ts`

```typescript
export default {
  // Primary
  babyshopSky: '#29beb3',      // Turquoise
  primary: '#29beb3',
  
  // Neutral
  white: '#FFFFFF',
  black: '#000000',
  text: '#333333',
  mutedText: '#666666',
  lightGray: '#F5F5F5',
  
  // Accents
  pinkAccent: '#ff69b4',
  yellowAccent: '#ffd700',
  
  // Status
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  
  // UI
  background: '#FAFAFA',
  lightBorder: '#E0E0E0',
};
```

### Icon Configuration

**App uses Hugeicons:**
```typescript
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ShoppingBag01Icon, UserIcon } from '@hugeicons/core-free-icons';

<HugeiconsIcon
  icon={ShoppingBag01Icon}
  size={24}
  color={colors.babyshopSky}
  strokeWidth={2}
/>
```

---

## Common Configuration Tasks

### 1. Change App Name

**iOS:**
1. Edit `ios/userapp/Info.plist`:
   ```xml
   <key>CFBundleDisplayName</key>
   <string>YourAppName</string>
   ```

**Android:**
1. Edit `android/app/src/main/res/values/strings.xml`:
   ```xml
   <string name="app_name">YourAppName</string>
   ```

2. Edit `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <application android:label="YourAppName">
   ```

### 2. Update API Endpoint

**Development:**
```env
# .env
API_ENDPOINT=http://your-dev-server:8000/api
```

**Production:**
```env
# .env
API_ENDPOINT=https://api.yourdomain.com/api
```

### 3. Change Tax Rate

```env
# .env
TAX_AMOUNT=0.1  # 10% tax
```

### 4. Update Free Delivery Threshold

```env
# .env
FREE_DELIVERY_THRESHOLD=1500  # Free delivery above $1500
```

### 5. Add/Remove Countries

```env
# .env
AVAILABLE_COUNTRIES=["Country1","Country2","Country3"]
```

### 6. Update Brand Colors

Edit `apps/mobile/src/constants/colors.ts`:
```typescript
babyshopSky: '#YOUR_HEX_COLOR'
```

### 7. Change App Icon

**Generate Icons:**
```bash
# From your logo file (e.g., mylogo.png)
sips -z 40 40 mylogo.png --out icon-20@2x.png
sips -z 60 60 mylogo.png --out icon-20@3x.png
# ... (repeat for all sizes)
```

**Replace files in:**
- iOS: `ios/userapp/Images.xcassets/AppIcon.appiconset/`
- Android: `android/app/src/main/res/mipmap-*/`

### 8. Update Splash Screen

**iOS:**
Edit `ios/userapp/LaunchScreen.storyboard`

**Android:**
1. Edit colors: `android/app/src/main/res/values/colors.xml`
2. Edit drawable: `android/app/src/main/res/drawable/splash_screen.xml`

### 9. Configure Build Signing

**Android Release:**
1. Generate keystore:
   ```bash
   keytool -genkeypair -v -keystore babymart-release.keystore -alias babymart -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Update `android/app/build.gradle`:
   ```gradle
   signingConfigs {
       release {
           storeFile file('babymart-release.keystore')
           storePassword 'your-password'
           keyAlias 'babymart'
           keyPassword 'your-password'
       }
   }
   ```

### 10. Enable/Disable Hermes

```properties
# android/gradle.properties
hermesEnabled=true  # or false
```

---

## Troubleshooting

### Build Issues

**1. Hermes Compilation Error**
```bash
# Disable Hermes temporarily
# Edit android/gradle.properties
hermesEnabled=false
```

**2. Metro Bundler Cache Issues**
```bash
npm start -- --reset-cache
```

**3. Android Build Fails**
```bash
cd android
./gradlew clean
cd ..
npm run android
```

**4. iOS Build Fails**
```bash
cd ios
pod install
cd ..
npm run ios
```

### Runtime Issues

**1. API Connection Fails**
- Check API_ENDPOINT in `.env`
- For Android emulator: Use `http://10.0.2.2:8000/api`
- For iOS simulator: Use `http://localhost:8000/api`
- Ensure backend server is running

**2. Picker/Dropdown Not Working**
- Custom modal implementation (not using @react-native-picker/picker)
- Check that AVAILABLE_COUNTRIES is loaded

**3. Images Not Loading**
- Verify image paths in assets folder
- Check that images are included in bundle
- For Android: Rebuild after adding images

**4. Environment Variables Not Loading**
- Restart Metro bundler
- Clear cache: `npm start -- --reset-cache`
- Verify `.env` file exists and is not in `.gitignore`

### Common Errors

**Error: "Module not found"**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install

# iOS only
cd ios && pod install && cd ..
```

**Error: "Unable to resolve module"**
```bash
# Clear watchman
watchman watch-del-all

# Clear Metro cache
npm start -- --reset-cache
```

**Error: "Task :app:installDebug FAILED"**
```bash
# Check if device/emulator is connected
adb devices

# Check if port is in use
lsof -i :8081
```

---

## Best Practices

### 1. Environment Variables
- ✅ Use `.env` for all environment-specific values
- ✅ Never commit `.env` file (use `.env.example` instead)
- ✅ Document all variables in `.env.example`

### 2. Configuration Management
- ✅ Use centralized config (`environment.ts`)
- ✅ Import from config, never hardcode values
- ✅ Use helper functions for calculations

### 3. Platform Differences
- ✅ Handle iOS/Android differences in config
- ✅ Test on both platforms before release
- ✅ Use Platform.OS when needed

### 4. Version Control
- ✅ Keep `.env.example` updated
- ✅ Document configuration changes
- ✅ Version sensitive files carefully

### 5. Security
- ✅ Use environment variables for API keys
- ✅ Enable console protection in production
- ✅ Secure keystore and certificates

---

## Configuration Checklist

Before deploying to production:

- [ ] Update `.env` with production values
- [ ] Set `hermesEnabled=true` for better performance
- [ ] Enable console protection (`SHOW_CONSOLE_WARNING=true`)
- [ ] Update API endpoint to production URL
- [ ] Configure Stripe live keys
- [ ] Update Firebase production config
- [ ] Generate signed release build
- [ ] Test on physical devices
- [ ] Verify all features work in production mode
- [ ] Check app size and performance
- [ ] Update version numbers in Info.plist and build.gradle

---

## Additional Resources

### Official Documentation
- [React Native Configuration](https://reactnative.dev/docs/environment-setup)
- [Android Build Configuration](https://developer.android.com/studio/build)
- [iOS Build Configuration](https://developer.apple.com/documentation/xcode/build-settings)

### Project Documentation
- [Environment Config Guide](./ENVIRONMENT_CONFIG.md)
- [Configuration Summary](./CONFIG_SUMMARY.md)
- [Branding Setup](./BRANDING_SETUP.md)

### Support
For configuration issues or questions, refer to:
1. This documentation
2. React Native documentation
3. Platform-specific guides (iOS/Android)

---

**Last Updated:** December 29, 2025  
**Version:** 1.0.0  
**Maintainer:** Babymart Development Team
