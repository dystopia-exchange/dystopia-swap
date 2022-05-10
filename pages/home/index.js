import { Typography, Button, Paper, SvgIcon, Grid, Avatar } from "@mui/material";

import classes from './home.module.css';

import React, { useState } from 'react';
import { useRouter } from "next/router";
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import BtnEnterApp from '../../ui/BtnEnterApp';

function Home({changeTheme}) {
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  function handleNavigate(route) {
    router.push(route);
  }

  const router = useRouter();

  const [isHoverState, setIsHoverState] = useState(false);
  const [isClickState, setIsClickState] = useState(false);
  const [btnColor, setBtnColor] = useState(appTheme === 'dark' ? '#33284C' : '#D2D0F2');

  const btnDefaultColor = () => {
    setIsHoverState(false);
    setIsClickState(false);
  };

  const btnHoverColor = () => {
    setIsHoverState(true);
  };

  const btnClickColor = () => {
    setIsClickState(true);
  };

  const getBtnColor = () => {
    switch (appTheme) {
      case 'dark':
        return isClickState ? '#523880' : (isHoverState ? '#402E61' : '#33284C');

      case 'light':
      default:
        return isClickState ? '#B9A4EE' : (isHoverState ? '#C6BAF0' : '#D2D0F2');
    }
  };

  const {appTheme} = useAppThemeContext();

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });

  return (
    <div
      className={[classes.ffContainer, classes[`ffContainer--${appTheme}`]].join(' ')}>
      <div
        className={classes.contentContainerFull}
        style={{
          padding: windowWidth <= 1360 ? (showLearnMore || windowWidth <= 1280 ? '30px 0px' : '30px 140px') : '30px',
        }}>
        <img
          src={
            appTheme === "dark"
              ? `/images/ui/enter-bg-left${windowWidth <= 1360 ? '-1360' : ''}--dark.png`
              : `/images/ui/enter-bg-left${windowWidth <= 1360 ? '-1360' : ''}--light.png`
          }
          className={classes.bgLeft}/>

        {!showLearnMore &&
          <div className={[classes.homeContentMain, classes[`homeContentMain--${appTheme}`]].join(' ')}>
            <Typography className={[classes.mainTitle, classes[`mainTitle--${appTheme}`]].join(' ')}>
              Enter the era of crypto
            </Typography>

            <img
              src={appTheme === "dark" ? "/images/big-logo--dark.svg" : "/images/big-logo.svg"}
              className={classes.bigLogo}/>

            {windowWidth > 530 &&
              <Typography className={classes.feeTitle}>
                0.05% FEE • TOKENIZED LOCKS AS NFT’s • POLYGON (MATIC)
              </Typography>
            }

            {windowWidth <= 530 &&
              <Typography className={classes.feeTitle}>
                <div>0.05% FEE</div>
                <div>•</div>
                <div>TOKENIZED LOCKS AS NFT’s</div>
                <div>•</div>
                <div>POLYGON (MATIC)</div>
              </Typography>
            }

            <div
              className={[classes.buttonEnter, classes[`buttonEnter--${appTheme}`]].join(' ')}
              onMouseOver={btnHoverColor}
              onMouseOut={btnDefaultColor}
              onMouseDown={btnClickColor}
              onClick={() => router.push('/swap')}>
              <BtnEnterApp
                labelClassName={classes.buttonEnterLabel}
                label={'Enter App'}
                btnColor={getBtnColor}
              />
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
              Dystopia officially launched in May 2022 with a collective goal
              of <span style={{fontWeight: 700}}>fair and balanced access to DeFi.</span>
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

            <div
              className={[classes.buttonEnterSec, classes[`buttonEnterSec--${appTheme}`]].join(' ')}
              onMouseOver={btnHoverColor}
              onMouseOut={btnDefaultColor}
              onMouseDown={btnClickColor}
              onClick={() => router.push('/swap')}>
              <BtnEnterApp
                labelClassName={classes.buttonEnterLabel}
                label={'Enter App'}
                btnColor={getBtnColor}
              />
            </div>
          </div>}

        <img
          src={
            appTheme === "dark"
              ? `/images/ui/enter-bg-right${windowWidth <= 1360 ? '-1360' : ''}--dark.png`
              : `/images/ui/enter-bg-right${windowWidth <= 1360 ? '-1360' : ''}--light.png`
          }
          className={classes.bgLeft}/>
      </div>
    </div>
  );
}

export default Home;
