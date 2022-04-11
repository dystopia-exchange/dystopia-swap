import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Paper,
  Grid,
  Typography,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Tooltip,
  IconButton,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  Dialog, InputBase, DialogTitle, DialogContent,
} from '@mui/material';
import BigNumber from 'bignumber.js';
import { formatCurrency } from '../../utils';
import classes from './ssLiquidityManage.module.css';
import stores from '../../stores';
import {
  ACTIONS,
  CONTRACTS,
} from '../../stores/constants';
import {
  Search,
  DeleteOutline,
  ArrowBackIosNew,
  RadioButtonUnchecked,
  RadioButtonChecked,
  Close,
} from '@mui/icons-material';
import { useAppThemeContext } from '../../ui/AppThemeProvider';

export default function ssLiquidityManage() {

  const router = useRouter();
  const amount0Ref = useRef(null);
  const amount1Ref = useRef(null);

  const [pairReadOnly, setPairReadOnly] = useState(false);

  const [pair, setPair] = useState(null);
  const [veToken, setVeToken] = useState(null);

  const [depositLoading, setDepositLoading] = useState(false);
  const [stakeLoading, setStakeLoading] = useState(false);
  const [depositStakeLoading, setDepositStakeLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [amount0, setAmount0] = useState('');
  const [amount0Error, setAmount0Error] = useState(false);
  const [amount1, setAmount1] = useState('');
  const [amount1Error, setAmount1Error] = useState(false);

  const [stable, setStable] = useState(false);

  const [asset0, setAsset0] = useState(null);
  const [asset1, setAsset1] = useState(null);
  const [assetOptions, setAssetOptions] = useState([]);

  const [withdrawAsset, setWithdrawAsset] = useState(null);
  const [withdrawAassetOptions, setWithdrawAssetOptions] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAmountError, setWithdrawAmountError] = useState(false);

  const [withdrawAmount0, setWithdrawAmount0] = useState('');
  const [withdrawAmount1, setWithdrawAmount1] = useState('');

  const [withdrawAmount0Percent, setWithdrawAmount0Percent] = useState('');
  const [withdrawAmount1Percent, setWithdrawAmount1Percent] = useState('');

  const [activeTab, setActiveTab] = useState('deposit');
  const [quote, setQuote] = useState(null);
  const [withdrawQuote, setWithdrawQuote] = useState(null);

  const [priorityAsset, setPriorityAsset] = useState(0);
  const [advanced, setAdvanced] = useState(false);

  const [token, setToken] = useState(null);
  const [vestNFTs, setVestNFTs] = useState([]);

  const [slippage, setSlippage] = useState('2');
  const [slippageError, setSlippageError] = useState(false);

  const {appTheme} = useAppThemeContext();

  const ssUpdated = async () => {
    console.log(router.query.address);

    const storeAssetOptions = stores.stableSwapStore.getStore('baseAssets');
    const nfts = stores.stableSwapStore.getStore('vestNFTs');
    const veTok = stores.stableSwapStore.getStore('veToken');
    const pairs = stores.stableSwapStore.getStore('pairs');

    const onlyWithBalance = pairs.filter((ppp) => {
      return BigNumber(ppp.balance).gt(0) || (ppp.gauge && BigNumber(ppp.gauge.balance).gt(0));
    });

    setWithdrawAssetOptions(onlyWithBalance);
    setAssetOptions(storeAssetOptions);
    setVeToken(veTok);
    setVestNFTs(nfts);

    if (nfts.length > 0) {
      if (token == null) {
        setToken(nfts[0]);
      }
    }

    if (router.query.address && router.query.address !== 'create') {
      setPairReadOnly(true);

      const pp = await stores.stableSwapStore.getPairByAddress(router.query.address);
      setPair(pp);

      if (pp) {
        setWithdrawAsset(pp);
        setAsset0(pp.token0);
        setAsset1(pp.token1);
        setStable(pp.isStable);
      }

      if (pp && BigNumber(pp.balance).gt(0)) {
        setAdvanced(true);
      }
    } else {
      let aa0 = asset0;
      let aa1 = asset1;
      if (storeAssetOptions.length > 0 && asset0 == null) {
        setAsset0(storeAssetOptions[0]);
        aa0 = storeAssetOptions[0];
      }
      if (storeAssetOptions.length > 0 && asset1 == null) {
        setAsset1(storeAssetOptions[1]);
        aa1 = storeAssetOptions[1];
      }
      if (withdrawAassetOptions.length > 0 && withdrawAsset == null) {
        setWithdrawAsset(withdrawAassetOptions[1]);
      }

      if (aa0 && aa1) {
        const p = await stores.stableSwapStore.getPair(aa0.address, aa1.address, stable);
        setPair(p);
      }
    }
  };

  useEffect(() => {
    const depositReturned = () => {
      setDepositLoading(false);
      setStakeLoading(false);
      setDepositStakeLoading(false);
      setCreateLoading(false);

      setAmount0('');
      setAmount1('');
      setQuote(null);
      setWithdrawAmount('');
      setWithdrawAmount0('');
      setWithdrawAmount1('');
      setWithdrawQuote(null);

      onBack();
    };

    const createGaugeReturned = () => {
      setCreateLoading(false);
      ssUpdated();
    };

    const errorReturned = () => {
      setDepositLoading(false);
      setStakeLoading(false);
      setDepositStakeLoading(false);
      setCreateLoading(false);
    };

    const quoteAddReturned = (res) => {
      setQuote(res.output);
    };

    const quoteRemoveReturned = (res) => {
      if (!res) {
        return;
      }
      setWithdrawQuote(res.output);
      setWithdrawAmount0(res.output.amount0);
      setWithdrawAmount1(res.output.amount1);
    };

    const assetsUpdated = () => {
      setAssetOptions(stores.stableSwapStore.getStore('baseAssets'));
    };

    stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
    stores.emitter.on(ACTIONS.LIQUIDITY_ADDED, depositReturned);
    stores.emitter.on(ACTIONS.ADD_LIQUIDITY_AND_STAKED, depositReturned);
    stores.emitter.on(ACTIONS.LIQUIDITY_REMOVED, depositReturned);
    stores.emitter.on(ACTIONS.REMOVE_LIQUIDITY_AND_UNSTAKED, depositReturned);
    stores.emitter.on(ACTIONS.LIQUIDITY_STAKED, depositReturned);
    stores.emitter.on(ACTIONS.LIQUIDITY_UNSTAKED, depositReturned);
    stores.emitter.on(ACTIONS.PAIR_CREATED, depositReturned);
    stores.emitter.on(ACTIONS.QUOTE_ADD_LIQUIDITY_RETURNED, quoteAddReturned);
    stores.emitter.on(ACTIONS.QUOTE_REMOVE_LIQUIDITY_RETURNED, quoteRemoveReturned);
    stores.emitter.on(ACTIONS.CREATE_GAUGE_RETURNED, createGaugeReturned);
    stores.emitter.on(ACTIONS.BASE_ASSETS_UPDATED, assetsUpdated);
    stores.emitter.on(ACTIONS.ERROR, errorReturned);

    ssUpdated();

    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
      stores.emitter.removeListener(ACTIONS.LIQUIDITY_ADDED, depositReturned);
      stores.emitter.removeListener(ACTIONS.ADD_LIQUIDITY_AND_STAKED, depositReturned);
      stores.emitter.removeListener(ACTIONS.LIQUIDITY_REMOVED, depositReturned);
      stores.emitter.removeListener(ACTIONS.REMOVE_LIQUIDITY_AND_UNSTAKED, depositReturned);
      stores.emitter.removeListener(ACTIONS.LIQUIDITY_STAKED, depositReturned);
      stores.emitter.removeListener(ACTIONS.LIQUIDITY_UNSTAKED, depositReturned);
      stores.emitter.removeListener(ACTIONS.PAIR_CREATED, depositReturned);
      stores.emitter.removeListener(ACTIONS.QUOTE_ADD_LIQUIDITY_RETURNED, quoteAddReturned);
      stores.emitter.removeListener(ACTIONS.QUOTE_REMOVE_LIQUIDITY_RETURNED, quoteRemoveReturned);
      stores.emitter.removeListener(ACTIONS.CREATE_GAUGE_RETURNED, createGaugeReturned);
      stores.emitter.removeListener(ACTIONS.BASE_ASSETS_UPDATED, assetsUpdated);
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
    };
  }, []);

  useEffect(async () => {
    ssUpdated();
  }, [router.query.address]);

  const onBack = () => {
    router.push('/liquidity');
  };

  const callQuoteAddLiquidity = (amountA, amountB, pa, sta, pp, assetA, assetB) => {
    if (!pp) {
      return null;
    }

    let invert = false;

    //TODO: Add check that asset0.address === pp.token0, otherwise we need to invert the calcs

    let addy0 = assetA.address;
    let addy1 = assetB.address;

    if (assetA.address === 'MATIC') {
      addy0 = CONTRACTS.WFTM_ADDRESS;
    }
    if (assetB.address === 'MATIC') {
      addy1 = CONTRACTS.WFTM_ADDRESS;
    }


    if (addy1.toLowerCase() == pp.token0.address.toLowerCase() && addy0.toLowerCase() == pp.token1.address.toLowerCase()) {
      invert = true;
    }

    if (pa == 0) {
      if (amountA == '') {
        setAmount1('');
      } else {
        if (invert) {
          amountB = BigNumber(amountA).times(parseInt(pp.reserve0)).div(parseInt(pp.reserve1)).toFixed(parseInt(pp.token0.decimals) > 6 ? 6 : parseInt(pp.token0.decimals));
        } else {
          amountB = BigNumber(amountA).times(parseInt(pp.reserve1)).div(parseInt(pp.reserve0)).toFixed(parseInt(pp.token1.decimals) > 6 ? 6 : parseInt(pp.token1.decimals));
        }
        setAmount1(amountB);
      }
    }
    if (pa == 1) {
      if (amountB == '') {
        setAmount0('');
      } else {
        if (invert) {
          amountA = BigNumber(amountB).times(parseInt(pp.reserve1)).div(parseInt(pp.reserve0)).toFixed(parseInt(pp.token1.decimals) > 6 ? 6 : parseInt(pp.token1.decimals));
        } else {
          amountA = BigNumber(amountB).times(parseInt(pp.reserve0)).div(parseInt(pp.reserve1)).toFixed(parseInt(pp.token0.decimals) > 6 ? 6 : parseInt(pp.token0.decimals));
        }
        setAmount0(amountA);
      }
    }

    if (BigNumber(amountA).lte(0) || BigNumber(amountB).lte(0) || isNaN(amountA) || isNaN(amountB)) {
      return null;
    }

    stores.dispatcher.dispatch({
      type: ACTIONS.QUOTE_ADD_LIQUIDITY, content: {
        pair: pp,
        token0: pp.token0,
        token1: pp.token1,
        amount0: amountA,
        amount1: amountB,
        stable: sta,
      },
    });
  };

  const callQuoteRemoveLiquidity = (p, amount) => {
    if (!pair) {
      return null;
    }

    stores.dispatcher.dispatch({
      type: ACTIONS.QUOTE_REMOVE_LIQUIDITY, content: {
        pair: p,
        token0: p.token0,
        token1: p.token1,
        withdrawAmount: amount,
      },
    });
  };

  const handleChange = (event) => {
    setToken(event.target.value);
  };

  const onSlippageChanged = (event) => {
    if (event.target.value == '' || !isNaN(event.target.value)) {
      setSlippage(event.target.value);
    }
  };

  const setAmountPercent = (input, percent) => {
    setAmount0Error(false);
    setAmount1Error(false);

    if (input === 'amount0') {
      let am = BigNumber(asset0.balance).times(percent).div(100).toFixed(parseInt(asset0.decimals));
      setAmount0(am);
      amount0Ref.current.focus();
      callQuoteAddLiquidity(am, amount1, 0, stable, pair, asset0, asset1);

    } else if (input === 'amount1') {
      let am = BigNumber(asset1.balance).times(percent).div(100).toFixed(parseInt(asset1.decimals));
      setAmount1(am);
      amount1Ref.current.focus();
      callQuoteAddLiquidity(amount0, am, 1, stable, pair, asset0, asset1);

    } else if (input === 'withdraw') {
      let am = '';
      if (pair && pair.gauge) {
        am = BigNumber(pair.gauge.balance).times(percent).div(100).toFixed(18);
        setWithdrawAmount(am);
      } else {
        am = BigNumber(pair.balance).times(percent).div(100).toFixed(18);
        setWithdrawAmount(am);
      }

      if (am === '') {
        setWithdrawAmount0('');
        setWithdrawAmount1('');
      } else if (am !== '' && !isNaN(am)) {
        calcRemove(pair, am);
      }
    }
  };

  const onDeposit = () => {
    setAmount0Error(false);
    setAmount1Error(false);

    let error = false;

    if (!amount0 || amount0 === '' || isNaN(amount0)) {
      setAmount0Error('Amount 0 is required');
      error = true;
    } else {
      if (!asset0.balance || isNaN(asset0.balance) || BigNumber(asset0.balance).lte(0)) {
        setAmount0Error('Invalid balance');
        error = true;
      } else if (BigNumber(amount0).lte(0)) {
        setAmount0Error('Invalid amount');
        error = true;
      } else if (asset0 && BigNumber(amount0).gt(asset0.balance)) {
        setAmount0Error(`Greater than your available balance`);
        error = true;
      }
    }

    if (!amount1 || amount1 === '' || isNaN(amount1)) {
      setAmount1Error('Amount 0 is required');
      error = true;
    } else {
      if (!asset1.balance || isNaN(asset1.balance) || BigNumber(asset1.balance).lte(0)) {
        setAmount1Error('Invalid balance');
        error = true;
      } else if (BigNumber(amount1).lte(0)) {
        setAmount1Error('Invalid amount');
        error = true;
      } else if (asset1 && BigNumber(amount1).gt(asset1.balance)) {
        setAmount1Error(`Greater than your available balance`);
        error = true;
      }
    }

    if (!error) {
      setDepositLoading(true);

      stores.dispatcher.dispatch({
        type: ACTIONS.ADD_LIQUIDITY, content: {
          pair: pair,
          token0: asset0,
          token1: asset1,
          amount0: amount0,
          amount1: amount1,
          minLiquidity: quote ? quote : '0',
          slippage: (slippage && slippage) != '' ? slippage : '2',
        },
      });
    }
  };

  const onStake = () => {
    setAmount0Error(false);
    setAmount1Error(false);

    let error = false;

    if (!error) {
      setStakeLoading(true);

      stores.dispatcher.dispatch({
        type: ACTIONS.STAKE_LIQUIDITY, content: {
          pair: pair,
          token: token,
          slippage: (slippage && slippage) != '' ? slippage : '2',
        },
      });
    }
  };

  const onDepositAndStake = () => {
    setAmount0Error(false);
    setAmount1Error(false);

    let error = false;

    if (!amount0 || amount0 === '' || isNaN(amount0)) {
      setAmount0Error('Amount 0 is required');
      error = true;
    } else {
      if (!asset0.balance || isNaN(asset0.balance) || BigNumber(asset0.balance).lte(0)) {
        setAmount0Error('Invalid balance');
        error = true;
      } else if (BigNumber(amount0).lte(0)) {
        setAmount0Error('Invalid amount');
        error = true;
      } else if (asset0 && BigNumber(amount0).gt(asset0.balance)) {
        setAmount0Error(`Greater than your available balance`);
        error = true;
      }
    }

    if (!amount1 || amount1 === '' || isNaN(amount1)) {
      setAmount1Error('Amount 0 is required');
      error = true;
    } else {
      if (!asset1.balance || isNaN(asset1.balance) || BigNumber(asset1.balance).lte(0)) {
        setAmount1Error('Invalid balance');
        error = true;
      } else if (BigNumber(amount1).lte(0)) {
        setAmount1Error('Invalid amount');
        error = true;
      } else if (asset1 && BigNumber(amount1).gt(asset1.balance)) {
        setAmount1Error(`Greater than your available balance`);
        error = true;
      }
    }

    if (!error) {
      setDepositStakeLoading(true);

      stores.dispatcher.dispatch({
        type: ACTIONS.ADD_LIQUIDITY_AND_STAKE, content: {
          pair: pair,
          token0: asset0,
          token1: asset1,
          amount0: amount0,
          amount1: amount1,
          minLiquidity: quote ? quote : '0',
          token: token,
          slippage: (slippage && slippage) != '' ? slippage : '2',
        },
      });
    }
  };

  const onCreateAndStake = () => {
    setAmount0Error(false);
    setAmount1Error(false);

    let error = false;

    if (!amount0 || amount0 === '' || isNaN(amount0)) {
      setAmount0Error('Amount 0 is required');
      error = true;
    } else {
      if (!asset0.balance || isNaN(asset0.balance) || BigNumber(asset0.balance).lte(0)) {
        setAmount0Error('Invalid balance');
        error = true;
      } else if (BigNumber(amount0).lte(0)) {
        setAmount0Error('Invalid amount');
        error = true;
      } else if (asset0 && BigNumber(amount0).gt(asset0.balance)) {
        setAmount0Error(`Greater than your available balance`);
        error = true;
      }
    }

    if (!amount1 || amount1 === '' || isNaN(amount1)) {
      setAmount1Error('Amount 0 is required');
      error = true;
    } else {
      if (!asset1.balance || isNaN(asset1.balance) || BigNumber(asset1.balance).lte(0)) {
        setAmount1Error('Invalid balance');
        error = true;
      } else if (BigNumber(amount1).lte(0)) {
        setAmount1Error('Invalid amount');
        error = true;
      } else if (asset1 && BigNumber(amount1).gt(asset1.balance)) {
        setAmount1Error(`Greater than your available balance`);
        error = true;
      }
    }

    if (!asset0 || asset0 === null) {
      setAmount0Error('Asset is required');
      error = true;
    }

    if (!asset1 || asset1 === null) {
      setAmount1Error('Asset is required');
      error = true;
    }

    if (!error) {
      setCreateLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.CREATE_PAIR_AND_STAKE, content: {
          token0: asset0,
          token1: asset1,
          amount0: amount0,
          amount1: amount1,
          isStable: stable,
          token: token,
          slippage: (slippage && slippage) != '' ? slippage : '2',
        },
      });
    }
  };

  const onCreateAndDeposit = () => {
    setAmount0Error(false);
    setAmount1Error(false);

    let error = false;

    if (!amount0 || amount0 === '' || isNaN(amount0)) {
      setAmount0Error('Amount 0 is required');
      error = true;
    } else {
      if (!asset0.balance || isNaN(asset0.balance) || BigNumber(asset0.balance).lte(0)) {
        setAmount0Error('Invalid balance');
        error = true;
      } else if (BigNumber(amount0).lte(0)) {
        setAmount0Error('Invalid amount');
        error = true;
      } else if (asset0 && BigNumber(amount0).gt(asset0.balance)) {
        setAmount0Error(`Greater than your available balance`);
        error = true;
      }
    }

    if (!amount1 || amount1 === '' || isNaN(amount1)) {
      setAmount1Error('Amount 0 is required');
      error = true;
    } else {
      if (!asset1.balance || isNaN(asset1.balance) || BigNumber(asset1.balance).lte(0)) {
        setAmount1Error('Invalid balance');
        error = true;
      } else if (BigNumber(amount1).lte(0)) {
        setAmount1Error('Invalid amount');
        error = true;
      } else if (asset1 && BigNumber(amount1).gt(asset1.balance)) {
        setAmount1Error(`Greater than your available balance`);
        error = true;
      }
    }

    if (!asset0 || asset0 === null) {
      setAmount0Error('Asset is required');
      error = true;
    }

    if (!asset1 || asset1 === null) {
      setAmount1Error('Asset is required');
      error = true;
    }

    if (!error) {
      setDepositLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.CREATE_PAIR_AND_DEPOSIT, content: {
          token0: asset0,
          token1: asset1,
          amount0: amount0,
          amount1: amount1,
          isStable: stable,
          token: token,
          slippage: (slippage && slippage) != '' ? slippage : '2',
        },
      });
    }
  };

  const onWithdraw = () => {
    setWithdrawAmountError(false);

    let error = false;

    if (!withdrawAsset || withdrawAsset === null) {
      setWithdrawAmountError('Asset is required');
      error = true;
    }

    if (!error) {
      setDepositLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.REMOVE_LIQUIDITY, content: {
          pair: pair,
          token0: pair.token0,
          token1: pair.token1,
          quote: withdrawQuote,
          slippage: (slippage && slippage) != '' ? slippage : '2',
        },
      });
    }
  };

  const onUnstakeAndWithdraw = () => {
    setWithdrawAmountError(false);

    let error = false;

    if (!withdrawAmount || withdrawAmount === '' || isNaN(withdrawAmount)) {
      setWithdrawAmountError('Amount is required');
      error = true;
    } else {
      if (withdrawAsset && withdrawAsset.gauge && (!withdrawAsset.gauge.balance || isNaN(withdrawAsset.gauge.balance) || BigNumber(withdrawAsset.gauge.balance).lte(0))) {
        setWithdrawAmountError('Invalid balance');
        error = true;
      } else if (BigNumber(withdrawAmount).lte(0)) {
        setWithdrawAmountError('Invalid amount');
        error = true;
      } else if (withdrawAsset && BigNumber(withdrawAmount).gt(withdrawAsset.gauge.balance)) {
        setWithdrawAmountError(`Greater than your available balance`);
        error = true;
      }
    }

    if (!withdrawAsset || withdrawAsset === null) {
      setWithdrawAmountError('From asset is required');
      error = true;
    }

    if (!error) {
      setDepositStakeLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.UNSTAKE_AND_REMOVE_LIQUIDITY, content: {
          pair: pair,
          token0: pair.token0,
          token1: pair.token1,
          amount: withdrawAmount,
          amount0: withdrawAmount0,
          amount1: withdrawAmount1,
          quote: withdrawQuote,
          slippage: (slippage && slippage) != '' ? slippage : '2',
        },
      });
    }
  };

  const onUnstake = () => {
    setStakeLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.UNSTAKE_LIQUIDITY, content: {
        pair: pair,
        token0: pair.token0,
        token1: pair.token1,
        amount: withdrawAmount,
        amount0: withdrawAmount0,
        amount1: withdrawAmount1,
        quote: withdrawQuote,
        slippage: (slippage && slippage) != '' ? slippage : '2',
      },
    });
  };

  const onCreateGauge = () => {
    setCreateLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.CREATE_GAUGE, content: {
        pair: pair,
      },
    });
  };

  const toggleDeposit = () => {
    setActiveTab('deposit');
  };

  const toggleWithdraw = () => {
    setActiveTab('withdraw');
  };

  const amount0Changed = (event) => {
    setAmount0Error(false);
    setAmount0(event.target.value);
    callQuoteAddLiquidity(event.target.value, amount1, priorityAsset, stable, pair, asset0, asset1);
  };

  const amount1Changed = (event) => {
    setAmount1Error(false);
    setAmount1(event.target.value);
    callQuoteAddLiquidity(amount0, event.target.value, priorityAsset, stable, pair, asset0, asset1);
  };

  const amount0Focused = (event) => {
    setPriorityAsset(0);
    callQuoteAddLiquidity(amount0, amount1, 0, stable, pair, asset0, asset1);
  };

  const amount1Focused = (event) => {
    setPriorityAsset(1);
    callQuoteAddLiquidity(amount0, amount1, 1, stable, pair, asset0, asset1);
  };

  const onAssetSelect = async (type, value) => {
    if (type === 'amount0') {
      setAsset0(value);
      const p = await stores.stableSwapStore.getPair(value.address, asset1.address, stable);
      setPair(p);
      callQuoteAddLiquidity(amount0, amount1, priorityAsset, stable, p, value, asset1);
    } else if (type === 'amount1') {
      setAsset1(value);
      const p = await stores.stableSwapStore.getPair(asset0.address, value.address, stable);
      setPair(p);
      callQuoteAddLiquidity(amount0, amount1, priorityAsset, stable, p, asset0, value);
    } else if (type === 'withdraw') {
      setWithdrawAsset(value);
      const p = await stores.stableSwapStore.getPair(value.token0.address, value.token1.address, value.isStable);
      setPair(p);
      calcRemove(p, withdrawAmount);
    }
  };

  const setStab = async (val) => {
    setStable(val);
    const p = await stores.stableSwapStore.getPair(asset0.address, asset1.address, val);
    setPair(p);
    callQuoteAddLiquidity(amount0, amount1, priorityAsset, val, p, asset0, asset1);
  };

  const withdrawAmountChanged = (event) => {
    setWithdrawAmountError(false);
    setWithdrawAmount(event.target.value);
    if (event.target.value === '') {
      setWithdrawAmount0('');
      setWithdrawAmount1('');
    } else if (event.target.value !== '' && !isNaN(event.target.value)) {
      calcRemove(pair, event.target.value);
    }
  };

  const calcRemove = (pear, amount) => {
    if (!(amount && amount != '' && amount > 0)) {
      return;
    }

    callQuoteRemoveLiquidity(pear, amount);
  };

  const renderMediumInput = (type, value, logo, symbol) => {
    return (
      <div className={classes.textField}>
        <div
          className={[classes.mediumInputContainer, classes[`mediumInputContainer--${appTheme}`], classes[`mediumInputContainer--${type}`]].join(' ')}>
          <div className={classes.mediumdisplayDualIconContainer}>
            {
              logo &&
              <img
                className={classes.mediumdisplayAssetIcon}
                alt=""
                src={logo}
                height="50px"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/tokens/unknown-logo.png";
                }}
              />
            }
            {
              !logo &&
              <img
                className={classes.mediumdisplayAssetIcon}
                alt=""
                src={'/tokens/unknown-logo.png'}
                height="50px"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/tokens/unknown-logo.png";
                }}
              />
            }
          </div>

          <div className={classes.mediumInputAmountContainer}>
            <InputBase
              className={classes.mediumInputAmount}
              placeholder="0.00"
              value={value}
              disabled={true}
              inputProps={{
                className: [classes.mediumInput, classes[`mediumInput--${appTheme}`]].join(" "),
              }}
              InputProps={{
                disableUnderline: true,
              }}
            />
            <Typography color="textSecondary" className={classes.smallestText}>{symbol}</Typography>
          </div>
        </div>
      </div>
    );
  };

  const renderMassiveInput = (type, amountValue, amountError, amountChanged, assetValue, assetError, assetOptions, onAssetSelect, onFocus, inputRef) => {
    return (
      <div className={[classes.textField, classes[`textField--${type}-${appTheme}`]].join(' ')}>
        <Typography className={classes.inputTitleText} noWrap>
          {type === 'amount0' ? '1st token' : '2nd token'}
        </Typography>

        {type !== 'withdraw' &&
          <Typography className={classes.inputBalanceText} noWrap onClick={() => {
            setAmountPercent(type, 100);
          }}>
            Balance:
            {(assetValue && assetValue.balance) ?
              ' ' + formatCurrency(assetValue.balance) :
              ''
            }
          </Typography>
        }

        {type === 'withdraw' &&
          <Typography className={classes.inputBalanceText} noWrap onClick={() => {
            setAmountPercent(type, 100);
          }}>
            Balance:
            {(assetValue && assetValue.gauge && assetValue.gauge.balance) ?
              (' ' + formatCurrency(assetValue.gauge.balance)) :
              (
                (assetValue && assetValue.balance) ?
                  (' ' + formatCurrency(assetValue.balance)) :
                  '0.00'
              )
            }
          </Typography>
        }

        <div className={`${classes.massiveInputContainer} ${(amountError || assetError) && classes.error}`}>
          <div className={classes.massiveInputAssetSelect}>
            <AssetSelect type={type} value={assetValue} assetOptions={assetOptions} onSelect={onAssetSelect}/>
          </div>

          <InputBase
            className={classes.massiveInputAmount}
            placeholder="0.00"
            error={amountError}
            helperText={amountError}
            value={amountValue}
            onChange={amountChanged}
            disabled={createLoading}
            onFocus={onFocus ? onFocus : null}
            inputProps={{
              className: [classes.largeInput, classes[`largeInput--${appTheme}`]].join(" "),
            }}
            InputProps={{
              disableUnderline: true,
            }}
          />

          <Typography
            className={[classes.smallerText, classes[`smallerText--${appTheme}`]].join(" ")}>
            {assetValue?.symbol}
          </Typography>
        </div>
      </div>
    );
  };

  const renderDepositInformation = () => {
    if (!pair) {
      return (
        <div className={classes.depositInfoContainer}>
          <Typography className={classes.depositInfoHeading}>Starting Liquidity Info</Typography>
          <div className={classes.createPriceInfos}>
            <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
              <Typography className={classes.title}>
                {BigNumber(amount1).gt(0) ? formatCurrency(BigNumber(amount0).div(amount1)) : '0.00'}
              </Typography>

              <Typography className={classes.text}>
                {`${asset0?.symbol} per ${asset1?.symbol}`}
              </Typography>
            </div>
            <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
              <Typography
                className={classes.title}>{BigNumber(amount0).gt(0) ? formatCurrency(BigNumber(amount1).div(amount0)) : '0.00'}</Typography>
              <Typography className={classes.text}>{`${asset1?.symbol} per ${asset0?.symbol}`}</Typography>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className={classes.depositInfoContainer}>
          <Typography className={[classes.depositInfoHeading, classes[`depositInfoHeading--${appTheme}`]].join(' ')}>
            Reserve Info
          </Typography>

          <div className={[classes.priceInfos, classes[`priceInfos--${appTheme}`]].join(' ')}>
            <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
              <Typography className={classes.text}>
                {`${pair?.token0?.symbol}`}
              </Typography>

              <Typography className={classes.title}>
                {formatCurrency(pair?.reserve0)}
              </Typography>
            </div>

            <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
              <Typography className={classes.text}>
                {`${pair?.token1?.symbol}`}
              </Typography>

              <Typography className={classes.title}>
                {formatCurrency(pair?.reserve1)}
              </Typography>
            </div>
            {/*<div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
              {renderSmallInput('slippage', slippage, slippageError, onSlippageChanged)}
            </div>*/}
          </div>

          <Typography className={[classes.depositInfoHeading, classes[`depositInfoHeading--${appTheme}`]].join(' ')}>
            {`Your Balances - ${pair?.symbol}`}
          </Typography>

          <div className={[classes.priceInfos, classes[`priceInfos--${appTheme}`]].join(' ')}>
            <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
              <Typography className={classes.text}>
                Pooled
              </Typography>

              <Typography className={classes.title}>
                {formatCurrency(pair?.balance)}
              </Typography>
            </div>

            <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
              <Typography className={classes.text}>
                Staked
              </Typography>

              <Typography className={classes.title}>
                {formatCurrency(pair?.gauge?.balance)}
              </Typography>
            </div>
          </div>
        </div>
      );
    }
  };

  const renderWithdrawInformation = () => {
    return (
      <div className={classes.withdrawInfoContainer}>
        <Typography className={classes.depositInfoHeading}>Reserve Info</Typography>
        <div className={classes.priceInfos}>
          <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
            <Typography className={classes.text}>{`${pair?.token0?.symbol}`}</Typography>
            <Typography className={classes.title}>{formatCurrency(pair?.reserve0)}</Typography>
          </div>
          <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
            <Typography className={classes.text}>{`${pair?.token1?.symbol}`}</Typography>
            <Typography className={classes.title}>{formatCurrency(pair?.reserve1)}</Typography>
          </div>
          {/*<div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
            {renderSmallInput('slippage', slippage, slippageError, onSlippageChanged)}
          </div>*/}
        </div>
        <Typography className={classes.depositInfoHeading}>Your Balances</Typography>
        <div className={classes.priceInfos}>
          <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
            <Typography className={classes.text}>{`Pooled ${pair?.symbol}`}</Typography>
            <Typography className={classes.title}>{formatCurrency(pair?.balance)}</Typography>
          </div>
          <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
            <Typography className={classes.text}>{`Staked ${pair?.symbol} `}</Typography>
            <Typography className={classes.title}>{formatCurrency(pair?.gauge?.balance)}</Typography>
          </div>
        </div>
        <div className={classes.disclaimerContainer}>
          <div className={classes.disclaimerDivider}>
          </div>

          <Typography
            className={[classes.disclaimer, classes[`disclaimer--${appTheme}`]].join(' ')}>
            {'Please make sure to claim any rewards before withdrawing'}
          </Typography>
        </div>
      </div>
    );
  };

  const renderSmallInput = (type, amountValue, amountError, amountChanged) => {
    return (
      <div className={classes.textField}>
        <div className={classes.inputTitleContainerSlippage}>
          <div className={classes.inputBalanceSlippage}>
            <Typography className={classes.inputBalanceText} noWrap> Slippage </Typography>
          </div>
        </div>
        <div className={classes.smallInputContainer}>
          <TextField
            placeholder="0.00"
            fullWidth
            error={amountError}
            helperText={amountError}
            value={amountValue}
            onChange={amountChanged}
            disabled={depositLoading || stakeLoading || depositStakeLoading || createLoading}
            InputProps={{
              className: classes.smallInput,
              endAdornment: <InputAdornment position="end">
                %
              </InputAdornment>,
            }}
          />
        </div>
      </div>
    );
  };

  const renderMediumInputToggle = (type, value) => {
    return (
      <div className={classes.toggles}>
        <div
          className={[classes.toggleOption, classes[`toggleOption--${appTheme}`], `${stable && classes.active}`].join(' ')}
          onClick={() => {
            setStab(true);
          }}>

          {!stable &&
            <RadioButtonUnchecked
              style={{
                width: 20,
                height: 20,
                color: '#0B5E8E',
              }}/>
          }

          {stable &&
            <RadioButtonChecked
              style={{
                width: 20,
                height: 20,
                color: '#0B5E8E',
              }}/>
          }

          <Typography
            className={[classes.toggleOptionText, classes[`toggleOptionText--${appTheme}`]].join(' ')}>
            Stable
          </Typography>
        </div>

        <div
          className={[classes.toggleOption, classes[`toggleOption--${appTheme}`], `${!stable && classes.active}`].join(' ')}
          onClick={() => {
            setStab(false);
          }}>

          {stable &&
            <RadioButtonUnchecked
              style={{
                width: 20,
                height: 20,
                color: '#0B5E8E',
              }}/>
          }

          {!stable &&
            <RadioButtonChecked
              style={{
                width: 20,
                height: 20,
                color: '#0B5E8E',
              }}/>
          }

          <Typography
            className={[classes.toggleOptionText, classes[`toggleOptionText--${appTheme}`]].join(' ')}>
            Volatile
          </Typography>
        </div>
      </div>
    );
  };

  const renderTokenSelect = () => {
    return (
      <Select
        className={[classes.tokenSelect, classes[`tokenSelect--${appTheme}`]].join(' ')}
        fullWidth
        value={token}
        onChange={handleChange}
        inputProps={{
          className: appTheme === 'dark' ? classes['tokenSelectInput--dark'] : classes.tokenSelectInput,
        }}>
        {vestNFTs && vestNFTs.map((option) => {
          return (
            <MenuItem key={option.id} value={option}>
              <div className={classes.menuOption}>
                <Typography>Token #{option.id}</Typography>
                {/*<div>
                  <Typography align="right"
                              className={classes.smallerText}>{formatCurrency(option.lockValue)}</Typography>
                  <Typography color="textSecondary" className={classes.smallerText}>{veToken?.symbol}</Typography>
                </div>*/}
              </div>
            </MenuItem>
          );
        })}
      </Select>
    );
  };

  const toggleAdvanced = () => {
    setAdvanced(!advanced);
  };

  return (
    <Paper
      elevation={0}
      className={[classes.container, 'g-flex-column']}>
      <div
        className={[classes.titleSection, classes[`titleSection--${appTheme}`]].join(' ')}>
        <Tooltip title="Back to Liquidity" placement="top">
          <IconButton onClick={onBack}>
            <ArrowBackIosNew className={[classes.backIcon, classes[`backIcon--${appTheme}`]].join(' ')}/>
          </IconButton>
        </Tooltip>
      </div>

      <div className={classes.toggleButtons}>
        <Grid container spacing={0}>
          <Grid item lg={6} md={6} sm={6} xs={6}>
            <Paper
              className={`${activeTab === 'deposit' ? classes.buttonActive : classes.button} ${classes.topLeftButton} ${appTheme === 'dark' ? classes['topLeftButton--dark'] : ''}`}
              onClick={toggleDeposit}
              disabled={depositLoading}>
              <Typography
                style={{
                  fontWeight: 600,
                  fontSize: 18,
                  color: appTheme === 'dark' ? (activeTab === 'deposit' ? '#ffffff' : '#7C838A') : (activeTab === 'deposit' ? '#0A2C40' : '#5688A5'),
                }}>
                Deposit
              </Typography>
            </Paper>
          </Grid>

          <Grid item lg={6} md={6} sm={6} xs={6}>
            <Paper
              className={`${activeTab === 'withdraw' ? classes.buttonActive : classes.button} ${classes.bottomLeftButton} ${appTheme === 'dark' ? classes['bottomLeftButton--dark'] : ''}`}
              onClick={toggleWithdraw}
              disabled={depositLoading}>
              <Typography
                style={{
                  fontWeight: 600,
                  fontSize: 18,
                  color: appTheme === 'dark' ? (activeTab === 'withdraw' ? '#ffffff' : '#7C838A') : (activeTab === 'withdraw' ? '#0A2C40' : '#5688A5'),
                }}>
                Withdraw
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </div>

      <div
        className={[classes.reAddPadding, classes[`reAddPadding--${appTheme}`]].join(' ')}>
        <div className={classes.inputsContainer}>
          {
            activeTab === 'deposit' &&
            <>
              {renderMassiveInput('amount0', amount0, amount0Error, amount0Changed, asset0, null, assetOptions, onAssetSelect, amount0Focused, amount0Ref)}
              {/*<div className={ classes.swapIconContainer }>
                  <div className={ classes.swapIconSubContainer }>
                    <Add className={ classes.swapIcon } />
                  </div>
                </div>*/}
              <div className={[classes.swapIconContainer, classes[`swapIconContainer--${appTheme}`]].join(' ')}></div>
              {renderMassiveInput('amount1', amount1, amount1Error, amount1Changed, asset1, null, assetOptions, onAssetSelect, amount1Focused, amount1Ref)}
              {renderMediumInputToggle('stable', stable)}
              {renderTokenSelect()}
              {renderDepositInformation()}
            </>
          }
          {
            activeTab === 'withdraw' &&
            <>
              {renderMassiveInput('withdraw', withdrawAmount, withdrawAmountError, withdrawAmountChanged, withdrawAsset, null, withdrawAassetOptions, onAssetSelect, null, null)}
              <div
                className={[classes.swapIconContainerWithdraw, classes[`swapIconContainerWithdraw--${appTheme}`]].join(' ')}></div>
              <div className={classes.receiveAssets}>
                {renderMediumInput('withdrawAmount0', withdrawAmount0, pair?.token0?.logoURI, pair?.token0?.symbol)}
                {renderMediumInput('withdrawAmount1', withdrawAmount1, pair?.token1?.logoURI, pair?.token1?.symbol)}
              </div>
              {renderWithdrawInformation()}
            </>
          }
        </div>
        <div className={classes.advancedToggleContainer}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={advanced}
                onChange={toggleAdvanced}
                color={'primary'}
              />
            }
            className={classes.some}
            label="Advanced"
            labelPlacement="start"
          />
        </div>
      </div>

      {
        activeTab === 'deposit' &&
        <div className={classes.actionsContainer}>
          {pair == null && asset0 && asset0.isWhitelisted == true && asset1 && asset1.isWhitelisted == true &&
            <>
              <Button
                variant="contained"
                size="large"
                className={[
                  (createLoading || depositLoading) ? classes.multiApprovalButton : classes.buttonOverride,
                  (createLoading || depositLoading) ? classes[`multiApprovalButton--${appTheme}`] : classes[`buttonOverride--${appTheme}`],
                ].join(' ')}
                color="primary"
                disabled={createLoading || depositLoading}
                onClick={onCreateAndStake}
              >
                <Typography
                  className={classes.actionButtonText}>{createLoading ? `Creating` : `Create Pair & Stake`}</Typography>
                {createLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
              </Button>
              {advanced &&
                <>
                  <Button
                    variant="contained"
                    size="large"
                    className={[
                      (createLoading || depositLoading) ? classes.multiApprovalButton : classes.buttonOverride,
                      (createLoading || depositLoading) ? classes[`multiApprovalButton--${appTheme}`] : classes[`buttonOverride--${appTheme}`],
                    ].join(' ')}
                    color="primary"
                    disabled={createLoading || depositLoading}
                    onClick={onCreateAndDeposit}
                  >
                    <Typography
                      className={classes.actionButtonText}>{depositLoading ? `Depositing` : `Create Pair & Deposit`}</Typography>
                    {depositLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
                  </Button>
                </>
              }
            </>
          }
          {pair == null && !(asset0 && asset0.isWhitelisted == true && asset1 && asset1.isWhitelisted == true) &&
            <>
              <Button
                variant="contained"
                size="large"
                className={[
                  (createLoading || depositLoading) ? classes.multiApprovalButton : classes.buttonOverride,
                  (createLoading || depositLoading) ? classes[`multiApprovalButton--${appTheme}`] : classes[`buttonOverride--${appTheme}`],
                ].join(' ')}
                color="primary"
                disabled={createLoading || depositLoading}
                onClick={onCreateAndDeposit}
              >
                <Typography
                  className={classes.actionButtonText}>{depositLoading ? `Depositing` : `Create Pair & Deposit`}</Typography>
                {depositLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
              </Button>
            </>
          }
          { // There is no Gauge on the pair yet. Can only deposit
            pair && !(pair && pair.gauge && pair.gauge.address) &&
            <>
              <Button
                variant="contained"
                size="large"
                className={[
                  ((amount0 === '' && amount1 === '') || depositLoading || stakeLoading || depositStakeLoading) ? classes.multiApprovalButton : classes.buttonOverride,
                  ((amount0 === '' && amount1 === '') || depositLoading || stakeLoading || depositStakeLoading) ? classes[`multiApprovalButton--${appTheme}`] : classes[`buttonOverride--${appTheme}`],
                ].join(' ')}
                color="primary"
                disabled={(amount0 === '' && amount1 === '') || depositLoading || stakeLoading || depositStakeLoading}
                onClick={onDeposit}
              >
                <Typography
                  className={classes.actionButtonText}>{depositLoading ? `Depositing` : `Deposit`}</Typography>
                {depositLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
              </Button>
              {pair.token0.isWhitelisted && pair.token1.isWhitelisted &&
                <Button
                  variant="contained"
                  size="large"
                  className={[
                    (createLoading || depositLoading || stakeLoading || depositStakeLoading) ? classes.multiApprovalButton : classes.buttonOverride,
                    (createLoading || depositLoading || stakeLoading || depositStakeLoading) ? classes[`multiApprovalButton--${appTheme}`] : classes[`buttonOverride--${appTheme}`],
                  ].join(' ')}
                  color="primary"
                  disabled={createLoading || depositLoading || stakeLoading || depositStakeLoading}
                  onClick={onCreateGauge}
                >
                  <Typography
                    className={classes.actionButtonText}>{createLoading ? `Creating` : `Create Gauge`}</Typography>
                  {createLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
                </Button>
              }
            </>
          }
          { // There is a Gauge on the pair. Can deposit and stake
            pair && (pair && pair.gauge && pair.gauge.address) &&
            <>
              <Button
                className={classes.buttonDeposit}
                variant="contained"
                size="large"
                className={[
                  ((amount0 === '' && amount1 === '') || depositLoading || stakeLoading || depositStakeLoading) ? classes.multiApprovalButton : classes.buttonOverride,
                  ((amount0 === '' && amount1 === '') || depositLoading || stakeLoading || depositStakeLoading) ? classes[`multiApprovalButton--${appTheme}`] : classes[`buttonOverride--${appTheme}`],
                ].join(' ')}
                color="primary"
                disabled={(amount0 === '' && amount1 === '') || depositLoading || stakeLoading || depositStakeLoading}
                onClick={onDepositAndStake}
              >
                <Typography
                  className={classes.actionButtonText}>{depositStakeLoading ? `Depositing` : `Deposit & Stake`}</Typography>
                {depositStakeLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
              </Button>
              {advanced &&
                <>
                  <Button
                    className={classes.buttonDeposit}
                    variant="contained"
                    size="large"
                    className={[
                      ((amount0 === '' && amount1 === '') || depositLoading || stakeLoading || depositStakeLoading) ? classes.multiApprovalButton : classes.buttonOverride,
                      ((amount0 === '' && amount1 === '') || depositLoading || stakeLoading || depositStakeLoading) ? classes[`multiApprovalButton--${appTheme}`] : classes[`buttonOverride--${appTheme}`],
                    ].join(' ')}
                    color="primary"
                    disabled={(amount0 === '' && amount1 === '') || depositLoading || stakeLoading || depositStakeLoading}
                    onClick={onDeposit}
                  >
                    <Typography
                      className={classes.actionButtonText}>{depositLoading ? `Depositing` : `Deposit LP`}</Typography>
                    {depositLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    className={[
                      (BigNumber(pair.balance).eq(0) || depositLoading || stakeLoading || depositStakeLoading) ? classes.multiApprovalButton : classes.buttonOverride,
                      (BigNumber(pair.balance).eq(0) || depositLoading || stakeLoading || depositStakeLoading) ? classes[`multiApprovalButton--${appTheme}`] : classes[`buttonOverride--${appTheme}`],
                    ].join(' ')}
                    color="primary"
                    disabled={BigNumber(pair.balance).eq(0) || depositLoading || stakeLoading || depositStakeLoading}
                    onClick={onStake}
                  >
                    <Typography
                      className={classes.actionButtonText}>{BigNumber(pair.balance).gt(0) ? (stakeLoading ? `Staking` : `Stake ${formatCurrency(pair.balance)} LP`) : `Nothing Unstaked`}</Typography>
                    {stakeLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
                  </Button>
                </>
              }
            </>
          }
        </div>
      }
      {
        activeTab === 'withdraw' &&
        <div className={classes.actionsContainer}>
          {
            !(pair && pair.gauge && pair.gauge.address) &&
            <Button
              variant="contained"
              size="large"
              color="primary"
              className={[
                (depositLoading || withdrawAmount === '') ? classes.multiApprovalButton : classes.buttonOverride,
                (depositLoading || withdrawAmount === '') ? classes[`multiApprovalButton--${appTheme}`] : classes[`buttonOverride--${appTheme}`],
              ].join(' ')}
              disabled={depositLoading || withdrawAmount === ''}
              onClick={onWithdraw}
            >
              <Typography
                className={classes.actionButtonText}>{depositLoading ? `Withdrawing` : `Withdraw`}</Typography>
              {depositLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
            </Button>
          }
          {
            (pair && pair.gauge && pair.gauge.address) &&
            <>
              <Button
                variant="contained"
                size="large"
                color="primary"
                className={[
                  (depositLoading || stakeLoading || depositStakeLoading || withdrawAmount === '') ? classes.multiApprovalButton : classes.buttonOverride,
                  (depositLoading || stakeLoading || depositStakeLoading || withdrawAmount === '') ? classes[`multiApprovalButton--${appTheme}`] : classes[`buttonOverride--${appTheme}`],
                ].join(' ')}
                disabled={depositLoading || stakeLoading || depositStakeLoading || withdrawAmount === ''}
                onClick={onUnstakeAndWithdraw}
              >
                <Typography
                  className={classes.actionButtonText}>{depositStakeLoading ? `Withdrawing` : `Unstake and Withdraw`}</Typography>
                {depositStakeLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
              </Button>
              {advanced &&
                <>
                  <Button
                    variant="contained"
                    size="large"
                    className={[
                      (withdrawAmount === '' || depositLoading || stakeLoading || depositStakeLoading) ? classes.multiApprovalButton : classes.buttonOverride,
                      (withdrawAmount === '' || depositLoading || stakeLoading || depositStakeLoading) ? classes[`multiApprovalButton--${appTheme}`] : classes[`buttonOverride--${appTheme}`],
                    ].join(' ')}
                    color="primary"
                    disabled={withdrawAmount === '' || depositLoading || stakeLoading || depositStakeLoading}
                    onClick={onUnstake}
                  >
                    <Typography
                      className={classes.actionButtonText}>{stakeLoading ? `Unstaking` : `Unstake LP`}</Typography>
                    {stakeLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    className={[
                      (BigNumber(pair.balance).eq(0) || depositLoading || stakeLoading || depositStakeLoading) ? classes.multiApprovalButton : classes.buttonOverride,
                      (BigNumber(pair.balance).eq(0) || depositLoading || stakeLoading || depositStakeLoading) ? classes[`multiApprovalButton--${appTheme}`] : classes[`buttonOverride--${appTheme}`],
                    ].join(' ')}
                    color="primary"
                    disabled={BigNumber(pair.balance).eq(0) || depositLoading || stakeLoading || depositStakeLoading}
                    onClick={onWithdraw}
                  >
                    <Typography
                      className={classes.actionButtonText}>{BigNumber(pair.balance).gt(0) ? (depositLoading ? `Withdrawing` : `Withdraw ${formatCurrency(pair.balance)} LP`) : `Nothing Unstaked`}</Typography>
                    {depositLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
                  </Button>
                </>
              }
            </>
          }
        </div>
      }
    </Paper>
  );
}


function AssetSelect({type, value, assetOptions, onSelect, disabled}) {

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredAssetOptions, setFilteredAssetOptions] = useState([]);

  const [manageLocal, setManageLocal] = useState(false);

  const {appTheme} = useAppThemeContext();

  const openSearch = () => {
    if (disabled) {
      return false;
    }
    setSearch('');
    setOpen(true);
  };

  useEffect(async function () {

    let ao = assetOptions.filter((asset) => {
      if (search && search !== '') {
        return asset.address.toLowerCase().includes(search.toLowerCase()) ||
          asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
          asset.name.toLowerCase().includes(search.toLowerCase());
      } else {
        return true;
      }
    }).sort((a, b) => {
      if (BigNumber(a.balance).lt(b.balance)) return 1;
      if (BigNumber(a.balance).gt(b.balance)) return -1;
      if (a.symbol < b.symbol) return -1;
      if (a.symbol > b.symbol) return 1;
      return 0;
    });

    setFilteredAssetOptions(ao);

    //no options in our default list and its an address we search for the address
    if (ao.length === 0 && search && search.length === 42) {
      const baseAsset = await stores.stableSwapStore.getBaseAsset(event.target.value, true, true);
    }

    return () => {
    };
  }, [assetOptions, search]);


  const onSearchChanged = async (event) => {
    setSearch(event.target.value);
  };

  const onLocalSelect = (type, asset) => {
    setSearch('');
    setManageLocal(false);
    setOpen(false);
    onSelect(type, asset);
  };

  const onClose = () => {
    setManageLocal(false);
    setSearch('');
    setOpen(false);
  };

  const toggleLocal = () => {
    setManageLocal(!manageLocal);
  };

  const deleteOption = (token) => {
    stores.stableSwapStore.removeBaseAsset(token);
  };

  const viewOption = (token) => {
    window.open(`${ETHERSCAN_URL}token/${token.address}`, '_blank');
  };

  const renderManageOption = (type, asset, idx) => {
    return (
      <MenuItem
        val={asset.address} key={asset.address + '_' + idx}
        className={[classes.assetSelectMenu, classes[`assetSelectMenu--${appTheme}`]].join(' ')}>
        <div className={classes.assetSelectMenuItem}>
          <div className={classes.displayDualIconContainerSmall}>
            <img
              className={[classes.assetOptionIcon, classes[`assetOptionIcon--${appTheme}`]].join(' ')}
              alt=""
              src={asset ? `${asset.logoURI}` : ''}
              height="60px"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/tokens/unknown-logo.png";
              }}
            />
          </div>
        </div>
        <div className={classes.assetSelectIconName}>
          <Typography variant="h5">{asset ? asset.symbol : ''}</Typography>
          <Typography variant="subtitle1" color="textSecondary">{asset ? asset.name : ''}</Typography>
        </div>
        <div className={classes.assetSelectActions}>
          <IconButton onClick={() => {
            deleteOption(asset);
          }}>
            <DeleteOutline/>
          </IconButton>
          <IconButton onClick={() => {
            viewOption(asset);
          }}>
            ↗
          </IconButton>
        </div>
      </MenuItem>
    );
  };

  const renderAssetOption = (type, asset, idx) => {
    return (
      <MenuItem
        val={asset.address}
        key={asset.address + '_' + idx}
        className={[classes.assetSelectMenu, classes[`assetSelectMenu--${appTheme}`]].join(' ')}
        onClick={() => {
          onLocalSelect(type, asset);
        }}>
        <div className={classes.assetSelectMenuItem}>
          <div className={classes.displayDualIconContainerSmall}>
            <img
              className={[classes.assetOptionIcon, classes[`assetOptionIcon--${appTheme}`]].join(' ')}
              alt=""
              src={asset ? `${asset.logoURI}` : ''}
              height="60px"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/tokens/unknown-logo.png";
              }}
            />
          </div>
        </div>
        <div className={classes.assetSelectIconName}>
          <Typography
            variant="h5"
            style={{
              fontWeight: 500,
              fontSize: 18,
              lineHeight: '120%',
              color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
            }}>
            {asset ? asset.symbol : ''}
          </Typography>

          <Typography
            variant="subtitle1"
            style={{
              fontWeight: 400,
              fontSize: 14,
              lineHeight: '120%',
              color: appTheme === "dark" ? '#7C838A' : '#5688A5',
            }}>
            {asset ? asset.name : ''}
          </Typography>
        </div>

        <div className={classes.assetSelectBalance}>
          <Typography
            variant="h5"
            style={{
              fontWeight: 500,
              fontSize: 14,
              lineHeight: '120%',
              color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
            }}>
            {(asset && asset.balance) ? formatCurrency(asset.balance) : '0.00'}
          </Typography>

          <Typography
            variant="subtitle1"
            style={{
              fontWeight: 400,
              fontSize: 14,
              lineHeight: '120%',
              color: appTheme === "dark" ? '#7C838A' : '#5688A5',
            }}>
            {'Balance'}
          </Typography>
        </div>
      </MenuItem>
    );
  };

  const renderManageLocal = () => {
    return (
      <>
        <div className={classes.searchInline}>
          <TextField
            autoFocus
            variant="outlined"
            fullWidth
            placeholder="Search by name or paste address"
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              style: {
                background: 'transparent',
                border: '1px solid',
                borderColor: appTheme === "dark" ? '#5F7285' : '#86B9D6',
                borderRadius: 0,
              },
              classes: {
                root: classes.searchInput,
              },
              startAdornment: <InputAdornment position="start">
                <Search style={{
                  color: appTheme === "dark" ? '#4CADE6' : '#0B5E8E',
                }}/>
              </InputAdornment>,
            }}
            inputProps={{
              style: {
                padding: '10px',
                borderRadius: 0,
                border: 'none',
                fontSize: '14px',
                lineHeight: '120%',
                color: '#86B9D6',
              },
            }}
          />
        </div>

        <div className={classes.assetSearchResults}>
          {
            filteredAssetOptions ? filteredAssetOptions.filter((option) => {
              return option.local === true;
            }).map((asset, idx) => {
              return renderManageOption(type, asset, idx);
            }) : []
          }
        </div>

        <div className={classes.manageLocalContainer}>
          <Button
            onClick={toggleLocal}>
            Back to Assets
          </Button>
        </div>
      </>
    );
  };

  const renderOptions = () => {
    return (
      <>
        <div className={classes.searchInline}>
          <TextField
            autoFocus
            variant="outlined"
            fullWidth
            placeholder="Search by name or paste address"
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              style: {
                background: 'transparent',
                border: '1px solid',
                borderColor: appTheme === "dark" ? '#5F7285' : '#86B9D6',
                borderRadius: 0,
              },
              classes: {
                root: classes.searchInput,
              },
              startAdornment: <InputAdornment position="start">
                <Search style={{
                  color: appTheme === "dark" ? '#4CADE6' : '#0B5E8E',
                }}/>
              </InputAdornment>,
            }}
            inputProps={{
              style: {
                padding: '10px',
                borderRadius: 0,
                border: 'none',
                fontSize: '14px',
                lineHeight: '120%',
                color: '#86B9D6',
              },
            }}
          />
        </div>
        <div className={[classes.assetSearchResults, classes[`assetSearchResults--${appTheme}`]].join(' ')}>
          {
            filteredAssetOptions ? filteredAssetOptions.sort((a, b) => {
              if (BigNumber(a.balance).lt(b.balance)) return 1;
              if (BigNumber(a.balance).gt(b.balance)) return -1;
              if (a.symbol.toLowerCase() < b.symbol.toLowerCase()) return -1;
              if (a.symbol.toLowerCase() > b.symbol.toLowerCase()) return 1;
              return 0;
            }).map((asset, idx) => {
              return renderAssetOption(type, asset, idx);
            }) : []
          }
        </div>

        <div className={classes.manageLocalContainer}>
          <Button
            onClick={toggleLocal}
          >
            Manage Local Assets
          </Button>
        </div>
      </>
    );
  };

  return (
    <React.Fragment>
      <div className={classes.displaySelectContainer} onClick={() => {
        openSearch();
      }}>
        <div className={classes.assetSelectMenuItem}>
          <div
            className={[classes.displayDualIconContainer, classes[`displayDualIconContainer--${appTheme}`]].join(' ')}>
            <img
              className={classes.displayAssetIcon}
              alt=""
              src={value ? `${value.logoURI}` : ''}
              height="100px"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/tokens/unknown-logo.png";
              }}
            />
          </div>
        </div>
      </div>

      <Dialog
        aria-labelledby="simple-dialog-title"
        open={open}
        style={{borderRadius: 0}}>
        <div style={{
          width: 460,
          height: 710,
          background: appTheme === "dark" ? '#151718' : '#DBE6EC',
          border: appTheme === "dark" ? '1px solid #5F7285' : '1px solid #86B9D6',
          borderRadius: 0,
        }}>
          <DialogTitle style={{
            padding: 30,
            paddingBottom: 0,
            fontWeight: 500,
            fontSize: 18,
            lineHeight: '140%',
            color: '#0A2C40',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
              }}>
                {manageLocal && <ArrowBackIosNew onClick={toggleLocal} style={{
                  marginRight: 10,
                  width: 18,
                  height: 18,
                  cursor: 'pointer',
                }}/>}
                {manageLocal ? 'Manage local assets' : 'Select a liquidity pair'}
              </div>

              <Close
                style={{
                  cursor: 'pointer',
                  color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
                }}
                onClick={onClose}/>
            </div>
          </DialogTitle>

          <DialogContent style={{
            padding: '20px 30px 30px',
          }}>
            {!manageLocal && renderOptions()}
            {manageLocal && renderManageLocal()}
          </DialogContent>
        </div>
      </Dialog>
    </React.Fragment>
  );
}
