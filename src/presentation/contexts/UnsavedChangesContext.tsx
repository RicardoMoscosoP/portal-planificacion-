import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { registerDirtyCallback, registerCleanCallback } from '../../application/services/dataService';

interface UnsavedChangesContextValue {
  hasPendingChanges: boolean;
  markDirty: () => void;
  markClean: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextValue>({
  hasPendingChanges: false,
  markDirty: () => {},
  markClean: () => {},
});

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  const markDirty = () => setHasPendingChanges(true);
  const markClean = () => setHasPendingChanges(false);

  useEffect(() => {
    registerDirtyCallback(markDirty);
    registerCleanCallback(markClean);
    return () => {
      registerDirtyCallback(null);
      registerCleanCallback(null);
    };
  }, []);

  return (
    <UnsavedChangesContext.Provider value={{ hasPendingChanges, markDirty, markClean }}>
      {children}
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext);
}
