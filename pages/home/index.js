import { Typography, Button, Paper, SvgIcon, Grid, Avatar } from "@mui/material";

import classes from './home.module.css';

import React, { useState } from 'react';
import { useRouter } from "next/router";
import { useAppThemeContext } from '../../ui/AppThemeProvider';

function Home({changeTheme}) {
  const [showLearnMore, setShowLearnMore] = useState(false);

  function handleNavigate(route) {
    router.push(route);
  }

  const router = useRouter();

  const {appTheme} = useAppThemeContext();

  return (
    <div className={[classes.ffContainer, classes[`ffContainer--${appTheme}`]].join(' ')}>
      <div className={classes.contentContainerFull}>
        <img
          src={appTheme === "dark" ? "/images/ui/enter-bg-left--dark.png" : "/images/ui/enter-bg-left--light.png"}
          className={classes.bgLeft}/>

        {!showLearnMore &&
          <div className={[classes.homeContentMain, classes[`homeContentMain--${appTheme}`]].join(' ')}>
            <Typography className={[classes.mainTitle, classes[`mainTitle--${appTheme}`]].join(' ')}>
              Enter the era of crypto
            </Typography>

            <img
              src={appTheme === "dark" ? "/images/big-logo--dark.svg" : "/images/big-logo.svg"}
              className={classes.bigLogo}/>

            <Typography className={classes.feeTitle}>
              0.001% FEE • TOKENIZED LOCKS AS NFT’s • POLYGON (MATIC)
            </Typography>

            <div
              className={[classes.buttonEnter, classes[`buttonEnter--${appTheme}`]].join(' ')}
              onClick={() => router.push('/swap')}>
              Enter App
            </div>

            <div
              className={[classes.buttonInfo, classes[`buttonInfo--${appTheme}`]].join(' ')}
              onClick={() => setShowLearnMore(true)}>
              Learn More
            </div>
          </div>}

        {showLearnMore &&
          <div className={[classes.homeContentMainSec, classes[`homeContentMainSec--${appTheme}`]].join(' ')}>
            <img
              src={appTheme === "dark" ? "/images/big-logo--dark.svg" : "/images/big-logo.svg"}
              className={classes.bigLogoSec}/>

            <Typography className={[classes.mainDescription, classes[`mainDescription--${appTheme}`]].join(' ')}>
              Dystopia officially launched in April 2022 with a collective goal
              of <span>fair and balanced access to DeFi.</span>
              <br/>
              <br/>
              Dystopia is a decentralized exchange that has launched on the Polygon network with low fees, near 0
              slippage
              on correlated assets and a strong focus on secondary markets for tokenized locks as NFT’s (veToken =
              lpNFTs).
            </Typography>

            <Typography className={[classes.secDescription, classes[`secDescription--${appTheme}`]].join(' ')}>
              One segment of the cryptocurrency landscape that has shown incredible potential is the swapping of
              stablecoins and volatile assets. Dystopia Swap offers users quick, seamless and cheap transactions while
              utilizing strategies to maximize their yield.
            </Typography>

            <Button
              disableElevation
              className={[classes.buttonEnter, classes[`buttonEnter--${appTheme}`]].join(' ')}
              variant="contained"
              onClick={() => router.push('/swap')}>
              <Typography className={classes.buttonEnterTitle}>
                Enter App
              </Typography>
            </Button>
          </div>}

        <img
          src={appTheme === "dark" ? "/images/ui/enter-bg-right--dark.png" : "/images/ui/enter-bg-right--light.png"}
          className={classes.bgLeft}/>
      </div>
    </div>);
}

export default Home;
