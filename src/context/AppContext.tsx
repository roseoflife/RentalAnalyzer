import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { appReducer, initialState, type AppState, type AppAction } from './AppReducer';

const STORAGE_KEY = 'triplex-state';

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      // Merge with initialState to pick up any new fields added in updates
      return {
        ...initialState,
        ...parsed,
        config: {
          ...initialState.config,
          ...parsed.config,
          property: { ...initialState.config.property, ...parsed.config?.property },
          mortgage: { ...initialState.config.mortgage, ...parsed.config?.mortgage },
          mortgages: parsed.config?.mortgages ?? initialState.config.mortgages,
          assumptions: { ...initialState.config.assumptions, ...parsed.config?.assumptions },
          manualFinancials: {
            ...initialState.config.manualFinancials,
            ...parsed.config?.manualFinancials,
            annualExpenses: {
              ...initialState.config.manualFinancials.annualExpenses,
              ...parsed.config?.manualFinancials?.annualExpenses,
            },
          },
        },
      };
    }
  } catch {
    // Fall back to initial state on parse errors
  }
  return initialState;
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
