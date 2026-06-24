import { Text, View } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useAppContext } from "../src/AppContext";

const Tab = createMaterialTopTabNavigator();

export default function TopBarNavigator({ initialRoute, screen }) {
  const { colors } = useAppContext();

  return (
    <Tab.Navigator 
      initialRouteName={initialRoute}
      screenOptions={{
        tabBarActiveTintColor: colors.activeTab,
        tabBarInactiveTintColor: colors.inactiveTab,
        tabBarStyle: { backgroundColor: colors.background },
        tabBarIndicatorStyle: { backgroundColor: colors.primary },
      }}
    >
      {screen.map((tabItem) => (
        <Tab.Screen
          key={tabItem.name} 
          name={tabItem.name}
          component={tabItem.component}
          options={{ tabBarLabel: tabItem.label }}
        />
      ))}
    </Tab.Navigator>
  );
}