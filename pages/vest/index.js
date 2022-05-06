import { Typography, Button, Paper, SvgIcon } from "@mui/material";
import VestsNFTs from '../../components/ssVests';

import React, { useState, useEffect } from 'react';
import { ACTIONS } from '../../stores/constants';

import stores from '../../stores';
import { useRouter } from "next/router";
import Unlock from '../../components/unlock';

import classes from './vest.module.css';
import { useAppThemeContext } from '../../ui/AppThemeProvider';

function Vesting({ changeTheme }) {

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
    <>
      {account && account.address ?
        <VestsNFTs />
        :
        <Paper className={classes.notConnectedContent}>
          <div className={classes.contentFloat}>
            <Typography className={classes.contentFloatText}>
              Vest
            </Typography>

            <div className={classes.mainDescBg}>
              <Typography className={classes.mainDescNC} variant="body2">
                Lock your DYST to earn rewards and governance rights. Each locked position is created and represented as an NFT, meaning you can hold multiple locked positions.
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
      {unlockOpen && <Unlock modalOpen={unlockOpen} closeModal={closeUnlock} />}
    </>
  );
}

export default Vesting;
