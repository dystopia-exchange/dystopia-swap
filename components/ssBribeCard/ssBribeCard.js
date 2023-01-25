import { PieChart } from '@mui/icons-material';
import { Button, Paper, Typography } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import BigNumber from 'bignumber.js';
import React, { useEffect, useState } from 'react';
import stores from '../../stores/index.js';
import { formatCurrency, formatSymbol } from '../../utils';
import classes from './ssBribeCard.module.css';

import { ACTIONS } from '../../stores/constants';

const theme = createTheme({
  palette: {
    mode: 'dark',
    secondary: {
      main: '#fff'
    }
  },
  typography: {
    allVariants: {
      fontFamily: 'serif',
      textTransform: 'none',
      fontSize: 16,
    },
    fontFamily: [
      '"Roboto Mono"',
      'Inter',
      'Arial',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      '"Helvetica Neue"',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
    body1: {
      fontSize: '12px'
    }
  },
  overrides: {
    MuiButton: {
      root: {
        borderRadius: '32px',
        padding: '9px 16px'
      },
      containedPrimary: {
        backgroundColor: '#fff',
        color: '#000'
      }
    },
    MuiFormControlLabel: {
      root: {
        color: '#fff'
      }
    }
  },
});


export default function BribeCard({ pair, bribe }) {

  const [ claiming, setClaiming ] = useState(false)

  const onClaim = () => {
    if(!claiming) {
      stores.dispatcher.dispatch({ type: ACTIONS.CLAIM_BRIBE, content: { bribe }})
      setClaiming(true)
    }
  }

  const onVote = () => {}

  useEffect(function () {
    const errorReturned = () => {
      setClaiming(false)
    }

    const claimReturned = () => {
      setClaiming(false)
    }

    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    stores.emitter.on(ACTIONS.REWARD_CLAIMED, claimReturned)

    return () => {
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
      stores.emitter.removeListener(ACTIONS.REWARD_CLAIMED, claimReturned)
    };
  }, []);

  const renderClaimable = () => {
    return (
      <>
        <Typography className={ classes.descriptionText} align='center' >{ formatCurrency(bribe.earned) } { formatSymbol(bribe.token.symbol) }</Typography>
        <Typography className={ classes.descriptionSubText } align='center'>Your bribe for voting for { formatSymbol(pair.symbol) }</Typography>
        {
          bribe.hasClaimed &&
          <Button
            className={ classes.tryButton }
            variant='outlined'
            disableElevation
            color='primary'
          >
            <Typography className={ classes.buttonLabel }>Bribe Claimed</Typography>
          </Button>
        }
        {
          !bribe.hasClaimed &&
          <Button
            className={ classes.tryButton }
            variant='outlined'
            disableElevation
            onClick={ onClaim }
            color='primary'
            disabled={ claiming }
          >
            <Typography className={ classes.buttonLabel }>{ claiming ? 'Claiming ...' : 'Claim Bribe'}</Typography>
          </Button>
        }
      </>
    )
  }

  const renderAvailable = () => {
    return (
      <>
        <Typography className={ classes.descriptionPreText } align='center'>Current receive amount:</Typography>
        <Typography className={ classes.descriptionText} align='center' >{ formatCurrency(BigNumber(bribe.rewardPerToken).times( 100 ).div(100)) } { formatSymbol(bribe.token.symbol) }</Typography>
        <Typography className={ classes.descriptionSubText } align='center'>100% vote for {formatSymbol(pair.symbol)} gives you {formatCurrency(bribe.rewardPerToken)} { formatSymbol(bribe.token.symbol) }</Typography>
        <Button
          className={ classes.tryButton }
          variant='outlined'
          disableElevation
          onClick={ onVote }
          color='primary'
        >
          <Typography className={ classes.buttonLabel }>{ 'Cast Vote' }</Typography>
        </Button>
      </>
    )
  }

  const getContainerClass = () => {
    if(BigNumber(bribe.earned).gt(0)) {
      return classes.chainContainerPositive
    } else if (BigNumber(100).eq(0)) {
      return classes.chainContainer
    }
  }

  return (
    <Paper elevation={ 1 } className={ getContainerClass() } >
      <ThemeProvider theme={theme}>
        <div className={ classes.topInfo }>
          <PieChart className={ classes.avatar } />
          {
            BigNumber(bribe.earned).gt(0) && renderClaimable()
          }
          {
            !BigNumber(bribe.earned).gt(0) && renderAvailable()
          }
        </div>
      </ThemeProvider>
    </Paper>
  )
}
