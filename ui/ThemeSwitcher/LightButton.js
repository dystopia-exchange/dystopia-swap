import React, { useCallback } from "react";

import { useAppThemeContext } from "../AppThemeProvider";
import classes from "./ThemeSwitcher.module.css";

const LightButton = (props) => {
  const { width = "14", height = "14" } = props;
  const { appTheme, setAppTheme } = useAppThemeContext();
  const fillColor = appTheme === "light" ? "white" : "#2D3741";
  const className = [
    classes["theme-button"],
    classes["theme-button--sun"],
    classes[`theme-button--${appTheme}`],
  ].join(" ");

  const toggleTheme = useCallback(() => {
    setAppTheme("light");

    localStorage.setItem('dystopia.finance-dark-mode', 'light');
  }, [appTheme, setAppTheme]);

  return (
    <button className={className} onClick={toggleTheme}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        name="sun"
      >
        <path
          d="M7.00004 10.5C6.07178 10.5 5.18154 10.1313 4.52517 9.47491C3.86879 8.81854 3.50004 7.9283 3.50004 7.00004C3.50004 6.07178 3.86879 5.18154 4.52517 4.52517C5.18154 3.86879 6.07178 3.50004 7.00004 3.50004C7.9283 3.50004 8.81854 3.86879 9.47491 4.52517C10.1313 5.18154 10.5 6.07178 10.5 7.00004C10.5 7.9283 10.1313 8.81854 9.47491 9.47491C8.81854 10.1313 7.9283 10.5 7.00004 10.5ZM7.00004 9.33337C7.61888 9.33337 8.21237 9.08754 8.64996 8.64996C9.08754 8.21237 9.33337 7.61888 9.33337 7.00004C9.33337 6.3812 9.08754 5.78771 8.64996 5.35012C8.21237 4.91254 7.61888 4.66671 7.00004 4.66671C6.3812 4.66671 5.78771 4.91254 5.35012 5.35012C4.91254 5.78771 4.66671 6.3812 4.66671 7.00004C4.66671 7.61888 4.91254 8.21237 5.35012 8.64996C5.78771 9.08754 6.3812 9.33337 7.00004 9.33337ZM6.41671 0.583374H7.58337V2.33337H6.41671V0.583374ZM6.41671 11.6667H7.58337V13.4167H6.41671V11.6667ZM2.05046 2.87529L2.87529 2.05046L4.11254 3.28771L3.28771 4.11254L2.05046 2.87587V2.87529ZM9.88754 10.7124L10.7124 9.88754L11.9496 11.1248L11.1248 11.9496L9.88754 10.7124ZM11.1248 2.04987L11.9496 2.87529L10.7124 4.11254L9.88754 3.28771L11.1248 2.05046V2.04987ZM3.28771 9.88754L4.11254 10.7124L2.87529 11.9496L2.05046 11.1248L3.28771 9.88754ZM13.4167 6.41671V7.58337H11.6667V6.41671H13.4167ZM2.33337 6.41671V7.58337H0.583374V6.41671H2.33337Z"
          fill={fillColor}
        />
      </svg>
    </button>
  );
};

LightButton.displayName = "LightButton";

export default LightButton;
