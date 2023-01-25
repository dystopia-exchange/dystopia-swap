import {
  Button,
  CircularProgress,
  IconButton, InputBase, Paper, Tooltip, Typography
} from "@mui/material";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { formatCurrency } from "../../utils";
import classes from "./ssVest.module.css";

import { ArrowBackIosNew } from "@mui/icons-material";
import stores from "../../stores";
import { ACTIONS } from "../../stores/constants";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import Form from "../../ui/MigratorForm";
import SwapIconBg from "../../ui/SwapIconBg";
import VestingInfo from "./vestingInfo";

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
      <div
        className={[classes.textField, classes[`textField--${appTheme}`]].join(
          " "
        )}
      >
        <Typography className={classes.inputTitleText} noWrap>
          LOCK
        </Typography>

        <Typography className={classes.inputBalanceText} noWrap>
          Balance:{" "}
          {token && token.balance ? " " + formatCurrency(token.balance) : ""}
        </Typography>

        <div className={`${classes.massiveInputContainer} ${classes.error}`}>
          <div className={classes.massiveInputAssetSelect}>
            <div className={classes.displaySelectContainer}>
              <div
                className={[
                  classes.displayDualIconContainer,
                  classes[`displayDualIconContainer--${appTheme}`],
                ].join(" ")}
              >
                <SwapIconBg />
                {token && token.logoURI && (
                  <img
                    className={classes.displayAssetIcon}
                    alt=""
                    src={token.logoURI}
                    height="100px"
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
                    height="100px"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                    }}
                  />
                )}
              </div>
            </div>
          </div>
          <InputBase
            className={classes.massiveInputAmount}
            placeholder="0.00"
            // error={amountError}
            // helperText={amountError}
            value={parseInt(nft.lockAmount).toFixed(2)}
            // onChange={amountChanged}
            disabled={true}
            inputProps={{
              className: [
                classes.largeInput,
                classes[`largeInput--${appTheme}`],
              ].join(" "),
            }}
            InputProps={{
              disableUnderline: true,
            }}
          />

          <Typography
            className={[
              classes.smallerText,
              classes[`smallerText--${appTheme}`],
            ].join(" ")}
          >
            {token?.symbol}
          </Typography>
        </div>
      </div>
    );
  };

  return (
    <Paper
      elevation={0}
      className={[
        classes.container3,
        classes[(`container3--${appTheme}`, "g-flex-column")],
      ].join(" ")}
    >
      {/*<div className={ classes.titleSection }>
        <IconButton className={ classes.backButton } onClick={ onBack }>
          <ArrowBack className={ classes.backIcon } />
        </IconButton>
        <Typography className={ classes.titleText }>Manage Existing Lock</Typography>
      </div>*/}

      <div
        className={[
          classes.titleSection,
          classes[`titleSection--${appTheme}`],
        ].join(" ")}
      >
        <Tooltip title="Manage Existing Lock" placement="top">
          <IconButton onClick={onBack}>
            <ArrowBackIosNew
              className={[
                classes.backIcon,
                classes[`backIcon--${appTheme}`],
              ].join(" ")}
            />
          </IconButton>
        </Tooltip>
      </div>

      <Form>
        {/* <div
          className={[
            classes.textField,
            classes[`textField--${appTheme}`],
          ].join(" ")}
        >
          <div className={classes.massiveInputContainer}>
            <div className={classes.massiveInputAssetSelect}>

            </div>
          </div>
        </div> */}
        {renderMassiveInput(govToken)}
        <VestingInfo currentNFT={nft} veToken={veToken} />
        {/* <div className={classes.contentBox}> */}
        <div
          className={[
            classes.disclaimerContainer,
            classes.disclaimerContainerWarning,
            classes[`disclaimerContainerWarning--${appTheme}`],
          ].join(" ")}
        >
          <Typography className={classes.para}>
            Your lock has expired. Please withdraw your lock before you can
            re-lock.
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
