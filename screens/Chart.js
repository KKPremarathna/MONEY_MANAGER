import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Pressable } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
  const { filter, setFilter, referenceDate, setReferenceDate, colors, getCurrencySymbol, activeTab, selectedCategory, setSelectedCategory } = useAppContext();
  const allTransactions = useTransactions(null);

  const transactions = allTransactions.filter(t => {
    if (filter === 'all') return true;
    if (!t.date) return false;
    
    const tDate = new Date(t.date);
    const rDate = new Date(referenceDate);
    
    if (filter === 'daily') {
      return tDate.getFullYear() === rDate.getFullYear() &&
             tDate.getMonth() === rDate.getMonth() &&
             tDate.getDate() === rDate.getDate();
    } else if (filter === 'monthly') {
      return tDate.getFullYear() === rDate.getFullYear() &&
             tDate.getMonth() === rDate.getMonth();
    } else if (filter === 'yearly') {
      return tDate.getFullYear() === rDate.getFullYear();
    }
    return true;
  });

  // Expense breakdown
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

  // Income breakdown
  const incomes = transactions.filter(t => t.type === 'income');
  const totalIncomes = incomes.reduce((sum, t) => sum + t.amount, 0);

  const incomeCategoryMap = {};
  incomes.forEach(t => {
    const catName = t.categoryName || 'Other';
    if (!incomeCategoryMap[catName]) {
      incomeCategoryMap[catName] = {
        name: catName,
        amount: 0,
        color: t.categoryColor || '#999',
        icon: t.categoryIcon || 'list',
      };
    }
    incomeCategoryMap[catName].amount += t.amount;
  });

  const incomeCategoryBreakdown = Object.values(incomeCategoryMap).sort((a, b) => b.amount - a.amount);

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

  const renderSegmentedDonut = (breakdown, total, label) => {
    const radius = 34;
    const strokeWidth = 9;
    const circumference = 2 * Math.PI * radius;
    const gapSize = total > 0 && breakdown.length > 1 ? 3 : 0;

    let currentOffset = 0;

    // Check if the selected category is in this breakdown
    const selectedItem = selectedCategory ? breakdown.find(item => item.name === selectedCategory) : null;
    const isCategorySelected = !!selectedItem;

    const displayLabel = isCategorySelected ? selectedItem.name : label;
    const displayTotal = isCategorySelected ? selectedItem.amount : total;

    const textValue = `${currencySymbol}${displayTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    // Dynamically scale down font size when numbers grow
    const valFontSize = textValue.length > 9 ? 8.5 : textValue.length > 7 ? 10 : 12;

    const handleSvgPress = (event) => {
      const { locationX, locationY } = event.nativeEvent;
      const dx = locationX - 50;
      const dy = locationY - 50;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Tap on center resets filter
      if (distance < 20) {
        setSelectedCategory(null);
        return;
      }

      // Tap outside chart bounds ignored
      if (distance > 52) {
        return;
      }

      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 0) {
        angle += 360;
      }

      // Align with -90 degree rotation (top start)
      const adjustedAngle = (angle + 90) % 360;

      let currentAngle = 0;
      for (const item of breakdown) {
        const sweepAngle = (item.amount / total) * 360;
        if (adjustedAngle >= currentAngle && adjustedAngle < currentAngle + sweepAngle) {
          if (selectedCategory === item.name) {
            setSelectedCategory(null);
          } else {
            setSelectedCategory(item.name);
          }
          return;
        }
        currentAngle += sweepAngle;
      }
    };

    return (
      <Pressable style={styles.donutContainer} onPress={handleSvgPress}>
        <Svg width="90" height="90" viewBox="0 0 90 90" pointerEvents="none">
          {breakdown.map((item, idx) => {
            const pct = (item.amount / total) * 100;
            const segmentCircumference = (item.amount / total) * circumference;
            const strokeDasharray = `${Math.max(0, segmentCircumference - gapSize)} ${circumference}`;
            const strokeDashoffset = -currentOffset;
            currentOffset += segmentCircumference;

            const isDimmed = selectedCategory && selectedCategory !== item.name;

            return (
              <Circle
                key={idx}
                cx="45"
                cy="45"
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                opacity={isDimmed ? 0.35 : 1}
                rotation={-90}
                origin="45, 45"
              />
            );
          })}
        </Svg>
        
        <View style={styles.centerTextContainer} pointerEvents="none">
          <Text style={[styles.centerLabel, { color: colors.textSecondary }]} numberOfLines={1}>
            {displayLabel}
          </Text>
          <Text style={[styles.centerValue, { color: colors.text, fontSize: valFontSize }]} numberOfLines={1}>
            {textValue}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderCharts = () => {
    const showExp = (activeTab === 'BothExpensesIncomes' || activeTab === 'Expenses') && totalExpenses > 0;
    const showInc = (activeTab === 'BothExpensesIncomes' || activeTab === 'Income') && totalIncomes > 0;

    if (showExp && showInc) {
      return (
        <View style={styles.sideBySideRow}>
          <View style={styles.singleChartWrapper}>
            <Text style={[styles.chartSubTitle, { color: colors.text }]}>Expenses</Text>
            {renderSegmentedDonut(categoryBreakdown, totalExpenses, "EXPENSES")}
          </View>

          <View style={styles.singleChartWrapper}>
            <Text style={[styles.chartSubTitle, { color: colors.text }]}>Incomes</Text>
            {renderSegmentedDonut(incomeCategoryBreakdown, totalIncomes, "INCOMES")}
          </View>
        </View>
      );
    } else if (showExp) {
      return (
        <View style={styles.chartBodyColumn}>
          {renderSegmentedDonut(categoryBreakdown, totalExpenses, "EXPENSES")}
        </View>
      );
    } else if (showInc) {
      return (
        <View style={styles.chartBodyColumn}>
          {renderSegmentedDonut(incomeCategoryBreakdown, totalIncomes, "INCOMES")}
        </View>
      );
    }
    return null;
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
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.screenHeader}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>History</Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>Breakdown analysis</Text>
      </View>
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

      {((activeTab === 'BothExpensesIncomes' && (totalExpenses > 0 || totalIncomes > 0)) ||
        (activeTab === 'Expenses' && totalExpenses > 0) ||
        (activeTab === 'Income' && totalIncomes > 0)) && (
        <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Breakdown Analysis</Text>
          {renderCharts()}
        </View>
      )}

      <TopBarNavigator
        initialRoute="BothExpensesIncomes"
        screen={transactionalTabs}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenHeader: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 5,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  screenSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
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
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 10,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  chartBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  sideBySideRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 10,
  },
  singleChartWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  chartSubTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  donutContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  svgContainer: {
    // Rotation is now handled natively via SVG parameters to preserve gesture hit-box coordinates
  },
  centerTextContainer: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLabel: {
    fontSize: 7.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  centerValue: {
    fontWeight: '800',
    marginTop: 1,
  },
  chartBodyColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  chartLegendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 10,
  },
  horizontalLegendContainer: {
    marginTop: 10,
    width: '100%',
  },
  horizontalLegendContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
  },
  chartLegendGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendNameText: {
    fontSize: 12,
    fontWeight: '600',
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

