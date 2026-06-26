import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Modal, FlatList, Image, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCategories, insertTransaction, insertCategory, deleteCategory, getCategorySpentForMonth, getCategorySpentForDay } from '../src/db/queries';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../src/AppContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { pickReceiptImage, saveReceiptLocally, pickReceiptDocument } from '../src/services/receiptScanner';

const PRESET_ICONS = [
  'cart-outline', 'bus-outline', 'fast-food-outline', 'shirt-outline', 
  'heart-outline', 'gift-outline', 'barbell-outline', 'game-controller-outline', 
  'book-outline', 'cash-outline', 'card-outline', 'trending-up-outline',
  'home-outline', 'car-outline', 'medical-outline', 'school-outline',
  'airplane-outline', 'paw-outline', 'cafe-outline', 'wine-outline'
];

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', 
  '#D4A5A5', '#9B59B6', '#FF9F43', '#2ECC71', '#F1C40F', 
  '#E67E22', '#1ABC9C', '#3B82F6', '#EC4899', '#6366F1'
];

export default function TransactionForm({ type }) {
  const navigation = useNavigation();
  const categories = useCategories(type);
  const { colors, getCurrencySymbol, showAlert } = useAppContext();
  
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Receipt scanning states
  const [receiptUri, setReceiptUri] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [showSourcePicker, setShowSourcePicker] = useState(false);

  // Category management states
  const [isManaging, setIsManaging] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState(PRESET_COLORS[0]);
  const [customIcon, setCustomIcon] = useState(PRESET_ICONS[0]);

  const handleScanReceipt = async (source) => {
    setShowSourcePicker(false);
    setIsScanning(true);
    setScanStatus('Capturing image...');

    try {
      let fileUri;
      if (source === 'document') {
        fileUri = await pickReceiptDocument();
      } else {
        fileUri = await pickReceiptImage(source);
      }

      if (!fileUri) {
        setIsScanning(false);
        return;
      }

      setReceiptUri(fileUri);
      setScanStatus('Receipt attached successfully.');
    } catch (error) {
      console.error('Scan receipt error:', error);
      showAlert('Scan Error', error.message || 'Failed to scan receipt. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptUri(null);
    setScanStatus('');
  };

  const handleSave = async () => {
    if (!amount || isNaN(amount) || !selectedCategory) {
      showAlert("Error", "Please enter a valid amount and select a category.");
      return;
    }

    const addedAmount = parseFloat(amount);

    const performSave = async () => {
      // Save receipt to persistent storage if attached
      let persistedReceiptUri = null;
      if (receiptUri) {
        try {
          // Use a temp ID since we don't have the transaction ID yet
          const tempId = Date.now();
          persistedReceiptUri = await saveReceiptLocally(receiptUri, tempId);
        } catch (err) {
          console.error('Failed to save receipt:', err);
        }
      }

      await insertTransaction({
        amount: addedAmount,
        note,
        categoryId: selectedCategory,
        type,
        date,
        receiptUri: persistedReceiptUri
      });

      navigation.getParent()?.goBack();
    };

    if (type === 'expense') {
      const categoryObj = categories.find(c => c.id === selectedCategory);
      if (categoryObj && categoryObj.budget !== null && categoryObj.budget > 0) {
        try {
          const year = date.getFullYear();
          const month = date.getMonth();
          const isDaily = categoryObj.budgetType === "daily";
          
          const currentSpent = isDaily 
            ? await getCategorySpentForDay(selectedCategory, year, month, date.getDate())
            : await getCategorySpentForMonth(selectedCategory, year, month);

          const totalSpent = currentSpent + addedAmount;
          const budgetLimit = categoryObj.budget;
          const symbol = getCurrencySymbol();
          const periodName = isDaily ? "daily" : "monthly";

          if (totalSpent >= budgetLimit && currentSpent < budgetLimit) {
            const exceededAmt = totalSpent - budgetLimit;
            showAlert(
              "Budget Exceeded",
              `${categoryObj.name} ${periodName} budget exceeded: You have spent ${symbol}${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })} / ${symbol}${budgetLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })} (Exceeded by ${symbol}${exceededAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}).`,
              [{ text: "OK", onPress: performSave }]
            );
            return;
          } else if (totalSpent >= budgetLimit * 0.8 && currentSpent < budgetLimit * 0.8) {
            const percentage = Math.round((totalSpent / budgetLimit) * 100);
            const remainingAmt = budgetLimit - totalSpent;
            showAlert(
              "Budget Warning",
              `${categoryObj.name} ${periodName} budget warning: You have spent ${percentage}% of your ${symbol}${budgetLimit.toLocaleString(undefined, { maximumFractionDigits: 0 })} budget (${symbol}${remainingAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })} left).`,
              [{ text: "OK", onPress: performSave }]
            );
            return;
          }
        } catch (error) {
          console.error("Failed to check budget constraints:", error);
        }
      }
    }

    await performSave();
  };

  const handleCreateCategory = async () => {
    if (!customName.trim()) {
      showAlert("Error", "Category name cannot be empty.");
      return;
    }

    await insertCategory({
      name: customName.trim(),
      type,
      color: customColor,
      icon: customIcon
    });

    setCustomName('');
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = (catId, catName) => {
    showAlert(
      "Delete Category",
      `Are you sure you want to delete the category "${catName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            if (selectedCategory === catId) {
              setSelectedCategory(null);
            }
            await deleteCategory(catId);
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      
      {/* Scan Receipt Button */}
      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '40' }]}
        onPress={() => setShowSourcePicker(true)}
        activeOpacity={0.7}
        disabled={isScanning}
      >
        {isScanning ? (
          <View style={styles.scanningRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.scanStatusText, { color: colors.primary }]}>{scanStatus}</Text>
          </View>
        ) : (
          <View style={styles.scanButtonContent}>
            <View style={[styles.scanIconCircle, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera-outline" size={22} color="white" />
            </View>
            <View style={styles.scanTextGroup}>
              <Text style={[styles.scanTitle, { color: colors.text }]}>Attach Receipt</Text>
              <Text style={[styles.scanSubtitle, { color: colors.textSecondary }]}>
                Attach a bill photo or PDF
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        )}
      </TouchableOpacity>

      {/* Receipt Preview */}
      {receiptUri && !isScanning && (
        <View style={[styles.receiptPreview, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {receiptUri.toLowerCase().endsWith('.pdf') ? (
            <View style={[styles.receiptThumbnail, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#EF444420' }]}>
              <Ionicons name="document-text" size={28} color="#EF4444" />
            </View>
          ) : (
            <Image source={{ uri: receiptUri }} style={styles.receiptThumbnail} />
          )}
          <View style={styles.receiptInfo}>
            <Text style={[styles.receiptLabel, { color: colors.text }]}>Receipt attached</Text>
            {scanStatus ? (
              <Text style={[styles.receiptStatus, { color: colors.primary }]} numberOfLines={1}>
                {scanStatus}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={[styles.removeReceiptBtn, { backgroundColor: '#EF444420' }]}
            onPress={handleRemoveReceipt}
          >
            <Ionicons name="close" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Amount</Text>
        <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>Select Category</Text>
          <TouchableOpacity onPress={() => setIsManaging(!isManaging)}>
            <Text style={[styles.manageText, { color: colors.primary }]}>
              {isManaging ? "Done" : "Manage"}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.categoryGrid}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <View key={cat.id} style={styles.categoryItemWrapper}>
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    isSelected && styles.selectedCategory,
                    isManaging && { opacity: 0.8 }
                  ]}
                  onPress={() => {
                    if (isManaging) {
                      handleDeleteCategory(cat.id, cat.name);
                    } else {
                      setSelectedCategory(cat.id);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.iconContainer, 
                    { backgroundColor: cat.color }
                  ]}>
                    <Ionicons name={cat.icon || 'list'} size={20} color="white" />
                  </View>
                  <Text style={[styles.categoryName, { color: colors.text }, isSelected && { fontWeight: '700' }]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>

                {isManaging && (
                  <TouchableOpacity 
                    style={styles.deleteBadge} 
                    onPress={() => handleDeleteCategory(cat.id, cat.name)}
                  >
                    <Ionicons name="close" size={14} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

          {!isManaging && (
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => setIsAddingCategory(true)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.iconContainer, 
                { backgroundColor: colors.surface, borderStyle: 'dashed', borderWidth: 2, borderColor: colors.border }
              ]}>
                <Ionicons name="add" size={20} color={colors.textSecondary} />
              </View>
              <Text style={[styles.categoryName, { color: colors.textSecondary }]}>Add Custom</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Date</Text>
        <TouchableOpacity 
          style={[styles.inputWrapper, styles.dateRow, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.dateTextLabel, { color: colors.text }]}>
            {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </TouchableOpacity>
        
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setDate(selectedDate);
              }
            }}
          />
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Note (Optional)</Text>
        <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="What was this for?"
            placeholderTextColor={colors.textSecondary}
            value={note}
            onChangeText={setNote}
          />
        </View>
      </View>

      <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Transaction</Text>
      </TouchableOpacity>

      {/* Source Picker Modal */}
      <Modal
        visible={showSourcePicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSourcePicker(false)}
      >
        <View style={styles.sourcePickerOverlay}>
          <View style={[styles.sourcePickerContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.sourcePickerTitle, { color: colors.text }]}>Attach Receipt</Text>
            <Text style={[styles.sourcePickerSubtitle, { color: colors.textSecondary }]}>
              Choose how to add your receipt
            </Text>

            <TouchableOpacity
              style={[styles.sourceOption, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
              onPress={() => handleScanReceipt('camera')}
            >
              <View style={[styles.sourceOptionIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="camera" size={24} color="white" />
              </View>
              <View style={styles.sourceOptionTextGroup}>
                <Text style={[styles.sourceOptionTitle, { color: colors.text }]}>Take Photo</Text>
                <Text style={[styles.sourceOptionDesc, { color: colors.textSecondary }]}>
                  Capture the bill with camera
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sourceOption, { backgroundColor: '#6366F110', borderColor: '#6366F130' }]}
              onPress={() => handleScanReceipt('gallery')}
            >
              <View style={[styles.sourceOptionIcon, { backgroundColor: '#6366F1' }]}>
                <Ionicons name="images" size={24} color="white" />
              </View>
              <View style={styles.sourceOptionTextGroup}>
                <Text style={[styles.sourceOptionTitle, { color: colors.text }]}>Choose from Gallery</Text>
                <Text style={[styles.sourceOptionDesc, { color: colors.textSecondary }]}>
                  Select an existing photo
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sourceOption, { backgroundColor: '#F59E0B10', borderColor: '#F59E0B30' }]}
              onPress={() => handleScanReceipt('document')}
            >
              <View style={[styles.sourceOptionIcon, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="document-text" size={24} color="white" />
              </View>
              <View style={styles.sourceOptionTextGroup}>
                <Text style={[styles.sourceOptionTitle, { color: colors.text }]}>Choose PDF Document</Text>
                <Text style={[styles.sourceOptionDesc, { color: colors.textSecondary }]}>
                  Select a PDF file
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelSourceBtn, { borderColor: colors.border }]}
              onPress={() => setShowSourcePicker(false)}
            >
              <Text style={[styles.cancelSourceText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Custom Category Modal */}
      <Modal
        visible={isAddingCategory}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddingCategory(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setIsAddingCategory(false)}>
                <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>New Category</Text>
              <TouchableOpacity onPress={handleCreateCategory}>
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>Create</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Name</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.card, marginBottom: 20 }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Category Name"
                  placeholderTextColor={colors.textSecondary}
                  value={customName}
                  onChangeText={setCustomName}
                  maxLength={15}
                />
              </View>

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Color</Text>
              <View style={styles.presetsRow}>
                {PRESET_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorBubble,
                      { backgroundColor: c },
                      customColor === c && { borderWidth: 3, borderColor: colors.text }
                    ]}
                    onPress={() => setCustomColor(c)}
                  />
                ))}
              </View>

              <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 20 }]}>Icon</Text>
              <View style={styles.presetsRow}>
                {PRESET_ICONS.map((i) => (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.iconBubble,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      customIcon === i && { backgroundColor: customColor, borderColor: customColor }
                    ]}
                    onPress={() => setCustomIcon(i)}
                  >
                    <Ionicons 
                      name={i} 
                      size={20} 
                      color={customIcon === i ? 'white' : colors.text} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  // Scan Receipt Button
  scanButton: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scanTextGroup: {
    flex: 1,
  },
  scanTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  scanSubtitle: {
    fontSize: 12,
  },
  scanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  scanStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  // Receipt Preview
  receiptPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  receiptThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  receiptInfo: {
    flex: 1,
    marginLeft: 12,
  },
  receiptLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  receiptStatus: {
    fontSize: 11,
    marginTop: 2,
  },
  removeReceiptBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Existing styles
  inputGroup: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  manageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  input: {
    height: 40,
    fontSize: 15,
    fontWeight: '500',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
    paddingVertical: 4,
  },
  categoryItemWrapper: {
    position: 'relative',
    width: '18%',
  },
  categoryItem: {
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
    opacity: 0.5,
  },
  selectedCategory: {
    opacity: 1,
  },
  iconOuterRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 10,
    textAlign: 'center',
  },
  deleteBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  saveButton: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  // Source Picker Modal
  sourcePickerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 24,
  },
  sourcePickerContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  sourcePickerTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  sourcePickerSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  sourceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  sourceOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  sourceOptionTextGroup: {
    flex: 1,
  },
  sourceOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  sourceOptionDesc: {
    fontSize: 12,
  },
  cancelSourceBtn: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelSourceText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Category Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  colorBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  dateTextLabel: {
    fontSize: 16,
    fontWeight: '500',
  }
});
