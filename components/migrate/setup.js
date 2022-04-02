import React, { useState, useEffect } from 'react';
import {
  TextField,
  Typography,
  InputAdornment,
  Button,
  MenuItem,
  IconButton,
  Dialog,
  InputLabel,
  InputBase,
  FormControl,
  CircularProgress,
  Tooltip,
  Stack,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { Search, ArrowDownward, ArrowForwardIos, DeleteOutline } from '@mui/icons-material';
import migrate from '../../stores/configurations/migrators'
import FactoryAbi from '../../stores/abis/FactoryAbi.json'
import pairContractAbi from '../../stores/abis/pairOldRouter.json'
import { formatCurrency, formatAddress, formatCurrencyWithSymbol, formatCurrencySmall } from '../../utils'
import migratorAbi from '../../stores/abis/migrator.json'
import classes from './ssSwap.module.css'
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import stores from '../../stores'
import {
  ACTIONS,
  ETHERSCAN_URL
} from '../../stores/constants'
import BigNumber from 'bignumber.js'

const BootstrapInput = styled(InputBase)(({ theme }) => ({
  '& .MuiInputBase-input': {
    borderRadius: 4,
    position: 'relative',
    color: '#1976d2',
    backgroundColor: 'rgb(33, 43, 72)',
    border: '1px solid rgba(126, 153, 176, 0.2)',
    fontSize: 16,
    padding: '10px 26px 10px 12px',
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    '&:focus': {
      borderRadius: 4,
      borderColor: '#80bdff',
      boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
    },
  },
}));
export default function Setup() {
  const [fromAssetValue, setFromAssetValue] = useState(null)
  const [toAssetValue, setToAssetValue] = useState(null)
  const { appTheme } = useAppThemeContext();
  const [isStable, toggleStablePool] = useState(false)
  const [pairDetails, setPairDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [fromAssetError, setFromAssetError] = useState(false);
  const [platform, setPlatform] = React.useState(migrate[1].value);
  const [fromAssetOptions, setFromAssetOptions] = useState([])
  const [toAssetOptions, setToAssetOptions] = useState([])


  function ValueLabelComponent(props) {
    const { children, value } = props;

    return (
      <Tooltip enterTouchDelay={0} placement="top" title={value}>
        {children}
      </Tooltip>
    );
  }

  const getPairDetails = async (token0, token1) => {
    console.log(token0, token1, "tokensAddress")
    try {
      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
      } else {
        const account = stores.accountStore.getStore("account");
        if (!account) {
          console.warn("account not found");
        } else {
         
          const factoryContract = new web3.eth.Contract(
            FactoryAbi,
            platform
          );
          console.log(platform,factoryContract,"hehe3")
          const pairAddress = await factoryContract.methods.getPair(
            token0,
            token1
          ).call();
          console.log('ftech noww', pairAddress)
          if (pairAddress !== "0x0000000000000000000000000000000000000000") {
            const pairContract = new web3.eth.Contract(
              pairContractAbi,
              pairAddress
            );
            console.log(pairContract, "pairContract")
            let lpBalance = await pairContract.methods.balanceOf(account.address).call();
            console.log('ftech noww', lpBalance)
            lpBalance = web3.utils.fromWei(lpBalance.toString(), "ether");
            const migrator = migrate.find(eachMigrate => eachMigrate.value === platform)
            const allowence = await pairContract.methods.allowance(
              account.address,
              migrator.migratorAddress[process.env.NEXT_PUBLIC_CHAINID]
            ).call()
            const pairDetails = {
              isValid: true,
              lpBalance,
              allowence,
              pairAddress
            }
            setAmount(lpBalance)
            setPairDetails(pairDetails)
            console.log(pairDetails,"hehe4")
          } else {
            const pairDetails = {
              isValid: false,
              lpBalance: 0,
              allowence: 0
            }
            setPairDetails(pairDetails)
          }
        }
      }
    }
    catch (e) {
      console.log(e, "e")
    }
  }

  const onAssetSelect = async (type, value) => {
    if (type === 'From') {

      if (value.address === toAssetValue.address) {
        setToAssetValue(fromAssetValue)
        setFromAssetValue(toAssetValue)
      } else {
        setFromAssetValue(value)
      }
      getPairDetails(value.address, toAssetValue.address)
    } else {
      if (value.address === fromAssetValue.address) {
        setFromAssetError(toAssetValue)
        setToAssetValue(fromAssetValue)
      } else {
        setToAssetValue(value)
      }
      getPairDetails(fromAssetValue.address, value.address)
    }
  }

  useEffect(function () {
    const ssUpdated = async () => {
      const baseAsset = await stores.stableSwapStore.getStore('baseAssets')

      setToAssetOptions(baseAsset)
      setFromAssetOptions(baseAsset)

      if (baseAsset.length > 0 && toAssetValue == null) {
        setToAssetValue(baseAsset[0])
      }

      if (baseAsset.length > 0 && fromAssetValue == null) {
        setFromAssetValue(baseAsset[1])
      }
      console.log(baseAsset[0]?.address,baseAsset[1]?.address,"hehe2")
      //await getPairDetails(baseAsset[0].address,baseAsset[1].address)
      // forceUpdate()
    }
   
    stores.emitter.on(ACTIONS.UPDATED, ssUpdated)
    ssUpdated()
  }, [fromAssetValue, toAssetValue,pairDetails]);

  const handleChange = (event) => {
    setPlatform(event.target.value);
    getPairDetails(fromAssetValue.address, toAssetValue.address)
  };

  const migrateLiquidity = async () => {
    try {
      setLoading(true)
      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
      } else {
        const account = stores.accountStore.getStore("account");
        if (!account) {
          console.warn("account not found");
        } else {
          const migrator = migrate.find(eachMigrate => eachMigrate.value === platform)
          const migratorContract = new web3.eth.Contract(
            migratorAbi,
            migrator.migratorAddress[process.env.NEXT_PUBLIC_CHAINID]
          );
          const balanceInWei = web3.utils.toWei(amount);
          const now = new Date();
          const utcMilllisecondsSinceEpoch = now.getTime();
          const utcSecondsSinceEpoch = Math.round(utcMilllisecondsSinceEpoch / 1000) + 1800;
          console.log({ migratorContract })
          if (parseFloat(pairDetails.allowence) === 0) {
            const pairContract = new web3.eth.Contract(
              pairContractAbi,
              pairDetails.pairAddress
            );
            await pairContract.methods.approve(
              migrator.migratorAddress[process.env.NEXT_PUBLIC_CHAINID],
              balanceInWei
            ).send({ from: account.address });
            await migratorContract.methods.migrate(
              fromAssetValue.address,
              toAssetValue.address,
              isStable,
              balanceInWei,
              1,
              1,
              utcSecondsSinceEpoch
            ).send({ from: account.address });
            setLoading(false)
          } else {
            await migratorContract.methods.migrate(
              fromAssetValue.address,
              toAssetValue.address,
              isStable,
              balanceInWei,
              1,
              1,
              utcSecondsSinceEpoch
            ).send({ from: account.address });
            setLoading(false)
          }
        }
      }
    } catch (error) {
      console.error(error)
      setLoading(false)
    }
  }

  const handleAmountChange = (event) => {
    if (parseFloat(event.target.value) >= parseFloat(pairDetails.lpBalance)) {
      setAmount(pairDetails.lpBalance)
    } else {
      setAmount(event.target.value)
    }

  }

  let buttonText = 'Approve';

  if (loading && pairDetails && parseFloat(pairDetails.allowence) === 0) {
    buttonText = 'Approving...';
  } else if (loading && pairDetails && parseFloat(pairDetails.allowence) > 0) {
    buttonText = 'Migrating...';
  } else if (pairDetails && parseFloat(pairDetails.allowence) > 0) {
    buttonText = 'Migrate Liquidity';
  }
  let disableButton = false;
  if (loading && pairDetails && !pairDetails.isValid && parseFloat(pairDetails.lpBalance) <= 0) {
    disableButton = true;
  }
  return (
    <div className={[classes[`form`], classes[`form--${appTheme}`]].join(' ')}>
      <div className={classes.infoContainer}>
        <div style={{ marginBottom: '20px' }}>
          <p className={classes.inputBalanceText}>
            Select Exchange Platform
          </p>
          <FormControl variant="standard" sx={{ minWidth: 120, width: '300px' }}>
            <InputLabel id="demo-simple-select-standard-label">Select Exchange Platform</InputLabel>
            <Select
              labelId="demo-simple-select-standard-label"
              id="demo-simple-select-standard"
              value={platform}
              onChange={handleChange}
              label="Exchange Platform"
              input={<BootstrapInput />}
            >
              {migrate.map(eachPlatform =>
                <MenuItem value={eachPlatform.value}>{eachPlatform.label}</MenuItem>
              )}
            </Select>
          </FormControl>
        </div>
        <span className={classes.inputBalanceText}>
          Select Pair Token
      </span>
        <div className={classes.massiveInputAssetSelect}>
          <AssetSelect type="From" value={fromAssetValue} assetOptions={fromAssetOptions} onSelect={onAssetSelect} />
        </div>
        <div className={classes.massiveInputAssetSelect}>
          <AssetSelect type="To" value={toAssetValue} assetOptions={toAssetOptions} onSelect={onAssetSelect} />
        </div>
        {pairDetails && !pairDetails.isValid &&
          <span className={classes.inputBalanceErrorText}>
            Pair is Invaild
        </span>
        }
        {pairDetails && pairDetails.isValid &&
          <div style={{ width: '100%' }}>
            <div style={{ width: '100%', textAlign: 'center' }}>
              <span className={classes.inputBalanceText} style={{ fontWeight: '800' }}>
                Valid Pair Found
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className={classes.warningText}>Pair</span>
                <span className={classes.inputBalanceText}>{`${pairDetails.pairAddress.slice(0, 10)}...${pairDetails.pairAddress.slice(pairDetails.pairAddress.length - 10)}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className={classes.warningText}>Balance</span>
                <span className={classes.inputBalanceText}>{pairDetails.lpBalance}</span>
              </div>
              <div>
                <span className={classes.warningText}>Enter Amount to Migrate</span>
                <TextField type="number" max variant="outlined" fullWidth value={amount} onChange={(event) => handleAmountChange(event)} />
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <span className={classes.inputBalanceText} style={{ marginBottom: '10px', fontWeight: '800' }}>
                Select  Pool for Migration
              </span>
              <Stack spacing={2} direction="row" justifyContent="center" sx={{ marginTop: '10px' }}>
                <Button variant={isStable ? "contained" : "outlined"} onClick={() => toggleStablePool(true)}>Stable Pool</Button>
                <Button variant={isStable ? "outlined" : "contained"} onClick={() => toggleStablePool(false)}>Variable Pool</Button>
              </Stack>
            </div>
          </div>
        }
        <Button
          variant='contained'
          size='large'
          color='primary'
          onClick={migrateLiquidity}
          disabled={disableButton}
          className={[classes.buttonOverride, classes[`buttonOverride--${appTheme}`]].join(' ')}
        >
          <Typography className={classes.actionButtonText}>{buttonText}</Typography>
          {loading && <CircularProgress size={10} className={classes.loadingCircle} />}
        </Button>
      </div>
    </div>
  )
  function AssetSelect({ type, value, assetOptions, onSelect }) {

    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('')
    const [filteredAssetOptions, setFilteredAssetOptions] = useState([])

    const [manageLocal, setManageLocal] = useState(false)

    const openSearch = () => {
      setSearch('')
      setOpen(true)
    };

    useEffect(async function () {

      let ao = assetOptions.filter((asset) => {
        if (search && search !== '') {
          return asset.address.toLowerCase().includes(search.toLowerCase()) ||
            asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
            asset.name.toLowerCase().includes(search.toLowerCase())
        } else {
          return true
        }
      })
      setFilteredAssetOptions(ao)

      //no options in our default list and its an address we search for the address
      if (ao.length === 0 && search && search.length === 42) {
        const baseAsset = await stores.stableSwapStore.getBaseAsset(event.target.value, true, true)
      }

      return () => {
      }
    }, [assetOptions, search]);


    const onSearchChanged = async (event) => {
      setSearch(event.target.value)
    }

    const onLocalSelect = (type, asset) => {
      setSearch('')
      setManageLocal(false)
      setOpen(false)
      onSelect(type, asset)
    }

    const onClose = () => {
      setManageLocal(false)
      setSearch('')
      setOpen(false)
    }

    const toggleLocal = () => {
      setManageLocal(!manageLocal)
    }

    const deleteOption = (token) => {
      stores.stableSwapStore.removeBaseAsset(token)
    }

    const viewOption = (token) => {
      window.open(`${ETHERSCAN_URL}token/${token.address}`, '_blank')
    }

    const renderManageOption = (type, asset, idx) => {
      return (
        <MenuItem val={asset.address} key={asset.address + '_' + idx} className={classes.assetSelectMenu} >
          <div className={classes.assetSelectMenuItem}>
            <div className={classes.displayDualIconContainerSmall}>
              <img
                className={classes.displayAssetIconSmall}
                alt=""
                src={asset ? `${asset.logoURI}` : ''}
                height='60px'
                onError={(e) => { e.target.onerror = null; e.target.src = "public/tokens/unknown-logo.png" }}
              />
            </div>
          </div>
          <div className={classes.assetSelectIconName}>
            <Typography variant='h5'>{asset ? asset.symbol : ''}</Typography>
            <Typography variant='subtitle1' color='textSecondary'>{asset ? asset.name : ''}</Typography>
          </div>
          <div className={classes.assetSelectActions}>
            <IconButton onClick={() => { deleteOption(asset) }}>
              <DeleteOutline />
            </IconButton>
            <IconButton onClick={() => { viewOption(asset) }}>
              ↗
          </IconButton>
          </div>
        </MenuItem>
      )
    }

    const renderAssetOption = (type, asset, idx) => {
      return (
        <MenuItem val={asset.address} key={asset.address + '_' + idx} className={classes.assetSelectMenu} onClick={() => { onLocalSelect(type, asset) }}>
          <div className={classes.assetSelectMenuItem}>
            <div className={classes.displayDualIconContainerSmall}>
              <img
                className={classes.displayAssetIconSmall}
                alt=""
                src={asset ? `${asset.logoURI}` : ''}
                height='60px'
                onError={(e) => { e.target.onerror = null; e.target.src = "/tokens/unknown-logo.png" }}
              />
            </div>
          </div>
          <div className={classes.assetSelectIconName}>
            <Typography variant='h5'>{asset ? asset.symbol : ''}</Typography>
            <Typography variant='subtitle1' color='textSecondary'>{asset ? asset.name : ''}</Typography>
          </div>
          <div className={classes.assetSelectBalance}>
            <Typography variant='h5'>{(asset && asset.balance) ? formatCurrency(asset.balance) : '0.00'}</Typography>
            <Typography variant='subtitle1' color='textSecondary'>{'Balance'}</Typography>
          </div>
        </MenuItem>
      )
    }

    const renderManageLocal = () => {
      return (
        <>
          <div className={classes.searchContainer}>
            <div className={classes.searchInline}>
              <TextField
                autoFocus
                variant="outlined"
                fullWidth
                placeholder="MATIC, DAI, 0x..."
                value={search}
                onChange={onSearchChanged}
                InputProps={{
                  startAdornment: <InputAdornment position="start">
                    <Search />
                  </InputAdornment>,
                }}
              />
            </div>
            <div className={classes.assetSearchResults}>
              {
                filteredAssetOptions ? filteredAssetOptions.filter((option) => {
                  return option.local === true
                }).map((asset, idx) => {
                  return renderManageOption(type, asset, idx)
                }) : []
              }
            </div>
          </div>
          <div className={classes.manageLocalContainer}>
            <Button
              onClick={toggleLocal}
            >
              Back to Assets
          </Button>
          </div>
        </>
      )
    }

    const renderOptions = () => {
      return (
        <>
          <div className={classes.searchContainer}>
            <div className={classes.searchInline}>
              <TextField
                autoFocus
                variant="outlined"
                fullWidth
                placeholder="MATICC,DAI, 0x..."
                value={search}
                onChange={onSearchChanged}
                InputProps={{
                  startAdornment: <InputAdornment position="start">
                    <Search />
                  </InputAdornment>,
                }}
              />
            </div>
            <div className={classes.assetSearchResults}>
              {
                filteredAssetOptions ? filteredAssetOptions.sort((a, b) => {
                  if (BigNumber(a.balance).lt(b.balance)) return 1;
                  if (BigNumber(a.balance).gt(b.balance)) return -1;
                  if (a.symbol.toLowerCase() < b.symbol.toLowerCase()) return -1;
                  if (a.symbol.toLowerCase() > b.symbol.toLowerCase()) return 1;
                  return 0;
                }).map((asset, idx) => {
                  return renderAssetOption(type, asset, idx)
                }) : []
              }
            </div>
          </div>
          <div className={classes.manageLocalContainer}>
            <Button
              onClick={toggleLocal}
            >
              Manage Local Assets
          </Button>
          </div>
        </>
      )
    }

    return (
      <React.Fragment>
        <div className={classes.displaySelectContainer} onClick={() => { openSearch() }}>
          <div className={classes.displayDualIconContainer}>
            <img
              className={classes.displayAssetIcon}
              alt=""
              src={value ? `${value.logoURI}` : ''}
              height='100px'
              onError={(e) => { e.target.onerror = null; e.target.src = "/tokens/unknown-logo.png" }}
            />
            <Typography variant='subtitle1' color='primary'>{value ? value.name : type === 'from' ? 'Select Token 0' : 'Select Token 1'}</Typography>
          </div>
        </div>
        <Dialog onClose={onClose} aria-labelledby="simple-dialog-title" open={open} >
          {!manageLocal && renderOptions()}
          {manageLocal && renderManageLocal()}
        </Dialog>
      </React.Fragment>
    )
  }
}
