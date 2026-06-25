import { View, StyleSheet } from "react-native";
import Text from "../Text";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../../src/AppContext";

export default function SmallCard({ category, icon, color, money, type, hasReceipt }) {
  const { getCurrencySymbol, colors } = useAppContext();
  const currencySymbol = getCurrencySymbol();

  const isIncome = type === 'income';
  const amountColor = isIncome ? '#10B981' : '#EF4444';
  const amountPrefix = isIncome ? '+' : '-';

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border, overflow: 'hidden' }]}>
      <View style={styles.leftGroup}>
        <View style={[styles.iconContainer, { backgroundColor: (color || colors.primary) + '15' }]}>
          <Ionicons name={icon || 'list'} size={20} color={color || colors.primary} />
          {hasReceipt && (
            <View style={styles.receiptBadge}>
              <Ionicons name="receipt-outline" size={8} color="white" />
            </View>
          )}
        </View>
        <Text style={[styles.categoryText, { color: colors.text }]} numberOfLines={1}>
          {category}
        </Text>
      </View>
      <Text style={[styles.moneyText, { color: amountColor }]}>
        {amountPrefix}{currencySymbol}{parseFloat(money || 0).toFixed(2)}
      </Text>
      <View style={[styles.leftColorIndicator, { backgroundColor: color || colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginLeft: 4, // Clean alignment inset
  },
  categoryText: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  moneyText: {
    fontSize: 15,
    fontWeight: "700",
  },
  leftColorIndicator: {
    position: "absolute",
    top: 12,
    left: 8,
    bottom: 12,
    width: 4,
    borderRadius: 2,
  },
  receiptBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'white',
  },
});

