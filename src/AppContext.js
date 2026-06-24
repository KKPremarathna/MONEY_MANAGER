import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [filter, setFilter] = useState('daily'); // 'daily', 'monthly', 'yearly', 'all'
  const [currency, setCurrency] = useState('LKR'); // 'LKR' or 'USD'

  return (
    <AppContext.Provider value={{ filter, setFilter, currency, setCurrency }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
