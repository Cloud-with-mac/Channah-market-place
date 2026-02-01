import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Auth Screens
import LoginScreen from './src/screens/auth/LoginScreen';

// Main App Screens
import DashboardScreen from './src/screens/main/DashboardScreen';
import ProductsScreen from './src/screens/main/ProductsScreen';
import OrdersScreen from './src/screens/main/OrdersScreen';
import MoreScreen from './src/screens/main/MoreScreen';
import AddProductScreen from './src/screens/main/AddProductScreen';
import EditProductScreen from './src/screens/main/EditProductScreen';
import SettingsScreen from './src/screens/main/SettingsScreen';
import PayoutsScreen from './src/screens/main/PayoutsScreen';
import ReviewsScreen from './src/screens/main/ReviewsScreen';
import VendorNotificationsScreen from './src/screens/main/NotificationsScreen';

// Store
import { useAuthStore } from './src/store/authStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'cube' : 'cube-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'More') {
            iconName = focused ? 'menu' : 'menu-outline';
          } else {
            iconName = 'help-circle-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#1e40af',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const { user, isLoading, initialize } = useAuthStore();

  React.useEffect(() => {
    initialize();
  }, []);

  if (isLoading) {
    return null;
  }

  return (
    <ErrorBoundary>
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1e40af',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          {!user ? (
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: 'Vendor Login' }}
            />
          ) : (
            <>
              <Stack.Screen
                name="MainTabs"
                component={MainTabs}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="AddProduct"
                component={AddProductScreen}
                options={{ title: 'Add Product' }}
              />
              <Stack.Screen
                name="EditProduct"
                component={EditProductScreen}
                options={{ title: 'Edit Product' }}
              />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: 'Store Settings' }}
              />
              <Stack.Screen
                name="Payouts"
                component={PayoutsScreen}
                options={{ title: 'Payouts' }}
              />
              <Stack.Screen
                name="Reviews"
                component={ReviewsScreen}
                options={{ title: 'Customer Reviews' }}
              />
              <Stack.Screen
                name="Notifications"
                component={VendorNotificationsScreen}
                options={{ title: 'Notifications' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
    </ErrorBoundary>
  );
}
