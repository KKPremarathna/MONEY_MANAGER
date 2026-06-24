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
import { useTransactions } from "../src/db/queries";
import { Ionicons } from "@expo/vector-icons";

export default function Chart() {
  const { filter, setFilter, referenceDate, setReferenceDate, colors, getCurrencySymbol } = useAppContext();
  const transactions = useTransactions(null, filter, referenceDate);

  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  const categoryMap = {};
  expenses.forEach(t => {
    const catName = t.categoryName || 'Other';
    if (!categoryMap[catName]) {
      categoryMap[catName] = {
        name: catName,
        amount: 0,
        color: t.categoryColor || '#999',
        icon: t.categoryIcon || 'list',
      };
    }
    categoryMap[catName].amount += t.amount;
  });

  const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);
  const currencySymbol = getCurrencySymbol();

  const handlePrevDate = () => {
    const nextDate = new Date(referenceDate);
    if (filter === 'daily') {
      nextDate.setDate(nextDate.getDate() - 1);
    } else if (filter === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() - 1);
    } else if (filter === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() - 1);
    }
    setReferenceDate(nextDate);
  };

  const handleNextDate = () => {
    const nextDate = new Date(referenceDate);
    if (filter === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (filter === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (filter === 'yearly') {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    setReferenceDate(nextDate);
  };

  const getFormattedRange = () => {
    const d = new Date(referenceDate);
    if (filter === 'daily') {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } else if (filter === 'monthly') {
      return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    } else if (filter === 'yearly') {
      return d.getFullYear().toString();
    }
    return 'All Time History';
  };

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MainTitle>HISTORY</MainTitle>
      <View style={[styles.buttonContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            { backgroundColor: colors.card, borderColor: colors.border },
            filter === 'daily' && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]} 
          onPress={() => setFilter('daily')}
        >
          <Text style={[styles.filterText, { color: colors.text }, filter === 'daily' && { color: '#fff' }]}>Daily</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            { backgroundColor: colors.card, borderColor: colors.border },
            filter === 'monthly' && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]} 
          onPress={() => setFilter('monthly')}
        >
          <Text style={[styles.filterText, { color: colors.text }, filter === 'monthly' && { color: '#fff' }]}>Monthly</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            { backgroundColor: colors.card, borderColor: colors.border },
            filter === 'yearly' && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]} 
          onPress={() => setFilter('yearly')}
        >
          <Text style={[styles.filterText, { color: colors.text }, filter === 'yearly' && { color: '#fff' }]}>Yearly</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            { backgroundColor: colors.card, borderColor: colors.border },
            filter === 'all' && { backgroundColor: colors.primary, borderColor: colors.primary }
          ]} 
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, { color: colors.text }, filter === 'all' && { color: '#fff' }]}>All Time</Text>
        </TouchableOpacity>
      </View>

      {filter !== 'all' && (
        <View style={styles.paginationRow}>
          <TouchableOpacity style={[styles.navBtn, { borderColor: colors.border }]} onPress={handlePrevDate}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.rangeLabel, { color: colors.text }]}>{getFormattedRange()}</Text>
          <TouchableOpacity style={[styles.navBtn, { borderColor: colors.border }]} onPress={handleNextDate}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {totalExpenses > 0 && (
        <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Expense Breakdown</Text>
          
          <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
            {categoryBreakdown.map((item, index) => {
              const percentage = (item.amount / totalExpenses) * 100;
              return (
                <View 
                  key={index}
                  style={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: item.color,
                  }}
                />
              );
            })}
          </View>

          <View style={styles.legendContainer}>
            {categoryBreakdown.slice(0, 4).map((item, index) => {
              const percentage = ((item.amount / totalExpenses) * 100).toFixed(0);
              return (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.iconWrapper, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon} size={14} color={item.color} />
                  </View>
                  <View style={styles.legendTextContainer}>
                    <Text style={[styles.legendName, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.legendPercentage, { color: colors.textSecondary }]}>
                      {percentage}% • {currencySymbol}{item.amount.toFixed(0)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

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
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  chartContainer: {
    margin: 15,
    padding: 15,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 15,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendName: {
    fontSize: 13,
    fontWeight: '600',
  },
  legendPercentage: {
    fontSize: 11,
    marginTop: 2,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rangeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});

