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
  AccordionDetails,
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

function descendingComparator(a, b, orderBy) {
  if (!a || !b) {
    return 0;
  }

  switch (orderBy) {
    case 'balance':

      let balanceA = BigNumber(a?.token0?.balance).plus(a?.token1?.balance).toNumber();
      let balanceB = BigNumber(b?.token0?.balance).plus(b?.token1?.balance).toNumber();

      if (BigNumber(balanceB).lt(balanceA)) {
        return -1;
      }
      if (BigNumber(balanceB).gt(balanceA)) {
        return 1;
      }
      return 0;

    case 'poolBalance':

      if (BigNumber(b?.balance).lt(a?.balance)) {
        return -1;
      }
      if (BigNumber(b?.balance).gt(a?.balance)) {
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

      let reserveAA = BigNumber(a?.gauge?.reserve0).plus(a?.gauge?.reserve1).toNumber();
      let reserveBB = BigNumber(b?.gauge?.reserve0).plus(b?.gauge?.reserve1).toNumber();

      if (BigNumber(reserveBB).lt(reserveAA)) {
        return -1;
      }
      if (BigNumber(reserveBB).gt(reserveAA)) {
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
    label: 'Pool',
    isSticky: true,
    isHideInDetails: true,
  },
  {
    id: 'balance',
    numeric: true,
    disablePadding: false,
    label: 'Wallet',
  },
  {
    id: 'poolBalance',
    numeric: true,
    disablePadding: false,
    label: 'My Pool Amount',
  },
  {
    id: 'stakedBalance',
    numeric: true,
    disablePadding: false,
    label: 'My Staked Amount',
  },
  {
    id: 'poolAmount',
    numeric: true,
    disablePadding: false,
    label: 'Total Pool Amount',
    isHideInDetails: true,
  },
  {
    id: 'stakedAmount',
    numeric: true,
    disablePadding: false,
    label: 'Total Pool Staked',
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
  zIndex: 5,
  whiteSpace: 'nowrap',
  padding: '20px 25px 15px',
}));

const StyledTableCell = styled(TableCell)(({theme, appTheme}) => ({
  background: appTheme === 'dark' ? '#24292D' : '#CFE5F2',
  width: 'auto',
  whiteSpace: 'nowrap',
  padding: '20px 25px 15px',
}));

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
          border: '1px solid #9BC9E4',
          borderColor: appTheme === 'dark' ? '#5F7285' : '#9BC9E4',
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
                      background: appTheme === 'dark' ? '#24292D' : '#CFE5F2',
                      borderBottom: '1px solid #9BC9E4',
                      borderColor: appTheme === 'dark' ? '#5F7285' : '#9BC9E4',
                      zIndex: 10,
                    }}>
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={createSortHandler(headCell.id)}>
                      <Typography
                        className={classes.headerText}
                        style={{
                          fontWeight: 600,
                          fontSize: 12,
                          lineHeight: '120%',
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
                      background: appTheme === 'dark' ? '#24292D' : '#CFE5F2',
                      borderBottom: '1px solid #9BC9E4',
                      borderColor: appTheme === 'dark' ? '#5F7285' : '#9BC9E4',
                      color: appTheme === 'dark' ? '#C6CDD2' : '#325569',
                    }}
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    padding={'normal'}
                    sortDirection={orderBy === headCell.id ? order : false}>
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      IconComponent={ArrowDropDown}
                      style={{
                        color: appTheme === 'dark' ? '#C6CDD2' : '#325569',
                      }}
                      onClick={createSortHandler(headCell.id)}>
                      <Typography
                        className={classes.headerText}
                        style={{
                          fontWeight: 600,
                          fontSize: 12,
                          lineHeight: '120%',
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
  img1Logo: {
    position: 'absolute',
    left: '0px',
    top: '0px',
    border: '1px solid #DBE6EC',
    borderRadius: '30px',
    background: 'rgb(25, 33, 56)',
  },
  img2Logo: {
    position: 'absolute',
    left: '23px',
    zIndex: '1',
    top: '0px',
    border: '1px solid #DBE6EC',
    borderRadius: '30px',
    background: 'rgb(25, 33, 56)',
  },
  doubleImages: {
    display: 'flex',
    position: 'relative',
    width: '70px',
    height: '35px',
  },
  searchContainer: {
    display: 'flex',
  },
  searchInput: {
    width: 430,
    '& > fieldset': {
      border: 'none',
    },
    ["@media (max-width:1360px)"]: {
      // eslint-disable-line no-useless-computed-key
      position: 'absolute',
      top: 40,
      right: 0,
    },
    ["@media (max-width:660px)"]: {
      top: 30,
      left: 0,
      width: 'calc(100% - 60px)',
    },
  },
  actionsButtons: {
    ["@media (max-width:660px)"]: {
      position: 'absolute',
      right: 0,
      top: 60,
    },
  },
  myDeposits: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 30,
    borderRadius: 100,
    marginLeft: 20,
    fontSize: '18px !important',
    ["@media (max-width:660px)"]: {
      // eslint-disable-line no-useless-computed-key
      padding: '5px 0',
      paddingLeft: 20,
    },
    ["@media (max-width:530px)"]: {
      // eslint-disable-line no-useless-computed-key
      fontSize: '12px !important',
    },
  },
  myDepositsText: {
    ["@media (max-width:530px)"]: {
      // eslint-disable-line no-useless-computed-key
      display: 'flex',
      flexDirection: 'column',
    },
  },
  'myDeposits--light': {
    background: '#DBE6EC',
    border: '1px solid #86B9D6',
  },
  'myDeposits--dark': {
    background: '#151718',
    border: '1px solid #5F7285',
  },
  toolbar: {
    marginBottom: 30,
    padding: 0,
    ["@media (max-width:660px)"]: {
      paddingBottom: 40,
    },
  },
  filterButton: {
    width: 50,
    height: 50,
    marginLeft: 10,
    borderRadius: 100,
  },
  'filterButton--light': {
    background: '#0B5E8E',
    color: '#fff',
    '&:hover': {
      background: '#86B9D6',
    },
    '&:active': {
      background: '#86B9D6',
      border: '1px solid #0B5E8E',
    },
  },
  'filterButton--dark': {
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
  searchButton: {
    width: 50,
    height: 50,
    marginLeft: 10,
    borderRadius: 100,
  },
  'searchButton--light': {
    background: '#0B5E8E',
    color: '#fff',
    '&:hover': {
      background: '#86B9D6',
    },
    '&:active': {
      background: '#86B9D6',
      border: '1px solid #0B5E8E',
    },
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
  },
  'filterContainer--light': {
    background: '#DBE6EC',
    border: '1px solid #0B5E8E',
  },
  'filterContainer--dark': {
    background: '#151718',
    border: '1px solid #4CADE6',
  },
  alignContentRight: {
    textAlign: 'right',
  },
  labelColumn: {
    display: 'flex',
    alignItems: 'center',
  },
  filterItem: {
    padding: '10px 0',
    borderBottom: '1px solid #86B9D6',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  filterLabel: {
    fontSize: '18px',
  },
  'filterLabel--light': {
    color: '#325569',
  },
  'filterLabel--dark': {
    color: '#C6CDD2',
  },
  filterListTitle: {
    fontWeight: 600,
    fontSize: 18,
  },
  'filterListTitle--light': {
    color: '#0A2C40',
  },
  'filterListTitle--dark': {
    color: '#ffffff',
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
    display: 'flex',
    alignItems: 'center',
    width: 215,
    height: 50,
    cursor: 'pointer',
  },
  'addButton--light': {
    '&:hover > p': {
      background: '#C6BAF0',
    },
    '&:active > p': {
      background: '#B9A4EE',
    },
  },
  'addButton--dark': {
    '&:hover > p': {
      background: '#402E61',
    },
    '&:active > p': {
      background: '#523880',
    },
  },
  addButtonIcon: {
    width: 50,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#8F5AE8',
  },
  actionButtonText: {
    width: 200,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
    lineHeight: '120%',
    background: '#D2D0F2',
    color: '#8F5AE8',
    transition: 'all ease 300ms',
    ["@media (max-width:530px)"]: {
      // eslint-disable-line no-useless-computed-key
      width: 100,
      fontSize: 14,
      padding: '8px 10px',
    },
  },
  'actionButtonText--light': {
    background: '#D2D0F2',
  },
  'actionButtonText--dark': {
    background: '#33284C',
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
    top: 60,
    ["@media (max-width:530px)"]: {
      // eslint-disable-line no-useless-computed-key
      width: '60%',
    },
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
})

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
    {id: 'balance--desc', label: 'Wallet: high to low'},
    {id: 'balance--asc', label: 'Wallet: low to high'},
    {id: 'poolBalance--desc', label: 'My Pool Amount: high to low'},
    {id: 'poolBalance--asc', label: 'My Pool Amount: low to high'},
    {id: 'stakedBalance--desc', label: 'My Staked Amount: high to low'},
    {id: 'stakedBalance--asc', label: 'My Staked Amount: low to high'},
    {id: 'poolAmount--desc', label: 'Total Pool Amount: high to low'},
    {id: 'poolAmount--asc', label: 'Total Pool Amount: low to high'},
    {id: 'stakedAmount--desc', label: 'Total Pool Staked: high to low'},
    {id: 'stakedAmount--asc', label: 'Total Pool Staked: low to high'},
  ];

  const [search, setSearch] = useState('');
  const [toggleActive, setToggleActive] = useState(localToggles.toggleActive);
  const [toggleActiveGauge, setToggleActiveGauge] = useState(localToggles.toggleActiveGauge);
  const [toggleStable, setToggleStable] = useState(localToggles.toggleStable);
  const [toggleVariable, setToggleVariable] = useState(localToggles.toggleVariable);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showSearch, setShowSearch] = useState(localToggles.showSearch);
  const [sortValueId, setSortValueId] = useState(options[0].id);
  const [sortDirection, setSortDirection] = useState('asc');

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
    props.setSearch(event.target.value);
  };

  const onToggle = (event) => {

    const localToggles = getLocalToggles();

    switch (event.target.name) {
      case 'toggleActive':
        setToggleActive(event.target.checked);
        props.setToggleActive(event.target.checked);
        localToggles.toggleActive = event.target.checked;
        break;
      case 'toggleActiveGauge':
        setToggleActiveGauge(event.target.checked);
        props.setToggleActiveGauge(event.target.checked);
        localToggles.toggleActiveGauge = event.target.checked;
        break;
      case 'toggleStable':
        setToggleStable(event.target.checked);
        props.setToggleStable(event.target.checked);
        localToggles.toggleStable = event.target.checked;
        break;
      case 'toggleVariable':
        setToggleVariable(event.target.checked);
        props.setToggleVariable(event.target.checked);
        localToggles.toggleVariable = event.target.checked;
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

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
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
    <Toolbar className={[classes.toolbar, 'g-flex-column__item-fixed', 'g-flex', 'g-flex--space-between'].join(' ')}>
      <div
        className={[classes.addButton, classes[`addButton--${appTheme}`]].join(' ')}
        onClick={onCreate}>
        <div className={classes.addButtonIcon}>
          <Add style={{width: 20, color: '#fff'}}/>
        </div>

        <Typography className={[classes.actionButtonText, classes[`actionButtonText--${appTheme}`]].join(' ')}>
          Add Liquidity
        </Typography>
      </div>

      {windowWidth <= 660 &&
        <div className={classes.sortSelect}>
          {SortSelect({value: sortValueId, options, handleChange: handleChangeSort, sortDirection})}
        </div>
      }

      <div className={classes.searchContainer}>
        {(windowWidth > 1360 || showSearch) &&
          <TextField
            className={classes.searchInput}
            variant="outlined"
            fullWidth
            placeholder="Search by name or paste address"
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              style: {
                background: appTheme === "dark" ? '#151718' : '#DBE6EC',
                border: '1px solid',
                borderColor: appTheme === "dark" ? '#5F7285' : '#86B9D6',
                borderRadius: 0,
              },
              classes: {
                root: classes.searchInput,
              },
              startAdornment: <InputAdornment position="start">
                <Search style={{
                  width: 20,
                  height: 20,
                  color: appTheme === "dark" ? '#4CADE6' : '#0B5E8E',
                }}/>
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
        }

        <div
          className={[classes.myDeposits, classes[`myDeposits--${appTheme}`]].join(' ')}>
          <Typography
            className={classes.myDepositsText}
            style={{
              fontSize: 'inherit',
            }}>
            <span
              style={{
                fontSize: 'inherit',
                fontWeight: 600,
                color: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
                paddingRight: 4,
              }}>
              Show:
            </span>

            <span
              style={{
                fontSize: 'inherit',
                fontWeight: 600,
                color: appTheme === 'dark' ? '#4CADE6' : '#0B5E8E',
                whiteSpace: 'nowrap',
              }}>
              My Deposits
            </span>
          </Typography>

          <Switch
            color="primary"
            checked={toggleActive}
            name={'toggleActive'}
            onChange={onToggle}/>
        </div>

        <div className={[classes.actionsButtons, 'g-flex', 'g-flex--align-center'].join(' ')}>
          <Tooltip placement="top" title="Filter list">
            <IconButton
              className={[classes.filterButton, classes[`filterButton--${appTheme}`]].join(' ')}
              onClick={handleClick}
              aria-label="filter list">
              <FilterAltOutlined/>
            </IconButton>
          </Tooltip>

          {windowWidth <= 1360 &&
            <IconButton
              className={[classes.searchButton, classes[`searchButton--${appTheme}`]].join(' ')}
              onClick={handleSearch}
              aria-label="filter list">
              <Search/>
            </IconButton>
          }
        </div>
      </div>

      <Popper id={id} open={open} anchorEl={anchorEl} transition placement="bottom-end" style={{zIndex: 100}}>
        {({TransitionProps}) => (
          <Fade {...TransitionProps} timeout={350}>
            <div className={[classes.filterContainer, classes[`filterContainer--${appTheme}`]].join(' ')}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}>
                <Typography className={[classes.filterListTitle, classes[`filterListTitle--${appTheme}`]].join(' ')}>
                  List Filters
                </Typography>

                <Close
                  style={{
                    cursor: 'pointer',
                    color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
                  }}
                  onClick={handleClick}/>
              </div>

              <Grid className={classes.filterItem} container spacing={0}>
                <Grid item lg={9} className={classes.labelColumn}>
                  <Typography className={[classes.filterLabel, classes[`filterLabel--${appTheme}`]].join(' ')}>Show
                    Active Gauges</Typography>
                </Grid>
                <Grid item lg={3} className={classes.alignContentRight}>
                  <Switch
                    color="primary"
                    checked={toggleActiveGauge}
                    name={'toggleActiveGauge'}
                    onChange={onToggle}
                  />
                </Grid>
              </Grid>

              <Grid className={classes.filterItem} container spacing={0}>
                <Grid item lg={9} className={classes.labelColumn}>
                  <Typography className={[classes.filterLabel, classes[`filterLabel--${appTheme}`]].join(' ')}>Show
                    Stable Pools</Typography>
                </Grid>
                <Grid item lg={3} className={classes.alignContentRight}>
                  <Switch
                    color="primary"
                    checked={toggleStable}
                    name={'toggleStable'}
                    onChange={onToggle}
                  />
                </Grid>
              </Grid>

              <Grid className={classes.filterItem} container spacing={0}>
                <Grid item lg={9} className={classes.labelColumn}>
                  <Typography className={[classes.filterLabel, classes[`filterLabel--${appTheme}`]].join(' ')}>Show
                    Volatile Pools</Typography>
                </Grid>
                <Grid item lg={3} className={classes.alignContentRight}>
                  <Switch
                    color="primary"
                    checked={toggleVariable}
                    name={'toggleVariable'}
                    onChange={onToggle}
                  />
                </Grid>
              </Grid>


            </div>
          </Fade>
        )}
      </Popper>
    </Toolbar>
  );
};

