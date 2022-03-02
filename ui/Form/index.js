import React from "react";

import { useAppThemeContext } from "../AppThemeProvider";
import classes from "./Form.module.css";

const Form = (props) => {
  const { appTheme } = useAppThemeContext();

  return (
    <div className={[classes[`top`], classes[`top--${appTheme}`]].join(' ')}>
      <div className={[classes[`bottom`], classes[`bottom--${appTheme}`]].join(' ')}>
        <form className={[classes[`form`], classes[`form--${appTheme}`]].join(' ')} {...props}>
          {props.children}
        </form>
      </div>
    </div>
  );
};

export default Form;
