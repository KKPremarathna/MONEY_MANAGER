import './polyfill';
import { useEffect, useState } from 'react';
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { AppState, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useUserProfile } from './src/db/queries';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import BottomBarNavigator from "./Navigators/BottomBarNavigator";
import AddExpensesIncomes from "./screens/AddExpensesIncomes";
import ProfileScreen from "./screens/Profile";
import CurrenciesScreen from "./screens/Currencies";
import ThemeSelectionScreen from "./screens/ThemeSelection";
import RemindersScreen from "./screens/Reminders";
import LoginScreen from "./screens/Login";
import FontSizeScreen from "./screens/FontSize";

import { db, seedDatabase } from './src/db';
import migrations from './drizzle/migrations';
import { AppProvider, useAppContext } from './src/AppContext';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { colors, theme } = useAppContext();
  const profile = useUserProfile();
  const [isLocked, setIsLocked] = useState(false);

  // Sync lock status with user preferences
  useEffect(() => {
    if (profile && profile.biometricsEnabled) {
      setIsLocked(true);
    } else {
      setIsLocked(false);
    }
  }, [profile]);

  // Authenticate helper
  const authenticateUser = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: "Unlock Money Manager",
          fallbackLabel: "Use passcode",
          disableDeviceFallback: false,
        });

        if (result.success) {
          setIsLocked(false);
        }
      } else {
        // Fallback for emulator or unconfigured devices
        setIsLocked(false);
      }
    } catch (error) {
      console.error("LocalAuthentication failed:", error);
      setIsLocked(false);
    }
  };

  // Trigger auth on profile load and lock
  useEffect(() => {
    if (profile && profile.biometricsEnabled && isLocked) {
      authenticateUser();
    }
  }, [profile, isLocked]);

  // Monitor AppState foreground/background shifts
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' && profile && profile.biometricsEnabled) {
        setIsLocked(true);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [profile]);

  if (profile && profile.biometricsEnabled && isLocked) {
    return (
      <View style={[styles.lockContainer, { backgroundColor: colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.lockContent}>
          <View style={[styles.lockIconCircle, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="lock-closed" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.lockTitle, { color: colors.text }]}>Money Manager Locked</Text>
          <Text style={[styles.lockSubtitle, { color: colors.textSecondary }]}>
            Authentication is required to view transaction details
          </Text>
          
          <TouchableOpacity 
            style={[styles.unlockBtn, { backgroundColor: colors.primary }]} 
            onPress={authenticateUser}
          >
            <Ionicons name="finger-print" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.unlockBtnText}>Unlock App</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const baseTheme = theme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
      primary: colors.primary,
    },
  };

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
          }}
        >
          <Stack.Screen
            name="Root"
            component={BottomBarNavigator}
            options={{ headerShown: false }}
          />



          <Stack.Screen
            name="AddTransaction"
            component={AddExpensesIncomes}
            options={{
              presentation: "formSheet",
              title: "Add New Transaction",
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Currencies"
            component={CurrenciesScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="ThemeSelection"
            component={ThemeSelectionScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Reminders"
            component={RemindersScreen}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false, presentation: 'modal' }}
          />

          <Stack.Screen
            name="FontSize"
            component={FontSizeScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  const [resetKey, setResetKey] = useState(0);
  const { success, error } = useMigrations(db, migrations);

  const forceReset = () => {
    setResetKey(prev => prev + 1);
  };

  useEffect(() => {
    if (success) {
      seedDatabase();
    }
  }, [success]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Migration error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider key={resetKey} forceReset={forceReset}>
        <AppContent />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockContent: {
    alignItems: 'center',
    padding: 30,
    width: '90%',
  },
  lockIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  lockSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 35,
  },
  unlockBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  unlockBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
});
