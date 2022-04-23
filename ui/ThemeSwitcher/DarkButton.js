import React, { useCallback } from "react";

import { useAppThemeContext } from "../AppThemeProvider";
import classes from "./ThemeSwitcher.module.css";

const DarkButton = (props) => {
  const { width = "14", height = "14" } = props;
  const { appTheme, setAppTheme } = useAppThemeContext();
  const fillColor = appTheme === "dark" ? "white" : "#9BC9E4";
  const className = [
    classes["theme-button"],
    classes["theme-button--moon"],
    classes[`theme-button--${appTheme}`],
  ].join(" ");

  const toggleTheme = useCallback(() => {
    setAppTheme("dark");

    localStorage.setItem('dystopia.finance-dark-mode', 'dark');
  }, [appTheme, setAppTheme]);

  return (
    <button className={className} onClick={toggleTheme}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        name="moon"
      >
        <path
          d="M4.83342 3.08329C4.8333 3.8945 5.0748 4.68736 5.52713 5.36075C5.97946 6.03414 6.62211 6.55755 7.37312 6.86421C8.12413 7.17087 8.94946 7.24689 9.74385 7.08258C10.5382 6.91826 11.2657 6.52106 11.8334 5.94163V5.99996C11.8334 9.22171 9.22183 11.8333 6.00008 11.8333C2.77833 11.8333 0.166748 9.22171 0.166748 5.99996C0.166748 2.77821 2.77833 0.166626 6.00008 0.166626H6.05842C5.66994 0.546449 5.36141 1.00019 5.15103 1.50111C4.94064 2.00203 4.83265 2.53999 4.83342 3.08329ZM1.33341 5.99996C1.33299 7.0412 1.68081 8.05267 2.32152 8.87344C2.96223 9.69421 3.85903 10.2771 4.86924 10.5294C5.87944 10.7818 6.94501 10.689 7.89641 10.2659C8.8478 9.84275 9.63036 9.11361 10.1196 8.19446C9.24892 8.39958 8.34029 8.37884 7.4799 8.13421C6.6195 7.88958 5.83588 7.42917 5.20337 6.79667C4.57087 6.16417 4.11046 5.38054 3.86583 4.52015C3.6212 3.65975 3.60046 2.75112 3.80558 1.88046C3.05867 2.27837 2.43404 2.87193 1.99856 3.59758C1.56309 4.32324 1.33317 5.15367 1.33341 5.99996Z"
          fill={fillColor}
        />
      </svg>
    </button>
  );
};

DarkButton.displayName = "DarkButton";

export default DarkButton;
