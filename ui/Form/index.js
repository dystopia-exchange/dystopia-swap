import React from "react";

import { useAppThemeContext } from "../AppThemeProvider";
import classes from "./Form.module.css";

const Form = (props) => {
  const {appTheme} = useAppThemeContext();

  return (
    <div className={['g-flex-column', 'g-flex--align-center'].join(' ')}>
      {/* <div className={[classes[`top`], classes[`top--${appTheme}`]].join(' ')}>
        <div className={[classes[`top--inside`], classes[`top--inside--${appTheme}`]].join(' ')}>
        </div>
      </div> */}

      <form className={[classes[`form`], classes[`form--${appTheme}`]].join(' ')} {...props}>
        {props.children}
      </form>

      {/* <div className={[classes[`bottom`], classes[`bottom--${appTheme}`]].join(' ')}>
        <div className={[classes[`bottom--inside`], classes[`bottom--inside--${appTheme}`]].join(' ')}>
        </div>
      </div> */}
    </div>
  );
};

export default Form;
