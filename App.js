import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import BottomBarNavigator from "./Navigators/BottomBarNavigator";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
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

        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({});