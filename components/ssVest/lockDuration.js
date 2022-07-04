import React, { useState, useEffect, useRef } from 'react';
import {
  Grid,
  Typography,
  Button,
  TextField,
  CircularProgress,
  RadioGroup,
  Radio,
  FormControlLabel,
  InputAdornment,
  InputBase,
} from '@mui/material';
import { useRouter } from 'next/router';
import moment from 'moment';
import BigNumber from 'bignumber.js';
import classes from "./ssVest.module.css";
import stores from '../../stores';
import {
  ACTIONS,
} from '../../stores/constants';
import { useAppThemeContext } from '../../ui/AppThemeProvider';

export default function ffLockDuration({nft, updateLockDuration}) {

  const inputEl = useRef(null);
  const [lockLoading, setLockLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState(moment().add(8, 'days').format('YYYY-MM-DD'));
  const [selectedDateError, setSelectedDateError] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);

  const router = useRouter();

  useEffect(() => {
    const lockReturned = () => {
      setLockLoading(false);
      router.push('/vest');
    };
    const errorReturned = () => {
      setLockLoading(false);
    };

    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    stores.emitter.on(ACTIONS.INCREASE_VEST_DURATION_RETURNED, lockReturned);
    return () => {
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
      stores.emitter.removeListener(ACTIONS.INCREASE_VEST_DURATION_RETURNED, lockReturned);
    };
  }, []);

  useEffect(() => {
    if (nft && nft.lockEnds) {
      setSelectedDate(moment.unix(nft.lockEnds).format('YYYY-MM-DD'));
      setSelectedValue(null);
    }
  }, [nft]);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setSelectedValue(null);

    updateLockDuration(event.target.value);
  };

  const handleChange = (value) => {
    setSelectedValue(value);

    let days = 0;
    switch (value) {
      case 'week':
        days = 8;
        break;
      case 'month':
        days = 30;
        break;
      case 'year':
        days = 365;
        break;
      case 'years':
        days = 1461;
        break;
      default:
    }
    const newDate = moment().add(days, 'days').format('YYYY-MM-DD');

    setSelectedDate(newDate);
    updateLockDuration(newDate);
  };

  const onLock = () => {
    setLockLoading(true);

    const now = moment();
    const expiry = moment(selectedDate).add(1, 'days');
    const secondsToExpire = expiry.diff(now, 'seconds');

    stores.dispatcher.dispatch({
      type: ACTIONS.INCREASE_VEST_DURATION,
      content: {unlockTime: secondsToExpire, tokenID: nft.id},
    });
  };

  const focus = () => {
    inputEl.current.focus();
  };

  let min = moment().add(7, 'days').format('YYYY-MM-DD');
  if (BigNumber(nft?.lockEnds).gt(0)) {
    min = moment.unix(nft?.lockEnds).format('YYYY-MM-DD');
  }

  const {appTheme} = useAppThemeContext();

  const renderMassiveInput = (type, amountValue, amountError, amountChanged, balance, logo) => {
    return (
      <div className={[classes.textField, classes[`textFieldDate--${appTheme}`]].join(' ')}>
        <div className={`${classes.massiveInputContainer} ${(amountError) && classes.error}`}>
          <div className={classes.massiveInputAssetSelect}>
            <div className={classes.displaySelectContainerDate}>
              <div
                className={[classes.displayDualIconContainer, classes[`displayDualIconContainer--${appTheme}`]].join(' ')}>
                <div className={classes.displayAssetIcon}></div>
              </div>
            </div>
          </div>

          <InputBase
            className={classes.massiveInputAmountDate}
            inputRef={inputEl}
            id="someDate"
            type="date"
            placeholder="Set Lock Expiry Date"
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
              Set Lock Expiry Date
          </Typography>
        </div>
      </div>
    );
  };

  return (
    <div className={classes.someContainer}>
      {renderMassiveInput('lockDuration', selectedDate, selectedDateError, handleDateChange, null, null)}

      <div
        className={[classes.vestPeriodToggle, 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
        <div
          className={[classes.vestPeriodLabel, classes[`vestPeriodLabel--${selectedValue === 'week' ? 'checked' : ''}`]].join(' ')}
          onClick={() => handleChange('week')}>
          1 week
        </div>

        <div
          className={[classes.vestPeriodLabel, classes[`vestPeriodLabel--${selectedValue === 'month' ? 'checked' : ''}`]].join(' ')}
          onClick={() => handleChange('month')}>
          1 month
        </div>

        <div
          className={[classes.vestPeriodLabel, classes[`vestPeriodLabel--${selectedValue === 'year' ? 'checked' : ''}`]].join(' ')}
          onClick={() => handleChange('year')}>
          1 year
        </div>

        <div
          className={[classes.vestPeriodLabel, classes[`vestPeriodLabel--${selectedValue === 'years' ? 'checked' : ''}`]].join(' ')}
          onClick={() => handleChange('years')}>
          4 years
        </div>
      </div>

      <Button
        className={classes.buttonOverride}
        fullWidth
        variant="contained"
        size="large"
        color="primary"
        disabled={lockLoading}
        onClick={onLock}>
        <Typography
          className={classes.actionButtonText}>{lockLoading ? `Increasing Duration` : `Increase Duration`}</Typography>
        {lockLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
      </Button>
    </div>
  );
}
