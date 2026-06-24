import { View, Text, StyleSheet } from 'react-native';
import { useBalance } from '../../src/db/queries';
import { useAppContext } from '../../src/AppContext';

export default function BalanceContainer() {
  const { balance } = useBalance();
  const { currency } = useAppContext();
  const currencySymbol = currency === 'USD' ? '$' : 'Rs.';

  return (
    <View style={styles.totalBalanceContainer}>
      <View>
        <Text style={styles.title}>Total Balance</Text>
      </View>
      <View>
        <Text style={styles.amount}>{currencySymbol}{balance.toFixed(2)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  totalBalanceContainer: {
    paddingVertical: 30,
    paddingHorizontal: 80,
    borderWidth: 4,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#444"
  },
  title: {
    fontSize: 16,
    color: "#555"
  },
  amount: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 5
  }
});