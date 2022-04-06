import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Paper, Typography, Grid, IconButton, Tooltip } from '@mui/material';
import classes from "./ssVest.module.css";
import moment from 'moment';
import BigNumber from 'bignumber.js';
import { ArrowBack, ArrowBackIosNew } from '@mui/icons-material';

import LockAmount from './lockAmount';
import LockDuration from './lockDuration';
import VestingInfo from "./vestingInfo";
import { useAppThemeContext } from '../../ui/AppThemeProvider';

export default function existingLock({nft, govToken, veToken}) {

  const [futureNFT, setFutureNFT] = useState(null);

  const router = useRouter();

  const onBack = () => {
    router.push('/vest');
  };

  const updateLockAmount = (amount) => {
    if (amount === '') {
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
    const dayToExpire = expiry.diff(now, 'days');

    tmpNFT.lockAmount = BigNumber(nft.lockAmount).plus(amount).toFixed(18);
    tmpNFT.lockValue = BigNumber(tmpNFT.lockAmount).times(parseInt(dayToExpire) + 1).div(1460).toFixed(18);

    setFutureNFT(tmpNFT);
  };

  const updateLockDuration = (val) => {
    let tmpNFT = {
      lockAmount: nft.lockAmount,
      lockValue: nft.lockValue,
      lockEnds: nft.lockEnds,
    };

    const now = moment();
    const expiry = moment(val);
    const dayToExpire = expiry.diff(now, 'days');

    tmpNFT.lockEnds = expiry.unix();
    tmpNFT.lockValue = BigNumber(tmpNFT.lockAmount).times(parseInt(dayToExpire)).div(1460).toFixed(18);

    setFutureNFT(tmpNFT);
  };

  const {appTheme} = useAppThemeContext();

  return (
    <Paper
      elevation={0}
      className={[classes.container3, classes[`container3--${appTheme}`]].join(' ')}>
      <div
        className={[classes.titleSection, classes[`titleSection--${appTheme}`]].join(' ')}>
        <Tooltip title="Manage Existing Lock" placement="top">
          <IconButton onClick={onBack}>
            <ArrowBackIosNew className={[classes.backIcon, classes[`backIcon--${appTheme}`]].join(' ')}/>
          </IconButton>
        </Tooltip>
      </div>

      <div className={[classes[`top`], classes[`top--${appTheme}`]].join(' ')}>
      </div>

      <div className={[classes.reAddPadding3, classes[`reAddPadding3--${appTheme}`]].join(' ')}>
        <div className={classes.inputsContainer3}>
          <LockAmount nft={nft} govToken={govToken} veToken={veToken} updateLockAmount={updateLockAmount}/>

          <LockDuration nft={nft} govToken={govToken} veToken={veToken} updateLockDuration={updateLockDuration}/>

          <VestingInfo currentNFT={nft} futureNFT={futureNFT} veToken={veToken} showVestingStructure={false}/>
        </div>
      </div>
    </Paper>
  );
}
