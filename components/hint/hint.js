import { Popover } from '@mui/material';
import React, { useState } from 'react';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import classes from './hint.module.css';

function Hint(props) {
  const {appTheme} = useAppThemeContext();
  const {hintText, open, anchor, handleClick, handleClose, vertical = -90, fill = '#171D2D40'} = props;
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });

  return (
    <div
      style={{
        cursor: 'pointer',
        WebkitTapHighlightColor: 'rgba(255, 255, 255, 0)',
      }}
      className={['g-flex', 'g-flex--align-center', 'g-flex--justify-center'].join(' ')}
      onMouseOut={handleClose}
      onMouseOver={handleClick}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9.99984 18.3332C5.39734 18.3332 1.6665 14.6023 1.6665 9.99984C1.6665 5.39734 5.39734 1.6665 9.99984 1.6665C14.6023 1.6665 18.3332 5.39734 18.3332 9.99984C18.3332 14.6023 14.6023 18.3332 9.99984 18.3332ZM9.99984 16.6665C11.7679 16.6665 13.4636 15.9641 14.7139 14.7139C15.9641 13.4636 16.6665 11.7679 16.6665 9.99984C16.6665 8.23173 15.9641 6.53604 14.7139 5.28579C13.4636 4.03555 11.7679 3.33317 9.99984 3.33317C8.23173 3.33317 6.53604 4.03555 5.28579 5.28579C4.03555 6.53604 3.33317 8.23173 3.33317 9.99984C3.33317 11.7679 4.03555 13.4636 5.28579 14.7139C6.53604 15.9641 8.23173 16.6665 9.99984 16.6665ZM9.1665 12.4998H10.8332V14.1665H9.1665V12.4998ZM10.8332 11.129V11.6665H9.1665V10.4165C9.1665 10.1955 9.2543 9.98353 9.41058 9.82725C9.56686 9.67097 9.77882 9.58317 9.99984 9.58317C10.2366 9.58316 10.4684 9.51592 10.6684 9.38928C10.8685 9.26264 11.0284 9.08181 11.1296 8.86782C11.2309 8.65384 11.2693 8.4155 11.2404 8.18054C11.2115 7.94558 11.1165 7.72366 10.9664 7.5406C10.8163 7.35754 10.6173 7.22086 10.3925 7.14648C10.1678 7.0721 9.92653 7.06306 9.69686 7.12043C9.46718 7.17779 9.25852 7.2992 9.09514 7.47052C8.93177 7.64184 8.8204 7.85603 8.774 8.08817L7.139 7.76067C7.24036 7.25407 7.47443 6.78348 7.81727 6.39699C8.16011 6.01051 8.59944 5.72199 9.09033 5.56094C9.58122 5.39989 10.1061 5.37208 10.6112 5.48035C11.1164 5.58862 11.5838 5.8291 11.9655 6.17719C12.3473 6.52528 12.6298 6.96851 12.7841 7.46156C12.9384 7.95461 12.9591 8.47979 12.8439 8.98343C12.7287 9.48706 12.4819 9.95109 12.1286 10.3281C11.7753 10.705 11.3283 10.9814 10.8332 11.129Z"
          // fill={anchor ? (appTheme === 'dark' ? '#4CADE6' : '#0B5E8E') : (appTheme === 'dark' ? '#5F7285' : '#86B9D6')}
          fill={fill}
        />
      </svg>
      <Popover
        classes={{
          paper: [classes.popoverPaper, appTheme === "dark" ? classes['popoverPaper--dark'] : classes['popoverPaper--light']].join(' '),
        }}
        sx={{
          pointerEvents: 'none',
        }}
        disableRestoreFocus
        open={open}
        anchorEl={anchor}
        onClose={handleClose}
        anchorOrigin={{
          vertical,
          horizontal: windowWidth > 530 ? -200 : -257,
        }}>
        <div
          style={{
            position: 'relative',
          }}
          className={['g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
          {/* <svg
            style={{
              position: 'absolute',
              top: -22,
              left: -22,
            }}
            width="88"
            height="8"
            viewBox="0 0 88 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 2C0 0.895431 0.895431 0 2 0H88V2L80 8H0V2Z"
              fill={appTheme === 'dark' ? '#5F7285' : '#86B9D6'}/>
          </svg> */}

          <div
            style={{
              fontWeight: 400,
              fontSize: 16,
              lineHeight: '150%',
              color: '#E4E9F4',
              // color: appTheme === "dark" ? '#C6CDD2' : '#325569',
            }}>
            {hintText}
          </div>
        </div>
      </Popover>
    </div>
  );
}

export default Hint;