export default function EnhancedTable({pairs}) {
  const classes = useStyles();
  const router = useRouter();

  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('stakedBalance');
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
  const [tableHeight, setTableHeight] = useState(window.innerHeight - 50 - 64 - 30 - 60 - 54 - 20 - 30);
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
      if (!BigNumber(pair?.gauge?.balance).gt(0) && !BigNumber(pair?.balance).gt(0)) {
        return false;
      }
    }

    return true;
  });

  const {appTheme} = useAppThemeContext();

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
    setTableHeight(window.innerHeight - 50 - 64 - 30 - 60 - 54 - 20 - 30);
  });

  const handleChangeAccordion = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  return (
    <>
      <EnhancedTableToolbar
        setSearch={setSearch}
        setToggleActive={setToggleActive}
        setToggleActiveGauge={setToggleActiveGauge}
        setToggleStable={setToggleStable}
        setToggleVariable={setToggleVariable}
        setShowSearch={setShowSearch}
        handleRequestSort={handleRequestSort}
        setSortDirection={setSortDirection}/>

      {windowWidth > 660 &&
        <>
          <div
            style={{
              marginTop: windowWidth <= 1360 && showSearch ? 45 : 0,
            }}
            className={['g-flex-column__item', 'g-flex-column'].join(' ')}>
            <TableContainer
              className={'g-flex-column__item'}
              style={{
                overflow: 'auto',
                height: tableHeight,
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
                  onRequestSort={handleRequestSort}/>

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
                              background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                              border: '1px dashed #CFE5F2',
                              borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
                            }}
                            className={classes.cell}>
                            <div className={classes.inline}>
                              <div className={classes.doubleImages}>
                                <img
                                  className={classes.img1Logo}
                                  src={(row && row.token0 && row.token0.logoURI) ? row.token0.logoURI : ``}
                                  width="37"
                                  height="37"
                                  alt=""
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                  }}
                                />
                                <img
                                  className={classes.img2Logo}
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
                                  {row?.symbol}
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
                              background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                              border: '1px dashed #CFE5F2',
                              borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
                              overflow: 'hidden',
                            }}
                            align="right">
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                              }}>
                              {(row && row.token0 && row.token0.balance) &&
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
                                    {formatCurrency(row.token0.balance)}
                                  </Typography>

                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                    }}>
                                    {formatCurrency(row.token1.balance)}
                                  </Typography>
                                </div>
                              }
                              {!(row && row.token0 && row.token0.balance) &&
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
                              {(row && row.token1 && row.token1.balance) &&
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
                                    {row.token0.symbol}
                                  </Typography>

                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      fontWeight: 400,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                    }}>
                                    {row.token1.symbol}
                                  </Typography>
                                </div>
                              }
                              {!(row && row.token1 && row.token1.balance) &&
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

                          <TableCell
                            className={[classes.cell, classes.hiddenMobile].join(' ')}
                            style={{
                              background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                              border: '1px dashed #CFE5F2',
                              borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
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
                                      color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                    }}>
                                    {row.token0.symbol}
                                  </Typography>

                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      fontWeight: 400,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
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
                                background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                                border: '1px dashed #CFE5F2',
                                borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
                              }}
                              align="right">
                              {(row && row.gauge && row.gauge.balance && row.gauge.totalSupply) &&
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
                                      {formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve0))}
                                    </Typography>

                                    <Typography
                                      className={classes.textSpaced}
                                      style={{
                                        fontWeight: 500,
                                        fontSize: 14,
                                        lineHeight: '120%',
                                        color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                      }}>
                                      {formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve1))}
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
                                      {row.token0.symbol}
                                    </Typography>

                                    <Typography
                                      className={`${classes.textSpaced} ${classes.symbol}`}
                                      style={{
                                        fontWeight: 400,
                                        fontSize: 14,
                                        lineHeight: '120%',
                                        color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                      }}>
                                      {row.token1.symbol}
                                    </Typography>
                                  </div>
                                </div>
                              }
                              {!(row && row.gauge && row.gauge.balance && row.gauge.totalSupply) &&
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
                              }
                            </TableCell>
                          }

                          {
                            !row?.gauge?.address &&
                            <TableCell
                              className={[classes.cell, classes.hiddenMobile].join(' ')}
                              style={{
                                background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                                border: '1px dashed #CFE5F2',
                                borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
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
                                Gauge not available
                              </Typography>
                            </TableCell>
                          }

                          <TableCell
                            className={[classes.cell, classes.hiddenSmallMobile].join(' ')}
                            style={{
                              background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                              border: '1px dashed #CFE5F2',
                              borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
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
                                      color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                    }}>
                                    {row.token0.symbol}
                                  </Typography>

                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      fontWeight: 400,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                    }}>
                                    {row.token1.symbol}
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
                                background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                                border: '1px dashed #CFE5F2',
                                borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
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
                                        color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                      }}>
                                      {row.token0.symbol}
                                    </Typography>

                                    <Typography
                                      className={`${classes.textSpaced} ${classes.symbol}`}
                                      style={{
                                        fontWeight: 400,
                                        fontSize: 14,
                                        lineHeight: '120%',
                                        color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                      }}>
                                      {row.token1.symbol}
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
                                background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                                border: '1px dashed #CFE5F2',
                                borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
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
                                Gauge not available
                              </Typography>
                            </TableCell>
                          }

                          <TableCell
                            className={classes.cell}
                            style={{
                              background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                              border: '1px dashed #CFE5F2',
                              borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
                            }}
                            align="right">
                            <Button
                              variant="outlined"
                              color="primary"
                              style={{
                                padding: '7px 14px',
                                border: '1px solid #5688A5',
                                borderColor: appTheme === 'dark' ? '#C6CDD2' : '#5688A5',
                                borderRadius: 100,
                                fontWeight: 500,
                                fontSize: 14,
                                lineHeight: '120%',
                                color: appTheme === 'dark' ? '#C6CDD2' : '#5688A5',
                              }}
                              onClick={() => {
                                onView(row);
                              }}>
                              Manage
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
                marginTop: 20,
                padding: '0 30px',
                background: appTheme === 'dark' ? '#24292D' : '#dbe6ec',
                border: '1px solid #86B9D6',
                borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
                borderRadius: 100,
                color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
              }}
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredPairs.length}
              rowsPerPage={rowsPerPage}
              page={page}
              ActionsComponent={TablePaginationActions}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </div>
        </>
      }

      {windowWidth <= 660 &&
        <div style={{overflow: 'auto'}}>
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
                    background: appTheme === 'dark' ? '#24292D' : '#DBE6EC',
                    border: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                  }}
                  disableGutters={true}
                  expanded={expanded === labelId}
                  onChange={handleChangeAccordion(labelId)}>
                  <AccordionSummary
                    style={{
                      padding: 0,
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
                          <img
                            className={classes.img1Logo}
                            src={(row && row.token0 && row.token0.logoURI) ? row.token0.logoURI : ``}
                            width="37"
                            height="37"
                            alt=""
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                            }}
                          />
                          <img
                            className={classes.img2Logo}
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
                            {row?.symbol}
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
                                padding: '7px 14px',
                                border: `1px solid ${appTheme === 'dark' ? '#C6CDD2' : '#5688A5'}`,
                                borderColor: appTheme === 'dark' ? '#C6CDD2' : '#5688A5',
                                borderRadius: 100,
                                fontWeight: 500,
                                fontSize: 14,
                                lineHeight: '120%',
                                color: appTheme === 'dark' ? '#C6CDD2' : '#5688A5',
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();

                                onView(row);
                              }}>
                              Manage
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
                              fontSize: 12,
                              lineHeight: '120%',
                              borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                              color: appTheme === 'dark' ? '#C6CDD2' : '#325569',
                              textAlign: 'right',
                            }}
                            noWrap>
                            Total Pool Amount
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
                                {row.token0.symbol}
                              </Typography>

                              <Typography
                                className={`${classes.textSpaced} ${classes.symbol}`}
                                style={{
                                  fontWeight: 400,
                                  fontSize: 14,
                                  lineHeight: '120%',
                                  color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                }}>
                                {row.token1.symbol}
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
                            fontSize: 12,
                            lineHeight: '120%',
                            color: appTheme === 'dark' ? '#4CADE6' : '#0B5E8E',
                          }}
                          noWrap>
                          {expanded !== labelId ? 'Show' : 'Hide'} Details
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
                                  {headCell.id === 'balance' && formatCurrency(row.token0.balance)}
                                  {headCell.id === 'poolBalance' && formatCurrency(BigNumber(row.balance).div(row.totalSupply).times(row.reserve0))}
                                  {headCell.id === 'stakedBalance' && row?.gauge?.address && formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve0))}
                                  {headCell.id === 'stakedBalance' && !row?.gauge?.address && 'Gauge not available'}
                                  {headCell.id === 'stakedAmount' && row?.gauge?.address && formatCurrency(row.gauge.reserve0)}
                                  {headCell.id === 'stakedAmount' && !row?.gauge?.address && 'Gauge not available'}
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
                                  {headCell.id === 'balance' && formatCurrency(row.token1.balance)}
                                  {headCell.id === 'poolBalance' && formatCurrency(BigNumber(row.balance).div(row.totalSupply).times(row.reserve1))}
                                  {headCell.id === 'stakedBalance' && row?.gauge?.address && formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve1))}
                                  {headCell.id === 'stakedBalance' && !row?.gauge?.address && 'Gauge not available'}
                                  {headCell.id === 'stakedAmount' && row?.gauge?.address && formatCurrency(row.gauge.reserve1)}
                                  {headCell.id === 'stakedAmount' && !row?.gauge?.address && 'Gauge not available'}
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
                                  {row.token0.symbol}
                                </Typography>

                                <Typography
                                  className={`${classes.textSpaced} ${classes.symbol}`}
                                  style={{
                                    fontWeight: 400,
                                    fontSize: 14,
                                    lineHeight: '120%',
                                    color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                  }}>
                                  {row.token1.symbol}
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
        </div>
      }
    </>
  );
}
