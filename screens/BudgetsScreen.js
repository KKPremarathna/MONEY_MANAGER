import { useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  Alert,
  ScrollView
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../src/AppContext";
import { useCategories, updateCategoryBudget, useTransactions } from "../src/db/queries";

export default function BudgetsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, getCurrencySymbol } = useAppContext();
  const currencySymbol = getCurrencySymbol();

  const expenseCategories = useCategories("expense");
  const allTransactions = useTransactions(null);

  // States
  const [activeSegment, setActiveSegment] = useState("all"); // 'all', 'monthly', 'daily'
  const [editingCategory, setEditingCategory] = useState(null);
  const [budgetValue, setBudgetValue] = useState("");
  const [budgetType, setBudgetType] = useState("monthly"); // 'monthly', 'daily'

  // Calculate monthly & daily spending for all expense categories
  const rDate = new Date();
  const startOfMonth = new Date(rDate.getFullYear(), rDate.getMonth(), 1);
  const endOfMonth = new Date(rDate.getFullYear(), rDate.getMonth() + 1, 0, 23, 59, 59, 999);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const monthlyCategorySpending = {};
  const dailyCategorySpending = {};

  allTransactions.forEach(t => {
    if (t.type !== 'expense' || !t.date) return;
    const tDate = new Date(t.date);
    
    // Monthly
    if (tDate >= startOfMonth && tDate <= endOfMonth) {
      const catName = t.categoryName || 'Other';
      monthlyCategorySpending[catName] = (monthlyCategorySpending[catName] || 0) + t.amount;
    }
    
    // Daily
    if (tDate >= startOfDay && tDate <= endOfDay) {
      const catName = t.categoryName || 'Other';
      dailyCategorySpending[catName] = (dailyCategorySpending[catName] || 0) + t.amount;
    }
  });

  const handleEditBudget = (category) => {
    setEditingCategory(category);
    setBudgetValue(category.budget ? category.budget.toString() : "");
    setBudgetType(category.budgetType || "monthly");
  };

  const handleSaveBudget = async () => {
    if (!editingCategory) return;
    
    const parsed = parseFloat(budgetValue);
    if (budgetValue.trim() !== "" && (isNaN(parsed) || parsed < 0)) {
      Alert.alert("Invalid Amount", "Please enter a valid positive number.");
      return;
    }

    const valueToSave = budgetValue.trim() === "" ? null : parsed;

    try {
      await updateCategoryBudget(editingCategory.id, valueToSave, budgetType);
      setEditingCategory(null);
    } catch (error) {
      Alert.alert("Error", "Failed to update budget: " + error.message);
    }
  };

  const handleClearBudget = async () => {
    if (!editingCategory) return;
    try {
      await updateCategoryBudget(editingCategory.id, null, "monthly");
      setEditingCategory(null);
    } catch (error) {
      Alert.alert("Error", "Failed to clear budget: " + error.message);
    }
  };

  // Render a list item for a budgeted category
  const renderBudgetProgressCard = (item) => {
    const isMonthly = item.budgetType !== "daily";
    const spent = isMonthly 
      ? (monthlyCategorySpending[item.name] || 0) 
      : (dailyCategorySpending[item.name] || 0);
    const limit = item.budget || 0;
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    
    let fillColor = item.color || colors.primary;
    if (pct >= 100) {
      fillColor = '#EF4444'; // Red
    } else if (pct >= 80) {
      fillColor = '#F59E0B'; // Orange
    }

    return (
      <TouchableOpacity 
        key={item.id} 
        style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleEditBudget(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconWrapper, { backgroundColor: (item.color || colors.primary) + "15" }]}>
              <Ionicons name={item.icon || "list"} size={18} color={item.color || colors.primary} />
            </View>
            <View>
              <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.limitTypeLabel, { color: colors.textSecondary }]}>
                {isMonthly ? "Monthly Limit" : "Daily Limit"}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.spentText, { color: colors.text }]}>
              {currencySymbol}{spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
            <Text style={[styles.limitText, { color: colors.textSecondary }]}>
              / {currencySymbol}{limit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </View>
        </View>

        <View style={[styles.progressBarTrack, { backgroundColor: colors.background }]}>
          <View style={[styles.progressBarFill, { width: `${Math.min(100, pct)}%`, backgroundColor: fillColor }]} />
        </View>

        <View style={styles.cardFooter}>
          <Text style={[styles.statusText, { color: pct >= 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : colors.textSecondary }]}>
            {pct >= 100 
              ? `Over limit by ${currencySymbol}${(spent - limit).toLocaleString(undefined, { maximumFractionDigits: 0 })}` 
              : pct >= 80 
                ? `${Math.round(pct)}% consumed` 
                : `${Math.round(100 - pct)}% remaining`
            }
          </Text>
          <Text style={[styles.remainingText, { color: pct >= 100 ? '#EF4444' : colors.textSecondary }]}>
            {pct >= 100 
              ? "Exceeded" 
              : `${currencySymbol}${(limit - spent).toLocaleString(undefined, { maximumFractionDigits: 0 })} left`
            }
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Filter budgeted items
  const budgetedCategories = expenseCategories.filter(c => c.budget && c.budget > 0);
  const filteredBudgetedCategories = budgetedCategories.filter(c => {
    if (activeSegment === "monthly") return c.budgetType !== "daily";
    if (activeSegment === "daily") return c.budgetType === "daily";
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.screenHeader}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Budgets & Limits</Text>
        <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>Set and track daily/monthly spending caps</Text>
      </View>

      {/* Segment Selector */}
      <View style={[styles.segmentContainer, { backgroundColor: colors.surface }]}>
        {["all", "monthly", "daily"].map((seg) => (
          <TouchableOpacity
            key={seg}
            style={[
              styles.segmentButton,
              activeSegment === seg && { backgroundColor: colors.primary }
            ]}
            onPress={() => setActiveSegment(seg)}
          >
            <Text style={[
              styles.segmentText,
              { color: colors.text },
              activeSegment === seg && { color: "#fff", fontWeight: "700" }
            ]}>
              {seg.charAt(0).toUpperCase() + seg.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Active Budgets Section */}
        {filteredBudgetedCategories.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Spending Limits</Text>
            {filteredBudgetedCategories.map(renderBudgetProgressCard)}
          </View>
        ) : (
          <View style={styles.emptyBudgets}>
            <Ionicons name="pie-chart-outline" size={48} color={colors.textSecondary + "50"} />
            <Text style={{ color: colors.textSecondary, marginTop: 10, fontSize: 14 }}>No active limits in this view.</Text>
          </View>
        )}

        {/* All Categories configuration section */}
        <View style={[styles.section, { marginTop: 15 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Configure Category Budgets</Text>
          <View style={[styles.categoriesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {expenseCategories.map((item, idx) => (
              <TouchableOpacity 
                key={item.id}
                style={[
                  styles.categoryListItem, 
                  idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border }
                ]}
                onPress={() => handleEditBudget(item)}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.iconWrapper, { backgroundColor: (item.color || colors.primary) + "15" }]}>
                    <Ionicons name={item.icon || "list"} size={18} color={item.color || colors.primary} />
                  </View>
                  <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
                </View>
                <View style={styles.cardRight}>
                  {item.budget ? (
                    <Text style={[styles.budgetText, { color: colors.primary }]}>
                      {currencySymbol}{item.budget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: "normal" }}>
                        /{item.budgetType === "daily" ? "day" : "mo"}
                      </Text>
                    </Text>
                  ) : (
                    <Text style={[styles.noBudgetText, { color: colors.textSecondary }]}>No limit</Text>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Configuration Modal */}
      <Modal
        visible={editingCategory !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingCategory(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Limit: {editingCategory?.name}
            </Text>
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              Choose period and define budget amount. Clear to remove cap.
            </Text>

            {/* Daily / Monthly Period Selector */}
            <View style={styles.periodSelectorWrapper}>
              <Text style={[styles.periodLabel, { color: colors.text }]}>Period</Text>
              <View style={[styles.periodToggleGroup, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.periodToggleBtn, budgetType === "monthly" && { backgroundColor: colors.primary }]}
                  onPress={() => setBudgetType("monthly")}
                >
                  <Text style={[styles.periodToggleText, { color: colors.text }, budgetType === "monthly" && { color: "#fff", fontWeight: "700" }]}>
                    Monthly
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.periodToggleBtn, budgetType === "daily" && { backgroundColor: colors.primary }]}
                  onPress={() => setBudgetType("daily")}
                >
                  <Text style={[styles.periodToggleText, { color: colors.text }, budgetType === "daily" && { color: "#fff", fontWeight: "700" }]}>
                    Daily
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.currencyPrefix, { color: colors.textSecondary }]}>{currencySymbol}</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Unlimited"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={budgetValue}
                onChangeText={setBudgetValue}
                autoFocus
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border }]} 
                onPress={() => setEditingCategory(null)}
              >
                <Text style={[styles.btnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              {editingCategory?.budget && (
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.clearBtn]} 
                  onPress={handleClearBudget}
                >
                  <Text style={[styles.btnText, { color: "#EF4444" }]}>Remove</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtn, { backgroundColor: colors.primary }]} 
                onPress={handleSaveBudget}
              >
                <Text style={[styles.btnText, { color: "white" }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 15,
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
  segmentContainer: {
    flexDirection: "row",
    padding: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  emptyBudgets: {
    alignItems: "center",
    paddingVertical: 30,
  },
  progressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "700",
  },
  limitTypeLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  spentText: {
    fontSize: 15,
    fontWeight: "800",
  },
  limitText: {
    fontSize: 11,
    fontWeight: "500",
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  remainingText: {
    fontSize: 11,
    fontWeight: "700",
  },
  categoriesCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  categoryListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  budgetText: {
    fontSize: 13,
    fontWeight: "700",
  },
  noBudgetText: {
    fontSize: 13,
    fontWeight: "500",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  modalDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  periodSelectorWrapper: {
    marginBottom: 16,
  },
  periodLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  periodToggleGroup: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
  },
  periodToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  periodToggleText: {
    fontSize: 13,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 20,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "700",
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    height: "100%",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtn: {
    borderWidth: 1,
  },
  clearBtn: {
    backgroundColor: "transparent",
  },
  saveBtn: {
    minWidth: 80,
  },
  btnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
