import { Paper, Typography } from "@mui/material";
import classes from "./ssVest.module.css";
import moment from "moment";
import { formatCurrency } from "../../utils";
import BigNumber from "bignumber.js";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import Borders from "../../ui/Borders";

export default function VestingInfo({
  currentNFT,
  futureNFT,
  veToken,
  govToken,
  showVestingStructure,
}) {
  const { appTheme } = useAppThemeContext();

  return (
    <div className={classes.vestInfoContainer}>
      {showVestingStructure && (
        <div className={classes.seccondSection}>
          {/* 
          <Typography className={[classes.info, classes[`info--${appTheme}`]].join(' ')} color="textSecondary">
            1 {govToken?.symbol} locked for 4 years = 1.00 {veToken?.symbol}
          </Typography>
          <Typography className={[classes.info, classes[`info--${appTheme}`]].join(' ')} color="textSecondary">
            1 {govToken?.symbol} locked for 3 years = 0.75 {veToken?.symbol}</Typography>
          <Typography className={[classes.info, classes[`info--${appTheme}`]].join(' ')} color="textSecondary">
            1 {govToken?.symbol} locked for 2 years = 0.50 {veToken?.symbol}</Typography>
          */}
          <Typography
            className={[classes.info, classes[`info--${appTheme}`]].join(" ")}
            color="textSecondary"
          >
            <img src="/images/ui/info-circle-blue.svg" />
            <span>1 {govToken?.symbol} locked for 1 years = 0.25 {veToken?.symbol}</span>
          </Typography>
        </div>
      )}

      {currentNFT && (
        <>
          <div className={classes.vestInfo}>
            <div className={classes.vestInfoTextWrap}>
              <div className={classes.vestInfoText}>
                <Typography>Voting Power</Typography>

                <Typography className={classes.amount}>
                  >{formatCurrency(currentNFT?.lockValue)}{" "}
                  <span>{veToken?.symbol}</span>
                </Typography>
              </div>

              {currentNFT && futureNFT && <div className={classes.vestInfoTag}>now</div>}
            </div>

            <div className={classes.vestInfoTextWrap}>
              <div className={classes.vestInfoText}>
                <Typography>
                  {/* {formatCurrency(currentNFT.lockAmount)} {govToken?.symbol} locked */}
                  expires {moment.unix(currentNFT?.lockEnds).fromNow()} until {moment.unix(currentNFT?.lockEnds).format("YYYY/MM/DD")}
                </Typography>
              </div>
            </div>
          </div>
        </>
      )}
      {futureNFT && (
        <>
          <div className={classes.vestInfo}>
            <div className={classes.vestInfoTextWrap}>
              <div className={classes.vestInfoText}>
                <Typography>Voting Power</Typography>

                <Typography className={classes.amount}>
                  {formatCurrency(futureNFT?.lockValue)}{" "}
                  <span >{veToken?.symbol}</span>
                </Typography>
              </div>

              {currentNFT && futureNFT && <div className={classes.vestInfoTag}>will be</div>}
            </div>

            <div className={classes.vestInfoTextWrap}>
              <div className={classes.vestInfoText}>
                <Typography>
                  {/* {formatCurrency(futureNFT.lockAmount)} {govToken?.symbol} locked */}
                  expires {moment.unix(futureNFT?.lockEnds).fromNow()} until {moment.unix(futureNFT?.lockEnds).format("YYYY/MM/DD")}
                </Typography>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
