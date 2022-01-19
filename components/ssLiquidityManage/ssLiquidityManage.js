import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Paper, Grid, Typography, Button, TextField, InputAdornment, CircularProgress, Tooltip, IconButton } from '@material-ui/core';
import BigNumber from 'bignumber.js';
import { formatCurrency } from '../../utils';
import classes from './ssLiquidityManage.module.css';

import AddIcon from '@material-ui/icons/Add';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';

import stores from '../../stores'
import {
  ACTIONS
} from '../../stores/constants';

export default function ssLiquidityManage() {

  const router = useRouter();

  const [pair, setPair] = useState(null);

  const [ depositLoading, setDepositLoading ] = useState(false)
  const [ depositStakeLoading, setDepositStakeLoading ] = useState(false)

  const [ amount0, setAmount0 ] = useState('');
  const [ amount0Error/*, setAmount0Error*/ ] = useState(false);
  const [ amount1, setAmount1 ] = useState('');
  const [ amount1Error/*, setAmount1Error*/ ] = useState(false);

  const [ withdrawAmount, setWithdrawAmount ] = useState('');
  const [ withdrawAmount0, setWithdrawAmount0 ] = useState('');
  const [ withdrawAmount1, setWithdrawAmount1 ] = useState('');

  const [ withdrawAmount0Percent, setWithdrawAmount0Percent ] = useState('');
  const [ withdrawAmount1Percent, setWithdrawAmount1Percent ] = useState('');

  const [ activeTab, setActiveTab ] = useState('deposit')
  const [ balances, setBalances ] = useState(null)
  const [ quote, setQuote ] = useState(null)

  const [ priorityAsset, setPriorityAsset ] = useState(0)

  //might not be correct to d this every time store updates.
  const ssUpdated = async () => {
    if(router.query.address) {
      const pp = await stores.stableSwapStore.getPairByAddress(router.query.address)
      setPair(pp)
      callGetPairBalances(pp)
    }
  }

  useEffect(() => {
    const quoteAddReturned = (res) => {
      console.log('RETURNED')
      console.log(res)
      console.log(priorityAsset)
      if(priorityAsset === res.inputs.priorityAsset) {
        console.log(res)
        setQuote(res)
        if(priorityAsset === 0) {
          console.log(res.output)
          setAmount1(res.output)
        } else {
          console.log(res.output)
          setAmount0(res.output)
        }
      }
    }

    stores.emitter.on(ACTIONS.QUOTE_ADD_LIQUIDITY_RETURNED, quoteAddReturned)

    return () => {
      stores.emitter.removeListener(ACTIONS.QUOTE_ADD_LIQUIDITY_RETURNED, quoteAddReturned)
    };
  }, [priorityAsset]);

  useEffect(() => {
    const depositReturned = () => {
      setDepositLoading(false)
      setDepositStakeLoading(false)
    }

    const errorReturned = () => {
      setDepositLoading(false)
      setDepositStakeLoading(false)
    }

    const balancesReturned = (res) => {
      setBalances(res)
    }

    stores.emitter.on(ACTIONS.UPDATED, ssUpdated)
    stores.emitter.on(ACTIONS.GET_LIQUIDITY_BALANCES_RETURNED, balancesReturned)
    stores.emitter.on(ACTIONS.LIQUIDITY_ADDED, depositReturned)
    stores.emitter.on(ACTIONS.ADD_LIQUIDITY_AND_STAKED, depositReturned)
    stores.emitter.on(ACTIONS.LIQUIDITY_REMOVED, depositReturned)
    stores.emitter.on(ACTIONS.REMOVE_LIQUIDITY_AND_UNSTAKED, depositReturned)
    stores.emitter.on(ACTIONS.ERROR, errorReturned)

    ssUpdated()

    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated)
      stores.emitter.removeListener(ACTIONS.GET_LIQUIDITY_BALANCES_RETURNED, balancesReturned)
      stores.emitter.removeListener(ACTIONS.LIQUIDITY_ADDED, depositReturned)
      stores.emitter.removeListener(ACTIONS.ADD_LIQUIDITY_AND_STAKED, depositReturned)
      stores.emitter.removeListener(ACTIONS.LIQUIDITY_REMOVED, depositReturned)
      stores.emitter.removeListener(ACTIONS.REMOVE_LIQUIDITY_AND_UNSTAKED, depositReturned)
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned)
    };
  }, []);

  useEffect(async () => {
    ssUpdated()
  }, [router.query.address])

  const onBack = () => {
    router.push('/liquidity')
  }

  const callGetPairBalances = (pp) => {
    if(pp) {
      stores.dispatcher.dispatch({ type: ACTIONS.GET_LIQUIDITY_BALANCES, content: {
        pair: pp
      }})
    }
  }

  const callQuoteAddLiquidity = (amountA, amountB, pa) => {
    console.log('calling')
    stores.dispatcher.dispatch({ type: ACTIONS.QUOTE_ADD_LIQUIDITY, content: {
        pair: pair,
        token0: pair.token0,
        token1: pair.token1,
        amount0: amountA,
        amount1: amountB,
        priorityAsset: pa
      }
    })
  }

  const setAmountPercent = (input, percent) => {
    if(input === 'amount0') {
      let am = BigNumber(pair.token0.balance).times(percent).div(100).toFixed(pair.token0.decimals)
      setAmount0(am);

    } else if (input === 'amount1') {
      let am = BigNumber(pair.token1.balance).times(percent).div(100).toFixed(pair.token1.decimals)
      setAmount1(am);

    } else if (input === 'withdraw') {
      let am = BigNumber(pair.balance).times(percent).div(100).toFixed(18)
      setWithdrawAmount(am);

      if(am === '') {
        setWithdrawAmount0('')
        setWithdrawAmount1('')
      } else if(am !== '' && !isNaN(am)) {
        const totalBalances = BigNumber(pair.reserve0).plus(pair.reserve1)
        const coin0Ratio = BigNumber(pair.reserve0).div(totalBalances).toFixed(18)
        const coin1Ratio = BigNumber(pair.reserve1).div(totalBalances).toFixed(18)
        setWithdrawAmount0(BigNumber(coin0Ratio).times(am).toFixed(18))
        setWithdrawAmount1(BigNumber(coin1Ratio).times(am).toFixed(18))
      }
    } else if (input === 'withdrawAmount0') {
      setWithdrawAmount0Percent(percent)
      setWithdrawAmount0(BigNumber(pair.token0.balance).times(percent).div(100).toFixed(pair.token0.decimals));
    } else if (input === 'withdrawAmount1') {
      setWithdrawAmount1Percent(percent)
      setWithdrawAmount1(BigNumber(pair.token1.balance).times(percent).div(100).toFixed(pair.token1.decimals));
    }
  }

  const onDeposit = () => {
    setDepositLoading(true)

    stores.dispatcher.dispatch({ type: ACTIONS.ADD_LIQUIDITY, content: {
      pair: pair,
      token0: pair.token0,
      token1: pair.token1,
      amount0: amount0,
      amount1: amount1,
      minLiquidity: quote ? quote : '0'
    } })
  }

  const onDepositAndStake = () => {
    setDepositStakeLoading(true)

    stores.dispatcher.dispatch({ type: ACTIONS.ADD_LIQUIDITY_AND_STAKE, content: {
      pair: pair,
      token0: pair.token0,
      token1: pair.token1,
      amount0: amount0,
      amount1: amount1,
      minLiquidity: quote ? quote : '0'
    } })
  }

  const onWithdraw = () => {
    setDepositLoading(true)
    stores.dispatcher.dispatch({ type: ACTIONS.REMOVE_LIQUIDITY, content: {
      pair: pair,
      token0: pair.token0,
      token1: pair.token1,
      amount: withdrawAmount,
      amount0: withdrawAmount0,
      amount1: withdrawAmount1
    } })
  }

  const onUnstakeAndWithdraw = () => {
    setDepositLoading(true)
    stores.dispatcher.dispatch({ type: ACTIONS.UNSTAKE_AND_REMOVE_LIQUIDITY, content: {
      pair: pair,
      token0: pair.token0,
      token1: pair.token1,
      amount: withdrawAmount,
      amount0: withdrawAmount0,
      amount1: withdrawAmount1
    } })
  }

  const toggleDeposit = () => {
    setActiveTab('deposit')
  }

  const toggleWithdraw = () => {
    setActiveTab('withdraw')
  }

  const amount0Changed = (event) => {
    setAmount0(event.target.value)
    callQuoteAddLiquidity(event.target.value, amount1, priorityAsset)
  }

  const amount1Changed = (event) => {
    setAmount1(event.target.value)
    callQuoteAddLiquidity(amount0, event.target.value, priorityAsset)
  }

  const amount0Focused = (event) => {
    setPriorityAsset(0)
    callQuoteAddLiquidity(amount0, amount1, 0)
  }

  const amount1Focused = (event) => {
    setPriorityAsset(1)
    callQuoteAddLiquidity(amount0, amount1, 1)
  }

  const withdrawAmountChanged = (event) => {
    setWithdrawAmount(event.target.value);
    if(event.target.value === '') {
      setWithdrawAmount0('')
      setWithdrawAmount1('')
    } else if(event.target.value !== '' && !isNaN(event.target.value)) {
      const totalBalances = BigNumber(pair.token0.poolBalance).plus(pair.token1.poolBalance)
      const coin0Ratio = BigNumber(pair.token0.poolBalance).div(totalBalances).toFixed(18)
      const coin1Ratio = BigNumber(pair.token1.poolBalance).div(totalBalances).toFixed(18)
      setWithdrawAmount0(BigNumber(coin0Ratio).times(pair.virtualPrice).times(event.target.value).toFixed(18))
      setWithdrawAmount1(BigNumber(coin1Ratio).times(pair.virtualPrice).times(event.target.value).toFixed(18))
    }
  }

  const renderMediumInput = (type, value, logo, symbol) => {
    return (
      <div className={ classes.textField}>
        <div className={ classes.mediumInputContainer}>
          <div className={ classes.mediumInputAssetSelect }>
            <div className={ classes.mediumdisplaySelectContainer }>
              <div className={ classes.assetSelectMenuItem }>
                <div className={ classes.mediumdisplayDualIconContainer }>
                  {
                    logo &&
                    <img
                      className={ classes.mediumdisplayAssetIcon }
                      alt=""
                      src={ logo }
                      height='50px'
                      onError={(e)=>{e.target.onerror = null; e.target.src="/tokens/unknown-logo.png"}}
                    />
                  }
                  {
                    !logo &&
                    <img
                      className={ classes.mediumdisplayAssetIcon }
                      alt=""
                      src={ '/tokens/unknown-logo.png' }
                      height='50px'
                      onError={(e)=>{e.target.onerror = null; e.target.src="/tokens/unknown-logo.png"}}
                    />
                  }
                </div>
              </div>
            </div>
          </div>
          <div className={ classes.mediumInputAmount }>
            <TextField
              placeholder='0.00'
              fullWidth
              value={ value }
              disabled={ true }
              InputProps={{
                className: classes.mediumInput,
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  const renderMassiveInput = (type, amountValue, amountError, amountChanged, balance, logo, amountFocused) => {
    return (
      <div className={ classes.textField}>
        <div className={ classes.inputTitleContainer }>
          <div className={ classes.inputBalance }>
            <Typography className={ classes.inputBalanceText } noWrap onClick={ () => {
              setAmountPercent(type, 100)
            }}>
              Balance: { balance ? ' ' + formatCurrency(balance) : '' }
            </Typography>
          </div>
        </div>
        <div className={ `${classes.massiveInputContainer} ${ (amountError) && classes.error }` }>
          <div className={ classes.massiveInputAssetSelect }>
            <div className={ classes.displaySelectContainer }>
              <div className={ classes.assetSelectMenuItem }>
                <div className={ classes.displayDualIconContainer }>
                  {
                    logo &&
                    <img
                      className={ classes.displayAssetIcon }
                      alt=""
                      src={ logo }
                      height='100px'
                      onError={(e)=>{e.target.onerror = null; e.target.src="/tokens/unknown-logo.png"}}
                    />
                  }
                  {
                    !logo &&
                    <img
                      className={ classes.displayAssetIcon }
                      alt=""
                      src={ '/tokens/unknown-logo.png' }
                      height='100px'
                      onError={(e)=>{e.target.onerror = null; e.target.src="/tokens/unknown-logo.png"}}
                    />
                  }
                </div>
              </div>
            </div>
          </div>
          <div className={ classes.massiveInputAmount }>
            <TextField
              placeholder='0.00'
              fullWidth
              error={ amountError }
              helperText={ amountError }
              value={ amountValue }
              onChange={ amountChanged }
              onFocus={ amountFocused ? amountFocused : null }
              disabled={ depositLoading || depositStakeLoading }
              InputProps={{
                className: classes.largeInput
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  const renderDepositInformation = () => {
    return (
      <div className={ classes.depositInfoContainer }>
        <Typography className={ classes.depositInfoHeading } >Price Info</Typography>
        <div className={ classes.priceInfos}>
          <div className={ classes.priceInfo }>
            <Typography className={ classes.title } >{ formatCurrency(BigNumber(pair?.reserve0).div(pair?.reserve1)) }</Typography>
            <Typography className={ classes.text } >{ `${pair?.token0?.symbol} per ${pair?.token1?.symbol}` }</Typography>
          </div>
          <div className={ classes.priceInfo }>
            <Typography className={ classes.title } >{ formatCurrency(BigNumber(pair?.reserve1).div(pair?.reserve0)) }</Typography>
            <Typography className={ classes.text } >{ `${pair?.token1?.symbol} per ${pair?.token0?.symbol}` }</Typography>
          </div>
          <div className={ classes.priceInfo }>
            <Typography className={ classes.title } >0.000</Typography>
            <Typography className={ classes.text } >{ `$ per LP ` }</Typography>
          </div>
        </div>
      </div>
    )
  }

  const renderWithdrawInformation = () => {
    return (
      <div className={ classes.withdrawInfoContainer }>
        <Typography className={ classes.depositInfoHeading } >Price Info</Typography>
        <div className={ classes.priceInfos}>
          <div className={ classes.priceInfo }>
            <Typography className={ classes.title } >{ formatCurrency(BigNumber(pair?.reserve0).div(pair?.reserve1)) }</Typography>
            <Typography className={ classes.text } >{ `${pair?.token0?.symbol} per ${pair?.token1?.symbol}` }</Typography>
          </div>
          <div className={ classes.priceInfo }>
            <Typography className={ classes.title } >{ formatCurrency(BigNumber(pair?.reserve1).div(pair?.reserve0)) }</Typography>
            <Typography className={ classes.text } >{ `${pair?.token1?.symbol} per ${pair?.token0?.symbol}` }</Typography>
          </div>
          <div className={ classes.priceInfo }>
            <Typography className={ classes.title } >0.000</Typography>
            <Typography className={ classes.text } >{ `$ per LP ` }</Typography>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={classes.retain}>
      <Paper elevation={0} className={ classes.container }>
        <div className={classes.toggleButtons}>
          <Grid container spacing={0}>
            <Grid item lg={6} md={6} sm={6} xs={6}>
              <Paper className={ `${activeTab === 'deposit' ? classes.buttonActive : classes.button} ${ classes.topLeftButton }` } onClick={ toggleDeposit } disabled={ depositLoading }>
                <Typography variant='h5'>Deposit</Typography>
                <div className={ `${activeTab === 'deposit' ? classes.activeIcon : ''}` }></div>
              </Paper>
            </Grid>
            <Grid item lg={6} md={6} sm={6} xs={6}>
              <Paper className={ `${activeTab === 'withdraw' ? classes.buttonActive : classes.button}  ${ classes.bottomLeftButton }` } onClick={ toggleWithdraw } disabled={ depositLoading }>
                <Typography variant='h5'>Withdraw</Typography>
                <div className={ `${activeTab === 'withdraw' ? classes.activeIcon : ''}` }></div>
              </Paper>
            </Grid>
          </Grid>
        </div>
        <div className={ classes.titleSection }>
          <IconButton onClick={ onBack }>
            <ArrowBackIcon />
          </IconButton>
          <Typography className={ classes.titleText }>Manage Liquidity Pair</Typography>
        </div>
        <div className={ classes.reAddPadding }>
          <div className={ classes.inputsContainer }>
            {
              activeTab === 'deposit' &&
              <>
                { renderMassiveInput('amount0', amount0, amount0Error, amount0Changed, pair?.token0?.balance, pair?.token0?.logo, amount0Focused) }
                <div className={ classes.swapIconContainer }>
                  <div className={ classes.swapIconSubContainer }>
                    <AddIcon className={ classes.swapIcon } />
                  </div>
                </div>
                { renderMassiveInput('amount1', amount1, amount1Error, amount1Changed, pair?.token1?.balance, pair?.token1?.logo, amount1Focused) }
                { renderDepositInformation() }
              </>
            }
            {
              activeTab === 'withdraw' &&
              <>
                { renderMassiveInput('withdraw', withdrawAmount, null, withdrawAmountChanged, pair?.balance, pair?.logo) }
                <div className={ classes.swapIconContainer }>
                  <div className={ classes.swapIconSubContainer }>
                    <ArrowDownwardIcon className={ classes.swapIcon } />
                  </div>
                </div>
                <div className={ classes.receiveAssets }>
                  { renderMediumInput('withdrawAmount0', withdrawAmount0, pair?.token0?.logo, pair?.token0?.symbol) }
                  { renderMediumInput('withdrawAmount1', withdrawAmount1, pair?.token1?.logo, pair?.token1?.symbol) }
                </div>
                { renderWithdrawInformation() }
              </>
            }
          </div>
          {
            activeTab === 'deposit' &&
            <div className={ classes.actionsContainer }>
              { !(pair && pair.gauge && pair.gauge.address) &&
                  <Button
                  variant='contained'
                  size='large'
                  className={ ((amount0 === '' && amount1 === '') || depositLoading || depositStakeLoading) ? classes.multiApprovalButton : classes.buttonOverride }
                  color='primary'
                  disabled={ (amount0 === '' && amount1 === '') || depositLoading || depositStakeLoading }
                  onClick={ onDeposit }
                  >
                  <Typography className={ classes.actionButtonText }>{ depositLoading ? `Depositing` : `Deposit` }</Typography>
                  { depositLoading && <CircularProgress size={10} className={ classes.loadingCircle } /> }
                </Button>
              }
              { (pair && pair.gauge && pair.gauge.address) &&
                <Button
                  variant='contained'
                  size='large'
                  className={ ((amount0 === '' && amount1 === '') || depositLoading || depositStakeLoading) ? classes.multiApprovalButton : classes.buttonOverride }
                  color='primary'
                  disabled={ (amount0 === '' && amount1 === '') || depositLoading || depositStakeLoading }
                  onClick={ onDepositAndStake }
                  >
                  <Typography className={ classes.actionButtonText }>{ depositStakeLoading ? `Depositing` : `Deposit & Stake` }</Typography>
                  { depositStakeLoading && <CircularProgress size={10} className={ classes.loadingCircle } /> }
                </Button>
              }
            </div>
          }
          {
            activeTab === 'withdraw' &&
            <div className={ classes.actionsContainer }>
              <Button
                variant='contained'
                size='large'
                color='primary'
                className={ (depositLoading || withdrawAmount === '') ? classes.multiApprovalButton : classes.buttonOverride }
                disabled={ depositLoading || withdrawAmount === '' }
                onClick={ onWithdraw }
                >
                <Typography className={ classes.actionButtonText }>{ depositLoading ? `Withdrawing` : `Withdraw` }</Typography>
                { depositLoading && <CircularProgress size={10} className={ classes.loadingCircle } /> }
              </Button>
            </div>
          }
        </div>
      </Paper>
    </div>
  );
}