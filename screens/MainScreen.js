import { View, Text, StyleSheet, Pressable } from "react-native";
import BalanceContainer from "../components/ui/BalanceContainer";
import IncomeExpeneseDefault from "./IncomeExpenseDefault";

export default function MainScreen() {
  return (
    <View style={styles.container}>
      
      <View style={styles.topSection}>
        <BalanceContainer/>
        <Text style={styles.dateText}>Date : 2026 FEB 01</Text>
      </View>

      <View style={styles.tabsWrapper}>
        <IncomeExpeneseDefault/>
      </View>
      <Pressable 
        style={styles.fab} 
        onPress={() => console.log('Open Add Modal!')}
      >
        <Text>+</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: 'white',
  },
  topSection: {
    alignItems: "center", 
    paddingBottom: 20,
  },
  dateText: {
    marginTop: 10,
    fontWeight: 'bold',
  },
  tabsWrapper: {
    flex: 1, 
    borderWidth:4,
    margin:20,
    borderRadius:8,
  },
  // 3. The FAB styling
  fab: {
    position: 'absolute', // Detaches from normal layout
    bottom: 20, 
    right: 20, 
    backgroundColor: '#e55a54', // The red color from your design
    width: 60,
    height: 60,
    borderRadius: 30, // Makes it a perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Android shadow
    // iOS shadow
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
});