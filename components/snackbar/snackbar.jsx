import React, { Component, useState } from 'react';
import { Snackbar, IconButton, Button, Typography, SvgIcon } from '@mui/material';
import { colors } from '../../theme/coreTheme';
import { ETHERSCAN_URL } from '../../stores/constants';
import classes from './snackbar.module.css';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import { Close } from '@mui/icons-material';

const iconStyle = {
  fontSize: '30px',
  marginRight: '20px',
  verticalAlign: 'middle',
};

function CloseIcon(props) {
  const {color} = props;
  return (
    <SvgIcon style={{fontSize: '22px'}}>
      <path fill={color}
            d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
    </SvgIcon>
  );
}

function SuccessIcon(props) {
  const {color} = props;

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill={color} />
      <path d="M12 13.75C12.41 13.75 12.75 13.41 12.75 13V8C12.75 7.59 12.41 7.25 12 7.25C11.59 7.25 11.25 7.59 11.25 8V13C11.25 13.41 11.59 13.75 12 13.75Z" fill="#171D2D" />
      <path d="M12.92 15.6199C12.87 15.4999 12.8 15.3899 12.71 15.2899C12.61 15.1999 12.5 15.1299 12.38 15.0799C12.14 14.9799 11.86 14.9799 11.62 15.0799C11.5 15.1299 11.39 15.1999 11.29 15.2899C11.2 15.3899 11.13 15.4999 11.08 15.6199C11.03 15.7399 11 15.8699 11 15.9999C11 16.1299 11.03 16.2599 11.08 16.3799C11.13 16.5099 11.2 16.6099 11.29 16.7099C11.39 16.7999 11.5 16.8699 11.62 16.9199C11.74 16.9699 11.87 16.9999 12 16.9999C12.13 16.9999 12.26 16.9699 12.38 16.9199C12.5 16.8699 12.61 16.7999 12.71 16.7099C12.8 16.6099 12.87 16.5099 12.92 16.3799C12.97 16.2599 13 16.1299 13 15.9999C13 15.8699 12.97 15.7399 12.92 15.6199Z" fill="#171D2D" />
    </svg>
  )
}

function ErrorIcon(props) {
  const {color} = props;

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill={color} />
      <path d="M12 13.75C12.41 13.75 12.75 13.41 12.75 13V8C12.75 7.59 12.41 7.25 12 7.25C11.59 7.25 11.25 7.59 11.25 8V13C11.25 13.41 11.59 13.75 12 13.75Z" fill="#171D2D" />
      <path d="M12.92 15.6199C12.87 15.4999 12.8 15.3899 12.71 15.2899C12.61 15.1999 12.5 15.1299 12.38 15.0799C12.14 14.9799 11.86 14.9799 11.62 15.0799C11.5 15.1299 11.39 15.1999 11.29 15.2899C11.2 15.3899 11.13 15.4999 11.08 15.6199C11.03 15.7399 11 15.8699 11 15.9999C11 16.1299 11.03 16.2599 11.08 16.3799C11.13 16.5099 11.2 16.6099 11.29 16.7099C11.39 16.7999 11.5 16.8699 11.62 16.9199C11.74 16.9699 11.87 16.9999 12 16.9999C12.13 16.9999 12.26 16.9699 12.38 16.9199C12.5 16.8699 12.61 16.7999 12.71 16.7099C12.8 16.6099 12.87 16.5099 12.92 16.3799C12.97 16.2599 13 16.1299 13 15.9999C13 15.8699 12.97 15.7399 12.92 15.6199Z" fill="#171D2D" />
    </svg>
  )
}

