import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles, styled } from '@mui/styles';
import {
  Paper,
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
  Toolbar,
  Skeleton, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import { useRouter } from "next/router";
import {
  ArrowDropDown, ExpandLess, ExpandMore,
  LockOutlined,
} from '@mui/icons-material';
import moment from 'moment';
import { formatCurrency } from '../../utils';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import TablePaginationActions from '../table-pagination/table-pagination';
import SortSelect from '../select-sort/select-sort';
import BigNumber from 'bignumber.js';
import css from './ssVests.module.css'

function descendingComparator(a, b, orderBy) {
  if (!a || !b) {
    return 0;
  }

  switch (orderBy) {
    case 'NFT':
      return Number(a.id) - Number(b.id);

    case 'Locked Amount':
      let amountA = BigNumber(a?.lockAmount).toNumber();
      let amountB = BigNumber(b?.lockAmount).toNumber();

      if (BigNumber(amountB).lt(amountA)) {
        return -1;
      }
      if (BigNumber(amountB).gt(amountA)) {
        return 1;
      }
      return 0;

    case 'Lock Value':
      let valueA = BigNumber(a?.lockValue).toNumber();
      let valueB = BigNumber(b?.lockValue).toNumber();

      if (BigNumber(valueB).lt(valueA)) {
        return -1;
      }
      if (BigNumber(valueB).gt(valueA)) {
        return 1;
      }
      return 0;

    case 'Lock Expires':
      let expiresA = a?.lockEnds;
      let expiresB = b?.lockEnds;

      if (expiresA < expiresB) {
        return -1;
      }
      if (expiresB < expiresA) {
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
    id: 'NFT',
    numeric: false,
    disablePadding: false,
    label: 'Locked NFT',
    isSticky: true,
    isHideInDetails: true,
  },
  {
    id: 'Locked Amount',
    numeric: true,
    disablePadding: false,
    label: 'Vest Amount',
  },
  {
    id: 'Lock Value',
    numeric: true,
    disablePadding: false,
    label: 'Vest Value',
  },
  {
    id: 'Lock Expires',
    numeric: true,
    disablePadding: false,
    label: 'Vest Expires',
    isHideInDetails: true,
  },
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
  const {classes, order, orderBy, onRequestSort} = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const {appTheme} = useAppThemeContext();

  return (
    <TableHead>
      <TableRow
        style={{
          // border: '1px solid #9BC9E4',
          // borderColor: appTheme === 'dark' ? '#5F7285' : '#9BC9E4',
          whiteSpace: 'nowrap',
        }}>
        {headCells.map((headCell) => (
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
                    padding: '15px 24px 16px',
                    background: '#060B17',
                    borderBottom: `1px solid #d3f85a`,
                    zIndex: 10,
                  }}>
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : 'asc'}
                    onClick={createSortHandler(headCell.id)}
                    IconComponent={() => orderBy === headCell.id ? sortIcon(order) : null}>
                    <Typography className={classes.headerText}>
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
                    padding: '15px 24px 16px',
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
                    <Typography className={classes.headerText}>
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
        ))}
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

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  toolbarFirst: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    position: 'relative',
    ["@media (max-width: 1550px)"]: {
      display: 'flex',
      flexDirection: 'column',
    },
  },
  toolbarTitle: {
    fontSize: '60px',
    fontWeight: 500,
    color: '#E4E9F4',
    letterSpacing: '0.04em !important',
    ["@media (max-width: 575px)"]: {
      fontSize: 40,
      letterSpacing: '0 !important',
    }
  },
  toolbarTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolbarInfo: {
    position: 'relative',
    maxWidth: 918,
    padding: '12px 24px',
    paddingRight: 100,
    fontFamily: 'Roboto Mono',
    fontSize: 16,
    fontWeight: 400,
    lineHeight: '24px',
    letterSpacing: '0',
    border: '1px solid #779BF4',
    borderRadius: '12px',
    background: 'rgba(119, 155, 244, 0.15)',
    color: '#E4E9F4',
    ["@media (max-width: 1550px)"]: {
      maxWidth: '100%',
    },
    ["@media (max-width: 575px)"]: {
      padding: 12,
      paddingBottom: 40,
      fontSize: 14,
      lineHeight: '20px',
    },
  },
  toolbarInfoLink: {
    position: 'absolute',
    top: 25,
    right: 25,
    ["@media (max-width: 575px)"]: {
      top: 'auto',
      right: 'auto',
      bottom: 6,
      left: 12,
    }
  },
  sidebar: {
    position: 'absolute',
    left: -400,
    paddingTop: 300,

    display: 'flex',
    flexDirection: 'column',
    width: '370px',

    ["@media (max-width: 1550px)"]: {
      paddingTop: 390,
    },
    ["@media (max-width: 1199px)"]: {
      position: 'static',
      width: '100%',
      paddingTop: 0,
      // width: '370px',
      // left: -400,
      // paddingTop: 330,
    },
  },
  assetTableRow: {
    '&:hover': {
      background: 'rgba(104,108,122,0.05)',
    },
  },
  paper: {
    width: '100%',
    marginBottom: theme.spacing(2),
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
  icon: {
    marginRight: '12px',
  },
  textSpaced: {
    lineHeight: '1.5',
    fontWeight: '200',
    fontSize: '12px',
  },
  inlineEnd: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerText: {
    fontWeight: '500 !important',
    fontSize: '14px !important',
    lineHeight: '100% !important',
    color: '#8191B9 !important',
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
    // position: 'absolute',
    // left: '0px',
    // top: '0px',
    borderRadius: '30px',
  },
  img2Logo: {
    // position: 'absolute',
    // left: '28px',
    zIndex: '1',
    // top: '0px',
  },
  overrideTableHead: {
    borderBottom: '1px solid rgba(104,108,122,0.2) !important',
  },
  doubleImages: {
    display: 'flex',
    position: 'relative',
    marginRight: 12,
    // width: '80px',
    // height: '35px',
  },
  buttonOverride: {
    color: 'rgb(6, 211, 215)',
    background: 'rgb(23, 52, 72)',
    fontWeight: '700',
    width: '100%',
    '&:hover': {
      background: 'rgb(19, 44, 60)',
    },
  },
  toolbar: {
    marginBottom: 30,
    padding: 0,
    minHeight: 'auto',
    ["@media (max-width: 1199px)"]: {
      display: 'flex',
      flexDirection: 'column',
    },
    // ["@media (max-width: 660px)"]: {
      // paddingBottom: 70,
    // },
  },
  tableContainer: {
    border: 'none',
    border: '1px solid #D3F85A',
    borderRadius: 12,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    background: 'transparent',
    overflow: 'hidden',
  },
  table: {
    tableLayout: 'auto',
  },
  addButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    width: '100%',
    height: 96,

    marginTop: 16,

    fontWeight: 600,
    fontSize: 32,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: '150%',
    letterSpacing: '0 !important',
    
    borderRadius: 12,

    background: '#D3F85A',
    color: '#060B17',

    cursor: 'pointer',

    transition: 'all ease 300ms',
  
    ["@media (max-width: 1199px)"]: {
      height: 68,
      marginTop: 12,
      fontSize: 20,
    },
    '&:hover > p': {
      background: '#c4ff00',
    },
  },
  mergeButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',

    width: '100%',
    height: 72,

    marginTop: 16,

    fontWeight: 600,
    fontSize: 18,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: '133%',
    letterSpacing: '0 !important',
    
    borderRadius: 12,
    border: '1px solid #779BF4',

    background: 'rgba(119, 155, 244, 0.15)',
    color: '#779BF4',

    cursor: 'pointer',

    transition: 'all ease 300ms',

    ["@media (max-width: 1199px)"]: {
      height: 48,
      marginTop: 12,
      fontSize: 14,
    },
  
    '&:hover > p': {
      background: '#c4ff00',
    },
  },
  accordionSummaryContent: {
    margin: 0,
    padding: 0,
  },
  sortSelect: {
    // position: 'absolute',
    // top: 0,
    // right: 0,
  },
  cellPaddings: {
    padding: '11px 20px',
    // ["@media (max-width:530px)"]: {
      // eslint-disable-line no-useless-computed-key
      // padding: 10,
    // },
  },
  cellHeadSmallPaddings: {
    padding: '8px 16px',
  },
  cellHeadPaddings: {
    padding: '16px',
    // ["@media (max-width:530px)"]: {
      // eslint-disable-line no-useless-computed-key
      // padding: '5px 10px',
    // },
  },
}));

