import { View, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Text from "../components/Text";
import BalanceContainer from "../components/ui/BalanceContainer";
import IncomeExpeneseDefault from "./IncomeExpenseDefault";
import { useAppContext } from "../src/AppContext";
import { useNavigation } from "@react-navigation/native";
import { useUserProfile } from "../src/db/queries";
import { Ionicons } from "@expo/vector-icons";

export default function MainScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppContext();
  const navigation = useNavigation();
  const profile = useUserProfile();

  const formattedDate = new Date().toLocaleDateString('en-GB', { 
    weekday: 'short', 
    day: 'numeric', 
    month: 'short' 
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greetingText, { color: colors.textSecondary }]}>Welcome back,</Text>
          <Text style={[styles.profileName, { color: colors.text }]}>{profile?.name || 'Guest User'}</Text>
        </View>
        <Text style={[styles.dateText, { color: colors.textSecondary, backgroundColor: colors.surface }]}>
          {formattedDate}
        </Text>
      </View>

      <View style={styles.topSection}>
        <BalanceContainer />
      </View>

      <View style={[styles.tabsWrapper, { backgroundColor: colors.background }]}>
        <IncomeExpeneseDefault />
      </View>
      <Pressable
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate("AddTransaction")}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: "500",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "600",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  topSection: {
    alignItems: "center",
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabsWrapper: {
    flex: 1,
    marginTop: 10,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
});

