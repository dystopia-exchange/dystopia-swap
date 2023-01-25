import { Paper, Typography } from "@mui/material";
import React, { useEffect, useState } from 'react';
import Gauges from '../../components/ssVotes';
import Unlock from '../../components/unlock';
import classes from './vote.module.css';

import { WalletConnect } from '../../components/WalletConnect';
import stores from '../../stores';
import { ACTIONS } from '../../stores/constants';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import BtnEnterApp from '../../ui/BtnEnterApp';

function Vote({ changeTheme }) {
  const accountStore = stores.accountStore.getStore('account');
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

    const disconnectWallet = () => {
      setAccount(null)
    }

    stores.emitter.on(ACTIONS.ACCOUNT_CONFIGURED, accountConfigure);
    stores.emitter.on(ACTIONS.CONNECT_WALLET, connectWallet);
    stores.emitter.on(ACTIONS.DISCONNECT_WALLET, disconnectWallet);
    return () => {
      stores.emitter.removeListener(ACTIONS.ACCOUNT_CONFIGURED, accountConfigure);
      stores.emitter.removeListener(ACTIONS.CONNECT_WALLET, connectWallet);
      stores.emitter.removeListener(ACTIONS.DISCONNECT_WALLET, disconnectWallet);
    };
  }, []);

  const onAddressClicked = () => {
    setUnlockOpen(true);
  };

  const closeUnlock = () => {
    setUnlockOpen(false);
  };

  const {appTheme} = useAppThemeContext();

  const [isHoverState, setIsHoverState] = useState(false);
  const [isClickState, setIsClickState] = useState(false);
  const [btnColor, setBtnColor] = useState(appTheme === 'dark' ? '#33284C' : '#D2D0F2');

  const btnDefaultColor = () => {
    setIsHoverState(false);
    setIsClickState(false);
  };

  const btnHoverColor = () => {
    setIsHoverState(true);
  };

  const btnClickColor = () => {
    setIsClickState(true);
  };

  const getBtnColor = () => {
    switch (appTheme) {
      case 'dark':
        return isClickState ? '#523880' : (isHoverState ? '#402E61' : '#33284C');

      case 'light':
      default:
        return isClickState ? '#B9A4EE' : (isHoverState ? '#C6BAF0' : '#D2D0F2');
    }
  };

  return (
    <>
      {account && account.address ?
        <Gauges />
        :
        <Paper className={classes.notConnectedContent}>
          <div className={classes.contentFloat}>
            <Typography className={classes.contentFloatText}>
              Vote
            </Typography>

            <div className={[classes.mainDescBg, classes[`mainDescBg--${appTheme}`]].join(' ')}>
              <Typography className={[classes.mainDescNC, classes[`mainDescNC--${appTheme}`]].join(' ')} variant="body2">
                Use your veDYST to vote for your selected liquidity pair’s rewards distribution or create a bribe to encourage others to do the same.
              </Typography>
            </div>
            <WalletConnect>
              {({ connect }) => {
                return (
                  <div
                   className={[classes.buttonConnect, classes[`buttonConnect--${appTheme}`]].join(' ')}
                   onMouseOver={btnHoverColor}
                   onMouseOut={btnDefaultColor}
                   onMouseDown={btnClickColor}
                   onClick={connect}>
                     <BtnEnterApp
                       labelClassName={classes.buttonEnterLabel}
                       label={`Connect wallet\nto continue`}
                       btnColor={getBtnColor}
                     />
                  </div>
                )
              }}
            </WalletConnect>
          </div>
        </Paper>
       }
       {unlockOpen && <Unlock modalOpen={unlockOpen} closeModal={closeUnlock} />}
    </>
  );
}

export default Vote;
