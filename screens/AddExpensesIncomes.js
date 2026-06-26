import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; // For the top right icon
import { SafeAreaProvider } from "react-native-safe-area-context";
import TopBarNavigator from "../Navigators/TopBarNavigator";
import { useAppContext } from "../src/AppContext";

import TransactionForm from "../components/TransactionForm";

const ExpenseFormTab = () => <TransactionForm type="expense" />;
const IncomeFormTab = () => <TransactionForm type="income" />;

export default function AddExpensesIncomes() {
  const navigation = useNavigation();
  const { colors } = useAppContext();

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

      <KeyboardAvoidingView 
        style={[styles.sheetContainer, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.headerText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Add</Text>
          <TouchableOpacity>
            <Ionicons name="time-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <SafeAreaProvider style={{ flex: 1 }}>
          <TopBarNavigator initialRoute="Expenses" screen={transactionalTabs} />
        </SafeAreaProvider>
      </KeyboardAvoidingView>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

