import React, { useState, useEffect } from "react";
import { useAppThemeContext } from "../AppThemeProvider";
import classes from './AssetSelect.module.css';
import stores from '../../stores';
import { ETHERSCAN_URL } from '../../stores/constants';
import {
  Button,
  Dialog, DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Close, DeleteOutline, Search } from '@mui/icons-material';
import { formatCurrency } from '../../utils';
import BigNumber from 'bignumber.js';
import { TokenOptions } from './TokenOptions'

const AssetSelect = (
  {
    type,
    value,
    assetOptions,
    onSelect,
    typeIcon = 'single',
    isManageLocal = true,
    title = 'Select a Token',
    showBalance = true,
    interactiveBorder = true,
    size = 'default',
  }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredAssetOptions, setFilteredAssetOptions] = useState([]);

  const [manageLocal, setManageLocal] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const handleOpenPopover = (event) => {
    if (!value) {
      return;
    }
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const openSearch = () => {
    if (anchorEl) {
      return;
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
                e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
              }}
            />
          </div>
        </div>

        <div>
          <Typography
            variant="h5"
            className={[classes.assetSymbolName, typeIcon === 'double' ? classes.assetSymbolNameDouble : ''].join(' ')}
            style={{
              color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
            }}>
            {asset ? asset.symbol : ''}
          </Typography>

          <Typography
            variant="subtitle1"
            className={classes.assetSymbolName2}
            style={{
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
          {typeIcon === 'single' &&
            <div className={classes.displayDualIconContainerSmall}>

              <img
                className={[classes.assetOptionIcon, classes[`assetOptionIcon--${appTheme}`]].join(' ')}
                alt=""
                src={asset ? `${asset.logoURI}` : ''}
                height="50px"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                }}
              />
            </div>
          }

          {typeIcon === 'double' &&
            <div className={classes.displayDualIconContainerDouble}>
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
          }
        </div>

        <div className={['g-flex__item'].join(' ')}>
          <div
            className={[classes.assetSelectIconName, 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
            <div
              className={[classes.assetSymbolName, typeIcon === 'double' ? classes.assetSymbolNameDouble : ''].join(' ')}
              style={{
                color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
              }}>
              {asset ? asset.symbol : ''}
            </div>

            {showBalance &&
              <div
                className={classes.assetSelectBalanceText}
                style={{
                  color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
                }}>
                {(asset && asset.balance) ? formatCurrency(asset.balance) : '0.00'}
              </div>
            }
          </div>

          <div
            className={[classes.assetSelectBalance, 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
            <div
              className={classes.assetSymbolName2}
              style={{
                color: appTheme === "dark" ? '#7C838A' : '#5688A5',
              }}>
              {asset ? asset.name : ''}
            </div>

            {showBalance &&
              <div
                className={classes.assetSelectBalanceText2}
                style={{
                  color: appTheme === "dark" ? '#7C838A' : '#5688A5',
                }}>
                {typeIcon === 'single' ? 'Balance' : ''}
              </div>
            }
          </div>
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

        {filteredAssetOptions?.filter(option => option.local === true).length > 0 &&
          <div className={[classes.assetSearchResults, classes[`assetSearchResults--${appTheme}`]].join(' ')}>
            {/* <Borders/> */}
            {
              filteredAssetOptions
                .filter(option => option.local === true)
                .map((asset, idx) => {
                  return renderManageOption(type, asset, idx);
                })
            }
          </div>
        }

        <div className={classes.manageLocalContainer}>
          <Button onClick={toggleLocal}>
            Back to token list
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
        {/*  */}
        <div
          className={[classes.dialogOptions, 'g-flex-column__item', 'g-flex-column'].join(' ')}
          style={{
            position: 'relative',
            marginBottom: !isManageLocal ? 34 : 45,
          }}>
          {/* <Borders/> */}

          {filteredAssetOptions?.length > 0 &&
            <div className={[classes.assetSearchResults, classes[`assetSearchResults--${appTheme}`]].join(' ')}>
              {
                filteredAssetOptions.sort((a, b) => {
                  if (BigNumber(a.balance).lt(b.balance)) return 1;
                  if (BigNumber(a.balance).gt(b.balance)) return -1;
                  if (a.symbol.toLowerCase() < b.symbol.toLowerCase()) return -1;
                  if (a.symbol.toLowerCase() > b.symbol.toLowerCase()) return 1;
                  return 0;
                }).map((asset, idx) => {
                  return renderAssetOption(type, asset, idx);
                })
              }
            </div>
          }
        </div>

        {isManageLocal &&
          <div className={classes.manageLocalContainer}>
            <Button
              className={[classes.manageLocalBtn, classes[`manageLocalBtn--${appTheme}`]].join(' ')}
              onClick={toggleLocal}>
              Manage local assets
            </Button>
          </div>
        }
      </>
    );
  };

  const {appTheme} = useAppThemeContext();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });

  return (
    <React.Fragment>
      <div
        className={[
          classes.displaySelectContainer,
          size === 'small' ? classes.displaySelectContainerSmall : '',
          size === 'medium' ? classes.displaySelectContainerMedium : '',
            typeIcon === 'double' && type !== 'withdraw' ? classes.displaySelectContainerCreate : '',
            type === 'withdraw' ? classes.displaySelectContainerWithdraw : '',
        ].join(' ')}
        onClick={() => {
          openSearch();
        }}>
        <div className={classes.assetSelectMenuItem}>
          <div
            className={[classes.displayDualIconContainer, classes[`displayDualIconContainer--${appTheme}`], size === 'small' ? classes.displayDualIconContainerSmallest : ''].join(' ')}>

            {typeIcon === 'single' &&
              <>
                {/* {interactiveBorder &&
                  <SwapIconBg/>
                } */}

                <img
                  className={[classes.displayAssetIcon, size === 'small' ? classes.displayAssetIconSmall : ''].join(' ')}
                  alt=""
                  src={value ? `${value.logoURI}` : ''}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                  }}
                />
              </>
            }

            {typeIcon === 'double' &&
              <div className={classes.assetSelectMenuItem}>
                <div
                  className={classes.displayDualIconContainer}>
                  <img
                    className={[classes.displayAssetIcon, classes.displayAssetIconSecond, classes[`displayAssetIconSecond--${appTheme}`]].join(' ')}
                    alt=""
                    src={value ? `${value?.token0?.logoURI}` : ''}
                    height="100px"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                    }}
                  />
                  <img
                    className={[classes.displayAssetIcon, classes.displayAssetIconSec, classes.displayAssetIconSecond, classes[`displayAssetIconSecond--${appTheme}`]].join(' ')}
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
            }

              {typeIcon === 'double' ? (
                  <div className="g-flex g-flex-column">
                      <Typography className={[classes.labelSelect, classes.labelSelectDouble].join(' ')}>
                          {value?.symbol}
                      </Typography>
                      {value ?
                          <Typography className={classes.labelSelectSecondary}>
                              {value?.isStable ? 'Stable pool' : 'Volatile Pool'}
                          </Typography>
                       :
                          <Typography className={classes.labelSelectSecondary}>
                              Select LP
                          </Typography>
                      }
                  </div>
              ) : (
                  <Typography className={classes.labelSelect}>
                      {value?.symbol}
                  </Typography>
              )}

              {typeIcon !== 'double' &&
                <TokenOptions
                  value={value}
                  anchorEl={anchorEl}
                  handleClosePopover={handleClosePopover}
                  handleOpenPopover={handleOpenPopover}
                />
              }
          </div>
        </div>
      </div>

      <Dialog
        classes={{
          paperScrollPaper: classes.paperScrollPaper,
          paper: classes.paper
        }}
        aria-labelledby="simple-dialog-title"
        open={open}
        style={{borderRadius: 0}}
        onClick={(e) => {
          if (e.target.classList.contains('MuiDialog-container')) {
            onClose();
          }
        }}
        width={600}
      >
        <div
          className={[classes.dialogContainer, 'g-flex-column'].join(' ')}
          style={{
            width: 782,
            maxWidth: "100%",
            maxHeight: "100%",
            height: 768,
            // background: appTheme === "dark" ? '#151718' : '#DBE6EC',
            // border: appTheme === "dark" ? '1px solid #5F7285' : '1px solid #86B9D6',
            overflow: 'hidden',
          }}>
          <DialogTitle
            className={[classes.dialogTitle, 'g-flex-column__item-fixed'].join(' ')}
            style={{
              padding: 30,
              paddingBottom: 0,
              fontWeight: 500,
              fontSize: 60,
              lineHeight: '72px',
              color: '#E4E9F4',
              // letterSpacing: '0.04em',
            }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                color: "#E4E9F4",
                // color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
              }}>
                {/* {isManageLocal && manageLocal && <ArrowBackIosNew onClick={toggleLocal} style={{
                  marginRight: 10,
                  width: 18,
                  height: 18,
                  cursor: 'pointer',
                }}/>} */}
                {isManageLocal && manageLocal ? 'Select a Token' : title}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: 20,
                  height: 20,
                  backgroundColor: '#8191B9',
                  borderRadius: 5,
                }}
              >
                <Close
                  style={{
                    cursor: 'pointer',
                    // color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
                    color: '#1e2c48',
                    fontSize: 12,
                  }}
                  onClick={onClose}
                />
              </div>

            </div>
          </DialogTitle>

          <DialogContent
            style={{overflow: 'hidden'}}
            className={[classes.dialogContent, 'g-flex-column__item', 'g-flex-column'].join(' ')}
          >
            {!manageLocal && renderOptions()}
            {isManageLocal && manageLocal && renderManageLocal()}
          </DialogContent>
        </div>
      </Dialog>
    </React.Fragment>
  );
};

export default AssetSelect;
