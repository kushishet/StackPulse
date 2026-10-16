import React, { createContext, useContext, useState } from 'react';

interface CompareContextType {
  compareUsernames: string[];
  addDeveloper: (username: string) => void;
  removeDeveloper: (username: string) => void;
  clearDevelopers: () => void;
  setDevelopers: (usernames: string[]) => void;
  isInCompare: (username: string) => boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareUsernames, setCompareUsernames] = useState<string[]>(['torvalds', 'gaearon']);

  const addDeveloper = (username: string) => {
    const clean = username.trim().toLowerCase();
    if (!clean) return;
    setCompareUsernames((prev) => {
      if (prev.some((u) => u.toLowerCase() === clean)) return prev;
      return [...prev, clean];
    });
  };

  const removeDeveloper = (username: string) => {
    const clean = username.trim().toLowerCase();
    setCompareUsernames((prev) => prev.filter((u) => u.toLowerCase() !== clean));
  };

  const clearDevelopers = () => {
    setCompareUsernames([]);
  };

  const setDevelopers = (usernames: string[]) => {
    setCompareUsernames(usernames.map((u) => u.trim().toLowerCase()).filter(Boolean));
  };

  const isInCompare = (username: string) => {
    const clean = username.trim().toLowerCase();
    return compareUsernames.some((u) => u.toLowerCase() === clean);
  };

  return (
    <CompareContext.Provider
      value={{
        compareUsernames,
        addDeveloper,
        removeDeveloper,
        clearDevelopers,
        setDevelopers,
        isInCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
