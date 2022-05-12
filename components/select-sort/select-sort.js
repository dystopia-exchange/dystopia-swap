import { MenuItem, Select, Typography } from '@mui/material';
import React from 'react';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import classes from './select-sort.module.css';

function SortSelect(props) {
  const {appTheme} = useAppThemeContext();
  const {value, options, handleChange, sortDirection} = props;

  const arrowIcon = () => {
    return (
      <svg
        style={{
          marginLeft: 10,
        }}
        width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9.99962 10.9773L14.1246 6.85232L15.303 8.03065L9.99962 13.334L4.69629 8.03065L5.87462 6.85232L9.99962 10.9773Z"
          fill={appTheme === 'dark' ? '#4CADE6' : '#0B5E8E'}/>
      </svg>
    );
  };

  return (
    <Select
      className={[classes.sortSelect, classes[`sortSelect--${appTheme}`]].join(' ')}
      fullWidth
      MenuProps={{
        classes: {
          list: appTheme === 'dark' ? classes['list--dark'] : classes.list,
        },
      }}
      value={value}
      onChange={handleChange}
      IconComponent={arrowIcon}
      inputProps={{
        className: appTheme === 'dark' ? classes['sortSelectInput--dark'] : classes.sortSelectInput,
      }}>
      {options?.map((option) => {
        return (
          <MenuItem
            key={option.id}
            value={option.id}>
            <div className={[classes.menuOption, 'g-flex', 'g-flex--align-center'].join(' ')}>
              <>
                {sortDirection === 'desc' &&
                  <svg
                    className={classes.sortIcon}
                    width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M0 25C0 11.1929 11.1929 0 25 0V0C38.8071 0 50 11.1929 50 25V25C50 38.8071 38.8071 50 25 50V50C11.1929 50 0 38.8071 0 25V25Z"
                      fill={appTheme === 'dark' ? '#4CADE6' : '#0B5E8E'}/>
                    <path
                      d="M31.6667 31.6667V21.6667H34.1667L30.8333 17.5L27.5 21.6667H30V31.6667H31.6667ZM26.6667 30V31.6667H17.5V30H26.6667ZM26.6667 24.1667V25.8333H17.5V24.1667H26.6667ZM25 18.3333V20H17.5V18.3333H25Z"
                      fill="white"/>
                  </svg>
                }

                {sortDirection === 'asc' &&
                  <svg
                    className={classes.sortIcon}
                    width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M0 25C0 11.1929 11.1929 0 25 0V0C38.8071 0 50 11.1929 50 25V25C50 38.8071 38.8071 50 25 50V50C11.1929 50 0 38.8071 0 25V25Z"
                      fill={appTheme === 'dark' ? '#4CADE6' : '#0B5E8E'}/>
                    <path
                      d="M31.6667 18.334V28.334H34.1667L30.8333 32.5007L27.5 28.334H30V18.334H31.6667ZM25 30.0007V31.6673H17.5V30.0007H25ZM26.6667 24.1673V25.834H17.5V24.1673H26.6667ZM26.6667 18.334V20.0007H17.5V18.334H26.6667Z"
                      fill="white"/>
                  </svg>
                }
              </>

              <Typography
                style={{
                  fontWeight: 500,
                  fontSize: 12,
                  color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                }}>
                {option.label}
              </Typography>
            </div>
          </MenuItem>
        );
      })}
    </Select>
  );
}

export default SortSelect;
