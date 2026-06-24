import './polyfill';
import { useEffect } from 'react';
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';

import BottomBarNavigator from "./Navigators/BottomBarNavigator";
import AddExpensesIncomes from "./screens/AddExpensesIncomes";

import { db, seedDatabase } from './src/db';
import migrations from './drizzle/migrations';
import { AppProvider } from './src/AppContext';

const Stack = createNativeStackNavigator();

export default function App() {
  const { success, error } = useMigrations(db, migrations);

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
        <ActivityIndicator size="large" color="#2ECC71" />
        <Text>Loading Database...</Text>
      </View>
    );
  }

  return (
    <AppProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Root"
            component={BottomBarNavigator}
            options={{
              title: "MONEY MANAGER",
              headerTitleAlign: "center",
            }}
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
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
