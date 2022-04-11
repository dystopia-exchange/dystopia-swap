import React from "react";

import { useAppThemeContext } from "../AppThemeProvider";
import classes from "./TopHeader.module.css";

const TopHeader = ({children}) => {
  const {appTheme} = useAppThemeContext();
  const className = [
    classes["top-header"],
    classes[`top-header--${appTheme}`],
  ].join(" ");

  return (
    <header className={[className, 'g-flex-column__item-fixed', 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
      {children}
    </header>
  );
};

TopHeader.displayName = "TopHeader";

export default TopHeader;
