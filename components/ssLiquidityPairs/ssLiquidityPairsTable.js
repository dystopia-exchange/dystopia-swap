import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles, styled, useTheme } from '@mui/styles';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Typography,
  Tooltip,
  Toolbar,
  IconButton,
  TextField,
  InputAdornment,
  Popper,
  Fade,
  Grid,
  Switch,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails, Popover,
} from '@mui/material';
import { useRouter } from "next/router";
import BigNumber from 'bignumber.js';
import {
  FilterAltOutlined,
  Search,
  Add,
  Close,
  ArrowDropDown,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import SortSelect from '../select-sort/select-sort';
import { formatCurrency } from '../../utils';
import classes from './ssLiquidityPairs.module.css';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import TablePaginationActions from '../table-pagination/table-pagination';
import { formatSymbol } from '../../utils';
import SwitchCustom from '../../ui/Switch';
import { TableBodyPlaceholder } from '../../components/table';


function descendingComparator(a, b, orderBy) {
  if (!a || !b) {
    return 0;
  }

  switch (orderBy) {
    case 'pair':
      return formatSymbol(a.symbol).localeCompare(formatSymbol(b.symbol));
    case "tvl":
      if (BigNumber(b?.tvl).lt(a?.tvl)) {
        return -1;
      }
      if (BigNumber(b?.tvl).gt(a?.tvl)) {
        return 1;
      }
      return 0;
    case "apr":
      if (BigNumber(b?.gauge?.apr).lt(BigNumber(a?.gauge?.apr))) {
        console.log(BigNumber(b?.gauge?.apr), BigNumber(a?.gauge?.apr), "1");
        return -1;
      }
      if (
        BigNumber(b?.gauge?.apr).div(100).times(40).gt(BigNumber(a?.gauge?.apr))
      ) {
        console.log(BigNumber(b?.gauge?.apr), BigNumber(a?.gauge?.apr), "2");
        return 1;
      }
      return 0;
    case "balance":
      let balanceA = BigNumber(a?.token0?.balance)
        .plus(a?.token1?.balance)
        .toNumber();
      let balanceB = BigNumber(b?.token0?.balance)
        .plus(b?.token1?.balance)
        .toNumber();

      if (BigNumber(balanceB).lt(balanceA)) {
        return -1;
      }
      if (BigNumber(balanceB).gt(balanceA)) {
        return 1;
      }
      return 0;

    case 'poolBalance':
      let poolBalanceA = BigNumber(a.balance).div(a.totalSupply).times(a.reserve0)
        .plus(BigNumber(a.balance).div(a.totalSupply).times(a.reserve1))
        .toNumber();

      let poolBalanceB = BigNumber(b.balance).div(b.totalSupply).times(b.reserve0)
        .plus(BigNumber(b.balance).div(b.totalSupply).times(b.reserve1))
        .toNumber();

      if (BigNumber(poolBalanceB).lt(poolBalanceA)) {
        return -1;
      }
      if (BigNumber(poolBalanceB).gt(poolBalanceA)) {
        return 1;
      }
      return 0;

    case 'stakedBalance':
      if (!(a && a.gauge)) {
        return 1;
      }

      if (!(b && b.gauge)) {
        return -1;
      }

      if (BigNumber(b?.gauge?.balance).lt(a?.gauge?.balance)) {
        return -1;
      }
      if (BigNumber(b?.gauge?.balance).gt(a?.gauge?.balance)) {
        return 1;
      }
      return 0;

    case 'poolAmount':
      let reserveA = BigNumber(a?.reserve0).plus(a?.reserve1).toNumber();
      let reserveB = BigNumber(b?.reserve0).plus(b?.reserve1).toNumber();

      if (BigNumber(reserveB).lt(reserveA)) {
        return -1;
      }
      if (BigNumber(reserveB).gt(reserveA)) {
        return 1;
      }
      return 0;

    case 'stakedAmount':
      if (!(a && a.gauge)) {
        return 1;
      }

      if (!(b && b.gauge)) {
        return -1;
      }

      let stakedAmountA = BigNumber(a?.gauge?.reserve0).plus(a?.gauge?.reserve1).toNumber();
      let stakedAmountB = BigNumber(b?.gauge?.reserve0).plus(b?.gauge?.reserve1).toNumber();

      if (BigNumber(stakedAmountB).lt(stakedAmountA)) {
        return -1;
      }
      if (BigNumber(stakedAmountB).gt(stakedAmountA)) {
        return 1;
      }
      return 0;

    default:
      return 0;

  }
}

function getComparator(order, orderBy) {
  return order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const headCells = [
  {
    id: 'pair',
    numeric: false,
    disablePadding: false,
    label: 'Asset',
    isSticky: true,
    isHideInDetails: true,
  },
  {
    id: 'balance',
    numeric: true,
    disablePadding: false,
    label: 'TVL / APR',
    isHideInDetails: true,
  },
  {
    id: 'poolBalance',
    numeric: true,
    disablePadding: false,
    label: 'My Pool',
  },
  {
    id: 'stakedBalance',
    numeric: true,
    disablePadding: false,
    label: 'My Stake',
  },
  {
    id: 'poolAmount',
    numeric: true,
    disablePadding: false,
    label: 'Total Liquidity',
    // isHideInDetails: true,
  },
  {
    id: 'stakedAmount',
    numeric: true,
    disablePadding: false,
    label: 'Total Stake',
  },
  // {
  //   id: 'apy',
  //   numeric: true,
  //   disablePadding: false,
  //   label: 'APY',
  // },
  {
    id: '',
    numeric: true,
    disablePadding: false,
    label: 'Actions',
    isHideInDetails: true,
  },
];

const StickyTableCell = styled(TableCell)(({theme, appTheme}) => ({
  color: appTheme === 'dark' ? '#C6CDD2 !important' : '#325569 !important',
  width: 310,
  left: 0,
  position: "sticky",
  // zIndex: 5,
  whiteSpace: 'nowrap',
  padding: '20px 25px 15px',
}));

const StyledTableCell = styled(TableCell)(({theme, appTheme}) => ({
  background: appTheme === 'dark' ? '#24292D' : '#CFE5F2',
  width: 'auto',
  whiteSpace: 'nowrap',
  padding: '20px 25px 15px',
}));

const sortIcon = (sortDirection) => {
  const {appTheme} = useAppThemeContext();

  return (
    <>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        style={{
          transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M5.83325 8.33337L9.99992 12.5L14.1666 8.33337H5.83325Z"
          fill={appTheme === 'dark' ? '#5F7285' : '#9BC9E4'}/>
      </svg>
    </>
  );
};

function EnhancedTableHead(props) {
  const {order, orderBy, onRequestSort} = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const {appTheme} = useAppThemeContext();

  return (
    <TableHead>
      <TableRow
        style={{
          // borderBottom: '1px solid #9BC9E4',
          // borderColor: appTheme === 'dark' ? '#5F7285' : '#9BC9E4',
          whiteSpace: 'nowrap',
        }}>
        {
          headCells.map((headCell) => (
            <>
              {
                headCell.isSticky
                  ? <StickyTableCell
                    appTheme={appTheme}
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    padding={'normal'}
                    sortDirection={orderBy === headCell.id ? order : false}
                    style={{
                      background: '#060B17',
                      borderBottom: `1px solid #d3f85a`,
                      // zIndex: 10,
                    }}>
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={createSortHandler(headCell.id)}
                      IconComponent={() => orderBy === headCell.id ? sortIcon(order) : null}>
                      <Typography
                        className={classes.headerText}
                        style={{
                          fontWeight: 500,
                          fontSize: 14,
                          lineHeight: '120%',
                          color: '#8191B9',
                        }}>
                        {headCell.label}
                      </Typography>
                      {/*{orderBy === headCell.id
                        ? <span className={classes.visuallyHidden}>
                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </span>
                        : null
                      }*/}
                    </TableSortLabel>
                  </StickyTableCell>
                  : <StyledTableCell
                    style={{
                      background: '#060B17',
                      borderBottom: `1px solid #d3f85a`,
                      color: '#8191B9',
                    }}
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    padding={'normal'}
                    sortDirection={orderBy === headCell.id ? order : false}>
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      IconComponent={() => orderBy === headCell.id ? sortIcon(order) : null}
                      style={{
                        color: appTheme === 'dark' ? '#C6CDD2' : '#325569',
                      }}
                      onClick={createSortHandler(headCell.id)}>
                      <Typography
                        className={classes.headerText}
                        style={{
                          fontWeight: 500,
                          fontSize: 14,
                          lineHeight: '120%',
                          color: '#8191B9',
                        }}>
                        {headCell.label}
                      </Typography>
                      {/*{orderBy === headCell.id
                        ? <span className={classes.visuallyHidden}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </span>
                        : null
                      }*/}
                    </TableSortLabel>
                  </StyledTableCell>
              }
            </>
          ))
        }
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
};

const useStyles = makeStyles({
  infoContainer: {
    position: 'relative',
    padding: 22,
    marginTop: 26,
    display: 'flex',
    // width: '100%',
    background: 'rgba(6, 11, 23, 0.5)',
    border: '1px solid #1F2B49',
    borderRadius: 12,
  },
  infoContainerWarn: {
    color: '#18202f',
    position: 'absolute',
    left: 30,
    top: 20,
  },
  infoContainerText: {
    color: '#E4E9F4',
    fontSize: 16,
    fontWeight: 400,
    paddingLeft: 18,
  },
  tableWrapper: {
    overflowY: 'initial',
    ["@media (min-width:1920px)"]: {
      paddingLeft: 433,
    },
  },
  tableContWrapper: {
    marginTop: 20,
    border: '1px solid #D3F85A',
    borderRadius: 12,
    overflow: 'hidden',
    ["@media (min-width:806px)"]: {
      marginTop: 12,
    },
    ["@media (min-width:1333px)"]: {
      marginTop: 30,
    },
    ["@media (min-width:1483px)"]: {
      marginTop: 30,
    },
    ["@media (min-width:1920px)"]: {
      marginTop: 20,
    },
  },
  mobmsg: {
    display: 'flex',
    background: '#171D2D',
    borderRadius: 12,
    color: '#E4E9F4',
    fontSize: 20,
    fontWeight: 500,
    padding: '12px 24px',
    alignItems: 'center',
  },
  toolbarFirst: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    position: 'relative',
    ["@media (min-width:1200px)"]: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  },
  toolbarTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolbarTitle: {
    fontSize: 40,
    fontWeight: 500,
    color: '#E4E9F4',
    lineHeight: '72px',

    ["@media (min-width:806px)"]: {
      fontSize: 60,
    },

  },
  sidebar: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    // position: 'absolute',
    ["@media (min-width:806px)"]: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    ["@media (min-width:1333px)"]: {
      // flexDirection: 'row',
      flexWrap: 'unset',
    },
    ["@media (min-width:1483px)"]: {
      // flexDirection: 'row',
    },
    ["@media (min-width:1920px)"]: {
      flexDirection: 'column',
      width: '377px',
      position: 'absolute',
      left: -414,
    },
  },
  root: {
    width: '100%',
  },
  assetTableRow: {
    '&:hover': {
      background: 'rgba(104,108,122,0.05)',
    },
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
  },
  inline: {
    display: 'flex',
    alignItems: 'center',
  },
  inlineEnd: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  icon: {
    marginRight: '12px',
  },
  textSpaced: {
    lineHeight: '1.5',
    fontWeight: '200',
    fontSize: '12px',
  },
  headerText: {
    fontWeight: '500 !important',
    fontSize: '12px !important',
  },
  cell: {},
  cellSuccess: {
    color: '#4eaf0a',
  },
  cellAddress: {
    cursor: 'pointer',
  },
  aligntRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  skelly: {
    marginBottom: '12px',
    marginTop: '12px',
  },
  skelly1: {
    marginBottom: '12px',
    marginTop: '24px',
  },
  skelly2: {
    margin: '12px 6px',
  },
  tableBottomSkelly: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  assetInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    padding: '24px',
    width: '100%',
    flexWrap: 'wrap',
    borderBottom: '1px solid rgba(104, 108, 122, 0.25)',
    background: 'radial-gradient(circle, rgba(63,94,251,0.7) 0%, rgba(47,128,237,0.7) 48%) rgba(63,94,251,0.7) 100%',
  },
  assetInfoError: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    padding: '24px',
    width: '100%',
    flexWrap: 'wrap',
    borderBottom: '1px rgba(104, 108, 122, 0.25)',
    background: '#dc3545',
  },
  infoField: {
    flex: 1,
  },
  flexy: {
    padding: '6px 0px',
  },
  overrideCell: {
    padding: '0px',
  },
  hoverRow: {
    cursor: 'pointer',
  },
  statusLiquid: {
    color: '#dc3545',
  },
  statusWarning: {
    color: '#FF9029',
  },
  statusSafe: {
    color: 'green',
  },
  imgLogoContainer: {
    padding: 1,
    width: 39,
    height: 39,
    borderRadius: '100px',
    background: 'rgb(25, 33, 56)',
    border: '2px solid #DBE6EC',
  },
  'imgLogoContainer--dark': {
    border: '2px solid #151718',
    ["@media (max-width:660px)"]: {
      border: '2px solid #24292d',
    },
  },
  imgLogoContainer2: {
    marginLeft: -10,
  },
  imgLogo: {
    width: 37,
    height: 37,
    margin: -2,
    borderRadius: '100px',
  },
  doubleImages: {
    display: 'flex',
    position: 'relative',
    width: '80px',
    height: '35px',
  },
  searchContainer: {
    display: 'flex',
  },
  textSearchField: {
    width: '100%',
    // paddingRight: 0,
    ["@media (min-width:806px)"]: {
      width: 374,
      position: 'absolute',
      right: 86,
      top: 10,
      paddingRight: 0,
    },
    ["@media (min-width:1333px)"]: {
      width: 747,
      top: 0,
    },

  },
  searchInput: {
    width: 747,
    height: 72,
    paddingRight: 24,
    // zIndex: 99,
    '& > fieldset': {
      border: 'none',
    },
    /*["@media (max-width:1360px)"]: {
      // eslint-disable-line no-useless-computed-key
      position: 'absolute',
      top: 31,
      right: 0,
    },*/
    ["@media (max-width:1332px)"]: {
      position: 'relative',
      // top: '6px',
      left: 0,
      width: '100%',
    },
    ["@media (max-width:805px)"]: {
      height: 48,
      marginTop: 2,
    },
  },
  actionsButtons: {
    ["@media (max-width:1332px)"]: {
      position: 'absolute',
      right: 0,
      top: 0,
    },
  },
  myDeposits: {
    background: '#171D2D',
    display: 'flex',
    alignItems: 'center',
    height: 72,
    paddingLeft: 28,
    borderRadius: 12,
    marginTop: 20,
    // marginLeft: 20,
    fontSize: '18px !important',
    ["@media (min-width:806px)"]: {
      width: 377,
    },
    ["@media (min-width:1333px)"]: {
      width: 377,
      position: 'absolute',
      right: 0,
    },
    ["@media (min-width:1483px)"]: {
      width: 377,
      position: 'absolute',
      right: 0,
    },
    ["@media (min-width:1920px)"]: {
      marginTop: 0,
      width: '100%',
      position: 'relative',
    },
    ["@media (max-width:660px)"]: {
      // eslint-disable-line no-useless-computed-key
      // padding: '9px 0',
      // paddingLeft: 20,
    },
    ["@media (max-width:540px)"]: {
      // eslint-disable-line no-useless-computed-key
      fontSize: '12px !important',
      // paddingLeft: 10,
      // marginLeft: 10,
    },
  },
  myDepositsText: {
    fontWeight: 600,
    fontSize: 16,
    lineHeight: '24px',
    color: '#E4E9F4',
    paddingLeft: 10,
    ["@media (max-width:530px)"]: {
      // eslint-disable-line no-useless-computed-key
      display: 'flex',
      flexDirection: 'column',
    },
  },
  toolbar: {
    // marginBottom: 30,
    padding: 0,
    minHeight: 'auto',
    ["@media (max-width:660px)"]: {
      paddingBottom: 10,
    },
  },
  filterButton: {
    padding: 0,
    width: 72,
    height: 72,
    // marginLeft: 10,
    // borderRadius: 12,
    position: 'absolute',
    right: 0,
    top: 0,
    ["@media (max-width:1332px)"]: {
      // position: 'absolute',
      // right: 0,
      top: 10,
    },
    ["@media (max-width:805px)"]: {
      top: 3,
      right: -10,
    },
    // background: 'rgba(119, 155, 244, 0.15)',
    '&:hover': {
      background: 'rgba(60,107,227,0.15)',
    },
    '&:active': {
      // background: 'rgba(85,128,236,0.15)',
      // border: '1px solid #4CADE6',
    },
  },
  searchButton: {
    width: 50,
    height: 50,
    marginLeft: 10,
    borderRadius: 100,
  },
  'searchButton--dark': {
    background: '#4CADE6',
    color: '#0A2C40',
    '&:hover': {
      background: '#5F7285',
    },
    '&:active': {
      background: '#5F7285',
      border: '1px solid #4CADE6',
    },
  },
  filterContainer: {
    minWidth: '340px',
    marginTop: '15px',
    padding: '30px',
    paddingBottom: '20px',
    boxShadow: '0 10px 20px 0 rgba(0,0,0,0.2)',
    borderRadius: 12,
    background: '#171D2D',
    border: '1px solid #779BF4',
  },
  alignContentRight: {
    textAlign: 'right',
  },
  labelColumn: {
    display: 'flex',
    alignItems: 'center',
  },
  filterItem: {
    position: 'relative',
    padding: '8px 0',
  },
  'filterItem--dark': {
    borderColor: '#5F7285',
    '&:not(:last-child)::before': {
      backgroundColor: '#4CADE6',
    },
    '&:not(:last-child)::after': {
      backgroundColor: '#4CADE6',
    },
  },
  filterLabel: {
    fontSize: '16px',
    fontWeight: 400,
    color: '#E4E9F4',
  },
  filterListTitle: {
    fontWeight: 500,
    fontSize: 40,
    color: '#E4E9F4',
  },
  infoIcon: {
    color: '#06D3D7',
    fontSize: '16px',
    marginLeft: '10px',
  },
  symbol: {
    minWidth: '40px',
  },
  hiddenMobile: {
    // '@media (max-width: 1000px)': {
    //   display: 'none',
    // },
  },
  hiddenSmallMobile: {
    // '@media (max-width: 600px)': {
    //   display: 'none',
    // },
  },
  labelAdd: {
    display: 'none',
    fontSize: '12px',
    // '@media (max-width: 1000px)': {
    //   display: 'block',
    // },
  },
  addButton: {
    marginTop: 20,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 12,
    cursor: 'pointer',
    height: 68,
    '&:hover > p': {
      background: '#c4ff00',
    },
    ["@media (min-width:806px)"]: {
      width: 248,
      height: 72,
    },
    ["@media (min-width:1333px)"]: {
      // width: 248,
      // height: 72,
    },
    ["@media (min-width:1483px)"]: {
      // width: 248,
      // height: 72,
    },
    ["@media (min-width:1920px)"]: {
      width: '100%',
      height: 96,
    },
  },
  actionButtonText: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textTransform: 'uppercase',
    lineHeight: '48px',
    background: '#D3F85A',
    color: '#060B17',
    transition: 'all ease 300ms',
    fontSize: 20,
    fontWeight: 600,
    ["@media (min-width:806px)"]: {
      // fontWeight: 600,
      fontSize: 18,
    },
    ["@media (min-width:1333px)"]: {
      // fontWeight: 600,
      // fontSize: 18,
    },
    ["@media (min-width:1483px)"]: {
      // fontWeight: 600,
      // fontSize: 18,
    },
    ["@media (min-width:1920px)"]: {
      fontWeight: 600,
      fontSize: 32,
    },
  },
  withdrawButton: {
    marginTop: 10,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 12,
    height: 48,
    cursor: 'pointer',
    ["@media (min-width:806px)"]: {
      height: 72,
      width: 312,
      marginTop: 20,
      marginLeft: 20,
    },
    ["@media (min-width:1333px)"]: {
      width: 312,
      marginTop: 20,
      marginLeft: 20,
    },
    ["@media (min-width:1483px)"]: {
      width: 312,
      marginTop: 20,
      marginLeft: 20,
    },
    ["@media (min-width:1920px)"]: {
      width: '100%',
      marginLeft: 0,
    },
  },
  actionButtonWithdrawText: {
    background: 'rgba(119, 155, 244, 0.15)',
    color: '#779BF4',
    fontSize: 14,
    fontWeight: 600,
    border: '1px solid #779BF4',
    borderRadius: 12,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ["@media (min-width:1483px)"]: {
      // fontWeight: 600,
      fontSize: 18,
    },
    ["@media (min-width:1920px)"]: {
      // fontWeight: 600,
      // fontSize: 18,
    },
  },
  table: {
    tableLayout: 'auto',
  },
  accordionSummaryContent: {
    margin: 0,
    padding: 0,
  },
  sortSelect: {
    position: 'absolute',
    right: 60,
    top: 14,
    width: 48,
  },
  sortSelectPosition: {
    right: -60,
  },
  cellPaddings: {
    padding: '11px 20px',
    ["@media (max-width:530px)"]: {
      // eslint-disable-line no-useless-computed-key
      padding: 10,
    },
  },
  cellHeadPaddings: {
    padding: '5px 20px',
    ["@media (max-width:530px)"]: {
      // eslint-disable-line no-useless-computed-key
      padding: '5px 10px',
    },
  },
  popoverPaper: {
    width: 340,
    minHeight: 292,
    padding: 0,
    background: 'none',
    border: 'none !important',
    boxShadow: '5px 5px 20px rgba(14, 44, 79, 0.25)',
    borderRadius: 0,
    overflow: 'hidden',
  },
  displayedRows: {
    fontSize: 12,
  },
});

