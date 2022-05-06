import React, { Component, useState, useEffect } from "react";
import { Typography, Button, CircularProgress, Tooltip } from "@mui/material";
import classes from './transactionQueue.module.css';

import { ACTIONS, ETHERSCAN_URL } from '../../stores/constants';
import { formatAddress } from '../../utils';
import { HourglassEmpty, HourglassFull, CheckCircle, Error, Pause } from '@mui/icons-material';
import { useAppThemeContext } from '../../ui/AppThemeProvider';

export default function Transaction({transaction}) {
  const [expanded, setExpanded] = useState(false);
  const {appTheme} = useAppThemeContext();

  const successIcon = () => {
    return (
      <svg width="30" height="31" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M15 28C8.09625 28 2.5 22.4037 2.5 15.5C2.5 8.59625 8.09625 3 15 3C21.9037 3 27.5 8.59625 27.5 15.5C27.5 22.4037 21.9037 28 15 28ZM13.7537 20.5L22.5912 11.6613L20.8237 9.89375L13.7537 16.965L10.2175 13.4288L8.45 15.1962L13.7537 20.5Z"
          fill="#15B525"/>
      </svg>
    );
  };

  const mapStatusToIcon = (status) => {
    switch (status) {
      case 'WAITING':
        return (
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15 27.5C8.09625 27.5 2.5 21.9037 2.5 15C2.5 8.09625 8.09625 2.5 15 2.5C21.9037 2.5 27.5 8.09625 27.5 15C27.5 21.9037 21.9037 27.5 15 27.5ZM16.25 15V8.75H13.75V17.5H21.25V15H16.25Z"
              fill="#0B5E8E"/>
          </svg>
        );
      case 'PENDING':
        return (
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15 27.5C8.09625 27.5 2.5 21.9037 2.5 15C2.5 8.09625 8.09625 2.5 15 2.5C21.9037 2.5 27.5 8.09625 27.5 15C27.5 21.9037 21.9037 27.5 15 27.5ZM16.25 15V8.75H13.75V17.5H21.25V15H16.25Z"
              fill="#0B5E8E"/>
          </svg>
        );
      case 'SUBMITTED':
        return (
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15 2.5C15.3315 2.5 15.6495 2.6317 15.8839 2.86612C16.1183 3.10054 16.25 3.41848 16.25 3.75V7.5C16.25 7.83152 16.1183 8.14946 15.8839 8.38388C15.6495 8.6183 15.3315 8.75 15 8.75C14.6685 8.75 14.3505 8.6183 14.1161 8.38388C13.8817 8.14946 13.75 7.83152 13.75 7.5V3.75C13.75 3.41848 13.8817 3.10054 14.1161 2.86612C14.3505 2.6317 14.6685 2.5 15 2.5ZM15 21.25C15.3315 21.25 15.6495 21.3817 15.8839 21.6161C16.1183 21.8505 16.25 22.1685 16.25 22.5V26.25C16.25 26.5815 16.1183 26.8995 15.8839 27.1339C15.6495 27.3683 15.3315 27.5 15 27.5C14.6685 27.5 14.3505 27.3683 14.1161 27.1339C13.8817 26.8995 13.75 26.5815 13.75 26.25V22.5C13.75 22.1685 13.8817 21.8505 14.1161 21.6161C14.3505 21.3817 14.6685 21.25 15 21.25ZM27.5 15C27.5 15.3315 27.3683 15.6495 27.1339 15.8839C26.8995 16.1183 26.5815 16.25 26.25 16.25H22.5C22.1685 16.25 21.8505 16.1183 21.6161 15.8839C21.3817 15.6495 21.25 15.3315 21.25 15C21.25 14.6685 21.3817 14.3505 21.6161 14.1161C21.8505 13.8817 22.1685 13.75 22.5 13.75H26.25C26.5815 13.75 26.8995 13.8817 27.1339 14.1161C27.3683 14.3505 27.5 14.6685 27.5 15ZM8.75 15C8.75 15.3315 8.6183 15.6495 8.38388 15.8839C8.14946 16.1183 7.83152 16.25 7.5 16.25H3.75C3.41848 16.25 3.10054 16.1183 2.86612 15.8839C2.6317 15.6495 2.5 15.3315 2.5 15C2.5 14.6685 2.6317 14.3505 2.86612 14.1161C3.10054 13.8817 3.41848 13.75 3.75 13.75H7.5C7.83152 13.75 8.14946 13.8817 8.38388 14.1161C8.6183 14.3505 8.75 14.6685 8.75 15ZM23.8387 23.8387C23.6043 24.0731 23.2865 24.2047 22.955 24.2047C22.6235 24.2047 22.3057 24.0731 22.0712 23.8387L19.42 21.1875C19.1923 20.9517 19.0663 20.636 19.0692 20.3082C19.072 19.9805 19.2035 19.667 19.4352 19.4352C19.667 19.2035 19.9805 19.072 20.3082 19.0692C20.636 19.0663 20.9517 19.1923 21.1875 19.42L23.8387 22.07C23.955 22.1861 24.0472 22.324 24.1101 22.4757C24.173 22.6274 24.2054 22.7901 24.2054 22.9544C24.2054 23.1186 24.173 23.2813 24.1101 23.4331C24.0472 23.5848 23.955 23.7227 23.8387 23.8387ZM10.58 10.58C10.3456 10.8143 10.0277 10.946 9.69625 10.946C9.36479 10.946 9.04691 10.8143 8.8125 10.58L6.1625 7.93C5.92795 7.69561 5.79611 7.37766 5.796 7.04607C5.79588 6.71448 5.92749 6.39643 6.16188 6.16188C6.39626 5.92732 6.71422 5.79549 7.04581 5.79537C7.3774 5.79525 7.69545 5.92686 7.93 6.16125L10.58 8.8125C10.8143 9.04691 10.946 9.36479 10.946 9.69625C10.946 10.0277 10.8143 10.3456 10.58 10.58ZM6.1625 23.8387C5.92816 23.6043 5.79652 23.2865 5.79652 22.955C5.79652 22.6235 5.92816 22.3057 6.1625 22.0712L8.81375 19.42C8.92906 19.3006 9.06699 19.2054 9.21949 19.1399C9.372 19.0744 9.53602 19.0399 9.702 19.0384C9.86797 19.037 10.0326 19.0686 10.1862 19.1315C10.3398 19.1943 10.4794 19.2871 10.5967 19.4045C10.7141 19.5219 10.8069 19.6614 10.8698 19.8151C10.9326 19.9687 10.9643 20.1333 10.9628 20.2993C10.9614 20.4652 10.9269 20.6292 10.8614 20.7818C10.7959 20.9343 10.7006 21.0722 10.5813 21.1875L7.93125 23.8387C7.81516 23.955 7.6773 24.0472 7.52555 24.1101C7.3738 24.173 7.21114 24.2054 7.04688 24.2054C6.88261 24.2054 6.71995 24.173 6.5682 24.1101C6.41645 24.0472 6.27859 23.955 6.1625 23.8387ZM19.42 10.58C19.1857 10.3456 19.054 10.0277 19.054 9.69625C19.054 9.36479 19.1857 9.04691 19.42 8.8125L22.07 6.16125C22.3044 5.9267 22.6223 5.79486 22.9539 5.79475C23.2855 5.79463 23.6036 5.92624 23.8381 6.16063C24.0727 6.39501 24.2045 6.71297 24.2046 7.04456C24.2047 7.37615 24.0731 7.6942 23.8387 7.92875L21.1875 10.58C20.9531 10.8143 20.6352 10.946 20.3037 10.946C19.9723 10.946 19.6544 10.8143 19.42 10.58Z"
              fill="#F9A01A"/>
          </svg>
        );
      case 'CONFIRMED':
        return (
          <svg width="30" height="31" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15 28C8.09625 28 2.5 22.4037 2.5 15.5C2.5 8.59625 8.09625 3 15 3C21.9037 3 27.5 8.59625 27.5 15.5C27.5 22.4037 21.9037 28 15 28ZM13.7537 20.5L22.5912 11.6613L20.8237 9.89375L13.7537 16.965L10.2175 13.4288L8.45 15.1962L13.7537 20.5Z"
              fill="#15B525"/>
          </svg>
        );
      case 'REJECTED':
        return (
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20.2725 3.12503L27.3763 10.2275V20.2725L20.2725 27.3763H10.2275L3.12378 20.2725V10.2275L10.2275 3.12378H20.2725V3.12503ZM13.75 18.75V21.25H16.25V18.75H13.75ZM13.75 8.75003V16.25H16.25V8.75003H13.75Z"
              fill="#DB3434"/>
          </svg>
        );
      case 'DONE':
        return (
          <svg width="30" height="31" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15 28C8.09625 28 2.5 22.4037 2.5 15.5C2.5 8.59625 8.09625 3 15 3C21.9037 3 27.5 8.59625 27.5 15.5C27.5 22.4037 21.9037 28 15 28ZM13.7537 20.5L22.5912 11.6613L20.8237 9.89375L13.7537 16.965L10.2175 13.4288L8.45 15.1962L13.7537 20.5Z"
              fill="#15B525"/>
          </svg>
        );
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

  console.log(transaction);

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
            <div className={classes.transactionHash}>
              <Typography
                className={classes.transactionDescription}>
                {formatAddress(transaction.txHash, 'long')}
              </Typography>
            </div>
          }

          {transaction.txHash &&
            <div
              style={{
                marginTop: 10,
                textAlign: 'right',
                fontWeight: 500,
                fontSize: 12,
                lineHeight: '120%',
                color: appTheme === 'dark' ? '#4CADE6' : '#0B5E8E',
              }}
              onClick={onViewTX}>
              View in Explorer
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
