import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; // For the top right icon
import { SafeAreaProvider } from "react-native-safe-area-context";
import TopBarNavigator from "../Navigators/TopBarNavigator";

import TransactionForm from "../components/TransactionForm";

const ExpenseFormTab = () => <TransactionForm type="expense" />;
const IncomeFormTab = () => <TransactionForm type="income" />;

export default function AddExpensesIncomes() {
  const navigation = useNavigation();

  const transactionalTabs = [
    { name: "Expenses", component: ExpenseFormTab, label: "Expenses" },
    { name: "Income", component: IncomeFormTab, label: "Income" },
  ];

  return (
    <View style={styles.overlay}>
      {/* The Dimmed Background */}
      <Pressable
        style={styles.dimmedBackground}
        onPress={() => navigation.goBack()}
      />

      <View style={styles.sheetContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.headerText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add</Text>
          <TouchableOpacity>
            <Ionicons name="time-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <SafeAreaProvider>
          <TopBarNavigator initialRoute="Expenses" screen={transactionalTabs} />
        </SafeAreaProvider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  dimmedBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheetContainer: {
    backgroundColor: "white",
    height: "85%",
    paddingTop: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 16,
    color: "#555",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
