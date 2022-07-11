import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  Paper,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  InputBase,
} from "@mui/material";
import classes from "./ssVest.module.css";
import { formatCurrency } from "../../utils";

import { ArrowBackIosNew } from "@mui/icons-material";
import VestingInfo from "./vestingInfo";
import stores from "../../stores";
import { ACTIONS } from "../../stores/constants";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import Form from "../../ui/MigratorForm";
import SwapIconBg from "../../ui/SwapIconBg";

export default function Unlock({ nft, govToken, veToken }) {
  const router = useRouter();

  const [lockLoading, setLockLoading] = useState(false);

  useEffect(() => {
    const lockReturned = () => {
      setLockLoading(false);
      router.push("/vest");
    };
    const errorReturned = () => {
      setLockLoading(false);
    };

    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    stores.emitter.on(ACTIONS.WITHDRAW_VEST_RETURNED, lockReturned);
    return () => {
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
      stores.emitter.removeListener(
        ACTIONS.WITHDRAW_VEST_RETURNED,
        lockReturned
      );
    };

    window.addEventListener("resize", () => {
      setWindowWidth(window.innerWidth);
    });
  }, []);

  const onWithdraw = () => {
    setLockLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.WITHDRAW_VEST,
      content: { tokenID: nft.id },
    });
  };

  const onBack = () => {
    router.push("/vest");
  };

  const { appTheme } = useAppThemeContext();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const renderMassiveInput = (token) => {
    return (
      <div className={classes.textField}>
        <div className={`${classes.massiveInputContainer} ${classes.error}`}>
          <div className={classes.inputRow}>
            <div className={classes.inputColumn}>
              <Typography className={classes.inputTitleText} noWrap>Lock</Typography>

              <div className={classes.massiveInputAssetSelect}>
                <div className={classes.displaySelectContainer}>
                  <div className={classes.displayDualIconContainer}>
                    {token && token.logoURI && (
                      <img
                        className={classes.displayAssetIcon}
                        alt=""
                        src={token.logoURI}
                        width="60px"
                        height="60px"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                        }}
                      />
                    )}
                    {!(token && token.logoURI) && (
                      <img
                        className={classes.displayAssetIcon}
                        alt=""
                        src={`/tokens/unknown-logo--${appTheme}.svg`}
                        width="60px"
                        height="60px"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                        }}
                     />
                    )}

                    <Typography className={classes.smallerText}>
                      {token?.symbol}
                    </Typography>
                  </div>
                </div>
              </div>
            </div>

            <div className={classes.inputColumn}>
              <Typography className={classes.inputBalanceText} noWrap>
                Balance:{" "}
                {token && token.balance ? " " + formatCurrency(token.balance) : ""}
              </Typography>

              <InputBase
                className={classes.massiveInputAmount}
                placeholder="0.00"
                value={parseInt(nft.lockAmount).toFixed(2)}
                disabled={true}
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
  };

  return (
    <Paper
      elevation={0}
      className={[classes.container3, classes["g-flex-column"]].join(" ")}
    >
      <p className={classes.pageTitle}>
        <div className={classes.titleSection}>
          <Tooltip title="Manage Existing Lock" placement="top">
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

      <Form>
        <div className={classes.reAddPadding3}>
          {renderMassiveInput(govToken)}

          <VestingInfo currentNFT={nft} veToken={veToken} />

          <Typography className={[classes.info, classes.infoWarning].join(" ")} color="textSecondary">
            <img src="/images/ui/info-circle-yellow.svg" />
            <span>Your lock has expired. Please withdraw your lock before you can re-lock.</span>
          </Typography>
        </div>
      </Form>

      <div className={classes.actionsContainer}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          color="primary"
          disabled={lockLoading}
          onClick={onWithdraw}
          className={classes.buttonOverride}
        >
          <Typography className={classes.actionButtonText}>
            {lockLoading ? `Withrawing` : `Withdraw`}
          </Typography>

          {lockLoading && (
            <CircularProgress size={10} className={classes.loadingCircle} />
          )}
        </Button>
      </div>
    </Paper>
  );
}
