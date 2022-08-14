import React, { Component, useState, useEffect } from "react";
import { Typography, Button, CircularProgress, Tooltip } from "@mui/material";
import classes from "./transactionQueue.module.css";

import { ACTIONS, ETHERSCAN_URL } from "../../stores/constants";
import { formatAddress } from "../../utils";
import {
  HourglassEmpty,
  HourglassFull,
  CheckCircle,
  Error,
  Pause,
} from "@mui/icons-material";
import { useAppThemeContext } from "../../ui/AppThemeProvider";

export default function Transaction({ transaction }) {
  const [expanded, setExpanded] = useState(false);
  const { appTheme } = useAppThemeContext();

  const successIcon = () => {
    return (
      <svg
        width="30"
        height="31"
        viewBox="0 0 30 31"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M15 28C8.09625 28 2.5 22.4037 2.5 15.5C2.5 8.59625 8.09625 3 15 3C21.9037 3 27.5 8.59625 27.5 15.5C27.5 22.4037 21.9037 28 15 28ZM13.7537 20.5L22.5912 11.6613L20.8237 9.89375L13.7537 16.965L10.2175 13.4288L8.45 15.1962L13.7537 20.5Z"
          fill="#15B525"
        />
      </svg>
    );
  };

  const mapStatusToIcon = (status) => {
    switch (status) {
      case "WAITING":
        return (
          <svg width="36" height="36" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.0005 8.5249C13.2371 8.5249 6.10547 15.6566 6.10547 24.4199C6.10547 33.1832 13.2371 40.3332 22.0005 40.3332C30.7638 40.3332 37.8955 33.2016 37.8955 24.4382C37.8955 15.6749 30.7638 8.5249 22.0005 8.5249ZM23.3755 23.8332C23.3755 24.5849 22.7521 25.2082 22.0005 25.2082C21.2488 25.2082 20.6255 24.5849 20.6255 23.8332V14.6666C20.6255 13.9149 21.2488 13.2916 22.0005 13.2916C22.7521 13.2916 23.3755 13.9149 23.3755 14.6666V23.8332Z" fill="#8191B9"/>
            <path d="M27.2985 6.32508H16.7018C15.9685 6.32508 15.3818 5.73841 15.3818 5.00508C15.3818 4.27175 15.9685 3.66675 16.7018 3.66675H27.2985C28.0318 3.66675 28.6185 4.25341 28.6185 4.98675C28.6185 5.72008 28.0318 6.32508 27.2985 6.32508Z" fill="#8191B9"/>
          </svg>
        );
      case "PENDING":
        return (
          <svg width="36" height="36" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.0005 8.5249C13.2371 8.5249 6.10547 15.6566 6.10547 24.4199C6.10547 33.1832 13.2371 40.3332 22.0005 40.3332C30.7638 40.3332 37.8955 33.2016 37.8955 24.4382C37.8955 15.6749 30.7638 8.5249 22.0005 8.5249ZM23.3755 23.8332C23.3755 24.5849 22.7521 25.2082 22.0005 25.2082C21.2488 25.2082 20.6255 24.5849 20.6255 23.8332V14.6666C20.6255 13.9149 21.2488 13.2916 22.0005 13.2916C22.7521 13.2916 23.3755 13.9149 23.3755 14.6666V23.8332Z" fill="#8191B9"/>
            <path d="M27.2985 6.32508H16.7018C15.9685 6.32508 15.3818 5.73841 15.3818 5.00508C15.3818 4.27175 15.9685 3.66675 16.7018 3.66675H27.2985C28.0318 3.66675 28.6185 4.25341 28.6185 4.98675C28.6185 5.72008 28.0318 6.32508 27.2985 6.32508Z" fill="#8191B9"/>
          </svg>
        );
      case "SUBMITTED":
        return (
          <svg width="36" height="36" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M31.882 28.7283L24.4754 22H19.507L12.1004 28.7283C10.0287 30.5983 9.35037 33.4767 10.3587 36.08C11.367 38.665 13.8237 40.3333 16.592 40.3333H27.3904C30.177 40.3333 32.6154 38.665 33.6237 36.08C34.632 33.4767 33.9537 30.5983 31.882 28.7283ZM25.337 33.2567H18.6637C17.967 33.2567 17.417 32.6883 17.417 32.01C17.417 31.3317 17.9854 30.7633 18.6637 30.7633H25.337C26.0337 30.7633 26.5837 31.3317 26.5837 32.01C26.5837 32.6883 26.0154 33.2567 25.337 33.2567Z" fill="#FDBF21"/>
            <path d="M33.6416 7.92008C32.6332 5.33508 30.1766 3.66675 27.4082 3.66675H16.5916C13.8232 3.66675 11.3666 5.33508 10.3582 7.92008C9.36822 10.5234 10.0466 13.4017 12.1182 15.2717L19.5249 22.0001H24.4932L31.8999 15.2717C33.9532 13.4017 34.6316 10.5234 33.6416 7.92008ZM25.3366 13.2551H18.6632C17.9666 13.2551 17.4166 12.6867 17.4166 12.0084C17.4166 11.3301 17.9849 10.7617 18.6632 10.7617H25.3366C26.0332 10.7617 26.5832 11.3301 26.5832 12.0084C26.5832 12.6867 26.0149 13.2551 25.3366 13.2551Z" fill="#FDBF21"/>
          </svg>
        );
      case "CONFIRMED":
        return (
          <svg width="36" height="36" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M26.682 0.666504H11.3187C4.64533 0.666504 0.666992 4.64484 0.666992 11.3182V26.6632C0.666992 33.3548 4.64533 37.3332 11.3187 37.3332H26.6637C33.337 37.3332 37.3153 33.3548 37.3153 26.6815V11.3182C37.3337 4.64484 33.3553 0.666504 26.682 0.666504ZM27.7637 14.7832L17.3687 25.1782C17.112 25.4348 16.7637 25.5815 16.397 25.5815C16.0303 25.5815 15.682 25.4348 15.4253 25.1782L10.237 19.9898C9.70533 19.4582 9.70533 18.5782 10.237 18.0465C10.7687 17.5148 11.6487 17.5148 12.1803 18.0465L16.397 22.2632L25.8203 12.8398C26.352 12.3082 27.232 12.3082 27.7637 12.8398C28.2953 13.3715 28.2953 14.2332 27.7637 14.7832Z" fill="#5EE852"/>
          </svg>
        );
      case "REJECTED":
        return (
          <svg width="36" height="36" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M29.682 3.66675H14.3187C7.64533 3.66675 3.66699 7.64508 3.66699 14.3184V29.6634C3.66699 36.3551 7.64533 40.3334 14.3187 40.3334H29.6637C36.337 40.3334 40.3153 36.3551 40.3153 29.6817V14.3184C40.3337 7.64508 36.3553 3.66675 29.682 3.66675ZM28.1603 26.2167C28.692 26.7484 28.692 27.6284 28.1603 28.1601C27.8853 28.4351 27.537 28.5634 27.1887 28.5634C26.8403 28.5634 26.492 28.4351 26.217 28.1601L22.0003 23.9434L17.7837 28.1601C17.5087 28.4351 17.1603 28.5634 16.812 28.5634C16.4637 28.5634 16.1153 28.4351 15.8403 28.1601C15.3087 27.6284 15.3087 26.7484 15.8403 26.2167L20.057 22.0001L15.8403 17.7834C15.3087 17.2517 15.3087 16.3717 15.8403 15.8401C16.372 15.3084 17.252 15.3084 17.7837 15.8401L22.0003 20.0567L26.217 15.8401C26.7487 15.3084 27.6287 15.3084 28.1603 15.8401C28.692 16.3717 28.692 17.2517 28.1603 17.7834L23.9437 22.0001L28.1603 26.2167Z" fill="#E93131"/>
          </svg>
        );
      case "DONE":
        return (
          <svg width="36" height="36" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M26.682 0.666504H11.3187C4.64533 0.666504 0.666992 4.64484 0.666992 11.3182V26.6632C0.666992 33.3548 4.64533 37.3332 11.3187 37.3332H26.6637C33.337 37.3332 37.3153 33.3548 37.3153 26.6815V11.3182C37.3337 4.64484 33.3553 0.666504 26.682 0.666504ZM27.7637 14.7832L17.3687 25.1782C17.112 25.4348 16.7637 25.5815 16.397 25.5815C16.0303 25.5815 15.682 25.4348 15.4253 25.1782L10.237 19.9898C9.70533 19.4582 9.70533 18.5782 10.237 18.0465C10.7687 17.5148 11.6487 17.5148 12.1803 18.0465L16.397 22.2632L25.8203 12.8398C26.352 12.3082 27.232 12.3082 27.7637 12.8398C28.2953 13.3715 28.2953 14.2332 27.7637 14.7832Z" fill="#5EE852"/>
          </svg>
        );
      default:
    }
  };

  const mapStatusToTootip = (status) => {
    switch (status) {
      case "WAITING":
        return "Transaction will be submitted once ready";
      case "PENDING":
        return "Transaction is pending your approval in your wallet";
      case "SUBMITTED":
        return "Transaction has been submitted to the blockchain and we are waiting on confirmation.";
      case "CONFIRMED":
        return "Transaction has been confirmed by the blockchain.";
      case "REJECTED":
        return "Transaction has been rejected.";
      default:
        return "";
    }
  };

  const onExpendTransaction = () => {
    setExpanded(!expanded);
  };

  const onViewTX = () => {
    window.open(`${ETHERSCAN_URL}tx/${transaction.txHash}`, "_blank");
  };

  return (
    <div className={classes.transaction} key={transaction.uuid}>
      {/* <div
        className={[
          classes.transactionTopBg,
          classes[`transactionTopBg--${transaction.status}`],
        ].join(" ")}
      ></div> */}

      <div
        className={[
          classes.transactionInfo,
          classes[`transactionInfo--${transaction.status}`],
        ].join(" ")}
        style={{
          display: "flex",
          padding: 24,
          // paddingRight: 0,
        }}
      >
        <div
          style={{
            marginRight: 14,
            // width: 80,
            // paddingRight: 10,
            // borderRight: "1px solid #86B9D6",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              // margin: "10px",
              // background: appTheme === "dark" ? "#2D3741" : "#CFE5F2",
              // borderRadius: "100px",
            }}
          >
            {mapStatusToIcon(transaction.status)}
          </div>
        </div>

        <div
          style={{
            width: "100%",
          }}
        >
          <Typography
            className={[
              classes.transactionDescriptionTitle,
              classes[`transactionDescriptionTitle--${transaction.status}`],
            ].join(" ")}
          >
            {transaction.description}
          </Typography>

          {['WAITING', 'PENDING', 'SUBMITTED'].includes(transaction.status) && (
            <div
              className={[
                classes.transactionStatusText,
                classes[`transactionStatusText--${transaction.status}`],
              ].join(" ")}
            >
              {transaction.status}...
            </div>
          )}
          

          {transaction.txHash && (
            <div className={classes.transactionHashWrapper}>
              <div className={classes.transactionHash}>
                <Typography className={classes.transactionDescription}>
                  {formatAddress(transaction.txHash, "long")}
                </Typography>
              </div>

              <div
                style={{
                  // marginTop: 10,
                  // textAlign: "right",
                  // fontWeight: 500,
                  // fontSize: 12,
                  // lineHeight: "120%",
                  // color: appTheme === "dark" ? "#4CADE6" : "#0B5E8E",
                  // cursor: "pointer",
                }}
                onClick={onViewTX}
                >
                <img src="/images/ui/explorer.svg" />
                {/* View in Explorer */}
              </div>
            </div>
          )}

          {transaction.error && (
            <Typography className={classes.transactionDescription}>
              {transaction.error}
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
}
