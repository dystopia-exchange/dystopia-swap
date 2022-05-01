import { MenuItem, Select, Typography } from '@mui/material';
import React from 'react';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import classes from './select-token.module.css';
import { formatCurrency } from '../../utils';
import { ArrowDropDownCircleOutlined } from '@mui/icons-material';

function TokenSelect(props) {
  const {appTheme} = useAppThemeContext();
  const {value, options, symbol, handleChange, placeholder = ''} = props;

  const noValue = value === null

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
            return <em>{placeholder}</em>
          }
        } : undefined
      }}
      onChange={handleChange}
      IconComponent={ArrowDropDownCircleOutlined}
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
