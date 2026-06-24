import { View, Text, StyleSheet } from 'react-native';
import { useBalance } from '../../src/db/queries';
import { useAppContext } from '../../src/AppContext';
import { Ionicons } from '@expo/vector-icons';

export default function BalanceContainer() {
  const { balance, income, expense } = useBalance();
  const { getCurrencySymbol, colors } = useAppContext();
  const currencySymbol = getCurrencySymbol();

  return (
    <View style={[styles.totalBalanceContainer, { backgroundColor: colors.card, shadowColor: '#000' }]}>
      <Text style={[styles.title, { color: colors.textSecondary }]}>Total Balance</Text>
      <Text style={[styles.amount, { color: colors.text }]}>{currencySymbol}{balance.toFixed(2)}</Text>
      
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <View style={styles.statHeader}>
            <View style={[styles.iconBubble, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="arrow-down-outline" size={14} color="#10B981" />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Income</Text>
          </View>
          <Text style={[styles.statAmount, { color: '#10B981' }]}>{currencySymbol}{income.toFixed(2)}</Text>
        </View>

        <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

        <View style={styles.statCol}>
          <View style={styles.statHeader}>
            <View style={[styles.iconBubble, { backgroundColor: '#EF444415' }]}>
              <Ionicons name="arrow-up-outline" size={14} color="#EF4444" />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expenses</Text>
          </View>
          <Text style={[styles.statAmount, { color: '#EF4444' }]}>{currencySymbol}{expense.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  totalBalanceContainer: {
    padding: 24,
    borderRadius: 24,
    alignItems: "center",
    width: "90%",
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  amount: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: 20,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 6,
  },
  iconBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  statAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  verticalDivider: {
    width: 1,
    height: 35,
  }
});