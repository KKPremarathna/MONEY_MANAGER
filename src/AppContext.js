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

export function AppProvider({ children, forceReset }) {
  const [filter, setFilter] = useState('daily'); // 'daily', 'monthly', 'yearly', 'all'
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [currency, setCurrency] = useState('LKR'); // 'LKR' or 'USD'
  const [theme, setTheme] = useState('light'); // 'light' or 'dark'
  const [activeTab, setActiveTab] = useState('All');

  const changeFilter = (newFilter) => {
    setFilter(newFilter);
    setReferenceDate(new Date());
  };

  const getCurrencySymbol = () => CURRENCIES[currency] || '$';
  const colors = themes[theme] || themes.light;

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
      setActiveTab
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}

