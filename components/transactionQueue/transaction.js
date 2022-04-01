import React, { Component, useState, useEffect } from "react";
import { Typography, Button, CircularProgress, Tooltip } from "@mui/material";
import classes from './transactionQueue.module.css';

import { ACTIONS, ETHERSCAN_URL } from '../../stores/constants';
import { formatAddress } from '../../utils';
import { HourglassEmpty, HourglassFull, CheckCircle, Error, Pause } from '@mui/icons-material';
import { useAppThemeContext } from '../../ui/AppThemeProvider';

export default function Transaction({transaction}) {
  const [expanded, setExpanded] = useState(false);
  const { appTheme } = useAppThemeContext();

  const mapStatusToIcon = (status) => {
    switch (status) {
      case 'WAITING':
        return <Pause className={classes.orangeIcon}/>;
      case 'PENDING':
        return <HourglassEmpty className={classes.greenIcon}/>;
      case 'SUBMITTED':
        return <HourglassFull className={classes.greenIcon}/>;
      case 'CONFIRMED':
        return <CheckCircle className={classes.greenIcon}/>;
      case 'REJECTED':
        return <Error className={classes.redIcon}/>;
      case 'DONE':
        return <CheckCircle className={classes.greenIcon}/>;
      default:
    }
  };

  const mapStatusToTootip = (status) => {
    switch (status) {
      case 'WAITING':
        return 'Transaction will be submitted once ready';
      case 'PENDING':
        return 'Transaction is pending your approval in your wallet';
      case 'SUBMITTED':
        return 'Transaction has been submitted to the blockchain and we are waiting on confirmation.';
      case 'CONFIRMED':
        return 'Transaction has been confirmed by the blockchain.';
      case 'REJECTED':
        return 'Transaction has been rejected.';
      default:
        return '';
    }
  };

  const onExpendTransaction = () => {
    setExpanded(!expanded);
  };

  const onViewTX = () => {
    window.open(`${ETHERSCAN_URL}tx/${transaction.txHash}`, '_blank');
  };

  return (
    <div className={classes.transaction} key={transaction.uuid}>
      <div className={[classes.transactionTopBg, classes[`transactionTopBg--${transaction.status}`]].join(' ')}>
      </div>

      <div
        className={[classes.transactionInfo, classes[`transactionInfo--${transaction.status}`]].join(' ')}
        style={{
          display: 'flex',
          padding: 20,
        }}>
        <div
          style={{
            width: 80,
            paddingRight: 10,
            borderRight: '1px solid #86B9D6',
          }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              margin: '10px',
              background: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
              borderRadius: '100px',
            }}>
            {mapStatusToIcon(transaction.status)}
          </div>

          <div
            className={[classes.transactionStatusText, classes[`transactionStatusText--${transaction.status}`]].join(' ')}>
            {transaction.status}
          </div>
        </div>

        <div
          style={{
            width: '100%',
          }}>
          <Typography
            className={[classes.transactionDescriptionTitle, classes[`transactionDescriptionTitle--${transaction.status}`]].join(' ')}>
            {transaction.description}
          </Typography>

          {transaction.txHash &&
            <div className={classes.transaactionHash}>
              <Typography className={classes.transactionDescription}>{formatAddress(transaction.txHash, 'long')}</Typography>

              <Button
                onClick={onViewTX}>
                View in Explorer
              </Button>
            </div>
          }

          {transaction.error &&
            <Typography className={classes.transactionDescription}>{transaction.error}</Typography>
          }
        </div>
      </div>
    </div>
  );
}
