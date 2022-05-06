import React, { useEffect, useState } from 'react';
// import Form from '../../ui/Form';
import Setup from '../../components/migrate/setup';
import classes from './migrate.module.css';
import { Button, Paper, Typography } from '@mui/material';
import Unlock from '../../components/unlock';
import stores from '../../stores';
import { useRouter } from 'next/router';
import { ACTIONS } from '../../stores/constants';
import { useAppThemeContext } from '../../ui/AppThemeProvider';

export default function Migrate() {
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
      <div className={classes.ffContainer}>
      <div className={classes.newSwapContainer}>
        <Setup/>
        </div>
        </div>
        :
        <Paper className={classes.notConnectedContent}>
          <div className={classes.contentFloat}>
            <Typography className={classes.contentFloatText}>
              Migrate
            </Typography>

            <div className={classes.mainDescBg}>
              <Typography className={classes.mainDescNC} variant="body2">
                Migrate your LP tokens.
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
