import { createContext, useContext } from "react";

import { AppTheme, DEFAULT_THEME, useAppTheme } from "./hooks/useAppTheme";

const defaultContext = {
  appTheme: DEFAULT_THEME,
  setAppTheme: () => {},
};

export const AppThemeContext = createContext(defaultContext);
export const AppThemeProvider = AppThemeContext.Provider;

const useAppThemeContext = () => useContext(AppThemeContext);

export { useAppTheme, useAppThemeContext };
