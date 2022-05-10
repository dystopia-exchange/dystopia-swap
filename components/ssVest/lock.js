import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  RadioGroup,
  Radio,
  FormControlLabel,
  Tooltip,
  IconButton, InputBase,
} from '@mui/material';
import { useRouter } from 'next/router';
import BigNumber from 'bignumber.js';
import moment from 'moment';
import { formatCurrency } from '../../utils';
import classes from "./ssVest.module.css";
import stores from '../../stores';
import {
  ACTIONS,
} from '../../stores/constants';

import { ArrowBack, ArrowBackIosNew } from '@mui/icons-material';
import VestingInfo from "./vestingInfo";
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import SwapIconBg from '../../ui/SwapIconBg';

export default function ssLock({govToken, veToken}) {

  const inputEl = useRef(null);
  const router = useRouter();

  const [lockLoading, setLockLoading] = useState(false);

  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState(false);
  const [selectedValue, setSelectedValue] = useState('week');
  const [selectedDate, setSelectedDate] = useState(moment().add(7, 'days').format('YYYY-MM-DD'));
  const [selectedDateError, setSelectedDateError] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const lockReturned = () => {
      setLockLoading(false);
      router.push('/vest');
    };
    const errorReturned = () => {
      setLockLoading(false);
    };

    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    stores.emitter.on(ACTIONS.CREATE_VEST_RETURNED, lockReturned);
    return () => {
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
      stores.emitter.removeListener(ACTIONS.CREATE_VEST_RETURNED, lockReturned);
    };
  }, []);

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });

  const setAmountPercent = (percent) => {
    setAmount(BigNumber(govToken.balance).times(percent).div(100).toFixed(govToken.decimals));
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setSelectedValue(null);
  };

  const handleChange = (value) => {
    console.log('selectedValue', selectedValue);
    setSelectedValue(value);

    let days = 0;
    switch (value) {
      case 'week':
        days = 7;
        break;
      case 'month':
        days = 30;
        break;
      case 'year':
        days = 365;
        break;
      case 'years':
        days = 1460;
        break;
      default:
    }
    const newDate = moment().add(days, 'days').format('YYYY-MM-DD');

    setSelectedDate(newDate);
  };

  const onLock = () => {
    setAmountError(false);

    let error = false;

    if (!amount || amount === '' || isNaN(amount)) {
      setAmountError('Amount is required');
      error = true;
    } else {
      if (!govToken.balance || isNaN(govToken.balance) || BigNumber(govToken.balance).lte(0)) {
        setAmountError('Invalid balance');
        error = true;
      } else if (BigNumber(amount).lte(0)) {
        setAmountError('Invalid amount');
        error = true;
      } else if (govToken && BigNumber(amount).gt(govToken.balance)) {
        setAmountError(`Greater than your available balance`);
        error = true;
      }
    }

    if (!error) {
      setLockLoading(true);

      const now = moment();
      const expiry = moment(selectedDate).add(1, 'days');
      const secondsToExpire = expiry.diff(now, 'seconds');

      stores.dispatcher.dispatch({type: ACTIONS.CREATE_VEST, content: {amount, unlockTime: secondsToExpire}});
    }
  };

  const focus = () => {
    inputEl.current.focus();
  };

  const onAmountChanged = (event) => {
    setAmountError(false);
    setAmount(event.target.value);
  };

  const renderMassiveDateInput = (type, amountValue, amountError, amountChanged, balance, logo) => {
    return (
      <div className={[classes.textField, classes[`textFieldDate--${appTheme}`]].join(' ')}>
        <div className={`${classes.massiveInputContainer} ${(amountError) && classes.error}`}>
          <div className={classes.massiveInputAssetSelect}>
            <div className={classes.displaySelectContainerDate}>
              <div
                className={[classes.displayDualIconContainer, classes[`displayDualIconContainer--${appTheme}`]].join(' ')}>
                <SwapIconBg/>
                <div className={[classes.displayAssetIcon, classes[`displayAssetIcon--${appTheme}`]].join(' ')}/>
              </div>
            </div>
          </div>

          <InputBase
            className={classes.massiveInputAmountDate}
            inputRef={inputEl}
            id="someDate"
            type="date"
            placeholder="Lock Expiry Date"
            error={amountError}
            helperText={amountError}
            value={amountValue}
            onChange={amountChanged}
            disabled={lockLoading}
            inputProps={{
              className: [classes.largeInput, classes[`largeInput--${appTheme}`]].join(" "),
              min: moment().add(7, 'days').format('YYYY-MM-DD'),
              max: moment().add(1460, 'days').format('YYYY-MM-DD'),
            }}
            InputProps={{
              disableUnderline: true,
            }}
          />

          <Typography
            className={[classes.smallerTextDate, classes[`smallerTextDate--${appTheme}`]].join(" ")}>
            Lock Expiry Date
          </Typography>
        </div>
      </div>
    );
  };

  const renderMassiveInput = (type, amountValue, amountError, amountChanged, token) => {
    return (
      <div className={[classes.textField, classes[`textField--${appTheme}`]].join(' ')}>
        <Typography className={classes.inputTitleText} noWrap>
          {windowWidth > 530 ? 'Manage Lock' : 'Lock'}
        </Typography>

        <Typography className={classes.inputBalanceText} noWrap onClick={() => {
          setAmountPercent(100);
        }}>
          Balance: {(token && token.balance) ? ' ' + formatCurrency(token.balance) : ''}
        </Typography>

        <div className={`${classes.massiveInputContainer} ${(amountError) && classes.error}`}>
          <div className={classes.massiveInputAssetSelect}>
            <div className={classes.displaySelectContainer}>
              <div
                className={[classes.displayDualIconContainer, classes[`displayDualIconContainer--${appTheme}`]].join(' ')}>
                <SwapIconBg/>
                {
                  token && token.logoURI &&
                  <img
                    className={classes.displayAssetIcon}
                    alt=""
                    src={token.logoURI}
                    height="100px"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                    }}
                  />
                }
                {
                  !(token && token.logoURI) &&
                  <img
                    className={classes.displayAssetIcon}
                    alt=""
                    src={`/tokens/unknown-logo--${appTheme}.svg`}
                    height="100px"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                    }}
                  />
                }
              </div>
            </div>
          </div>

          <InputBase
            className={classes.massiveInputAmount}
            placeholder="0.00"
            error={amountError}
            helperText={amountError}
            value={amountValue}
            onChange={amountChanged}
            disabled={lockLoading}
            inputProps={{
              className: [classes.largeInput, classes[`largeInput--${appTheme}`]].join(" "),
            }}
            InputProps={{
              disableUnderline: true,
            }}
          />

          <Typography
            className={[classes.smallerText, classes[`smallerText--${appTheme}`]].join(" ")}>
            {token?.symbol}
          </Typography>
        </div>
      </div>
    );
  };

  const renderVestInformation = () => {
    const now = moment();
    const expiry = moment(selectedDate);
    const dayToExpire = expiry.diff(now, 'days');

    const tmpNFT = {
      lockAmount: amount,
      lockValue: BigNumber(amount).times(parseInt(dayToExpire) + 1).div(1460).toFixed(18),
      lockEnds: expiry.unix(),
    };

    return (<VestingInfo futureNFT={tmpNFT} govToken={govToken} veToken={veToken} showVestingStructure={true}/>);
  };

  const onBack = () => {
    router.push('/vest');
  };

  const {appTheme} = useAppThemeContext();

  return (
    <>
      <Paper
        elevation={0}
        className={[classes.container3, classes[`container3--${appTheme}`, 'g-flex-column']].join(' ')}>
        <div
          className={[classes.titleSection, classes[`titleSection--${appTheme}`]].join(' ')}>
          <Tooltip title="Back to Vest" placement="top">
            <IconButton onClick={onBack}>
              <ArrowBackIosNew className={[classes.backIcon, classes[`backIcon--${appTheme}`]].join(' ')}/>
            </IconButton>
          </Tooltip>
        </div>

        <div className={[classes[`top`], classes[`top--${appTheme}`]].join(' ')}>
        </div>

        <div className={[classes.reAddPadding3, classes[`reAddPadding3--${appTheme}`]].join(' ')}>
          {renderMassiveInput('amount', amount, amountError, onAmountChanged, govToken)}
          
          {amountError && <div
                style={{ marginTop: 20 }}
                className={[
                  classes.warningContainer,
                  classes[`warningContainer--${appTheme}`],
                  classes.warningContainerError].join(" ")}>
                <div className={[
                  classes.warningDivider,
                  classes.warningDividerError
                ].join(" ")}>
                </div>
                <Typography
                  className={[classes.warningError, classes[`warningText--${appTheme}`]].join(" ")}
                  align="center">{amountError}</Typography>
              </div>}

          <div>
            {renderMassiveDateInput('date', selectedDate, selectedDateError, handleDateChange, govToken?.balance, govToken?.logoURI)}

            {selectedDateError && <div
                style={{ marginTop: 20 }}
                className={[
                  classes.warningContainer,
                  classes[`warningContainer--${appTheme}`],
                  classes.warningContainerError].join(" ")}>
                <div className={[
                  classes.warningDivider,
                  classes.warningDividerError
                ].join(" ")}>
                </div>
                <Typography
                  className={[classes.warningError, classes[`warningText--${appTheme}`]].join(" ")}
                  align="center">{selectedDateError}</Typography>
              </div>}

            <div
              className={[classes.vestPeriodToggle, classes[`vestPeriodToggle--${appTheme}`], 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
              <div
                className={[classes.vestPeriodLabel, classes[`vestPeriodLabel--${appTheme}`], classes[`vestPeriodLabel--${selectedValue === 'week' ? 'checked' : ''}`]].join(' ')}
                onClick={() => handleChange('week')}>
                1 week
              </div>

              <div
                className={[classes.vestPeriodLabel, classes[`vestPeriodLabel--${appTheme}`], classes[`vestPeriodLabel--${selectedValue === 'month' ? 'checked' : ''}`]].join(' ')}
                onClick={() => handleChange('month')}>
                1 month
              </div>

              <div
                className={[classes.vestPeriodLabel, classes[`vestPeriodLabel--${appTheme}`], classes[`vestPeriodLabel--${selectedValue === 'year' ? 'checked' : ''}`]].join(' ')}
                onClick={() => handleChange('year')}>
                1 year
              </div>

              <div
                className={[classes.vestPeriodLabel, classes[`vestPeriodLabel--${appTheme}`], classes[`vestPeriodLabel--${selectedValue === 'years' ? 'checked' : ''}`]].join(' ')}
                onClick={() => handleChange('years')}>
                4 years
              </div>
            </div>
          </div>

          {renderVestInformation()}
        </div>

        <Button
          className={[classes.buttonOverride, classes[`buttonOverride--${appTheme}`]].join(' ')}
          fullWidth
          variant="contained"
          size="large"
          color="primary"
          disabled={lockLoading}
          onClick={onLock}>
          <Typography className={classes.actionButtonText}>
            {lockLoading ? `Locking` : `Lock Tokens & Get veNFT`}
          </Typography>

          {lockLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
        </Button>
      </Paper>
    </>
  );
}
