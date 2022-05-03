import React, { useState } from "react";
import { useAppThemeContext } from '../AppThemeProvider';
import { Typography } from '@mui/material';

const BtnSwap = (props) => {
  const {label, className, labelClassName, isDisabled} = props;
  const {appTheme} = useAppThemeContext();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [bgColorLight, setBgColorLight] = useState(isDisabled ? '#A3A9BA' : '#8F5AE8');
  const [bgColorDark, setBgColorDark] = useState(isDisabled ? '#7F828B' : '#8F5AE8');
  const [borderColorLight, setBorderColorLight] = useState(isDisabled ? '#D4D5DB' : '#D2D0F2');
  const [borderColorDark, setBorderColorDark] = useState(isDisabled ? '#494B51' : '#33284C');

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });

  const mouseOver = () => {
    if (isDisabled) {
      return;
    }

    setBgColorLight('#8F5AE8');
    setBorderColorLight('#C6BAF0');

    setBgColorDark('#8F5AE8');
    setBorderColorDark('#402E61');
  };

  const mouseOut = () => {
    if (isDisabled) {
      return;
    }

    setBgColorLight('#8F5AE8');
    setBorderColorLight('#D2D0F2');

    setBgColorDark('#8F5AE8');
    setBorderColorDark('#33284C');
  };

  const mouseDown = () => {
    if (isDisabled) {
      return;
    }

    setBgColorLight('#8F5AE8');
    setBorderColorLight('#B9A4EE');

    setBgColorDark('#8F5AE8');
    setBorderColorDark('#523880');
  };

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        cursor: isDisabled ? 'default' : 'pointer',
      }}
      onMouseOver={mouseOver}
      onMouseOut={mouseOut}
      onMouseDown={mouseDown}
      onMouseUp={mouseOut}>
      <>
        {windowWidth > 470 &&
          <svg
            width="292"
            height="65"
            viewBox={`0 0 292 65`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <mask id="path-1-inside-1_471_7693" fill="white">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M227 65L292 7.37235e-06L227 0H65L0 65L227 65Z"/>
            </mask>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M227 65L292 7.37235e-06L227 0H65L0 65L227 65Z"
                  fill={appTheme === 'dark' ? borderColorDark : borderColorLight}/>
            <path
              d="M292 7.37235e-06L292.707 0.707114L294.414 -0.999992L292 -0.999993V7.37235e-06ZM227 65V66H227.414L227.707 65.7071L227 65ZM227 0V-1V0ZM65 0V-1H64.5858L64.2929 -0.707107L65 0ZM0 65L-0.707107 64.2929L-2.41421 66H-3.36097e-08L0 65ZM291.293 -0.7071L226.293 64.2929L227.707 65.7071L292.707 0.707114L291.293 -0.7071ZM227 1L292 1.00001V-0.999993L227 -1V1ZM227 -1H65V1H227V-1ZM64.2929 -0.707107L-0.707107 64.2929L0.707107 65.7071L65.7071 0.707107L64.2929 -0.707107ZM-3.36097e-08 66L227 66V64L3.36097e-08 64L-3.36097e-08 66Z"
              fill={appTheme === 'dark' ? bgColorDark : bgColorLight} mask="url(#path-1-inside-1_471_7693)"/>
          </svg>
        }

        {windowWidth <= 470 &&
          <svg
            width="320px"
            height="50px"
            viewBox="0 0 320 50"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg">
            <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <rect id="Rectangle" fill={appTheme === 'dark' ? borderColorDark : borderColorLight} fill-rule="nonzero"
                    x="0.5" y="0.500001399" width="319" height="49"></rect>
              <rect id="Rectangle" stroke={appTheme === 'dark' ? bgColorDark : bgColorLight} x="0.5" y="0.500001399"
                    width="319" height="49"></rect>
              <polygon id="Path" fill={appTheme === 'dark' ? bgColorDark : bgColorLight} fill-rule="nonzero"
                       points="0 16.0000014 16 1.39876e-06 1.39876e-06 1.77635684e-15"></polygon>
              <polygon id="Path" fill={appTheme === 'dark' ? bgColorDark : bgColorLight} fill-rule="nonzero"
                       points="320 34.0000014 304 50.0000014 320 50.0000014"></polygon>
            </g>
          </svg>
        }

        <Typography
          className={labelClassName}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}>
          {label}
        </Typography>
      </>
    </div>
  );
};

export default BtnSwap;
