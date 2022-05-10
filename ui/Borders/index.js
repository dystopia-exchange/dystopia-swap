import React, { useState } from "react";

import { useAppThemeContext } from "../AppThemeProvider";
import classes from './Borders.module.css';

const Borders = () => {
  const {appTheme} = useAppThemeContext();

  return (
    <>
      <div className={[classes.networkButtonCornerLT, classes[`networkButtonCornerLT--${appTheme}`]].join(' ')}>
      </div>

      <div className={[classes.networkButtonCornerLB, classes[`networkButtonCornerLB--${appTheme}`]].join(' ')}>
      </div>

      <div className={[classes.networkButtonCornerRT, classes[`networkButtonCornerRT--${appTheme}`]].join(' ')}>
      </div>

      <div className={[classes.networkButtonCornerRB, classes[`networkButtonCornerRB--${appTheme}`]].join(' ')}>
      </div>
    </>
  );
};

export default Borders;