const getLocalToggles = () => {
  let localToggles = {
    toggleActive: true,
    toggleActiveGauge: true,
    toggleVariable: true,
    toggleStable: true,
    showSearch: false,
  };
  // get locally saved toggles
  try {
    const localToggleString = localStorage.getItem('solidly-pairsToggle-v1');
    if (localToggleString && localToggleString.length > 0) {
      localToggles = JSON.parse(localToggleString);
    }
  } catch (ex) {
    console.log(ex);
  }

  return localToggles;
};

const EnhancedTableToolbar = (props) => {
  const classes = useStyles();
  const router = useRouter();

  const localToggles = getLocalToggles();

  const options = [
    {id: 'balance--asc', label: 'TVL: high to low'},
    {id: 'balance--desc', label: 'TVL: low to high'},
    {id: 'poolBalance--asc', label: 'My Pool: high to low'},
    {id: 'poolBalance--desc', label: 'My Pool: low to high'},
    {id: 'stakedBalance--asc', label: 'My Stake: high to low'},
    {id: 'stakedBalance--desc', label: 'My Stake: low to high'},
    {id: 'poolAmount--asc', label: 'Total Liquidity: high to low'},
    {id: 'poolAmount--desc', label: 'Total Liquidity: low to high'},
    {id: 'stakedAmount--asc', label: 'Total Stake: high to low'},
    {id: 'stakedAmount--desc', label: 'Total Stake: low to high'},
  ];

  const [search, setSearch] = useState('');
  const [toggleActive, setToggleActive] = useState(localToggles.toggleActive);
  const [toggleActiveGauge, setToggleActiveGauge] = useState(localToggles.toggleActiveGauge);
  const [toggleStable, setToggleStable] = useState(localToggles.toggleStable);
  const [toggleVariable, setToggleVariable] = useState(localToggles.toggleVariable);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showSearch, setShowSearch] = useState(localToggles.showSearch);
  const [sortValueId, setSortValueId] = useState('stakedBalance--desc');
  const [sortDirection, setSortDirection] = useState('asc');

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
    props.setSearch(event.target.value);
  };

  const onToggle = (event, name = null, checked = false) => {
    const localToggles = getLocalToggles();
    const isChecked = event?.target?.checked || checked;

    switch (event?.target?.name || name) {
      case 'toggleActive':
        setToggleActive(isChecked);
        props.setToggleActive(isChecked);
        localToggles.toggleActive = isChecked;
        break;
      case 'toggleActiveGauge':
        setToggleActiveGauge(isChecked);
        props.setToggleActiveGauge(isChecked);
        localToggles.toggleActiveGauge = isChecked;
        break;
      case 'toggleStable':
        setToggleStable(isChecked);
        props.setToggleStable(isChecked);
        localToggles.toggleStable = isChecked;
        break;
      case 'toggleVariable':
        setToggleVariable(isChecked);
        props.setToggleVariable(isChecked);
        localToggles.toggleVariable = isChecked;
        break;
      case 'showSearch':
        setShowSearch(event.showSearch);
        props.setShowSearch(event.showSearch);
        localToggles.showSearch = event.showSearch;
        break;
      default:

    }

    // set locally saved toggles
    try {
      localStorage.setItem('solidly-pairsToggle-v1', JSON.stringify(localToggles));
    } catch (ex) {
      console.log(ex);
    }
  };

  const onCreate = () => {
    router.push('/liquidity/create');
  };

  const onWithdraw = () => {
    router.push('/liquidity/withdraw');
  };

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const handleSearch = () => {
    onToggle({target: {name: 'showSearch'}, showSearch: !localToggles.showSearch});
  };

  const open = Boolean(anchorEl);
  const id = open ? 'transitions-popper' : undefined;

  const handleChangeSort = ({target: {value}}) => {
    const property = value.substring(0, value.indexOf('--'));
    const event = value.substring(value.indexOf('--') + 2);

    setSortValueId(value);
    setSortDirection(event);

    props.handleRequestSort(event, property);
  };

  const {appTheme} = useAppThemeContext();

  return (
    <Toolbar className={[classes.toolbar, 'g-flex-column__item-fixed', 'g-flex', 'g-flex--space-between', 'g-flex-column'].join(' ')}>

      <div className={classes.toolbarFirst}>
        <div className={classes.toolbarTitleRow}>
          <Typography className={classes.toolbarTitle}>
            Liquidity
          </Typography>

          {windowWidth <= 800 &&
            <div className={classes.sortSelect}>
              <SortSelect
                value={sortValueId}
                options={options}
                handleChange={handleChangeSort}
                sortDirection={sortDirection}
                className={classes.sortSelectPosition}
              />
            </div>
          }

          {/* filters button */}
          <div className={classes.searchContainer}>
            <div className={[classes.actionsButtons, 'g-flex', 'g-flex--align-center'].join(' ')} title="Filter list">
              <IconButton
                  className={[classes.filterButton, classes[`filterButton--${appTheme}`]].join(' ')}
                  onClick={handleClick}
                  aria-label="filter list">
                {windowWidth >= 806 && open &&
                    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0.5" y="0.5" width="71" height="71" rx="11.5" fill="#779BF4" fill-opacity="1"/>
                      <path d="M37.125 35.625V44.25C37.125 44.5484 37.0065 44.8345 36.7955 45.0455C36.5845 45.2565 36.2984 45.375 36 45.375C35.7016 45.375 35.4155 45.2565 35.2045 45.0455C34.9935 44.8345 34.875 44.5484 34.875 44.25V35.625C34.875 35.3266 34.9935 35.0405 35.2045 34.8295C35.4155 34.6185 35.7016 34.5 36 34.5C36.2984 34.5 36.5845 34.6185 36.7955 34.8295C37.0065 35.0405 37.125 35.3266 37.125 35.625ZM42.75 42C42.4516 42 42.1655 42.1185 41.9545 42.3295C41.7435 42.5405 41.625 42.8266 41.625 43.125V44.25C41.625 44.5484 41.7435 44.8345 41.9545 45.0455C42.1655 45.2565 42.4516 45.375 42.75 45.375C43.0484 45.375 43.3345 45.2565 43.5455 45.0455C43.7565 44.8345 43.875 44.5484 43.875 44.25V43.125C43.875 42.8266 43.7565 42.5405 43.5455 42.3295C43.3345 42.1185 43.0484 42 42.75 42ZM45 38.25H43.875V27.75C43.875 27.4516 43.7565 27.1655 43.5455 26.9545C43.3345 26.7435 43.0484 26.625 42.75 26.625C42.4516 26.625 42.1655 26.7435 41.9545 26.9545C41.7435 27.1655 41.625 27.4516 41.625 27.75V38.25H40.5C40.2016 38.25 39.9155 38.3685 39.7045 38.5795C39.4935 38.7905 39.375 39.0766 39.375 39.375C39.375 39.6734 39.4935 39.9595 39.7045 40.1705C39.9155 40.3815 40.2016 40.5 40.5 40.5H45C45.2984 40.5 45.5845 40.3815 45.7955 40.1705C46.0065 39.9595 46.125 39.6734 46.125 39.375C46.125 39.0766 46.0065 38.7905 45.7955 38.5795C45.5845 38.3685 45.2984 38.25 45 38.25ZM29.25 39C28.9516 39 28.6655 39.1185 28.4545 39.3295C28.2435 39.5405 28.125 39.8266 28.125 40.125V44.25C28.125 44.5484 28.2435 44.8345 28.4545 45.0455C28.6655 45.2565 28.9516 45.375 29.25 45.375C29.5484 45.375 29.8345 45.2565 30.0455 45.0455C30.2565 44.8345 30.375 44.5484 30.375 44.25V40.125C30.375 39.8266 30.2565 39.5405 30.0455 39.3295C29.8345 39.1185 29.5484 39 29.25 39ZM31.5 35.25H30.375V27.75C30.375 27.4516 30.2565 27.1655 30.0455 26.9545C29.8345 26.7435 29.5484 26.625 29.25 26.625C28.9516 26.625 28.6655 26.7435 28.4545 26.9545C28.2435 27.1655 28.125 27.4516 28.125 27.75V35.25H27C26.7016 35.25 26.4155 35.3685 26.2045 35.5795C25.9935 35.7905 25.875 36.0766 25.875 36.375C25.875 36.6734 25.9935 36.9595 26.2045 37.1705C26.4155 37.3815 26.7016 37.5 27 37.5H31.5C31.7984 37.5 32.0845 37.3815 32.2955 37.1705C32.5065 36.9595 32.625 36.6734 32.625 36.375C32.625 36.0766 32.5065 35.7905 32.2955 35.5795C32.0845 35.3685 31.7984 35.25 31.5 35.25ZM38.25 30.75H37.125V27.75C37.125 27.4516 37.0065 27.1655 36.7955 26.9545C36.5845 26.7435 36.2984 26.625 36 26.625C35.7016 26.625 35.4155 26.7435 35.2045 26.9545C34.9935 27.1655 34.875 27.4516 34.875 27.75V30.75H33.75C33.4516 30.75 33.1655 30.8685 32.9545 31.0795C32.7435 31.2905 32.625 31.5766 32.625 31.875C32.625 32.1734 32.7435 32.4595 32.9545 32.6705C33.1655 32.8815 33.4516 33 33.75 33H38.25C38.5484 33 38.8345 32.8815 39.0455 32.6705C39.2565 32.4595 39.375 32.1734 39.375 31.875C39.375 31.5766 39.2565 31.2905 39.0455 31.0795C38.8345 30.8685 38.5484 30.75 38.25 30.75Z" fill="#E4E9F4"/>
                      <rect x="0.5" y="0.5" width="71" height="71" rx="11.5" stroke="#779BF4"/>
                    </svg>
                }
                {windowWidth >= 806 && !open &&
                    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0.5" y="0.5" width="71" height="71" rx="11.5" fill="#779BF4" fill-opacity="0.15"/>
                      <path d="M37.125 35.625V44.25C37.125 44.5484 37.0065 44.8345 36.7955 45.0455C36.5845 45.2565 36.2984 45.375 36 45.375C35.7016 45.375 35.4155 45.2565 35.2045 45.0455C34.9935 44.8345 34.875 44.5484 34.875 44.25V35.625C34.875 35.3266 34.9935 35.0405 35.2045 34.8295C35.4155 34.6185 35.7016 34.5 36 34.5C36.2984 34.5 36.5845 34.6185 36.7955 34.8295C37.0065 35.0405 37.125 35.3266 37.125 35.625ZM42.75 42C42.4516 42 42.1655 42.1185 41.9545 42.3295C41.7435 42.5405 41.625 42.8266 41.625 43.125V44.25C41.625 44.5484 41.7435 44.8345 41.9545 45.0455C42.1655 45.2565 42.4516 45.375 42.75 45.375C43.0484 45.375 43.3345 45.2565 43.5455 45.0455C43.7565 44.8345 43.875 44.5484 43.875 44.25V43.125C43.875 42.8266 43.7565 42.5405 43.5455 42.3295C43.3345 42.1185 43.0484 42 42.75 42ZM45 38.25H43.875V27.75C43.875 27.4516 43.7565 27.1655 43.5455 26.9545C43.3345 26.7435 43.0484 26.625 42.75 26.625C42.4516 26.625 42.1655 26.7435 41.9545 26.9545C41.7435 27.1655 41.625 27.4516 41.625 27.75V38.25H40.5C40.2016 38.25 39.9155 38.3685 39.7045 38.5795C39.4935 38.7905 39.375 39.0766 39.375 39.375C39.375 39.6734 39.4935 39.9595 39.7045 40.1705C39.9155 40.3815 40.2016 40.5 40.5 40.5H45C45.2984 40.5 45.5845 40.3815 45.7955 40.1705C46.0065 39.9595 46.125 39.6734 46.125 39.375C46.125 39.0766 46.0065 38.7905 45.7955 38.5795C45.5845 38.3685 45.2984 38.25 45 38.25ZM29.25 39C28.9516 39 28.6655 39.1185 28.4545 39.3295C28.2435 39.5405 28.125 39.8266 28.125 40.125V44.25C28.125 44.5484 28.2435 44.8345 28.4545 45.0455C28.6655 45.2565 28.9516 45.375 29.25 45.375C29.5484 45.375 29.8345 45.2565 30.0455 45.0455C30.2565 44.8345 30.375 44.5484 30.375 44.25V40.125C30.375 39.8266 30.2565 39.5405 30.0455 39.3295C29.8345 39.1185 29.5484 39 29.25 39ZM31.5 35.25H30.375V27.75C30.375 27.4516 30.2565 27.1655 30.0455 26.9545C29.8345 26.7435 29.5484 26.625 29.25 26.625C28.9516 26.625 28.6655 26.7435 28.4545 26.9545C28.2435 27.1655 28.125 27.4516 28.125 27.75V35.25H27C26.7016 35.25 26.4155 35.3685 26.2045 35.5795C25.9935 35.7905 25.875 36.0766 25.875 36.375C25.875 36.6734 25.9935 36.9595 26.2045 37.1705C26.4155 37.3815 26.7016 37.5 27 37.5H31.5C31.7984 37.5 32.0845 37.3815 32.2955 37.1705C32.5065 36.9595 32.625 36.6734 32.625 36.375C32.625 36.0766 32.5065 35.7905 32.2955 35.5795C32.0845 35.3685 31.7984 35.25 31.5 35.25ZM38.25 30.75H37.125V27.75C37.125 27.4516 37.0065 27.1655 36.7955 26.9545C36.5845 26.7435 36.2984 26.625 36 26.625C35.7016 26.625 35.4155 26.7435 35.2045 26.9545C34.9935 27.1655 34.875 27.4516 34.875 27.75V30.75H33.75C33.4516 30.75 33.1655 30.8685 32.9545 31.0795C32.7435 31.2905 32.625 31.5766 32.625 31.875C32.625 32.1734 32.7435 32.4595 32.9545 32.6705C33.1655 32.8815 33.4516 33 33.75 33H38.25C38.5484 33 38.8345 32.8815 39.0455 32.6705C39.2565 32.4595 39.375 32.1734 39.375 31.875C39.375 31.5766 39.2565 31.2905 39.0455 31.0795C38.8345 30.8685 38.5484 30.75 38.25 30.75Z" fill="#779BF4"/>
                      <rect x="0.5" y="0.5" width="71" height="71" rx="11.5" stroke="#779BF4"/>
                    </svg>
                }

                {windowWidth < 806 && open &&
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" fill="#779BF4" fill-opacity="1"/>
                      <path d="M25.125 23.625V32.25C25.125 32.5484 25.0065 32.8345 24.7955 33.0455C24.5845 33.2565 24.2984 33.375 24 33.375C23.7016 33.375 23.4155 33.2565 23.2045 33.0455C22.9935 32.8345 22.875 32.5484 22.875 32.25V23.625C22.875 23.3266 22.9935 23.0405 23.2045 22.8295C23.4155 22.6185 23.7016 22.5 24 22.5C24.2984 22.5 24.5845 22.6185 24.7955 22.8295C25.0065 23.0405 25.125 23.3266 25.125 23.625V23.625ZM30.75 30C30.4516 30 30.1655 30.1185 29.9545 30.3295C29.7435 30.5405 29.625 30.8266 29.625 31.125V32.25C29.625 32.5484 29.7435 32.8345 29.9545 33.0455C30.1655 33.2565 30.4516 33.375 30.75 33.375C31.0484 33.375 31.3345 33.2565 31.5455 33.0455C31.7565 32.8345 31.875 32.5484 31.875 32.25V31.125C31.875 30.8266 31.7565 30.5405 31.5455 30.3295C31.3345 30.1185 31.0484 30 30.75 30V30ZM33 26.25H31.875V15.75C31.875 15.4516 31.7565 15.1655 31.5455 14.9545C31.3345 14.7435 31.0484 14.625 30.75 14.625C30.4516 14.625 30.1655 14.7435 29.9545 14.9545C29.7435 15.1655 29.625 15.4516 29.625 15.75V26.25H28.5C28.2016 26.25 27.9155 26.3685 27.7045 26.5795C27.4935 26.7905 27.375 27.0766 27.375 27.375C27.375 27.6734 27.4935 27.9595 27.7045 28.1705C27.9155 28.3815 28.2016 28.5 28.5 28.5H33C33.2984 28.5 33.5845 28.3815 33.7955 28.1705C34.0065 27.9595 34.125 27.6734 34.125 27.375C34.125 27.0766 34.0065 26.7905 33.7955 26.5795C33.5845 26.3685 33.2984 26.25 33 26.25V26.25ZM17.25 27C16.9516 27 16.6655 27.1185 16.4545 27.3295C16.2435 27.5405 16.125 27.8266 16.125 28.125V32.25C16.125 32.5484 16.2435 32.8345 16.4545 33.0455C16.6655 33.2565 16.9516 33.375 17.25 33.375C17.5484 33.375 17.8345 33.2565 18.0455 33.0455C18.2565 32.8345 18.375 32.5484 18.375 32.25V28.125C18.375 27.8266 18.2565 27.5405 18.0455 27.3295C17.8345 27.1185 17.5484 27 17.25 27V27ZM19.5 23.25H18.375V15.75C18.375 15.4516 18.2565 15.1655 18.0455 14.9545C17.8345 14.7435 17.5484 14.625 17.25 14.625C16.9516 14.625 16.6655 14.7435 16.4545 14.9545C16.2435 15.1655 16.125 15.4516 16.125 15.75V23.25H15C14.7016 23.25 14.4155 23.3685 14.2045 23.5795C13.9935 23.7905 13.875 24.0766 13.875 24.375C13.875 24.6734 13.9935 24.9595 14.2045 25.1705C14.4155 25.3815 14.7016 25.5 15 25.5H19.5C19.7984 25.5 20.0845 25.3815 20.2955 25.1705C20.5065 24.9595 20.625 24.6734 20.625 24.375C20.625 24.0766 20.5065 23.7905 20.2955 23.5795C20.0845 23.3685 19.7984 23.25 19.5 23.25ZM26.25 18.75H25.125V15.75C25.125 15.4516 25.0065 15.1655 24.7955 14.9545C24.5845 14.7435 24.2984 14.625 24 14.625C23.7016 14.625 23.4155 14.7435 23.2045 14.9545C22.9935 15.1655 22.875 15.4516 22.875 15.75V18.75H21.75C21.4516 18.75 21.1655 18.8685 20.9545 19.0795C20.7435 19.2905 20.625 19.5766 20.625 19.875C20.625 20.1734 20.7435 20.4595 20.9545 20.6705C21.1655 20.8815 21.4516 21 21.75 21H26.25C26.5484 21 26.8345 20.8815 27.0455 20.6705C27.2565 20.4595 27.375 20.1734 27.375 19.875C27.375 19.5766 27.2565 19.2905 27.0455 19.0795C26.8345 18.8685 26.5484 18.75 26.25 18.75Z" fill="#E4E9F4"/>
                      <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" stroke="#779BF4"/>
                    </svg>
                }
                {windowWidth < 806 && !open &&
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" fill="#779BF4" fill-opacity="0.15"/>
                      <path d="M25.125 23.625V32.25C25.125 32.5484 25.0065 32.8345 24.7955 33.0455C24.5845 33.2565 24.2984 33.375 24 33.375C23.7016 33.375 23.4155 33.2565 23.2045 33.0455C22.9935 32.8345 22.875 32.5484 22.875 32.25V23.625C22.875 23.3266 22.9935 23.0405 23.2045 22.8295C23.4155 22.6185 23.7016 22.5 24 22.5C24.2984 22.5 24.5845 22.6185 24.7955 22.8295C25.0065 23.0405 25.125 23.3266 25.125 23.625V23.625ZM30.75 30C30.4516 30 30.1655 30.1185 29.9545 30.3295C29.7435 30.5405 29.625 30.8266 29.625 31.125V32.25C29.625 32.5484 29.7435 32.8345 29.9545 33.0455C30.1655 33.2565 30.4516 33.375 30.75 33.375C31.0484 33.375 31.3345 33.2565 31.5455 33.0455C31.7565 32.8345 31.875 32.5484 31.875 32.25V31.125C31.875 30.8266 31.7565 30.5405 31.5455 30.3295C31.3345 30.1185 31.0484 30 30.75 30V30ZM33 26.25H31.875V15.75C31.875 15.4516 31.7565 15.1655 31.5455 14.9545C31.3345 14.7435 31.0484 14.625 30.75 14.625C30.4516 14.625 30.1655 14.7435 29.9545 14.9545C29.7435 15.1655 29.625 15.4516 29.625 15.75V26.25H28.5C28.2016 26.25 27.9155 26.3685 27.7045 26.5795C27.4935 26.7905 27.375 27.0766 27.375 27.375C27.375 27.6734 27.4935 27.9595 27.7045 28.1705C27.9155 28.3815 28.2016 28.5 28.5 28.5H33C33.2984 28.5 33.5845 28.3815 33.7955 28.1705C34.0065 27.9595 34.125 27.6734 34.125 27.375C34.125 27.0766 34.0065 26.7905 33.7955 26.5795C33.5845 26.3685 33.2984 26.25 33 26.25V26.25ZM17.25 27C16.9516 27 16.6655 27.1185 16.4545 27.3295C16.2435 27.5405 16.125 27.8266 16.125 28.125V32.25C16.125 32.5484 16.2435 32.8345 16.4545 33.0455C16.6655 33.2565 16.9516 33.375 17.25 33.375C17.5484 33.375 17.8345 33.2565 18.0455 33.0455C18.2565 32.8345 18.375 32.5484 18.375 32.25V28.125C18.375 27.8266 18.2565 27.5405 18.0455 27.3295C17.8345 27.1185 17.5484 27 17.25 27V27ZM19.5 23.25H18.375V15.75C18.375 15.4516 18.2565 15.1655 18.0455 14.9545C17.8345 14.7435 17.5484 14.625 17.25 14.625C16.9516 14.625 16.6655 14.7435 16.4545 14.9545C16.2435 15.1655 16.125 15.4516 16.125 15.75V23.25H15C14.7016 23.25 14.4155 23.3685 14.2045 23.5795C13.9935 23.7905 13.875 24.0766 13.875 24.375C13.875 24.6734 13.9935 24.9595 14.2045 25.1705C14.4155 25.3815 14.7016 25.5 15 25.5H19.5C19.7984 25.5 20.0845 25.3815 20.2955 25.1705C20.5065 24.9595 20.625 24.6734 20.625 24.375C20.625 24.0766 20.5065 23.7905 20.2955 23.5795C20.0845 23.3685 19.7984 23.25 19.5 23.25ZM26.25 18.75H25.125V15.75C25.125 15.4516 25.0065 15.1655 24.7955 14.9545C24.5845 14.7435 24.2984 14.625 24 14.625C23.7016 14.625 23.4155 14.7435 23.2045 14.9545C22.9935 15.1655 22.875 15.4516 22.875 15.75V18.75H21.75C21.4516 18.75 21.1655 18.8685 20.9545 19.0795C20.7435 19.2905 20.625 19.5766 20.625 19.875C20.625 20.1734 20.7435 20.4595 20.9545 20.6705C21.1655 20.8815 21.4516 21 21.75 21H26.25C26.5484 21 26.8345 20.8815 27.0455 20.6705C27.2565 20.4595 27.375 20.1734 27.375 19.875C27.375 19.5766 27.2565 19.2905 27.0455 19.0795C26.8345 18.8685 26.5484 18.75 26.25 18.75Z" fill="#779BF4"/>
                      <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" stroke="#779BF4"/>
                    </svg>
                }


               {/* {open ?
                    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0.5" y="0.5" width="71" height="71" rx="11.5" fill="#779BF4" fill-opacity="0.15"/>
                      <path d="M37.125 35.625V44.25C37.125 44.5484 37.0065 44.8345 36.7955 45.0455C36.5845 45.2565 36.2984 45.375 36 45.375C35.7016 45.375 35.4155 45.2565 35.2045 45.0455C34.9935 44.8345 34.875 44.5484 34.875 44.25V35.625C34.875 35.3266 34.9935 35.0405 35.2045 34.8295C35.4155 34.6185 35.7016 34.5 36 34.5C36.2984 34.5 36.5845 34.6185 36.7955 34.8295C37.0065 35.0405 37.125 35.3266 37.125 35.625ZM42.75 42C42.4516 42 42.1655 42.1185 41.9545 42.3295C41.7435 42.5405 41.625 42.8266 41.625 43.125V44.25C41.625 44.5484 41.7435 44.8345 41.9545 45.0455C42.1655 45.2565 42.4516 45.375 42.75 45.375C43.0484 45.375 43.3345 45.2565 43.5455 45.0455C43.7565 44.8345 43.875 44.5484 43.875 44.25V43.125C43.875 42.8266 43.7565 42.5405 43.5455 42.3295C43.3345 42.1185 43.0484 42 42.75 42ZM45 38.25H43.875V27.75C43.875 27.4516 43.7565 27.1655 43.5455 26.9545C43.3345 26.7435 43.0484 26.625 42.75 26.625C42.4516 26.625 42.1655 26.7435 41.9545 26.9545C41.7435 27.1655 41.625 27.4516 41.625 27.75V38.25H40.5C40.2016 38.25 39.9155 38.3685 39.7045 38.5795C39.4935 38.7905 39.375 39.0766 39.375 39.375C39.375 39.6734 39.4935 39.9595 39.7045 40.1705C39.9155 40.3815 40.2016 40.5 40.5 40.5H45C45.2984 40.5 45.5845 40.3815 45.7955 40.1705C46.0065 39.9595 46.125 39.6734 46.125 39.375C46.125 39.0766 46.0065 38.7905 45.7955 38.5795C45.5845 38.3685 45.2984 38.25 45 38.25ZM29.25 39C28.9516 39 28.6655 39.1185 28.4545 39.3295C28.2435 39.5405 28.125 39.8266 28.125 40.125V44.25C28.125 44.5484 28.2435 44.8345 28.4545 45.0455C28.6655 45.2565 28.9516 45.375 29.25 45.375C29.5484 45.375 29.8345 45.2565 30.0455 45.0455C30.2565 44.8345 30.375 44.5484 30.375 44.25V40.125C30.375 39.8266 30.2565 39.5405 30.0455 39.3295C29.8345 39.1185 29.5484 39 29.25 39ZM31.5 35.25H30.375V27.75C30.375 27.4516 30.2565 27.1655 30.0455 26.9545C29.8345 26.7435 29.5484 26.625 29.25 26.625C28.9516 26.625 28.6655 26.7435 28.4545 26.9545C28.2435 27.1655 28.125 27.4516 28.125 27.75V35.25H27C26.7016 35.25 26.4155 35.3685 26.2045 35.5795C25.9935 35.7905 25.875 36.0766 25.875 36.375C25.875 36.6734 25.9935 36.9595 26.2045 37.1705C26.4155 37.3815 26.7016 37.5 27 37.5H31.5C31.7984 37.5 32.0845 37.3815 32.2955 37.1705C32.5065 36.9595 32.625 36.6734 32.625 36.375C32.625 36.0766 32.5065 35.7905 32.2955 35.5795C32.0845 35.3685 31.7984 35.25 31.5 35.25ZM38.25 30.75H37.125V27.75C37.125 27.4516 37.0065 27.1655 36.7955 26.9545C36.5845 26.7435 36.2984 26.625 36 26.625C35.7016 26.625 35.4155 26.7435 35.2045 26.9545C34.9935 27.1655 34.875 27.4516 34.875 27.75V30.75H33.75C33.4516 30.75 33.1655 30.8685 32.9545 31.0795C32.7435 31.2905 32.625 31.5766 32.625 31.875C32.625 32.1734 32.7435 32.4595 32.9545 32.6705C33.1655 32.8815 33.4516 33 33.75 33H38.25C38.5484 33 38.8345 32.8815 39.0455 32.6705C39.2565 32.4595 39.375 32.1734 39.375 31.875C39.375 31.5766 39.2565 31.2905 39.0455 31.0795C38.8345 30.8685 38.5484 30.75 38.25 30.75Z" fill="#779BF4"/>
                      <rect x="0.5" y="0.5" width="71" height="71" rx="11.5" stroke="#779BF4"/>
                    </svg>
                    :
                    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0.5" y="0.5" width="71" height="71" rx="11.5" fill="#779BF4" fill-opacity="0.15"/>
                      <path d="M37.125 35.625V44.25C37.125 44.5484 37.0065 44.8345 36.7955 45.0455C36.5845 45.2565 36.2984 45.375 36 45.375C35.7016 45.375 35.4155 45.2565 35.2045 45.0455C34.9935 44.8345 34.875 44.5484 34.875 44.25V35.625C34.875 35.3266 34.9935 35.0405 35.2045 34.8295C35.4155 34.6185 35.7016 34.5 36 34.5C36.2984 34.5 36.5845 34.6185 36.7955 34.8295C37.0065 35.0405 37.125 35.3266 37.125 35.625ZM42.75 42C42.4516 42 42.1655 42.1185 41.9545 42.3295C41.7435 42.5405 41.625 42.8266 41.625 43.125V44.25C41.625 44.5484 41.7435 44.8345 41.9545 45.0455C42.1655 45.2565 42.4516 45.375 42.75 45.375C43.0484 45.375 43.3345 45.2565 43.5455 45.0455C43.7565 44.8345 43.875 44.5484 43.875 44.25V43.125C43.875 42.8266 43.7565 42.5405 43.5455 42.3295C43.3345 42.1185 43.0484 42 42.75 42ZM45 38.25H43.875V27.75C43.875 27.4516 43.7565 27.1655 43.5455 26.9545C43.3345 26.7435 43.0484 26.625 42.75 26.625C42.4516 26.625 42.1655 26.7435 41.9545 26.9545C41.7435 27.1655 41.625 27.4516 41.625 27.75V38.25H40.5C40.2016 38.25 39.9155 38.3685 39.7045 38.5795C39.4935 38.7905 39.375 39.0766 39.375 39.375C39.375 39.6734 39.4935 39.9595 39.7045 40.1705C39.9155 40.3815 40.2016 40.5 40.5 40.5H45C45.2984 40.5 45.5845 40.3815 45.7955 40.1705C46.0065 39.9595 46.125 39.6734 46.125 39.375C46.125 39.0766 46.0065 38.7905 45.7955 38.5795C45.5845 38.3685 45.2984 38.25 45 38.25ZM29.25 39C28.9516 39 28.6655 39.1185 28.4545 39.3295C28.2435 39.5405 28.125 39.8266 28.125 40.125V44.25C28.125 44.5484 28.2435 44.8345 28.4545 45.0455C28.6655 45.2565 28.9516 45.375 29.25 45.375C29.5484 45.375 29.8345 45.2565 30.0455 45.0455C30.2565 44.8345 30.375 44.5484 30.375 44.25V40.125C30.375 39.8266 30.2565 39.5405 30.0455 39.3295C29.8345 39.1185 29.5484 39 29.25 39ZM31.5 35.25H30.375V27.75C30.375 27.4516 30.2565 27.1655 30.0455 26.9545C29.8345 26.7435 29.5484 26.625 29.25 26.625C28.9516 26.625 28.6655 26.7435 28.4545 26.9545C28.2435 27.1655 28.125 27.4516 28.125 27.75V35.25H27C26.7016 35.25 26.4155 35.3685 26.2045 35.5795C25.9935 35.7905 25.875 36.0766 25.875 36.375C25.875 36.6734 25.9935 36.9595 26.2045 37.1705C26.4155 37.3815 26.7016 37.5 27 37.5H31.5C31.7984 37.5 32.0845 37.3815 32.2955 37.1705C32.5065 36.9595 32.625 36.6734 32.625 36.375C32.625 36.0766 32.5065 35.7905 32.2955 35.5795C32.0845 35.3685 31.7984 35.25 31.5 35.25ZM38.25 30.75H37.125V27.75C37.125 27.4516 37.0065 27.1655 36.7955 26.9545C36.5845 26.7435 36.2984 26.625 36 26.625C35.7016 26.625 35.4155 26.7435 35.2045 26.9545C34.9935 27.1655 34.875 27.4516 34.875 27.75V30.75H33.75C33.4516 30.75 33.1655 30.8685 32.9545 31.0795C32.7435 31.2905 32.625 31.5766 32.625 31.875C32.625 32.1734 32.7435 32.4595 32.9545 32.6705C33.1655 32.8815 33.4516 33 33.75 33H38.25C38.5484 33 38.8345 32.8815 39.0455 32.6705C39.2565 32.4595 39.375 32.1734 39.375 31.875C39.375 31.5766 39.2565 31.2905 39.0455 31.0795C38.8345 30.8685 38.5484 30.75 38.25 30.75Z" fill="#779BF4"/>
                      <rect x="0.5" y="0.5" width="71" height="71" rx="11.5" stroke="#779BF4"/>
                    </svg>
                }*/}

              </IconButton>
            </div>
          </div>
          <Popover
            classes={{
              paper: [classes.popoverPaper, classes[`popoverPaper--${appTheme}`]].join(' '),
            }}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClosePopover}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}>
            <div className={[classes.filterContainer, classes[`filterContainer--${appTheme}`]].join(' ')}>
              <div style={{
                display: 'flex',
                alignItems: 'start',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}>
                <Typography className={[classes.filterListTitle, classes[`filterListTitle--${appTheme}`]].join(' ')}>
                  Filters
                </Typography>

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
                      marginTop: 4,
                    }}
                    onClick={handleClick}
                >
                  <Close
                      style={{
                        // color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
                        fontSize: 14,
                      }}
                  />
                </span>
              </div>

              <div
                className={[classes.filterItem, classes[`filterItem--${appTheme}`], 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                <Typography className={[classes.filterLabel, classes[`filterLabel--${appTheme}`]].join(' ')}>
                  Active Gauges
                </Typography>

                <SwitchCustom
                  checked={toggleActiveGauge}
                  name={'toggleActiveGauge'}
                  onChange={onToggle}
                />
              </div>

              <div
                className={[classes.filterItem, classes[`filterItem--${appTheme}`], 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                <Typography className={[classes.filterLabel, classes[`filterLabel--${appTheme}`]].join(' ')}>
                  Stable Pools
                </Typography>

                <SwitchCustom
                  checked={toggleStable}
                  name={'toggleStable'}
                  onChange={onToggle}
                />
              </div>

              <div
                className={[classes.filterItem, classes[`filterItem--${appTheme}`], 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                <Typography className={[classes.filterLabel, classes[`filterLabel--${appTheme}`]].join(' ')}>
                  Volatile Pools
                </Typography>

                <SwitchCustom
                  checked={toggleVariable}
                  name={'toggleVariable'}
                  onChange={onToggle}
                />
              </div>
            </div>
          </Popover>
        </div>

        <TextField
          // className={classes.searchInput}
          className={classes.textSearchField}
          variant="outlined"
          fullWidth
          placeholder="Type name or paste the address"
          value={search}
          onChange={onSearchChanged}
          InputProps={{
            style: {
              background: appTheme === "dark" ? '#151718' : '#DBE6EC',
              border: '1px solid',
              borderColor: appTheme === "dark" ? '#5F7285' : '#86B9D6',
              borderRadius: 12,
              paddingLeft: 8,
            },
            classes: {
              root: classes.searchInput,
            },
            endAdornment: <InputAdornment position="end">
              {/*Search icon*/}
              <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.5 20C15.7467 20 20 15.7467 20 10.5C20 5.25329 15.7467 1 10.5 1C5.25329 1 1 5.25329 1 10.5C1 15.7467 5.25329 20 10.5 20Z" stroke="#779BF4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div style={{position: 'relative'}}>
                <svg style={{position: 'absolute', top: 8, right: 0,}} width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3L1 1" stroke="#779BF4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </InputAdornment>,
          }}
          inputProps={{
            style: {
              padding: 11.5,
              borderRadius: 0,
              border: 'none',
              fontSize: 18,
              fontWeight: 400,
              lineHeight: '120%',
              color: appTheme === "dark" ? '#C6CDD2' : '#325569',
            },
          }}
        />
      </div>

      <div className={classes.sidebar}>
        <div className={[classes.myDeposits, classes[`myDeposits--${appTheme}`]].join(' ')}>
          <div
              style={{
                marginRight: 10,
              }}>
            <SwitchCustom
                checked={toggleActive}
                onChange={onToggle}
                name={'toggleActive'}
            />
          </div>

          <Typography
              className={classes.myDepositsText}
          >
            <span
                style={{
                  // fontSize: 'inherit',
                  // fontWeight: 500,
                  paddingRight: 4,
                }}>
              Show only my Deposits
            </span>
          </Typography>
        </div>
        {windowWidth < 1332 && (
            <div style={{width: '100%',}} />
        )}
        <div
            className={[classes.addButton, classes[`addButton--${appTheme}`]].join(' ')}
            onClick={onCreate}
        >
          <Typography className={[classes.actionButtonText,].join(' ')}>
            Add Liquidity
          </Typography>
        </div>

        <div
            className={[classes.withdrawButton,].join(' ')}
            onClick={onWithdraw}
        >
          <Typography className={[classes.actionButtonWithdrawText,].join(' ')}>
            WITHDRAW LIQUIDITY
          </Typography>
        </div>
      </div>
    </Toolbar>
  );
};

export default function EnhancedTable({pairs, isLoading}) {
  const classes = useStyles();
  const router = useRouter();

  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('tvl');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const localToggles = getLocalToggles();

  const [search, setSearch] = useState('');
  const [toggleActive, setToggleActive] = useState(localToggles.toggleActive);
  const [toggleActiveGauge, setToggleActiveGauge] = useState(localToggles.toggleActiveGauge);
  const [toggleStable, setToggleStable] = useState(localToggles.toggleStable);
  const [toggleVariable, setToggleVariable] = useState(localToggles.toggleVariable);
  const [showSearch, setShowSearch] = useState(localToggles.showSearch);
  const [tableHeight, setTableHeight] = useState(window.innerHeight - 50 - 124 - 30 - 60 - 54 - 20 - 30);
  const [expanded, setExpanded] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';

    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  if (!pairs) {
    return (
      <div className={classes.root}>
        <Skeleton variant="rect" width={'100%'} height={40} className={classes.skelly1}/>
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly}/>
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly}/>
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly}/>
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly}/>
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly}/>
      </div>
    );
  }

  const onView = (pair) => {
    router.push(`/liquidity/${pair.address}`);
  };

  const renderTooltip = (pair) => {
    return (
      <div>
        <Typography>Ve Emissions</Typography>
        <Typography>0.00</Typography>
      </div>
    );
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredPairs = pairs.filter((pair) => {
    if (!search || search === '') {
      return true;
    }

    const searchLower = search.toLowerCase();

    return pair.symbol.toLowerCase().includes(searchLower)
      || pair.address.toLowerCase().includes(searchLower)
      || pair.token0.symbol.toLowerCase().includes(searchLower)
      || pair.token0.address.toLowerCase().includes(searchLower)
      || pair.token0.name.toLowerCase().includes(searchLower)
      || pair.token1.symbol.toLowerCase().includes(searchLower)
      || pair.token1.address.toLowerCase().includes(searchLower)
      || pair.token1.name.toLowerCase().includes(searchLower);
  }).filter((pair) => {
    if (toggleStable !== true && pair.isStable === true) {
      return false;
    }
    if (toggleVariable !== true && pair.isStable === false) {
      return false;
    }
    // if(toggleActiveGauge === true && (!pair.gauge || !pair.gauge.address)) {
    //   return false
    // }
    if (toggleActive === true) {
      if (BigNumber(pair?.gauge?.balance).gt(0)) {
        return true;
      }
    }
    if (toggleActive === true) {
      if (!BigNumber(pair?.balance).gt(0)) {
        return false;
      }
    }


    return true;
  });

  const {appTheme} = useAppThemeContext();

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
    setTableHeight(window.innerHeight - 50 - 124 - 30 - 60 - 54 - 20 - 30);
  });

  const handleChangeAccordion = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  return (
    <div
      className={[classes.tableWrapper, 'g-flex-column__item', 'g-flex-column'].join(' ')}
      style={{
        // overflowY: 'initial'/*windowWidth <= 400 ? 'auto' : 'hidden'*/,
        // paddingLeft: windowWidth > 1200 ? 400 : 0,
      }}
    >
      <EnhancedTableToolbar
        setSearch={setSearch}
        setToggleActive={setToggleActive}
        setToggleActiveGauge={setToggleActiveGauge}
        setToggleStable={setToggleStable}
        setToggleVariable={setToggleVariable}
        setShowSearch={setShowSearch}
        handleRequestSort={handleRequestSort}
        setSortDirection={setSortDirection}/>

      {windowWidth > 806 && windowWidth < 1333 &&
          <div className={classes.infoContainer}>
            <span className={classes.infoContainerWarn}>!</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z" fill="#779BF4"/>
            </svg>
            <span className={classes.infoContainerText}>Use horizontal scroll to navigate the table</span>
          </div>
      }
      {windowWidth > 806 &&
        <>
          <div
            className={classes.tableContWrapper}
          >
            <TableContainer
              className={'g-flex-column__item'}
              style={{
                overflow: 'auto',
                maxHeight: tableHeight,
                height: 'auto',
                background: appTheme === 'dark' ? '#24292D' : '#dbe6ec',
              }}>
              <Table
                stickyHeader
                className={classes.table}
                aria-labelledby="tableTitle"
                size={'medium'}
                aria-label="enhanced table">
                <EnhancedTableHead
                  classes={classes}
                  order={order}
                  orderBy={orderBy}
                  onRequestSort={handleRequestSort}
                />
                {filteredPairs.length === 0 && !isLoading && (
                  <TableBody>
                    <tr>
                      <td colSpan="7">
                        <TableBodyPlaceholder message="You have not added any liquidity yet"/>
                      </td>
                    </tr>
                  </TableBody>
                )}

                {filteredPairs.length === 0 && isLoading && (
                  <TableBody>
                    <tr>
                      <td colSpan="7">
                        <TableBodyPlaceholder message="Loading your Deposit from the blockchain, please wait"/>
                      </td>
                    </tr>
                  </TableBody>
                )}

                <TableBody>
                  {stableSort(filteredPairs, getComparator(order, orderBy))
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => {
                      if (!row) {
                        return null;
                      }
                      const labelId = `enhanced-table-checkbox-${index}`;

                      return (
                        <TableRow
                          key={labelId}
                          className={classes.assetTableRow}>
                          <StickyTableCell
                            style={{
                              background: '#171D2D',
                              borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                              borderRight: windowWidth < 1333 ? '1px solid #D3F85A' : 'none',
                            }}
                            className={classes.cell}>
                            <div className={classes.inline}>
                              <div className={classes.doubleImages}>
                                <div
                                  className={[classes.imgLogoContainer, classes[`imgLogoContainer--${appTheme}`]].join(' ')}>
                                  <img
                                    className={classes.imgLogo}
                                    src={(row && row.token0 && row.token0.logoURI) ? row.token0.logoURI : ``}
                                    width="37"
                                    height="37"
                                    alt=""
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                    }}
                                  />
                                </div>

                                <div
                                  className={[classes.imgLogoContainer, classes.imgLogoContainer2, classes[`imgLogoContainer--${appTheme}`]].join(' ')}>
                                  <img
                                    className={classes.imgLogo}
                                    src={(row && row.token1 && row.token1.logoURI) ? row.token1.logoURI : ``}
                                    width="37"
                                    height="37"
                                    alt=""
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                    }}
                                  />
                                </div>
                              </div>
                              <div>
                                <Typography
                                  className={classes.textSpaced}
                                  style={{
                                    fontWeight: 500,
                                    fontSize: 14,
                                    lineHeight: '120%',
                                    color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                  }}
                                  noWrap>
                                  {formatSymbol(row?.symbol)}
                                </Typography>
                                <Typography
                                  className={classes.textSpaced}
                                  style={{
                                    fontWeight: 400,
                                    fontSize: 14,
                                    lineHeight: '120%',
                                    color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                  }}
                                  noWrap>
                                  {row?.isStable ? 'Stable Pool' : 'Volatile Pool'}
                                </Typography>
                              </div>
                            </div>
                          </StickyTableCell>

                          <TableCell
                            className={[classes.cell, classes.hiddenMobile].join(' ')}
                            style={{
                              background: '#171D2D',
                              borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                              overflow: 'hidden',
                            }}
                            align="right">
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                              }}>
                              {(row && BigNumber(row.tvl).gt(0)) &&
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',

                                  }}>
                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                    }}>
                                    {BigNumber(row.tvl).toFixed(2)} <span style={{color: 'rgb(124, 131, 138)'}}>$</span>
                                  </Typography>

                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                    }}>
                                    {BigNumber(row?.gauge?.apr).gt(0) ? (
                                        <div>
                                          {`${
                                              formatCurrency(BigNumber.sum(BigNumber(row?.gauge?.apr).div(100).times(40),
                                                  BigNumber(row?.gauge?.boostedApr0),
                                                  BigNumber(row?.gauge?.boostedApr1)
                                              ),0)
                                          }-${
                                              formatCurrency(BigNumber.sum(BigNumber(row?.gauge?.apr),
                                                  BigNumber(row?.gauge?.boostedApr0),
                                                  BigNumber(row?.gauge?.boostedApr1)
                                              ),0)
                                          }`}
                                          <span style={{color: 'rgb(124, 131, 138)'}}> %</span>
                                        </div>
                                        )
                                        : '-'}
                                  </Typography>
                                </div>
                              }
                              {/*{!(row && row.token0 && row.token0.balance) &&
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    paddingLeft: 10,
                                  }}>
                                  <Skeleton
                                    variant="rect"
                                    width={120}
                                    height={16}
                                    style={{marginTop: '1px', marginBottom: '1px'}}/>
                                </div>
                              }*/}
                              {/*{(row && row.token1 && row.token1.balance) &&
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    paddingLeft: 10,
                                  }}>
                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      fontWeight: 400,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                    }}>
                                    {formatSymbol(row.token0.symbol)}
                                  </Typography>

                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      fontWeight: 400,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                    }}>
                                    {formatSymbol(row.token1.symbol)}
                                  </Typography>
                                </div>
                              }*/}
                              {/*{!(row && row.token1 && row.token1.balance) &&
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    paddingLeft: 10,
                                  }}>
                                  <Skeleton
                                    variant="rect"
                                    width={120}
                                    height={16}
                                    style={{marginTop: '1px', marginBottom: '1px'}}/>
                                </div>
                              }*/}
                            </div>
                          </TableCell>

                          <TableCell
                            className={[classes.cell, classes.hiddenMobile].join(' ')}
                            style={{
                              background: '#171D2D',
                              borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                            }}
                            align="right">
                            {(row && row.balance && row.totalSupply) &&
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                }}>
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                  }}>

                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                    }}>
                                    {formatCurrency(BigNumber(row.balance).div(row.totalSupply).times(row.reserve0))}
                                  </Typography>

                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                    }}>
                                    {formatCurrency(BigNumber(row.balance).div(row.totalSupply).times(row.reserve1))}
                                  </Typography>
                                </div>

                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    paddingLeft: 10,
                                  }}>
                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      fontWeight: 400,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: '#8191B9',
                                    }}>
                                    {row.token0.symbol}
                                  </Typography>

                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      fontWeight: 400,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: '#8191B9',
                                    }}>
                                    {row.token1.symbol}
                                  </Typography>
                                </div>
                              </div>
                            }
                            {!(row && row.balance && row.totalSupply) &&
                              <div
                                className={classes.inlineEnd}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                  paddingLeft: 10,
                                }}>
                                <Skeleton
                                  variant="rect"
                                  width={120}
                                  height={16}
                                  style={{marginTop: '1px', marginBottom: '1px'}}/>
                              </div>
                            }
                          </TableCell>

                          {
                            row?.gauge?.address &&
                            <TableCell
                              className={[classes.cell, classes.hiddenMobile].join(' ')}
                              style={{
                                background: '#171D2D',
                                borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                              }}
                              align="right">

                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                }}>
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                  }}>
                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                    }}>
                                    {(row && row.gauge && row.gauge.balance && row.gauge.totalSupply) ? formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve0)) : "0.00"}
                                  </Typography>

                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                    }}>
                                    {(row && row.gauge && row.gauge.balance && row.gauge.totalSupply) ? formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve1)) : "0.00"}
                                  </Typography>
                                </div>

                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    paddingLeft: 10,
                                  }}>
                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      fontWeight: 400,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: '#8191B9',
                                    }}>
                                    {formatSymbol(row.token0.symbol)}
                                  </Typography>

                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      fontWeight: 400,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: '#8191B9',
                                    }}>
                                    {formatSymbol(row.token1.symbol)}
                                  </Typography>
                                </div>
                              </div>

                              {/* {!(row && row.gauge && row.gauge.balance && row.gauge.totalSupply) &&
                                  <div
                                    className={classes.inlineEnd}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-end',
                                      paddingLeft: 10,
                                    }}>
                                    <Skeleton
                                      variant="rect"
                                      width={120}
                                      height={16}
                                      style={{
                                        marginTop: '1px',
                                        marginBottom: '1px',
                                      }}/>
                                  </div>
                                } */}
                            </TableCell>
                          }

                          {
                            !row?.gauge?.address &&
                            <TableCell
                              className={[classes.cell, classes.hiddenMobile].join(' ')}
                              style={{
                                background: '#171D2D',
                                borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                              }}
                              align="right">
                              <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 500,
                                  fontSize: 14,
                                  lineHeight: '120%',
                                  color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                  whiteSpace: 'nowrap',
                                }}>
                                No gauge
                              </Typography>
                            </TableCell>
                          }

                          <TableCell
                            className={[classes.cell, classes.hiddenSmallMobile].join(' ')}
                            style={{
                              background: '#171D2D',
                              borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                            }}
                            align="right">
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                              }}>
                              {(row && row.reserve0 && row.token0) &&
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                  }}>
                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                      whiteSpace: 'nowrap',
                                    }}>
                                    {formatCurrency(row.reserve0)}
                                  </Typography>

                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                      whiteSpace: 'nowrap',
                                    }}>
                                    {formatCurrency(row.reserve1)}
                                  </Typography>
                                </div>
                              }
                              {!(row && row.reserve0 && row.token0) &&
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    paddingLeft: 10,
                                  }}>
                                  <Skeleton
                                    variant="rect"
                                    width={120}
                                    height={16}
                                    style={{marginTop: '1px', marginBottom: '1px'}}/>
                                </div>
                              }
                              {(row && row.reserve1 && row.token1) &&
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    paddingLeft: 10,
                                  }}>
                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      fontWeight: 400,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: '#8191B9',
                                    }}>
                                    {formatSymbol(row.token0.symbol)}
                                  </Typography>

                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      fontWeight: 400,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: '#8191B9',
                                    }}>
                                    {formatSymbol(row.token1.symbol)}
                                  </Typography>
                                </div>
                              }
                              {!(row && row.reserve1 && row.token1) &&
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    paddingLeft: 10,
                                  }}>
                                  <Skeleton
                                    variant="rect"
                                    width={120}
                                    height={16}
                                    style={{marginTop: '1px', marginBottom: '1px'}}/>
                                </div>
                              }
                            </div>
                          </TableCell>

                          {
                            row?.gauge?.address &&
                            <TableCell
                              className={[classes.cell, classes.hiddenMobile].join(' ')}
                              style={{
                                background: '#171D2D',
                                borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                              }}
                              align="right">
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                }}>
                                {(row && row.gauge && row.gauge.reserve0 && row.token0) &&
                                  <div
                                    className={classes.inlineEnd}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-end',
                                    }}>
                                    <Typography
                                      className={classes.textSpaced}
                                      style={{
                                        fontWeight: 500,
                                        fontSize: 14,
                                        lineHeight: '120%',
                                        color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                        whiteSpace: 'nowrap',
                                      }}>
                                      {formatCurrency(row.gauge.reserve0)}
                                    </Typography>

                                    <Typography
                                      className={classes.textSpaced}
                                      style={{
                                        fontWeight: 500,
                                        fontSize: 14,
                                        lineHeight: '120%',
                                        color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                        whiteSpace: 'nowrap',
                                      }}>
                                      {formatCurrency(row.gauge.reserve1)}
                                    </Typography>
                                  </div>
                                }
                                {!(row && row.gauge && row.gauge.reserve0 && row.token0) &&
                                  <div
                                    className={classes.inlineEnd}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-end',
                                      paddingLeft: 10,
                                    }}>
                                    <Skeleton
                                      variant="rect"
                                      width={120}
                                      height={16}
                                      style={{marginTop: '1px', marginBottom: '1px'}}/>
                                  </div>
                                }
                                {(row && row.gauge && row.gauge.reserve1 && row.token1) &&
                                  <div
                                    className={classes.inlineEnd}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-end',
                                      paddingLeft: 10,
                                    }}>
                                    <Typography
                                      className={`${classes.textSpaced} ${classes.symbol}`}
                                      style={{
                                        fontWeight: 400,
                                        fontSize: 14,
                                        lineHeight: '120%',
                                        color: '#8191B9',
                                      }}>
                                      {formatSymbol(row.token0.symbol)}
                                    </Typography>

                                    <Typography
                                      className={`${classes.textSpaced} ${classes.symbol}`}
                                      style={{
                                        fontWeight: 400,
                                        fontSize: 14,
                                        lineHeight: '120%',
                                        color: '#8191B9',
                                      }}>
                                      {formatSymbol(row.token1.symbol)}
                                    </Typography>
                                  </div>
                                }
                                {!(row && row.gauge && row.gauge.reserve1 && row.token1) &&
                                  <div
                                    className={classes.inlineEnd}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-end',
                                      paddingLeft: 10,
                                    }}>
                                    <Skeleton
                                      variant="rect"
                                      width={120}
                                      height={16}
                                      style={{marginTop: '1px', marginBottom: '1px'}}/>
                                  </div>
                                }
                              </div>
                            </TableCell>
                          }

                          {
                            !row?.gauge?.address &&
                            <TableCell
                              className={[classes.cell, classes.hiddenMobile].join(' ')}
                              style={{
                                background: '#171D2D',
                                borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                              }}
                              align="right">
                              <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 500,
                                  fontSize: 14,
                                  lineHeight: '120%',
                                  color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                  whiteSpace: 'nowrap',
                                }}>
                                No gauge
                              </Typography>
                            </TableCell>
                          }

                          <TableCell
                            className={classes.cell}
                            style={{
                              background: '#171D2D',
                              borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                            }}
                            align="right">
                            <Button
                              variant="outlined"
                              color="primary"
                              style={{
                                padding: '7px 14px',
                                border: `1px solid #D3F85A`,
                                borderRadius: 12,
                                fontWeight: 600,
                                fontSize: 14,
                                lineHeight: '120%',
                                color: '#D3F85A',
                              }}
                              onClick={() => {
                                onView(row);
                              }}>
                              {BigNumber(row?.balance).gt(0) || BigNumber(row?.gauge?.balance).gt(0) ? 'EDIT' : 'ADD'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              className={'g-flex-column__item-fixed'}
              style={{
                width: '100%',
                // marginTop: 20,
                padding: '0 30px',
                background: '#060B17',
                borderTop: '1px solid #d3f85a',
                height: 70,
                display: 'flex',
                justifyContent: 'flex-end',
                // borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
                // borderRadius: 100,
                color: '#8191B9',
              }}
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredPairs.length}
              rowsPerPage={rowsPerPage}
              page={page}
              labelRowsPerPage={window.innerWidth < 550 ? null : 'Rows per page:'}
              rowsPerPageOptions={window.innerWidth < 435 ? [] : [5, 10, 25]}
              ActionsComponent={TablePaginationActions}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </div>
        </>
      }

      {windowWidth <= 800 &&
        <div
          style={{
            overflowY: windowWidth > 400 ? 'auto' : 'visible',
            marginTop: 20,
          }}>
          {stableSort(filteredPairs, getComparator(order, orderBy))
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row, index) => {
              if (!row) {
                return null;
              }
              const labelId = `accordion-${index}`;

              return (
                <Accordion
                  key={labelId}
                  style={{
                    margin: 0,
                    marginBottom: 20,
                    background: '#171D2D',
                    border: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                    borderRadius: 12,
                  }}
                  disableGutters={true}
                  expanded={expanded === labelId}
                  onChange={handleChangeAccordion(labelId)}>
                  <AccordionSummary
                    style={{
                      padding: 0,
                      borderRadius: 12,
                    }}
                    classes={{
                      content: classes.accordionSummaryContent,
                    }}
                    expandIcon={null}
                    aria-controls="panel1a-content">
                    <div className={['g-flex-column', 'g-flex-column__item'].join(' ')}>
                      <div
                        style={{
                          padding: '15px 20px',
                        }}
                        className={['g-flex', 'g-flex--align-center'].join(' ')}>
                        <div className={classes.doubleImages}>
                          <div
                            className={[classes.imgLogoContainer, classes[`imgLogoContainer--${appTheme}`]].join(' ')}>
                            <img
                              className={classes.imgLogo}
                              src={(row && row.token0 && row.token0.logoURI) ? row.token0.logoURI : ``}
                              width="37"
                              height="37"
                              alt=""
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                              }}
                            />
                          </div>

                          <div
                            className={[classes.imgLogoContainer, classes.imgLogoContainer2, classes[`imgLogoContainer--${appTheme}`]].join(' ')}>
                            <img
                              className={classes.imgLogo}
                              src={(row && row.token1 && row.token1.logoURI) ? row.token1.logoURI : ``}
                              width="37"
                              height="37"
                              alt=""
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <Typography
                            className={classes.textSpaced}
                            style={{
                              fontWeight: 500,
                              fontSize: 16,
                              lineHeight: '120%',
                              color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                            }}
                            noWrap>
                            {formatSymbol(row?.symbol)}
                          </Typography>
                          <Typography
                            className={classes.textSpaced}
                            style={{
                              fontWeight: 400,
                              fontSize: 14,
                              lineHeight: '120%',
                              color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                            }}
                            noWrap>
                            {row?.isStable ? 'Stable Pool' : 'Volatile Pool'}
                          </Typography>
                        </div>
                      </div>

                      <div
                        style={{
                          borderTop: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                          borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                        }}
                        className={['g-flex', 'g-flex--align-center'].join(' ')}>
                        <div
                          style={{
                            width: '50%',
                            borderRight: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                          }}>
                          <Typography
                            className={classes.cellHeadPaddings}
                            style={{
                              background: appTheme === 'dark' ? '#151718' : '#CFE5F2',
                              fontWeight: 500,
                              fontSize: 12,
                              lineHeight: '120%',
                              borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                              color: appTheme === 'dark' ? '#C6CDD2' : '#325569',
                            }}
                            noWrap>
                            Action
                          </Typography>

                          <div className={classes.cellPaddings}>
                            <Button
                              variant="outlined"
                              color="primary"
                              style={{
                                padding: '10px 18px',
                                border: `1px solid #D3F85A`,
                                borderRadius: 12,
                                fontWeight: 600,
                                fontSize: 14,
                                lineHeight: '16px',
                                color: '#D3F85A',
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();

                                onView(row);
                              }}>
                              {BigNumber(row?.balance).gt(0) || BigNumber(row?.gauge?.balance).gt(0) ? 'EDIT' : 'ADD'}
                            </Button>
                          </div>
                        </div>

                        <div
                          style={{
                            width: '50%',
                          }}>
                          <Typography
                            className={classes.cellHeadPaddings}
                            style={{
                              background: appTheme === 'dark' ? '#151718' : '#CFE5F2',
                              fontWeight: 500,
                              fontSize: 14,
                              lineHeight: '120%',
                              borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                              color: '#8191B9',
                              textAlign: 'right',
                            }}
                            noWrap>
                            TVL / APR
                          </Typography>

                          <div
                            className={classes.cellPaddings}
                            style={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                            }}>
                            <div
                              className={classes.inlineEnd}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                              }}>
                              <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 500,
                                  fontSize: 14,
                                  lineHeight: '120%',
                                  color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                  whiteSpace: 'nowrap',
                                }}>
                                {BigNumber(row?.tvl).gt(0) ? BigNumber(row?.tvl).toFixed(2) : '-'}
                              </Typography>

                              <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 500,
                                  fontSize: 14,
                                  lineHeight: '120%',
                                  color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                  whiteSpace: 'nowrap',
                                }}>
                                {BigNumber(row?.gauge?.apr).gt(0) ? `${
                                    formatCurrency(BigNumber.sum(BigNumber(row?.gauge?.apr).div(100).times(40),
                                        BigNumber(row?.gauge?.boostedApr0),
                                        BigNumber(row?.gauge?.boostedApr1)
                                    ),0)
                                }-${
                                    formatCurrency(BigNumber.sum(BigNumber(row?.gauge?.apr),
                                        BigNumber(row?.gauge?.boostedApr0),
                                        BigNumber(row?.gauge?.boostedApr1)
                                    ),0)
                                }%` : '-'}
                              </Typography>
                            </div>

                            <div
                              className={classes.inlineEnd}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                paddingLeft: 10,
                              }}>
                              <Typography
                                className={`${classes.textSpaced} ${classes.symbol}`}
                                style={{
                                  fontWeight: 400,
                                  fontSize: 14,
                                  lineHeight: '120%',
                                  color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                }}>
                                $
                              </Typography>

                              <Typography
                                className={`${classes.textSpaced} ${classes.symbol}`}
                                style={{
                                  fontWeight: 400,
                                  fontSize: 14,
                                  lineHeight: '120%',
                                  color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                }}>
                                %
                              </Typography>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          background: appTheme === 'dark' ? '#151718' : '#9BC9E4',
                        }}
                        className={[classes.cellHeadPaddings, 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                        <Typography
                          style={{
                            fontWeight: 500,
                            fontSize: 14,
                            lineHeight: '16px',
                            color: '#779BF4',
                          }}
                          noWrap>
                          {expanded !== labelId ? 'Show' : 'Hide'} details
                        </Typography>

                        {expanded !== labelId &&
                          <ExpandMore
                            style={{
                              color: appTheme === 'dark' ? '#4CADE6' : '#0B5E8E',
                            }}/>
                        }

                        {expanded === labelId &&
                          <ExpandLess
                            style={{
                              color: appTheme === 'dark' ? '#4CADE6' : '#0B5E8E',
                            }}/>
                        }
                      </div>
                    </div>
                  </AccordionSummary>

                  <AccordionDetails
                    style={{
                      padding: 0,
                    }}>
                    {headCells.map((headCell) => (
                      <>
                        {!headCell.isHideInDetails &&
                          <div
                            style={{
                              height: 56,
                              borderTop: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                            }}
                            className={['g-flex', 'g-flex--align-center'].join(' ')}>
                            <Typography
                              className={classes.cellHeadPaddings}
                              style={{
                                width: '50%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                fontWeight: 500,
                                fontSize: 12,
                                lineHeight: '120%',
                                color: appTheme === 'dark' ? '#C6CDD2' : '#325569',
                                borderRight: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                              }}
                              noWrap>
                              {headCell.label}
                            </Typography>

                            <div
                              className={classes.cellPaddings}
                              style={{
                                width: '50%',
                                display: 'flex',
                                justifyContent: 'flex-end',
                              }}>
                              <div
                                className={classes.inlineEnd}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                }}>
                                <Typography
                                  className={classes.textSpaced}
                                  style={{
                                    fontWeight: 500,
                                    fontSize: 14,
                                    lineHeight: '120%',
                                    color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                    whiteSpace: 'nowrap',
                                  }}>
                                  {headCell.id === 'poolAmount' && formatCurrency(row.reserve0)}
                                  {headCell.id === 'poolBalance' && formatCurrency(BigNumber(row.balance).div(row.totalSupply).times(row.reserve0))}
                                  {headCell.id === 'stakedBalance' && row?.gauge?.address && formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve0))}
                                  {headCell.id === 'stakedBalance' && !row?.gauge?.address && 'No gauge'}
                                  {headCell.id === 'stakedAmount' && row?.gauge?.address && formatCurrency(row.gauge.reserve0)}
                                  {headCell.id === 'stakedAmount' && !row?.gauge?.address && 'No gauge'}
                                </Typography>

                                <Typography
                                  className={classes.textSpaced}
                                  style={{
                                    fontWeight: 500,
                                    fontSize: 14,
                                    lineHeight: '120%',
                                    color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                    whiteSpace: 'nowrap',
                                  }}>
                                  {headCell.id === 'poolAmount' && formatCurrency(row.reserve1)}
                                  {headCell.id === 'poolBalance' && formatCurrency(BigNumber(row.balance).div(row.totalSupply).times(row.reserve1))}
                                  {headCell.id === 'stakedBalance' && row?.gauge?.address && formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve1))}
                                  {headCell.id === 'stakedBalance' && !row?.gauge?.address && 'No gauge'}
                                  {headCell.id === 'stakedAmount' && row?.gauge?.address && formatCurrency(row.gauge.reserve1)}
                                  {headCell.id === 'stakedAmount' && !row?.gauge?.address && 'No gauge'}
                                </Typography>
                              </div>

                              <div
                                className={classes.inlineEnd}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                  paddingLeft: 10,
                                }}>
                                <Typography
                                  className={`${classes.textSpaced} ${classes.symbol}`}
                                  style={{
                                    fontWeight: 400,
                                    fontSize: 14,
                                    lineHeight: '120%',
                                    color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                  }}>
                                  {formatSymbol(row.token0.symbol)}
                                </Typography>

                                <Typography
                                  className={`${classes.textSpaced} ${classes.symbol}`}
                                  style={{
                                    fontWeight: 400,
                                    fontSize: 14,
                                    lineHeight: '120%',
                                    color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                  }}>
                                  {formatSymbol(row.token1.symbol)}
                                </Typography>
                              </div>
                            </div>
                          </div>
                        }
                      </>
                    ))}
                  </AccordionDetails>
                </Accordion>
              );
            })
          }

          {filteredPairs.length === 0 && !isLoading && (
              <div className={classes.mobmsg}>
                You have not added any liquidity yet
              </div>
          )}

          {filteredPairs.length === 0 && isLoading && (
              <div className={classes.mobmsg}>
                <svg style={{marginRight: 16,}} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 0C10.2652 0 10.5196 0.105357 10.7071 0.292893C10.8946 0.48043 11 0.734784 11 1V4C11 4.26522 10.8946 4.51957 10.7071 4.70711C10.5196 4.89464 10.2652 5 10 5C9.73478 5 9.48043 4.89464 9.29289 4.70711C9.10536 4.51957 9 4.26522 9 4V1C9 0.734784 9.10536 0.48043 9.29289 0.292893C9.48043 0.105357 9.73478 0 10 0ZM10 15C10.2652 15 10.5196 15.1054 10.7071 15.2929C10.8946 15.4804 11 15.7348 11 16V19C11 19.2652 10.8946 19.5196 10.7071 19.7071C10.5196 19.8946 10.2652 20 10 20C9.73478 20 9.48043 19.8946 9.29289 19.7071C9.10536 19.5196 9 19.2652 9 19V16C9 15.7348 9.10536 15.4804 9.29289 15.2929C9.48043 15.1054 9.73478 15 10 15ZM20 10C20 10.2652 19.8946 10.5196 19.7071 10.7071C19.5196 10.8946 19.2652 11 19 11H16C15.7348 11 15.4804 10.8946 15.2929 10.7071C15.1054 10.5196 15 10.2652 15 10C15 9.73478 15.1054 9.48043 15.2929 9.29289C15.4804 9.10536 15.7348 9 16 9H19C19.2652 9 19.5196 9.10536 19.7071 9.29289C19.8946 9.48043 20 9.73478 20 10ZM5 10C5 10.2652 4.89464 10.5196 4.70711 10.7071C4.51957 10.8946 4.26522 11 4 11H1C0.734784 11 0.48043 10.8946 0.292893 10.7071C0.105357 10.5196 0 10.2652 0 10C0 9.73478 0.105357 9.48043 0.292893 9.29289C0.48043 9.10536 0.734784 9 1 9H4C4.26522 9 4.51957 9.10536 4.70711 9.29289C4.89464 9.48043 5 9.73478 5 10ZM17.071 17.071C16.8835 17.2585 16.6292 17.3638 16.364 17.3638C16.0988 17.3638 15.8445 17.2585 15.657 17.071L13.536 14.95C13.3538 14.7614 13.253 14.5088 13.2553 14.2466C13.2576 13.9844 13.3628 13.7336 13.5482 13.5482C13.7336 13.3628 13.9844 13.2576 14.2466 13.2553C14.5088 13.253 14.7614 13.3538 14.95 13.536L17.071 15.656C17.164 15.7489 17.2377 15.8592 17.2881 15.9806C17.3384 16.102 17.3643 16.2321 17.3643 16.3635C17.3643 16.4949 17.3384 16.625 17.2881 16.7464C17.2377 16.8678 17.164 16.9781 17.071 17.071ZM6.464 6.464C6.27647 6.65147 6.02216 6.75679 5.757 6.75679C5.49184 6.75679 5.23753 6.65147 5.05 6.464L2.93 4.344C2.74236 4.15649 2.63689 3.90212 2.6368 3.63685C2.6367 3.37158 2.74199 3.11714 2.9295 2.9295C3.11701 2.74186 3.37138 2.63639 3.63665 2.6363C3.90192 2.6362 4.15636 2.74149 4.344 2.929L6.464 5.05C6.65147 5.23753 6.75679 5.49184 6.75679 5.757C6.75679 6.02216 6.65147 6.27647 6.464 6.464ZM2.93 17.071C2.74253 16.8835 2.63721 16.6292 2.63721 16.364C2.63721 16.0988 2.74253 15.8445 2.93 15.657L5.051 13.536C5.14325 13.4405 5.25359 13.3643 5.3756 13.3119C5.4976 13.2595 5.62882 13.2319 5.7616 13.2307C5.89438 13.2296 6.02606 13.2549 6.14895 13.3052C6.27185 13.3555 6.3835 13.4297 6.4774 13.5236C6.57129 13.6175 6.64554 13.7291 6.69582 13.852C6.7461 13.9749 6.7714 14.1066 6.77025 14.2394C6.7691 14.3722 6.74151 14.5034 6.6891 14.6254C6.63669 14.7474 6.56051 14.8578 6.465 14.95L4.345 17.071C4.25213 17.164 4.14184 17.2377 4.02044 17.2881C3.89904 17.3384 3.76892 17.3643 3.6375 17.3643C3.50608 17.3643 3.37596 17.3384 3.25456 17.2881C3.13316 17.2377 3.02287 17.164 2.93 17.071ZM13.536 6.464C13.3485 6.27647 13.2432 6.02216 13.2432 5.757C13.2432 5.49184 13.3485 5.23753 13.536 5.05L15.656 2.929C15.8435 2.74136 16.0979 2.63589 16.3631 2.6358C16.6284 2.6357 16.8829 2.74099 17.0705 2.9285C17.2581 3.11601 17.3636 3.37038 17.3637 3.63565C17.3638 3.90092 17.2585 4.15536 17.071 4.343L14.95 6.464C14.7625 6.65147 14.5082 6.75679 14.243 6.75679C13.9778 6.75679 13.7235 6.65147 13.536 6.464Z" fill="#E4E9F4"/>
                </svg>
                <div>
                  Loading your Deposit from the blockchain, please wait
                </div>
              </div>
          )}

          {filteredPairs.length > 0 &&
              <TablePagination
                  className={'g-flex-column__item-fixed'}
                  style={{
                    width: '100%',
                    marginTop: 20,
                    padding: '0 30px',
                    background: '#060B17',
                    borderRadius: 12,
                    color: '#8191B9',
                  }}
                  classes={{
                    displayedRows: classes.displayedRows,
                  }}
                  component="div"
                  count={filteredPairs.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  labelRowsPerPage={window.innerWidth < 550 ? null : 'Rows per page:'}
                  rowsPerPageOptions={window.innerWidth < 435 ? [] : [5, 10, 25]}
                  ActionsComponent={TablePaginationActions}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
              />
          }
        </div>
      }
    </div>
  );
}
