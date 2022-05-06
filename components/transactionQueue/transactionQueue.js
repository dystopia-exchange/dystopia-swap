import React, { useState, useEffect } from "react";
import { Typography, DialogContent, Dialog, Slide, IconButton, DialogTitle } from "@mui/material";
import { OpenInNew, Close } from '@mui/icons-material';

import Lottie from "lottie-react";
import successAnim from "../../public/lottiefiles/successAnim.json";
import swapSuccessAnim from "../../public/lottiefiles/swapSuccess.json";
import lockSuccessAnim from "../../public/lottiefiles/lockSuccess.json";
import pairSuccessAnim from "../../public/lottiefiles/pairSuccess.json";

import Transaction from './transaction';

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

import classes from './transactionQueue.module.css';
import stores from '../../stores';
import { ACTIONS, ETHERSCAN_URL } from '../../stores/constants';
import { useAppThemeContext } from '../../ui/AppThemeProvider';

export default function TransactionQueue({setQueueLength}) {

  const [open, setOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [purpose, setPurpose] = useState(null);
  const [type, setType] = useState(null);
  const [action, setAction] = useState(null);
  const {appTheme} = useAppThemeContext();

  const handleClose = () => {
    setOpen(false);
  };

  const fullScreen = window.innerWidth < 576;

  useEffect(() => {
    const clearTransactions = () => {
      setTransactions([]);
      setQueueLength(0);
    };

    const openQueue = () => {
      setOpen(true);
    };

    const transactionAdded = (params) => {
      setPurpose(params.title);
      setType(params.type);
      setAction(params.verb);
      setOpen(true);
      const txs = [...params.transactions];
      setTransactions(txs);

      setQueueLength(params.transactions.length);
    };

    const transactionPending = (params) => {
      let txs = transactions.map((tx) => {
        if (tx.uuid === params.uuid) {
          tx.status = 'PENDING';
          tx.description = params.description ? params.description : tx.description;
        }
        return tx;
      });
      setTransactions(txs);
    };

    const transactionSubmitted = (params) => {
      let txs = transactions.map((tx) => {
        if (tx.uuid === params.uuid) {
          tx.status = 'SUBMITTED';
          tx.txHash = params.txHash;
          tx.description = params.description ? params.description : tx.description;
        }
        return tx;
      });
      setTransactions(txs);
    };

    const transactionConfirmed = (params) => {
      let txs = transactions.map((tx) => {
        if (tx.uuid === params.uuid) {
          tx.status = 'CONFIRMED';
          tx.txHash = params.txHash;
          tx.description = params.description ? params.description : tx.description;
        }
        return tx;
      });
      setTransactions(txs);
    };

    const transactionRejected = (params) => {
      let txs = transactions.map((tx) => {
        if (tx.uuid === params.uuid) {
          tx.status = 'REJECTED';
          tx.description = params.description ? params.description : tx.description;
          tx.error = params.error;
        }
        return tx;
      });
      setTransactions(txs);
    };

    const transactionStatus = (params) => {
      let txs = transactions.map((tx) => {
        if (tx.uuid === params.uuid) {
          tx.status = params.status ? params.status : tx.status;
          tx.description = params.description ? params.description : tx.description;
        }
        return tx;
      });
      setTransactions(txs);
    };

    stores.emitter.on(ACTIONS.CLEAR_TRANSACTION_QUEUE, clearTransactions);
    stores.emitter.on(ACTIONS.TX_ADDED, transactionAdded);
    stores.emitter.on(ACTIONS.TX_PENDING, transactionPending);
    stores.emitter.on(ACTIONS.TX_SUBMITTED, transactionSubmitted);
    stores.emitter.on(ACTIONS.TX_CONFIRMED, transactionConfirmed);
    stores.emitter.on(ACTIONS.TX_REJECTED, transactionRejected);
    stores.emitter.on(ACTIONS.TX_STATUS, transactionStatus);
    stores.emitter.on(ACTIONS.TX_OPEN, openQueue);

    return () => {
      stores.emitter.removeListener(ACTIONS.CLEAR_TRANSACTION_QUEUE, clearTransactions);
      stores.emitter.removeListener(ACTIONS.TX_ADDED, transactionAdded);
      stores.emitter.removeListener(ACTIONS.TX_PENDING, transactionPending);
      stores.emitter.removeListener(ACTIONS.TX_SUBMITTED, transactionSubmitted);
      stores.emitter.removeListener(ACTIONS.TX_CONFIRMED, transactionConfirmed);
      stores.emitter.removeListener(ACTIONS.TX_REJECTED, transactionRejected);
      stores.emitter.removeListener(ACTIONS.TX_STATUS, transactionStatus);
      stores.emitter.removeListener(ACTIONS.TX_OPEN, openQueue);
    };
  }, [transactions]);

  const renderDone = (txs) => {
    if (!(transactions && transactions.filter((tx) => {
      return ['DONE', 'CONFIRMED'].includes(tx.status);
    })
      .map(it => ({...it, description: it.status === 'DONE' ? 'Transaction has been confirmed by the blockchain' : it.default}))
      .length === transactions.length)) {
      return null;
    }

    return (
      <div className={classes.transactionsContainer}>
        {
          transactions && transactions.map((tx) => {
            return <Transaction transaction={tx}/>;
          })
        }
      </div>
    );
  };

  const renderTransactions = (transactions) => {
    if ((transactions && transactions.filter((tx) => {
      return ['DONE', 'CONFIRMED'].includes(tx.status);
    }).length === transactions.length)) {
      return null;
    }

    return (
      <>
        <div className={classes.transactionsContainer}>
          {
            transactions && transactions.map((tx, idx) => {
              return <Transaction transaction={tx}/>;
            })
          }
        </div>
      </>
    );
  };

  return (
    <Dialog
      className={classes.dialogScale}
      classes={{
        root: classes.rootPaper,
        scrollPaper: classes.topScrollPaper,
        paper: appTheme === "dark" ? classes['paperBody--dark'] : classes['paperBody--light'],
      }}
      open={open}
      onClose={handleClose}
      onClick={(e) => {
        if (e.target.classList.contains('MuiDialog-container')) {
          handleClose();
        }
      }}
      fullWidth={true}
      maxWidth={"sm"}
      TransitionComponent={Transition}
      fullScreen={fullScreen}
      BackdropProps={{style: {backgroundColor: 'transparent'}}}
    >
      <DialogTitle
        className={classes.dialogTitle}
        style={{
          padding: '30px',
          fontWeight: 500,
          fontSize: 24,
          lineHeight: '120%',
          color: '#0A2C40',
          background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
        }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
          }}>
            Notification History
          </div>

          <Close
            style={{
              cursor: 'pointer',
              color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
            }}
            onClick={handleClose}/>
        </div>
      </DialogTitle>

      <DialogContent
        className={classes.dialogContent}
        style={{
          padding: '0 30px 30px',
          background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
        }}>
        {renderTransactions(transactions)}
        {renderDone(transactions)}
      </DialogContent>
    </Dialog>
  );
}
