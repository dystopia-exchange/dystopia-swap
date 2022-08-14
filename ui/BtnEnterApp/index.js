import React from "react";

const BtnEnterApp = (props) => {
  const {label, labelClassName} = props;

  return <div className={labelClassName}>{label}</div>;
};

export default BtnEnterApp;
