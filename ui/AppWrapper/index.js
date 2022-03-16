import React from "react";

import { useAppThemeContext } from "../AppThemeProvider";
import classes from "./AppWrapper.module.css";

const AppWrapper = ({ children }) => {
  const { appTheme } = useAppThemeContext();
  const className = [
    classes["app-wrapper"],
    classes[`app-wrapper--${appTheme}`],
  ].join(" ");

  return <div className={className}>{children}</div>;
};

AppWrapper.displayName = "AppWrapper";

export default AppWrapper;