function WarningIcon(props) {
  const {color} = props;

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill={color} />
      <path d="M12 13.75C12.41 13.75 12.75 13.41 12.75 13V8C12.75 7.59 12.41 7.25 12 7.25C11.59 7.25 11.25 7.59 11.25 8V13C11.25 13.41 11.59 13.75 12 13.75Z" fill="#171D2D" />
      <path d="M12.92 15.6199C12.87 15.4999 12.8 15.3899 12.71 15.2899C12.61 15.1999 12.5 15.1299 12.38 15.0799C12.14 14.9799 11.86 14.9799 11.62 15.0799C11.5 15.1299 11.39 15.1999 11.29 15.2899C11.2 15.3899 11.13 15.4999 11.08 15.6199C11.03 15.7399 11 15.8699 11 15.9999C11 16.1299 11.03 16.2599 11.08 16.3799C11.13 16.5099 11.2 16.6099 11.29 16.7099C11.39 16.7999 11.5 16.8699 11.62 16.9199C11.74 16.9699 11.87 16.9999 12 16.9999C12.13 16.9999 12.26 16.9699 12.38 16.9199C12.5 16.8699 12.61 16.7999 12.71 16.7099C12.8 16.6099 12.87 16.5099 12.92 16.3799C12.97 16.2599 13 16.1299 13 15.9999C13 15.8699 12.97 15.7399 12.92 15.6199Z" fill="#171D2D" />
    </svg>
  )
}

function InfoIcon(props) {
  const {color} = props;

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill={color} />
      <path d="M12 13.75C12.41 13.75 12.75 13.41 12.75 13V8C12.75 7.59 12.41 7.25 12 7.25C11.59 7.25 11.25 7.59 11.25 8V13C11.25 13.41 11.59 13.75 12 13.75Z" fill="#171D2D" />
      <path d="M12.92 15.6199C12.87 15.4999 12.8 15.3899 12.71 15.2899C12.61 15.1999 12.5 15.1299 12.38 15.0799C12.14 14.9799 11.86 14.9799 11.62 15.0799C11.5 15.1299 11.39 15.1999 11.29 15.2899C11.2 15.3899 11.13 15.4999 11.08 15.6199C11.03 15.7399 11 15.8699 11 15.9999C11 16.1299 11.03 16.2599 11.08 16.3799C11.13 16.5099 11.2 16.6099 11.29 16.7099C11.39 16.7999 11.5 16.8699 11.62 16.9199C11.74 16.9699 11.87 16.9999 12 16.9999C12.13 16.9999 12.26 16.9699 12.38 16.9199C12.5 16.8699 12.61 16.7999 12.71 16.7099C12.8 16.6099 12.87 16.5099 12.92 16.3799C12.97 16.2599 13 16.1299 13 15.9999C13 15.8699 12.97 15.7399 12.92 15.6199Z" fill="#171D2D" />
    </svg>
  )
}

function HashIcon(props) {
  const {color} = props;

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill={color} />
      <path d="M12 13.75C12.41 13.75 12.75 13.41 12.75 13V8C12.75 7.59 12.41 7.25 12 7.25C11.59 7.25 11.25 7.59 11.25 8V13C11.25 13.41 11.59 13.75 12 13.75Z" fill="#171D2D" />
      <path d="M12.92 15.6199C12.87 15.4999 12.8 15.3899 12.71 15.2899C12.61 15.1999 12.5 15.1299 12.38 15.0799C12.14 14.9799 11.86 14.9799 11.62 15.0799C11.5 15.1299 11.39 15.1999 11.29 15.2899C11.2 15.3899 11.13 15.4999 11.08 15.6199C11.03 15.7399 11 15.8699 11 15.9999C11 16.1299 11.03 16.2599 11.08 16.3799C11.13 16.5099 11.2 16.6099 11.29 16.7099C11.39 16.7999 11.5 16.8699 11.62 16.9199C11.74 16.9699 11.87 16.9999 12 16.9999C12.13 16.9999 12.26 16.9699 12.38 16.9199C12.5 16.8699 12.61 16.7999 12.71 16.7099C12.8 16.6099 12.87 16.5099 12.92 16.3799C12.97 16.2599 13 16.1299 13 15.9999C13 15.8699 12.97 15.7399 12.92 15.6199Z" fill="#171D2D" />
    </svg>
  )
}

