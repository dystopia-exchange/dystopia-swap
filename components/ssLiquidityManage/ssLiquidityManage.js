import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Tooltip,
  IconButton,
  MenuItem,
  InputBase,
  Select,
  ClickAwayListener, Grid,
} from "@mui/material";
import BigNumber from "bignumber.js";
import { formatCurrency } from "../../utils";
import classes from "./ssLiquidityManage.module.css";
import stores from "../../stores";
import { ACTIONS, CONTRACTS } from "../../stores/constants";
import {VE_TOKEN_NAME} from '../../stores/constants/contracts'
import {
  ArrowBackIosNew,
} from "@mui/icons-material";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import { formatSymbol, formatInputAmount } from "../../utils";
import AssetSelect from "../../ui/AssetSelect";
import Borders from "../../ui/Borders";
import Loader from "../../ui/Loader";
import SwitchCustom from "../../ui/Switch";
import Hint from "../hint/hint";
import BackButton from "../../ui/BackButton";

export default function ssLiquidityManage({initActiveTab = 'deposit',}) {
  const router = useRouter();
  const amount0Ref = useRef(null);
  const amount1Ref = useRef(null);
  const [hintAnchor, setHintAnchor] = React.useState(null);
  const [stablePoolHntAnchor, setStablePoolHntAnchor] = React.useState(null);
  const [volatilePoolHntAnchor, setVolatilePoolHntAnchor] = React.useState(null);

  const openHint = Boolean(hintAnchor);
  const openStablePoolHint = Boolean(stablePoolHntAnchor);
  const openVolatilePoolHint = Boolean(volatilePoolHntAnchor);

  const [pairReadOnly, setPairReadOnly] = useState(false);

  const [pair, setPair] = useState(null);
  const [veToken, setVeToken] = useState(null);

  const [depositLoading, setDepositLoading] = useState(false);
  const [stakeLoading, setStakeLoading] = useState(false);
  const [depositStakeLoading, setDepositStakeLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  const [amount0, setAmount0] = useState("");
  const [amount0Error, setAmount0Error] = useState(false);
  const [amount1, setAmount1] = useState("");
  const [amount1Error, setAmount1Error] = useState(false);

  const [stable, setStable] = useState(false);

  const [asset0, setAsset0] = useState(null);
  const [asset1, setAsset1] = useState(null);
  const [assetOptions, setAssetOptions] = useState([]);
  const [needAddToWhiteList, setNeedAddToWhiteList] = useState("");

  const [withdrawAsset, setWithdrawAsset] = useState(null);
  const [withdrawAassetOptions, setWithdrawAssetOptions] = useState([]);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAmountError, setWithdrawAmountError] = useState(false);

  const [withdrawAmount0, setWithdrawAmount0] = useState("");
  const [withdrawAmount1, setWithdrawAmount1] = useState("");

  const [activeTab, setActiveTab] = useState(initActiveTab);
  const [quote, setQuote] = useState(null);
  const [withdrawQuote, setWithdrawQuote] = useState(null);

  const [priorityAsset, setPriorityAsset] = useState(0);
  const [advanced, setAdvanced] = useState(true);

  const [token, setToken] = useState(null);
  const [vestNFTs, setVestNFTs] = useState([]);

  const [slippage, setSlippage] = useState("2");
  const [slippageError, setSlippageError] = useState(false);

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [anchorEl, setAnchorEl] = React.useState(null);

  const [withdrawAction, setWithdrawAction] = useState("");

  const [createLP, setCreateLP] = useState(true);

  const { appTheme } = useAppThemeContext();

  window.addEventListener("resize", () => {
    setWindowWidth(window.innerWidth);
  });

  const handleClickPopover = (event) => {
    setHintAnchor(event.currentTarget)
  };

  const handleClosePopover = () => {
    setHintAnchor(null)
  };

  const handleStablePoolClickPopover = (event) => {
    setStablePoolHntAnchor(event.currentTarget)
  };

  const handleStablePoolClosePopover = () => {
    setStablePoolHntAnchor(null)
  };

  const handleVolatilePoolClickPopover = (event) => {
    setVolatilePoolHntAnchor(event.currentTarget)
  };

  const handleVolatilePoolClosePopover = () => {
    setVolatilePoolHntAnchor(null)
  };

  const checkIsWhiteListedPair = async (pair) => {
    if (pair === null) {
      return;
    }
    setNeedAddToWhiteList("");

    const web3 = await stores.accountStore.getWeb3Provider();

    const voterContract = new web3.eth.Contract(
      CONTRACTS.VOTER_ABI,
      CONTRACTS.VOTER_ADDRESS
    );

    const [token0, token1] = await Promise.all([
      voterContract.methods.isWhitelisted(pair.token0.address).call(),
      voterContract.methods.isWhitelisted(pair.token1.address).call(),
    ]);

    const symbols = [];

    if (token0 === false) {
      symbols.push(pair.token0.symbol);
    }

    if (token1 === false) {
      symbols.push(pair.token1.symbol);
    }

    if (symbols.length > 0) {
      setNeedAddToWhiteList(symbols.join(", "));
    }
  };

  const openSlippage = Boolean(anchorEl);

  const ssUpdated = async () => {
    const storeAssetOptions = stores.stableSwapStore.getStore("baseAssets");
    const nfts = stores.stableSwapStore.getStore("vestNFTs");
    const veTok = stores.stableSwapStore.getStore("veToken");
    const pairs = stores.stableSwapStore.getStore("pairs");

    const onlyWithBalance = pairs.filter((ppp) => {
      return (
        BigNumber(ppp.balance).gt(0) ||
        (ppp.gauge && BigNumber(ppp.gauge.balance).gt(0))
      );
    });

    setWithdrawAssetOptions(onlyWithBalance);
    setWithdrawAsset(onlyWithBalance[0]);
    setAssetOptions(storeAssetOptions);
    setVeToken(veTok);
    setVestNFTs(nfts);

    if (nfts.length > 0) {
      if (token == null) {
        setToken(nfts[0]);
      }
    }

    if (router.query.address && router.query.address !== "create") {
      setPairReadOnly(true);

      const pp = await stores.stableSwapStore.getPairByAddress(
        router.query.address
      );
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
        setWithdrawAsset(withdrawAassetOptions[0]);
      }

      if (aa0 && aa1) {
        const p = await stores.stableSwapStore.getPair(
          aa0.address,
          aa1.address,
          stable
        );
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

      setAmount0("");
      setAmount1("");
      setQuote(null);
      setWithdrawAmount("");
      setWithdrawAmount0("");
      setWithdrawAmount1("");
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
      setAssetOptions(stores.stableSwapStore.getStore("baseAssets"));
    };

    // ssUpdated();

    stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
    stores.emitter.on(ACTIONS.LIQUIDITY_ADDED, depositReturned);
    stores.emitter.on(ACTIONS.ADD_LIQUIDITY_AND_STAKED, depositReturned);
    stores.emitter.on(ACTIONS.LIQUIDITY_REMOVED, depositReturned);
    stores.emitter.on(ACTIONS.REMOVE_LIQUIDITY_AND_UNSTAKED, depositReturned);
    stores.emitter.on(ACTIONS.LIQUIDITY_STAKED, depositReturned);
    stores.emitter.on(ACTIONS.LIQUIDITY_UNSTAKED, depositReturned);
    stores.emitter.on(ACTIONS.PAIR_CREATED, depositReturned);
    stores.emitter.on(ACTIONS.QUOTE_ADD_LIQUIDITY_RETURNED, quoteAddReturned);
    stores.emitter.on(
      ACTIONS.QUOTE_REMOVE_LIQUIDITY_RETURNED,
      quoteRemoveReturned
    );
    stores.emitter.on(ACTIONS.CREATE_GAUGE_RETURNED, createGaugeReturned);
    stores.emitter.on(ACTIONS.BASE_ASSETS_UPDATED, assetsUpdated);
    stores.emitter.on(ACTIONS.ERROR, errorReturned);

    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
      stores.emitter.removeListener(ACTIONS.LIQUIDITY_ADDED, depositReturned);
      stores.emitter.removeListener(
        ACTIONS.ADD_LIQUIDITY_AND_STAKED,
        depositReturned
      );
      stores.emitter.removeListener(ACTIONS.LIQUIDITY_REMOVED, depositReturned);
      stores.emitter.removeListener(
        ACTIONS.REMOVE_LIQUIDITY_AND_UNSTAKED,
        depositReturned
      );
      stores.emitter.removeListener(ACTIONS.LIQUIDITY_STAKED, depositReturned);
      stores.emitter.removeListener(
        ACTIONS.LIQUIDITY_UNSTAKED,
        depositReturned
      );
      stores.emitter.removeListener(ACTIONS.PAIR_CREATED, depositReturned);
      stores.emitter.removeListener(
        ACTIONS.QUOTE_ADD_LIQUIDITY_RETURNED,
        quoteAddReturned
      );
      stores.emitter.removeListener(
        ACTIONS.QUOTE_REMOVE_LIQUIDITY_RETURNED,
        quoteRemoveReturned
      );
      stores.emitter.removeListener(
        ACTIONS.CREATE_GAUGE_RETURNED,
        createGaugeReturned
      );
      stores.emitter.removeListener(ACTIONS.BASE_ASSETS_UPDATED, assetsUpdated);
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
    };
  }, []);

  useEffect(async () => {
    ssUpdated();
  }, [router.query.address]);

  const onBack = () => {
    router.push("/liquidity");
  };

  const callQuoteAddLiquidity = (
    amountA,
    amountB,
    pa,
    sta,
    pp,
    assetA,
    assetB
  ) => {
    if (parseFloat(pp?.reserve0) != 0 && parseFloat(pp?.reserve1) != 0) {
      if (!pp) {
        return null;
      }

      let invert = false;

      let addy0 = assetA.address;
      let addy1 = assetB.address;

      if (assetA.address === "MATIC") {
        addy0 = CONTRACTS.WFTM_ADDRESS;
      }
      if (assetB.address === "MATIC") {
        addy1 = CONTRACTS.WFTM_ADDRESS;
      }

      if (
        addy1.toLowerCase() == pp.token0.address.toLowerCase() &&
        addy0.toLowerCase() == pp.token1.address.toLowerCase()
      ) {
        invert = true;
      }

      if (pa == 0) {
        if (amountA == "") {
          setAmount1("");
        } else {
          if (invert) {
            amountB = BigNumber(amountA)
              .times(parseFloat(pp.reserve0))
              .div(parseFloat(pp.reserve1))
              .toFixed(
                parseFloat(pp.token0.decimals) > 6
                  ? 6
                  : parseFloat(pp.token0.decimals)
              );
          } else {
            amountB = BigNumber(amountA)
              .times(parseFloat(pp.reserve1))
              .div(parseFloat(pp.reserve0))
              .toFixed(
                parseFloat(pp.token1.decimals) > 6
                  ? 6
                  : parseFloat(pp.token1.decimals)
              );
          }
          setAmount1(amountB);
        }
      }
      if (pa == 1) {
        if (amountB == "") {
          setAmount0("");
        } else {
          if (invert) {
            amountA = BigNumber(amountB)
              .times(parseFloat(pp.reserve1))
              .div(parseFloat(pp.reserve0))
              .toFixed(
                parseFloat(pp.token1.decimals) > 6
                  ? 6
                  : parseFloat(pp.token1.decimals)
              );
          } else {
            amountA = BigNumber(amountB)
              .times(parseFloat(pp.reserve0))
              .div(parseFloat(pp.reserve1))
              .toFixed(
                parseFloat(pp.token0.decimals) > 6
                  ? 6
                  : parseFloat(pp.token0.decimals)
              );
          }
          setAmount0(amountA);
        }
      }

      if (
        BigNumber(amountA).lte(0) ||
        BigNumber(amountB).lte(0) ||
        isNaN(amountA) ||
        isNaN(amountB)
      ) {
        return null;
      }

      stores.dispatcher.dispatch({
        type: ACTIONS.QUOTE_ADD_LIQUIDITY,
        content: {
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
    if (!p) {
      return null;
    }

    stores.dispatcher.dispatch({
      type: ACTIONS.QUOTE_REMOVE_LIQUIDITY,
      content: {
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
    if (event.target.value == "" || !isNaN(event.target.value)) {
      setSlippage(event.target.value);
    }
  };

  const setAmountPercent = (asset, input) => {
    setAmount0Error(false);
    setAmount1Error(false);

    if (input === "amount0") {
      let am = BigNumber(asset0.balance).toFixed(parseFloat(asset0.decimals));
      if (!isNaN(am)) setAmount0(am);
      callQuoteAddLiquidity(am, amount1, 0, stable, pair, asset0, asset1);
    } else if (input === "amount1") {
      let am = BigNumber(asset1.balance).toFixed(parseFloat(asset1.decimals));
      if (!isNaN(am)) setAmount1(am);
      callQuoteAddLiquidity(amount0, am, 1, stable, pair, asset0, asset1);
    } else if (input === "stake") {
      let am = BigNumber(asset.balance).toFixed(parseFloat(asset.decimals));
      if (!isNaN((am / asset?.balance) * 100))
        setAmount0((am / asset?.balance) * 100);
    } else if (input === "withdraw") {
      let am = "";
      am = BigNumber(asset.balance).toFixed(parseFloat(asset.decimals));
      if (!isNaN((am / asset.balance) * 100))
        setWithdrawAmount((am / asset.balance) * 100);

      if (am === "") {
        setWithdrawAmount0("");
        setWithdrawAmount1("");
      } else if (am !== "" && !isNaN(am)) {
        calcRemove(asset, am);
      }
    }
  };
  const setAmountPercentGauge = (asset, input) => {
    if (input === "withdraw") {
      let am = "";
      if (asset && asset.gauge) {
        am = BigNumber(asset.gauge.balance);
        if (!isNaN((am / asset.gauge.balance) * 100))
          setWithdrawAmount((am / asset.gauge.balance) * 100);
      }
      if (am === "") {
        setWithdrawAmount0("");
        setWithdrawAmount1("");
      } else if (am !== "" && !isNaN(am)) {
        calcRemove(asset, am);
      }
    }
  };

  const onDeposit = () => {
    setAmount0Error(false);
    setAmount1Error(false);

    let error = false;

    if (!amount0 || amount0 === "" || isNaN(amount0)) {
      setAmount0Error("Amount 0 is required");
      error = true;
    } else {
      if (
        !asset0.balance ||
        isNaN(asset0.balance) ||
        BigNumber(asset0.balance).lte(0)
      ) {
        setAmount0Error("Invalid balance");
        error = true;
      } else if (BigNumber(amount0).lte(0)) {
        setAmount0Error("Invalid amount");
        error = true;
      } else if (asset0 && BigNumber(amount0).gt(asset0.balance)) {
        setAmount0Error(`Greater than your available balance`);
        error = true;
      }
    }

    if (!amount1 || amount1 === "" || isNaN(amount1)) {
      setAmount1Error("Amount 0 is required");
      error = true;
    } else {
      if (
        !asset1.balance ||
        isNaN(asset1.balance) ||
        BigNumber(asset1.balance).lte(0)
      ) {
        setAmount1Error("Invalid balance");
        error = true;
      } else if (BigNumber(amount1).lte(0)) {
        setAmount1Error("Invalid amount");
        error = true;
      } else if (asset1 && BigNumber(amount1).gt(asset1.balance)) {
        setAmount1Error(`Greater than your available balance`);
        error = true;
      }
    }

    if (!error) {
      setDepositLoading(true);

      stores.dispatcher.dispatch({
        type: ACTIONS.ADD_LIQUIDITY,
        content: {
          pair: pair,
          token0: asset0,
          token1: asset1,
          amount0: amount0,
          amount1: amount1,
          minLiquidity: quote ? quote : "0",
          slippage: (slippage && slippage) != "" ? slippage : "2",
        },
      });
    }
  };

  const onStake = (pair, percent, balance) => {
    setAmount0Error(false);

    let error = false;

    if (!error) {
      setStakeLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.STAKE_LIQUIDITY,
        content: {
          pair: pair,
          amount: (percent * balance) / 100,
          token: token,
          percent: percent,
          slippage: (slippage && slippage) != "" ? slippage : "2",
        },
      });
    }
  };

  const onCreateAndDeposit = () => {
    setAmount0Error(false);
    setAmount1Error(false);
    let error = false;

    if (!amount0 || amount0 === "" || isNaN(amount0)) {
      setAmount0Error("Amount 0 is required");
      error = true;
    } else {
      if (
        !asset0.balance ||
        isNaN(asset0.balance) ||
        BigNumber(asset0.balance).lte(0)
      ) {
        setAmount0Error("Invalid balance");
        error = true;
      } else if (BigNumber(amount0).lte(0)) {
        setAmount0Error("Invalid amount");
        error = true;
      } else if (asset0 && BigNumber(amount0).gt(asset0.balance)) {
        setAmount0Error(`Greater than your available balance`);
        error = true;
      }
    }

    if (!amount1 || amount1 === "" || isNaN(amount1)) {
      setAmount1Error("Amount 0 is required");
      error = true;
    } else {
      if (
        !asset1.balance ||
        isNaN(asset1.balance) ||
        BigNumber(asset1.balance).lte(0)
      ) {
        setAmount1Error("Invalid balance");
        error = true;
      } else if (BigNumber(amount1).lte(0)) {
        setAmount1Error("Invalid amount");
        error = true;
      } else if (asset1 && BigNumber(amount1).gt(asset1.balance)) {
        setAmount1Error(`Greater than your available balance`);
        error = true;
      }
    }

    if (!asset0 || asset0 === null) {
      setAmount0Error("Asset is required");
      error = true;
    }

    if (!asset1 || asset1 === null) {
      setAmount1Error("Asset is required");
      error = true;
    }

    if (!error) {
      setDepositLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.CREATE_PAIR_AND_DEPOSIT,
        content: {
          token0: asset0,
          token1: asset1,
          amount0: amount0,
          amount1: amount1,
          isStable: stable,
          token: token,
          slippage: (slippage && slippage) != "" ? slippage : "2",
        },
      });
    }
  };

  const onWithdraw = (withdrawAsset) => {
    setWithdrawAmountError(false);

    let error = false;

    if (!withdrawAsset || withdrawAsset === null) {
      setWithdrawAmountError("Asset is required");
      error = true;
    }
    if (!withdrawAmount || withdrawAmount === "" || isNaN(withdrawAmount)) {
      setWithdrawAmountError("Amount is required");
      error = true;
    } else {
      if (BigNumber(withdrawAmount).lte(0)) {
        setWithdrawAmountError("Invalid amount");
        error = true;
      }
    }
    if (!error) {
      setDepositLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.REMOVE_LIQUIDITY,
        content: {
          pair: withdrawAsset,
          token0: withdrawAsset.token0,
          token1: withdrawAsset.token1,
          percent: withdrawAmount,
          slippage: (slippage && slippage) != "" ? slippage : "2",
        },
      });
    }
  };

  const onUnstake = () => {
    setStakeLoading(true);

    stores.dispatcher.dispatch({
      type: ACTIONS.UNSTAKE_LIQUIDITY,
      content: {
        pair: pair,
        token0: pair.token0,
        token1: pair.token1,
        amount: (withdrawAmount * pair.gauge.balance) / 100,
        amount0: withdrawAmount0,
        amount1: withdrawAmount1,
        quote: withdrawQuote,
        percent: withdrawAmount,
        slippage: (slippage && slippage) != "" ? slippage : "2",
        all: (withdrawAmount == 100)
      },
    });
  };

  const handleWithdraw = (withdrawAsset) => {
    if (withdrawAction === "unstake") {
      onUnstake();
    }

    if (withdrawAction === "remove") {
      onWithdraw(withdrawAsset);
    }
  };

  const onCreateGauge = () => {
    setCreateLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.CREATE_GAUGE,
      content: {
        pair: pair,
      },
    });
  };

  const toggleDeposit = () => {
    setActiveTab("deposit");
  };

  const toggleWithdraw = () => {
    setActiveTab("withdraw");
  };

  const amount0Changed = (balance) => {
    const value = formatInputAmount(event.target.value.replace(",", "."));

    setAmount0Error(false);
    if (!createLP) {
      if (value <= 100) {
        if (!isNaN(value)) setAmount0(value);
      }
    } else {
      if (!isNaN(value)) setAmount0(value);
      if (createLP) {
        callQuoteAddLiquidity(
          value,
          amount1,
          priorityAsset,
          stable,
          pair,
          asset0,
          asset1
        );
      }
    }
  };

  const amount1Changed = () => {
    const value = formatInputAmount(event.target.value.replace(",", "."));
    setAmount1Error(false);
    if (!isNaN(value)) setAmount1(value);
    callQuoteAddLiquidity(
      amount0,
      value,
      priorityAsset,
      stable,
      pair,
      asset0,
      asset1
    );
  };

  const amount0Focused = (event) => {
    setPriorityAsset(0);
    if (createLP)
      callQuoteAddLiquidity(amount0, amount1, 0, stable, pair, asset0, asset1);
  };

  const amount1Focused = (event) => {
    setPriorityAsset(1);
    callQuoteAddLiquidity(amount0, amount1, 1, stable, pair, asset0, asset1);
  };

  const onAssetSelect = async (type, value) => {
    if (type === "amount0" && createLP) {
      setAsset0(value);
      const p = createLP
        ? await stores.stableSwapStore.getPair(
            value.address,
            asset1.address,
            stable
          )
        : await stores.stableSwapStore.getPair(
            value.token0.address,
            value.token1.address,
            value.isStable
          );
      await checkIsWhiteListedPair(p);
      setPair(p);
      if (createLP) {
        callQuoteAddLiquidity(
          amount0,
          amount1,
          priorityAsset,
          stable,
          p,
          value,
          asset1
        );
      }
    } else if (type === "amount0" && !createLP) {
      setWithdrawAsset(value);
      setAsset0(value);
      const p = await stores.stableSwapStore.getPair(
        value.token0.address,
        value.token1.address,
        value.isStable
      );
      setPair(p);
    } else if (type === "amount1") {
      setAsset1(value);
      const p = await stores.stableSwapStore.getPair(
        asset0.address,
        value.address,
        stable
      );
      await checkIsWhiteListedPair(p);
      setPair(p);
      if (createLP) {
        callQuoteAddLiquidity(
          amount0,
          amount1,
          priorityAsset,
          stable,
          p,
          asset0,
          value
        );
      }
    } else if (type === "withdraw") {
      setWithdrawAsset(value);
      const p = await stores.stableSwapStore.getPair(
        value.token0.address,
        value.token1.address,
        value.isStable
      );
      setPair(p);
      calcRemove(p, withdrawAsset?.balance);
    }
  };

  const setStab = async (val) => {
    setStable(val);
    const p = await stores.stableSwapStore.getPair(
      asset0.address,
      asset1.address,
      val
    );
    setPair(p);

    callQuoteAddLiquidity(
      amount0,
      amount1,
      priorityAsset,
      val,
      p,
      asset0,
      asset1
    );
  };
  const swapAssets = async () => {
    const fa = asset0;
    const ta = asset1;
    const fam = amount0
    const tam = amount1
    setPriorityAsset(!priorityAsset)
    setAmount0(tam)
    setAmount1(fam)
    setAsset0(ta);
    setAsset1(fa);
    let pair = await stores.stableSwapStore.getPair(
      asset1.address,
      asset0.address,
      stable
    );
    callQuoteAddLiquidity(
      amount1,
      amount0,
      priorityAsset,
      stable,
      pair,
      asset1,
      asset0
    );
  };
  const withdrawAmountChanged = (withdrawAsset) => {
    const value = formatInputAmount(event.target.value.replace(",", "."));

    setWithdrawAmountError(false);
    if (value <= 100) {
      if (!isNaN(value)) setWithdrawAmount(value);
    }
    if (value === "") {
      setWithdrawAmount0("");
      setWithdrawAmount1("");
    } else if (value !== "" && !isNaN(value) && value <= 100) {
      calcRemove(withdrawAsset, (value * withdrawAsset?.balance) / 100);
    }
  };

  const calcRemove = (pear, amount) => {
    if (!(amount && amount != "" && amount > 0)) {
      return;
    }
    callQuoteRemoveLiquidity(pear, amount);
  };

  const renderMediumInput = (type, value, logo, symbol) => {
    return (
      <div className={classes.textFieldReceiveAsset}>
        <div className={classes.mediumdisplayDualIconContainerTitle}>{type === 'withdrawAmount0' ? '1st' : '2nd'} token</div>
        <div
          className={[
            classes.mediumInputContainer,
            classes[`mediumInputContainer--${appTheme}`],
            classes[`mediumInputContainer--${type}`],
          ].join(" ")}
        >
          <div className={classes.mediumdisplayDualIconContainer}>
            {logo && (
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
            )}
            {!logo && (
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
            )}
          </div>

          <div className={classes.mediumInputAmountContainer}>
            <InputBase
              className={classes.mediumInputAmount}
              placeholder="0.00"
              value={value}
              disabled={true}
              inputProps={{
                className: [
                  classes.mediumInput,
                  classes[`mediumInput--${appTheme}`],
                ].join(" "),
              }}
              InputProps={{
                disableUnderline: true,
              }}
            />
            <Typography color="textSecondary" className={classes.smallestText}>
              {symbol}
            </Typography>
          </div>
        </div>
      </div>
    );
  };

  const renderMassiveInput = (
    type,
    amountValue,
    amountError,
    amountChanged,
    assetValue,
    assetError,
    assetOptions,
    onAssetSelect,
    onFocus,
    inputRef
  ) => {
    return (
      <div
        className={[
          classes.textField,
          classes[`textField--${type}-${appTheme}`],
        ].join(" ")}
      >
        <Typography className={classes.inputTitleText} noWrap>
          {type === "amount0"
            ? createLP
              ? `1st ${windowWidth > 530 ? "token" : ""}`
              : "LP"
            : type !== "withdraw"
            ? `2nd ${windowWidth > 530 ? "token" : ""}`
            : "LP"}
        </Typography>

        {type !== "withdraw" && (
          <div
            className={[
              createLP ? classes.inputBalanceTextContainer : classes.inputBalanceTextContainerForPair,
              "g-flex",
              "g-flex--align-center",
            ].join(" ")}
          >
            <img
              src="/images/ui/icon-wallet.svg"
              className={classes.walletIcon}
            />

            {createLP ? (
              <Typography
                className={[classes.inputBalanceText, "g-flex__item"].join(" ")}
                noWrap
                onClick={() =>
                  assetValue?.balance && Number(assetValue?.balance) > 0
                    ? setAmountPercent(assetValue, type)
                    : null
                }
              >
                <span>
                  {assetValue && assetValue.balance
                    ? " " + formatCurrency(assetValue.balance)
                    : ""}
                </span>
              </Typography>
            ) : (
              <Typography
                className={[classes.inputBalanceText, "g-flex__item"].join(" ")}
                noWrap
                onClick={() =>
                  assetValue?.balance && Number(assetValue?.balance) > 0
                    ? setAmountPercent(assetValue, "stake")
                    : null
                }
              >
                <span>
                  {assetValue && assetValue.balance
                    ? " " + formatCurrency(assetValue.balance)
                    : ""}
                </span>
              </Typography>
            )}
            {assetValue?.balance &&
              Number(assetValue?.balance) > 0 &&
                (type === "amount0" || type === "amount1") &&
                createLP && (
                    <div
                        style={{
                          cursor: "pointer",
                          fontWeight: 500,
                          fontSize: 14,
                          lineHeight: "120%",
                          color: appTheme === "dark" ? "#4CADE6" : "#0B5E8E",
                        }}
                        onClick={() => setAmountPercent(assetValue, type)}
                    >
                      MAX
                    </div>
              )}
            {assetValue?.balance &&
              Number(assetValue?.balance) > 0 &&
                type === "amount0" &&
                !createLP && (
                    <div
                        style={{
                          cursor: "pointer",
                          fontWeight: 500,
                          fontSize: 14,
                          lineHeight: "120%",
                          color: appTheme === "dark" ? "#4CADE6" : "#0B5E8E",
                        }}
                        onClick={() => setAmountPercent(assetValue, "stake")}
                    >
                      MAX
                    </div>
                )}
          </div>
        )}

        <div
          className={`${classes.massiveInputContainer} ${
            (amountError || assetError) && classes.error
          }`}
        >
          <div className={type !== "withdraw" && createLP ? classes.massiveInputAssetSelectSingle : classes.massiveInputAssetSelect}>
            <AssetSelect
              type={type}
              value={assetValue}
              assetOptions={assetOptions}
              onSelect={onAssetSelect}
              size={type === "withdraw" ? "medium" : "default"}
              typeIcon={
                type === "withdraw" || (type !== "withdraw" && !createLP)
                  ? "double"
                  : "single"
              }
              isManageLocal={type !== "withdraw" && createLP}
            />
          </div>

          {type !== "withdraw" && (
            <>
              <InputBase
                className={classes.massiveInputAmount}
                placeholder="0.00"
                error={amountError}
                helperText={amountError}
                value={/*createLP ? */amountValue/* : `${amountValue}%`*/}
                onChange={() => amountChanged(assetValue?.balance)}
                disabled={
                  depositLoading ||
                  stakeLoading ||
                  depositStakeLoading ||
                  createLoading ||
                    !BigNumber(assetValue?.balance).gt(0)
                }
                onFocus={onFocus ? onFocus : null}
                inputProps={{
                  className: [
                    classes.largeInput,
                    classes[`largeInput--${appTheme}`],
                  ].join(" "),
                }}
                InputProps={{
                  disableUnderline: true,
                }}
              />
              {!createLP && <span className={classes.flyPercent}>%</span>}
            </>
          )}

          {/*{type === "withdraw" && (
            <>
              <div
                className={[
                  classes.tokenText,
                  classes[`tokenText--${appTheme}`],
                ].join(" ")}
              >
                {formatSymbol(assetValue?.symbol)}
              </div>

              <div
                className={[
                  classes.tokenTextLabel,
                  classes[`tokenTextLabel--${appTheme}`],
                ].join(" ")}
              >
                Variable pool
              </div>
            </>
          )}*/}
        </div>
      </div>
    );
  };

  const renderDepositInformation = () => {
    if (!pair) {
      return (
        <div className={classes.depositInfoContainer}>
          <Typography className={classes.depositInfoHeading}>
            Starting Liquidity Info
          </Typography>
          <div
            style={{
              width: "100%",
              border: `1px solid ${
                appTheme === "dark" ? "#5F7285" : "#86B9D6"
              }`,
            }}
            className={["g-flex"].join(" ")}
          >
            <div
              className={[
                classes.priceInfo,
                classes[`priceInfo--${appTheme}`],
              ].join(" ")}
            >
              <Borders
                offsetLeft={-1}
                offsetRight={-1}
                offsetTop={-1}
                offsetBottom={-1}
              />

              <Typography className={classes.title}>
                {BigNumber(amount1).gt(0)
                  ? formatCurrency(BigNumber(amount0).div(amount1))
                  : "0.00"}
              </Typography>

              <Typography className={classes.text}>
                {`${formatSymbol(asset0?.symbol ?? "")} per ${formatSymbol(
                  asset1?.symbol ?? ""
                )}`}
              </Typography>
            </div>

            <div
              className={[
                classes.priceInfo,
                classes[`priceInfo--${appTheme}`],
              ].join(" ")}
            >
              <Borders
                offsetLeft={-1}
                offsetRight={-1}
                offsetTop={-1}
                offsetBottom={-1}
              />

              <Typography className={classes.title}>
                {BigNumber(amount0).gt(0)
                  ? formatCurrency(BigNumber(amount1).div(amount0))
                  : "0.00"}
              </Typography>

              <Typography className={classes.text}>{`${formatSymbol(
                asset1?.symbol ?? ""
              )} per ${formatSymbol(asset0?.symbol ?? "")}`}</Typography>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className={classes.depositInfoContainer}>
          <div
            className={[
              classes.dividerLine,
              classes[`dividerLine--${appTheme}`],
            ].join(" ")}
          ></div>

          <Typography
            className={[
              classes.depositInfoHeading,
              classes[`depositInfoHeading--${appTheme}`],
            ].join(" ")}
          >
            Reserve Info
          </Typography>

          <div
            className={[
              classes.priceInfos,
              classes[`priceInfos--${appTheme}`],
            ].join(" ")}
          >
            <div
              className={[
                classes.priceInfo,
                classes[`priceInfo--${appTheme}`],
              ].join(" ")}
            >
              <Borders
                offsetLeft={-1}
                offsetRight={-1}
                offsetTop={-1}
                offsetBottom={-1}
              />

              <Typography className={classes.text}>
                {`${formatSymbol(pair?.token0?.symbol ?? "")}`}
              </Typography>

              <Typography className={classes.title}>
                {formatCurrency(pair?.reserve0 ?? "")}
              </Typography>
            </div>

            <div
              className={[
                classes.priceInfo,
                classes[`priceInfo--${appTheme}`],
              ].join(" ")}
            >
              <Borders
                offsetLeft={-1}
                offsetRight={-1}
                offsetTop={-1}
                offsetBottom={-1}
              />

              <Typography className={classes.text}>
                {`${formatSymbol(pair?.token1?.symbol ?? "")}`}
              </Typography>

              <Typography className={classes.title}>
                {formatCurrency(pair?.reserve1 ?? "")}
              </Typography>
            </div>
          </div>

          <Typography
            className={[
              classes.depositInfoHeading,
              classes[`depositInfoHeading--${appTheme}`],
            ].join(" ")}
          >
            {`Your Balances - ${formatSymbol(pair?.symbol ?? "")}`}
          </Typography>

          <div
            className={[
              classes.priceInfos,
              classes[`priceInfos--${appTheme}`],
            ].join(" ")}
          >
            <div
              className={[
                classes.priceInfo,
                classes[`priceInfo--${appTheme}`],
              ].join(" ")}
            >
              <Borders
                offsetLeft={-1}
                offsetRight={-1}
                offsetTop={-1}
                offsetBottom={-1}
              />

              <Typography className={classes.text}>Pooled</Typography>

              <Typography className={classes.title}>
                {formatCurrency(pair?.balance)}
              </Typography>
            </div>

            <div
              className={[
                classes.priceInfo,
                classes[`priceInfo--${appTheme}`],
              ].join(" ")}
            >
              <Borders
                offsetLeft={-1}
                offsetRight={-1}
                offsetTop={-1}
                offsetBottom={-1}
              />

              <Typography className={classes.text}>Staked</Typography>

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
        {withdrawAction !== action && (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
              fill={appTheme === "dark" ? "#151718" : "#DBE6EC"}
              stroke={appTheme === "dark" ? "#4CADE6" : "#0B5E8E"}
            />
          </svg>
        )}

        {withdrawAction === action && (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
              fill={appTheme === "dark" ? "#151718" : "#DBE6EC"}
              stroke={appTheme === "dark" ? "#4CADE6" : "#0B5E8E"}
            />
            <path
              d="M5 10C5 7.23858 7.23858 5 10 5C12.7614 5 15 7.23858 15 10C15 12.7614 12.7614 15 10 15C7.23858 15 5 12.7614 5 10Z"
              fill={appTheme === "dark" ? "#4CADE6" : "#0B5E8E"}
            />
          </svg>
        )}
      </>
    );
  };

  const renderWithdrawInformation = () => {
    return (
      <div className={classes.withdrawInfoContainer}>
        <div className={classes.myLiqCont}>
          <div className={classes.myLiq}>
            <div className={classes.myLiqBal}>
              <div>My Pool</div>
              <div>
                {withdrawAsset?.balance ?? '0.0'}
                <span className={classes.myLiqSpacer}></span>
              </div>
              <div className={classes.myLiqSplit}></div>
            </div>
            <div className={classes.myLiqBal}>
              <div>
                <span className={classes.myLiqSpacer}></span>
                My Stake
              </div>
              <div>{withdrawAsset?.gauge?.balance ?? '0.00'}</div>
            </div>
          </div>
        </div>

        <div className={[classes.togglesWithdraw, "g-flex-column"].join(" ")}>
          <div className={["g-flex", "g-flex--align-center"].join(" ")}>
            <div
              className={[
                classes.toggleOption,
                classes[`toggleOption--${appTheme}`],
                `${withdrawAction === "unstake" && classes.active}`,
              ].join(" ")}
              onClick={() => {
                setWithdrawAction("unstake");
              }}
            >
              {renderToggleIcon("unstake")}

              <Typography
                className={[
                  classes.toggleOptionText,
                  classes[`toggleOptionText--${appTheme}`],
                ].join(" ")}
              >
                I want to unstake LP
              </Typography>

              <Tooltip
                  title='Select "I want to unstake LP" if you have staked LP in the gauge.'
                  componentsProps={{
                    tooltip: { style: {padding: 24, background: '#1F2B49', fontSize: 16, fontWeight: 400, border: '1px solid #779BF4', borderRadius: 12,}},
                  }}
              >
                <div className={classes.tooltipCircle}>
                  <svg width="10" height="10" viewBox="0 0 5 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.23914 0.95C2.91914 0.95 3.46247 1.13667 3.86914 1.51C4.28247 1.88333 4.48914 2.39333 4.48914 3.04C4.48914 3.71333 4.27581 4.22 3.84914 4.56C3.42247 4.9 2.85581 5.07 2.14914 5.07L2.10914 5.86H1.11914L1.06914 4.29H1.39914C2.04581 4.29 2.53914 4.20333 2.87914 4.03C3.22581 3.85667 3.39914 3.52667 3.39914 3.04C3.39914 2.68667 3.29581 2.41 3.08914 2.21C2.88914 2.01 2.60914 1.91 2.24914 1.91C1.88914 1.91 1.60581 2.00667 1.39914 2.2C1.19247 2.39333 1.08914 2.66333 1.08914 3.01H0.0191407C0.0191407 2.61 0.109141 2.25333 0.289141 1.94C0.469141 1.62667 0.725807 1.38333 1.05914 1.21C1.39914 1.03667 1.79247 0.95 2.23914 0.95ZM1.59914 8.07C1.39247 8.07 1.21914 8 1.07914 7.86C0.939141 7.72 0.869141 7.54667 0.869141 7.34C0.869141 7.13333 0.939141 6.96 1.07914 6.82C1.21914 6.68 1.39247 6.61 1.59914 6.61C1.79914 6.61 1.96914 6.68 2.10914 6.82C2.24914 6.96 2.31914 7.13333 2.31914 7.34C2.31914 7.54667 2.24914 7.72 2.10914 7.86C1.96914 8 1.79914 8.07 1.59914 8.07Z" fill="#586586"/>
                  </svg>
                </div>
              </Tooltip>

            </div>

            <div
              className={[
                classes.toggleOption,
                classes[`toggleOption--${appTheme}`],
                `${withdrawAction === "remove" && classes.active}`,
              ].join(" ")}
              onClick={() => {
                setWithdrawAction("remove");
              }}
            >
              {renderToggleIcon("remove")}

              <Typography
                className={[
                  classes.toggleOptionText,
                  classes[`toggleOptionText--${appTheme}`],
                ].join(" ")}
              >
                I want to remove LP
              </Typography>

              <Tooltip
                  title='Select "I want to remove LP" if you have unstaked LP and want to remove liquidity.'
                  componentsProps={{
                    tooltip: { style: {padding: 24, background: '#1F2B49', fontSize: 16, fontWeight: 400, border: '1px solid #779BF4', borderRadius: 12,}},
                  }}
              >
                <div className={classes.tooltipCircle}>
                  <svg width="10" height="10" viewBox="0 0 5 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.23914 0.95C2.91914 0.95 3.46247 1.13667 3.86914 1.51C4.28247 1.88333 4.48914 2.39333 4.48914 3.04C4.48914 3.71333 4.27581 4.22 3.84914 4.56C3.42247 4.9 2.85581 5.07 2.14914 5.07L2.10914 5.86H1.11914L1.06914 4.29H1.39914C2.04581 4.29 2.53914 4.20333 2.87914 4.03C3.22581 3.85667 3.39914 3.52667 3.39914 3.04C3.39914 2.68667 3.29581 2.41 3.08914 2.21C2.88914 2.01 2.60914 1.91 2.24914 1.91C1.88914 1.91 1.60581 2.00667 1.39914 2.2C1.19247 2.39333 1.08914 2.66333 1.08914 3.01H0.0191407C0.0191407 2.61 0.109141 2.25333 0.289141 1.94C0.469141 1.62667 0.725807 1.38333 1.05914 1.21C1.39914 1.03667 1.79247 0.95 2.23914 0.95ZM1.59914 8.07C1.39247 8.07 1.21914 8 1.07914 7.86C0.939141 7.72 0.869141 7.54667 0.869141 7.34C0.869141 7.13333 0.939141 6.96 1.07914 6.82C1.21914 6.68 1.39247 6.61 1.59914 6.61C1.79914 6.61 1.96914 6.68 2.10914 6.82C2.24914 6.96 2.31914 7.13333 2.31914 7.34C2.31914 7.54667 2.24914 7.72 2.10914 7.86C1.96914 8 1.79914 8.07 1.59914 8.07Z" fill="#586586"/>
                  </svg>
                </div>
              </Tooltip>
            </div>
          </div>
        </div>

        {!withdrawAction && (
            <div className={classes.infoGreenContainer}>
              <span className={classes.infoContainerWarnGreen}>!</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z" fill="#4FC83A"/>
              </svg>
              <span className={classes.infoContainerWarnGreenText}>Please claim any rewards before withdrawing.</span>
            </div>
        )}

        {withdrawAsset !== null && withdrawAction !== null && (
          <div
            className={["g-flex", classes.liqWrapper].join(" ")}
            style={{ width: "100%", marginTop: 20 }}
          >
            <div className={["g-flex-column", "g-flex__item-fixed", classes.liqTokens].join(" ")}>
              <div
                className={[
                  classes.liqHeader,
                  classes[`liqHeader--${appTheme}`],
                  classes.liqHeaderLabel,
                  "g-flex",
                  "g-flex--align-center",
                ].join(" ")}
              >
                <div>LP token</div>
              </div>

              <div
                className={[
                  classes.liqBody,
                  classes[`liqBody--${appTheme}`],
                  classes.liqBodyLabel,
                  classes.liqBodyLabelOutline,
                  "g-flex",
                  "g-flex--align-center",
                ].join(" ")}
              >
                <div
                  className={[
                    classes.liqBodyIconContainer,
                    classes[`liqBodyIconContainer--${appTheme}`],
                  ].join(" ")}
                >
                  <img
                    className={classes.liqBodyIcon}
                    alt=""
                    src={
                      withdrawAsset ? `${withdrawAsset?.token0?.logoURI}` : ""
                    }
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                    }}
                  />
                </div>

                <div
                  className={[
                    classes.liqBodyIconContainer,
                    classes[`liqBodyIconContainer--${appTheme}`],
                  ].join(" ")}
                >
                  <img
                    className={classes.liqBodyIcon}
                    alt=""
                    src={
                      withdrawAsset ? `${withdrawAsset?.token1?.logoURI}` : ""
                    }
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                    }}
                  />
                </div>
              </div>

              <div
                  className={[
                    classes.tokenTextSecond,
                    classes[`tokenTextSecond--${appTheme}`],
                  ].join(" ")}
              >
                {withdrawAsset?.symbol}

                <Typography className={classes.labelSelectSecondary}>
                  {withdrawAsset?.isStable ? 'Stable pool' : 'Volatile Pool'}
                </Typography>
              </div>
            </div>

            <div className={["g-flex-column", "g-flex__item"].join(" ")}>
              {withdrawAction == "remove" && (
                <div
                  className={[
                    classes.liqHeader,
                    classes.liqHeaderWithdraw,
                    classes[`liqHeader--${appTheme}`],
                    "g-flex",
                    "g-flex--align-center",
                    "g-flex--space-between",
                  ].join(" ")}
                >

                  <div className={["g-flex", "g-flex--align-center"].join(" ")}>
                    <img
                      src="/images/ui/icon-wallet.svg"
                      className={classes.walletIcon}
                    />

                    <Typography
                      className={[
                        classes.inputBalanceText,
                        "g-flex__item",
                      ].join(" ")}
                      noWrap
                    >
                      {parseFloat(withdrawAsset?.balance) > 0
                        ? parseFloat(withdrawAsset?.balance).toFixed(10)
                        : "0.00"}
                    </Typography>
                  </div>

                  <div
                    className={[
                      classes.balanceMax,
                      classes[`balanceMax--${appTheme}`],
                    ].join(" ")}
                    onClick={() => setAmountPercent(withdrawAsset, "withdraw")}
                  >
                    MAX
                  </div>
                </div>
              )}
              {withdrawAction !== "remove" && (
                <div
                  className={[
                    classes.liqHeader,
                    classes.liqHeaderWithdraw,
                    classes[`liqHeader--${appTheme}`],
                    "g-flex",
                    "g-flex--align-center",
                    "g-flex--space-between",
                  ].join(" ")}
                >
                  <div className={["g-flex", "g-flex--align-center"].join(" ")}>
                    <img
                      src="/images/ui/icon-wallet.svg"
                      className={classes.walletIcon}
                    />

                    <Typography
                      className={[
                        classes.inputBalanceText,
                        "g-flex__item",
                      ].join(" ")}
                      noWrap
                    >
                      {parseFloat(withdrawAsset?.gauge?.balance) > 0
                        ? parseFloat(withdrawAsset?.gauge?.balance).toFixed(10)
                        : "0.00"}
                    </Typography>
                  </div>

                  <div
                    className={[
                      classes.balanceMax,
                      classes[`balanceMax--${appTheme}`],
                    ].join(" ")}
                    onClick={() =>
                      setAmountPercentGauge(withdrawAsset, "withdraw")
                    }
                  >
                    MAX
                  </div>
                </div>
              )}

              <div
                className={[
                  classes.liqBody,
                  classes.liqBodyIn,
                  classes[`liqBody--${appTheme}`],
                  "g-flex",
                  "g-flex--align-center",
                ].join(" ")}
              >
                <span className={classes.flyPercentWithdraw}>%</span>
                <InputBase
                  className={classes.massiveInputAmountUnstake}
                  placeholder="0.00"
                  error={amount1Error}
                  helperText={amount1Error}
                  value={withdrawAmount}
                  onChange={() => withdrawAmountChanged(withdrawAsset)}
                  disabled={
                    depositLoading ||
                    stakeLoading ||
                    depositStakeLoading ||
                    createLoading ||
                      (withdrawAction !== "remove" && !withdrawAsset?.gauge?.balance) ||
                      ((withdrawAction === "remove" || withdrawAction === "unstake-remove") && (!withdrawAsset?.balance || !BigNumber(withdrawAsset?.balance).gt(0)))
                  }
                  onFocus={amount1Focused ? amount1Focused : null}
                  inputProps={{
                    className: [
                      classes.largeInput,
                      classes[`largeInput--${appTheme}`],
                    ].join(" "),
                  }}
                  InputProps={{
                    // startAdornment: "%",
                    disableUnderline: true,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {withdrawAsset !== null &&
          withdrawAction !== null &&
          (withdrawAction === "remove" ||
            withdrawAction === "unstake-remove") && (
            <div
              style={{
                position: "relative",
              }}
            >
              <div
                className={[
                  classes.swapIconContainerWithdraw,
                  classes[`swapIconContainerWithdraw--${appTheme}`],
                ].join(" ")}
              >
                <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="6" width="60" height="60" rx="30" fill="#171D2D"/>
                  <path d="M43.8398 46.4194L43.8398 32.5794C43.8398 30.9194 42.4998 29.5794 40.8398 29.5794L37.5198 29.5794" stroke="#8191B9" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M47 43.2599L43.84 46.4199L40.68 43.2599" stroke="#8191B9" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M28.16 46.4196L28.16 32.5796C28.16 30.9196 29.5 29.5796 31.16 29.5796L39 29.5796" stroke="#8191B9" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M24.9998 43.2598L28.1598 46.4198L31.3198 43.2598" stroke="#8191B9" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M35.25 29.5C35.25 29.9142 35.5858 30.25 36 30.25C36.4142 30.25 36.75 29.9142 36.75 29.5H35.25ZM36.75 25C36.75 24.5858 36.4142 24.25 36 24.25C35.5858 24.25 35.25 24.5858 35.25 25H36.75ZM36.75 29.5V25H35.25V29.5H36.75Z" fill="#8191B9"/>
                  <rect x="6" y="6" width="60" height="60" rx="30" stroke="#060B17" stroke-width="12"/>
                </svg>

              </div>

              <div className={classes.receiveAssets}>
                {renderMediumInput(
                  "withdrawAmount0",
                  withdrawAmount0,
                  withdrawAsset?.token0?.logoURI,
                  withdrawAsset?.token0?.symbol
                )}
                {renderMediumInput(
                  "withdrawAmount1",
                  withdrawAmount1,
                  withdrawAsset?.token1?.logoURI,
                  withdrawAsset?.token1?.symbol
                )}
              </div>
            </div>
          )}
      </div>
    );
  };

  /*const renderSmallInput = (type, amountValue, amountError, amountChanged) => {
    return (
      <div
        className={[
          "g-flex",
          "g-flex--align-center",
          "g-flex--space-between",
        ].join(" ")}
      >
        <div
          className={[
            classes.slippageTextContainer,
            classes[`slippageTextContainer--${appTheme}`],
            "g-flex",
            "g-flex--align-center",
          ].join(" ")}
        >
          <div style={{ marginRight: 5 }}>Slippage:</div>
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
                border: "none",
                borderRadius: 0,
              },
              classes: {
                root: classes.searchInput,
              },
              endAdornment: (
                <InputAdornment position="end">
                  <span
                    style={{
                      color: appTheme === "dark" ? "#ffffff" : "#325569",
                    }}
                  >
                    %
                  </span>
                </InputAdornment>
              ),
            }}
            inputProps={{
              className: [
                classes.smallInput,
                classes[`inputBalanceSlippageText--${appTheme}`],
              ].join(" "),
              style: {
                textAlign: "right",
                padding: 0,
                borderRadius: 0,
                border: "none",
                fontSize: 14,
                fontWeight: 400,
                lineHeight: "120%",
                color: appTheme === "dark" ? "#C6CDD2" : "#325569",
              },
            }}
          />
        </div>
      </div>
    );
  };*/

  const renderMediumInputToggle = (type, value) => {
    return (
      <div className={[classes.toggles, "g-flex"].join(" ")}>
        <div
          style={{
            marginRight: 20,
          }}
          className={[
            classes.toggleOption,
            classes[`toggleOption--${appTheme}`],
            `${stable && classes.active}`,
          ].join(" ")}
          onClick={() => {
            setStab(true);
          }}
        >
          {!stable && (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
                fill={appTheme === "dark" ? "#151718" : "#DBE6EC"}
                stroke={appTheme === "dark" ? "#4CADE6" : "#0B5E8E"}
              />
            </svg>
          )}

          {stable && (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
                fill={appTheme === "dark" ? "#151718" : "#DBE6EC"}
                stroke={appTheme === "dark" ? "#4CADE6" : "#0B5E8E"}
              />
              <path
                d="M5 10C5 7.23858 7.23858 5 10 5C12.7614 5 15 7.23858 15 10C15 12.7614 12.7614 15 10 15C7.23858 15 5 12.7614 5 10Z"
                fill={appTheme === "dark" ? "#4CADE6" : "#0B5E8E"}
              />
            </svg>
          )}

          <Typography
            className={[
              classes.toggleOptionText,
              classes[`toggleOptionText--${appTheme}`],
            ].join(" ")}
          >
            Stable Pool
          </Typography>

          <Hint
              fill="#586586"
              hintText={
                "Stable pool provides correlated asset swaps with low slippage."
              }
              open={openStablePoolHint}
              anchor={stablePoolHntAnchor}
              handleClick={handleStablePoolClickPopover}
              handleClose={handleStablePoolClosePopover}
              vertical={46}
          />
        </div>

        <div
          className={[
            classes.toggleOption,
            classes[`toggleOption--${appTheme}`],
            `${!stable && classes.active}`,
          ].join(" ")}
          onClick={() => {
            setStab(false);
          }}
        >
          {stable && (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
                fill={appTheme === "dark" ? "#151718" : "#DBE6EC"}
                stroke={appTheme === "dark" ? "#4CADE6" : "#0B5E8E"}
              />
            </svg>
          )}

          {!stable && (
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
                fill={appTheme === "dark" ? "#151718" : "#DBE6EC"}
                stroke={appTheme === "dark" ? "#4CADE6" : "#0B5E8E"}
              />
              <path
                d="M5 10C5 7.23858 7.23858 5 10 5C12.7614 5 15 7.23858 15 10C15 12.7614 12.7614 15 10 15C7.23858 15 5 12.7614 5 10Z"
                fill={appTheme === "dark" ? "#4CADE6" : "#0B5E8E"}
              />
            </svg>
          )}

          <Typography
            className={[
              classes.toggleOptionText,
              classes[`toggleOptionText--${appTheme}`],
            ].join(" ")}
          >
            Volatile Pool
          </Typography>

          <Hint
              fill="#586586"
              hintText={
                "Volatile pools are the most appropriate for uncorrelated assets, their structure provides greater flexibility for price fluctuation."
              }
              open={openVolatilePoolHint}
              anchor={volatilePoolHntAnchor}
              handleClick={handleVolatilePoolClickPopover}
              handleClose={handleVolatilePoolClosePopover}
              vertical={46}
          />
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
          className={[
            classes.slippageIconContainer,
            openSelectToken ? classes["selectTokenIconContainer--active"] : "",
            classes[`slippageIconContainer--${appTheme}`],
          ].join(" ")}
        >
          <svg width="18" height="9" viewBox="0 0 18 9" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.9201 0.950012L10.4001 7.47001C9.63008 8.24001 8.37008 8.24001 7.60008 7.47001L1.08008 0.950012" stroke="#D3F85A" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </ClickAwayListener>
    );
  };

  const renderTokenSelect = () => {
    return (
      <Select
          onClick={openSelect}
        className={[
          classes.tokenSelect,
          classes[`tokenSelect--${appTheme}`],
            openSelectToken ? classes.tokenSelectOpen : '',
        ].join(" ")}
        fullWidth
        value={token}
        {...{
          displayEmpty: token === null ? true : undefined,
          renderValue:
            token === null
              ? (selected) => {
                  if (selected === null) {
                    return (
                      <div
                        style={{
                          padding: 5,
                          paddingLeft: 15.5,
                          paddingRight: 10,
                          fontWeight: 400,
                          fontSize: 16,
                          color: '#D3F85A',
                        }}
                      >
                        Select {veToken?.symbol} NFT
                      </div>
                    );
                  }
                }
              : undefined,
        }}
        MenuProps={{
          classes: {
            list: appTheme === "dark" ? classes["list--dark"] : classes.list,
            paper: classes.listPaper,
            // root: '',
          },
        }}
        open={openSelectToken}
        onChange={handleChange}
        IconComponent={selectArrow}
        inputProps={{
          className:
            appTheme === "dark"
              ? classes["tokenSelectInput--dark"]
              : classes.tokenSelectInput,
        }}
      >
        {!vestNFTs.length &&
            <div className={classes.noNFT}>
              <div className={classes.noNFTtext}>
                You receive NFT by creating a Lock of your CONE for some time, the more CONE you lock and for the longest time, the more Voting Power your NFT will have.
              </div>
              <div className={classes.noNFTlinks}>
                <span className={classes.noNFTlinkButton} onClick={() => {router.push("/swap")}}>BUY CONE</span>
                <span className={classes.noNFTlinkButton} onClick={() => {router.push("/vest")}}>LOCK CONE FOR NFT</span>
              </div>
            </div>
        }
        {vestNFTs &&
          vestNFTs.map((option) => {
            return (
              <MenuItem key={option.id} value={option}>
                <div
                  className={[
                    classes.menuOption,
                    "g-flex",
                    "g-flex--align-center",
                    "g-flex--space-between",
                  ].join(" ")}
                >
                  <Typography
                    className={classes.menuOptionLabel}
                    style={{
                      // fontWeight: 500,
                      // fontSize: 12,
                      // marginRight: 30,
                      color: "#D3F85A",
                    }}
                  >
                    <span className={classes.nftword}>NFT </span>#{option.id}
                  </Typography>

                  <div
                    className={[
                      classes.menuOptionSec,
                      "g-flex",
                      "g-flex--align-center",
                    ].join(" ")}
                  >
                    <Typography
                        className={classes.menuOptionSecText}
                    >
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

  const switchToggleCreateLP = () => {
    const nextValue = !createLP;
    setAsset0(null);
    setWithdrawAsset(null);
    setAmount0("");
    setAmount0Error(false);
    setAsset1(null);
    setAmount1("");
    setAmount1Error(false);
    setCreateLP(nextValue);

    if (nextValue) {
      ssUpdated();
    }
  };

  const [lockedNft, setLockedNft] = useState()

  useEffect(() => {
    if (withdrawAsset?.gauge?.tokenId && vestNFTs.length > 0) {
      setLockedNft(vestNFTs.filter(a => a.id == withdrawAsset?.gauge?.tokenId)[0])
    } else {
      setLockedNft(undefined)
    }
  }, [withdrawAsset?.gauge?.tokenId, vestNFTs.length]);

  return (
      <div className="g-flex g-flex--justify-center">
        <div className={classes.bigscreenSidebar}>
          <BackButton
              text="Back to Liquidity"
              url="/liquidity"
          />
        </div>
        <Paper elevation={0} className={[classes.container, "g-flex-column"]}>

          <div className={classes.toggleButtons}>
            <Grid container spacing={0} sx={{height: '100%'}}>
              <Grid item lg={6} md={6} sm={6} xs={6}>
                <Paper
                    className={`${activeTab === "deposit" ? classes.buttonActive : classes.button} ${classes.topLeftButton}`}
                    onClick={toggleDeposit}
                    disabled={depositLoading}
                >
                  <span
                      style={{
                        color: activeTab === "deposit"
                            ? "#060B17"
                            : "#8191B9",
                      }}
                  >
                    Add Liquidity
                  </span>
                </Paper>
              </Grid>

              <Grid item lg={6} md={6} sm={6} xs={6}>
                <Paper
                    className={`${
                        activeTab === "withdraw" ? classes.buttonActive : classes.button
                    } ${classes.bottomLeftButton} ${
                        appTheme === "dark" ? classes["bottomLeftButton--dark"] : ""
                    }`}
                    onClick={toggleWithdraw}
                    disabled={depositLoading}
                >
                  <span
                      style={{
                        color: activeTab === "withdraw"
                            ? "#060B17"
                            : "#8191B9",
                      }}
                  >
                   Withdraw Liquidity
                  </span>
                </Paper>
              </Grid>
            </Grid>
          </div>

          <div className={[classes.titleTitle, "g-flex g-flex--align-center g-flex--wrap"].join(" ")}>
            <div
                className={[
                  classes.titleSection,
                ].join(" ")}
            >
              <BackButton
                  text="Back to Liquidity"
                  url="/liquidity"
              />
            </div>

            {createLP && activeTab === "deposit" && (
                <div
                    className={[
                      classes.depositHeader,
                      classes[`depositHeader--${appTheme}`],
                    ].join(" ")}
                >
                  Create LP
                </div>
            )}

            {createLP && activeTab === "withdraw" && (
                <div
                    className={[
                      classes.depositHeader,
                      classes[`depositHeader--${appTheme}`],
                    ].join(" ")}
                >
                  {withdrawAction == 'unstake' && 'Unstake LP'}
                  {withdrawAction == 'remove' && 'Remove LP'}
                  {!withdrawAction && 'Withdraw LP'}
                </div>
            )}

            {!createLP && (
                <div
                    className={[
                      classes.depositHeader,
                      classes[`depositHeader--${appTheme}`],
                    ].join(" ")}
                >
                  Stake LP
                </div>
            )}

            {activeTab === "deposit" && (
                <div
                    className={[
                      classes.depositSwitcherLabelCont,
                      "g-flex",
                      "g-flex--align-center",
                      "g-flex--space-between",
                    ].join(" ")}
                >
                  <div
                      className={[
                        "g-flex",
                        classes.depositSwitcherLabel,
                        classes[`depositSwitcherLabel--${appTheme}`],
                      ].join(" ")}
                  >
                    I have LP token
                  </div>

                  <SwitchCustom
                      checked={!createLP}
                      onChange={() => {
                        switchToggleCreateLP();
                      }}
                      name={"toggleActive"}
                  />
                </div>
            )}
          </div>

          <div
              className={[
                classes.reAddPadding,
                classes[`reAddPadding--${appTheme}`],
              ].join(" ")}
          >
            <div className={classes.inputsContainer}>
              {activeTab === "deposit" && (
                  <>
                    <div className={classes.amountsContainer}>

                      {createLP ?
                          renderMassiveInput(
                              "amount0",
                              amount0,
                              amount0Error,
                              amount0Changed,
                              asset0,
                              null,
                              assetOptions,
                              onAssetSelect,
                              amount0Focused,
                              amount0Ref
                          ) : renderMassiveInput(
                              "amount0",
                              amount0,
                              amount0Error,
                              amount0Changed,
                              withdrawAsset,
                              null,
                              withdrawAassetOptions,
                              onAssetSelect,
                              amount0Focused,
                              amount0Ref
                          )}

                      {createLP && (
                          <>
                            <div
                                className={[
                                  classes.swapIconContainer,
                                  classes[`swapIconContainer--${appTheme}`],
                                ].join(" ")}
                                onClick={swapAssets}
                            >
                              <div
                                  className={[
                                    classes.swapIconContainerInside,
                                    classes[`swapIconContainerInside--${appTheme}`],
                                    "g-flex",
                                    "g-flex--align-center",
                                    "g-flex--justify-center",
                                  ].join(" ")}
                              >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                      d="M10.95 8.95L9.53605 10.364L7.00005 7.828V21H5.00005V7.828L2.46505 10.364L1.05005 8.95L6.00005 4L10.95 8.95ZM22.9501 16.05L18 21L13.05 16.05L14.464 14.636L17.001 17.172L17 4H19V17.172L21.536 14.636L22.9501 16.05Z"
                                      className={[
                                        classes.swapIconContainerIcon,
                                        classes[`swapIconContainerIcon--${appTheme}`],
                                      ].join(" ")}
                                  />
                                </svg>
                              </div>
                            </div>

                            {renderMassiveInput(
                                "amount1",
                                amount1,
                                amount1Error,
                                amount1Changed,
                                asset1,
                                null,
                                assetOptions,
                                onAssetSelect,
                                amount1Focused,
                                amount1Ref
                            )}
                          </>
                      )}
                    </div>

                    {!createLP &&
                        <div className={classes.nftRow} style={{width: '100%',}}>
                          <div className={classes.nftTitle}>
                            Attach {VE_TOKEN_NAME} to your LP to receive boosted rewards
                          </div>
                          <div className={classes.nftItems}>{renderTokenSelect()}</div>
                        </div>
                    }

                    <div className={classes.myLiqCont}>
                      <div className={classes.myLiq}>
                        <div className={classes.myLiqBal}>
                          <div>My Pool</div>
                          <div>
                            {pair?.balance ?? '0.0'}
                            <span className={classes.myLiqSpacer}></span>
                          </div>
                          <div className={classes.myLiqSplit}></div>
                        </div>
                        <div className={classes.myLiqBal}>
                          <div>
                            <span className={classes.myLiqSpacer}></span>
                            My Stake
                          </div>
                          <div>{pair?.gauge?.balance ?? '0.00'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="g-flex g-flex--wrap" style={{width: '100%'}}>
                      {createLP &&
                          <div
                              className={["g-flex g-flex--align-center g-flex--space-between", classes.slippageCont].join(' ')}
                          >
                            <div
                                style={{
                                  display: 'flex',
                                  fontWeight: 400,
                                  fontSize: 14,
                                  // marginBottom: 10,
                                  color: '#E4E9F4',
                                }}
                            >
                              <span style={{marginRight: 10,}}>Slippage</span>
                              <Hint
                                  fill="#586586"
                                  hintText={
                                    "Slippage is the difference between the price you expect to get on the crypto you have ordered and the price you actually get when the order executes."
                                  }
                                  open={openHint}
                                  anchor={hintAnchor}
                                  handleClick={handleClickPopover}
                                  handleClose={handleClosePopover}
                                  vertical={46}
                              />
                            </div>

                            <div
                                style={{
                                  position: "relative",
                                  // marginBottom: 20,
                                }}
                            >
                              <TextField
                                  placeholder="0.00"
                                  fullWidth
                                  error={slippageError}
                                  helperText={slippageError}
                                  value={slippage}
                                  onChange={onSlippageChanged}
                                  disabled={
                                      depositLoading ||
                                      stakeLoading ||
                                      depositStakeLoading ||
                                      createLoading
                                  }
                                  classes={{
                                    root: [
                                      classes.slippageRoot,
                                      appTheme === "dark"
                                          ? classes["slippageRoot--dark"]
                                          : classes["slippageRoot--light"],
                                    ].join(" "),
                                  }}
                                  InputProps={{
                                    style: {
                                      border: "none",
                                      borderRadius: 0,
                                    },
                                    classes: {
                                      root: classes.searchInput,
                                    },
                                    endAdornment: (
                                        <InputAdornment position="end">
                            <span
                                style={{
                                  color:
                                      appTheme === "dark" ? "#ffffff" : "#325569",
                                }}
                            >
                              %
                            </span>
                                        </InputAdornment>
                                    ),
                                  }}
                                  inputProps={{
                                    className: [
                                      classes.smallInput,
                                      classes[`inputBalanceSlippageText--${appTheme}`],
                                    ].join(" "),
                                    style: {
                                      padding: 0,
                                      borderRadius: 0,
                                      border: "none",
                                      fontSize: 14,
                                      fontWeight: 400,
                                      lineHeight: "120%",
                                      color: appTheme === "dark" ? "#C6CDD2" : "#325569",
                                    },
                                  }}
                              />
                            </div>
                            {slippageError && (
                                <div
                                    style={{ marginTop: 20 }}
                                    className={[
                                      classes.warningContainer,
                                      classes[`warningContainer--${appTheme}`],
                                      classes.warningContainerError,
                                    ].join(" ")}
                                >
                                  <div
                                      className={[
                                        classes.warningDivider,
                                        classes.warningDividerError,
                                      ].join(" ")}
                                  ></div>
                                  <Typography
                                      className={[
                                        classes.warningError,
                                        classes[`warningText--${appTheme}`],
                                      ].join(" ")}
                                      align="center"
                                  >
                                    {slippageError}
                                  </Typography>
                                </div>
                            )}
                          </div>
                      }

                      {createLP && renderMediumInputToggle("stable", stable)}
                    </div>

                    {/*{renderDepositInformation()}*/}

                    <div className={classes.controls}>
                      {needAddToWhiteList !== "" && (
                          <div
                              className={[
                                classes.disclaimerContainer,
                                classes.disclaimerContainerError,
                                classes[`disclaimerContainerError--${appTheme}`],
                              ].join(" ")}
                          >
                            token {needAddToWhiteList} not whitelisted
                          </div>
                      )}

                      {createLP &&
                          pair?.name &&
                          (pair?.balance > 0 || amount0Error || amount1Error) && (
                              <div
                                  className={[
                                    classes.disclaimerContainer,
                                    amount0Error || amount1Error
                                        ? classes.disclaimerContainerError
                                        : classes.disclaimerContainerWarning,
                                    amount0Error || amount1Error
                                        ? classes[`disclaimerContainerError--${appTheme}`]
                                        : classes[`disclaimerContainerWarning--${appTheme}`],
                                  ].join(" ")}
                              >
                                <div className={classes.disclaimerContainerWarnSymbol}>
                                  !
                                </div>

                                <div>
                                  {amount0Error && <>{amount0Error}</>}

                                  {amount1Error && <>{amount1Error}</>}

                                  {pair?.balance > 0 && !amount0Error && !amount1Error && (
                                      <>
                                        There are {pair?.token0.symbol}-{pair?.token1.symbol} LP tokens in your wallet. Click on "I have LP token" to stake it.
                                      </>
                                  )}
                                </div>
                              </div>
                          )}
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
                    {/*</Popover>*/}
                    {/*</div>*/}

                    {!createLP &&
                        <div
                            className={[
                              classes.disclaimerContainer,
                              classes.disclaimerContainerDefault,

                            ].join(" ")}
                        >
                          <div className={classes.disclaimerContainerWarnSymbol}>
                            !
                          </div>
                          <div>
                            Select veTET NFT for your LP Stake to get an APR boost in proportion to Voting Power.
                          </div>
                        </div>
                    }
                  </>
              )}
              {activeTab === "withdraw" && (
                  <>
                    {renderMassiveInput(
                        "withdraw",
                        withdrawAmount,
                        withdrawAmountError,
                        withdrawAmountChanged,
                        withdrawAsset,
                        null,
                        withdrawAassetOptions,
                        onAssetSelect,
                        null,
                        null
                    )}

                    {renderWithdrawInformation()}
                  </>
              )}
            </div>
          </div>

          {activeTab === "deposit" && (
              <>
                {createLP && pair == null && amount0 !== "" && amount1 !== "" && (
                    <Button
                        variant="contained"
                        size="large"
                        color="primary"
                        onClick={needAddToWhiteList !== "" ? null : onCreateAndDeposit}
                        disabled={needAddToWhiteList !== ""}
                        className={[
                          classes.buttonOverride,
                          classes[`buttonOverride--${appTheme}`],
                        ].join(" ")}
                    >
              <span className={classes.actionButtonText}>
                Create LP
              </span>
                      {depositLoading && (
                          <Loader color={appTheme === "dark" ? "#8F5AE8" : "#8F5AE8"} />
                      )}
                    </Button>
                )}
                {amount0 !== "" && amount1 !== "" && createLP && pair !== null && (pair.gauge || needAddToWhiteList) && (
                    <Button
                        variant="contained"
                        size="large"
                        color="primary"
                        onClick={onDeposit}
                        disabled={
                            (amount0 === "" && amount1 === "") ||
                            depositLoading ||
                            stakeLoading ||
                            depositStakeLoading
                        }
                        className={[
                          classes.buttonOverride,
                          classes[`buttonOverride--${appTheme}`],
                        ].join(" ")}
                    >
                      <span className={classes.actionButtonText}>Add Liquidity</span>
                      {depositLoading && (
                          <Loader color={appTheme === "dark" ? "#8F5AE8" : "#8F5AE8"} />
                      )}
                    </Button>
                )}
                {!pair?.gauge && pair && !needAddToWhiteList && (
                    <Button
                        variant="contained"
                        size="large"
                        className={[
                          createLoading ||
                          depositLoading ||
                          stakeLoading ||
                          depositStakeLoading
                              ? classes.multiApprovalButton
                              : classes.buttonOverride,
                          createLoading ||
                          depositLoading ||
                          stakeLoading ||
                          depositStakeLoading
                              ? classes[`multiApprovalButton--${appTheme}`]
                              : classes[`buttonOverride--${appTheme}`],
                        ].join(" ")}
                        color="primary"
                        disabled={
                            createLoading ||
                            depositLoading ||
                            stakeLoading ||
                            depositStakeLoading
                        }
                        onClick={onCreateGauge}
                    >
                      <span className={classes.actionButtonText}>
                        {createLoading ? `Creating` : `Create Gauge`}
                      </span>
                      {createLoading && (
                          <CircularProgress size={10} className={classes.loadingCircle} />
                      )}
                    </Button>
                )}
                <div style={{padding: '0 6px'}}>
                  {createLP && amount0 == "" && amount1 == "" && (
                      <Button
                          variant="contained"
                          size="large"
                          color="primary"
                          onClick={() => {
                            if (needAddToWhiteList !== "") {
                              return;
                            }
                          }}
                          disabled={
                              amount0 === "" || amount1 === "" || needAddToWhiteList !== ""
                          }
                          className={[
                            classes.buttonOverride,
                            classes[`buttonOverride--${appTheme}`],
                          ].join(" ")}
                      >
              <span className={classes.actionButtonText}>
                {asset0 && asset1 && (amount0 === "" || amount1 === "") && "Enter Amount"}
                {!asset0 && !asset1 && (amount0 === "" || amount1 === "") && "Select tokens & Enter Amount"}
              </span>
                        {depositLoading && (
                            <Loader color={appTheme === "dark" ? "#8F5AE8" : "#8F5AE8"} />
                        )}
                      </Button>
                  )}

                  {!createLP && (
                      <Button
                          variant="contained"
                          size="large"
                          color="primary"
                          onClick={() => {
                            if (amount0 !== "") {
                              onStake(pair, amount0, pair.balance);
                            }
                          }}
                          disabled={amount0 === "" || !withdrawAsset}
                          className={[
                            classes.buttonOverride,
                            classes[`buttonOverride--${appTheme}`],
                          ].join(" ")}
                      >
              <span className={classes.actionButtonText}>
                {!withdrawAsset && amount0 === "" && "Select LP & Enter Amount"}
                {withdrawAsset && amount0 !== "" && "Stake LP"}
                {withdrawAsset && amount0 === "" && "Enter Amount"}
              </span>
                        {depositLoading && (
                            <Loader color={appTheme === "dark" ? "#8F5AE8" : "#8F5AE8"} />
                        )}
                      </Button>
                  )}
                </div>
              </>
          )}

          {activeTab === "withdraw" && (
              <>
                <div className="g-flex g-flex--wrap" style={{width: '100%'}}>
                  {withdrawAction === "remove" &&
                      <div
                          className={["g-flex g-flex--align-center g-flex--space-between", classes.slippageCont].join(' ')}
                      >
                        <div
                            style={{
                              display: 'flex',
                              fontWeight: 400,
                              fontSize: 14,
                              // marginBottom: 10,
                              color: '#E4E9F4',
                            }}
                        >
                          <span style={{marginRight: 10,}}>Slippage</span>
                          <Hint
                              fill="#586586"
                              hintText={
                                "Slippage is the difference between the price you expect to get on the crypto you have ordered and the price you actually get when the order executes."
                              }
                              open={openHint}
                              anchor={hintAnchor}
                              handleClick={handleClickPopover}
                              handleClose={handleClosePopover}
                              vertical={46}
                          />
                        </div>

                        <div
                            style={{
                              position: "relative",
                              // marginBottom: 20,
                            }}
                        >
                          <TextField
                              placeholder="0.00"
                              fullWidth
                              error={slippageError}
                              helperText={slippageError}
                              value={slippage}
                              onChange={onSlippageChanged}
                              disabled={
                                  depositLoading ||
                                  stakeLoading ||
                                  depositStakeLoading ||
                                  createLoading
                              }
                              classes={{
                                root: [
                                  classes.slippageRoot,
                                  appTheme === "dark"
                                      ? classes["slippageRoot--dark"]
                                      : classes["slippageRoot--light"],
                                ].join(" "),
                              }}
                              InputProps={{
                                style: {
                                  border: "none",
                                  borderRadius: 0,
                                },
                                classes: {
                                  root: classes.searchInput,
                                },
                                endAdornment: (
                                    <InputAdornment position="end">
                            <span
                                style={{
                                  color:
                                      appTheme === "dark" ? "#ffffff" : "#325569",
                                }}
                            >
                              %
                            </span>
                                    </InputAdornment>
                                ),
                              }}
                              inputProps={{
                                className: [
                                  classes.smallInput,
                                  classes[`inputBalanceSlippageText--${appTheme}`],
                                ].join(" "),
                                style: {
                                  padding: 0,
                                  borderRadius: 0,
                                  border: "none",
                                  fontSize: 14,
                                  fontWeight: 400,
                                  lineHeight: "120%",
                                  color: appTheme === "dark" ? "#C6CDD2" : "#325569",
                                },
                              }}
                          />
                        </div>
                        {slippageError && (
                            <div
                                style={{ marginTop: 20 }}
                                className={[
                                  classes.warningContainer,
                                  classes[`warningContainer--${appTheme}`],
                                  classes.warningContainerError,
                                ].join(" ")}
                            >
                              <div
                                  className={[
                                    classes.warningDivider,
                                    classes.warningDividerError,
                                  ].join(" ")}
                              ></div>
                              <Typography
                                  className={[
                                    classes.warningError,
                                    classes[`warningText--${appTheme}`],
                                  ].join(" ")}
                                  align="center"
                              >
                                {slippageError}
                              </Typography>
                            </div>
                        )}
                      </div>
                  }
                  {withdrawAction === "remove" &&
                      <div className={classes.refreshWarnBlock}>
                        <span className={classes.refreshWarnSymbol}>!</span>
                        <span>
                          If you do not see your pool amount, refresh the page
                        </span>
                      </div>
                  }

                  {withdrawAction === "unstake" && lockedNft &&
                      <div className={classes.lockedNFT}>
                        <div className={classes.lockedNFTTitle}>
                          Connected Locked NFT to this LP Staking
                        </div>
                        <div className={classes.lockedNFTToken}>
                          <div className={classes.lockedNFTID}>
                            #{lockedNft.id}
                          </div>
                          <div className={classes.lockedNFTVe}>
                            {formatCurrency(lockedNft.lockValue)} {veToken?.symbol}
                          </div>
                        </div>
                      </div>
                  }

                </div>
                <Button
                    variant="contained"
                    size="large"
                    color="primary"
                    onClick={() => handleWithdraw(withdrawAsset)}
                    disabled={
                        withdrawAmount == "" ||
                        parseFloat(withdrawAmount) == 0 ||
                        withdrawAction == ""
                    }
                    className={[
                      classes.buttonOverride,
                      classes[`buttonOverride--${appTheme}`],
                    ].join(" ")}
                >
            <span className={classes.actionButtonText}>
              {withdrawAsset !== null && (
                  <>
                    {withdrawAction == "" && "Select the action"}

                    {parseFloat(withdrawAmount) > 0 &&
                        withdrawAction === "unstake" &&
                        "Unstake LP"}

                    {parseFloat(withdrawAmount) > 0 &&
                        withdrawAction === "remove" &&
                        "Remove LP"}

                    {(withdrawAction != "" && (parseFloat(withdrawAmount) == 0 || withdrawAmount == "")) &&
                        "Enter Amount"}
                  </>
              )}

              {withdrawAsset === null && "Select LP & action"}
            </span>
                  {depositLoading && (
                      <Loader color={appTheme === "dark" ? "#8F5AE8" : "#8F5AE8"} />
                  )}
                </Button>
              </>
          )}
        </Paper>
      </div>
  );
}
