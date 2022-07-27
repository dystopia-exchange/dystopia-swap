import React, { useState, useEffect } from "react";
import {
    TextField,
    Typography,
    InputAdornment,
    CircularProgress,
    InputBase,
} from "@mui/material";
import { withTheme } from "@mui/styles";
import {
    formatCurrency,
    formatInputAmount,
    formatAddress,
    formatCurrencyWithSymbol,
    formatCurrencySmall,
} from "../../utils";
import classes from "./ssSwap.module.css";
import stores from "../../stores";
import { ACTIONS } from "../../stores/constants";
import BigNumber from "bignumber.js";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import BtnSwap from "../../ui/BtnSwap";
import Hint from "../hint/hint";
import Loader from "../../ui/Loader";
import AssetSelect from "../../ui/AssetSelect";
import {MultiSwap} from "../MultiSwap";
import { observer } from 'mobx-react'
import { multiSwapStore } from '../MultiSwap/store'
import * as ethers from 'ethers'

function Setup() {
    const [, updateState] = React.useState();
    const forceUpdate = React.useCallback(() => updateState({}), []);

    const [loading, setLoading] = useState(false);
    const [quoteLoading, setQuoteLoading] = useState(false);
    const [approvalLoading, setApprovalLoading] = useState(false);

    const [fromAmountValue, setFromAmountValue] = useState("");
    const [fromAmountError, setFromAmountError] = useState(false);
    const [fromAssetValue, setFromAssetValue] = useState(null);

    const [fromAssetError, setFromAssetError] = useState(false);
    const [fromAssetOptions, setFromAssetOptions] = useState([]);

    const [toAmountValue, setToAmountValue] = useState("");
    const [toAmountError, setToAmountError] = useState(false);
    const [toAssetValue, setToAssetValue] = useState(null);
    const [toAssetError, setToAssetError] = useState(false);
    const [toAssetOptions, setToAssetOptions] = useState([]);

    const [slippage, setSlippage] = useState("2");
    const [slippageError, setSlippageError] = useState(false);

    const [quoteError, setQuoteError] = useState(null);
    const [quote, setQuote] = useState(null);
    const [hidequote, sethidequote] = useState(false);
    const [hintAnchor, setHintAnchor] = React.useState(null);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const { appTheme } = useAppThemeContext();

    const handleClickPopover = (event) => {
        setHintAnchor(event.currentTarget);
    };

    const handleClosePopover = () => {
        setHintAnchor(null);
    };

    const openHint = Boolean(hintAnchor);

    window.addEventListener("resize", () => {
        setWindowWidth(window.innerWidth);
    });

    useEffect(() => {
        multiSwapStore._fetchData()
    }, [])

    useEffect(
        function () {
            const errorReturned = () => {
                setLoading(false);
                setApprovalLoading(false);
                setQuoteLoading(false);
            };

            const quoteReturned = (val) => {
                if (!val) {
                    setQuoteLoading(false);
                    setQuote(null);
                    setToAmountValue("");
                    setQuoteError(
                        "Insufficient liquidity or no route available to complete swap"
                    );
                }
                if (
                    val &&
                    val.inputs &&
                    val.inputs.fromAmount === fromAmountValue &&
                    val.inputs.fromAsset.address === fromAssetValue.address &&
                    val.inputs.toAsset.address === toAssetValue.address
                ) {
                    setQuoteLoading(false);
                    if (BigNumber(val.output.finalValue).eq(0)) {
                        setQuote(null);
                        setToAmountValue("");
                        setQuoteError(
                            "Insufficient liquidity or no route available to complete swap"
                        );
                        return;
                    }

                    setToAmountValue(BigNumber(val.output.finalValue).toFixed(8));
                    setQuote(val);
                }
            };

            const ssUpdated = () => {
                const baseAsset = stores.stableSwapStore.getStore("baseAssets");

                if (
                    baseAsset.length > 0
                    && multiSwapStore.tokenIn === null
                    && multiSwapStore.tokenOut === null
                ) {
                    const WMATIC = '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'
                    const DYST = '0x39ab6574c289c3ae4d88500eec792ab5b947a5eb'
                    multiSwapStore.setTokenIn(WMATIC)
                    multiSwapStore.setTokenOut(DYST)
                }

                setToAssetOptions(baseAsset);
                setFromAssetOptions(baseAsset);

                if (baseAsset.length > 0 && toAssetValue == null) {
                    const dystIndex = baseAsset.findIndex((token) => {
                        return token.id == "0x39ab6574c289c3ae4d88500eec792ab5b947a5eb";
                    });
                    setToAssetValue(baseAsset[dystIndex]);
                }

                if (baseAsset.length > 0 && fromAssetValue == null) {
                    const wmaticIndex = baseAsset.findIndex((token) => {
                        return token.id == "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
                    });
                    setFromAssetValue(baseAsset[wmaticIndex]);
                }
                forceUpdate();
            };

            const assetsUpdated = () => {
                const baseAsset = stores.stableSwapStore.getStore("baseAssets");
                setToAssetOptions(baseAsset);
                setFromAssetOptions(baseAsset);
            };

            const swapReturned = (event) => {
                setLoading(false);
                setFromAmountValue("");
                setToAmountValue("");
                if (
                    !(
                        (fromAssetValue?.symbol == "MATIC" ||
                            fromAssetValue?.symbol == "WMATIC") &&
                        (toAssetValue?.symbol == "WMATIC" ||
                            toAssetValue?.symbol == "MATIC")
                    )
                )
                    calculateReceiveAmount(0, fromAssetValue, toAssetValue);
                else {
                    sethidequote(true);
                    setToAmountValue(0);
                }
                setQuote(null);
                setQuoteLoading(false);
            };
            const wrapReturned = () => {
                setLoading(false);
            };

            stores.emitter.on(ACTIONS.ERROR, errorReturned);
            stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
            stores.emitter.on(ACTIONS.WRAP_RETURNED, wrapReturned);
            stores.emitter.on(ACTIONS.UNWRAP_RETURNED, wrapReturned);
            stores.emitter.on(ACTIONS.SWAP_RETURNED, swapReturned);
            // TODO: setQuote
            // stores.emitter.on(ACTIONS.QUOTE_SWAP_RETURNED, quoteReturned);
            stores.emitter.on(ACTIONS.BASE_ASSETS_UPDATED, assetsUpdated);

            ssUpdated();

            return () => {
                stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
                stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
                stores.emitter.removeListener(ACTIONS.SWAP_RETURNED, swapReturned);
                stores.emitter.removeListener(
                    ACTIONS.QUOTE_SWAP_RETURNED,
                    quoteReturned
                );
                stores.emitter.removeListener(
                    ACTIONS.BASE_ASSETS_UPDATED,
                    assetsUpdated
                );
            };
        },
        [fromAmountValue, fromAssetValue, toAssetValue]
    );

    const onAssetSelect = (type, value) => {
        if (type === "From") {
            if (value.address === toAssetValue.address) {
                setToAssetValue(fromAssetValue);
                setFromAssetValue(toAssetValue);
                if (
                    !(
                        (fromAssetValue?.symbol == "MATIC" ||
                            fromAssetValue?.symbol == "WMATIC") &&
                        (toAssetValue?.symbol == "WMATIC" ||
                            toAssetValue?.symbol == "MATIC")
                    )
                )
                    calculateReceiveAmount(fromAmountValue, toAssetValue, fromAssetValue);
                else {
                    sethidequote(true);
                    setToAmountValue(fromAmountValue);
                }
            } else {
                setFromAssetValue(value);
                if (
                    !(
                        (value?.symbol == "MATIC" || value?.symbol == "WMATIC") &&
                        (toAssetValue?.symbol == "WMATIC" ||
                            toAssetValue?.symbol == "MATIC")
                    )
                )
                    calculateReceiveAmount(fromAmountValue, value, toAssetValue);
                else {
                    sethidequote(true);
                    setToAmountValue(fromAmountValue);
                }
            }
        } else {
            if (value.address === fromAssetValue.address) {
                setFromAssetValue(toAssetValue);
                setToAssetValue(fromAssetValue);
                if (
                    !(
                        (fromAssetValue?.symbol == "MATIC" ||
                            fromAssetValue?.symbol == "WMATIC") &&
                        (toAssetValue?.symbol == "WMATIC" ||
                            toAssetValue?.symbol == "MATIC")
                    )
                )
                    calculateReceiveAmount(fromAmountValue, toAssetValue, fromAssetValue);
                else {
                    sethidequote(true);
                    setToAmountValue(fromAmountValue);
                }
            } else {
                setToAssetValue(value);
                if (
                    !(
                        (fromAssetValue?.symbol == "MATIC" ||
                            fromAssetValue?.symbol == "WMATIC") &&
                        (value?.symbol == "WMATIC" || value?.symbol == "MATIC")
                    )
                )
                    calculateReceiveAmount(fromAmountValue, fromAssetValue, value);
                else {
                    sethidequote(true);
                    setToAmountValue(fromAmountValue);
                }
            }
        }

        forceUpdate();
    };

    const fromAmountChanged = (event) => {
        const value = formatInputAmount(event.target.value.replace(",", "."));

        setFromAmountError(false);
        setFromAmountValue(value);
        if (value == "" || Number(value) === 0) {
            setToAmountValue("");
            setQuote(null);
        } else {
            if (
                !(
                    (fromAssetValue?.symbol == "MATIC" ||
                        fromAssetValue?.symbol == "WMATIC") &&
                    (toAssetValue?.symbol == "WMATIC" || toAssetValue?.symbol == "MATIC")
                )
            )
                calculateReceiveAmount(value, fromAssetValue, toAssetValue);
            else {
                sethidequote(true);
                setToAmountValue(value);
            }
            // else setToAmountValue(value);
        }
    };

    const toAmountChanged = (event) => { };

    const onSlippageChanged = (event) => {
        if (event.target.value == "" || !isNaN(event.target.value)) {
            setSlippage(event.target.value);
        }
    };

    const calculateReceiveAmount = (amount, from, to) => {
        if (amount !== "" && !isNaN(amount) && to != null) {
            setQuoteLoading(true);
            setQuoteError(false);

            stores.dispatcher.dispatch({
                type: ACTIONS.QUOTE_SWAP,
                content: {
                    fromAsset: from,
                    toAsset: to,
                    fromAmount: amount,
                },
            });
        }
    };

    const setBalance100 = () => {
        setFromAmountValue(fromAssetValue.balance);
        multiSwapStore.setSwapAmount(fromAssetValue.balance)

        if (
            !(
                (fromAssetValue?.symbol == "MATIC" ||
                    fromAssetValue?.symbol == "WMATIC") &&
                (toAssetValue?.symbol == "WMATIC" || toAssetValue?.symbol == "MATIC")
            )
        )
            calculateReceiveAmount(
                fromAssetValue.balance,
                fromAssetValue,
                toAssetValue
            );
        else {
            sethidequote(true);
            setToAmountValue(fromAssetValue.balance);
        }
    };

    const swapAssets = () => {
        const fa = fromAssetValue;
        const ta = toAssetValue;
        setFromAssetValue(ta);
        setToAssetValue(fa);
        if (
            !(
                (fromAssetValue?.symbol == "MATIC" ||
                    fromAssetValue?.symbol == "WMATIC") &&
                (toAssetValue?.symbol == "WMATIC" || toAssetValue?.symbol == "MATIC")
            )
        )
            calculateReceiveAmount(fromAmountValue, ta, fa);
        else {
            sethidequote(true);
            setToAmountValue(fromAmountValue);
        }
    };

    const renderSwapInformation = (args) => {
        const { routes } = args

        const renderRoutes = (route) => {
            const [{ percentage }] = route

            return (
                <>
                    <div
                        className={[
                            classes.routesPlatform,
                            classes.routeLinesLeftText,
                            classes[`routeLinesLeftText--${appTheme}`]
                        ].join(" ")}
                    >
                        {percentage}%
                    </div>
                    <div className={[classes.routesList]}>
                        {route.map((el, index) => {
                            let tokenIn = null
                            let tokenOut = null
                            const baseAsset = stores.stableSwapStore.getStore("baseAssets");

                            baseAsset.forEach((asset) => {
                                if (asset.address.toLowerCase() === el.tokenIn.toLowerCase()) {
                                    tokenIn = asset
                                }
                                if (asset.address.toLowerCase() === el.tokenOut.toLowerCase()) {
                                    tokenOut = asset
                                }
                            })

                            const isLastEl = index === route.length - 1

                            return (
                                <div className={[classes.routesListItem].join(" ")}>
                                    {index === 0 && (
                                        <>
                                            <img
                                                className={[classes.routeIcon, classes[`routeIcon--${appTheme}`]].join(" ")}
                                                alt=""
                                                src={tokenIn.logoURI}
                                                height="40px"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                                }}
                                            />
                                            <span className={[classes.routesListItemSymbol].join(' ')}>
                                                {tokenIn?.symbol}
                                            </span>
                                        </>
                                    )}

                                    {index === 0 && (
                                        <div
                                            className={[
                                                classes.routesListItemArrow,
                                                classes[`routesListItemArrow--${appTheme}`]
                                            ].join(" ")}
                                        >
                                            <svg width="22" height="70" viewBox="0 0 22 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22 35L17 32.1132V37.8868L22 35ZM0 35.5H17.5V34.5H0V35.5Z" fill="#86B9D6"/>
                                            </svg>
                                            <span className={[classes.routesListItemArrowPlatform].join(' ')}>
                                                {el.dex.name}
                                                <span
                                                    className={[classes.routesListItemArrowPlatformExclude].join(' ')}
                                                    onClick={() => {
                                                        multiSwapStore.excludePlatformToggle(el.dex.name)
                                                    }}
                                                >&#215;</span>
                                            </span>
                                        </div>
                                    )}

                                    <img
                                        className={[classes.routeIcon, classes[`routeIcon--${appTheme}`]].join(" ")}
                                        alt=""
                                        src={tokenOut.logoURI}
                                        height="40px"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                        }}
                                    />
                                    <span className={[classes.routesListItemSymbol].join(' ')}>
                                        {tokenOut?.symbol}
                                    </span>
                                    {!isLastEl && (
                                        <div
                                            className={[
                                                classes.routesListItemArrow,
                                                classes[`routesListItemArrow--${appTheme}`]
                                            ].join(" ")}
                                        >
                                            <svg width="22" height="70" viewBox="0 0 22 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M22 35L17 32.1132V37.8868L22 35ZM0 35.5H17.5V34.5H0V35.5Z" fill="#86B9D6"/>
                                            </svg>
                                            <span
                                                className={[classes.routesListItemArrowPlatform].join(' ')}
                                                 onClick={() => {
                                                     multiSwapStore.excludePlatformToggle(route[index + 1].dex.name)
                                                 }}
                                            >
                                                {route[index + 1].dex.name}
                                                <span className={[classes.routesListItemArrowPlatformExclude].join(' ')}>&#215;</span>
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </>
            )
        }

        return (
            <>
                <div className={classes.depositInfoContainer}>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                width: "100%",
                            }}
                        >
                            {routes && Array.isArray(routes) && routes.length > 0 && (
                                <>
                                    <Typography
                                        className={[
                                            classes.depositInfoHeading,
                                            classes[`depositInfoHeading--${appTheme}`],
                                        ].join(" ")}
                                    >
                                        Routes
                                    </Typography>
                                    {routes.map(renderRoutes)}
                                </>
                            )}
                            {multiSwapStore.excludedPlatforms.length > 0 && (
                                <>
                                    <div className={classes.excludedPlatformWrapper}>
                                        <div className={classes.excludedPlatformTitle}>Excluded platforms:{' '}</div>
                                        <div className={classes.excludedPlatformList}>
                                            {multiSwapStore.excludedPlatforms.map((el) => {
                                                return (
                                                    <>
                                                          <span className={classes.excludedPlatformListItem}>
                                                               {el}
                                                               <span
                                                                   className={[classes.routesListItemArrowPlatformExclude].join(' ')}
                                                                   onClick={() => {
                                                                       multiSwapStore.excludePlatformToggle(el)
                                                                   }}
                                                               >
                                                                   &#215;
                                                               </span>
                                                          </span>
                                                    </>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                </div>
            </>
        );
    };

    const renderSmallInput = (type, amountValue, amountError, amountChanged) => {
        return (
            <div className={classes.slippage}>
                <div
                    className={[
                        "g-flex",
                        "g-flex--align-center",
                        classes.slippageLabel,
                    ].join(" ")}
                >
                    <Typography
                        className={[
                            classes.inputBalanceSlippage,
                            classes[`inputBalanceSlippage--${appTheme}`],
                        ].join(" ")}
                        noWrap
                    >
                        Slippage
                    </Typography>

                    <Hint
                        hintText={
                            "Slippage is the difference between the price you expect to get on the crypto you have ordered and the price you actually get when the order executes."
                        }
                        open={openHint}
                        anchor={hintAnchor}
                        handleClick={handleClickPopover}
                        handleClose={handleClosePopover}
                        vertical={-110}
                    ></Hint>
                </div>

                <TextField
                    placeholder="0.00"
                    error={amountError}
                    value={amountValue}
                    onChange={amountChanged}
                    disabled={loading}
                    autoComplete="off"
                    InputProps={{
                        classes: {
                            root: [
                                classes.inputBalanceSlippageText,
                                classes[`inputBalanceSlippageText--${appTheme}`],
                            ].join(" "),
                            inputAdornedStart: [
                                classes.inputBalanceSlippageText,
                                classes[`inputBalanceSlippageText--${appTheme}`],
                            ].join(" "),
                        },
                    }}
                    inputProps={{
                        size: amountValue?.length || 4,
                        style: {
                            padding: 0,
                            borderRadius: 0,
                            border: "none",
                            color: appTheme === "dark" ? "#ffffff" : "#0A2C40",
                            paddingRight: amountValue?.length >= 8 ? 10 : 0,
                        },
                    }}
                />
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
        onAssetSelect
    ) => {

        return (
            <div
                className={[
                    classes.textField,
                    classes[`textField--${type}-${appTheme}`],
                ].join(" ")}
            >
                <Typography className={classes.inputTitleText} noWrap>
                    {type === "From" ? "From" : "To"}
                </Typography>

                <div
                    className={[
                        classes.inputBalanceTextContainer,
                        "g-flex",
                        "g-flex--align-center",
                    ].join(" ")}
                >
                    <img
                        src="/images/ui/icon-wallet.svg"
                        className={classes.walletIcon}
                    />

                    <Typography
                        className={[classes.inputBalanceText, "g-flex__item"].join(" ")}
                        noWrap
                        onClick={() => setBalance100()}
                    >
                    <span>
                      {assetValue && assetValue.balance
                          ? " " + formatCurrency(assetValue.balance)
                          : ""}
                    </span>
                    </Typography>

                    {assetValue?.balance &&
                    Number(assetValue?.balance) > 0 &&
                    type === "From" && (
                        <div
                            style={{
                                cursor: "pointer",
                                fontWeight: 500,
                                fontSize: 14,
                                lineHeight: "120%",
                                color: appTheme === "dark" ? "#4CADE6" : "#0B5E8E",
                            }}
                            onClick={() => setBalance100()}
                        >
                            MAX
                        </div>
                    )}
                </div>

                <div
                    className={`${classes.massiveInputContainer} ${(amountError || assetError) && classes.error
                    }`}
                >
                    <div className={classes.massiveInputAssetSelect}>
                        <AssetSelect
                            type={type}
                            value={assetValue}
                            assetOptions={assetOptions}
                            onSelect={onAssetSelect}
                        />
                    </div>

                    <InputBase
                        className={classes.massiveInputAmount}
                        placeholder="0.00"
                        error={amountError}
                        value={amountValue}
                        onChange={amountChanged}
                        disabled={loading || type === "To"}
                        inputMode={"decimal"}
                        inputProps={{
                            className: [
                                classes.largeInput,
                                classes[`largeInput--${appTheme}`],
                            ].join(" "),
                        }}
                    />

                    <Typography
                        className={[
                            classes.smallerText,
                            classes[`smallerText--${appTheme}`],
                        ].join(" ")}
                    >
                        {assetValue?.symbol}
                    </Typography>
                </div>
            </div>
        );
    };

    const [swapIconBgColor, setSwapIconBgColor] = useState(null);
    const [swapIconBorderColor, setSwapIconBorderColor] = useState(null);
    const [swapIconArrowColor, setSwapIconArrowColor] = useState(null);

    const swapIconHover = () => {
        setSwapIconBgColor(appTheme === "dark" ? "#2D3741" : "#9BC9E4");
        setSwapIconBorderColor(appTheme === "dark" ? "#4CADE6" : "#0B5E8E");
        setSwapIconArrowColor(appTheme === "dark" ? "#4CADE6" : "#0B5E8E");
    };

    const swapIconClick = () => {
        setSwapIconBgColor(appTheme === "dark" ? "#5F7285" : "#86B9D6");
        setSwapIconBorderColor(appTheme === "dark" ? "#4CADE6" : "#0B5E8E");
        setSwapIconArrowColor(appTheme === "dark" ? "#4CADE6" : "#0B5E8E");
    };

    const swapIconDefault = () => {
        setSwapIconBgColor(null);
        setSwapIconBorderColor(null);
        setSwapIconArrowColor(null);
    };

    return (
        <MultiSwap>
            {(renderProps) => {
                const {
                    tokenIn, setTokenIn,
                    tokenOut, setTokenOut,
                    swapAmount, setSwapAmount,
                    slippage, setSlippage,
                    allowed, isFetchingAllowance,
                    swap, isFetchingSwapQuery,
                    doApprove, isFetchingApprove,
                    doSwap, isFetchingSwap,
                    multiswapData,
                    routes,
                } = renderProps

                console.log('swap', swap && JSON.parse(JSON.stringify(swap)))

                let buttonLabel = 'Swap'
                let loadingMessage = ''
                let handleClickButton = doSwap
                let disableButton = isFetchingAllowance
                    || isFetchingSwapQuery
                    || isFetchingApprove
                    || isFetchingSwap
                    || !swapAmount
                    || tokenIn === null
                    || tokenOut === null
                    || multiSwapStore.error !== null

                if (isFetchingSwapQuery) loadingMessage = 'loading data of routes...'
                if (isFetchingAllowance) loadingMessage = 'loading ...'
                if (isFetchingApprove) loadingMessage = 'transaction of approve in process...'
                if (isFetchingSwap) loadingMessage = 'token swap in progress...'

                if (!!swapAmount === false) {
                    buttonLabel = 'Enter Amount'
                }

                if (allowed === false && tokenIn) {
                    buttonLabel = 'Approve'
                    handleClickButton = doApprove
                    if (!isFetchingApprove) {
                        disableButton = false
                    }
                }

                return (
                    <>
                        <div className={classes.swapInputs}>
                            {renderMassiveInput(
                                "From",
                                swapAmount,
                                fromAmountError,
                                (event) => {
                                    fromAmountChanged(event)
                                    const value = formatInputAmount(event.target.value.replace(",", "."));
                                    setSwapAmount(value)
                                },
                                fromAssetValue,
                                fromAssetError,
                                fromAssetOptions,
                                (type, value) => {
                                    onAssetSelect(type, value)
                                    setTokenIn(value.address)
                                }
                            )}

                            {fromAssetError && (
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
                                        {fromAssetError}
                                    </Typography>
                                </div>
                            )}

                            <div
                                className={[
                                    classes.swapIconContainer,
                                    classes[`swapIconContainer--${appTheme}`],
                                ].join(" ")}
                                onMouseOver={swapIconHover}
                                onMouseOut={swapIconDefault}
                                onMouseDown={swapIconClick}
                                onMouseUp={swapIconDefault}
                                onTouchStart={swapIconClick}
                                onTouchEnd={swapIconDefault}
                                onClick={swapAssets}
                            >
                                {windowWidth > 470 && (
                                    <svg
                                        width="80"
                                        height="80"
                                        viewBox="0 0 80 80"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <circle
                                            cx="40"
                                            cy="40"
                                            r="39.5"
                                            fill={appTheme === "dark" ? "#151718" : "#DBE6EC"}
                                            stroke={appTheme === "dark" ? "#5F7285" : "#86B9D6"}
                                        />

                                        <rect
                                            y="30"
                                            width="4"
                                            height="20"
                                            fill={appTheme === "dark" ? "#151718" : "#DBE6EC"}
                                        />

                                        <rect
                                            x="76"
                                            y="30"
                                            width="4"
                                            height="20"
                                            fill={appTheme === "dark" ? "#151718" : "#DBE6EC"}
                                        />

                                        <circle
                                            cx="40"
                                            cy="40"
                                            r="29.5"
                                            fill={
                                                swapIconBgColor || (appTheme === "dark" ? "#24292D" : "#B9DFF5")
                                            }
                                            stroke={
                                                swapIconBorderColor ||
                                                (appTheme === "dark" ? "#5F7285" : "#86B9D6")
                                            }
                                        />

                                        <path
                                            d="M41.0002 44.172L46.3642 38.808L47.7782 40.222L40.0002 48L32.2222 40.222L33.6362 38.808L39.0002 44.172V32H41.0002V44.172Z"
                                            fill={
                                                swapIconArrowColor ||
                                                (appTheme === "dark" ? "#4CADE6" : "#0B5E8E")
                                            }
                                        />
                                    </svg>
                                )}

                                {windowWidth <= 470 && (
                                    <svg
                                        width="50"
                                        height="50"
                                        viewBox="0 0 50 50"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <circle
                                            cx="25"
                                            cy="25"
                                            r="24.5"
                                            fill={appTheme === "dark" ? "#151718" : "#DBE6EC"}
                                            stroke={appTheme === "dark" ? "#5F7285" : "#86B9D6"}
                                        />

                                        <rect
                                            y="20"
                                            width="3"
                                            height="10"
                                            fill={appTheme === "dark" ? "#151718" : "#DBE6EC"}
                                        />

                                        <rect
                                            x="48"
                                            y="20"
                                            width="2"
                                            height="10"
                                            fill={appTheme === "dark" ? "#151718" : "#DBE6EC"}
                                        />

                                        <circle
                                            cx="25"
                                            cy="25"
                                            r="18.5"
                                            fill={
                                                swapIconBgColor || (appTheme === "dark" ? "#24292D" : "#B9DFF5")
                                            }
                                            stroke={
                                                swapIconBorderColor ||
                                                (appTheme === "dark" ? "#5F7285" : "#86B9D6")
                                            }
                                        />

                                        <path
                                            d="M25.8336 28.4773L30.3036 24.0073L31.4819 25.1857L25.0002 31.6673L18.5186 25.1857L19.6969 24.0073L24.1669 28.4773V18.334H25.8336V28.4773Z"
                                            fill={
                                                swapIconArrowColor ||
                                                (appTheme === "dark" ? "#ffffff" : "#ffffff")
                                            }
                                        />
                                    </svg>
                                )}
                            </div>

                            {renderMassiveInput(
                                "To",
                                swap?.returnAmount
                                    ? ethers.utils.formatUnits(swap?.returnAmount, toAssetValue.decimals)
                                    : swap?.returnAmount
                                ,
                                toAmountError,
                                toAmountChanged,
                                toAssetValue,
                                toAssetError,
                                toAssetOptions,
                                (type, value) => {
                                    onAssetSelect(type, value)
                                    setTokenOut(value.address)
                                }
                            )}

                            {renderSmallInput(
                                "slippage",
                                slippage,
                                slippageError,
                                (event) => {
                                    setSlippage(event.target.value)
                                    // onSlippageChanged(event)
                                }
                            )}

                            {(!isFetchingSwapQuery
                                && multiSwapStore.error === null
                                && multiSwapStore.priceImpact !== null)
                            && (
                                <>
                                    <Typography
                                        style={{ marginTop: 5 }}
                                        className={[
                                            multiSwapStore.priceImpact > 5
                                                ? classes.warningError
                                                : classes.warningWarning,
                                            classes[`warningText--${appTheme}`],
                                        ].join(" ")}
                                        align="center"
                                    >
                                        Price impact: {parseFloat(parseFloat(multiSwapStore.priceImpact).toFixed(2))}%
                                    </Typography>
                                </>
                            )}

                            {loadingMessage === ''
                                && multiSwapStore.swap !== null
                                && multiSwapStore.error === null
                                && multiSwapStore.isMaticToken === false
                                && (
                                <>
                                    <Typography
                                        className={[
                                            classes.depositInfoHeading,
                                            classes[`depositInfoHeading--${appTheme}`],
                                            classes.depositInfoHeadingPrice,
                                        ].join(" ")}
                                    >
                                        Price Info
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
                                            <Typography className={classes.text}>
                                                {`${fromAssetValue?.symbol} per ${toAssetValue?.symbol}`}
                                            </Typography>

                                            <Typography className={classes.title}>
                                                {multiSwapStore.priceInfo.tokenOutPrice}
                                            </Typography>
                                        </div>

                                        <div
                                            className={[
                                                classes.priceInfo,
                                                classes[`priceInfo--${appTheme}`],
                                            ].join(" ")}
                                        >
                                            <Typography className={classes.text}>
                                                {`${toAssetValue?.symbol} per ${fromAssetValue?.symbol}`}
                                            </Typography>

                                            <Typography className={classes.title}>
                                                {multiSwapStore.priceInfo.tokenInPrice}
                                            </Typography>
                                        </div>
                                    </div>
                                </>
                            )}

                            {multiSwapStore.error && (
                                <div
                                    style={{ marginTop: 15, marginBottom: 10 }}
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
                                        {multiSwapStore.error}
                                    </Typography>
                                </div>
                            )}

                            {!hidequote ? renderSwapInformation({ routes }) : null}

                            {(isFetchingApprove || isFetchingSwap) && (
                                <div className={classes.loader}>
                                    <Loader color={appTheme === "dark" ? "#8F5AE8" : "#8F5AE8"} />
                                </div>
                            )}

                            {loadingMessage !== '' && (
                                <div classes={classes.loadingMessageWrapper}>
                                    <div
                                        className={[classes.quoteLoader, classes.quoteLoaderLoading].join(
                                            " "
                                        )}
                                    >
                                        <div
                                            className={[
                                                classes.loadingMessage,
                                                classes[`loadingMessage--${appTheme}`]
                                            ].join(' ')}
                                        >
                                            {loadingMessage}
                                        </div>
                                        <CircularProgress
                                            size={20}
                                            className={classes.loadingCircle}
                                        />
                                    </div>
                                </div>
                            )}


                            <BtnSwap
                                onClick={handleClickButton}
                                className={classes.btnSwap}
                                labelClassName={
                                    disableButton
                                        ? classes["actionButtonText--disabled"]
                                        : classes.actionButtonText
                                }
                                isDisabled={disableButton}
                                label={buttonLabel}
                            ></BtnSwap>
                        </div>
                    </>
                )
            }}
        </MultiSwap>
    );
}

export default withTheme(observer(Setup));
