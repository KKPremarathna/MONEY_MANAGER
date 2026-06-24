import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import TopBarNavigator from "../Navigators/TopBarNavigator";

import Expenses from "../pages/Expenses";
import Income from "../pages/Incomes";
import BothExpensesIncomes from "../pages/BothExpensesIncomes";

import SmallCard from "../components/ui/SmallCard";
import CustomButton from "../components/ui/customButton";
import MainTitle from "../components/MainTitle";
import { useAppContext } from "../src/AppContext";

export default function Chart() {
  const { filter, setFilter } = useAppContext();

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
        <TouchableOpacity style={[styles.filterButton, filter === 'daily' && styles.activeFilter]} onPress={() => setFilter('daily')}>
          <Text style={[styles.filterText, filter === 'daily' && styles.activeFilterText]}>Daily</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, filter === 'monthly' && styles.activeFilter]} onPress={() => setFilter('monthly')}>
          <Text style={[styles.filterText, filter === 'monthly' && styles.activeFilterText]}>Monthly</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, filter === 'yearly' && styles.activeFilter]} onPress={() => setFilter('yearly')}>
          <Text style={[styles.filterText, filter === 'yearly' && styles.activeFilterText]}>Yearly</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterButton, filter === 'all' && styles.activeFilter]} onPress={() => setFilter('all')}>
          <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>All Time</Text>
        </TouchableOpacity>
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "#eee",
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  activeFilter: {
    backgroundColor: '#333',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  activeFilterText: {
    color: '#fff',
  }
});
