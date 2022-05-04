import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  TextField,
  InputAdornment,
  CircularProgress,
  Typography,
  Tooltip,
  Button,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import BigNumber from 'bignumber.js';
import TokenSelect from '../select-token/select-token';
import classes from './ssWhitelist.module.css';
import stores from '../../stores';
import { ACTIONS, ETHERSCAN_URL } from '../../stores/constants';
import { formatAddress, formatCurrency } from '../../utils';
import { formatSymbol } from '../../utils';
import { useAppThemeContext } from '../../ui/AppThemeProvider';

export default function ssWhitelist() {

  const [web3, setWeb3] = useState(null);
  const [loading, setLoading] = useState(false);
  const [whitelistLoading, setWhitelistLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [token, setToken] = useState(null);
  const [nfts, setNFTS] = useState([]);
  const [nft, setNFT] = useState(null);
  const [veToken, setVeToken] = useState(null);
  const {appTheme} = useAppThemeContext();

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
    if (web3 && web3.utils.isAddress(event.target.value)) {
      setLoading(true);
      stores.dispatcher.dispatch({type: ACTIONS.SEARCH_WHITELIST, content: {search: event.target.value}});
    }
  };

  useEffect(() => {
    const searchReturned = async (res) => {
      setToken(res);
      setLoading(false);
    };

    const whitelistReturned = async (res) => {
      setWhitelistLoading(false);
    };

    const ssUpdated = () => {
      setVeToken(stores.stableSwapStore.getStore('veToken'));

      const nfts = stores.stableSwapStore.getStore('vestNFTs');
      /*const nfts = [
        {
          "id": "3",
          "lockEnds": "1776297600",
          "lockAmount": "1331994.000000000000000000",
          "lockValue": "1316652.680121337436847399",
        },
        {
          "id": "4",
          "lockEnds": "1776297600",
          "lockAmount": "1118072.000000000000000000",
          "lockValue": "1105194.539441336798729261",
        },
        {
          "id": "15",
          "lockEnds": "1776297600",
          "lockAmount": "676304.000000000000000000",
          "lockValue": "668514.628576991346531549",
        },
        {
          "id": "6",
          "lockEnds": "1776297600",
          "lockAmount": "1023840.000000000000000000",
          "lockValue": "1012047.862089041025858407",
        },
        {
          "id": "14",
          "lockEnds": "1776297600",
          "lockAmount": "677507.000000000000000000",
          "lockValue": "669703.772953156656524642",
        },
        {
          "id": "13",
          "lockEnds": "1776297600",
          "lockAmount": "681101.000000000000000000",
          "lockValue": "673256.378845042060782790",
        },
        {
          "id": "9",
          "lockEnds": "1776297600",
          "lockAmount": "795726.000000000000000000",
          "lockValue": "786561.178610587794780056",
        },
        {
          "id": "10",
          "lockEnds": "1776297600",
          "lockAmount": "763362.000000000000000000",
          "lockValue": "754569.932899686001888625",
        },
        {
          "id": "11",
          "lockEnds": "1776297600",
          "lockAmount": "727329.000000000000000000",
          "lockValue": "718951.945113846051442262",
        },
        {
          "id": "12",
          "lockEnds": "1776297600",
          "lockAmount": "688233.000000000000000000",
          "lockValue": "680306.235612133731215627",
        },
      ];*/

      setNFTS(nfts);

      if (nfts && nfts.length > 0) {
        setNFT(nfts[0]);
      }
    };

    const accountChanged = async () => {
      const w3 = await stores.accountStore.getWeb3Provider();
      setWeb3(w3);
    };

    const errorReturned = () => {
      setWhitelistLoading(false);
    };

    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
    stores.emitter.on(ACTIONS.ACCOUNT_CHANGED, accountChanged);
    stores.emitter.on(ACTIONS.ACCOUNT_CONFIGURED, accountChanged);
    stores.emitter.on(ACTIONS.SEARCH_WHITELIST_RETURNED, searchReturned);
    stores.emitter.on(ACTIONS.WHITELIST_TOKEN_RETURNED, whitelistReturned);

    accountChanged();

    return () => {
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
      stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
      stores.emitter.removeListener(ACTIONS.ACCOUNT_CHANGED, accountChanged);
      stores.emitter.removeListener(ACTIONS.ACCOUNT_CONFIGURED, accountChanged);
      stores.emitter.removeListener(ACTIONS.SEARCH_WHITELIST_RETURNED, searchReturned);
      stores.emitter.removeListener(ACTIONS.WHITELIST_TOKEN_RETURNED, whitelistReturned);
    };
  }, []);

  const onAddressClick = (address) => {
    window.open(`${ETHERSCAN_URL}token/${address}`, '_blank');
  };

  const onWhitelist = () => {
    setWhitelistLoading(true);
    stores.dispatcher.dispatch({type: ACTIONS.WHITELIST_TOKEN, content: {token, nft}});
  };

  const handleChange = (event) => {
    setNFT(event.target.value);
  };

  const renderToken = () => {
    return (

      <Paper className={classes.tokenContainer}>
        <div className={classes.inline}>
          <img src={token.logoURI} alt="" width="70" height="70" className={classes.tokenLogo}/>
          <div>
            <Typography className={classes.tokenName} variant="h2">{token.name}</Typography>
            <Tooltip title="View in explorer">
              <Typography className={classes.tokenAddress} color="textSecondary" onClick={() => {
                onAddressClick(token.address);
              }}>{formatAddress(token.address)}</Typography>
            </Tooltip>
          </div>
        </div>
        <div className={classes.whitelistStatus}>
          <div className={classes.whitelistContainer}>
            <div>
              <Typography className={classes.listingFee} color="textSecondary">Whitelist Status</Typography>
              {token.isWhitelisted &&
                <Typography className={classes.isWhitelist}>{'Whitelisted'}</Typography>
              }
              {!token.isWhitelisted &&
                <Typography className={classes.notWhitelist}>{'Not Whitelisted'}</Typography>
              }
            </div>
            {
              !token.isWhitelisted &&
              <Tooltip title="Listing fee either needs to be locked in your veToken NFT or be paid and burnt on list">
                <div>
                  <Typography className={classes.listingFee} color="textSecondary">Listing Fee</Typography>
                  <Typography
                    className={classes.listingFee}>{formatCurrency(token.listingFee)} {formatSymbol(veToken?.symbol)}</Typography>
                </div>
              </Tooltip>
            }
          </div>
          <div>
            {!token.isWhitelisted && nft && BigNumber(nft.lockValue).gt(token.listingFee) &&
              <Button
                variant="contained"
                size="large"
                color="primary"
                onClick={onWhitelist}
                className={classes.buttonOverride}
                disabled={whitelistLoading}
              >
                <Typography
                  className={classes.actionButtonText}>{whitelistLoading ? `Whitelisting` : `Whitelist`}</Typography>
                {whitelistLoading && <CircularProgress size={10} className={classes.loadingCircle}/>}
              </Button>
            }
            {!token.isWhitelisted && (!nft || BigNumber(nft.lockValue).lt(token.listingFee)) &&
              <Button
                variant="contained"
                size="large"
                color="primary"
                className={classes.buttonOverride}
                disabled={true}
              >
                <Typography className={classes.actionButtonText}>{`Vest value < Fee`}</Typography>
              </Button>
            }
          </div>
        </div>
      </Paper>
    );
  };

  return (
    <>
      <div className={['g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
        <TextField
          autoFocus
          fullWidth
          placeholder="Paste the token address you want to whitelist: 0x..."
          value={search}
          onChange={onSearchChanged}
          InputProps={{
            style: {
              background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
              border: '1px solid',
              borderColor: appTheme === "dark" ? '#5F7285' : '#86B9D6',
              borderRadius: 0,
              maxWidth: 700,
            },
            classes: {
              root: classes.searchInput,
            },
            startAdornment: <InputAdornment position="start">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10.518 9.69309L13.0165 12.1909L12.191 13.0163L9.69321 10.5179C8.76381 11.263 7.60779 11.6682 6.41663 11.6665C3.51863 11.6665 1.16663 9.3145 1.16663 6.4165C1.16663 3.5185 3.51863 1.1665 6.41663 1.1665C9.31463 1.1665 11.6666 3.5185 11.6666 6.4165C11.6683 7.60767 11.2631 8.76368 10.518 9.69309ZM9.34788 9.26025C10.0882 8.49894 10.5016 7.47842 10.5 6.4165C10.5 4.16017 8.67238 2.33317 6.41663 2.33317C4.16029 2.33317 2.33329 4.16017 2.33329 6.4165C2.33329 8.67225 4.16029 10.4998 6.41663 10.4998C7.47854 10.5015 8.49906 10.0881 9.26038 9.34775L9.34788 9.26025Z"
                  fill={appTheme === "dark" ? '#4CADE6' : '#0B5E8E'}
                />
              </svg>
            </InputAdornment>,
          }}
          inputProps={{
            className: classes.searchInputText,
            style: {
              padding: '10px',
              borderRadius: 0,
              border: 'none',
              fontWeight: 400,
              fontSize: '18px',
              lineHeight: '120%',
              color: appTheme === 'dark' ? '#C6CDD2' : '#325569',
            },
          }}
        />

        {TokenSelect({
          value: nft,
          options: nfts,
          symbol: veToken?.symbol,
          handleChange,
          placeholder: 'Click to select veNFT'
        })}
      </div>

      <div className={classes.results}>
        {loading && <CircularProgress style={{
          position: 'absolute',
          top: 200,
          left: '50%',
          color: '#ffffff',
        }}/>}
        {token && token.address && renderToken()}
      </div>
    </>
  );
}
