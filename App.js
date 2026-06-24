import './polyfill';
import { useEffect, useState } from 'react';
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import BottomBarNavigator from "./Navigators/BottomBarNavigator";
import AddExpensesIncomes from "./screens/AddExpensesIncomes";
import ProfileScreen from "./screens/Profile";
import CurrenciesScreen from "./screens/Currencies";
import ThemeSelectionScreen from "./screens/ThemeSelection";
import RemindersScreen from "./screens/Reminders";
import LoginScreen from "./screens/Login";

import { db, seedDatabase } from './src/db';
import migrations from './drizzle/migrations';
import { AppProvider, useAppContext } from './src/AppContext';

const Stack = createNativeStackNavigator();

function AppContent() {
  const { colors, theme } = useAppContext();

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
  }
});
