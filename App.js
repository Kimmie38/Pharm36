import './src/i18n';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen from './src/screens/SplashScreen';
import RoleSelectScreen from './src/screens/RoleSelectScreen';
import LoginScreen from './src/screens/pharmacist/LoginScreen';
import RegisterScreen from './src/screens/pharmacist/RegisterScreen';
import PharmacistTabs from './src/navigation/PharmacistTabs';
import UserStack from './src/navigation/UserStack';
import { AuthProvider } from './src/auth/AuthContext';
import { SyncProvider } from './src/offline/SyncContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

const Stack = createNativeStackNavigator();
const PharmacistAuthStack = createNativeStackNavigator();

function PharmacistAuthNavigator() {
  return (
    <PharmacistAuthStack.Navigator screenOptions={{ headerShown: false }}>
      <PharmacistAuthStack.Screen name="Login" component={LoginScreen} />
      <PharmacistAuthStack.Screen name="Register" component={RegisterScreen} />
    </PharmacistAuthStack.Navigator>
  );
}

function RootNavigator() {
  const { colors, isDark } = useTheme();
  const navTheme = {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      background: colors.bg,
      card: colors.bg,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.green,
    },
  };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }} initialRouteName="Splash">
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
          <Stack.Screen name="PharmacistAuth" component={PharmacistAuthNavigator} />
          <Stack.Screen name="PharmacistApp" component={PharmacistTabs} />
          <Stack.Screen name="UserApp" component={UserStack} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SyncProvider>
          <ThemeProvider initialScheme="dark">
            <RootNavigator />
          </ThemeProvider>
        </SyncProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
