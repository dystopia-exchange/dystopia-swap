import { useState } from "react";

export const AppTheme = { dark: "dark", light: "light" };
export const DEFAULT_THEME = AppTheme.dark;

export const useAppTheme = () => {
  const [appTheme, setAppTheme] = useState(DEFAULT_THEME);

  return { appTheme, setAppTheme };
};
