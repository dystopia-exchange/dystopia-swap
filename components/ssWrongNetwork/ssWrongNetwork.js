import { Dialog, Typography } from "@mui/material";
import classes from "./ssWrongNetwork.module.css";
import { useAppThemeContext } from "../../ui/AppThemeProvider";

export const WrongNetwork = (props) => {
  const { visible, onClose, onSwitch } = props;

  const navigateToMedium = () => {
    window.open("https://medium.com/@DystopiaSwap", "_blank");
  };

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
            The chain you are connected is not supported!
          </Typography>

          <Typography className={classes.paragraph}>
            Please check that your wallet is connected to BSC Network, only
            after you can proceed. If you do not have a BSC Network in your
            wallet, you can add it through the link "Add-To-Metamask" on the
            https://chainlist.org/chain/56.
          </Typography>

          <div className={classes.buttonsContainer}>
            <a className={classes.primaryButton} href="https://chainlist.org/chain/56" target="_blank" rel="noreferrer">
              <Typography className={classes.buttonTextPrimary}>
                Add BSC Mainnet
              </Typography>
              <img src="/images/ui/explorer.svg" width="20px" />
            </a>

            <div className={classes.secondaryButton} onClick={onSwitch}>
              {/* <div className={classes.secondaryButton} onClick={action2 ? action2 : navigateToMedium}> */}
              <Typography className={classes.buttonTextSecondary}>
                Switch to BSC Mainnet
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
