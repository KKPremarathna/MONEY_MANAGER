import React, { createContext, useState, useContext } from 'react';
import { themes } from './theme';

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

export function AppProvider({ children }) {
  const [filter, setFilter] = useState('daily'); // 'daily', 'monthly', 'yearly', 'all'
  const [currency, setCurrency] = useState('LKR'); // 'LKR' or 'USD'
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'

  const getCurrencySymbol = () => CURRENCIES[currency] || '$';
  const colors = themes[theme] || themes.light;

  return (
    <AppContext.Provider value={{ filter, setFilter, currency, setCurrency, getCurrencySymbol, theme, setTheme, colors }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}

