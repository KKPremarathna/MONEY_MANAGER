import { FlatList, View, Text, StyleSheet } from "react-native";
import SmallCard from "./ui/SmallCard";
import { useTransactions } from "../src/db/queries";
import { useAppContext } from "../src/AppContext";

export default function TransactionList({ type }) {
  const { filter, referenceDate, currency, colors } = useAppContext();
  const transactions = useTransactions(type, filter, referenceDate);

  const getFormattedRange = () => {
    const d = new Date(referenceDate);
    if (filter === 'daily') {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (filter === 'monthly') {
      return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    } else if (filter === 'yearly') {
      return d.getFullYear().toString();
    }
    return '';
  };

  if (transactions.length === 0) {
    const range = getFormattedRange();
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {range ? `No transactions found for ${range}.` : 'No transactions found.'}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id.toString()}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 100 }}
      renderItem={({ item }) => (
        <SmallCard
          category={item.categoryName || 'Unknown'}
          icon={item.categoryIcon || 'list'}
          color={item.categoryColor || colors.text}
          money={item.amount}
          type={item.type}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
  }
});

