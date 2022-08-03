import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Dialog,
  MenuItem,
  IconButton,
  InputBase, DialogTitle, DialogContent,
} from '@mui/material';
import { DeleteOutline, ArrowBackIosNew } from '@mui/icons-material';
import BigNumber from 'bignumber.js';
import { formatCurrency } from '../../utils';
import classes from './ssBribeCreate.module.css';
import { formatSymbol, formatInputAmount } from '../../utils';

import stores from '../../stores';
import {
  ACTIONS,
  ETHERSCAN_URL,
} from '../../stores/constants';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import BackButton from "../../ui/BackButton";

export default function ssBribeCreate() {

  const router = useRouter();
  const [createLoading, setCreateLoading] = useState(false);

  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState(false);
  const [asset, setAsset] = useState(null);
  const [assetOptions, setAssetOptions] = useState([]);
  const [gauge, setGauge] = useState(null);
  const [gaugeOptions, setGaugeOptions] = useState([]);

  const ssUpdated = async () => {
    const storeAssetOptions = stores.stableSwapStore.getStore('baseAssets');
    let filteredStoreAssetOptions = storeAssetOptions.filter((option) => {
      return option.address !== 'MATIC';
    });
    const storePairs = stores.stableSwapStore.getStore('pairs');
    setAssetOptions(filteredStoreAssetOptions);
    setGaugeOptions(storePairs);

    if (filteredStoreAssetOptions.length > 0 && asset == null) {
      setAsset(filteredStoreAssetOptions[0]);
    }

    if (storePairs.length > 0 && gauge == null) {
      for (var i = 0; i < storePairs.length; i++)
        if (storePairs[i].gauge != null) {
          setGauge(storePairs[i]);
          break;
        }
    }
  };

  useEffect(() => {
    const createReturned = (res) => {
      setCreateLoading(false);
      setAmount('');

      onBack();
    };

    const errorReturned = () => {
      setCreateLoading(false);
    };

    const assetsUpdated = () => {
      const baseAsset = stores.stableSwapStore.getStore('baseAssets');
      let filteredStoreAssetOptions = baseAsset.filter((option) => {
        return option.address !== 'MATIC';
      });
      setAssetOptions(filteredStoreAssetOptions);
    };

    stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
    stores.emitter.on(ACTIONS.BRIBE_CREATED, createReturned);
    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    stores.emitter.on(ACTIONS.BASE_ASSETS_UPDATED, assetsUpdated);

    ssUpdated();

    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
      stores.emitter.removeListener(ACTIONS.BRIBE_CREATED, createReturned);
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
      stores.emitter.removeListener(ACTIONS.BASE_ASSETS_UPDATED, assetsUpdated);
    };
  }, []);

  const setAmountMax = (input) => {
    setAmountError(false);
    if (input === 'amount') {
      let am = BigNumber(asset.balance).toFixed();
      setAmount(am);
    }
  };

  const onCreate = () => {
    setAmountError(false);

    let error = false;

    if (!amount || amount === '' || isNaN(amount)) {
      setAmountError('From amount is required');
      error = true;
    } else {
      if (!asset.balance || isNaN(asset.balance) || BigNumber(asset.balance).lte(0)) {
        setAmountError('Invalid balance');
        error = true;
      } else if (BigNumber(amount).lt(0)) {
        setAmountError('Invalid amount');
        error = true;
      } else if (asset && BigNumber(amount).gt(asset.balance)) {
        setAmountError(`Greater than your available balance`);
        error = true;
      }
    }

    if (!asset || asset === null) {
      setAmountError('From asset is required');
      error = true;
    }

    if (!error) {
      setCreateLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.CREATE_BRIBE, content: {
          asset: asset,
          amount: amount,
          gauge: gauge,
        },
      });
    }
  };

  const amountChanged = (event) => {
    const value = formatInputAmount(event.target.value.replace(',', '.'))
    setAmountError(false);
    setAmount(value);
  };

  const onAssetSelect = (type, value) => {
    setAmountError(false);
    setAsset(value);
  };

  const onGagugeSelect = (event, asset) => {
    setGauge(asset);
  };

  const renderMassiveGaugeInput = (type, value, error, options, onChange) => {
    return (
      <div className={[classes.textFieldTop, classes[`textFieldTop--${appTheme}`]].join(' ')}>
        <Typography className={classes.inputTitleText} noWrap>
          Bribe for LP
        </Typography>

        <div className={`${classes.massiveInputContainer} ${error && classes.error}`}>
          <div className={classes.massiveInputAssetSelect}>
            <AssetSelectPair type={type} value={value} assetOptions={options} onSelect={onChange} manageLocal={false}/>
          </div>
          <div className={classes.assetSelectIconName}>
            <Typography
              variant="h5"
              className={classes.assetSymbolName}
              style={{
                color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
              }}>
              {formatSymbol(gauge?.symbol)}
            </Typography>

            <Typography
              variant="subtitle1"
              className={classes.assetSymbolName2}
              style={{
                color: appTheme === "dark" ? '#7C838A' : '#5688A5',
              }}>
              {gauge?.isStable ? "Stable Pool" : "Volatile Pool"}
            </Typography>
          </div>

        </div>
      </div>
    );
  };

  const renderMassiveInput = (type, amountValue, amountError, amountChanged, assetValue, assetError, assetOptions, onAssetSelect) => {

    return (
      <div className={[classes.textField, classes[`textField--${appTheme}`]].join(' ')}>
        <Typography className={classes.inputTitleText} noWrap>
          Bribe with
        </Typography>

        <Typography className={classes.inputBalanceText} noWrap >
          <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.653 6.03324C11.373 6.30658 11.213 6.69991 11.253 7.11991C11.313 7.83991 11.973 8.36658 12.693 8.36658H13.9997V9.33325C13.9997 11.3333 12.6663 12.6666 10.6663 12.6666H4.66634C2.66634 12.6666 1.33301 11.3333 1.33301 9.33325V4.66659C1.33301 2.85325 2.42634 1.58658 4.12634 1.37325C4.29968 1.34658 4.47967 1.33325 4.66634 1.33325H10.6663C10.8397 1.33325 11.0063 1.33991 11.1663 1.36658C12.8863 1.56658 13.9997 2.83992 13.9997 4.66659V5.63326H12.613C12.2397 5.63326 11.8997 5.77991 11.653 6.03324Z" stroke="#8191B9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {(assetValue && assetValue.balance) ?
            ' ' + formatCurrency(assetValue.balance) :
            ''
          }
        </Typography>

        <Typography className={classes.inputBalanceMax} onClick={() => {
          setAmountMax(type);
        }}>
          MAX
        </Typography>

        <div className={`${classes.massiveInputContainerTransparent} ${(amountError || assetError) && classes.error}`}>
          <div className={classes.massiveInputAssetSelectStandalone}>
            <AssetSelectManage type={type} value={assetValue} assetOptions={assetOptions} onSelect={onAssetSelect}
                               manageLocal={true}/>
          </div>

          <InputBase
            className={classes.massiveInputAmount}
            placeholder="0.00"
            error={amountError}
            helperText={amountError}
            value={amountValue}
            onChange={amountChanged}
            disabled={createLoading}
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
        </div>
      </div>
    );
  };

  const onBack = () => {
    router.push('/vote');
  };

  const renderCreateInfo = () => {
    return (
      <div className={classes.depositInfoContainer}>
        <span className={classes.depositInfoContainerWarn}>!</span>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z" fill="#779BF4"/>
        </svg>

        <Typography className={[classes.depositInfoHeading, classes[`depositInfoHeading--${appTheme}`]].join(' ')}>You
          are creating a bribe of <span
            className={classes.highlight}>{formatCurrency(amount)} {formatSymbol(asset?.symbol)}</span> to incentivize
          Vesters to vote
          for the <span
            className={classes.highlight}>{formatSymbol(gauge?.token0?.symbol)}/{formatSymbol(gauge?.token1?.symbol)} Pool</span></Typography>
      </div>
    );
  };

  const {appTheme} = useAppThemeContext();

  let actionButtonText = createLoading ? `Creating` : `Create Bribe`
  if (gauge == null && asset === null) {
    actionButtonText = 'Choose LP & token'
  } else if (asset === null) {
    actionButtonText = 'Choose token'
  } else if (!amount || parseFloat(amount) == 0) {
    actionButtonText = 'Enter amount'
  }

  return (
    <Paper
      elevation={0}
      className={[classes.container, classes[`container--${appTheme}`, 'g-flex-column']].join(' ')}>
      <div
        className={[classes.titleSection, classes[`titleSection--${appTheme}`]].join(' ')}
      >
        <BackButton
            text="Back to Vote"
            url="/vote"
        />
      </div>

      <div className={[classes[`top`], classes[`top--${appTheme}`]].join(' ')}>
        Create Bribe
      </div>

      <div className={[classes.reAddPadding, classes[`reAddPadding--${appTheme}`]].join(' ')}>
        {renderMassiveGaugeInput('gauge', gauge, null, gaugeOptions, onGagugeSelect)}
        <svg className={classes.bribeSvg} width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="56" height="56" rx="28" fill="#171D2D"/>
          <path d="M29.5 33.75C29.5 34.72 30.25 35.5 31.17 35.5H33.05C33.85 35.5 34.5 34.82 34.5 33.97C34.5 33.06 34.1 32.73 33.51 32.52L30.5 31.47C29.91 31.26 29.51 30.94 29.51 30.02C29.51 29.18 30.16 28.49 30.96 28.49H32.84C33.76 28.49 34.51 29.27 34.51 30.24" stroke="#8191B9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M32 27.5V36.5" stroke="#8191B9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M42 32C42 37.52 37.52 42 32 42C26.48 42 22 37.52 22 32C22 26.48 26.48 22 32 22" stroke="#8191B9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M37 23V27H41" stroke="#8191B9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M42 22L37 27" stroke="#8191B9" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="4" y="4" width="56" height="56" rx="28" stroke="#060B17" stroke-width="8"/>
        </svg>

        <div style={{marginTop: 36}}>
          {renderMassiveInput('amount', amount, amountError, amountChanged, asset, null, assetOptions, onAssetSelect)}
        </div>

        {amountError && <div
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
            align="center">{amountError}</Typography>
        </div>}
        {renderCreateInfo()}
      </div>

      <Button
        className={[classes.buttonOverride, classes[`buttonOverride--${appTheme}`]].join(' ')}
        fullWidth
        variant="contained"
        size="large"
        color="primary"
        disabled={createLoading || amount === '' || parseFloat(amount) === 0}
        onClick={onCreate}>
        <Typography className={classes.actionButtonText}>
          {actionButtonText}
        </Typography>

        {createLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
      </Button>
    </Paper>
  );
}

