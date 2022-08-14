import React, { useState, useEffect } from 'react';
import { Typography, Paper } from "@mui/material";
import { ACTIONS } from '../../stores/constants';
import stores from '../../stores';
import classes from './notConnect.module.css';
import BtnEnterApp from '../../ui/BtnEnterApp';
import {WalletConnect} from "../WalletConnect";

export const NotConnect = (props) => {
  const { title, description, buttonText } = props;

  const [account, setAccount] = useState(stores.accountStore.getStore('account'));

  useEffect(() => {
    const accountConfigure = () => {
      setAccount(stores.accountStore.getStore('account'));
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


  return (
    <>
      {account && account.address ? (
        props.children
      ) : (
        <>
          <Paper className={classes.notConnectedContent}>
            <div className={classes.contentFloat}>
              <Typography className={classes.contentFloatText}>
                {title}
              </Typography>

              <p className={classes.title}>
                {description}
              </p>
              <WalletConnect>
                {({ connect }) => {
                  return (
                      <div className={classes.buttonConnect} onClick={connect}>
                        <BtnEnterApp
                            labelClassName={classes.buttonEnterLabel}
                            label={buttonText}
                        />
                      </div>
                  )}}
              </ WalletConnect>
            </div>
          </Paper>
        </>
      )}
    </>
  );
};
