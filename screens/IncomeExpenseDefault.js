import { View, Text } from "react-native";
import TopBarNavigator from "../Navigators/TopBarNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";

import Expenses from "../pages/Expenses";
import Income from "../pages/Incomes";
import BothExpensesIncomes from "../pages/BothExpensesIncomes";

export default function IncomeExpeneseDefault() {
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
    <SafeAreaProvider>
      <TopBarNavigator
        initialRoute="BothExpensesIncomes"
        screen={transactionalTabs}
      />
    </SafeAreaProvider>
  );
}
