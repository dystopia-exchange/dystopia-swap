import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Paper,
  Typography,
  IconButton,
  Tooltip,
  InputBase,
  Button,
} from "@mui/material";
import classes from "./ssVest.module.css";
import moment from "moment";
import BigNumber from "bignumber.js";
import { ArrowBackIosNew } from "@mui/icons-material";
import { formatCurrency, formatInputAmount } from "../../utils";
import VestingInfo from "./vestingInfo";
import { useAppThemeContext } from "../../ui/AppThemeProvider";

export function WithdrawLock({ nft, govToken, veToken }) {
  const [futureNFT, setFutureNFT] = useState(null);
  const [lockLoading, setLockLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState(false);

  const router = useRouter();

  const onBack = () => {
    router.push("/vest");
  };

  const updateLockAmount = (amount) => {
    if (amount === "") {
      let tmpNFT = {
        lockAmount: nft.lockAmount,
        lockValue: nft.lockValue,
        lockEnds: nft.lockEnds,
      };

      setFutureNFT(tmpNFT);
      return;
    }

    let tmpNFT = {
      lockAmount: nft.lockAmount,
      lockValue: nft.lockValue,
      lockEnds: nft.lockEnds,
    };

    const now = moment();
    const expiry = moment.unix(tmpNFT.lockEnds);
    const dayToExpire = expiry.diff(now, "days");

    tmpNFT.lockAmount = BigNumber(nft.lockAmount).plus(amount).toFixed(18);
    tmpNFT.lockValue = BigNumber(tmpNFT.lockAmount)
      .times(parseInt(dayToExpire) + 1)
      .div(1460)
      .toFixed(18);

    setFutureNFT(tmpNFT);
  }

  const setAmountPercent = (percent) => {
    const val = BigNumber(govToken.balance)
      .times(percent)
      .div(100)
      .toFixed(govToken.decimals);
    setAmount(val);
    updateLockAmount(val);
  };

  const amountChanged = (event) => {
    const value = formatInputAmount(event.target.value.replace(",", "."));
    setAmount(value);
    updateLockAmount(value);
  };

  const { appTheme } = useAppThemeContext();

  function LockAmount({ govToken }) {
    return (
      <div className={classes.textField}>
        <div className={`${classes.massiveInputContainer} ${amountError && classes.error}`}>
          <div className={classes.inputRow}>
            <div className={classes.inputColumn}>
              <Typography className={classes.inputTitleText} noWrap>
                Lock
              </Typography>

              <div className={classes.massiveInputAssetSelect}>
                <div className={classes.displaySelectContainer}>
                  <div className={classes.displayDualIconContainer}>
                    {govToken?.logoURI && (
                      <img
                        className={classes.displayAssetIcon}
                        alt=""
                        src={govToken?.logoURI}
                        height="100px"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                        }}
                      />
                    )}
                    {!govToken?.logoURI && (
                      <img
                        className={classes.displayAssetIcon}
                        alt=""
                        src={`/tokens/unknown-logo--${appTheme}.svg`}
                        height="100px"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                        }}
                      />
                    )}

                    <Typography
                      className={[
                        classes.smallerText,
                        classes[`smallerText--${appTheme}`],
                      ].join(" ")}
                    >
                      {govToken?.symbol}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>

            <div className={classes.inputColumn}>
              <Typography
                className={classes.inputBalanceText}
                noWrap
                onClick={() => {
                  setAmountPercent(100);
                }}
              >
                Balance:{" "}
                {govToken?.balance
                  ? " " + formatCurrency(govToken?.balance)
                  : ""}
              </Typography>

              <InputBase
                className={classes.massiveInputAmount}
                placeholder="0.00"
                autoFocus={true}
                error={amountError}
                helperText={amountError}
                value={amount}
                onChange={amountChanged}
                disabled={lockLoading}
                inputProps={{
                  className: classes.largeInput,
                }}
                InputProps={{
                  disableUnderline: true,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Paper
      elevation={0}
      className={[classes.container3, classes["g-flex-column"]].join(" ")}
    >
      <p className={classes.pageTitle}>
        <div className={classes.titleSection}>
          <Tooltip title="Back to Vest" placement="top">
            <IconButton onClick={onBack}>
              <div className={classes.backIconWrap}>
                <ArrowBackIosNew className={classes.backIcon} />
              </div>
            </IconButton>
          </Tooltip>
          <p>Back to Vest</p>
        </div>

        <span>Withdraw Lock</span>
      </p>

      <div className={classes.reAddPadding3}>
        <LockAmount govToken={govToken} />

        <Typography className={[classes.info, classes.infoWarning].join(" ")} color="textSecondary">
          <img src="/images/ui/info-circle-yellow.svg" />
          <span>veCONE NFT #1234 has expired, to continue receiving boosted rewards you must unstake the expired veCONE NFT from your LP and stake one that is currently locked.</span>
        </Typography>

        <Typography className={[classes.info, classes.infoError].join(" ")} color="textSecondary">
          <img src="/images/ui/info-circle-red.svg" />
          <span>Please reset votes connected with #1234 NFT before withdrawing!</span>
        </Typography>

        <VestingInfo
          currentNFT={nft}
          futureNFT={futureNFT}
          veToken={veToken}
          showVestingStructure={false}
        />
      </div>

      <Button
        className={classes.buttonOverride}
        fullWidth
        variant="contained"
        size="large"
        color="primary"
      >
        <Typography className={classes.actionButtonText}>Reset Votes for #1234 NFT</Typography>
      </Button>

      <Button
        className={[classes.buttonOverride, classes.buttonOverrideDisabled].join(" ")}
        fullWidth
        variant="contained"
        size="large"
        color="primary"
        disabled={true}
      >
        <Typography className={classes.actionButtonText}>Withdraw CONE</Typography>
      </Button>
    </Paper>
  );
}
