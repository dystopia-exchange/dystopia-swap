import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Paper, Typography, Grid, IconButton, Tooltip, InputBase, Button, CircularProgress } from '@mui/material';
import classes from "./ssVest.module.css";
import moment from 'moment';
import BigNumber from 'bignumber.js';
import { ArrowBack, ArrowBackIosNew } from '@mui/icons-material';
import { formatCurrency, formatInputAmount } from '../../utils';
import VestingInfo from "./vestingInfo";
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import stores from '../../stores';
import {
  ACTIONS,
} from '../../stores/constants';
import SwapIconBg from '../../ui/SwapIconBg';

export default function existingLock({nft, govToken, veToken}) {
  const [futureNFT, setFutureNFT] = useState(null);
  const [lockLoading, setLockLoading] = useState(false);
  const [lockAmountLoading, setLockAmountLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment().add(8, 'days').format('YYYY-MM-DD'));
  const [selectedDateError, setSelectedDateError] = useState(false);
  const [selectedValue, setSelectedValue] = useState(null);
  const [amount, setAmount] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [amountError, setAmountError] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (nft && nft.lockEnds) {
      setSelectedDate(moment.unix(nft.lockEnds).format('YYYY-MM-DD'));
      setSelectedValue(null);
    }
  }, [nft]);

  const onBack = () => {
    router.push('/vest');
  };

  const updateLockAmount = (amount) => {
    if (amount === '') {
      let tmpNFT = {
        lockAmount: nft.lockAmount,
        lockValue: nft.lockValue,
        lockEnds: nft.lockEnds,
      };

      setFutureNFT(tmpNFT);
      return;
    }

    let tmpNFT = {
      lockAmount: nft.lockAmount,
      lockValue: nft.lockValue,
      lockEnds: nft.lockEnds,
    };

    const now = moment();
    const expiry = moment.unix(tmpNFT.lockEnds);
    const dayToExpire = expiry.diff(now, 'days');

    tmpNFT.lockAmount = BigNumber(nft.lockAmount).plus(amount).toFixed(18);
    tmpNFT.lockValue = BigNumber(tmpNFT.lockAmount).times(parseInt(dayToExpire) + 1).div(1460).toFixed(18);

    setFutureNFT(tmpNFT);
  };

  const updateLockDuration = (val) => {
    let tmpNFT = {
      lockAmount: nft.lockAmount,
      lockValue: nft.lockValue,
      lockEnds: nft.lockEnds,
    };

    const now = moment();
    const expiry = moment(val);
    const dayToExpire = expiry.diff(now, 'days');

    tmpNFT.lockEnds = expiry.unix();
    tmpNFT.lockValue = BigNumber(tmpNFT.lockAmount).times(parseInt(dayToExpire)).div(1460).toFixed(18);

    setFutureNFT(tmpNFT);
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

  const onLockAmount = () => {
    setLockAmountLoading(true);
    stores.dispatcher.dispatch({type: ACTIONS.INCREASE_VEST_AMOUNT, content: {amount, tokenID: nft.id}});
  };

  const setAmountPercent = (percent) => {
    const val = BigNumber(govToken.balance).times(percent).div(100).toFixed(govToken.decimals);
    setAmount(val);
    updateLockAmount(val);
  };

  const amountChanged = (event) => {
    const value = formatInputAmount(event.target.value.replace(',', '.'));
    setAmount(value);
    updateLockAmount(value);
  };

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

  const focus = () => {
    inputEl.current.focus();
  };

  const {appTheme} = useAppThemeContext();

  function LockAmount({govToken}) {
    return (
      <div className={[classes.textField, classes[`textField--${appTheme}`]].join(' ')}>
        <Typography className={classes.inputTitleText} noWrap>
          {'Lock'}
        </Typography>

        <Typography className={classes.inputBalanceText} noWrap onClick={() => {
          setAmountPercent(100);
        }}>
          Balance: {govToken?.balance ? ' ' + formatCurrency(govToken?.balance) : ''}
        </Typography>

        <div className={`${classes.massiveInputContainer} ${(amountError) && classes.error}`}>
          <div className={classes.massiveInputAssetSelect}>
            <div className={classes.displaySelectContainer}>
              <div
                className={[classes.displayDualIconContainer, classes[`displayDualIconContainer--${appTheme}`]].join(' ')}>
                <SwapIconBg/>
                {
                  govToken?.logoURI &&
                  <img
                    className={classes.displayAssetIcon}
                    alt=""
                    src={govToken?.logoURI}
                    height="100px"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                    }}
                  />
                }
                {
                  !govToken?.logoURI &&
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
            autoFocus={true}
            error={amountError}
            helperText={amountError}
            value={amount}
            onChange={amountChanged}
            disabled={lockLoading}
            inputProps={{
              className: [classes.largeInput, classes[`largeInput--${appTheme}`]].join(" "),
            }}
            InputProps={{
              disableUnderline: true,
            }}
          />
        </div>
      </div>
    );
  }

  function LockDuration({nft, updateLockDuration}) {
    let min = moment().add(7, 'days').format('YYYY-MM-DD');
    if (BigNumber(nft?.lockEnds).gt(0)) {
      min = moment.unix(nft?.lockEnds).format('YYYY-MM-DD');
    }

    return (
      <div className={classes.someContainer}>
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
              id="someDate"
              type="date"
              placeholder="Lock Expiry Date"
              error={amountError}
              helperText={amountError}
              value={selectedDate}
              onChange={handleDateChange}
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
    );
  }

  return (
    <Paper
      elevation={0}
      className={[classes.container3, classes[`container3--${appTheme}`, 'g-flex-column']].join(' ')}>
      <div
        className={[classes.titleSection, classes[`titleSection--${appTheme}`]].join(' ')}>
        <Tooltip title="Manage Existing Lock" placement="top">
          <IconButton onClick={onBack}>
            <ArrowBackIosNew className={[classes.backIcon, classes[`backIcon--${appTheme}`]].join(' ')}/>
          </IconButton>
        </Tooltip>
      </div>

      <div className={[classes[`top`], classes[`top--${appTheme}`]].join(' ')}>
      </div>

      <div className={[classes.reAddPadding3, classes[`reAddPadding3--${appTheme}`]].join(' ')}>
        <LockAmount govToken={govToken} updateLockAmount={updateLockAmount}/>

        <LockDuration nft={nft} govToken={govToken} veToken={veToken} updateLockDuration={updateLockDuration}/>
        <Typography
            className={[classes.info, classes[`info--${appTheme}`], classes[`info--lock-period`]].join(" ")}
            color="textSecondary"
        >
          Lock period should be multiples of 1 week <br/>(e.g. 28, 35, 42 days, etc.)
        </Typography>
        <VestingInfo currentNFT={nft} futureNFT={futureNFT} veToken={veToken} showVestingStructure={false}/>
      </div>

      <Button
        className={[classes.buttonOverride, classes[`buttonOverride--${appTheme}`]].join(' ')}
        fullWidth
        variant="contained"
        size="large"
        color="primary"
        disabled={lockLoading}
        onClick={onLockAmount}>

        <Typography
          className={classes.actionButtonText}>{lockLoading ? `Increasing Lock Amount` : `Increase Lock Amount`}
        </Typography>

        {lockLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
      </Button>

      <Button
        className={[classes.buttonOverride, classes[`buttonOverride--${appTheme}`]].join(' ')}
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
    </Paper>
  );
}
