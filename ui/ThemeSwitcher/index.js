import React from "react";

import DarkButton from "./DarkButton";
import LightButton from "./LightButton";

import classes from "./ThemeSwitcher.module.css";
import { useAppThemeContext } from "../AppThemeProvider";

const ThemeSwitcher = () => {
  const { appTheme } = useAppThemeContext();
  const className = [classes["wrapper"], classes[`wrapper--${appTheme}`]].join(
    " "
  );

  return (
    <div className={className}>
      <LightButton />
      <DarkButton />
    </div>
  );
};

ThemeSwitcher.displayName = "ThemeSwitcher";

export default ThemeSwitcher;
