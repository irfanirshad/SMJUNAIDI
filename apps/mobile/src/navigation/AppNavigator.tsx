import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import SingleProductScreen from '../screens/SingleProductScreen';
import ProductListScreen from '../screens/ProductListScreen';
import CartScreen from '../screens/CartScreen';
import PlaceOrderScreen from '../screens/PlaceOrderScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import SingleOrderScreen from '../screens/SingleOrderScreen';
import OrdersScreen from '../screens/OrdersScreen';
import WishlistScreen from '../screens/WishlistScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import OrderManagementScreen from '../screens/OrderManagementScreen';
import ProductManagementScreen from '../screens/ProductManagementScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import CategoryManagementScreen from '../screens/CategoryManagementScreen';
import BrandManagementScreen from '../screens/BrandManagementScreen';
import ReviewManagementScreen from '../screens/ReviewManagementScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import BecomeVendorScreen from '../screens/BecomeVendorScreen';
import VendorGuideScreen from '../screens/VendorGuideScreen';
import VendorDashboardScreen from '../screens/VendorDashboardScreen';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: 'Sign In',
        }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{
          title: 'Create Account',
        }}
      />
      <Stack.Screen
        name="SingleProduct"
        component={SingleProductScreen}
        options={{
          title: 'Product Details',
        }}
      />
      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{
          title: 'Products',
        }}
      />
      <Stack.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: 'Shopping Cart',
        }}
      />
      <Stack.Screen
        name="PlaceOrder"
        component={PlaceOrderScreen}
        options={{
          title: 'Place Order',
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          title: 'Checkout',
        }}
      />
      <Stack.Screen
        name="SingleOrder"
        component={SingleOrderScreen}
        options={{
          title: 'Order Details',
        }}
      />
      <Stack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: 'My Orders',
        }}
      />
      <Stack.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{
          title: 'My Wishlist',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
        }}
      />
      <Stack.Screen
        name="OrderManagement"
        component={OrderManagementScreen}
        options={{
          title: 'Order Management',
        }}
      />
      <Stack.Screen
        name="ProductManagement"
        component={ProductManagementScreen}
        options={{
          title: 'Product Management',
        }}
      />
      <Stack.Screen
        name="UserManagement"
        component={UserManagementScreen}
        options={{
          title: 'User Management',
        }}
      />
      <Stack.Screen
        name="CategoryManagement"
        component={CategoryManagementScreen}
        options={{
          title: 'Category Management',
        }}
      />
      <Stack.Screen
        name="BrandManagement"
        component={BrandManagementScreen}
        options={{
          title: 'Brand Management',
        }}
      />
      <Stack.Screen
        name="ReviewManagement"
        component={ReviewManagementScreen}
        options={{
          title: 'Review Management',
        }}
      />
      <Stack.Screen
        name="AnalyticsScreen"
        component={AnalyticsScreen}
        options={{
          title: 'Analytics',
        }}
      />
      <Stack.Screen
        name="BecomeVendor"
        component={BecomeVendorScreen}
        options={{
          title: 'Become a Vendor',
        }}
      />
      <Stack.Screen
        name="VendorGuide"
        component={VendorGuideScreen}
        options={{
          title: 'Vendor Guide',
        }}
      />
      <Stack.Screen
        name="VendorDashboard"
        component={VendorDashboardScreen}
        options={{
          title: 'Vendor Dashboard',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