function AssetSelectManage({type, value, assetOptions, onSelect, manageLocalAssets}) {
  const {appTheme} = useAppThemeContext();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredAssetOptions, setFilteredAssetOptions] = useState([]);

  const [manageLocal, setManageLocal] = useState(false);

  const openSearch = () => {
    setOpen(true);
    setSearch('');
  };

  useEffect(function () {

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
              // height="60px"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
              }}
            />

          </div>
        </div>
        <div className={classes.assetSelectIconName}>
          <Typography className={classes.assetSymbolName} variant="h5">{asset ? formatSymbol(asset.symbol) : ''}</Typography>
          <Typography variant="subtitle1" color="textSecondary">{asset ? formatSymbol(asset.name) : ''}</Typography>
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
          <div className={classes.displaySingleIconContainerSmall}>
            <img
              className={[classes.assetOptionIcon, classes[`assetOptionIcon--${appTheme}`]].join(' ')}
              alt=""
              src={asset ? `${asset.logoURI}` : ''}
              height="60px"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
              }}
            />
          </div>
        </div>
        <div className={classes.assetSelectIconName}>
          <Typography
            variant="h5"
            className={classes.assetSymbolName}
            style={{
              fontWeight: 500,
              fontSize: 24,
              lineHeight: '32px',
              color: '#E4E9F4',
            }}>
            {asset ? formatSymbol(asset.symbol) : ''}
          </Typography>

          <Typography
              variant="subtitle1"
              className={classes.assetSymbolName2}
          >
            {asset ? asset.name : ''}
          </Typography>
        </div>

        <div className={classes.assetSelectBalance}>
          <Typography
            variant="h5"
            className={classes.assetSelectBalanceTypo}
            style={{
              // fontWeight: 500,
              // fontSize: 24,
              // lineHeight: '32px',
              // color: '#E4E9F4',
            }}>
            {(asset && asset.balance) ? formatCurrency(asset.balance) : '0.00'}
          </Typography>

          <Typography
            variant="subtitle1"
            className={classes.assetSelectBalanceSubtitle1}
            style={{
              fontWeight: 500,
              fontSize: 16,
              color: '#8191B9',
              lineHeight: '24px',
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
            placeholder="Type or paste the address"
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              style: {
                background: '#171D2D',
                border: '1px solid',
                borderColor: '#779BF4',
                borderRadius: 12,
              },
              classes: {
                root: classes.searchInput,
                input: classes.searchInputInput,
              },
              endAdornment: <InputAdornment position="end">
                {/*Search icon*/}
                <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.5 20C15.7467 20 20 15.7467 20 10.5C20 5.25329 15.7467 1 10.5 1C5.25329 1 1 5.25329 1 10.5C1 15.7467 5.25329 20 10.5 20Z" stroke="#779BF4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <div style={{position: 'relative'}}>
                  <svg style={{position: 'absolute', top: 8, right: 0,}} width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3L1 1" stroke="#779BF4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </InputAdornment>,
            }}
            inputProps={{
              style: {
                padding: '24px',
                borderRadius: 0,
                border: 'none',
                fontSize: '16px',
                lineHeight: '120%',
                color: '#E4E9F4',
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
            placeholder="Type or paste the address"
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              classes: {
                root: [classes.searchInput, classes[`searchInput--${appTheme}`]].join(' '),
                inputAdornedEnd: [classes.searchInputText, classes[`searchInputText--${appTheme}`]].join(' '),
                input: classes.searchInputInput,
              },
              endAdornment: <InputAdornment position="end">
                {/*Search icon*/}
                <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.5 20C15.7467 20 20 15.7467 20 10.5C20 5.25329 15.7467 1 10.5 1C5.25329 1 1 5.25329 1 10.5C1 15.7467 5.25329 20 10.5 20Z" stroke="#779BF4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <div style={{position: 'relative'}}>
                  <svg style={{position: 'absolute', top: 8, right: 0,}} width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 3L1 1" stroke="#779BF4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </InputAdornment>,
            }}
          />
        </div>

        <div style={{position: 'relative'}}>
          {/*<Borders/>*/}
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
        </div>

        <div className={classes.manageLocalContainer}>
          <Button
            className={[classes.manageLocalBtn, classes[`manageLocalBtn--${appTheme}`]].join(' ')}
            onClick={toggleLocal}>
            Manage local assets
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
            className={[classes.displayDualIconContainer, classes.displayDualIconContainerManage].join(' ')}>
            <img
              className={classes.displayAssetIconSingle}
              alt=""
              src={value ? `${value.logoURI}` : ''}
              height="100px"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
              }}
            />
          </div>
        </div>
      </div>

      <Dialog
          PaperProps={{style: {
              borderRadius: 12,
                  backgroundColor: 'transparent',
              maxWidth: 800,
          }}}
        aria-labelledby="simple-dialog-title"
        open={open}
        onClick={(e) => {
          if (e.target.classList.contains('MuiDialog-container')) {
            onClose();
          }
        }}
      >
        <div
            className={classes.dialogContainer}
            style={{
          width: 782,
          height: 710,
          background: '#1F2B49',
          borderRadius: 12,
        }}>
          <DialogTitle style={{
            padding: 30,
            paddingTop: 24,
            paddingBottom: 0,
            // fontWeight: 500,
            // fontSize: 18,
            // lineHeight: '140%',
            // color: '#0A2C40',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}>
              <div
                  className={classes.dialogTitle}
                  style={{
                display: 'flex',
                alignItems: 'center',
                // color: '#E4E9F4',
                // fontSize: 60,
                // fontWeight: 500,
                // lineHeight: '72px',
              }}>
                {manageLocal && <ArrowBackIosNew onClick={toggleLocal} style={{
                  marginRight: 10,
                  width: 18,
                  height: 18,
                  cursor: 'pointer',
                }}/>}
                {'Select a Token'}
              </div>
              <svg className={classes.dialogClose} onClick={onClose} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.19 0H5.81C2.17 0 0 2.17 0 5.81V14.18C0 17.83 2.17 20 5.81 20H14.18C17.82 20 19.99 17.83 19.99 14.19V5.81C20 2.17 17.83 0 14.19 0ZM13.36 12.3C13.65 12.59 13.65 13.07 13.36 13.36C13.21 13.51 13.02 13.58 12.83 13.58C12.64 13.58 12.45 13.51 12.3 13.36L10 11.06L7.7 13.36C7.55 13.51 7.36 13.58 7.17 13.58C6.98 13.58 6.79 13.51 6.64 13.36C6.35 13.07 6.35 12.59 6.64 12.3L8.94 10L6.64 7.7C6.35 7.41 6.35 6.93 6.64 6.64C6.93 6.35 7.41 6.35 7.7 6.64L10 8.94L12.3 6.64C12.59 6.35 13.07 6.35 13.36 6.64C13.65 6.93 13.65 7.41 13.36 7.7L11.06 10L13.36 12.3Z" fill="#8191B9"/>
              </svg>
            </div>
          </DialogTitle>
          <DialogContent style={{
            padding: '20px 30px 30px',
          }}>
            {!manageLocal && renderOptions(manageLocalAssets)}
            {manageLocalAssets && manageLocal && renderManageLocal()}
          </DialogContent>
        </div>
      </Dialog>
    </React.Fragment>
  );
}

