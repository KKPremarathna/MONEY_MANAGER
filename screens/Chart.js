import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Pressable, Modal } from "react-native";
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

  // Modal toggle state
  const [showAIModal, setShowAIModal] = useState(false);

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

  const generateAIInsights = () => {
    const insights = [];
    const symbol = getCurrencySymbol();

    // 1. Highest Expense Category
    if (totalExpenses > 0 && categoryBreakdown.length > 0) {
      const highest = categoryBreakdown[0];
      const pct = Math.round((highest.amount / totalExpenses) * 100);
      insights.push({
        icon: "pie-chart-outline",
        color: highest.color || colors.primary,
        text: `${highest.name} is your highest expense, taking up ${pct}% of your total spending.`
      });
    }

    // 2. Week-over-Week Trend
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    let thisWeekSpent = 0;
    let lastWeekSpent = 0;

    allTransactions.forEach(t => {
      if (t.type !== 'expense' || !t.date) return;
      const tDate = new Date(t.date);
      if (tDate >= oneWeekAgo && tDate <= now) {
        thisWeekSpent += t.amount;
      } else if (tDate >= twoWeeksAgo && tDate < oneWeekAgo) {
        lastWeekSpent += t.amount;
      }
    });

    if (thisWeekSpent > 0 && lastWeekSpent > 0) {
      if (thisWeekSpent > lastWeekSpent) {
        const diff = thisWeekSpent - lastWeekSpent;
        insights.push({
          icon: "trending-up-outline",
          color: "#EF4444",
          text: `You spent ${symbol}${diff.toLocaleString(undefined, { maximumFractionDigits: 0 })} more this week than last week. Consider pacing your purchases.`
        });
      } else {
        const diff = lastWeekSpent - thisWeekSpent;
        const pct = Math.round((diff / lastWeekSpent) * 100);
        insights.push({
          icon: "trending-down-outline",
          color: "#10B981",
          text: `You spent ${pct}% less this week compared to last week. Excellent financial self-discipline!`
        });
      }
    }

    // 3. Income vs Expense (Savings Rate)
    if (totalIncomes > 0) {
      if (totalIncomes > totalExpenses) {
        const savings = totalIncomes - totalExpenses;
        const rate = Math.round((savings / totalIncomes) * 100);
        insights.push({
          icon: "wallet-outline",
          color: "#10B981",
          text: `Your savings rate is ${rate}% this month. You've saved ${symbol}${savings.toLocaleString(undefined, { maximumFractionDigits: 0 })} so far!`
        });
      } else if (totalExpenses > totalIncomes) {
        const deficit = totalExpenses - totalIncomes;
        insights.push({
          icon: "alert-circle-outline",
          color: "#EF4444",
          text: `Your spending exceeds your income by ${symbol}${deficit.toLocaleString(undefined, { maximumFractionDigits: 0 })} this month. Try trimming non-essential costs.`
        });
      }
    }

    // 4. Default insight if none generated
    if (insights.length === 0) {
      insights.push({
        icon: "sparkles-outline",
        color: colors.primary,
        text: "Add more transaction logs to receive personalized AI spending insights."
      });
    }

    return insights;
  };

  const renderAIInsights = () => {
    const insights = generateAIInsights();
    
    return (
      <Modal
        visible={showAIModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAIModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.insightsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.insightsHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="sparkles" size={18} color={colors.primary} />
                <Text style={[styles.insightsTitle, { color: colors.text }]}>Local AI Insights</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAIModal(false)}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.insightsList}>
              {insights.map((insight, idx) => (
                <View key={idx} style={styles.insightItem}>
                  <View style={[styles.insightIconWrapper, { backgroundColor: insight.color + "15" }]}>
                    <Ionicons name={insight.icon} size={15} color={insight.color} />
                  </View>
                  <Text style={[styles.insightText, { color: colors.text }]} numberOfLines={2}>
                    {insight.text}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.closeBtn, { backgroundColor: colors.primary }]} 
              onPress={() => setShowAIModal(false)}
            >
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={[styles.screenTitle, { color: colors.text }]}>History</Text>
            <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>Breakdown analysis</Text>
          </View>
          <TouchableOpacity 
            style={[styles.aiButton, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]} 
            onPress={() => setShowAIModal(true)}
          >
            <Ionicons name="sparkles" size={14} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.aiButtonText, { color: colors.primary }]}>AI Insights</Text>
          </TouchableOpacity>
        </View>
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

      {renderAIInsights()}

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
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignSelf: 'center',
    marginVertical: 10,
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  insightsCard: {
    width: "90%",
    maxHeight: "70%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  insightsList: {
    gap: 14,
    paddingBottom: 10,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  insightIconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  closeBtn: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  closeBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
});