export default function MySnackbar(props) {
  const {type, message} = props;
  const {appTheme} = useAppThemeContext();
  const [open, setOpen] = useState(props.open);

  const handleClick = () => {
    setOpen(true);
  };

  const handleClose = (event) => {
    setOpen(false);
  };

  let icon = <SuccessIcon color={colors.blue}/>;
  let color = colors.blue;
  let messageType = '';
  let actions = [
    <IconButton key="close" aria-label="Close" onClick={handleClose}>
      <CloseIcon/>
    </IconButton>,
  ];

  switch (type) {
    case 'Error':
      icon = <ErrorIcon color={colors.red}/>;
      color = colors.red;
      messageType = 'Error';
      break;
    case 'Success':
      icon = <SuccessIcon color={colors.green}/>;
      color = colors.blue;
      messageType = 'Success';
      break;
    case 'Warning':
      icon = <WarningIcon color={colors.yellow}/>;
      color = colors.orange;
      messageType = 'Warning';
      break;
    case 'Info':
      icon = <InfoIcon color={colors.blue}/>;
      color = colors.blue;
      messageType = 'Info';
      break;
    case 'Hash':
      icon = <HashIcon color={colors.blue}/>;
      color = colors.blue;
      messageType = 'Hash';

      // let snackbarMessage = ETHERSCAN_URL + 'tx/' + message;
      // actions = [
      //   <Button variant="text" size="small" onClick={() => window.open(snackbarMessage, '_blank')}>
      //     View
      //   </Button>,
      //   <IconButton key="close" aria-label="Close" onClick={handleClose}>
      //     <CloseIcon/>
      //   </IconButton>,
      // ];
      break;
    default:
      icon = <SuccessIcon color={colors.green}/>;
      color = colors.blue;
      messageType = 'Success';
      break;
  }

  return (
    /*<Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      open={state.open}
      // autoHideDuration={16000}
      onClose={handleClose}
      style={{ borderRadius: 0, backgroundColor: color, padding: 0, }}
      message={
        <div
          style={{
            padding: '18px',
            border: '0px solid ' + color,
            backgroundColor: 'none',
          }}
        >
          {icon}
          <div
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              maxWidth: '400px',
              overflowX: 'hidden',
            }}
          >
            <Typography variant="body1" style={{ fontSize: '14px', marginBottom: '6px', fontWeight: '700', color: color }}>
              {messageType}
            </Typography>
            <Typography variant="body1" style={{ fontSize: '12px' }}>
              {message}
            </Typography>
          </div>
        </div>
      }
    />*/
    <>
      {open &&
        <div className={classes.transaction}>
          {/* <div className={[classes.transactionTopBg, classes[`transactionTopBg--${type}`]].join(' ')}>
          </div> */}

          <div
            className={[classes.transactionInfo, classes[`transactionInfo--${type}`], classes[`transactionInfo--${appTheme}`]].join(' ')}
            style={{
              display: 'flex',
              padding: 26,
            }}>
            <div
              style={{
                width: 20,
                marginTop: 8,
                // paddingRight: 10,
                // borderRight: `1px solid ${appTheme === 'dark' ? '#5F7285' : '#86B9D6'}`,
              }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',

                  width: 20,
                  height: 20,
                  marginRight: 18,
                  // background: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
                  // borderRadius: '100px',
                }}>
                {icon}
              </div>
            </div>

            <div
              style={{
                width: '100%',
                paddingLeft: 10,
              }}>
              <div
                style={{
                  width: '100%',
                  marginBottom: 16,
                  // borderBottom: `1px solid ${appTheme === 'dark' ? '#5F7285' : '#86B9D6'}`,
                  // paddingBottom: 10,
                }}
                className={['g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                <Typography
                  className={[classes.transactionDescriptionTitle, classes[`transactionDescriptionTitle--${type}`]].join(' ')}>
                  General page error
                </Typography>

                <IconButton onClick={handleClose}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: 20,
                      height: 20,
                      backgroundColor: '#586586',
                      borderRadius: 5,
                    }}
                  >
                    <Close
                      style={{
                        cursor: 'pointer',
                        color: '#1e2c48',
                        fontSize: 14,
                      }}
                    />
                  </div>
                </IconButton>
              </div>

              <Typography
                className={[classes.transactionDescription, classes[`transactionDescription--${appTheme}`]].join(' ')}>
                {message}
              </Typography>
            </div>
          </div>
        </div>
      }
    </>
  );
}
