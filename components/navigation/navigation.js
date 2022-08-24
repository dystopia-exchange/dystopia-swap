import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Typography, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { withTheme } from "@mui/styles";

import SSWarning from "../ssWarning";

import classes from "./navigation.module.css";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import stores from '../../stores';

function Navigation(props) {
  const router = useRouter();
  const { appTheme } = useAppThemeContext();

  const [hasWeb3Provider, setHasWeb3Provider] = useState(true);
  const [active, setActive] = useState("swap");

  function handleNavigate(route) {
    router.push(route);
  }

  const [warningOpen, setWarningOpen] = useState(false);

  useEffect(function () {
    const localStorageWarningAccepted = window.localStorage.getItem(
      "fixed.forex-warning-accepted"
    );
    setWarningOpen(
      localStorageWarningAccepted
        ? localStorageWarningAccepted !== "accepted"
        : true
    );
    stores.accountStore.isWeb3ProviderExist().then(data => {
      setHasWeb3Provider(data);
    });
  }, []);

  const openWarning = () => {
    setWarningOpen(true);
  };

  const closeWarning = () => {
    window.localStorage.setItem("fixed.forex-warning-accepted", "accepted");
    setWarningOpen(false);
  };

  const onActiveClick = (event, val) => {
    if (val || (!val && active)) {
      setActive(val || active);
      handleNavigate("/" + (val || active));
    }
  };

  const isShowWarningWeb3Provider = !hasWeb3Provider && !warningOpen && navigator?.maxTouchPoints > 0;

  const onRedirectToMetamaskGuide = () => {
    window.open('https://metamask.zendesk.com/hc/en-us/articles/360015489531-Getting-started-with-MetaMask', '_blank');
  };

  const onDownloadClicked = () => {
    window.open('https://metamask.io/download/', '_blank');
  }

  useEffect(() => {
    const activePath = router.asPath;
    if (activePath.includes("swap")) {
      setActive("swap");
    }
    if (activePath.includes("liquidity")) {
      setActive("liquidity");
    }
    if (activePath.includes("vest")) {
      setActive("vest");
    }
    if (activePath.includes("vote")) {
      setActive("vote");
    }
    if (activePath.includes("bribe")) {
      setActive("bribe");
    }
    if (activePath.includes("rewards")) {
      setActive("rewards");
    }
    if (activePath.includes("dashboard")) {
      setActive("dashboard");
    }
    if (activePath.includes("whitelist")) {
      setActive("whitelist");
    }
    if (activePath.includes("migrate")) {
      setActive("migrate");
    }
  }, []);

  const renderNavs = () => {
    return (
      <ToggleButtonGroup
        value={router.asPath.includes("home") ? null : active}
        exclusive
        onChange={onActiveClick}
        className={classes.navToggles}
      >
        {renderSubNav("Swap", "swap")}
        {renderSubNav("Liquidity", "liquidity")}
        {renderSubNav("Vest", "vest")}
        {renderSubNav("Vote", "vote")}
        {renderSubNav("Rewards", "rewards")}
        {renderSubNav("Migrate", "migrate")}
      </ToggleButtonGroup>
    );
  };

  const renderSectionHeader = (title) => {
    return (
      <div className={classes.navigationOptionContainer}>
        <div className={classes.navigationOptionNotSelected}></div>
        <Typography variant="h2" className={classes.sectionText}>
          {title}
        </Typography>
      </div>
    );
  };

  const renderSubNav = (title, link) => {
    return (
      <ToggleButton
        value={link}
        className={[
          classes[`nav-button`],
          classes[`nav-button--${appTheme}`],
        ].join(" ")}
        classes={{ selected: classes[`nav-button--active`] }}
      >
        <div
          className={[
            classes[`nav-button-corner-top`],
            classes[`nav-button-corner-top--${appTheme}`],
          ].join(" ")}
        >
          <div
            className={[
              classes[`nav-button-corner-bottom`],
              classes[`nav-button-corner-bottom--${appTheme}`],
            ].join(" ")}
          >
            <Typography variant="h2" className={classes.subtitleText}>
              {title}
            </Typography>
          </div>
        </div>
      </ToggleButton>
    );
  };

  return (
      <div className={classes.navigationContainer}>
        <div className={classes.navigationContent}>{renderNavs()}</div>
        {warningOpen && <SSWarning close={closeWarning} nav={navigator?.maxTouchPoints}/>}
        {isShowWarningWeb3Provider && (
            <SSWarning
                close={onDownloadClicked}
                subTitle={"Warning!"}
                description={
                    "This website is not supported by a regular browser. Kindly use a crypto wallet browser like MetaMask or TrustWallet to open this page."
                }
                btnLabel1={"Download Metamask"}
                btnLabel2={"What is Metamask?"}
                action2={onRedirectToMetamaskGuide}
                showTitle={false}
            />
        )}
      </div>
  );
}

export default withTheme(Navigation);
