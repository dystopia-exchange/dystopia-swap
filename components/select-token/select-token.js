import {MenuItem, Select, Typography} from '@mui/material';
import React, {useState} from 'react';
import {useAppThemeContext} from '../../ui/AppThemeProvider';
import classes from './select-token.module.css';
import {formatCurrency} from '../../utils';

function TokenSelect(props) {
    const {appTheme} = useAppThemeContext();
    const {value, options, symbol, handleChange, placeholder = ''} = props;

    const [openSelectToken, setOpenSelectToken] = useState(false);

    const openSelect = () => {
        setOpenSelectToken(!openSelectToken);
    };

    const noValue = value === null;

    const arrowIcon = () => {
        return (
            <svg style={{pointerEvents: 'none', position: 'absolute', right: 16,}} width="18" height="9"
                 viewBox="0 0 18 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M16.9201 0.949951L10.4001 7.46995C9.63008 8.23995 8.37008 8.23995 7.60008 7.46995L1.08008 0.949951"
                    stroke="#D3F85A" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round"
                    stroke-linejoin="round"/>
            </svg>
        );
    };

    return (
        <Select
            open={openSelectToken}
            onClick={openSelect}
            className={[classes.tokenSelect, classes[`tokenSelect--${appTheme}`], openSelectToken ? classes.tokenSelectOpen : '',].join(' ')}
            fullWidth
            MenuProps={{
                classes: {
                    list: appTheme === 'dark' ? classes['list--dark'] : classes.list,
                    paper: classes.listPaper,
                },
            }}
            value={value}
            {...{
                displayEmpty: noValue ? true : undefined,
                renderValue: noValue ? (selected) => {
                    if (selected === null) {
                        return (
                            <div className={classes.placeholder}>
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
            {(!options || !options.length) &&
                <div className={classes.noNFT}>
                    <div className={classes.noNFTtext}>
                        You receive NFT by creating a Lock of your CONE for some time, the more CONE you lock and for
                        the longest time, the more Voting Power your NFT will have.
                    </div>
                    <div className={classes.noNFTlinks}>
                        <span className={classes.noNFTlinkButton} onClick={() => {
                            router.push("/swap")
                        }}>BUY CONE</span>
                        <span className={classes.noNFTlinkButton} onClick={() => {
                            router.push("/vest")
                        }}>LOCK CONE FOR NFT</span>
                    </div>
                </div>
            }
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
                                    fontSize: 16,
                                    color: '#D3F85A',
                                }}>
                                #{option.id}
                            </Typography>

                            <div className={[classes.menuOptionSec, 'g-flex-column'].join(' ')}>
                                <Typography
                                    style={{
                                        fontWeight: 400,
                                        fontSize: 16,
                                        color: '#8191B9',
                                    }}>
                                    {formatCurrency(option.lockValue)}
                                    {symbol ? ' ' + symbol : ''}
                                </Typography>

                            </div>
                        </div>
                    </MenuItem>
                );
            })}
        </Select>
    );
}

export default TokenSelect;
