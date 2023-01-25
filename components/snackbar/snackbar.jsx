import { Close } from '@mui/icons-material';
import { Button, IconButton, SvgIcon, Typography } from '@mui/material';
import React, { useState } from 'react';
import { ETHERSCAN_URL } from '../../stores/constants';
import { colors } from '../../theme/coreTheme';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import classes from './snackbar.module.css';

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
    <SvgIcon style={iconStyle}>
      <path fill={color}
            d="M12,0A12,12,0,1,0,24,12,12,12,0,0,0,12,0ZM10.75,16.518,6.25,12.2l1.4-1.435L10.724,13.7l6.105-6.218L18.25,8.892Z"/>
    </SvgIcon>
  );
}

function ErrorIcon(props) {
  const {color} = props;
  return (
    <svg width="30" height="31" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20.2725 3.62479L27.3763 10.7273V20.7723L20.2725 27.876H10.2275L3.12378 20.7723V10.7273L10.2275 3.62354H20.2725V3.62479ZM13.75 19.2498V21.7498H16.25V19.2498H13.75ZM13.75 9.24978V16.7498H16.25V9.24978H13.75Z"
        fill="#DB3434"/>
    </svg>
  );
}

function WarningIcon(props) {
  const {color} = props;
  return (
    <SvgIcon style={iconStyle}>
      <path
        fill={color}
        d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z"
      />
    </SvgIcon>
  );
}

function InfoIcon(props) {
  const {color} = props;
  return (
    <SvgIcon style={iconStyle}>
      <path
        fill={color}
        d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5"
      />
    </SvgIcon>
  );
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
      icon = <SuccessIcon color={colors.blue}/>;
      color = colors.blue;
      messageType = 'Success';
      break;
    case 'Warning':
      icon = <WarningIcon color={colors.orange}/>;
      color = colors.orange;
      messageType = 'Warning';
      break;
    case 'Info':
      icon = <InfoIcon color={colors.blue}/>;
      color = colors.blue;
      messageType = 'Info';
      break;
    case 'Hash':
      icon = <SuccessIcon color={colors.blue}/>;
      color = colors.blue;
      messageType = 'Hash';

      let snackbarMessage = ETHERSCAN_URL + 'tx/' + message;
      actions = [
        <Button variant="text" size="small" onClick={() => window.open(snackbarMessage, '_blank')}>
          View
        </Button>,
        <IconButton key="close" aria-label="Close" onClick={handleClose}>
          <CloseIcon/>
        </IconButton>,
      ];
      break;
    default:
      icon = <SuccessIcon color={colors.blue}/>;
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
          <div className={[classes.transactionTopBg, classes[`transactionTopBg--${type}`]].join(' ')}>
          </div>

          <div
            className={[classes.transactionInfo, classes[`transactionInfo--${type}`], classes[`transactionInfo--${appTheme}`]].join(' ')}
            style={{
              display: 'flex',
              padding: 20,
              paddingRight: 10,
            }}>
            <div
              style={{
                width: 80,
                paddingRight: 10,
                borderRight: `1px solid ${appTheme === 'dark' ? '#5F7285' : '#86B9D6'}`,
              }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 50,
                  height: 50,
                  margin: '10px',
                  background: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
                  borderRadius: '100px',
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
                  borderBottom: `1px solid ${appTheme === 'dark' ? '#5F7285' : '#86B9D6'}`,
                  paddingBottom: 10,
                }}
                className={['g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                <Typography
                  className={[classes.transactionDescriptionTitle, classes[`transactionDescriptionTitle--${type}`]].join(' ')}>
                  General page error
                </Typography>

                <IconButton
                  onClick={handleClose}>
                  <Close
                    style={{
                      fontSize: 16,
                      cursor: 'pointer',
                      color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
                    }}/>
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
