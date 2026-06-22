import { Text, View } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import Expenses from "../pages/Expenses";
import Income from "../pages/Incomes";

const Tab = createMaterialTopTabNavigator();

function MyTabs() {
  return (
    <Tab.Navigator initialRouteName="Expense">
      <Tab.Screen
        name="Expense"
        component={Expenses}
        options={{ tabBarLabel: "Expenses" }}
      />
      <Tab.Screen
        name="Income"
        component={Income}
        options={{ tabBarLabel: "Income" }}
      />
    </Tab.Navigator>
  );
}

export default function TopBarNavigator() {
  return <MyTabs />;
}
