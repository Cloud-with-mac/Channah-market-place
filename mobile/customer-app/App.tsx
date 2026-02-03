import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Notifications from 'expo-notifications';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';

// Main App Screens
import HomeScreen from './src/screens/main/HomeScreen';
import ProductsScreen from './src/screens/main/ProductsScreen';
import ProductDetailScreen from './src/screens/main/ProductDetailScreen';
import CartScreen from './src/screens/main/CartScreen';
import CheckoutScreen from './src/screens/main/CheckoutScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';
import OrdersScreen from './src/screens/main/OrdersScreen';
import WishlistScreen from './src/screens/main/WishlistScreen';
import SearchScreen from './src/screens/main/SearchScreen';
import NotificationsScreen from './src/screens/main/NotificationsScreen';
import ChatScreen from './src/screens/main/ChatScreen';
import VendorProfileScreen from './src/screens/main/VendorProfileScreen';
import OrderDetailScreen from './src/screens/main/OrderDetailScreen';
import WriteReviewScreen from './src/screens/main/WriteReviewScreen';
import ReviewsScreen from './src/screens/main/ReviewsScreen';
import NotificationSettingsScreen from './src/screens/main/NotificationSettingsScreen';
import AddressesScreen from './src/screens/main/AddressesScreen';
import CategoryBrowseScreen from './src/screens/main/CategoryBrowseScreen';
import DealsScreen from './src/screens/main/DealsScreen';
import BestSellersScreen from './src/screens/main/BestSellersScreen';
import NewArrivalsScreen from './src/screens/main/NewArrivalsScreen';
import RFQListScreen from './src/screens/main/RFQListScreen';
import RFQCreateScreen from './src/screens/main/RFQCreateScreen';
import RFQDetailScreen from './src/screens/main/RFQDetailScreen';

// Info Screens
import AboutScreen from './src/screens/info/AboutScreen';
import TermsScreen from './src/screens/info/TermsScreen';
import PrivacyScreen from './src/screens/info/PrivacyScreen';
import HelpScreen from './src/screens/info/HelpScreen';
import ContactScreen from './src/screens/info/ContactScreen';

// Store
import { useAuthStore } from './src/store/authStore';
import { useCurrencyStore } from './src/store/currencyStore';
import { useCartStore } from './src/store/cartStore';

// Error Boundary
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Notifications
import {
  initPushNotifications,
  handleNotificationRoute,
  registerPushForCurrentUser,
} from './src/services/notifications';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function SplashScreen() {
  return (
    <View style={splashStyles.container}>
      <View style={splashStyles.logoContainer}>
        <Icon name="storefront" size={64} color="#fff" />
      </View>
      <Text style={splashStyles.title}>Channah</Text>
      <Text style={splashStyles.subtitle}>Your Trusted Marketplace</Text>
      <ActivityIndicator size="large" color="#fff" style={splashStyles.loader} />
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  loader: {
    marginTop: 40,
  },
});

function MainTabs() {
  const { user } = useAuthStore();
  const { itemCount, refreshCount } = useCartStore();

  React.useEffect(() => {
    if (user) refreshCount();
  }, [user]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Cart') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ef4444', fontSize: 11 },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={user ? ProfileScreen : LoginScreen}
        options={{ title: user ? 'Profile' : 'Sign In' }}
      />
    </Tab.Navigator>
  );
}

function NetworkErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={networkErrorStyles.container}>
      <Icon name="cloud-offline-outline" size={64} color="#9ca3af" />
      <Text style={networkErrorStyles.title}>Connection Error</Text>
      <Text style={networkErrorStyles.message}>
        Unable to connect to the server. Please check your internet connection and try again.
      </Text>
      <TouchableOpacity style={networkErrorStyles.retryButton} onPress={onRetry}>
        <Icon name="refresh" size={20} color="#fff" />
        <Text style={networkErrorStyles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const networkErrorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 20,
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 24,
    gap: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function App() {
  const { isLoading, initError, initialize, retry, user } = useAuthStore();
  const { detectCountry, fetchExchangeRates } = useCurrencyStore();
  const navigationRef = useRef<any>(null);
  const notificationCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    initialize();
    detectCountry();
    fetchExchangeRates();
  }, []);

  // Initialize push notifications and set up listeners
  useEffect(() => {
    const setupNotifications = async () => {
      const cleanup = await initPushNotifications(
        // Notification received in foreground
        (notification) => {
          console.log('Notification received:', notification);
        },
        // Notification tapped
        (response) => {
          console.log('Notification tapped:', response);
          if (navigationRef.current) {
            handleNotificationRoute(response.notification.request.content.data, navigationRef.current);
          }
        }
      );
      notificationCleanupRef.current = cleanup;
    };

    setupNotifications();

    // Check for initial notification (app opened from notification)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response && navigationRef.current) {
        handleNotificationRoute(response.notification.request.content.data, navigationRef.current);
      }
    });

    return () => {
      if (notificationCleanupRef.current) {
        notificationCleanupRef.current();
      }
    };
  }, []);

  // Register push token when user logs in
  useEffect(() => {
    if (user) {
      registerPushForCurrentUser().catch((err) =>
        console.warn('Failed to register push notifications:', err)
      );
    }
  }, [user]);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (initError) {
    return <NetworkErrorScreen onRetry={retry} />;
  }

  return (
    <ErrorBoundary>
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="auto" />
        <Stack.Navigator
          screenOptions={{
            headerShown: true,
            headerStyle: {
              backgroundColor: '#3b82f6',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen
            name="MainTabs"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Sign In' }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Create Account' }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: 'Forgot Password' }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{ title: 'Product Details' }}
          />
          <Stack.Screen
            name="Checkout"
            component={CheckoutScreen}
            options={{ title: 'Checkout' }}
          />
          <Stack.Screen
            name="Orders"
            component={OrdersScreen}
            options={{ title: 'My Orders' }}
          />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{ title: 'Order Details' }}
          />
          <Stack.Screen
            name="Wishlist"
            component={WishlistScreen}
            options={{ title: 'My Wishlist' }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ title: 'Search Products' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: 'Notifications' }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ title: 'Messages' }}
          />
          <Stack.Screen
            name="VendorProfile"
            component={VendorProfileScreen}
            options={{ title: 'Vendor Store' }}
          />
          <Stack.Screen
            name="WriteReview"
            component={WriteReviewScreen}
            options={{ title: 'Write a Review' }}
          />
          <Stack.Screen
            name="Reviews"
            component={ReviewsScreen}
            options={{ title: 'Customer Reviews' }}
          />
          <Stack.Screen
            name="NotificationSettings"
            component={NotificationSettingsScreen}
            options={{ title: 'Notification Settings' }}
          />
          <Stack.Screen
            name="Addresses"
            component={AddressesScreen}
            options={{ title: 'My Addresses' }}
          />
          <Stack.Screen
            name="CategoryBrowse"
            component={CategoryBrowseScreen}
            options={{ title: 'Categories' }}
          />
          <Stack.Screen
            name="Deals"
            component={DealsScreen}
            options={{ title: 'Hot Deals' }}
          />
          <Stack.Screen
            name="BestSellers"
            component={BestSellersScreen}
            options={{ title: 'Best Sellers' }}
          />
          <Stack.Screen
            name="NewArrivals"
            component={NewArrivalsScreen}
            options={{ title: 'New Arrivals' }}
          />
          <Stack.Screen
            name="RFQList"
            component={RFQListScreen}
            options={{ title: 'My Quotes' }}
          />
          <Stack.Screen
            name="RFQCreate"
            component={RFQCreateScreen}
            options={{ title: 'Request Quote' }}
          />
          <Stack.Screen
            name="RFQDetail"
            component={RFQDetailScreen}
            options={{ title: 'Quote Details' }}
          />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{ title: 'About Channah' }}
          />
          <Stack.Screen
            name="Terms"
            component={TermsScreen}
            options={{ title: 'Terms of Service' }}
          />
          <Stack.Screen
            name="Privacy"
            component={PrivacyScreen}
            options={{ title: 'Privacy Policy' }}
          />
          <Stack.Screen
            name="Help"
            component={HelpScreen}
            options={{ title: 'Help & FAQ' }}
          />
          <Stack.Screen
            name="Contact"
            component={ContactScreen}
            options={{ title: 'Contact Us' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
    </ErrorBoundary>
  );
}
