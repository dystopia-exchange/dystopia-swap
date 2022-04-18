import React from "react";

import { useAppThemeContext } from "../AppThemeProvider";
import classes from "./Form.module.css";

const Form = (props) => {
  const {appTheme} = useAppThemeContext();

  return (
    <div className={['g-flex-column', 'g-flex--align-center'].join(' ')}>
      <div className={[classes[`top`], classes[`top--${appTheme}`]].join(' ')}>
      </div>

      <form className={[classes[`form`], classes[`form--${appTheme}`]].join(' ')} {...props}>
        {props.children}
      </form>

       {/* <div className={[classes[`bottom`], classes[`bottom--${appTheme}`]].join(' ')}>
      </div> */}
    </div>
  );
};

export default Form;
