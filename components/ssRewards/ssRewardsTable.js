import React, { useState } from 'react';
import PropTypes from 'prop-types';
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
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { makeStyles, styled, useTheme } from '@mui/styles';
import { useRouter } from "next/router";
import BigNumber from 'bignumber.js';
import { formatCurrency } from '../../utils';
import stores from '../../stores';
import { ACTIONS } from '../../stores/constants';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import { ArrowDropDown, ExpandLess, ExpandMore } from '@mui/icons-material';
import TablePaginationActions from '../table-pagination/table-pagination';
import { formatSymbol } from '../../utils';

function descendingComparator(a, b, orderBy) {
  if (!a || !b) {
    return 0;
  }

  let aAmount = 0;
  let bAmount = 0;

  switch (orderBy) {
    case 'reward':

      if (b.rewardType < a.rewardType) {
        return -1;
      }
      if (b.rewardType > a.rewardType) {
        return 1;
      }
      if (b.symbol < a.symbol) {
        return -1;
      }
      if (b.symbol > a.symbol) {
        return 1;
      }
      return 0;

    case 'balance':

      if (a.rewardType === 'Bribe') {
        aAmount = a.gauge.balance;
      } else {
        aAmount = a.balance;
      }

      if (b.rewardType === 'Bribe') {
        bAmount = b.gauge.balance;
      } else {
        bAmount = b.balance;
      }

      if (BigNumber(bAmount).lt(aAmount)) {
        return -1;
      }
      if (BigNumber(bAmount).gt(aAmount)) {
        return 1;
      }
      return 0;

    case 'earned':

      if (a.rewardType === 'Bribe') {
        aAmount = a.gauge.bribes.length;
      } else {
        aAmount = 2;
      }

      if (b.rewardType === 'Bribe') {
        bAmount = b.gauge.bribes.length;
      } else {
        bAmount = 2;
      }

      if (BigNumber(bAmount).lt(aAmount)) {
        return -1;
      }
      if (BigNumber(bAmount).gt(aAmount)) {
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
    id: 'reward',
    numeric: false,
    disablePadding: false,
    label: 'Reward Source',
    isSticky: true,
    isHideInDetails: true,
  },
  {
    id: 'balance',
    numeric: true,
    disablePadding: false,
    label: 'Your Position',
  },
  {
    id: 'earned',
    numeric: true,
    disablePadding: false,
    label: 'You Earned',
    isHideInDetails: true,
  },
  {
    id: 'bruh',
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
  const {classes, order, orderBy, onRequestSort} = props;
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
                        width: headCell.width || 'auto',
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

const useStyles = makeStyles((theme) => {
  const {appTheme} = useAppThemeContext();

  return ({
    root: {
      width: '100%',
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
    textSpacedPadded: {
      paddingLeft: '10px',
      lineHeight: '1.5',
      fontWeight: '200',
      fontSize: '12px',
    },
    headerText: {
      fontWeight: '200',
      fontSize: '12px',
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
    imgLogo: {
      marginRight: 10,
      border: '2px solid #DBE6EC',
      background: '#13B5EC',
      borderRadius: '30px',
    },
    img1Logo: {
      position: 'absolute',
      left: '0px',
      top: '0px',
      outline: '2px solid #DBE6EC',
      background: '#13B5EC',
      borderRadius: '30px',
    },
    img2Logo: {
      position: 'absolute',
      left: '28px',
      zIndex: '1',
      top: '0px',
      outline: '2px solid #DBE6EC',
      background: '#13B5EC',
      borderRadius: '30px',
    },
    overrideTableHead: {
      borderBottom: '1px solid rgba(126,153,176,0.15) !important',
    },
    doubleImages: {
      display: 'flex',
      position: 'relative',
      width: '80px',
      height: '35px',
    },
    searchContainer: {
      flex: 1,
      minWidth: '300px',
      marginRight: '30px',
    },
    buttonOverride: {
      color: 'rgb(6, 211, 215)',
      background: 'rgb(23, 52, 72)',
      fontWeight: '700',
      '&:hover': {
        background: 'rgb(19, 44, 60)',
      },
    },
    toolbar: {
      margin: '24px 0px',
      padding: '0px',
    },
    tableContainer: {
      border: '1px solid rgba(126,153,176,0.2)',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
    },
    filterButton: {
      background: '#111729',
      border: '1px solid rgba(126,153,176,0.3)',
      color: '#06D3D7',
      marginRight: '30px',
    },
    actionButtonText: {
      fontSize: '15px',
      fontWeight: '700',
    },
    filterContainer: {
      background: '#212b48',
      minWidth: '300px',
      marginTop: '15px',
      borderRadius: '10px',
      padding: '20px',
      boxShadow: '0 10px 20px 0 rgba(0,0,0,0.2)',
      border: '1px solid rgba(126,153,176,0.2)',
    },
    alignContentRight: {
      textAlign: 'right',
    },
    labelColumn: {
      display: 'flex',
      alignItems: 'center',
    },
    filterLabel: {
      fontSize: '14px',
    },
    filterListTitle: {
      marginBottom: '10px',
      paddingBottom: '20px',
      borderBottom: '1px solid rgba(126,153,176,0.2)',
    },
    infoIcon: {
      color: '#06D3D7',
      fontSize: '16px',
      marginLeft: '10px',
    },
    symbol: {
      minWidth: '40px',
    },
    table: {
      tableLayout: 'auto',
    },
    tableBody: {
      background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
    },
    accordionSummaryContent: {
      margin: 0,
      padding: 0,
    },
    sortSelect: {
      position: 'absolute',
      top: 60,
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
  });
});

export default function EnhancedTable({rewards, vestNFTs, tokenID}) {
  const classes = useStyles();
  const router = useRouter();

  const [order, setOrder] = React.useState('desc');
  const [orderBy, setOrderBy] = React.useState('balance');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [tableHeight, setTableHeight] = useState(window.innerHeight - 50 - 64 - 74 - 60 - 54 - 20 - 30);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [expanded, setExpanded] = useState('');

  const {appTheme} = useAppThemeContext();

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

  if (!rewards) {
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

  const onClaim = (reward) => {
    if (reward.rewardType === 'Bribe') {
      stores.dispatcher.dispatch({type: ACTIONS.CLAIM_BRIBE, content: {pair: reward, tokenID}});
    } else if (reward.rewardType === 'Fees') {
      stores.dispatcher.dispatch({type: ACTIONS.CLAIM_PAIR_FEES, content: {pair: reward, tokenID}});
    } else if (reward.rewardType === 'Reward') {
      stores.dispatcher.dispatch({type: ACTIONS.CLAIM_REWARD, content: {pair: reward, tokenID}});
    } else if (reward.rewardType === 'Distribution') {
      stores.dispatcher.dispatch({type: ACTIONS.CLAIM_VE_DIST, content: {tokenID}});
    }
  };

  function tableCellContent(data1, data2, symbol1, symbol2, imgSource1, imgSource2) {
    return (
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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
            }}>
            

            <Typography
              className={classes.textSpaced}
              style={{
                fontWeight: 500,
                fontSize: 14,
                lineHeight: '120%',
                color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
              }}>
              {data1}
            </Typography>
          </div>

          <Typography
            className={classes.textSpaced}
            style={{
              fontWeight: 500,
              fontSize: 14,
              lineHeight: '120%',
              color: appTheme === 'dark' ? '#ffffff' : '#0A2C40',
            }}>
            {data2}
          </Typography>
        </div>

        {(symbol1 || symbol2) &&
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
              {symbol1}
            </Typography>

            <Typography
              className={`${classes.textSpaced} ${classes.symbol}`}
              style={{
                fontWeight: 400,
                fontSize: 14,
                lineHeight: '120%',
                color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
              }}>
              {symbol2}
            </Typography>
          </div>
        }
      </div>
    );
  }

  const handleChangeAccordion = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  window.addEventListener('resize', () => {
    setTableHeight(window.innerHeight - 50 - 64 - 74 - 60 - 54 - 20 - 30);
    setWindowWidth(window.innerWidth);
  });

  return (
    <>
      {windowWidth > 660 &&
        <div
          // className={['g-flex-column__item', 'g-flex-column'].join(' ')}
        >
          <TableContainer
            className={'g-flex-column__item-fixed'}
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
                onRequestSort={handleRequestSort}/>

              <TableBody classes={{
                root: classes.tableBody,
              }}>
                {Array.isArray(rewards) > 0 ? stableSort(rewards, getComparator(order, orderBy))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
                    if (!row) {
                      return null;
                    }

                    return (
                      <TableRow
                        key={'ssRewardsTable' + index}
                        className={classes.assetTableRow}
                      >
                        <StickyTableCell
                          style={{
                            background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                            border: '1px dashed #CFE5F2',
                            borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
                          }}
                          className={classes.cell}>
                          {['Bribe', 'Fees', 'Reward'].includes(row.rewardType) &&
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
                                  {row?.rewardType}
                                </Typography>
                              </div>
                            </div>
                          }
                          {['Distribution'].includes(row.rewardType) &&
                            <div className={classes.inline}>
                              <div className={classes.doubleImages}>
                                <img
                                  className={classes.img1Logo}
                                  src={(row && row.lockToken && row.lockToken.logoURI) ? row.lockToken.logoURI : ``}
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
                                  {formatSymbol(row?.lockToken?.symbol)}
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
                                  {row?.rewardType}
                                </Typography>
                              </div>
                            </div>
                          }
                        </StickyTableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                            border: '1px dashed #CFE5F2',
                            borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
                            overflow: 'hidden',
                          }}>
                          {(row && row.rewardType === 'Bribe' && row.gauge && row.gauge.balance && row.gauge.totalSupply) &&
                            tableCellContent(
                              formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve0)),
                              formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve1)),
                              row.token0.symbol,
                              row.token1.symbol,
                            )
                          }

                          {(row && row.rewardType === 'Fees' && row.balance && row.totalSupply) &&
                            tableCellContent(
                              formatCurrency(BigNumber(row.balance).div(row.totalSupply).times(row.reserve0)),
                              formatCurrency(BigNumber(row.balance).div(row.totalSupply).times(row.reserve1)),
                              row.token0.symbol,
                              row.token1.symbol,
                            )
                          }

                          {(row && row.rewardType === 'Reward' && row.gauge && row.gauge.balance && row.gauge.totalSupply) &&
                            tableCellContent(
                              formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve0)),
                              formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve1)),
                              row.token0.symbol,
                              row.token1.symbol,
                            )
                          }

                          {(row && row.rewardType === 'Distribution') &&
                            tableCellContent(
                              formatCurrency(row.token?.lockValue),
                              null,
                              row.lockToken.symbol,
                              null,
                            )
                          }
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                            border: '1px dashed #CFE5F2',
                            borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
                            overflow: 'hidden',
                          }}>
                          {
                            row && row.rewardType === 'Bribe' && row.gauge && row.gauge.bribesEarned && row.gauge.bribesEarned.map((bribe) => {
                              return (
                                tableCellContent(
                                  formatCurrency(bribe.earned),
                                  null,
                                  bribe.token?.symbol,
                                  null,
                                  (bribe && bribe.token && bribe.token.logoURI) ? bribe.token.logoURI : `/tokens/unknown-logo--${appTheme}.svg`,
                                )
                              );
                            })
                          }

                          {row && row.rewardType === 'Fees' &&
                            tableCellContent(
                              formatCurrency(row.claimable0),
                              formatCurrency(row.claimable1),
                              row.token0?.symbol,
                              row.token1?.symbol,
                              (row.token0 && row.token0.logoURI) ? row.token0.logoURI : `/tokens/unknown-logo--${appTheme}.svg`,
                              (row.token1 && row.token1.logoURI) ? row.token1.logoURI : `/tokens/unknown-logo--${appTheme}.svg`,
                            )
                          }

                          {(row && row.rewardType === 'Reward') &&
                            tableCellContent(
                              formatCurrency(row.gauge.rewardsEarned),
                              null,
                              'DYST',
                              null,
                            )
                          }

                          {(row && row.rewardType === 'Distribution') &&
                            tableCellContent(
                              formatCurrency(row.earned),
                              null,
                              row.rewardToken.symbol,
                              null,
                            )
                          }
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                            border: '1px dashed #CFE5F2',
                            borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
                            overflow: 'hidden',
                          }}>
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
                              onClaim(row);
                            }}>
                            Claim
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }) : null}
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
            ActionsComponent={TablePaginationActions}
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={rewards.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </div>
      }

      {windowWidth <= 660 &&
        <div style={{overflow: 'auto'}}>
          {Array.isArray(rewards) > 0
            ? stableSort(rewards, getComparator(order, orderBy))
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
                        <div className={[classes.cellHeadPaddings, 'g-flex', 'g-flex--align-center'].join(' ')}>
                          {['Bribe', 'Fees', 'Reward'].includes(row.rewardType) &&
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
                                  {row?.rewardType}
                                </Typography>
                              </div>
                            </div>
                          }
                          {['Distribution'].includes(row.rewardType) &&
                            <div className={classes.inline}>
                              <div className={classes.doubleImages}>
                                <img
                                  className={classes.img1Logo}
                                  src={(row && row.lockToken && row.lockToken.logoURI) ? row.lockToken.logoURI : ``}
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
                                  {formatSymbol(row?.lockToken?.symbol)}
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
                                  {row?.rewardType}
                                </Typography>
                              </div>
                            </div>
                          }
                        </div>

                        <div
                          style={{
                            borderTop: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                            borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                          }}
                          className={['g-flex'].join(' ')}>
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

                                  onClaim(row);
                                }}>
                                Claim
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
                              You Earned
                            </Typography>

                            <div
                              className={classes.cellPaddings}
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                              }}>
                              {
                                row && row.rewardType === 'Bribe' && row.gauge && row.gauge.bribesEarned && row.gauge.bribesEarned.map((bribe) => {
                                  return (
                                    tableCellContent(
                                      formatCurrency(bribe.earned),
                                      null,
                                      bribe.token?.symbol,
                                      null,
                                      (bribe && bribe.token && bribe.token.logoURI) ? bribe.token.logoURI : `/tokens/unknown-logo--${appTheme}.svg`,
                                    )
                                  );
                                })
                              }

                              {row && row.rewardType === 'Fees' &&
                                tableCellContent(
                                  formatCurrency(row.claimable0),
                                  formatCurrency(row.claimable1),
                                  row.token0?.symbol,
                                  row.token1?.symbol,
                                  (row.token0 && row.token0.logoURI) ? row.token0.logoURI : `/tokens/unknown-logo--${appTheme}.svg`,
                                  (row.token1 && row.token1.logoURI) ? row.token1.logoURI : `/tokens/unknown-logo--${appTheme}.svg`,
                                )
                              }

                              {(row && row.rewardType === 'Reward') &&
                                tableCellContent(
                                  formatCurrency(row.gauge.rewardsEarned),
                                  null,
                                  'DYST',
                                  null,
                                )
                              }

                              {(row && row.rewardType === 'Distribution') &&
                                tableCellContent(
                                  formatCurrency(row.earned),
                                  null,
                                  row.rewardToken.symbol,
                                  null,
                                )
                              }
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            padding: '6px 20px',
                            background: appTheme === 'dark' ? '#151718' : '#9BC9E4',
                          }}
                          className={['g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
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
                                    {headCell.id === 'balance' && formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve0))}
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
                                    {headCell.id === 'balance' && formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve1))}
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
            : null
          }
        </div>
      }
    </>
  );
}
