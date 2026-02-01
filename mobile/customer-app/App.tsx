import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

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
import AddressesScreen from './src/screens/main/AddressesScreen';
import CategoryBrowseScreen from './src/screens/main/CategoryBrowseScreen';
import DealsScreen from './src/screens/main/DealsScreen';
import BestSellersScreen from './src/screens/main/BestSellersScreen';
import NewArrivalsScreen from './src/screens/main/NewArrivalsScreen';

// Info Screens
import AboutScreen from './src/screens/info/AboutScreen';
import TermsScreen from './src/screens/info/TermsScreen';
import PrivacyScreen from './src/screens/info/PrivacyScreen';
import HelpScreen from './src/screens/info/HelpScreen';
import ContactScreen from './src/screens/info/ContactScreen';

// Store
import { useAuthStore } from './src/store/authStore';

// Error Boundary
import { ErrorBoundary } from './src/components/ErrorBoundary';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function SplashScreen() {
  return (
    <View style={splashStyles.container}>
      <View style={splashStyles.logoContainer}>
        <Icon name="storefront" size={64} color="#fff" />
      </View>
      <Text style={splashStyles.title}>Channah</Text>
      <Text style={splashStyles.subtitle}>Marketplace</Text>
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
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen
        name="Profile"
        component={user ? ProfileScreen : LoginScreen}
        options={{ title: user ? 'Profile' : 'Sign In' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { isLoading, initialize } = useAuthStore();

  React.useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <ErrorBoundary>
    <SafeAreaProvider>
      <NavigationContainer>
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
