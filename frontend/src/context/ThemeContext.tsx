import React, { createContext } from 'react';

export const ThemeContext = createContext<unknown>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ThemeContext.Provider value={{}}>{children}</ThemeContext.Provider>;
};
