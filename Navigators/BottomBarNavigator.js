import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

const Tab = createBottomTabNavigator();

import MainScreen from "../screens/MainScreen";
import Chart from "../screens/Chart";
import Settings from "../screens/Settings";

export default function BottomBarNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      // We hide the header here so we don't get two headers stacked on top of each other!
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Home"
        component={MainScreen}
        options={{ tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="Expense"
        component={Chart}
        options={{ tabBarLabel: "Chart" }}
      />
      <Tab.Screen
        name="Income"
        component={Settings}
        options={{ tabBarLabel: "Settings" }}
      />
    </Tab.Navigator>
  );
}
