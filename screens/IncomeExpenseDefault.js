import { View, Text } from "react-native";
import TopBarNavigator from "../Navigators/TopBarNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function IncomeExpeneseDefault() {
  return (
    <SafeAreaProvider>
      <TopBarNavigator />
    </SafeAreaProvider>
  );
}
