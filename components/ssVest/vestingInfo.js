import { Paper, Typography } from '@mui/material';
import classes from "./ssVest.module.css";
import moment from 'moment';
import { formatCurrency } from '../../utils';
import BigNumber from "bignumber.js";
import { useAppThemeContext } from '../../ui/AppThemeProvider';

export default function VestingInfo({currentNFT, futureNFT, veToken, govToken, showVestingStructure}) {
  const {appTheme} = useAppThemeContext();

  return (
    <div className={classes.vestInfoContainer}>
      {currentNFT &&
        <>
          <div
            style={{
              marginTop: 20,
              border: appTheme === 'dark' ? '1px solid #5F7285' : '1px solid #86B9D6',
            }}
            className={['g-flex'].join(' ')}>
            <div
              style={{
                width: '50%',
                padding: '20px 15px',
                borderRight: appTheme === 'dark' ? '1px solid #5F7285' : '1px solid #86B9D6',
              }}
              className={['g-flex-column'].join(' ')}>
              <Typography className={[classes.amount, classes[`amount--${appTheme}`]].join(' ')}>>
                {formatCurrency(currentNFT?.lockValue)} <span style={{fontSize: 14}}>{veToken?.symbol}</span>
              </Typography>

              <Typography
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  lineHeight: '120%',
                  color: appTheme === 'dark' ? '#FFFFFF' : '#0A2C40',
                }}>
                Voting power
              </Typography>
            </div>

            <div
              style={{
                width: '50%',
                padding: '20px 15px',
              }}
              className={['g-flex-column'].join(' ')}>
              <Typography
                style={{
                  fontWeight: 400,
                  fontSize: 12,
                  lineHeight: '120%',
                  color: appTheme === 'dark' ? '#FFFFFF' : '#0A2C40',
                }}>
                {formatCurrency(currentNFT.lockAmount)} {govToken?.symbol} locked
                expires {moment.unix(currentNFT?.lockEnds).fromNow()}
              </Typography>

              <Typography
                style={{
                  fontWeight: 400,
                  fontSize: 12,
                  lineHeight: '120%',
                  color: appTheme === 'dark' ? '#FFFFFF' : '#0A2C40',
                }}>
                until {moment.unix(currentNFT?.lockEnds).format('YYYY/MM/DD')}
              </Typography>
            </div>
          </div>
        </>
      }
      {
        futureNFT &&
        <>
          <div
            style={{
              marginTop: 20,
              border: appTheme === 'dark' ? '1px solid #5F7285' : '1px solid #86B9D6',
            }}
            className={['g-flex'].join(' ')}>
            <div
              style={{
                width: '50%',
                padding: '20px 15px',
                borderRight: appTheme === 'dark' ? '1px solid #5F7285' : '1px solid #86B9D6',
              }}
              className={['g-flex-column'].join(' ')}>
              <Typography className={[classes.amount, classes[`amount--${appTheme}`]].join(' ')}>
                {formatCurrency(futureNFT?.lockValue)} <span style={{fontSize: 14}}>{veToken?.symbol}</span>
              </Typography>

              <Typography
                style={{
                  fontWeight: 500,
                  fontSize: 14,
                  lineHeight: '120%',
                  color: appTheme === 'dark' ? '#FFFFFF' : '#0A2C40',
                }}>
                Voting power
              </Typography>
            </div>

            <div
              style={{
                width: '50%',
                padding: '20px 15px',
              }}
              className={['g-flex-column'].join(' ')}>
              <Typography
                style={{
                  fontWeight: 400,
                  fontSize: 12,
                  lineHeight: '120%',
                  color: appTheme === 'dark' ? '#FFFFFF' : '#0A2C40',
                }}>
                {formatCurrency(futureNFT.lockAmount)} {govToken?.symbol} locked
                expires {moment.unix(futureNFT?.lockEnds).fromNow()}
              </Typography>

              <Typography
                style={{
                  fontWeight: 400,
                  fontSize: 12,
                  lineHeight: '120%',
                  color: appTheme === 'dark' ? '#FFFFFF' : '#0A2C40',
                }}>
                until {moment.unix(futureNFT?.lockEnds).format('YYYY/MM/DD')}
              </Typography>
            </div>
          </div>
        </>
      }
      {
        showVestingStructure &&
        <div className={classes.seccondSection}>
          <Typography className={[classes.info, classes[`info--${appTheme}`]].join(' ')} color="textSecondary">
            1 {govToken?.symbol} locked for 4 years = 1.00 {veToken?.symbol}
          </Typography>

          <Typography className={[classes.info, classes[`info--${appTheme}`]].join(' ')} color="textSecondary">
            1 {govToken?.symbol} locked for 3 years = 0.75 {veToken?.symbol}</Typography>

          <Typography className={[classes.info, classes[`info--${appTheme}`]].join(' ')} color="textSecondary">
            1 {govToken?.symbol} locked for 2 years = 0.50 {veToken?.symbol}</Typography>

          <Typography className={[classes.info, classes[`info--${appTheme}`]].join(' ')} color="textSecondary">
            1 {govToken?.symbol} locked for 1 years = 0.25 {veToken?.symbol}</Typography>
        </div>
      }
    </div>
  );
}
