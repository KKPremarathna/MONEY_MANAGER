import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../../src/AppContext";

export default function SmallCard({ category, icon, color, money }) {
  const { currency } = useAppContext();
  const currencySymbol = currency === 'USD' ? '$' : 'Rs.';

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        <Ionicons name={icon || 'list'} size={24} color={color || 'black'} style={styles.icon} />
        <Text style={styles.categoryText}>{category}</Text>
      </View>
      <Text style={styles.moneyText}>{currencySymbol}{money}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginHorizontal: 10,
    margin: 10,
    padding: 8,
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: "white",
    elevation: 4,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
  },
  icon: {
    marginRight: 15,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  moneyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  }
});
