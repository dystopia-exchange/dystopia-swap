import { MenuItem, Select, Typography } from '@mui/material';
import React from 'react';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import classes from './select-sort.module.css';
import { ArrowDropDownCircleOutlined } from '@mui/icons-material';

function SortSelect(props) {
  const {appTheme} = useAppThemeContext();
  const {value, options, handleChange, sortDirection} = props;

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
      IconComponent={ArrowDropDownCircleOutlined}
      inputProps={{
        className: appTheme === 'dark' ? classes['sortSelectInput--dark'] : classes.sortSelectInput,
      }}>
      {options?.map((option) => {
        return (
          <MenuItem
            key={option.id}
            value={option.id}>
            <div className={[classes.menuOption, 'g-flex', 'g-flex--align-center'].join(' ')}>
              <img
                className={ classes.sortIcon }
                alt=""
                src={ sortDirection === 'asc' ? '/images/ui/sort_asc.svg' : '/images/ui/sort_desc.svg' }
                width='50px'
                height='50px'
              />

              <Typography
                style={{
                  fontWeight: 400,
                  fontSize: 14,
                  color: appTheme === 'dark' ? '#ffffff' : '#325569',
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
