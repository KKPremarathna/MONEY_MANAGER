import { useState } from "react";
import { FlatList, View, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Pressable, Animated, Image, Alert } from "react-native";
import Text from "./Text";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import SmallCard from "./ui/SmallCard";
import { useTransactions, useCategories, updateTransaction, deleteTransaction, getCategorySpentForMonth, getCategorySpentForDay } from "../src/db/queries";
import { useAppContext } from "../src/AppContext";
import { pickReceiptImage, saveReceiptLocally, deleteReceiptLocally, pickReceiptDocument } from "../src/services/receiptScanner";
import * as Sharing from 'expo-sharing';

function AnimatedCardItem({ item, colors, handleOpenDetails }) {
  const [scaleValue] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 120,
      friction: 7,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 7,
    }).start();
  };

  return (
    <Pressable
      onPress={() => handleOpenDetails(item)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={null}
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.95 : 1
        }
      ]}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <SmallCard
          category={item.categoryName || 'Unknown'}
          icon={item.categoryIcon || 'list'}
          color={item.categoryColor || colors.text}
          money={item.amount}
          type={item.type}
          hasReceipt={!!item.receiptUri}
        />
      </Animated.View>
    </Pressable>
  );
}

export default function TransactionList({ type }) {
  const { filter, referenceDate, colors, selectedCategory, getCurrencySymbol, showAlert } = useAppContext();
  const allTransactions = useTransactions(type);

  const expenseCategories = useCategories("expense");
  const incomeCategories = useCategories("income");

  // Selection states
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editDate, setEditDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Receipt viewer states
  const [showReceiptViewer, setShowReceiptViewer] = useState(false);
  const [editReceiptUri, setEditReceiptUri] = useState(null);

  const transactions = allTransactions.filter(t => {
    if (selectedCategory && t.categoryName !== selectedCategory) {
      return false;
    }

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

  const handleOpenDetails = (item) => {
    setSelectedTransaction(item);
    setEditAmount(item.amount.toString());
    setEditNote(item.note || "");
    setEditCategoryId(item.categoryId);
    setEditDate(item.date ? new Date(item.date) : new Date());
    setEditReceiptUri(item.receiptUri || null);
  };

  const handleDelete = () => {
    if (!selectedTransaction) return;

    showAlert(
      "Delete Transaction",
      "Are you sure you want to permanently delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteTransaction(selectedTransaction.id, selectedTransaction.receiptUri);
              setSelectedTransaction(null);
            } catch (err) {
              showAlert("Error", "Failed to delete: " + err.message);
            }
          }
        }
      ]
    );
  };

  const handleAttachReceipt = () => {
    Alert.alert('Attach Receipt', 'Choose source', [
      { text: 'Gallery', onPress: async () => {
          try {
            const uri = await pickReceiptImage('gallery');
            if (uri) {
              const persistedUri = await saveReceiptLocally(uri, selectedTransaction.id);
              setEditReceiptUri(persistedUri);
            }
          } catch (err) { showAlert("Error", err.message || "Failed to attach receipt."); }
      }},
      { text: 'PDF Document', onPress: async () => {
          try {
            const uri = await pickReceiptDocument();
            if (uri) {
              const persistedUri = await saveReceiptLocally(uri, selectedTransaction.id);
              setEditReceiptUri(persistedUri);
            }
          } catch (err) { showAlert("Error", err.message || "Failed to attach document."); }
      }},
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const handleRemoveReceipt = () => {
    showAlert(
      "Remove Receipt",
      "Are you sure you want to remove the attached receipt?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (editReceiptUri) {
              await deleteReceiptLocally(editReceiptUri);
            }
            setEditReceiptUri(null);
          }
        }
      ]
    );
  };

  const handleSaveUpdate = async () => {
    if (!selectedTransaction) return;

    const parsedAmount = parseFloat(editAmount);
    if (!editAmount || isNaN(parsedAmount) || parsedAmount <= 0) {
      showAlert("Invalid Amount", "Please enter a valid amount.");
      return;
    }

    if (!editCategoryId) {
      showAlert("Error", "Please select a category.");
      return;
    }

    const performUpdate = async () => {
      try {
        await updateTransaction(selectedTransaction.id, {
          amount: parsedAmount,
          note: editNote.trim(),
          categoryId: editCategoryId,
          date: editDate,
          receiptUri: editReceiptUri
        });
        setSelectedTransaction(null);
      } catch (err) {
        showAlert("Error", "Failed to update transaction: " + err.message);
      }
    };

    if (selectedTransaction.type === 'expense') {
      const activeCategories = expenseCategories;
      const categoryObj = activeCategories.find(c => c.id === editCategoryId);
      if (categoryObj && categoryObj.budget !== null && categoryObj.budget > 0) {
        try {
          const year = editDate.getFullYear();
          const month = editDate.getMonth();
          const isDaily = categoryObj.budgetType === "daily";
          
          const currentSpent = isDaily 
            ? await getCategorySpentForDay(editCategoryId, year, month, editDate.getDate())
            : await getCategorySpentForMonth(editCategoryId, year, month);

          // Subtract original transaction amount if it was in the same period and category
          let previousAmountInPeriod = 0;
          const prevDate = new Date(selectedTransaction.date);
          const isSamePeriod = isDaily
            ? (prevDate.getFullYear() === year && prevDate.getMonth() === month && prevDate.getDate() === editDate.getDate() && selectedTransaction.categoryId === editCategoryId)
            : (prevDate.getFullYear() === year && prevDate.getMonth() === month && selectedTransaction.categoryId === editCategoryId);

          if (isSamePeriod) {
            previousAmountInPeriod = selectedTransaction.amount;
          }

          const adjustedSpent = currentSpent - previousAmountInPeriod + parsedAmount;
          const budgetLimit = categoryObj.budget;
          const symbol = getCurrencySymbol();
          const periodName = isDaily ? "daily" : "monthly";

          if (adjustedSpent >= budgetLimit && (currentSpent - previousAmountInPeriod) < budgetLimit) {
            const exceededAmt = adjustedSpent - budgetLimit;
            showAlert(
              "Budget Exceeded",
              `${categoryObj.name} ${periodName} budget exceeded: You have spent ${symbol}${adjustedSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${symbol}${budgetLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })} (Exceeded by ${symbol}${exceededAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}).`,
              [{ text: "OK", onPress: performUpdate }]
            );
            return;
          } else if (adjustedSpent >= budgetLimit * 0.8 && (currentSpent - previousAmountInPeriod) < budgetLimit * 0.8) {
            const percentage = Math.round((adjustedSpent / budgetLimit) * 100);
            const remainingAmt = budgetLimit - adjustedSpent;
            showAlert(
              "Budget Warning",
              `${categoryObj.name} ${periodName} budget warning: You have spent ${percentage}% of your ${symbol}${budgetLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })} budget (${symbol}${remainingAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })} left).`,
              [{ text: "OK", onPress: performUpdate }]
            );
            return;
          }
        } catch (error) {
          console.error("Failed checking budget limits during transaction update:", error);
        }
      }
    }

    await performUpdate();
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
    return '';
  };

  const activeCategories = selectedTransaction?.type === 'expense' ? expenseCategories : incomeCategories;

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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <AnimatedCardItem
            item={item}
            colors={colors}
            handleOpenDetails={handleOpenDetails}
          />
        )}
      />

      {/* Transaction Details Modal */}
      <Modal
        visible={selectedTransaction !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTransaction(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setSelectedTransaction(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Note Display (Non-Editable Context Helper) */}
              {selectedTransaction?.note ? (
                <View style={[styles.noteBanner, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.noteBannerText, { color: colors.text }]}>{selectedTransaction.note}</Text>
                </View>
              ) : null}

              {/* Receipt Section */}
              <View style={styles.receiptSection}>
                {editReceiptUri ? (
                  <View style={[styles.receiptCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    {editReceiptUri.toLowerCase().endsWith('.pdf') ? (
                      <TouchableOpacity
                        onPress={async () => {
                          if (await Sharing.isAvailableAsync()) {
                            await Sharing.shareAsync(editReceiptUri);
                          } else {
                            showAlert("Error", "Sharing is not available on this device");
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.receiptThumbnailLarge, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#EF444420' }]}>
                          <Ionicons name="document-text" size={64} color="#EF4444" />
                        </View>
                        <View style={styles.receiptOverlay}>
                          <Ionicons name="open-outline" size={16} color="white" />
                          <Text style={styles.receiptOverlayText}>Open PDF</Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setShowReceiptViewer(true)}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: editReceiptUri }} style={styles.receiptThumbnailLarge} />
                        <View style={styles.receiptOverlay}>
                          <Ionicons name="expand-outline" size={16} color="white" />
                          <Text style={styles.receiptOverlayText}>View Receipt</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    <View style={styles.receiptActions}>
                      <TouchableOpacity
                        style={[styles.receiptActionBtn, { backgroundColor: '#6366F115' }]}
                        onPress={handleAttachReceipt}
                      >
                        <Ionicons name="swap-horizontal-outline" size={14} color="#6366F1" />
                        <Text style={[styles.receiptActionText, { color: '#6366F1' }]}>Replace</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.receiptActionBtn, { backgroundColor: '#EF444415' }]}
                        onPress={handleRemoveReceipt}
                      >
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                        <Text style={[styles.receiptActionText, { color: '#EF4444' }]}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.attachReceiptBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                    onPress={handleAttachReceipt}
                  >
                    <Ionicons name="camera-outline" size={20} color={colors.textSecondary} />
                    <Text style={[styles.attachReceiptText, { color: colors.textSecondary }]}>Attach Receipt</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Amount Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Amount</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    keyboardType="numeric"
                    value={editAmount}
                    onChangeText={setEditAmount}
                  />
                </View>
              </View>

              {/* Date Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
                <TouchableOpacity 
                  style={[styles.inputWrapper, styles.dateRow, { borderColor: colors.border, backgroundColor: colors.background }]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "500" }}>
                    {editDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={editDate}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setEditDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>

              {/* Note Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Edit Note</Text>
                <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Describe transaction details"
                    placeholderTextColor={colors.textSecondary}
                    value={editNote}
                    onChangeText={setEditNote}
                  />
                </View>
              </View>

              {/* Category Selector Grid */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
                <View style={styles.categoryGrid}>
                  {activeCategories.map((cat) => {
                    const isSelected = editCategoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryItem,
                          isSelected && styles.selectedCategory
                        ]}
                        onPress={() => setEditCategoryId(cat.id)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.iconContainer, { backgroundColor: cat.color }]}>
                          <Ionicons name={cat.icon || 'list'} size={18} color="white" />
                        </View>
                        <Text style={[styles.categoryName, { color: colors.text }, isSelected && { fontWeight: '700' }]} numberOfLines={1}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={18} color="white" style={{ marginRight: 6 }} />
                <Text style={[styles.actionBtnText, { color: "white" }]}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveUpdate}>
                <Ionicons name="checkmark-circle-outline" size={18} color="white" style={{ marginRight: 6 }} />
                <Text style={[styles.actionBtnText, { color: "white" }]}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full-Screen Receipt Viewer */}
      <Modal
        visible={showReceiptViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReceiptViewer(false)}
      >
        <View style={styles.receiptViewerOverlay}>
          <View style={styles.receiptViewerHeader}>
            <TouchableOpacity
              style={styles.receiptViewerClose}
              onPress={() => setShowReceiptViewer(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.receiptViewerTitle}>Receipt</Text>
            <View style={{ width: 40 }} />
          </View>

          {editReceiptUri && (
            <Image
              source={{ uri: editReceiptUri }}
              style={styles.receiptFullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
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
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContent: {
    height: "82%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  modalScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  noteBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  noteBannerText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  // Receipt Section
  receiptSection: {
    marginBottom: 16,
  },
  receiptCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  receiptThumbnailLarge: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  receiptOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    gap: 6,
  },
  receiptOverlayText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  receiptActions: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  receiptActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  receiptActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  attachReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
  },
  attachReceiptText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Receipt Full-Screen Viewer
  receiptViewerOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  receiptViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  receiptViewerClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptViewerTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  receiptFullImage: {
    flex: 1,
    width: '100%',
  },
  // Input styles
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    justifyContent: "center",
  },
  input: {
    height: "100%",
    fontSize: 15,
    fontWeight: "500",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  categoryItem: {
    alignItems: "center",
    width: "18%",
    marginBottom: 6,
    opacity: 0.5,
  },
  selectedCategory: {
    opacity: 1,
  },
  iconOuterRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 10,
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  deleteBtn: {
    backgroundColor: "#EF4444",
  },
  saveBtn: {
    flex: 1.5,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
