import { Button, Grid, Paper, Typography } from "@mui/material";
import ClaimAll from '../../components/ffDashboardClaimAll';
import Overview from '../../components/ffDashboardOverview';
import VoteOverview from '../../components/ffDashboardVoteOverview';

import classes from './dashboard.module.css';

import { useRouter } from "next/router";
import React, { useEffect, useState } from 'react';
import Unlock from '../../components/unlock';
import stores from '../../stores';
import { ACTIONS } from '../../stores/constants';

const { CONNECT_WALLET, ACCOUNT_CONFIGURED } = ACTIONS

function Dashboard({ changeTheme }) {

  function handleNavigate(route) {
    router.push(route);
  }

  const accountStore = stores.accountStore.getStore('account');
  const router = useRouter();
  const [account, setAccount] = useState(accountStore);
  const [unlockOpen, setUnlockOpen] = useState(false);

  useEffect(() => {
    const accountConfigure = () => {
      const accountStore = stores.accountStore.getStore('account');
      setAccount(accountStore);
      closeUnlock();
    };
    const connectWallet = () => {
      onAddressClicked();
    };

    stores.emitter.on(ACCOUNT_CONFIGURED, accountConfigure);
    stores.emitter.on(CONNECT_WALLET, connectWallet);
    return () => {
      stores.emitter.removeListener(ACCOUNT_CONFIGURED, accountConfigure);
      stores.emitter.removeListener(CONNECT_WALLET, connectWallet);
    };
  }, []);

  const onAddressClicked = () => {
    setUnlockOpen(true);
  };

  const closeUnlock = () => {
    setUnlockOpen(false);
  };

  return (
    <div className={classes.ffContainer}>
      {account && account.address ?
        <>

        <div className={classes.connected}>
          <Grid container spacing={5} className={classes.contentGrid}>
            <Grid item lg={12} md={12} sm={12} xs={12}>
              <Grid container spacing={4}>
                <Grid item lg={3} md={6} sm={12} xs={12}>
                  <Typography className={classes.mainHeading} variant='h1'>Staking</Typography>
                  <Paper elevation={0} onClick={() => router.push('/liquidity')} className={classes.viewCollateral}>View</Paper>
                  <Overview />
                </Grid>

                <Grid item lg={3} md={6} sm={12} xs={12}>
                  <Typography className={classes.mainHeading} variant='h1'>Vesting</Typography>
                  <Paper elevation={0} onClick={() => router.push('/vest')} className={classes.viewVesting}>View</Paper>
                  <Overview />
                </Grid>

                <Grid item lg={3} md={6} sm={12} xs={12}>
                  <Typography className={classes.mainHeading} variant='h1'>Voting</Typography>
                  <Paper elevation={0} onClick={() => router.push('/vote')} className={classes.viewVoting}>View</Paper>
                  <VoteOverview />
                </Grid>

                <Grid item lg={3} md={6} sm={12} xs={12}>
                  <Typography className={classes.mainHeadingRewards} variant='h1'>Rewards</Typography>
                  <ClaimAll />
                </Grid>
              </Grid>
            </Grid>

          </Grid>

        </div>
        </>
         :
         <Paper className={classes.notConnectedContent}>
         <div className={classes.sphere}></div>
          <div className={classes.contentFloat}>
           <Typography className={classes.mainHeadingNC} variant='h1'>Dashboard</Typography>
           <Typography className={[classes.mainDescNC, classes[`mainDescNC--${appTheme}`]].join(' ')} variant='body2'>An overview Assets.</Typography>
           <Button
             disableElevation
             className={classes.buttonConnect}
             variant="contained"
             onClick={onAddressClicked}>
             {account && account.address && <div className={`${classes.accountIcon} ${classes.metamask}`}></div>}
             <Typography>Connect Wallet to Continue</Typography>
           </Button>
           </div>
         </Paper>
       }
       {unlockOpen && <Unlock modalOpen={unlockOpen} closeModal={closeUnlock} />}
    </div>
  );
}

export default Dashboard;
