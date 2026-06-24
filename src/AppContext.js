import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Modal, Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { themes } from './theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppContext = createContext();

const CURRENCIES = {
  'LKR': 'Rs.',
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'INR': '₹',
  'AUD': 'A$',
  'CAD': 'C$',
  'JPY': '¥'
};

export function AppProvider({ children, forceReset }) {
  const [filter, setFilter] = useState('daily'); // 'daily', 'monthly', 'yearly', 'all'
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [currency, setCurrency] = useState('LKR'); // 'LKR' or 'USD'
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'
  const [activeTab, setActiveTab] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [fontSizeMode, setFontSizeMode] = useState('medium'); // 'small', 'medium', 'large'

  // Custom premium alert state
  const [alertConfig, setAlertConfig] = useState(null);

  // Load font size preference on mount
  useEffect(() => {
    const loadFontSize = async () => {
      try {
        const savedSize = await AsyncStorage.getItem('MM_FONT_SIZE');
        if (savedSize) {
          setFontSizeMode(savedSize);
        }
      } catch (err) {
        console.log('Failed to load font size:', err);
      }
    };
    loadFontSize();
  }, []);

  // Update scale factor and save to storage
  useEffect(() => {
    let scale = 1.0;
    if (fontSizeMode === 'small') scale = 0.85;
    if (fontSizeMode === 'large') scale = 1.15;
    
    global.fontSizeScale = scale;
    
    AsyncStorage.setItem('MM_FONT_SIZE', fontSizeMode).catch((err) =>
      console.log('Failed to save font size:', err)
    );
  }, [fontSizeMode]);

  // Auto-reset category selection on filter or date change
  useEffect(() => {
    setSelectedCategory(null);
  }, [filter, referenceDate]);

  const changeFilter = (newFilter) => {
    setFilter(newFilter);
    setReferenceDate(new Date());
  };

  const getCurrencySymbol = () => CURRENCIES[currency] || '$';
  const colors = themes[theme] || themes.light;

  const showAlert = (title, message, buttons = []) => {
    const finalButtons = buttons.length > 0 ? buttons : [{ text: "OK" }];
    setAlertConfig({ title, message, buttons: finalButtons });
  };

  const handleButtonPress = (onPress) => {
    setAlertConfig(null);
    if (onPress) {
      setTimeout(() => {
        onPress();
      }, 100);
    }
  };

  return (
    <AppContext.Provider value={{ 
      filter, 
      setFilter: changeFilter, 
      referenceDate, 
      setReferenceDate, 
      currency, 
      setCurrency, 
      getCurrencySymbol, 
      theme, 
      setTheme, 
      colors,
      forceReset,
      activeTab,
      setActiveTab,
      selectedCategory,
      setSelectedCategory,
      showAlert,
      fontSizeMode,
      setFontSizeMode
    }}>
      {children}

      {/* Custom Premium Alert Modal */}
      <Modal
        visible={alertConfig !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertConfig(null)}
      >
        <View style={alertStyles.overlay}>
          <View style={[alertStyles.alertCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={alertStyles.iconContainer}>
              {alertConfig?.title?.toLowerCase().includes("error") || alertConfig?.title?.toLowerCase().includes("invalid") ? (
                <Ionicons name="close-circle" size={46} color="#EF4444" />
              ) : alertConfig?.title?.toLowerCase().includes("warning") || alertConfig?.title?.toLowerCase().includes("exceeded") || alertConfig?.title?.toLowerCase().includes("delete") || alertConfig?.title?.toLowerCase().includes("reset") ? (
                <Ionicons name="warning" size={46} color="#F59E0B" />
              ) : alertConfig?.title?.toLowerCase().includes("success") || alertConfig?.title?.toLowerCase().includes("complete") ? (
                <Ionicons name="checkmark-circle" size={46} color="#10B981" />
              ) : (
                <Ionicons name="information-circle" size={46} color={colors.primary} />
              )}
            </View>

            <Text style={[alertStyles.title, { color: colors.text }]}>{alertConfig?.title}</Text>
            <Text style={[alertStyles.message, { color: colors.textSecondary }]}>{alertConfig?.message}</Text>

            <View style={[
              alertStyles.buttonWrapper,
              alertConfig?.buttons?.length > 2 ? { flexDirection: "column" } : { flexDirection: "row" }
            ]}>
              {alertConfig?.buttons?.map((btn, idx) => {
                const isDestructive = btn.style === "destructive";
                const isCancel = btn.style === "cancel";
                
                let btnBg = colors.primary;
                let btnText = "#fff";
                let btnBorderColor = "transparent";

                if (isDestructive) {
                  btnBg = "#EF4444";
                } else if (isCancel) {
                  btnBg = "transparent";
                  btnText = colors.textSecondary;
                  btnBorderColor = colors.border;
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      alertStyles.btn,
                      { backgroundColor: btnBg, borderColor: btnBorderColor },
                      isCancel && { borderWidth: 1 },
                      alertConfig?.buttons?.length > 2 && { width: "100%", marginVertical: 4 }
                    ]}
                    onPress={() => handleButtonPress(btn.onPress)}
                  >
                    <Text style={[alertStyles.btnText, { color: btnText }]}>{btn.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}

const alertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  alertCard: {
    width: "85%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonWrapper: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
    paddingHorizontal: 12,
  },
  btnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});

