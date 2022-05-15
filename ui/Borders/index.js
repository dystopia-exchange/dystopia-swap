import React, { useState } from "react";

import { useAppThemeContext } from "../AppThemeProvider";
import classes from './Borders.module.css';

const Borders = ({offsetLeft = 0, offsetRight = 0, offsetTop = 0, offsetBottom = 0}) => {
  const {appTheme} = useAppThemeContext();

  return (
    <>
      <div
        className={[
          classes.networkButtonCornerLT,
          classes[`networkButtonCornerLT--${appTheme}`],
        ].join(' ')}
        style={{
          left: offsetLeft ? offsetLeft : 0,
          top: offsetTop ? offsetTop : 0,
        }}
      >
      </div>

      <div
        className={[classes.networkButtonCornerLB, classes[`networkButtonCornerLB--${appTheme}`]].join(' ')}
        style={{
          left: offsetLeft ? offsetLeft : 0,
          bottom: offsetBottom ? offsetBottom : 0,
        }}>
      </div>

      <div
        className={[classes.networkButtonCornerRT, classes[`networkButtonCornerRT--${appTheme}`]].join(' ')}
        style={{
          top: offsetTop ? offsetTop : 0,
          right: offsetRight ? offsetRight : 0,
        }}>
      </div>

      <div
        className={[classes.networkButtonCornerRB, classes[`networkButtonCornerRB--${appTheme}`]].join(' ')}
        style={{
          right: offsetRight ? offsetRight : 0,
          bottom: offsetBottom ? offsetBottom : 0,
        }}>
      </div>
    </>
  );
};

export default Borders;
