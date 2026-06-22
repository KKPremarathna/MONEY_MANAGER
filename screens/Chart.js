import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import TopBarNavigator from "../Navigators/TopBarNavigator";

import Expenses from "../pages/Expenses";
import Income from "../pages/Incomes";
import BothExpensesIncomes from "../pages/BothExpensesIncomes";

import SmallCard from "../components/ui/SmallCard";
import CustomButton from "../components/ui/customButton";
import MainTitle from "../components/MainTitle";

export default function Chart() {
  const transactionalTabs = [
    {
      name: "BothExpensesIncomes",
      component: BothExpensesIncomes,
      label: "All",
    },
    { name: "Income", component: Income, label: "Income" },
    { name: "Expenses", component: Expenses, label: "Expenses" },
  ];

  return (
    <View style={styles.container}>
        <MainTitle>HISTORY</MainTitle>
      <View style={styles.buttonContainer}>
        <CustomButton>Daily</CustomButton>
        <CustomButton>Monthly</CustomButton>
        <CustomButton>Yearly</CustomButton>
      </View>
      <SafeAreaProvider>
        <TopBarNavigator
          initialRoute="BothExpensesIncomes"
          screen={transactionalTabs}
        />
      </SafeAreaProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  buttonContainer:{
    flexDirection:"row",
    justifyContent:"space-around",
    padding:5,
    backgroundColor:"#ccc"
  }
});
