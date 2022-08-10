import { Dialog, Typography, Button } from "@mui/material";
import classes from "./ssWarning.module.css";
import { useAppThemeContext } from '../../ui/AppThemeProvider';

export default function ffWarning({close, title, subTitle, icon, description, btnLabel1, btnLabel2, action2}) {
  const navigateToMedium = () => {
    // window.open("https://medium.com/@DystopiaSwap", "_blank");
    window.open("https://docs.cone.exchange/cone-swap/", "_blank");
  };

  const {appTheme} = useAppThemeContext();

  return (
    <Dialog
      fullScreen
      open={true}
      onClose={close}
      onClick={(e) => {
        if (e.target.classList.contains('MuiDialog-container')) {
          close()
        }
      }}
      className={classes.dialogWrapper}
      classes={{
        paper: classes.paperBody,
      }}>
      <div className={classes.dialogContainer}>
        <div className={classes.warningContainer}>
          <div className={classes.header}>
            <img src="/images/icon-warning.svg" className={classes.warningIcon} />

            <Typography className={classes.title1}>
              {title ? title : 'Cone Disclaimer:'}
            </Typography>
          </div>

          <Typography className={classes.title2}>
            {subTitle ? subTitle : 'Acknowledgement of Terms & Conditions of access'}
          </Typography>

          <Typography
            className={classes.paragraph}
            align="center">
            {description
              ? description
              : <>
                <p className={classes.paragraph1}>
                  Use of the Cone.exchange website, services, dapp, or application is subject to the following Terms & Conditions and hereby confirm that by proceeding and interacting with the protocoL I am aware of these and accept them in full:
                </p>
                <p>Cone.exchange is a smart contract protocol in alpha stage of launch, and even though multiple
                security audits have been completed on the smart contracts, I understand the risks associated with using the
                Cone protocol and associated functions.</p>
                <p>Any interactions that I have with the associated Cone protocol apps, smart contracts or any related
                functions MAY place my funds at risk, and hereby release the Cone protocol and its contributors,
                team members, and service providers from any and all liability with my use of the above-mentioned functions.</p>
                <p>I am lawfully permitted to access this site and use the cone.exchange application functions, and I
                am not in contravention of any laws governing my jurisdiction of residence or citizenship.</p>
              </>
            }
          </Typography>

          <div className={classes.buttonsContainer}>
            <div className={classes.primaryButton} onClick={action2 ? action2 : navigateToMedium}>
              <Typography
                className={classes.buttonTextPrimary}>
                {btnLabel2 ? btnLabel2 : 'LEARN MORE'}
              </Typography>
              <img src="/images/ui/explorer.svg" width="20px" />
            </div>

            <div className={classes.secondaryButton} onClick={close}>
              <Typography className={classes.buttonTextSecondary}>
                {btnLabel1 ? btnLabel1 : 'I UNDERSTAND THE RISKS INVOLVED, PROCEED TO THE APP'}
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
