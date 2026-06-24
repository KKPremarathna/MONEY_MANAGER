import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAppContext } from "../src/AppContext";
import { Ionicons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

import MainScreen from "../screens/MainScreen";
import Chart from "../screens/Chart";
import Settings from "../screens/Settings";
import BudgetsScreen from "../screens/BudgetsScreen";

export default function BottomBarNavigator() {
  const { colors } = useAppContext();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({ 
        headerShown: false,
        tabBarActiveTintColor: colors.activeTab,
        tabBarInactiveTintColor: colors.inactiveTab,
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Expense") {
            iconName = focused ? "stats-chart" : "stats-chart-outline";
          } else if (route.name === "Budgets") {
            iconName = focused ? "pie-chart" : "pie-chart-outline";
          } else if (route.name === "Income") {
            iconName = focused ? "settings" : "settings-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
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
        name="Budgets"
        component={BudgetsScreen}
        options={{ tabBarLabel: "Budgets" }}
      />
      <Tab.Screen
        name="Income"
        component={Settings}
        options={{ tabBarLabel: "Settings" }}
      />
    </Tab.Navigator>
  );
}

