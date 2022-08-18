import React, { useState, useEffect, useCallback } from 'react';
import { Typography } from '@mui/material';
import classes from './ssRewards.module.css';
import RewardsTable from './ssRewardsTable.js';
import { Add } from '@mui/icons-material';
import stores from '../../stores';
import { ACTIONS } from '../../stores/constants';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import TokenSelect from '../select-token/select-token'

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

      if (nfts?.length > 0) {
       nfts.sort((a, b) => (+a.id) - (+b.id));

       setToken(nfts[0]);

       // if (!token) {
       //   window.setTimeout(() => {
       //    stores.dispatcher.dispatch({type: ACTIONS.GET_REWARD_BALANCES, content: {tokenID: nfts[0].id}});
       //  });
       // }
     // else {
        window.setTimeout(() => {
          stores.dispatcher.dispatch({type: ACTIONS.GET_REWARD_BALANCES, content: {tokenID: nfts[0].id}});
        });
      // }
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

  return (
    <>
      <div
        className={[classes.toolbarContainer, 'g-flex', 'g-flex--align-baseline', 'g-flex--space-between'].join(' ')}
      >
          <div className={classes.pageTitle}>
              Rewards
          </div>

          <div className={classes.nftSelect}>
              {TokenSelect({
                  value: token,
                  options: vestNFTs,
                  symbol: veToken?.symbol,
                  handleChange,
                  placeholder: 'Select veCONE NFT',
              })}
          </div>
          <div
              className={[classes.addButton, classes[`addButton--${appTheme}`], 'g-flex', 'g-flex--align-center', 'g-flex--justify-center'].join(' ')}
              onClick={onClaimAll}
          >
              <Typography
                  className={[classes.actionButtonText, classes[`actionButtonText--${appTheme}`], 'g-flex', 'g-flex--align-center', 'g-flex--justify-center'].join(' ')}>
                  Claim All
              </Typography>
          </div>

        <div className={[classes.disclaimerContainerWrapper, 'g-flex', 'g-flex--align-baseline'].join(' ')}>
          <div
            className={classes.disclaimerContainer}
            style={{
              position: 'relative',
            }}>

            {windowWidth > 1100 &&
              <Typography className={[classes.disclaimer, classes[`disclaimer--${appTheme}`]].join(' ')}>
                  <span style={{maxWidth: 550,}}>
 Rewards and Bribes will be distributed to the corresponding gauges after the weekly snapshot.
                  </span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.19 0H5.81C2.17 0 0 2.17 0 5.81V14.18C0 17.83 2.17 20 5.81 20H14.18C17.82 20 19.99 17.83 19.99 14.19V5.81C20 2.17 17.83 0 14.19 0ZM15.25 10.33C15.25 10.74 14.91 11.08 14.5 11.08C14.09 11.08 13.75 10.74 13.75 10.33V7.31L6.03 15.03C5.88 15.18 5.69 15.25 5.5 15.25C5.31 15.25 5.12 15.18 4.97 15.03C4.68 14.74 4.68 14.26 4.97 13.97L12.69 6.25H9.67C9.26 6.25 8.92 5.91 8.92 5.5C8.92 5.09 9.26 4.75 9.67 4.75H14.5C14.91 4.75 15.25 5.09 15.25 5.5V10.33Z" fill="#779BF4"/>
                  </svg>
              </Typography>
            }

            {/*{windowWidth <= 1100 && windowWidth > 1005 &&
              <Typography className={[classes.disclaimer, classes[`disclaimer--${appTheme}`]].join(' ')}>
                Rewards are an estimation that aren’t<br/>exact till the supply → rewardPerToken<br/>calculations have run
              </Typography>
            }

            {windowWidth <= 1005 &&
              <Typography className={[classes.disclaimer, classes[`disclaimer--${appTheme}`]].join(' ')}>
                Rewards are an estimation that aren’t exact till the supply → rewardPerToken calculations have run
              </Typography>
            }*/}
          </div>
        </div>
      </div>

        <div className={classes.tableWrapper}>
            <RewardsTable rewards={rewards} vestNFTs={vestNFTs} tokenID={token?.id}/>
        </div>
    </>
  );
}
