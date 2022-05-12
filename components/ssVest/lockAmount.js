import React, { useState, useEffect } from 'react';
import { Grid, Typography, Button, TextField, InputAdornment, CircularProgress, InputBase } from '@mui/material';
import { useRouter } from 'next/router';
import BigNumber from 'bignumber.js';
import moment from 'moment';
import { formatCurrency, formatInputAmount } from '../../utils';
import classes from "./ssVest.module.css";
import stores from '../../stores';
import {
  ACTIONS,
} from '../../stores/constants';
import { useAppThemeContext } from '../../ui/AppThemeProvider';

export default function ffLockAmount({nft, govToken, updateLockAmount}) {

  const [approvalLoading, setApprovalLoading] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);

  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const lockReturned = () => {
      setLockLoading(false);
      router.push('/vest');
    };

    const errorReturned = () => {
      setApprovalLoading(false);
      setLockLoading(false);
    };

    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    stores.emitter.on(ACTIONS.INCREASE_VEST_AMOUNT_RETURNED, lockReturned);
    return () => {
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
      stores.emitter.removeListener(ACTIONS.INCREASE_VEST_AMOUNT_RETURNED, lockReturned);
    };
  }, []);

  const setAmountPercent = (percent) => {
    const val = BigNumber(govToken.balance).times(percent).div(100).toFixed(govToken.decimals);
    setAmount(val);
    updateLockAmount(val);
  };

  const onLock = () => {
    setLockLoading(true);
    stores.dispatcher.dispatch({type: ACTIONS.INCREASE_VEST_AMOUNT, content: {amount, tokenID: nft.id}});
  };

  const amountChanged = (event) => {
    const value = formatInputAmount(event.target.value.replace(',', '.'));
    setAmount(value);
    updateLockAmount(value);
  };

  const {appTheme} = useAppThemeContext();

  const renderMassiveInput = (type, amountValue, amountError, amountChanged, balance, logo) => {
    return (
      <div className={[classes.textField, classes[`textField--${appTheme}`]].join(' ')}>
        <Typography className={classes.inputTitleText} noWrap>
          {'Lock'}
        </Typography>

        <Typography className={classes.inputBalanceText} noWrap onClick={() => {
          setAmountPercent(100);
        }}>
          Balance: {balance ? ' ' + formatCurrency(balance) : ''}
        </Typography>

        <div className={`${classes.massiveInputContainer} ${(amountError) && classes.error}`}>
          <div className={classes.massiveInputAssetSelect}>
            <div className={classes.displaySelectContainer}>
              <div
                className={[classes.displayDualIconContainer, classes[`displayDualIconContainer--${appTheme}`]].join(' ')}>
                {
                  logo &&
                  <img
                    className={classes.displayAssetIcon}
                    alt=""
                    src={logo}
                    height="100px"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                    }}
                  />
                }
                {
                  !logo &&
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

          {/*<Typography
            className={[classes.smallerText, classes[`smallerText--${appTheme}`]].join(" ")}>
            {token?.symbol}
          </Typography>*/}
        </div>
      </div>
    );
  };

  return (
    <>
      {renderMassiveInput('lockAmount', amount, amountError, amountChanged, govToken?.balance, govToken?.logoURI)}

      <Button
        className={classes.buttonOverride}
        fullWidth
        variant="contained"
        size="large"
        color="primary"
        disabled={lockLoading}
        onClick={onLock}>

        <Typography
          className={classes.actionButtonText}>{lockLoading ? `Increasing Lock Amount` : `Increase Lock Amount`}
        </Typography>

        {lockLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
      </Button>
    </>
  );
}
