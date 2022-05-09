import { MenuItem, Select, Typography } from '@mui/material';
import React from 'react';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import classes from './select-token.module.css';
import { formatCurrency } from '../../utils';

function TokenSelect(props) {
  const {appTheme} = useAppThemeContext();
  const {value, options, symbol, handleChange, placeholder = ''} = props;

  const noValue = value === null;

  const arrowIcon = () => {
    return (
      <svg
        style={{marginRight: 10}}
        width="32px" height="32px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M1,16 C1,7.7157 7.716,1 16,1 L16,1 C24.284,1 31,7.7157 31,16 L31,16 C31,24.2843 24.284,31 16,31 L16,31 C7.716,31 1,24.2843 1,16 L1,16 Z"
          fill={appTheme === 'dark' ? '#24292D' : '#CFE5F2'}>
        </path>

        <polygon
          fill={appTheme === 'dark' ? '#5F7285' : '#86B9D6'}
          points="16 16.9768 20.125 12.8518 21.303 14.0302 16 19.3335 10.697 14.0302 11.875 12.8518">
        </polygon>

        <path
          d="M16,30 C8.268,30 2,23.732 2,16 L0,16 C0,24.8366 7.163,32 16,32 L16,30 Z M30,16 C30,23.732 23.732,30 16,30 L16,32 C24.837,32 32,24.8366 32,16 L30,16 Z M16,2 C23.732,2 30,8.268 30,16 L32,16 C32,7.1634 24.837,0 16,0 L16,2 Z M16,0 C7.163,0 0,7.1634 0,16 L2,16 C2,8.268 8.268,2 16,2 L16,0 Z"
          fill={appTheme === 'dark' ? '#5F7285' : '#86B9D6'}>
        </path>
      </svg>
    );
  };

  console.log('noValue', noValue)

  return (
    <Select
      className={[classes.tokenSelect, classes[`tokenSelect--${appTheme}`]].join(' ')}
      fullWidth
      MenuProps={{
        classes: {
          list: appTheme === 'dark' ? classes['list--dark'] : classes.list,
        },
      }}
      value={value}
      {...{
        displayEmpty: noValue ? true : undefined,
        renderValue: noValue ? (selected) => {
          if (selected === null) {
            return (
              <div
                style={{
                  padding: 10,
                  paddingRight: 30,
                  fontWeight: 500,
                  fontSize: 18,
                  color: appTheme === 'dark' ? '#5F7285' : '#0B5E8E',
                }}>
                {placeholder}
              </div>
            );
          }
        } : undefined,
      }}
      onChange={handleChange}
      IconComponent={arrowIcon}
      inputProps={{
        className: appTheme === 'dark' ? classes['tokenSelectInput--dark'] : classes.tokenSelectInput,
      }}>
      {options?.map((option) => {
        return (
          <MenuItem
            key={option.id}
            value={option}>
            <div
              className={[classes.menuOption, 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
              <Typography
                style={{
                  fontWeight: 500,
                  fontSize: 24,
                  color: appTheme === 'dark' ? '#ffffff' : '#0B5E8E',
                }}>
                #{option.id}
              </Typography>

              <div className={[classes.menuOptionSec, 'g-flex-column'].join(' ')}>
                <Typography
                  style={{
                    fontWeight: 500,
                    fontSize: 12,
                    color: appTheme === 'dark' ? '#ffffff' : '#0B5E8E',
                    textAlign: 'right',
                  }}>
                  {formatCurrency(option.lockValue)}
                </Typography>

                {symbol &&
                  <Typography
                    style={{
                      fontWeight: 500,
                      fontSize: 12,
                      color: appTheme === 'dark' ? '#7C838A' : '#86B9D6',
                      textAlign: 'right',
                    }}>
                    {symbol}
                  </Typography>
                }
              </div>
            </div>
          </MenuItem>
        );
      })}
    </Select>
  );
}

export default TokenSelect;
