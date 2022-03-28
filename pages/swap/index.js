import { Typography, Button, Paper } from "@mui/material";
import SwapComponent from '../../components/ssSwap';

import React, { useState, useEffect } from 'react';
import { ACTIONS } from '../../stores/constants';
import stores from '../../stores';
import Unlock from '../../components/unlock';

import classes from './swap.module.css';
import { useAppThemeContext } from '../../ui/AppThemeProvider';

function Swap({changeTheme}) {

  const [account, setAccount] = useState(stores.accountStore.getStore('account'));
  const [unlockOpen, setUnlockOpen] = useState(false);

  useEffect(() => {
    const accountConfigure = () => {
      setAccount(stores.accountStore.getStore('account'));
      closeUnlock();
    };
    const connectWallet = () => {
      onAddressClicked();
    };

    stores.emitter.on(ACTIONS.ACCOUNT_CONFIGURED, accountConfigure);
    stores.emitter.on(ACTIONS.CONNECT_WALLET, connectWallet);
    return () => {
      stores.emitter.removeListener(ACTIONS.ACCOUNT_CONFIGURED, accountConfigure);
      stores.emitter.removeListener(ACTIONS.CONNECT_WALLET, connectWallet);
    };
  }, []);

  const onAddressClicked = () => {
    setUnlockOpen(true);
  };

  const closeUnlock = () => {
    setUnlockOpen(false);
  };

  const {appTheme} = useAppThemeContext();

  return (
    <div className={classes.ffContainer}>
      {account && account.address ?
        <SwapComponent/>
        :
        <Paper className={classes.notConnectedContent}>
          <div className={classes.contentFloat}>
            <img
              alt=""
              src={'/images/ui/swap-text.svg'}
              width="207px"
              height="66px"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/tokens/unknown-logo.png";
              }}
            />

            <div className={classes.mainDescBg}>
              <Typography className={classes.mainDescNC} variant="body2">
                Swap between Dystopia supported stable and volatile assets.
              </Typography>
            </div>

            <Button
              disableElevation
              className={[classes.buttonConnect, classes[`buttonConnect--${appTheme}`]].join(' ')}
              variant="contained"
              onClick={onAddressClicked}>
              {account && account.address && <div className={`${classes.accountIcon} ${classes.metamask}`}></div>}
            </Button>
          </div>
        </Paper>
      }
      {unlockOpen && <Unlock modalOpen={unlockOpen} closeModal={closeUnlock}/>}
    </div>
  );
}

export default Swap;
