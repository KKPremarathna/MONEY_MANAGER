import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppContext } from '../src/AppContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function ThemeSelection() {
  const { theme, setTheme, colors } = useAppContext();
  const navigation = useNavigation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Select Theme</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={[
            styles.option, 
            { backgroundColor: colors.card },
            theme === 'light' ? styles.selectedOption : { borderColor: colors.border, borderWidth: 1 }
          ]} 
          onPress={() => setTheme('light')}
        >
          <Ionicons name="sunny" size={28} color="#f1c40f" />
          <Text style={[styles.optionText, { color: colors.text }]}>Light Theme</Text>
          {theme === 'light' && <Ionicons name="checkmark-circle" size={24} color="#2ECC71" />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.option, 
            { backgroundColor: colors.card },
            theme === 'dark' ? styles.selectedOption : { borderColor: colors.border, borderWidth: 1 }
          ]} 
          onPress={() => setTheme('dark')}
        >
          <Ionicons name="moon" size={28} color="#9b59b6" />
          <Text style={[styles.optionText, { color: colors.text }]}>Dark Theme</Text>
          {theme === 'dark' && <Ionicons name="checkmark-circle" size={24} color="#2ECC71" />}
        </TouchableOpacity>
      </View>
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
  content: {
    padding: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
  },
  selectedOption: {
    borderColor: '#2ECC71',
    borderWidth: 2,
  },
  optionText: {
    fontSize: 18,
    marginLeft: 15,
    flex: 1,
  }
});

