import React, { createContext } from 'react';

export const AuthContext = createContext<unknown>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
};
