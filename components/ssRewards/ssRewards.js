import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Typography,
  Tooltip,
  IconButton,
  TextField,
  InputAdornment,
  Popper,
  Fade,
  Grid,
  Switch,
  Select,
  MenuItem,
} from '@mui/material';
import classes from './ssRewards.module.css';

import RewardsTable from './ssRewardsTable.js';
import { Add, AddCircleOutline, ArrowDropDownCircleOutlined } from '@mui/icons-material';

import { formatCurrency } from '../../utils';
import stores from '../../stores';
import { ACTIONS } from '../../stores/constants';
import { useAppThemeContext } from '../../ui/AppThemeProvider';

export default function ssRewards() {

  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  const [rewards, setRewards] = useState([]);
  const [vestNFTs, setVestNFTs] = useState([]);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [token, setToken] = useState(null);
  const [veToken, setVeToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const {appTheme} = useAppThemeContext();

  const stableSwapUpdated = (rew) => {
    const nfts = stores.stableSwapStore.getStore('vestNFTs');
    setVestNFTs(nfts);
    setVeToken(stores.stableSwapStore.getStore('veToken'));

    if (nfts && nfts.length > 0) {
      if (!token) {
        setToken(nfts[0]);
        window.setTimeout(() => {
          stores.dispatcher.dispatch({type: ACTIONS.GET_REWARD_BALANCES, content: {tokenID: nfts[0].id}});
        });
      } else {
        window.setTimeout(() => {
          stores.dispatcher.dispatch({type: ACTIONS.GET_REWARD_BALANCES, content: {tokenID: token.id}});
        });
      }
    } else {
      window.setTimeout(() => {
        stores.dispatcher.dispatch({type: ACTIONS.GET_REWARD_BALANCES, content: {tokenID: 0}});
      });
    }

    forceUpdate();
  };

  const rewardBalancesReturned = (rew) => {
    if (rew) {
      if (rew && rew.bribes && rew.fees && rew.rewards && rew.veDist && rew.bribes.length >= 0 && rew.fees.length >= 0 && rew.rewards.length >= 0) {
        setRewards([...rew.bribes, ...rew.fees, ...rew.rewards, ...rew.veDist]);
      }
    } else {
      let re = stores.stableSwapStore.getStore('rewards');
      if (re && re.bribes && re.fees && re.rewards && re.veDist && re.bribes.length >= 0 && re.fees.length >= 0 && re.rewards.length >= 0) {
        setRewards([...re.bribes, ...re.fees, ...re.rewards, ...re.veDist]);
      }
    }
  };

  useEffect(() => {
    rewardBalancesReturned();
    stableSwapUpdated();

    stores.emitter.on(ACTIONS.UPDATED, stableSwapUpdated);
    stores.emitter.on(ACTIONS.REWARD_BALANCES_RETURNED, rewardBalancesReturned);
    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, stableSwapUpdated);
      stores.emitter.removeListener(ACTIONS.REWARD_BALANCES_RETURNED, rewardBalancesReturned);
    };
  }, [token]);

  useEffect(() => {

    const claimReturned = () => {
      setLoading(false);
    };

    const claimAllReturned = () => {
      setLoading(false);
    };

    stableSwapUpdated();

    stores.emitter.on(ACTIONS.CLAIM_BRIBE_RETURNED, claimReturned);
    stores.emitter.on(ACTIONS.CLAIM_REWARD_RETURNED, claimReturned);
    stores.emitter.on(ACTIONS.CLAIM_PAIR_FEES_RETURNED, claimReturned);
    stores.emitter.on(ACTIONS.CLAIM_VE_DIST_RETURNED, claimReturned);
    stores.emitter.on(ACTIONS.CLAIM_ALL_REWARDS_RETURNED, claimAllReturned);
    return () => {
      stores.emitter.removeListener(ACTIONS.CLAIM_BRIBE_RETURNED, claimReturned);
      stores.emitter.removeListener(ACTIONS.CLAIM_REWARD_RETURNED, claimReturned);
      stores.emitter.removeListener(ACTIONS.CLAIM_PAIR_FEES_RETURNED, claimReturned);
      stores.emitter.removeListener(ACTIONS.CLAIM_VE_DIST_RETURNED, claimReturned);
      stores.emitter.removeListener(ACTIONS.CLAIM_ALL_REWARDS_RETURNED, claimAllReturned);
    };
  }, []);

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
  };

  const onClaimAll = () => {
    setLoading(true);
    let sendTokenID = 0;
    if (token && token.id) {
      sendTokenID = token.id;
    }
    stores.dispatcher.dispatch({type: ACTIONS.CLAIM_ALL_REWARDS, content: {pairs: rewards, tokenID: sendTokenID}});
  };

  const handleClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleChange = (event) => {
    setToken(event.target.value);
    stores.dispatcher.dispatch({type: ACTIONS.GET_REWARD_BALANCES, content: {tokenID: event.target.value.id}});
  };

  const open = Boolean(anchorEl);
  const id = open ? 'transitions-popper' : undefined;

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });

  const renderTokenSelect = (value, options) => {
    return (
      <Select
        className={[classes.tokenSelect, classes[`tokenSelect--${appTheme}`]].join(' ')}
        fullWidth
        value={value}
        onChange={handleChange}
        IconComponent={ArrowDropDownCircleOutlined}
        inputProps={{
          className: appTheme === 'dark' ? classes['tokenSelectInput--dark'] : classes.tokenSelectInput,
        }}>
        {options && options.map((option) => {
          return (
            <MenuItem key={option.id} value={option}>
              <div
                className={[classes.menuOption, 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                <Typography
                  style={{
                    fontWeight: 500,
                    fontSize: 24,
                    color: appTheme === 'dark' ? '#ffffff' : '#0B5E8E',
                  }}>
                  #{option.id}
                </Typography>

                <div className={[classes.menuOptionSec, 'g-flex-column'].join(' ')}>
                  <Typography
                    style={{
                      fontWeight: 500,
                      fontSize: 12,
                      color: appTheme === 'dark' ? '#ffffff' : '#0B5E8E',
                    }}>
                    {formatCurrency(option.lockValue)}
                  </Typography>

                  <Typography
                    style={{
                      fontWeight: 500,
                      fontSize: 12,
                      color: appTheme === 'dark' ? '#7C838A' : '#86B9D6',
                    }}>
                    {veToken?.symbol}
                  </Typography>
                </div>
              </div>
            </MenuItem>
          );
        })}
      </Select>
    );
  };

  return (
    <>
      <div
        className={[classes.toolbarContainer, 'g-flex', 'g-flex--align-baseline', 'g-flex--space-between'].join(' ')}>
        <div
          className={[classes.addButton, classes[`addButton--${appTheme}`], 'g-flex', 'g-flex--align-center', 'g-flex--justify-center'].join(' ')}
          onClick={onClaimAll}>
          <div
            className={[classes.addButtonIcon, 'g-flex', 'g-flex--align-center', 'g-flex--justify-center'].join(' ')}>
            <Add style={{width: 20, color: '#fff'}}/>
          </div>

          <Typography
            className={[classes.actionButtonText, classes[`actionButtonText--${appTheme}`], 'g-flex', 'g-flex--align-center', 'g-flex--justify-center'].join(' ')}>
            Claim All
          </Typography>
        </div>

        <div className={['g-flex', 'g-flex--align-baseline'].join(' ')}>
          <div
            className={classes.disclaimerContainer}
            style={{
              position: 'relative',
            }}>
            <div className={[classes.divider, classes[`divider--${appTheme}`]].join(' ')}>
            </div>

            {windowWidth > 1100 &&
              <Typography className={[classes.disclaimer, classes[`disclaimer--${appTheme}`]].join(' ')}>
                Rewards are an estimation that aren’t exact till the<br/>supply → rewardPerToken calculations have run
              </Typography>
            }

            {windowWidth <= 1100 && windowWidth > 1005 &&
              <Typography className={[classes.disclaimer, classes[`disclaimer--${appTheme}`]].join(' ')}>
                Rewards are an estimation that aren’t<br/>exact till the supply → rewardPerToken<br/>calculations have run
              </Typography>
            }

            {windowWidth <= 1005 &&
              <Typography className={[classes.disclaimer, classes[`disclaimer--${appTheme}`]].join(' ')}>
                Rewards are an estimation that aren’t exact till the supply → rewardPerToken calculations have run
              </Typography>
            }
          </div>

          {renderTokenSelect(token, vestNFTs)}
        </div>
      </div>

      <RewardsTable rewards={rewards} vestNFTs={vestNFTs} tokenID={token?.id}/>
    </>
  );
}