function AssetSelectPair({type, value, assetOptions, onSelect, manageLocalAssets}) {
  const {appTheme} = useAppThemeContext();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredAssetOptions, setFilteredAssetOptions] = useState([]);

  const [manageLocal, setManageLocal] = useState(false);

  const openSearch = () => {
    setOpen(true);
    setSearch('');
  };

  useEffect(function () {

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
                e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
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
              src={asset ? `${asset?.token0?.logoURI}` : ''}
              height="30px"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
              }}
            />

            <img
              className={[classes.assetOptionIcon, classes[`assetOptionIcon--${appTheme}`]].join(' ')}
              alt=""
              src={asset ? `${asset?.token1?.logoURI}` : ''}
              height="30px"
              style={{marginLeft: "-15px"}}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
              }}
            />
          </div>
        </div>
        <div className={classes.assetSelectIconName}>
          <Typography
            variant="h5"
            className={classes.assetSymbolName}
            style={{
              color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
            }}>
            {asset ? formatSymbol(asset.symbol) : ''}
          </Typography>

          <Typography
            variant="subtitle1"
            className={classes.assetSymbolName2}
            style={{
              color: appTheme === "dark" ? '#7C838A' : '#5688A5',
            }}>
            {asset.isStable ? "Stable Pool" : "Volatile Pool"}
          </Typography>
        </div>

        <div className={classes.assetSelectBalance}>
          <Typography
            variant="h5"
            className={classes.assetSelectBalanceTypo}
            style={{
              // fontWeight: 500,
              // fontSize: 24,
              // lineHeight: '32px',
              // color: '#E4E9F4',
            }}>
            {(asset && asset.balance) ? formatCurrency(asset.balance) : '0.00'}
          </Typography>

          <Typography
              variant="subtitle1"
              className={classes.assetSelectBalanceSubtitle1}
              style={{
                color: '#8191B9',
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
          {/* <Borders/> */}

          <TextField
            autoFocus
            variant="outlined"
            fullWidth
            placeholder="Type or paste the address"
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              style: {
                background: '#171D2D',
                border: '1px solid',
                borderColor: '#779BF4',
                borderRadius: 0,
              },
              classes: {
                root: classes.searchInput,
                input: classes.searchInputInput
              },
              endAdornment: <InputAdornment position="end">
                  {/*Search icon*/}
                  <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.5 20C15.7467 20 20 15.7467 20 10.5C20 5.25329 15.7467 1 10.5 1C5.25329 1 1 5.25329 1 10.5C1 15.7467 5.25329 20 10.5 20Z" stroke="#779BF4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <div style={{position: 'relative'}}>
                      <svg style={{position: 'absolute', top: 8, right: 0,}} width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 3L1 1" stroke="#779BF4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                  </div>
              </InputAdornment>,
            }}
            inputProps={{
              style: {
                padding: '24px',
                borderRadius: 0,
                border: 'none',
                fontSize: '16px',
                lineHeight: '120%',
                color: '#E4E9F4',
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

  const renderOptions = (manageLocalAssets) => {
    return (
      <>
        <div className={classes.searchInline}>
          {/*<Borders/>*/}

          <TextField
            autoFocus
            variant="outlined"
            fullWidth
            placeholder="Type or paste the address"
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              classes: {
                root: [classes.searchInput, classes[`searchInput--${appTheme}`]].join(' '),
                inputAdornedEnd: [classes.searchInputText, classes[`searchInputText--${appTheme}`]].join(' '),
                input: classes.searchInputInput,
              },
              endAdornment: <InputAdornment position="end">
                  {/*Search icon*/}
                  <svg width="19" height="19" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.5 20C15.7467 20 20 15.7467 20 10.5C20 5.25329 15.7467 1 10.5 1C5.25329 1 1 5.25329 1 10.5C1 15.7467 5.25329 20 10.5 20Z" stroke="#779BF4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <div style={{position: 'relative'}}>
                      <svg style={{position: 'absolute', top: 8, right: 0,}} width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 3L1 1" stroke="#779BF4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                  </div>
              </InputAdornment>,
            }}
          />
        </div>

        <div style={{position: 'relative'}}>
          {/*<Borders/>*/}

          <div className={[classes.assetSearchResults, classes[`assetSearchResults--${appTheme}`]].join(' ')}>
            {
              filteredAssetOptions ? filteredAssetOptions.sort((a, b) => {
                if (BigNumber(a.balance).lt(b.balance)) return 1;
                if (BigNumber(a.balance).gt(b.balance)) return -1;
                if (a.symbol.toLowerCase() < b.symbol.toLowerCase()) return -1;
                if (a.symbol.toLowerCase() > b.symbol.toLowerCase()) return 1;
                return 0;
              }).map((asset, idx) => {
                if (asset.gauge != null)
                  return renderAssetOption(type, asset, idx);
              }) : []
            }
          </div>
        </div>

        {manageLocalAssets &&
          <div className={classes.manageLocalContainer}>
            <Button
              onClick={toggleLocal}
            >
              Manage local assets
            </Button>
          </div>
        }
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
            className={[classes.displayDualIconContainer, classes.displayDualIconContainerSelect,].join(' ')}>
            <img
              className={[
                classes.displayAssetIcon,
                classes.assetOptionIcon,
                classes[`assetOptionIcon--${appTheme}`],
              ].join(" ")}
              alt=""
              src={value ? `${value?.token0?.logoURI}` : ''}
              height="100px"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
              }}
            />
            <img
              className={[
                classes.displayAssetIcon,
                classes.displayAssetIconSec,
                classes.assetOptionIcon,
                classes[`assetOptionIcon--${appTheme}`]].join(" ")}
              alt=""
              src={value ? `${value?.token1?.logoURI}` : ''}
              height="100px"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
              }}
            />
          </div>
        </div>
      </div>

      <Dialog
          PaperProps={{style: {
                  borderRadius: 12,
                  backgroundColor: 'transparent',
              maxWidth: 800,
              }}}
        aria-labelledby="simple-dialog-title"
        open={open}
        onClick={(e) => {
          if (e.target.classList.contains('MuiDialog-container')) {
            onClose();
          }
        }}
      >
        <div
          className={classes.dialogContainer}
          style={{
            // width: 782,
            // height: 750,
            background: '#1F2B49',
            borderRadius: 12,
          }}>
          <DialogTitle
            className={classes.dialogTitle}
            style={{
              padding: 30,
              paddingTop: 24,
              paddingBottom: 0,
            }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}>
              <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    paddingBottom: 8,
                  }}
              >
                {manageLocal && <ArrowBackIosNew onClick={toggleLocal} style={{
                  marginRight: 10,
                  width: 18,
                  height: 18,
                  cursor: 'pointer',
                }}/>}
                {manageLocalAssets && manageLocal ? 'Manage local assets' : 'Select LP'}
              </div>
              <svg className={classes.dialogClose} onClick={onClose} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.19 0H5.81C2.17 0 0 2.17 0 5.81V14.18C0 17.83 2.17 20 5.81 20H14.18C17.82 20 19.99 17.83 19.99 14.19V5.81C20 2.17 17.83 0 14.19 0ZM13.36 12.3C13.65 12.59 13.65 13.07 13.36 13.36C13.21 13.51 13.02 13.58 12.83 13.58C12.64 13.58 12.45 13.51 12.3 13.36L10 11.06L7.7 13.36C7.55 13.51 7.36 13.58 7.17 13.58C6.98 13.58 6.79 13.51 6.64 13.36C6.35 13.07 6.35 12.59 6.64 12.3L8.94 10L6.64 7.7C6.35 7.41 6.35 6.93 6.64 6.64C6.93 6.35 7.41 6.35 7.7 6.64L10 8.94L12.3 6.64C12.59 6.35 13.07 6.35 13.36 6.64C13.65 6.93 13.65 7.41 13.36 7.7L11.06 10L13.36 12.3Z" fill="#8191B9"/>
              </svg>
            </div>
          </DialogTitle>

          <DialogContent className={classes.dialogContent}>
            {!manageLocal && renderOptions(manageLocalAssets)}
            {manageLocalAssets && manageLocal && renderManageLocal()}
          </DialogContent>
        </div>
      </Dialog>
    </React.Fragment>
  );
}