const EnhancedTableToolbar = (props) => {
  const classes = useStyles();
  const router = useRouter();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [search, setSearch] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  const options = [
    {id: 'Locked Amount--desc', label: 'Vest Amount: high to low'},
    {id: 'Locked Amount--asc', label: 'Vest Amount: low to high'},
    {id: 'Lock Value--desc', label: 'Vest Value: high to low'},
    {id: 'Lock Value--asc', label: 'Vest Value: low to high'},
    {id: 'Lock Expires--desc', label: 'Vest Expires: high to low'},
    {id: 'Lock Expires--asc', label: 'Vest Expires: low to high'},
  ];

  const [sortValueId, setSortValueId] = useState('Locked Amount--desc');

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
  };

  const onCreate = () => {
    router.push('/vest/create');
  };

  const handleChangeSort = ({target: {value}}) => {
    const property = value.substring(0, value.indexOf('--'));
    const event = value.substring(value.indexOf('--') + 2);

    setSortValueId(value);
    setSortDirection(event);

    props.handleRequestSort(event, property);
  };

  const handleResize = () => {
    setWindowWidth(window.innerWidth);
  }

  window.addEventListener('resize', handleResize);

  return (
    <Toolbar className={classes.toolbar} style={{ marginBottom: 20 }}>
      <div className={classes.toolbarFirst}>
        <div className={classes.toolbarTitleRow}>
          <Typography className={classes.toolbarTitle}>
            Vest
          </Typography>

          {windowWidth <= 660 && (
            <div className={[classes.sortSelect, css.sortSelect].join(' ')}>
              {SortSelect({value: sortValueId, options, handleChange: handleChangeSort, sortDirection})}
            </div>
          )}
        </div>


        <div className={classes.toolbarInfo}>
          Lock your DYST to earn rewards and governance rights. Each locked position is created and represented as an NFT, meaning you can hold multiple locked positions.
          <span className={classes.toolbarInfoLink}>
            <img src="/images/ui/explorer.svg" />
          </span>
        </div>
      </div>

      <div className={classes.sidebar}>
        <div className={classes.addButton} onClick={onCreate}>
          Create Lock
        </div>

        <div className={classes.mergeButton} onClick={onCreate}>
          MERGE MY LOCKED NFTs
        </div>
      </div>
    </Toolbar>
  );
};

