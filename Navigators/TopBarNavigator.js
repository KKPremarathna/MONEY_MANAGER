import { Text, View } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

const Tab = createMaterialTopTabNavigator();


export default function TopBarNavigator({ initialRoute, screen }) {
  return (
    <Tab.Navigator initialRouteName={initialRoute}>

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