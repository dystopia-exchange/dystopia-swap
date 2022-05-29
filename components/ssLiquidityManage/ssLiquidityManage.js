import React, { useState, useEffect, useRef } from 'react';
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
  MenuItem,
  Dialog,
  InputBase,
  DialogTitle,
  DialogContent,
  Popover, Select, ClickAwayListener,
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
  Close, Settings, ArrowDropDownCircleOutlined,
} from '@mui/icons-material';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import { formatSymbol, formatInputAmount } from '../../utils';
import SwapIconBg from '../../ui/SwapIconBg';
import AssetSelect from '../../ui/AssetSelect';
import Borders from '../../ui/Borders';
import Loader from '../../ui/Loader';
import SwitchCustom from '../../ui/Switch';

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
  const [advanced, setAdvanced] = useState(true);

  const [token, setToken] = useState(null);
  const [vestNFTs, setVestNFTs] = useState([]);

  const [slippage, setSlippage] = useState('2');
  const [slippageError, setSlippageError] = useState(false);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [anchorEl, setAnchorEl] = React.useState(null);

  const [withdrawAction, setWithdrawAction] = useState(null);

  const [createLP, setCreateLP] = useState(true);

  const {appTheme} = useAppThemeContext();

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });

  const handleClickPopover = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const openSlippage = Boolean(anchorEl);

  const ssUpdated = async () => {
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

    ssUpdated();

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
    if (Number(parseInt(pp?.reserve0)) != Number(0) && Number(parseInt(pp?.reserve1)) != Number(0)) {
      if (!pp) {
        return null;
      }

      let invert = false;

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
            amountB = BigNumber(amountA).times(parseFloat(pp.reserve0)).div(parseFloat(pp.reserve1)).toFixed(parseFloat(pp.token0.decimals) > 6 ? 6 : parseFloat(pp.token0.decimals));
          } else {
            amountB = BigNumber(amountA).times(parseFloat(pp.reserve1)).div(parseFloat(pp.reserve0)).toFixed(parseFloat(pp.token1.decimals) > 6 ? 6 : parseFloat(pp.token1.decimals));
          }
          setAmount1(amountB);
        }
      }
      if (pa == 1) {
        if (amountB == '') {
          setAmount0('');
        } else {
          if (invert) {
            amountA = BigNumber(amountB).times(parseFloat(pp.reserve1)).div(parseFloat(pp.reserve0)).toFixed(parseFloat(pp.token1.decimals) > 6 ? 6 : parseFloat(pp.token1.decimals));
          } else {
            amountA = BigNumber(amountB).times(parseFloat(pp.reserve0)).div(parseFloat(pp.reserve1)).toFixed(parseFloat(pp.token0.decimals) > 6 ? 6 : parseFloat(pp.token0.decimals));
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
    }
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
    setOpenSelectToken(false);
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
      let am = BigNumber(asset0.balance).times(percent).div(100).toFixed(parseFloat(asset0.decimals));
      setAmount0(am);
      callQuoteAddLiquidity(am, amount1, 0, stable, pair, asset0, asset1);
    } else if (input === 'amount1') {
      let am = BigNumber(asset1.balance).times(percent).div(100).toFixed(parseFloat(asset1.decimals));
      setAmount1(am);
      callQuoteAddLiquidity(amount0, am, 1, stable, pair, asset0, asset1);

    } else if (input === 'withdraw') {
      let am = '';

      am = BigNumber(pair.balance).times(percent).div(100).toFixed(18);
      setWithdrawAmount(am);


      if (am === '') {
        setWithdrawAmount0('');
        setWithdrawAmount1('');
      } else if (am !== '' && !isNaN(am)) {
        calcRemove(pair, am);
      }
    }
  };
  const setAmountPercentGauge = (input) => {
    if (input === 'withdraw') {
      let am = '';
      if (pair && pair.gauge) {
        am = BigNumber(pair.gauge.balance).times(100).div(100).toFixed(18);
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
    if (!withdrawAmount || withdrawAmount === '' || isNaN(withdrawAmount)) {
      setWithdrawAmountError('Amount is required');
      error = true;
    } else {
      if (BigNumber(withdrawAmount).lte(0)) {
        setWithdrawAmountError('Invalid amount');
        error = true;
      } else if (withdrawAsset && BigNumber(withdrawAmount).gt(withdrawAsset.balance)) {
        setWithdrawAmountError(`Greater than your available LP balance`);
        error = true;
      }
    }

    if (!error) {
      setDepositLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.REMOVE_LIQUIDITY, content: {
          pair: pair,
          token0: pair.token0,
          token1: pair.token1,
          quote: withdrawAmount,
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
    const value = formatInputAmount(event.target.value.replace(',', '.'));
    setAmount0Error(false);
    setAmount0(value);
    callQuoteAddLiquidity(value, amount1, priorityAsset, stable, pair, asset0, asset1);
  };

  const amount1Changed = (event) => {
    const value = formatInputAmount(event.target.value.replace(',', '.'));
    setAmount1Error(false);
    setAmount1(value);
    callQuoteAddLiquidity(amount0, value, priorityAsset, stable, pair, asset0, asset1);
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
    const value = formatInputAmount(event.target.value.replace(',', '.'));
    setWithdrawAmountError(false);
    setWithdrawAmount(value);
    if (value === '') {
      setWithdrawAmount0('');
      setWithdrawAmount1('');
    } else if (value !== '' && !isNaN(value)) {
      calcRemove(pair, value);
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
          <Borders offsetLeft={-1} offsetRight={-1} offsetTop={-1} offsetBottom={-1}/>

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
                  e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                }}
              />
            }
            {
              !logo &&
              <img
                className={classes.mediumdisplayAssetIcon}
                alt=""
                src={`/tokens/unknown-logo--${appTheme}.svg`}
                height="50px"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
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
          {
            type === 'amount0'
              ? (createLP ? `1st ${windowWidth > 530 ? 'token' : ''}` : 'LP')
              : type !== 'withdraw' ? (`2nd ${windowWidth > 530 ? 'token' : ''}`) : 'LP'
          }
        </Typography>

        {type !== 'withdraw' &&
          <div className={[classes.inputBalanceTextContainer, 'g-flex', 'g-flex--align-center'].join(' ')}>
            <img
              src="/images/ui/icon-wallet.svg"
              className={classes.walletIcon}
              onClick={() => assetValue?.balance && Number(assetValue?.balance) > 0 ? setAmountPercent(type, 100) : null}/>

            <Typography
              className={[classes.inputBalanceText, 'g-flex__item'].join(' ')}
              noWrap
              onClick={() => assetValue?.balance && Number(assetValue?.balance) > 0 ? setAmountPercent(type, 100) : null}>
            <span>
              {(assetValue && assetValue.balance) ?
                ' ' + formatCurrency(assetValue.balance) :
                ''
              }
            </span>
            </Typography>

            {assetValue?.balance && Number(assetValue?.balance) > 0 && type === 'amount0' &&
              <div
                style={{
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 14,
                  lineHeight: '120%',
                  color: appTheme === 'dark' ? '#4CADE6' : '#0B5E8E',
                }}
                onClick={() => setAmountPercent(type, 100)}>
                MAX
              </div>
            }
          </div>
        }

        {type === 'withdraw' &&
          <div className={[classes.inputBalanceTextContainer, 'g-flex', 'g-flex--align-center'].join(' ')}>
            <div
              className={[classes.tokenTextHeader, classes[`tokenTextHeader--${appTheme}`]].join(" ")}>
              Liquidity pool
            </div>

            {/*{assetValue?.balance && Number(assetValue?.balance) > 0 && type === 'withdraw' &&
              <div
                style={{
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 14,
                  lineHeight: '120%',
                  color: appTheme === 'dark' ? '#4CADE6' : '#0B5E8E',
                }}
                onClick={() => setAmountPercent(type, 100)}>
                MAXLP
              </div>
            }
            &nbsp;
            {assetValue?.gauge?.balance && Number(assetValue?.gauge?.balance) > 0 && type === 'withdraw' &&
              <div
                style={{
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: 14,
                  lineHeight: '120%',
                  color: appTheme === 'dark' ? '#4CADE6' : '#0B5E8E',
                }}
                onClick={() => setAmountPercentGauge(type)}>
                MAXSTAKE
              </div>
            }*/}
          </div>
        }

        <div className={`${classes.massiveInputContainer} ${(amountError || assetError) && classes.error}`}>
          <div className={classes.massiveInputAssetSelect}>
            <AssetSelect
              type={type}
              value={assetValue}
              assetOptions={assetOptions}
              onSelect={onAssetSelect}
              size={type === 'withdraw' ? 'medium' : 'default'}
              typeIcon={type === 'withdraw' || (type !== 'withdraw' && !createLP) ? 'double' : 'single'}
            />
          </div>

          {type !== 'withdraw' &&
            <>
              <InputBase
                className={classes.massiveInputAmount}
                placeholder="0.00"
                error={amountError}
                helperText={amountError}
                value={amountValue}
                onChange={amountChanged}
                disabled={depositLoading || stakeLoading || depositStakeLoading || createLoading}
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
                {formatSymbol(assetValue?.symbol)}
              </Typography>
            </>
          }

          {type === 'withdraw' &&
            <>
              <div
                className={[classes.tokenText, classes[`tokenText--${appTheme}`]].join(" ")}>
                {formatSymbol(assetValue?.symbol)}
              </div>

              <div
                className={[classes.tokenTextLabel, classes[`tokenTextLabel--${appTheme}`]].join(" ")}>
                Variable pool
              </div>
            </>
          }
        </div>
      </div>
    );
  };

  const renderDepositInformation = () => {
    if (!pair) {
      return (
        <div className={classes.depositInfoContainer}>
          <Typography className={classes.depositInfoHeading}>Starting Liquidity Info</Typography>
          <div
            style={{
              width: '100%',
              border: `1px solid ${appTheme === 'dark' ? '#5F7285' : '#86B9D6'}`,
            }}
            className={['g-flex'].join(' ')}>
            <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
              <Borders offsetLeft={-1} offsetRight={-1} offsetTop={-1} offsetBottom={-1}/>

              <Typography className={classes.title}>
                {BigNumber(amount1).gt(0) ? formatCurrency(BigNumber(amount0).div(amount1)) : '0.00'}
              </Typography>

              <Typography className={classes.text}>
                {`${formatSymbol(asset0?.symbol)} per ${formatSymbol(asset1?.symbol)}`}
              </Typography>
            </div>

            <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
              <Borders offsetLeft={-1} offsetRight={-1} offsetTop={-1} offsetBottom={-1}/>

              <Typography
                className={classes.title}>{BigNumber(amount0).gt(0) ? formatCurrency(BigNumber(amount1).div(amount0)) : '0.00'}</Typography>

              <Typography
                className={classes.text}>{`${formatSymbol(asset1?.symbol)} per ${formatSymbol(asset0?.symbol)}`}</Typography>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className={classes.depositInfoContainer}>
          <div className={[classes.dividerLine, classes[`dividerLine--${appTheme}`]].join(' ')}>

          </div>

          <Typography className={[classes.depositInfoHeading, classes[`depositInfoHeading--${appTheme}`]].join(' ')}>
            Reserve Info
          </Typography>

          <div className={[classes.priceInfos, classes[`priceInfos--${appTheme}`]].join(' ')}>
            <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
              <Borders offsetLeft={-1} offsetRight={-1} offsetTop={-1} offsetBottom={-1}/>

              <Typography className={classes.text}>
                {`${formatSymbol(pair?.token0?.symbol)}`}
              </Typography>

              <Typography className={classes.title}>
                {formatCurrency(pair?.reserve0)}
              </Typography>
            </div>

            <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
              <Borders offsetLeft={-1} offsetRight={-1} offsetTop={-1} offsetBottom={-1}/>

              <Typography className={classes.text}>
                {`${formatSymbol(pair?.token1?.symbol)}`}
              </Typography>

              <Typography className={classes.title}>
                {formatCurrency(pair?.reserve1)}
              </Typography>
            </div>
          </div>

          <Typography className={[classes.depositInfoHeading, classes[`depositInfoHeading--${appTheme}`]].join(' ')}>
            {`Your Balances - ${formatSymbol(pair?.symbol)}`}
          </Typography>

          <div className={[classes.priceInfos, classes[`priceInfos--${appTheme}`]].join(' ')}>
            <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
              <Borders offsetLeft={-1} offsetRight={-1} offsetTop={-1} offsetBottom={-1}/>

              <Typography className={classes.text}>
                Pooled
              </Typography>

              <Typography className={classes.title}>
                {formatCurrency(pair?.balance)}
              </Typography>
            </div>

            <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
              <Borders offsetLeft={-1} offsetRight={-1} offsetTop={-1} offsetBottom={-1}/>

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

  const renderToggleIcon = (action) => {
    return (
      <>
        {withdrawAction !== action &&
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
              fill={appTheme === 'dark' ? '#151718' : '#DBE6EC'}
              stroke={appTheme === 'dark' ? '#4CADE6' : '#0B5E8E'}/>
          </svg>
        }

        {withdrawAction === action &&
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
              fill={appTheme === 'dark' ? '#151718' : '#DBE6EC'}
              stroke={appTheme === 'dark' ? '#4CADE6' : '#0B5E8E'}/>
            <path
              d="M5 10C5 7.23858 7.23858 5 10 5C12.7614 5 15 7.23858 15 10C15 12.7614 12.7614 15 10 15C7.23858 15 5 12.7614 5 10Z"
              fill={appTheme === 'dark' ? '#4CADE6' : '#0B5E8E'}/>
          </svg>
        }
      </>
    );
  };

  const renderWithdrawInformation = () => {
    return (
      <div className={classes.withdrawInfoContainer}>
        <Typography className={[classes.depositInfoHeading, classes[`depositInfoHeading--${appTheme}`]].join(' ')}>
          {`Your Balances - ${formatSymbol(pair?.symbol)}`}
        </Typography>

        <div className={[classes.priceInfos, classes[`priceInfos--${appTheme}`]].join(' ')}>
          <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
            <Borders offsetLeft={-1} offsetRight={-1} offsetTop={-1} offsetBottom={-1}/>

            <Typography className={classes.text}>
              Pooled
            </Typography>

            <Typography className={classes.title}>
              {formatCurrency(pair?.balance)}
            </Typography>
          </div>

          <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
            <Borders offsetLeft={-1} offsetRight={-1} offsetTop={-1} offsetBottom={-1}/>

            <Typography className={classes.text}>
              Staked
            </Typography>

            <Typography className={classes.title}>
              {formatCurrency(pair?.gauge?.balance)}
            </Typography>
          </div>
        </div>

        <Typography className={[classes.depositInfoHeading, classes[`depositInfoHeading--${appTheme}`]].join(' ')}>
          Choose the action
        </Typography>

        <div className={[classes.toggles, 'g-flex-column'].join(' ')}>
          <div className={['g-flex', 'g-flex--align-center'].join(' ')}>
            <div
              className={[classes.toggleOption, classes[`toggleOption--${appTheme}`], `${withdrawAction === 'unstake' && classes.active}`].join(' ')}
              onClick={() => {
                setWithdrawAction('unstake');
              }}>

              {renderToggleIcon('unstake')}

              <Typography
                className={[classes.toggleOptionText, classes[`toggleOptionText--${appTheme}`]].join(' ')}>
                Unstake LP
              </Typography>
            </div>

            <div
              className={[classes.toggleOption, classes[`toggleOption--${appTheme}`], `${withdrawAction === 'remove' && classes.active}`].join(' ')}
              onClick={() => {
                setWithdrawAction('remove');
              }}>

              {renderToggleIcon('remove')}

              <Typography
                className={[classes.toggleOptionText, classes[`toggleOptionText--${appTheme}`]].join(' ')}>
                Remove LP
              </Typography>
            </div>
          </div>

          <div
            style={{
              width: '100%',
              marginTop: 10,
            }}
            className={[classes.toggleOption, classes[`toggleOption--${appTheme}`], `${withdrawAction === 'unstake-remove' && classes.active}`].join(' ')}
            onClick={() => {
              setWithdrawAction('unstake-remove');
            }}>

            {renderToggleIcon('unstake-remove')}

            <Typography
              className={[classes.toggleOptionText, classes[`toggleOptionText--${appTheme}`]].join(' ')}>
              Unstake & Remove LP
            </Typography>
          </div>
        </div>

        {withdrawAsset !== null && withdrawAction !== null &&
          <div className={['g-flex'].join(" ")} style={{width: '100%', marginTop: 20}}>
            <div className={['g-flex-column', 'g-flex__item-fixed'].join(' ')}>
              <div
                className={[classes.liqHeader, classes[`liqHeader--${appTheme}`], classes.liqHeaderLabel, 'g-flex', 'g-flex--align-center'].join(' ')}>
                <Borders offsetLeft={-1} offsetRight={-1} offsetTop={-1} offsetBottom={-1}/>

                <div>
                  LP
                </div>
              </div>

              <div
                className={[classes.liqBody, classes[`liqBody--${appTheme}`], classes.liqBodyLabel, 'g-flex', 'g-flex--align-center'].join(" ")}>
                <Borders offsetLeft={-1} offsetRight={-1} offsetTop={-1} offsetBottom={-1}/>

                <div
                  className={[classes.liqBodyIconContainer, classes[`liqBodyIconContainer--${appTheme}`]].join(' ')}>
                  <img
                    className={classes.liqBodyIcon}
                    alt=""
                    src={pair ? `${pair?.token0?.logoURI}` : ''}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                    }}
                  />
                </div>

                <div
                  className={[classes.liqBodyIconContainer, classes[`liqBodyIconContainer--${appTheme}`]].join(' ')}>
                  <img
                    className={classes.liqBodyIcon}
                    alt=""
                    src={pair ? `${pair?.token1?.logoURI}` : ''}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                    }}
                  />
                </div>
              </div>
            </div>

            <div className={['g-flex-column', 'g-flex__item'].join(' ')}>
              <div
                className={[classes.liqHeader, classes[`liqHeader--${appTheme}`], 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                <Borders offsetLeft={-1} offsetRight={-1} offsetTop={-1} offsetBottom={-1}/>

                <div className={['g-flex', 'g-flex--align-center'].join(' ')}>
                  <img
                    src="/images/ui/icon-wallet.svg"
                    className={classes.walletIcon}/>

                  <Typography
                    className={[classes.inputBalanceText, 'g-flex__item'].join(' ')}
                    noWrap>
                    {asset1?.gauge?.balance
                      ? (' ' + formatCurrency(assetValue.gauge.balance))
                      : '0.00'
                    }
                  </Typography>
                </div>

                <div
                  className={[classes.balanceMax, classes[`balanceMax--${appTheme}`]].join(' ')}
                  onClick={() =>
                    setAmountPercent(type, 100)
                  }>
                  MAX
                </div>
              </div>

              <div
                className={[classes.liqBody, classes[`liqBody--${appTheme}`], 'g-flex', 'g-flex--align-center'].join(" ")}>
                <Borders offsetLeft={-1} offsetRight={-1} offsetTop={-1} offsetBottom={-1}/>

                <InputBase
                  className={classes.massiveInputAmountUnstake}
                  placeholder="0.00"
                  error={amount1Error}
                  helperText={amount1Error}
                  value={amount1}
                  onChange={amount1Changed}
                  disabled={depositLoading || stakeLoading || depositStakeLoading || createLoading}
                  onFocus={amount1Focused ? amount1Focused : null}
                  inputProps={{
                    className: [classes.largeInput, classes[`largeInput--${appTheme}`]].join(" "),
                  }}
                  InputProps={{
                    disableUnderline: true,
                  }}
                />

                <div
                  className={[classes.tokenTextSecond, classes[`tokenTextSecond--${appTheme}`]].join(" ")}>
                  {withdrawAsset?.symbol}
                </div>
              </div>
            </div>
          </div>
        }

        {withdrawAsset !== null && withdrawAction !== null && (withdrawAction === 'remove' || withdrawAction === 'unstake-remove') &&
          <div
            style={{
              position: 'relative',
            }}>
            <div
              className={[classes.swapIconContainerWithdraw, classes[`swapIconContainerWithdraw--${appTheme}`]].join(' ')}>
            </div>

            <div className={classes.receiveAssets}>
              {renderMediumInput('withdrawAmount0', withdrawAmount0, pair?.token0?.logoURI, pair?.token0?.symbol)}
              {renderMediumInput('withdrawAmount1', withdrawAmount1, pair?.token1?.logoURI, pair?.token1?.symbol)}
            </div>
          </div>
        }

        {withdrawAsset !== null && withdrawAsset !== null && withdrawAction !== null && withdrawAction !== 'unstake' &&
          <>
            <Typography className={[classes.depositInfoHeading, classes[`depositInfoHeading--${appTheme}`]].join(' ')}>
              Price Info
            </Typography>

            <div className={[classes.priceInfos, classes[`priceInfos--${appTheme}`]].join(' ')}>
              <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
                <Borders offsetLeft={-1} offsetRight={-1} offsetTop={-1} offsetBottom={-1}/>
                <Typography
                  className={classes.text}>{`${formatSymbol(pair?.token0?.symbol)} per ${formatSymbol(pair?.token1?.symbol)}`}</Typography>
                <Typography className={classes.title}>{formatCurrency(pair?.reserve0)}</Typography>
              </div>

              <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
                <Borders offsetLeft={-1} offsetRight={-1} offsetTop={-1} offsetBottom={-1}/>
                <Typography
                  className={classes.text}>{`${formatSymbol(pair?.token1?.symbol)} per ${formatSymbol(pair?.token0?.symbol)}`}</Typography>
                <Typography className={classes.title}>{formatCurrency(pair?.reserve1)}</Typography>
              </div>
            </div>
          </>
        }

        {withdrawAction === null &&
          <div className={[classes.disclaimerContainer, classes[`disclaimerContainer--${appTheme}`]].join(' ')}>
            Please claim any rewards before withdrawing
          </div>
        }
      </div>
    );
  };

  const renderSmallInput = (type, amountValue, amountError, amountChanged) => {
    return (
      <div className={['g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
        <div
          className={[classes.slippageTextContainer, classes[`slippageTextContainer--${appTheme}`], 'g-flex', 'g-flex--align-center'].join(' ')}>
          <div style={{marginRight: 5}}>
            Slippage:
          </div>

          <TextField
            placeholder="0.00"
            fullWidth
            error={amountError}
            helperText={amountError}
            value={amountValue}
            onChange={amountChanged}
            disabled={true}
            InputProps={{
              style: {
                border: 'none',
                borderRadius: 0,
              },
              classes: {
                root: classes.searchInput,
              },
              endAdornment: <InputAdornment position="end">
                <span
                  style={{
                    color: appTheme === "dark" ? '#ffffff' : '#325569',
                  }}>
                  %
                </span>
              </InputAdornment>,
            }}
            inputProps={{
              className: [classes.smallInput, classes[`inputBalanceSlippageText--${appTheme}`]].join(" "),
              style: {
                textAlign: 'right',
                padding: 0,
                borderRadius: 0,
                border: 'none',
                fontSize: 14,
                fontWeight: 400,
                lineHeight: '120%',
                color: appTheme === "dark" ? '#C6CDD2' : '#325569',
              },
            }}
          />
        </div>

        <div
          onClick={handleClickPopover}
          className={[classes.slippageIconContainer, (anchorEl ? classes['slippageIconContainer--active'] : ''), classes[`slippageIconContainer--${appTheme}`]].join(' ')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              className={[classes.slippageIcon, (anchorEl ? classes['slippageIcon--active'] : ''), classes[`slippageIcon--${appTheme}`]].join(' ')}
              d="M9.99998 0.833496L17.9166 5.41683V14.5835L9.99998 19.1668L2.08331 14.5835V5.41683L9.99998 0.833496ZM9.99998 2.75933L3.74998 6.37766V13.6227L9.99998 17.241L16.25 13.6227V6.37766L9.99998 2.75933ZM9.99998 13.3335C9.11592 13.3335 8.26808 12.9823 7.64296 12.3572C7.01784 11.7321 6.66665 10.8842 6.66665 10.0002C6.66665 9.11611 7.01784 8.26826 7.64296 7.64314C8.26808 7.01802 9.11592 6.66683 9.99998 6.66683C10.884 6.66683 11.7319 7.01802 12.357 7.64314C12.9821 8.26826 13.3333 9.11611 13.3333 10.0002C13.3333 10.8842 12.9821 11.7321 12.357 12.3572C11.7319 12.9823 10.884 13.3335 9.99998 13.3335ZM9.99998 11.6668C10.442 11.6668 10.8659 11.4912 11.1785 11.1787C11.4911 10.8661 11.6666 10.4422 11.6666 10.0002C11.6666 9.55813 11.4911 9.13421 11.1785 8.82165C10.8659 8.50909 10.442 8.3335 9.99998 8.3335C9.55795 8.3335 9.13403 8.50909 8.82147 8.82165C8.50891 9.13421 8.33331 9.55813 8.33331 10.0002C8.33331 10.4422 8.50891 10.8661 8.82147 11.1787C9.13403 11.4912 9.55795 11.6668 9.99998 11.6668Z"
            />
          </svg>
        </div>
      </div>
    );
  };

  const renderMediumInputToggle = (type, value) => {
    return (
      <div className={[classes.toggles, 'g-flex'].join(' ')}>
        <div
          style={{
            marginRight: 20,
          }}
          className={[classes.toggleOption, classes[`toggleOption--${appTheme}`], `${stable && classes.active}`].join(' ')}
          onClick={() => {
            setStab(true);
          }}>

          {!stable &&
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
                fill={appTheme === 'dark' ? '#151718' : '#DBE6EC'}
                stroke={appTheme === 'dark' ? '#4CADE6' : '#0B5E8E'}/>
            </svg>
          }

          {stable &&
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
                fill={appTheme === 'dark' ? '#151718' : '#DBE6EC'}
                stroke={appTheme === 'dark' ? '#4CADE6' : '#0B5E8E'}/>
              <path
                d="M5 10C5 7.23858 7.23858 5 10 5C12.7614 5 15 7.23858 15 10C15 12.7614 12.7614 15 10 15C7.23858 15 5 12.7614 5 10Z"
                fill={appTheme === 'dark' ? '#4CADE6' : '#0B5E8E'}/>
            </svg>
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
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
                fill={appTheme === 'dark' ? '#151718' : '#DBE6EC'}
                stroke={appTheme === 'dark' ? '#4CADE6' : '#0B5E8E'}/>
            </svg>
          }

          {!stable &&
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
                fill={appTheme === 'dark' ? '#151718' : '#DBE6EC'}
                stroke={appTheme === 'dark' ? '#4CADE6' : '#0B5E8E'}/>
              <path
                d="M5 10C5 7.23858 7.23858 5 10 5C12.7614 5 15 7.23858 15 10C15 12.7614 12.7614 15 10 15C7.23858 15 5 12.7614 5 10Z"
                fill={appTheme === 'dark' ? '#4CADE6' : '#0B5E8E'}/>
            </svg>
          }

          <Typography
            className={[classes.toggleOptionText, classes[`toggleOptionText--${appTheme}`]].join(' ')}>
            Volatile
          </Typography>
        </div>
      </div>
    );
  };

  const [openSelectToken, setOpenSelectToken] = useState(false);

  const openSelect = () => {
    setOpenSelectToken(!openSelectToken);
  };

  const closeSelect = () => {
    setOpenSelectToken(false);
  };

  const selectArrow = () => {
    return (
      <ClickAwayListener onClickAway={closeSelect}>
        <div
          onClick={openSelect}
          className={[classes.slippageIconContainer, (openSelectToken ? classes['selectTokenIconContainer--active'] : ''), classes[`slippageIconContainer--${appTheme}`]].join(' ')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              className={[classes.slippageIcon, (openSelectToken ? classes['slippageIcon--active'] : ''), classes[`slippageIcon--${appTheme}`]].join(' ')}
              d="M9.99999 10.9766L14.125 6.85156L15.3033 8.0299L9.99999 13.3332L4.69666 8.0299L5.87499 6.85156L9.99999 10.9766Z"
            />
          </svg>
        </div>
      </ClickAwayListener>
    );
  };

  const renderTokenSelect = () => {
    return (
      <Select
        className={[classes.tokenSelect, classes[`tokenSelect--${appTheme}`]].join(' ')}
        fullWidth
        value={token}
        {...{
          displayEmpty: token === null ? true : undefined,
          renderValue: token === null ? (selected) => {
            if (selected === null) {
              return <div
                style={{
                  padding: 5,
                  paddingLeft: 15.5,
                  paddingRight: 10,
                  fontWeight: 400,
                  fontSize: 14,
                  color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                }}>
                Select veDYST
              </div>;
            }
          } : undefined,
        }}
        MenuProps={{
          classes: {
            list: appTheme === 'dark' ? classes['list--dark'] : classes.list,
          },
        }}
        open={openSelectToken}
        onChange={handleChange}
        IconComponent={selectArrow}
        inputProps={{
          className: appTheme === 'dark' ? classes['tokenSelectInput--dark'] : classes.tokenSelectInput,
        }}>
        {vestNFTs && vestNFTs.map((option) => {
          return (
            <MenuItem key={option.id} value={option}>
              <div
                className={[classes.menuOption, 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                <Typography
                  className={classes.menuOptionLabel}
                  style={{
                    fontWeight: 500,
                    fontSize: 12,
                    marginRight: 30,
                    color: appTheme === 'dark' ? '#ffffff' : '#325569',
                  }}>
                  Token #{option.id}
                </Typography>

                <div className={[classes.menuOptionSec, 'g-flex', 'g-flex--align-center'].join(' ')}>
                  <Typography
                    style={{
                      fontWeight: 400,
                      fontSize: 10,
                      color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                      textAlign: 'right',
                    }}>
                    {formatCurrency(option.lockValue)} {veToken?.symbol}
                  </Typography>
                </div>
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
                  fontWeight: 500,
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
                  fontWeight: 500,
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
          {activeTab === 'deposit' &&
            <>
              <div className={classes.amountsContainer}>
                <div
                  style={{
                    width: '100%',
                    marginBottom: 20,
                  }}
                  className={['g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                  {createLP &&
                    <div className={[classes.depositHeader, classes[`depositHeader--${appTheme}`]].join(' ')}>
                      Create LP
                    </div>
                  }

                  {!createLP &&
                    <div className={[classes.depositHeader, classes[`depositHeader--${appTheme}`]].join(' ')}>
                      Stake LP
                    </div>
                  }

                  <div className={['g-flex', 'g-flex--align-center'].join(' ')}>
                    <div
                      className={[classes.depositSwitcherLabel, classes[`depositSwitcherLabel--${appTheme}`]].join(' ')}>
                      I have LP token
                    </div>

                    <SwitchCustom
                      checked={!createLP}
                      onChange={() => setCreateLP(!createLP)}
                      name={'toggleActive'}
                    />
                  </div>
                </div>

                {renderMassiveInput('amount0', amount0, amount0Error, amount0Changed, asset0, null, createLP ? assetOptions : withdrawAassetOptions, onAssetSelect, amount0Focused, amount0Ref)}

                {createLP &&
                  <>
                    <div
                      className={[classes.swapIconContainer, classes[`swapIconContainer--${appTheme}`]].join(' ')}>
                      <div
                        className={[
                          classes.swapIconContainerInside,
                          classes[`swapIconContainerInside--${appTheme}`],
                          'g-flex',
                          'g-flex--align-center',
                          'g-flex--justify-center'
                        ].join(' ')}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M10.95 8.95L9.53605 10.364L7.00005 7.828V21H5.00005V7.828L2.46505 10.364L1.05005 8.95L6.00005 4L10.95 8.95ZM22.9501 16.05L18 21L13.05 16.05L14.464 14.636L17.001 17.172L17 4H19V17.172L21.536 14.636L22.9501 16.05Z"
                            className={[classes.swapIconContainerIcon, classes[`swapIconContainerIcon--${appTheme}`]].join(' ')}/>
                        </svg>
                      </div>
                    </div>

                    {renderMassiveInput('amount1', amount1, amount1Error, amount1Changed, asset1, null, assetOptions, onAssetSelect, amount1Focused, amount1Ref)}
                  </>
                }

                {createLP &&
                  <div className={[
                    classes.disclaimerContainer,
                    amount0Error || amount1Error ? classes.disclaimerContainerError : classes.disclaimerContainerWarning,
                    amount0Error || amount1Error ? classes[`disclaimerContainerError--${appTheme}`] : classes[`disclaimerContainerWarning--${appTheme}`],
                  ].join(' ')}>
                    {amount0Error &&
                      <>
                        {amount0Error}
                      </>
                    }

                    {amount1Error &&
                      <>
                        {amount1Error}
                      </>
                    }

                    {!amount0Error && !amount1Error &&
                      <>
                        {formatSymbol(asset0?.symbol)}/{formatSymbol(asset1?.symbol)} LP exists in your wallet. Choose
                        “I have LP token” to stake it.
                      </>
                    }
                  </div>
                }
              </div>

              {createLP &&
                renderMediumInputToggle('stable', stable)
              }

              <div className={classes.controls}>
                <div className={classes.controlItem}>
                  {renderTokenSelect()}
                </div>

                <div
                  className={[classes.controlItem, classes.controlPopover, classes[`controlPopover--${appTheme}`], 'g-flex', 'g-flex--align-center'].join(' ')}>
                  {renderSmallInput('slippage', slippage, slippageError, onSlippageChanged)}
                  {slippageError && <div
                    style={{marginTop: 20}}
                    className={[
                      classes.warningContainer,
                      classes[`warningContainer--${appTheme}`],
                      classes.warningContainerError].join(" ")}>
                    <div className={[
                      classes.warningDivider,
                      classes.warningDividerError,
                    ].join(" ")}>
                    </div>
                    <Typography
                      className={[classes.warningError, classes[`warningText--${appTheme}`]].join(" ")}
                      align="center">{slippageError}</Typography>
                  </div>}
                </div>

                <Popover
                  classes={{
                    paper: [classes.popoverPaper, classes[`popoverPaper--${appTheme}`]].join(' '),
                  }}
                  open={openSlippage}
                  anchorEl={anchorEl}
                  onClose={handleClosePopover}
                  anchorOrigin={{
                    vertical: -190,
                    horizontal: windowWidth > 530 ? -295 : -257,
                  }}>
                  <div
                    style={{
                      marginBottom: 30,
                    }}
                    className={['g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                    <div
                      style={{
                        fontWeight: 500,
                        fontSize: 18,
                        color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
                      }}>
                      Settings
                    </div>

                    <Close
                      style={{
                        cursor: 'pointer',
                        color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
                      }}
                      onClick={handleClosePopover}/>
                  </div>

                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 14,
                      marginBottom: 10,
                      color: appTheme === "dark" ? '#7C838A' : '#5688A5',
                    }}>
                    Slippage Tolerance
                  </div>

                  <div
                    style={{
                      position: 'relative',
                      marginBottom: 20,
                    }}>
                    <Borders/>

                    <TextField
                      placeholder="0.00"
                      fullWidth
                      error={slippageError}
                      helperText={slippageError}
                      value={slippage}
                      onChange={onSlippageChanged}
                      disabled={depositLoading || stakeLoading || depositStakeLoading || createLoading}
                      classes={{
                        root: [classes.slippageRoot, appTheme === "dark" ? classes['slippageRoot--dark'] : classes['slippageRoot--light']].join(' '),
                      }}
                      InputProps={{
                        style: {
                          border: 'none',
                          borderRadius: 0,
                        },
                        classes: {
                          root: classes.searchInput,
                        },
                        endAdornment: <InputAdornment position="end">
                        <span
                          style={{
                            color: appTheme === "dark" ? '#ffffff' : '#325569',
                          }}>
                          %
                        </span>
                        </InputAdornment>,
                      }}
                      inputProps={{
                        className: [classes.smallInput, classes[`inputBalanceSlippageText--${appTheme}`]].join(" "),
                        style: {
                          padding: 0,
                          borderRadius: 0,
                          border: 'none',
                          fontSize: 14,
                          fontWeight: 400,
                          lineHeight: '120%',
                          color: appTheme === "dark" ? '#C6CDD2' : '#325569',
                        },
                      }}
                    />
                  </div>

                  {/*TODO: uncomment deadline then logic will be ready*/}
                  {/*
                  <div className={[classes.slippageDivider, classes[`slippageDivider--${appTheme}`]].join(" ")}>
                  </div>

                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 14,
                      marginBottom: 10,
                      color: appTheme === "dark" ? '#7C838A' : '#5688A5',
                    }}>
                    Transaction Deadline
                  </div>

                  <TextField
                    placeholder="0"
                    fullWidth
                    // error={slippageError}
                    // helperText={slippageError}
                    // value={slippage}
                    // onChange={onSlippageChanged}
                    disabled={depositLoading || stakeLoading || depositStakeLoading || createLoading}
                    classes={{
                      root: [classes.slippageRoot, appTheme === "dark" ? classes['slippageRoot--dark'] : classes['slippageRoot--light']].join(' '),
                    }}
                    InputProps={{
                      style: {
                        border: 'none',
                        borderRadius: 0,
                      },
                      classes: {
                        root: classes.searchInput,
                      },
                      endAdornment: <InputAdornment position="end">
                        <span
                          style={{
                            color: appTheme === "dark" ? '#ffffff' : '#5688A5',
                          }}>
                          minutes
                        </span>
                      </InputAdornment>,
                    }}
                    inputProps={{
                      className: [classes.smallInput, classes[`inputBalanceSlippageText--${appTheme}`]].join(" "),
                      style: {
                        padding: 0,
                        borderRadius: 0,
                        border: 'none',
                        fontSize: 14,
                        fontWeight: 400,
                        lineHeight: '120%',
                        color: appTheme === "dark" ? '#C6CDD2' : '#325569',
                      },
                    }}
                  />*/}
                </Popover>
              </div>

              {renderDepositInformation()}
            </>
          }
          {
            activeTab === 'withdraw' &&
            <>
              {renderMassiveInput('withdraw', withdrawAmount, withdrawAmountError, withdrawAmountChanged, withdrawAsset, null, withdrawAassetOptions, onAssetSelect, null, null)}

              {renderWithdrawInformation()}
            </>
          }
        </div>
      </div>

      {/*TODO: Old buttons, remove after action will be added to new buttons*/}
      {/*
      {activeTab === 'deposit' &&
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
                onClick={onCreateAndStake}>
                <Typography
                  className={classes.actionButtonText}>{createLoading ? `Creating` : `Create Pair & Stake`}</Typography>
                {createLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
              </Button>

              <Button
                variant="contained"
                size="large"
                className={[
                  (createLoading || depositLoading) ? classes.multiApprovalButton : classes.buttonOverride,
                  (createLoading || depositLoading) ? classes[`multiApprovalButton--${appTheme}`] : classes[`buttonOverride--${appTheme}`],
                ].join(' ')}
                color="primary"
                disabled={createLoading || depositLoading}
                onClick={onCreateAndDeposit}>
                <Typography
                  className={classes.actionButtonText}>{depositLoading ? `Depositing` : `Create Pair & Deposit`}</Typography>
                {depositLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
              </Button>
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
              {!pair.gauge &&
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
                variant="contained"
                size="large"
                className={[
                  ((amount0 === '' && amount1 === '') || depositLoading || stakeLoading || depositStakeLoading) ? classes.multiApprovalButton : classes.buttonOverride,
                  ((amount0 === '' && amount1 === '') || depositLoading || stakeLoading || depositStakeLoading) ? classes[`multiApprovalButton--${appTheme}`] : classes[`buttonOverride--${appTheme}`],
                ].join(' ')}
                color="primary"
                disabled={(amount0 === '' && amount1 === '') || depositLoading || stakeLoading || depositStakeLoading}
                onClick={onDepositAndStake}>
                <Typography
                  className={classes.actionButtonText}>{depositStakeLoading ? `Depositing` : `Deposit & Stake`}</Typography>
                {depositStakeLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
              </Button>

              <Button
                variant="contained"
                size="large"
                className={[
                  ((amount0 === '' && amount1 === '') || depositLoading || stakeLoading || depositStakeLoading) ? classes.multiApprovalButton : classes.buttonOverride,
                  ((amount0 === '' && amount1 === '') || depositLoading || stakeLoading || depositStakeLoading) ? classes[`multiApprovalButton--${appTheme}`] : classes[`buttonOverride--${appTheme}`],
                ].join(' ')}
                color="primary"
                disabled={(amount0 === '' && amount1 === '') || depositLoading || stakeLoading || depositStakeLoading}
                onClick={onDeposit}>
                <Typography
                  className={classes.actionButtonText}>{depositLoading ? `Depositing` : `Deposit LP`}</Typography>
                {depositLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
              </Button>

              <Button
                variant="contained"
                size="large"
                className={[
                  ((amount0 === '' && amount1 === '') || BigNumber(pair.balance).eq(0) || depositLoading || stakeLoading || depositStakeLoading) ? classes.multiApprovalButton : classes.buttonOverride,
                  ((amount0 === '' && amount1 === '') || BigNumber(pair.balance).eq(0) || depositLoading || stakeLoading || depositStakeLoading) ? classes[`multiApprovalButton--${appTheme}`] : classes[`buttonOverride--${appTheme}`],
                ].join(' ')}
                color="primary"
                disabled={(amount0 === '' && amount1 === '') || BigNumber(pair.balance).eq(0) || depositLoading || stakeLoading || depositStakeLoading}
                onClick={onStake}>
                <Typography
                  className={classes.actionButtonText}>{BigNumber(pair.balance).gt(0) ? (stakeLoading ? `Staking` : `Stake ${formatCurrency(pair.balance)} LP`) : `Nothing Unstaked`}</Typography>
                {stakeLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
              </Button>
            </>
          }
        </div>
      }
      */}

      {activeTab === 'deposit' &&
        <>
          <Button
            variant="contained"
            size="large"
            color="primary"
            onClick={() => {
              if (amount0 !== '' && amount1 !== '' && createLP) {
                onCreateAndStake();
              }

              if (amount0 !== '' && amount1 !== '' && !createLP) {
                onStake();
              }
            }}
            disabled={(amount0 === '' || amount1 === '')}
            className={[classes.buttonOverride, classes[`buttonOverride--${appTheme}`]].join(" ")}>
              <span className={classes.actionButtonText}>
                {amount0 !== '' && amount1 !== '' && createLP && 'Create LP & Stake'}

                {amount0 !== '' && amount1 !== '' && !createLP && 'Stake LP'}

                {(amount0 === '' || amount1 === '') && 'Enter Amount'}
              </span>
            {depositLoading &&
              <Loader color={appTheme === 'dark' ? '#8F5AE8' : '#8F5AE8'}/>
            }
          </Button>

          {amount0 !== '' && amount1 !== '' && createLP &&
            <Button
              variant="contained"
              size="large"
              color="primary"
              onClick={onCreateAndDeposit}
              className={[classes.buttonOverride, classes[`buttonOverride--${appTheme}`]].join(" ")}>
              <span className={classes.actionButtonText}>
                Create LP
              </span>
              {depositLoading &&
                <Loader color={appTheme === 'dark' ? '#8F5AE8' : '#8F5AE8'}/>
              }
            </Button>
          }
        </>
      }

      {
        activeTab === 'withdraw' &&
        <>
          <Button
            variant="contained"
            size="large"
            color="primary"
            onClick={() => {
              if (withdrawAction === 'unstake') {
                onUnstake();
              }
            }}
            disabled={withdrawAction === null || amount1 === ''}
            className={[classes.buttonOverride, classes[`buttonOverride--${appTheme}`]].join(" ")}>
              <span className={classes.actionButtonText}>
                {withdrawAsset !== null &&
                  <>
                    {withdrawAction === null && 'Choose the action'}

                    {amount1 !== '' && withdrawAction === 'unstake' && 'Unstake LP'}

                    {amount1 !== '' && withdrawAction === 'remove' && 'Remove LP'}

                    {amount1 !== '' && withdrawAction === 'unstake-remove' && 'Unstake & Remove LP'}

                    {withdrawAction !== null && amount1 === '' && 'Enter Amount'}
                  </>
                }

                {withdrawAsset === null && 'Choose the pair'}
              </span>
            {depositLoading &&
              <Loader color={appTheme === 'dark' ? '#8F5AE8' : '#8F5AE8'}/>
            }
          </Button>
        </>
      }
    </Paper>
  );
}
