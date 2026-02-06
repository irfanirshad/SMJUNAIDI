import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../../types';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ShopScreen from '../screens/ShopScreen';
import SearchScreen from '../screens/SearchScreen';
import { useAuth } from '../hooks/useAuth';
import colors from '../constants/colors';

import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Home01Icon,
  UserIcon,
  ShoppingBag01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons';

const Tab = createBottomTabNavigator<TabParamList>();

// Icon component for tabs using HugeIcons
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const iconColor = focused ? colors.babyshopSky : colors.secondaryText;
  const iconSize = 24;

  switch (name) {
    case 'Home':
      return (
        <HugeiconsIcon
          icon={Home01Icon}
          size={iconSize}
          color={iconColor}
          strokeWidth={focused ? 2.5 : 2}
        />
      );
    case 'Shop':
      return (
        <HugeiconsIcon
          icon={ShoppingBag01Icon}
          size={iconSize}
          color={iconColor}
          strokeWidth={focused ? 2.5 : 2}
        />
      );
    case 'Search':
      return (
        <HugeiconsIcon
          icon={Search01Icon}
          size={iconSize}
          color={iconColor}
          strokeWidth={focused ? 2.5 : 2}
        />
      );
    case 'Profile':
      return (
        <HugeiconsIcon
          icon={UserIcon}
          size={iconSize}
          color={iconColor}
          strokeWidth={focused ? 2.5 : 2}
        />
      );
    default:
      return (
        <HugeiconsIcon
          icon={Home01Icon}
          size={iconSize}
          color={iconColor}
          strokeWidth={2}
        />
      );
  }
};

const renderTabIcon =
  (routeName: keyof TabParamList) =>
  ({ focused }: { focused: boolean }) =>
    <TabIcon name={routeName} focused={focused} />;

const TabNavigator: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // Check if user is admin or employee (including those with employee_role like call_center)

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: renderTabIcon(route.name),
        tabBarActiveTintColor: colors.babyshopSky,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: {
          backgroundColor: colors.babyWhite,
          borderTopWidth: 1,
          borderTopColor: colors.lightBorder,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerStyle: {
          backgroundColor: colors.babyWhite,
          borderBottomWidth: 1,
          borderBottomColor: colors.lightBorder,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          color: colors.primaryText,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Shop"
        component={ShopScreen}
        options={{
          title: 'Shop',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Search',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: isAuthenticated ? 'Account' : 'Login',
          headerShown: false,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
