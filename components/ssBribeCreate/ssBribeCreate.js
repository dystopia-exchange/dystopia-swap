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
  Select, InputBase, DialogTitle, DialogContent,
} from '@mui/material';
import { Add, Search, ArrowBack, DeleteOutline, ArrowBackIosNew, Close } from '@mui/icons-material';
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
import SwapIconBg from '../../ui/SwapIconBg';
import Borders from '../../ui/Borders';

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

  const setAmountPercent = (input, percent) => {
    setAmountError(false);
    if (input === 'amount') {
      let am = BigNumber(asset.balance).times(percent).div(100).toFixed(asset.decimals);
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
          Bribe for
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

        <Typography className={classes.inputBalanceText} noWrap onClick={() => {
          setAmountPercent(type, 100);
        }}>
          Balance:
          {(assetValue && assetValue.balance) ?
            ' ' + formatCurrency(assetValue.balance) :
            ''
          }
        </Typography>

        <div className={`${classes.massiveInputContainer} ${(amountError || assetError) && classes.error}`}>
          <div className={classes.massiveInputAssetSelect}>
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

  return (
    <Paper
      elevation={0}
      className={[classes.container, classes[`container--${appTheme}`, 'g-flex-column']].join(' ')}>
      <div
        className={[classes.titleSection, classes[`titleSection--${appTheme}`]].join(' ')}>
        <Tooltip title="Back to Vote" placement="top">
          <IconButton onClick={onBack}>
            <ArrowBackIosNew className={[classes.backIcon, classes[`backIcon--${appTheme}`]].join(' ')}/>
          </IconButton>
        </Tooltip>
      </div>

      <div className={[classes[`top`], classes[`top--${appTheme}`]].join(' ')}>
      </div>

      <div className={[classes.reAddPadding, classes[`reAddPadding--${appTheme}`]].join(' ')}>
        {renderMassiveGaugeInput('gauge', gauge, null, gaugeOptions, onGagugeSelect)}
        <div style={{marginTop: 20}}>
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
          {createLoading ? `Creating` : `Create Bribe`}
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
              height="60px"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
              }}
            />

          </div>
        </div>
        <div className={classes.assetSelectIconName}>
          <Typography variant="h5">{asset ? formatSymbol(asset.symbol) : ''}</Typography>
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
          <Typography
            variant="h5"
            style={{
              fontWeight: 500,
              fontSize: 18,
              lineHeight: '120%',
              color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
            }}>
            {asset ? formatSymbol(asset.symbol) : ''}
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
              endAdornment: <InputAdornment position="end">
                <Search style={{
                  color: '#779BF4',
                  // color: appTheme === "dark" ? '#4CADE6' : '#0B5E8E',
                }}/>
              </InputAdornment>,
            }}
            inputProps={{
              style: {
                padding: '24px',
                borderRadius: 0,
                border: 'none',
                fontSize: '16px',
                lineHeight: '120%',
                color: '#8191B9',
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
          {/* <Borders/> */}

          <TextField
            autoFocus
            variant="outlined"
            fullWidth
            placeholder="Search by name or paste address"
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              classes: {
                root: [classes.searchInput, classes[`searchInput--${appTheme}`]].join(' '),
                inputAdornedStart: [classes.searchInputText, classes[`searchInputText--${appTheme}`]].join(' '),
              },
              endAdornment: <InputAdornment position="end">
                <Search style={{
                  color: '#779BF4',
                  // color: appTheme === "dark" ? '#4CADE6' : '#0B5E8E',
                }}/>
              </InputAdornment>,
            }}
          />
        </div>

        <div style={{position: 'relative'}}>
          <Borders/>
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
            className={[classes.displayDualIconContainer, classes[`displayDualIconContainerSec--${appTheme}`]].join(' ')}>
            <SwapIconBg/>
            <img
              className={classes.displayAssetIcon}
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
        aria-labelledby="simple-dialog-title"
        open={open}
        style={{borderRadius: 0}}
        onClick={(e) => {
          if (e.target.classList.contains('MuiDialog-container')) {
            onClose();
          }
        }}
      >
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
                {'Manage local assets'}
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
          {/* <Borders/> */}

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
              endAdornment: <InputAdornment position="end">
                <Search style={{
                  color: '#779BF4',
                  // color: appTheme === "dark" ? '#4CADE6' : '#0B5E8E',
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

  const renderOptions = (manageLocalAssets) => {
    return (
      <>
        <div className={classes.searchInline}>
          <Borders/>

          <TextField
            autoFocus
            variant="outlined"
            fullWidth
            placeholder="Search by name or paste address"
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              classes: {
                root: [classes.searchInput, classes[`searchInput--${appTheme}`]].join(' '),
                inputAdornedStart: [classes.searchInputText, classes[`searchInputText--${appTheme}`]].join(' '),
              },
              endAdornment: <InputAdornment position="end">
                <Search style={{
                  color: '#779BF4',
                  // color: appTheme === "dark" ? '#4CADE6' : '#0B5E8E',
                }}/>
              </InputAdornment>,
            }}
          />
        </div>

        <div style={{position: 'relative'}}>
          <Borders/>

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
            className={[classes.displayDualIconContainer, classes[`displayDualIconContainer--${appTheme}`]].join(' ')}>
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
        aria-labelledby="simple-dialog-title"
        open={open}
        style={{borderRadius: 0}}
        onClick={(e) => {
          if (e.target.classList.contains('MuiDialog-container')) {
            onClose();
          }
        }}
      >
        <div
          className={classes.dialogContainer}
          style={{
            width: 460,
            height: 710,
            background: appTheme === "dark" ? '#151718' : '#DBE6EC',
            border: appTheme === "dark" ? '1px solid #5F7285' : '1px solid #86B9D6',
            borderRadius: 0,
          }}>
          <DialogTitle
            className={classes.dialogTitle}
            style={{
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
                paddingBottom: 8,
              }}>
                {manageLocal && <ArrowBackIosNew onClick={toggleLocal} style={{
                  marginRight: 10,
                  width: 18,
                  height: 18,
                  cursor: 'pointer',
                }}/>}
                {manageLocalAssets && manageLocal ? 'Manage local assets' : 'Select a liquidity pool'}
              </div>
              <Close
                style={{
                  cursor: 'pointer',
                  color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
                }}
                onClick={onClose}/>
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
