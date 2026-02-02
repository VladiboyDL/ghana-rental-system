import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuthStore } from '../store/authStore';
import { colors } from '../utils/theme';
import { RootStackParamList } from '../types';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyOTPScreen from '../screens/auth/VerifyOTPScreen';

// Landlord Screens
import LandlordDashboard from '../screens/landlord/DashboardScreen';
import PropertiesScreen from '../screens/landlord/PropertiesScreen';
import PropertyDetailsScreen from '../screens/landlord/PropertyDetailsScreen';
import AddPropertyScreen from '../screens/landlord/AddPropertyScreen';
import CreateContractScreen from '../screens/landlord/CreateContractScreen';

// Tenant Screens
import TenantDashboard from '../screens/tenant/DashboardScreen';
import ConfirmContractScreen from '../screens/tenant/ConfirmContractScreen';

// Shared Screens
import ContractsScreen from '../screens/shared/ContractsScreen';
import ContractDetailsScreen from '../screens/shared/ContractDetailsScreen';
import PaymentsScreen from '../screens/shared/PaymentsScreen';
import PaymentDetailsScreen from '../screens/shared/PaymentDetailsScreen';
import MakePaymentScreen from '../screens/shared/MakePaymentScreen';
import ScanDocumentScreen from '../screens/shared/ScanDocumentScreen';
import SignContractScreen from '../screens/shared/SignContractScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';
import EditProfileScreen from '../screens/shared/EditProfileScreen';
import ChangePasswordScreen from '../screens/shared/ChangePasswordScreen';
import TaxCertificatesScreen from '../screens/shared/TaxCertificatesScreen';
import HelpSupportScreen from '../screens/shared/HelpSupportScreen';
import PrivacyPolicyScreen from '../screens/shared/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/shared/TermsOfServiceScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Landlord Tab Navigator
function LandlordTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Properties') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'Contracts') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Payments') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={LandlordDashboard} />
      <Tab.Screen name="Properties" component={PropertiesScreen} />
      <Tab.Screen name="Contracts" component={ContractsScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Tenant Tab Navigator
function TenantTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Contracts') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Payments') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={TenantDashboard} />
      <Tab.Screen name="Contracts" component={ContractsScreen} />
      <Tab.Screen name="Payments" component={PaymentsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.textOnPrimary,
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
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
              name="VerifyOTP"
              component={VerifyOTPScreen}
              options={{ title: 'Verify Phone' }}
            />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen
              name="MainTabs"
              component={user?.role === 'LANDLORD' ? LandlordTabs : TenantTabs}
              options={{ headerShown: false }}
            />

            {/* Property Screens (Landlord) */}
            <Stack.Screen
              name="PropertyDetails"
              component={PropertyDetailsScreen}
              options={{ title: 'Property Details' }}
            />
            <Stack.Screen
              name="AddProperty"
              component={AddPropertyScreen}
              options={{ title: 'Add Property' }}
            />

            {/* Contract Screens */}
            <Stack.Screen
              name="ContractDetails"
              component={ContractDetailsScreen}
              options={{ title: 'Contract Details' }}
            />
            <Stack.Screen
              name="CreateContract"
              component={CreateContractScreen}
              options={{ title: 'Create Contract' }}
            />
            <Stack.Screen
              name="ConfirmContract"
              component={ConfirmContractScreen}
              options={{ title: 'Confirm Contract' }}
            />
            <Stack.Screen
              name="ScanDocument"
              component={ScanDocumentScreen}
              options={{
                title: 'Scan ID Document',
                headerShown: false,
                presentation: 'fullScreenModal',
              }}
            />
            <Stack.Screen
              name="SignContract"
              component={SignContractScreen}
              options={{ title: 'Sign Contract' }}
            />

            {/* Payment Screens */}
            <Stack.Screen
              name="PaymentDetails"
              component={PaymentDetailsScreen}
              options={{ title: 'Payment Details' }}
            />
            <Stack.Screen
              name="MakePayment"
              component={MakePaymentScreen}
              options={{ title: 'Make Payment' }}
            />

            {/* Common Screens */}
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: 'Notifications' }}
            />

            {/* Profile Screens */}
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ChangePassword"
              component={ChangePasswordScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="TaxCertificates"
              component={TaxCertificatesScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="HelpSupport"
              component={HelpSupportScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="TermsOfService"
              component={TermsOfServiceScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
