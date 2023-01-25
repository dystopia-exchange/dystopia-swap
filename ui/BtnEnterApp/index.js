import React from "react";

import { useAppThemeContext } from "../AppThemeProvider";

const BtnEnterApp = (props) => {
  const {label, labelClassName, btnColor} = props;
  const {appTheme} = useAppThemeContext();

  return (
    <>
      <svg
        width="292px"
        height="65px"
        viewBox="0 0 292 65"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <polygon id="path-ijwd1sx0ik-1" points="227 65 292 7.37235e-06 227 0 65 0 0 65"></polygon>
        </defs>
        <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
          <g id="btn-connect-wallet--light" transform="translate(-0.000004, -0.000000)">
            <rect id="Rectangle" stroke="#FFFFFF" x="10.5000038" y="10.5000002" width="271" height="44"></rect>
            <polygon
              id="Path"
              fill={btnColor()}
              points="227.000004 65.0000002 292.000004 7.525953e-06 227.000004 1.53602997e-07 65.0000038 1.53602997e-07 3.81469999e-06 65.0000002">
            </polygon>

            <g id="Clipped" transform="translate(0.000004, 0.000000)">
              <mask id="mask-ijwd1sx0ik-2" fill="white">
                <use xlinkHref="#path-ijwd1sx0ik-1"></use>
              </mask>
              <g id="Path"></g>
              <path
                d="M292,7e-06 L292.707,0.707114 L294.414,-0.999993 L292,-0.999993 L292,7e-06 Z M227,65 L227,66 L227.414,66 L227.707,65.7071 L227,65 Z M227,0 L227,-1 L227,0 Z M65,0 L65,-1 L64.5858,-1 L64.2929,-0.707107 L65,0 Z M0,65 L-0.707107,64.2929 L-2.41421,66 L0,66 L0,65 Z M291.293,-0.7071 L226.293,64.2929 L227.707,65.7071 L292.707,0.707114 L291.293,-0.7071 Z M227,1.00001 L292,1.00001 L292,-1 L227,-1 L227,1.00001 Z M227,-1 L65,-1 L65,1 L227,1 L227,-1 Z M64.292893,-0.707107 L-0.707107,64.292893 L0.707107,65.7071 L65.7071,0.707107 L64.292893,-0.707107 Z M-3.36096977e-08,66 L227,66 L227,64 L-3.36096977e-08,64 L-3.36096977e-08,66 Z"
                id="Shape" fill="#8F5AE8" fillRule="nonzero" mask="url(#mask-ijwd1sx0ik-2)"></path>
            </g>
            <polygon id="Path" fill="#8F5AE8" fillRule="nonzero"
                     points="-7.10542736e-15 46.0000002 46.0000038 3.968303e-06 4.07530999e-06 -3.55271368e-15"></polygon>
            <polygon id="Path" fill="#8F5AE8" fillRule="nonzero"
                     points="292.000004 19.0000002 246.000004 65.0000002 292.000004 65.0000002"></polygon>
          </g>
        </g>
      </svg>

      <div
        className={labelClassName}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          userSelect: "none",
          pointerEvents: "none",
        }}>
        {`${label}`}
      </div>
    </>
  );
};

export default BtnEnterApp;
