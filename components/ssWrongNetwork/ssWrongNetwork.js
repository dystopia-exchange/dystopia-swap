import { Dialog, Typography } from "@mui/material";
import classes from "./ssWrongNetwork.module.css";
import { useAppThemeContext } from "../../ui/AppThemeProvider";

export const WrongNetwork = (props) => {
  const { visible, onClose, onSwitch } = props;

  const { appTheme } = useAppThemeContext();

  return (
    <Dialog
      fullScreen
      open={visible}
      onClose={onClose}
      onClick={(e) => {
        if (e.target.classList.contains("MuiDialog-container")) {
          onClose();
        }
      }}
      className={classes.dialogWrapper}
      classes={{
        paper: classes.paperBody,
      }}
    >
      <div className={classes.dialogContainer}>
        <div className={classes.warningContainer}>
          <div
            className={classes.header}
            style={{ display: "flex", alignItems: "center" }}
          >
            <img
              src="/images/icon-warning.svg"
              className={classes.warningIcon}
            />

            <Typography className={classes.title1}>WRONG NETWORK</Typography>
          </div>

          <Typography className={classes.title2}>
            The chain you are connected to is not supported!
          </Typography>

          <Typography className={classes.paragraph}>
            Please check that your wallet is connected to BSC Network, only
            after you can proceed. If you do not have a BSC Network in your
            wallet, you can add it through the footer link.
          </Typography>

          <div className={classes.buttonsContainer}>
            <a className={classes.primaryButton} href="https://chainlist.org/chain/56" target="_blank" rel="noreferrer">
              <Typography className={classes.buttonTextPrimary}>
                ADD BSC MAINNET
              </Typography>
              <img src="/images/ui/explorer.svg" width="20px" />
            </a>

            <div className={classes.secondaryButton} onClick={onSwitch}>
              {/* <div className={classes.secondaryButton} onClick={action2 ? action2 : navigateToMedium}> */}
              <Typography className={classes.buttonTextSecondary}>
                SWITCH TO BSC MAINNET
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
