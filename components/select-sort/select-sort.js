import React, { useState } from 'react';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import classes from './select-sort.module.css';
import {ClickAwayListener} from '@mui/material';
import {Close} from "@mui/icons-material";

const SortSelect = (props) => {
  const {appTheme} = useAppThemeContext();
  const {value, options, handleChange, sortDirection, className} = props;
  const [open, setOpen] = useState(false);

  const changeState = () => {
    setOpen(!open);
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <div
        className={[classes.sortSelect, open ? classes.sortSelectOpened : ''].join(' ')}>
        <div>
          <div
            className={[classes.selectedOption, classes[`selectedOption--${appTheme}`], 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}
            onClick={changeState}>
            <div className={['g-flex', 'g-flex--align-center', 'g-flex__item'].join(' ')}
                 title={options.find(it => it.id === value).label}
            >
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" fill={open ? "#779BF4" : 'transparent'}/>
                <path d="M15.23 13H23.36C24.04 13 24.59 13.56 24.59 14.25V15.62C24.59 16.12 24.28 16.74 23.97 17.05L21.33 19.43C20.96 19.74 20.72 20.36 20.72 20.86V23.54C20.72 23.91 20.47 24.41 20.17 24.6L19.3 25.17C18.5 25.67 17.39 25.11 17.39 24.11V20.8C17.39 20.36 17.14 19.8 16.9 19.49L14.56 16.99C14.25 16.68 14 16.12 14 15.75V14.31C14 13.56 14.55 13 15.23 13Z"
                      fill={open ? "#E4E9F4" : "#779BF4"}/>
                <path d="M29 14H26.6C26.32 14 26.1 14.22 26.1 14.5C26.1 14.98 26.1 15.62 26.1 15.62C26.1 16.61 25.57 17.58 25.05 18.11L22.33 20.54C22.3 20.61 22.25 20.71 22.22 20.79V23.54C22.22 24.45 21.68 25.44 20.94 25.89L20.12 26.42C19.66 26.71 19.15 26.85 18.64 26.85C18.18 26.85 17.72 26.73 17.3 26.5C16.7825 26.2134 16.3918 25.781 16.1531 25.2735C16.0311 25.0143 16 24.7245 16 24.438V22.21C16 22.08 15.95 21.95 15.85 21.86L14.85 20.86C14.54 20.54 14 20.76 14 21.21V29C14 31.76 16.24 34 19 34H29C31.76 34 34 31.76 34 29V19C34 16.24 31.76 14 29 14ZM30 29.75H23C22.59 29.75 22.25 29.41 22.25 29C22.25 28.59 22.59 28.25 23 28.25H30C30.41 28.25 30.75 28.59 30.75 29C30.75 29.41 30.41 29.75 30 29.75ZM30 25.75H25C24.59 25.75 24.25 25.41 24.25 25C24.25 24.59 24.59 24.25 25 24.25H30C30.41 24.25 30.75 24.59 30.75 25C30.75 25.41 30.41 25.75 30 25.75Z"
                      fill={open ? "#E4E9F4" : "#779BF4"}/>
                <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" stroke="#779BF4"/>
              </svg>

            </div>

          </div>
        </div>

        {open &&
          <div className={[classes.opts, className ? className : ''].join(" ")}>
            <div className={classes.optsHead}>
              <div className={classes.optsHeadTitle}>
                Sort
              </div>

              <span
                  style={{
                    width: 20,
                    height: 20,
                    cursor: 'pointer',
                    backgroundColor: '#586586',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 4,
                    marginTop: 22,
                    marginRight: 22,
                  }}
                  onClick={changeState}
              >
              <Close
                  style={{
                    fontSize: 14,
                  }}
              />
            </span>
            </div>

            {options?.map((option) => {
              return (
                <div
                  key={option.id}
                  className={[classes.menuOption, classes[`menuOption--${appTheme}`], 'g-flex-column'].join(' ')}
                  onClick={() => {
                    setOpen(false);
                    handleChange({target: {value: option.id}});
                  }}>
                  <div
                    style={{
                      padding: '16px 0',
                      fontWeight: 400,
                      fontSize: 16,
                      lineHeight: '24px',
                      color: '#E4E9F4',
                      height: '100%',
                      alignItems: 'center',
                      display: 'flex',
                    }}>
                    {option.label}
                  </div>
                </div>
              );
            })}
          </div>
        }
      </div>
    </ClickAwayListener>
  );
};

export default SortSelect;
