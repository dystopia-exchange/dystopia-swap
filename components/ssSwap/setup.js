import React, { useState, useEffect } from 'react';
import {
  TextField,
  Typography,
  InputAdornment,
  Button,
  MenuItem,
  IconButton,
  Dialog,
  CircularProgress,
  Tooltip,
  InputBase,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { Search, ArrowDownward, ArrowForwardIos, DeleteOutline, Close, ArrowBackIosNew } from '@mui/icons-material';
import {useParams} from 'react-router-dom';
import { withTheme } from '@mui/styles';

import { formatCurrency, formatAddress, formatCurrencyWithSymbol, formatCurrencySmall } from '../../utils';

import classes from './ssSwap.module.css';

import stores from '../../stores';
import {
  ACTIONS,
  ETHERSCAN_URL,
} from '../../stores/constants';
import BigNumber from 'bignumber.js';
import { useAppThemeContext } from '../../ui/AppThemeProvider';

function Setup() {
   console.log(useParams(),"hehe")
  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);

  const [fromAmountValue, setFromAmountValue] = useState('');
  const [fromAmountError, setFromAmountError] = useState(false);
  const [fromAssetValue, setFromAssetValue] = useState(null);
  const [fromAssetError, setFromAssetError] = useState(false);
  const [fromAssetOptions, setFromAssetOptions] = useState([]);

  const [toAmountValue, setToAmountValue] = useState('');
  const [toAmountError, setToAmountError] = useState(false);
  const [toAssetValue, setToAssetValue] = useState(null);
  const [toAssetError, setToAssetError] = useState(false);
  const [toAssetOptions, setToAssetOptions] = useState([]);

  const [slippage, setSlippage] = useState('2');
  const [slippageError, setSlippageError] = useState(false);

  const [quoteError, setQuoteError] = useState(null);
  const [quote, setQuote] = useState(null);

  const {appTheme} = useAppThemeContext();

  useEffect(function () {
    const errorReturned = () => {
      setLoading(false);
      setApprovalLoading(false);
      setQuoteLoading(false);
    };

    const quoteReturned = (val) => {

      if (!val) {
        setQuoteLoading(false);
        setQuote(null);
        setToAmountValue('');
        setQuoteError('Insufficient liquidity or no route available to complete swap');
      }
      if (val && val.inputs && val.inputs.fromAmount === fromAmountValue && val.inputs.fromAsset.address === fromAssetValue.address && val.inputs.toAsset.address === toAssetValue.address) {
        setQuoteLoading(false);
        if (BigNumber(val.output.finalValue).eq(0)) {
          setQuote(null);
          setToAmountValue('');
          setQuoteError('Insufficient liquidity or no route available to complete swap');
          return;
        }

        setToAmountValue(BigNumber(val.output.finalValue).toFixed(8));
        setQuote(val);
      }
    };

    const ssUpdated = () => {
      const baseAsset = stores.stableSwapStore.getStore('baseAssets');

      setToAssetOptions(baseAsset);
      setFromAssetOptions(baseAsset);

      if (baseAsset.length > 0 && toAssetValue == null) {
        setToAssetValue(baseAsset[0]);
      }

      if (baseAsset.length > 0 && fromAssetValue == null) {
        setFromAssetValue(baseAsset[1]);
      }

      forceUpdate();
    };

    const assetsUpdated = () => {
      const baseAsset = stores.stableSwapStore.getStore('baseAssets');

      setToAssetOptions(baseAsset);
      setFromAssetOptions(baseAsset);
    };

    const swapReturned = (event) => {
      setLoading(false);
      setFromAmountValue('');
      setToAmountValue('');
      calculateReceiveAmount(0, fromAssetValue, toAssetValue);
      setQuote(null);
      setQuoteLoading(false);
    };

    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
    stores.emitter.on(ACTIONS.SWAP_RETURNED, swapReturned);
    stores.emitter.on(ACTIONS.QUOTE_SWAP_RETURNED, quoteReturned);
    stores.emitter.on(ACTIONS.BASE_ASSETS_UPDATED, assetsUpdated);

    ssUpdated();

    return () => {
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
      stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
      stores.emitter.removeListener(ACTIONS.SWAP_RETURNED, swapReturned);
      stores.emitter.removeListener(ACTIONS.QUOTE_SWAP_RETURNED, quoteReturned);
      stores.emitter.removeListener(ACTIONS.BASE_ASSETS_UPDATED, assetsUpdated);
    };
  }, [fromAmountValue, fromAssetValue, toAssetValue]);

  const onAssetSelect = (type, value) => {
    if (type === 'From') {

      if (value.address === toAssetValue.address) {
        setToAssetValue(fromAssetValue);
        setFromAssetValue(toAssetValue);
        calculateReceiveAmount(fromAmountValue, toAssetValue, fromAssetValue);
      } else {
        setFromAssetValue(value);
        calculateReceiveAmount(fromAmountValue, value, toAssetValue);
      }


    } else {
      if (value.address === fromAssetValue.address) {
        setFromAssetError(toAssetValue);
        setToAssetValue(fromAssetValue);
        calculateReceiveAmount(fromAmountValue, toAssetValue, fromAssetValue);
      } else {
        setToAssetValue(value);
        calculateReceiveAmount(fromAmountValue, fromAssetValue, value);
      }
    }

    forceUpdate();
  };

  const fromAmountChanged = (event) => {
    setFromAmountError(false);
    setFromAmountValue(event.target.value);
    if (event.target.value == '') {
      setToAmountValue('');
      setQuote(null);
    } else {
      calculateReceiveAmount(event.target.value, fromAssetValue, toAssetValue);
    }
  };

  const toAmountChanged = (event) => {
  };

  const onSlippageChanged = (event) => {
    if (event.target.value == '' || !isNaN(event.target.value)) {
      setSlippage(event.target.value);
    }
  };

  const calculateReceiveAmount = (amount, from, to) => {
    if (amount !== '' && !isNaN(amount) && to != null) {

      setQuoteLoading(true);
      setQuoteError(false);

      stores.dispatcher.dispatch({
        type: ACTIONS.QUOTE_SWAP, content: {
          fromAsset: from,
          toAsset: to,
          fromAmount: amount,
        },
      });
    }
  };

  const onSwap = () => {
    setFromAmountError(false);
    setFromAssetError(false);
    setToAssetError(false);

    let error = false;

    if (!fromAmountValue || fromAmountValue === '' || isNaN(fromAmountValue)) {
      setFromAmountError('From amount is required');
      error = true;
    } else {
      if (!fromAssetValue.balance || isNaN(fromAssetValue.balance) || BigNumber(fromAssetValue.balance).lte(0)) {
        setFromAmountError('Invalid balance');
        error = true;
      } else if (BigNumber(fromAmountValue).lt(0)) {
        setFromAmountError('Invalid amount');
        error = true;
      } else if (fromAssetValue && BigNumber(fromAmountValue).gt(fromAssetValue.balance)) {
        setFromAmountError(`Greater than your available balance`);
        error = true;
      }
    }

    if (!fromAssetValue || fromAssetValue === null) {
      setFromAssetError('From asset is required');
      error = true;
    }

    if (!toAssetValue || toAssetValue === null) {
      setFromAssetError('To asset is required');
      error = true;
    }

    if (!error) {
      setLoading(true);

      stores.dispatcher.dispatch({
        type: ACTIONS.SWAP, content: {
          fromAsset: fromAssetValue,
          toAsset: toAssetValue,
          fromAmount: fromAmountValue,
          toAmount: toAmountValue,
          quote: quote,
          slippage: slippage,
        },
      });
    }
  };

  const setBalance100 = () => {
    setFromAmountValue(fromAssetValue.balance);
    calculateReceiveAmount(fromAssetValue.balance, fromAssetValue, toAssetValue);
  };

  const swapAssets = () => {
    const fa = fromAssetValue;
    const ta = toAssetValue;
    setFromAssetValue(ta);
    setToAssetValue(fa);
    calculateReceiveAmount(fromAmountValue, ta, fa);
  };

  const renderSwapInformation = () => {

    if (quoteError) {
      return (
        <div className={[classes.quoteLoader, classes.quoteLoaderError].join(" ")}>
          <div className={[classes.quoteLoaderDivider, classes.quoteLoaderDividerError].join(" ")}></div>
          <Typography className={classes.quoteError}>{quoteError}</Typography>
        </div>
      );
    }

    if (quoteLoading) {
      return (
        <div className={[classes.quoteLoader, classes.quoteLoaderLoading].join(" ")}>
          <CircularProgress size={20} className={classes.loadingCircle}/>
        </div>
      );
    }

    if (!quote) {
      return;
      <div className={[classes.quoteLoader, classes.quoteLoaderInfo].join(" ")}></div>;
    }

    return (
      <div className={classes.depositInfoContainer}>
        {
          BigNumber(quote.priceImpact).gt(0.5) &&
          <div
            className={[classes.warningContainer, classes[`warningContainer--${appTheme}`], BigNumber(quote.priceImpact).gt(5) ? classes.warningContainerError : classes.warningContainerWarning].join(" ")}>
            <div className={[
              classes.warningDivider,
              BigNumber(quote.priceImpact).gt(5) ? classes.warningDividerError : classes.warningDividerWarning].join(" ")
            }>
            </div>

            <Typography
              className={[BigNumber(quote.priceImpact).gt(5) ? classes.warningError : classes.warningWarning, classes[`warningText--${appTheme}`]].join(" ")}
              align="center">Price impact: {formatCurrency(quote.priceImpact)}%</Typography>
          </div>
        }

        <Typography className={[classes.depositInfoHeading, classes.depositInfoHeadingPrice].join(" ")}>Price
          Info</Typography>

        <div className={[classes.priceInfos, classes[`priceInfos--${appTheme}`]].join(' ')}>
          <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
            <Typography className={classes.text}>
              {`${fromAssetValue?.symbol} per ${toAssetValue?.symbol}`}
            </Typography>

            <Typography className={classes.title}>
              {formatCurrency(BigNumber(quote.inputs.fromAmount).div(quote.output.finalValue).toFixed(18))}
            </Typography>
          </div>

          <div className={[classes.priceInfo, classes[`priceInfo--${appTheme}`]].join(' ')}>
            <Typography className={classes.text}>
              {`${toAssetValue?.symbol} per ${fromAssetValue?.symbol}`}
            </Typography>

            <Typography className={classes.title}>
              {formatCurrency(BigNumber(quote.output.finalValue).div(quote.inputs.fromAmount).toFixed(18))}
            </Typography>
          </div>

          {renderSmallInput('slippage', slippage, slippageError, onSlippageChanged)}
        </div>

        <Typography className={classes.depositInfoHeading}>Route</Typography>

        <div className={[classes.route, classes[`route--${appTheme}`]].join(' ')}>
          <img
            className={[classes.routeIcon, classes[`routeIcon--${appTheme}`]].join(' ')}
            alt=""
            src={fromAssetValue ? `${fromAssetValue.logoURI}` : ''}
            height="40px"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/tokens/unknown-logo.png";
            }}
          />
          <div className={classes.line}>
            <div className={[classes.routeLinesLeft, classes[`routeLinesLeft--${appTheme}`]].join(' ')}>
            </div>
            <div className={[classes.routeArrow, classes[`routeArrow--${appTheme}`]].join(' ')}>
            </div>
            <div className={[classes.routeLinesRight, classes[`routeLinesRight--${appTheme}`]].join(' ')}>
            </div>

            {/*<div className={classes.stabIndicatorContainer}>
              <Typography
                className={classes.stabIndicator}>{quote.output.routes[0].stable ? 'Stable' : 'Volatile'}</Typography>
            </div>*/}
          </div>
          {quote && quote.output && quote.output.routeAsset &&
            <>
              <img
                className={[classes.routeIcon, classes[`routeIcon--${appTheme}`]].join(' ')}
                alt=""
                src={quote.output.routeAsset ? `${quote.output.routeAsset.logoURI}` : ''}
                height="40px"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/tokens/unknown-logo.png";
                }}
              />
              <div className={classes.line}>
                <div className={classes.routeArrow}>
                  <ArrowForwardIos className={classes.routeArrowIcon}/>
                </div>
                <div className={classes.stabIndicatorContainer}>
                  <Typography
                    className={classes.stabIndicator}>{quote.output.routes[1].stable ? 'Stable' : 'Volatile'}</Typography>
                </div>
              </div>
            </>
          }
          <img
            className={[classes.routeIcon, classes[`routeIcon--${appTheme}`]].join(' ')}
            alt=""
            src={toAssetValue ? `${toAssetValue.logoURI}` : ''}
            height="40px"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/tokens/unknown-logo.png";
            }}
          />
        </div>
      </div>
    );
  };

  const renderSmallInput = (type, amountValue, amountError, amountChanged) => {
    return (
      <div className={classes.slippage}>
        <Typography
          className={[classes.inputBalanceSlippage, classes[`inputBalanceSlippage--${appTheme}`]].join(" ")}
          noWrap>
          Slippage
        </Typography>

        <InputBase
          placeholder="0.00"
          fullWidth
          error={amountError}
          helperText={amountError}
          value={amountValue}
          onChange={amountChanged}
          disabled={loading}
          inputProps={{
            className: [classes.smallInput, classes[`inputBalanceSlippageText--${appTheme}`]].join(" "),
          }}
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>,
          }}
        />
      </div>
    );
  };

  const renderMassiveInput = (type, amountValue, amountError, amountChanged, assetValue, assetError, assetOptions, onAssetSelect) => {

    return (
      <div className={[classes.textField, classes[`textField--${type}-${appTheme}`]].join(' ')}>
        <Typography className={classes.inputTitleText} noWrap>
          {type === 'From' ? 'From' : 'To'}
        </Typography>

        <Typography className={classes.inputBalanceText} noWrap onClick={() => {
          if (type === 'From') {
            setBalance100();
          }
        }}>
          Balance:
          <span>
            {(assetValue && assetValue.balance) ?
              ' ' + formatCurrency(assetValue.balance) :
              ''
            }
          </span>
        </Typography>
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
            disabled={loading || type === 'To'}
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

  return (
    <div className={classes.swapInputs}>
      {renderMassiveInput('From', fromAmountValue, fromAmountError, fromAmountChanged, fromAssetValue, fromAssetError, fromAssetOptions, onAssetSelect)}
      <div className={[classes.swapIconContainer, classes[`swapIconContainer--${appTheme}`]].join(' ')}
           onClick={swapAssets}>
      </div>
      {renderMassiveInput('To', toAmountValue, toAmountError, toAmountChanged, toAssetValue, toAssetError, toAssetOptions, onAssetSelect)}
      {renderSwapInformation()}
      {/*<div className={classes.actionsContainer}>*/}
      <Button
        variant="contained"
        size="large"
        color="primary"
        className={[classes.buttonOverride, classes[`buttonOverride--${appTheme}`]].join(' ')}
        disabled={loading || quoteLoading}
        onClick={onSwap}
      >
        <Typography className={classes.actionButtonText}>{loading ? `Swapping` : `Swap`}</Typography>
        {loading && <CircularProgress size={10} className={classes.loadingCircle}/>}
      </Button>
      {/*</div>*/}
    </div>
  );
}

function AssetSelect({type, value, assetOptions, onSelect}) {

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredAssetOptions, setFilteredAssetOptions] = useState([]);

  const [manageLocal, setManageLocal] = useState(false);

  const openSearch = () => {
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
          <Typography
            variant="h5"
            style={{
              fontWeight: 500,
              fontSize: 24,
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
              height="50px"
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
              fontSize: 24,
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
              fontSize: 18,
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

        <div className={[classes.assetSearchResults, classes[`assetSearchResults--${appTheme}`]].join(' ')}>
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
            onClick={toggleLocal}
          >
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
            className={classes.manageLocalBtn}
            onClick={toggleLocal}>
            Manage Local Assets
          </Button>
        </div>
      </>
    );
  };

  const {appTheme} = useAppThemeContext();

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
                {manageLocal ? 'Manage local assets' : 'Select a token'}
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

export default withTheme(Setup);