export default function EnhancedTable({vestNFTs, govToken, veToken}) {
  const classes = useStyles();
  const router = useRouter();

  const [order, setOrder] = React.useState('desc');
  const [orderBy, setOrderBy] = React.useState('Locked Amount');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [tableHeight, setTableHeight] = useState((window.innerHeight - 50 - 64 - 30 - 60 - 54 - 20 - 30) - (windowWidth < 1280 ? 50 : 0));
  const [sortDirection, setSortDirection] = useState('asc');
  const [expanded, setExpanded] = useState('');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  if (!vestNFTs) {
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

  const onView = (nft) => {
    router.push(`/vest/${nft.id}`);
  };

  const {appTheme} = useAppThemeContext();

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
    setTableHeight((window.innerHeight - 50 - 64 - 30 - 60 - 54 - 20 - 30) - (windowWidth < 1280 ? 50 : 0));
  });

  const handleChangeAccordion = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  const isEmptyTable = vestNFTs.length === 0
  const emptyMessage = <div className={css.tableEmptyMessage}>
    You have not created any Lock yet
  </div>

  return (
    <div
      className={['g-flex-column__item', 'g-flex-column'].join(' ')}
      style={{
        overflowY: 'initial'/*windowWidth <= 400 ? 'auto' : 'hidden'*/,
        paddingLeft: windowWidth > 1200 ? 400 : 0,
      }}
    >
      <EnhancedTableToolbar
        handleRequestSort={handleRequestSort}
        setSortDirection={setSortDirection}
      />

      {windowWidth > 660 &&
        <Paper elevation={0} className={classes.tableContainer}>
          <TableContainer
            className={'g-flex-column__item'}
            style={{
              overflow: 'auto',
              maxHeight: isEmptyTable ? 'auto' : tableHeight,
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
                onRequestSort={handleRequestSort}/>
                {isEmptyTable ? null : (
                <TableBody>
                {stableSort(vestNFTs, getComparator(order, orderBy))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
                    if (!row) {
                      return null;
                    }
                    const labelId = `enhanced-table-checkbox-${index}`;

                    return (
                      <TableRow
                        key={labelId}
                        className={classes.assetTableRow}
                      >
                        <StickyTableCell
                          style={{
                            padding: '15px 24px 16px',
                            background: '#171D2D',
                            borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                          }}
                          className={classes.cell}>
                          <div className={classes.inline}>
                            <div className={classes.doubleImages}>
                              <img
                                className={classes.img1Logo}
                                src={govToken?.logoURI}
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
                                  marginBottom: 8,
                                  fontWeight: 500,
                                  fontSize: 14,
                                  lineHeight: '120%',
                                  color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                                }}>
                                {row.id}
                              </Typography>
                              <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 400,
                                  fontSize: 14,
                                  lineHeight: '120%',
                                  color: '#8191B9',
                                }}>
                                NFT ID
                              </Typography>
                            </div>
                          </div>
                        </StickyTableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            padding: '15px 24px 16px',
                            background: '#171D2D',
                            borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                            overflow: 'hidden',
                          }}>
                          <Typography
                            className={classes.textSpaced}
                            style={{
                              marginBottom: 8,
                              fontWeight: 500,
                              fontSize: 14,
                              lineHeight: '120%',
                              color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                            }}>
                            {formatCurrency(row.lockAmount)}
                          </Typography>

                          <Typography
                            className={classes.textSpaced}
                            style={{
                              fontWeight: 400,
                              fontSize: 14,
                              lineHeight: '120%',
                              color: '#8191B9',
                            }}>
                            {govToken?.symbol}
                          </Typography>
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            padding: '15px 24px 16px',
                            background: '#171D2D',
                            borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                            overflow: 'hidden',
                          }}>
                          <Typography
                            className={classes.textSpaced}
                            style={{
                              marginBottom: 8,
                              fontWeight: 500,
                              fontSize: 14,
                              lineHeight: '120%',
                              color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                            }}>
                            {formatCurrency(row.lockValue)}
                          </Typography>

                          <Typography
                            className={classes.textSpaced}
                            style={{
                              fontWeight: 400,
                              fontSize: 14,
                              lineHeight: '120%',
                              color: '#8191B9',
                            }}>
                            {veToken?.symbol}
                          </Typography>
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            padding: '15px 24px 16px',
                            background: '#171D2D',
                            borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                            overflow: 'hidden',
                          }}>
                          <Typography
                            className={classes.textSpaced}
                            style={{
                              marginBottom: 8,
                              fontWeight: 500,
                              fontSize: 14,
                              lineHeight: '120%',
                              color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
                            }}>
                            {moment.unix(row.lockEnds).format('YYYY-MM-DD')}
                          </Typography>

                          <Typography
                            className={classes.textSpaced}
                            style={{
                              fontWeight: 400,
                              fontSize: 14,
                              lineHeight: '120%',
                              color: '#8191B9',
                            }}>
                            Expires {moment.unix(row.lockEnds).fromNow()}
                          </Typography>
                        </TableCell>







                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            padding: '15px 24px 16px',
                            background: '#171D2D',
                            borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                            overflow: 'hidden',
                          }}>
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
                            }}
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
              )}
            </Table>
            {isEmptyTable && emptyMessage}
          </TableContainer>

          <TablePagination
            className={['g-flex-column__item-fixed', css.pagination].join(" ")}
            style={{
              width: '100%',
              // marginTop: 20,
              padding: '0 30px',
              background: '#060B17',
              borderTop: '1px solid #d3f85a',
              color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
            }}
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={vestNFTs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            labelRowsPerPage={window.innerWidth < 550 ? null : 'Rows per page:'}
            rowsPerPageOptions={window.innerWidth < 435 ? [] : [5, 10, 25]}
            ActionsComponent={TablePaginationActions}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            classes={{
              root: css.paginationRoot,
              toolbar: css.paginationToolbar,
              spacer: css.paginationSpacer,
              selectLabel: css.selectLabel,
              selectRoot: css.selectRoot,
              select: css.select,
              selectIcon: css.selectIcon,
              input: css.input,
              menuItem: css.menuItem,
              displayedRows: css.displayedRows,
              actions: css.actions,
            }}
          />
        </Paper>
      }

      {windowWidth <= 660 && (
        <>
        {isEmptyTable && emptyMessage}
        <div style={{overflow: 'auto'}}>
          {stableSort(vestNFTs, getComparator(order, orderBy))
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
                    marginBottom: 16,
                    borderRadius: 12,
                    background: '#161d2c',
                    overflow: 'hidden',
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
                      <div className={['g-flex'].join(' ')}>
                        <div
                          className={[classes.cellHeadPaddings, 'g-flex', 'g-flex--align-center'].join(' ')}
                          style={{ width: '50%', backgroundColor: '#171D2D', borderRight: '1px solid #060B17' }}
                        >
                          <div className={classes.doubleImages}>
                            <img
                              className={classes.img1Logo}
                              src={govToken?.logoURI}
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
                                marginBottom: 4,
                                fontWeight: 500,
                                fontSize: 16,
                                lineHeight: '20px',
                                color: '#E4E9F4',
                              }}>
                              {row.id}
                            </Typography>

                            <Typography
                              className={classes.textSpaced}
                              style={{
                                fontWeight: 400,
                                fontSize: 14,
                                lineHeight: '16px',
                                color: '#8191B9',
                              }}>
                              NFT ID
                            </Typography>
                          </div>
                        </div>

                        <div
                          className={[classes.cellHeadPaddings, 'g-flex', 'g-flex-column', 'g-flex--align-end'].join(' ')}
                          style={{ width: '50%', backgroundColor: '#171D2D' }}
                        >
                          <Typography
                            className={classes.textSpaced}
                            style={{
                              marginBottom: 8,
                              fontWeight: 400,
                              fontSize: 14,
                              lineHeight: '16px',
                              color: '#E4E9F4',
                              whiteSpace: 'nowrap',
                            }}>
                            {formatCurrency(row.lockAmount)}
                          </Typography>

                          <Typography
                            className={`${classes.textSpaced} ${classes.symbol}`}
                            style={{
                              fontWeight: 400,
                              fontSize: 14,
                              lineHeight: '16px',
                              color: '#8191B9',
                            }}>
                            {govToken?.symbol}
                          </Typography>
                        </div>
                      </div>

                      <div className={['g-flex', 'g-flex--align-center'].join(' ')}>
                        <div style={{ width: '50%' }}>
                          <Typography
                            className={classes.cellHeadSmallPaddings}
                            style={{
                              fontSize: 14,
                              fontWeight: 500,
                              lineHeight: '16px',
                              backgroundColor: '#060B17',
                              color: '#8191B9',
                            }}
                            noWrap
                          >
                            Action
                          </Typography>
                        </div>

                        <div style={{ width: '50%' }}>
                          <Typography
                            className={classes.cellHeadSmallPaddings}
                            style={{
                              fontSize: 14,
                              fontWeight: 500,
                              lineHeight: '16px',
                              textAlign: 'right',
                              backgroundColor: '#060B17',
                              color: '#8191B9',
                            }}
                            noWrap
                          >
                            Vest Expires
                          </Typography>
                        </div>
                      </div>

                      <div className={['g-flex', 'g-flex--align-center'].join(' ')}>
                        <div className={classes.cellHeadPaddings} style={{ width: '50%', borderRight: '1px solid #060B17' }}>
                          <Button
                            variant="outlined"
                            color="primary"
                            style={{
                              padding: '11px 16px',
                              border: '1px solid #D3F85A',
                              borderRadius: 12,
                              fontWeight: 600,
                              fontSize: 14,
                              lineHeight: '16px',
                              letterSpacing: '0em !important',
                              color: '#D3F85A',
                            }}
                            onClick={(event) => {
                              event.stopPropagation();
                              event.preventDefault();

                              onView(row);
                            }}>
                            EDIT
                          </Button>
                        </div>
                        <div
                          className={[classes.cellHeadPaddings, 'g-flex', 'g-flex-column', 'g-flex--align-end'].join(' ')}
                          style={{ width: '50%' }}
                        >
                          <Typography
                            className={classes.textSpaced}
                            style={{
                              marginBottom: 8,
                              fontWeight: 400,
                              fontSize: 14,
                              lineHeight: '16px',
                              color: '#E4E9F4',
                              whiteSpace: 'nowrap',
                            }}>
                            {moment.unix(row.lockEnds).format('YYYY-MM-DD')}
                          </Typography>

                          <Typography
                            className={`${classes.textSpaced} ${classes.symbol}`}
                            style={{
                              fontWeight: 400,
                              fontSize: 14,
                              lineHeight: '16px',
                              color: '#8191B9',
                            }}>
                            {`Expires ${moment.unix(row.lockEnds).fromNow()}`}
                          </Typography>
                        </div>
                      </div>

                      <div
                        style={{ padding: '10px 16px', background: '#060B17' }}
                        className={['g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}
                      >
                        <Typography
                          style={{
                            fontWeight: 500,
                            fontSize: 14,
                            lineHeight: '16px',
                            color: '#779BF4',
                          }}
                          noWrap
                        >
                          {expanded !== labelId ? 'Show' : 'Hide'} Details
                        </Typography>

                        {expanded !== labelId &&
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              width: 25,
                              height: 25,
                              borderRadius: '50%',
                              backgroundColor: '#779BF4'
                            }}
                          >
                            <ExpandMore style={{ color: '#060B17' }} />
                          </div>
                        }

                        {expanded === labelId &&
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              width: 25,
                              height: 25,
                              borderRadius: '50%',
                              backgroundColor: '#779BF4'
                            }}
                          >
                            <ExpandLess style={{ color: '#060B17' }} />
                          </div>
                        }
                      </div>
                    </div>
                  </AccordionSummary>

                  <AccordionDetails style={{ padding: 0 }}>
                    {headCells.map((headCell) => (
                      <>
                        {!headCell.isHideInDetails &&
                          <div
                            style={{ height: 72, borderTop: '1px solid #060B17' }}
                            className={['g-flex', 'g-flex--align-center'].join(' ')}
                          >
                            <Typography
                              className={classes.cellHeadPaddings}
                              style={{
                                width: '50%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                fontWeight: 500,
                                fontSize: 14,
                                lineHeight: '16px',
                                borderRight: `1px solid #060B17`,
                                color: '#8191B9',
                              }}
                              noWrap>
                              {headCell.label}
                            </Typography>

                            <div
                              className={classes.cellPaddings}
                              style={{
                                width: '50%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                              }}>
                              <Typography
                                className={classes.textSpaced}
                                style={{
                                  marginBottom: 8,
                                  fontWeight: 400,
                                  fontSize: 14,
                                  lineHeight: '16px',
                                  color: '#E4E9F4',
                                  whiteSpace: 'nowrap',
                                }}>
                                {headCell.id === 'Locked Amount' && formatCurrency(row.lockAmount)}
                                {headCell.id === 'Lock Value' && formatCurrency(row.lockValue)}
                              </Typography>

                              <Typography
                                className={`${classes.textSpaced} ${classes.symbol}`}
                                style={{
                                  fontWeight: 400,
                                  fontSize: 14,
                                  lineHeight: '16px',
                                  color: '#8191B9',
                                }}>
                                {headCell.id === 'Locked Amount' && govToken?.symbol}
                                {headCell.id === 'Lock Value' && veToken?.symbol}
                              </Typography>
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
        {!isEmptyTable && (
         <TablePagination
            className={['g-flex-column__item-fixed', css.pagination].join(" ")}
            style={{
              width: '100%',
              padding: '0 30px',
              background: '#060B17',
              borderTop: '1px solid #d3f85a',
              // borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
              // borderRadius: 100,
              color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
            }}
            component="div"
            count={vestNFTs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            labelRowsPerPage={window.innerWidth < 550 ? null : 'Rows per page:'}
            rowsPerPageOptions={window.innerWidth < 435 ? [] : [5, 10, 25]}
            ActionsComponent={TablePaginationActions}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            classes={{
              root: css.paginationRoot,
              toolbar: css.paginationToolbar,
              spacer: css.paginationSpacer,
              selectLabel: css.selectLabel,
              selectRoot: css.selectRoot,
              select: css.select,
              selectIcon: css.selectIcon,
              input: css.input,
              menuItem: css.menuItem,
              displayedRows: css.displayedRows,
              actions: css.actions,
            }}
          />
        )}
        </>
      )}
    </div>
  );
}
