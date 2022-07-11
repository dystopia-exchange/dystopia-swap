import React from "react";

const Form = (props) => {
  return (
    <div className={['g-flex-column', 'g-flex--align-center'].join(' ')}>
      <form {...props} style={{ width: '100%' }}>
        {props.children}
      </form>
    </div>
  );
};

export default Form;
