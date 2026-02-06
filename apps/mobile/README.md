# Baby Shop React Native App

A React Native mobile application for the Baby Shop e-commerce platform with authentication and product browsing capabilities.

## Features

- 📱 Tab-based navigation with Home and Profile tabs
- 🔐 User authentication (Login/Signup)
- 🏠 Home screen with product listing
- 👤 Profile screen (protected, requires authentication)
- 🛒 Product fetching from backend API
- 💾 Persistent authentication with AsyncStorage
- 🔄 Pull-to-refresh on product list

## Tech Stack

- React Native 0.80.1
- React Navigation 6
- TypeScript
- AsyncStorage for local data persistence
- Context API for state management

## API Endpoints

The app connects to the backend server at `http://localhost:8000/api` with the following endpoints:

- `GET /products` - Fetch all products
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/profile` - Get user profile (authenticated)
- `POST /auth/logout` - User logout (authenticated)

## Project Structure

```
src/
├── components/          # Reusable components
│   └── AuthGuard.tsx   # Authentication guard component
├── context/            # React Context providers
│   └── AuthContext.tsx # Authentication context
├── navigation/         # Navigation configuration
│   ├── AppNavigator.tsx    # Main stack navigator
│   └── TabNavigator.tsx    # Bottom tab navigator
├── screens/           # Screen components
│   ├── HomeScreen.tsx     # Home/Products screen
│   ├── LoginScreen.tsx    # Login screen
│   ├── ProfileScreen.tsx  # Profile screen
│   ├── SignupScreen.tsx   # Registration screen
│   └── index.ts          # Screen exports
└── services/          # API services
    └── api.ts        # API service class
```

## Setup Instructions

1. **Prerequisites**: Make sure you have React Native development environment set up
2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **iOS Setup** (macOS only):

   ```bash
   cd ios && pod install
   ```

4. **Start the backend server**: Make sure your backend server is running on `http://localhost:8000`

5. **Start Metro bundler**:

   ```bash
   npm start
   ```

6. **Run the app**:

   ```bash
   # For iOS
   npm run ios

   # For Android
   npm run android
   ```

## Usage

### Navigation Flow

1. **Home Tab**:

   - Shows list of products from the backend
   - Has a "Login" button if user is not authenticated
   - Has a "Profile" button if user is authenticated
   - Pull to refresh the product list

2. **Profile Tab**:

   - Shows login prompt if user is not authenticated
   - Shows user profile information if authenticated
   - Has logout functionality

3. **Authentication**:
   - Login screen with email/password validation
   - Signup screen with form validation
   - Persistent login using AsyncStorage
   - Automatic token validation on app start

### Features

- **Protected Routes**: Profile screen requires authentication
- **Form Validation**: Email format and password length validation
- **Error Handling**: User-friendly error messages
- **Loading States**: Loading indicators during API calls
- **Responsive Design**: Works on different screen sizes

## API Integration

The app integrates with the backend API for:

- **Authentication**: Login, register, logout, and profile management
- **Products**: Fetching and displaying product information
- **Token Management**: Automatic token storage and validation

## Authentication Flow

1. User opens app
2. App checks for stored authentication token
3. If token exists, validates it with the server
4. If valid, user is automatically logged in
5. If invalid or doesn't exist, user sees login prompt
6. After successful login/signup, token is stored locally
7. User can access protected features like profile

## Future Enhancements

- Add product detail screen
- Implement shopping cart functionality
- Add wishlist feature
- Implement push notifications
- Add product search and filters
- Implement order management
- Add payment integration
