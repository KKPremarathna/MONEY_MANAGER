import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useAppContext } from '../src/AppContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const CURRENCIES = [
  { code: 'LKR', symbol: 'Rs.', name: 'Sri Lankan Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

export default function Currencies() {
  const { currency, setCurrency, colors } = useAppContext();
  const navigation = useNavigation();

  const handleSelect = (code) => {
    setCurrency(code);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Select Default Currency</Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={CURRENCIES}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ padding: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[
              styles.item, 
              { backgroundColor: colors.card },
              currency === item.code ? styles.selectedItem : { borderColor: colors.border, borderWidth: 1 }
            ]}
            onPress={() => handleSelect(item.code)}
          >
            <View style={styles.leftGroup}>
              <Text style={[styles.symbol, { color: colors.text }]}>{item.symbol}</Text>
              <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
            </View>
            {currency === item.code && (
              <Ionicons name="checkmark-circle" size={24} color="#2ECC71" />
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  selectedItem: {
    borderColor: '#2ECC71',
    borderWidth: 2,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbol: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 15,
    width: 35,
  },
  name: {
    fontSize: 16,
  }
});

