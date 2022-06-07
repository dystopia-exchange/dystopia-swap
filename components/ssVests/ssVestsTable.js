import React, { useState } from 'react';
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
    isHideInDetails: true,
  },
  {
    id: 'Lock Expires',
    numeric: true,
    disablePadding: false,
    label: 'Vest Expires',
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
                    borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                    zIndex: 10,
                  }}>
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : 'asc'}
                    onClick={createSortHandler(headCell.id)}
                    IconComponent={() => orderBy === headCell.id ? sortIcon(order) : null}>
                    <Typography
                      className={classes.headerText}
                      style={{
                        fontWeight: 600,
                        fontSize: 12,
                        lineHeight: '120%',
                        color: appTheme === 'dark' ? '#C6CDD2' : '#325569',
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
                    borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                    color: appTheme === 'dark' ? '#C6CDD2' : '#325569',
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
                        fontWeight: 600,
                        fontSize: 12,
                        lineHeight: '120%',
                        color: appTheme === 'dark' ? '#C6CDD2' : '#325569',
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

const useStyles = makeStyles((theme) => ({
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
  img1Logo: {
    position: 'absolute',
    left: '0px',
    top: '0px',
    borderRadius: '30px',
  },
  img2Logo: {
    position: 'absolute',
    left: '28px',
    zIndex: '1',
    top: '0px',
  },
  overrideTableHead: {
    borderBottom: '1px solid rgba(104,108,122,0.2) !important',
  },
  doubleImages: {
    display: 'flex',
    position: 'relative',
    width: '80px',
    height: '35px',
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
    ["@media (max-width:660px)"]: {
      paddingBottom: 70,
    },
  },
  tableContainer: {
    border: 'none',
    borderRadius: 0,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    background: 'transparent',
  },
  table: {
    tableLayout: 'auto',
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
  },
  'actionButtonText--light': {
    background: '#D2D0F2',
  },
  'actionButtonText--dark': {
    background: '#33284C',
  },
  accordionSummaryContent: {
    margin: 0,
    padding: 0,
  },
  sortSelect: {
    position: 'absolute',
    top: 45,
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

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });

  const {appTheme} = useAppThemeContext();

  return (
    <Toolbar className={classes.toolbar} style={{ marginBottom: 30 }}>
      <div
        className={[classes.addButton, classes[`addButton--${appTheme}`]].join(' ')}
        onClick={onCreate}>
        <div className={classes.addButtonIcon}>
          <LockOutlined style={{width: 20, color: '#fff'}}/>
        </div>
          
        <Typography
          className={[classes.actionButtonText, classes[`actionButtonText--${appTheme}`]].join(' ')}
        >
          Create Lock
        </Typography>
      </div>

      {windowWidth <= 660 && (
        <div className={[classes.sortSelect, css.sortSelect].join(' ')}>
          {SortSelect({value: sortValueId, options, handleChange: handleChangeSort, sortDirection})}
        </div>
      )}
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
  const emptyMessage = <div
    style={{
      background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
      border: '1px dashed #CFE5F2',
      borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
      color: appTheme === 'dark' ? '#C6CDD2' : '#325569'
    }}
    className={css.tableEmptyMessage}
  >You have not created any Lock yet</div>

  return (
    <>
      <EnhancedTableToolbar
        handleRequestSort={handleRequestSort}
        setSortDirection={setSortDirection}/>

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
                        className={classes.assetTableRow}>
                        <StickyTableCell
                          style={{
                            background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                            borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                          }}
                          className={classes.cell}>
                          <div className={classes.inline}>
                            <div className={classes.doubleImages}>
                              <img
                                className={classes.img1Logo}
                                src={govToken?.logoURI}
                                width="35"
                                height="35"
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
                                }}>
                                {row.id}
                              </Typography>

                              <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 400,
                                  fontSize: 14,
                                  lineHeight: '120%',
                                  color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
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
                            background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                            borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                            overflow: 'hidden',
                          }}>
                          <Typography
                            className={classes.textSpaced}
                            style={{
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
                              color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                            }}>
                            {govToken?.symbol}
                          </Typography>
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                            borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                            overflow: 'hidden',
                          }}>
                          <Typography
                            className={classes.textSpaced}
                            style={{
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
                              color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                            }}>
                            {veToken?.symbol}
                          </Typography>
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                            borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                            overflow: 'hidden',
                          }}>
                          <Typography
                            className={classes.textSpaced}
                            style={{
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
                              color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                            }}>
                            Expires {moment.unix(row.lockEnds).fromNow()}
                          </Typography>
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                            borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
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
            count={vestNFTs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            labelRowsPerPage={window.innerWidth < 550 ? null : 'Rows per page:'}
            rowsPerPageOptions={window.innerWidth < 435 ? [] : [5, 10, 25]}
            ActionsComponent={TablePaginationActions}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
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
                        <div className={classes.doubleImages}>
                          <img
                            className={classes.img1Logo}
                            src={govToken?.logoURI}
                            width="35"
                            height="35"
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
                            }}>
                            {row.id}
                          </Typography>

                          <Typography
                            className={classes.textSpaced}
                            style={{
                              fontWeight: 400,
                              fontSize: 14,
                              lineHeight: '120%',
                              color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                            }}>
                            NFT ID
                          </Typography>
                        </div>
                      </div>

                      <div
                        style={{
                          borderTop: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                          borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
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
                              borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#CFE5F2'}`,
                              color: appTheme === 'dark' ? '#C6CDD2' : '#325569',
                            }}
                            noWrap>
                            Action
                          </Typography>

                          <div
                            className={classes.cellPaddings}>
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
                            Vest Value
                          </Typography>

                          <div
                            className={classes.cellPaddings}
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
                              {formatCurrency(row.lockValue)}
                            </Typography>

                            <Typography
                              className={`${classes.textSpaced} ${classes.symbol}`}
                              style={{
                                fontWeight: 400,
                                fontSize: 14,
                                lineHeight: '120%',
                                color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                              }}>
                              {veToken?.symbol}
                            </Typography>
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
                                {headCell.id === 'Locked Amount' && formatCurrency(row.lockAmount)}
                                {headCell.id === 'Lock Expires' && moment.unix(row.lockEnds).format('YYYY-MM-DD')}
                              </Typography>

                              <Typography
                                className={`${classes.textSpaced} ${classes.symbol}`}
                                style={{
                                  fontWeight: 400,
                                  fontSize: 14,
                                  lineHeight: '120%',
                                  color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                                }}>
                                {headCell.id === 'Locked Amount' && govToken?.symbol}
                                {headCell.id === 'Lock Expires' && `Expires ${moment.unix(row.lockEnds).fromNow()}`}
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
         <TablePagination
            className={'g-flex-column__item-fixed'}
            style={{
              width: '100%',
              padding: '0 30px',
              background: appTheme === 'dark' ? '#24292D' : '#dbe6ec',
              border: '1px solid #86B9D6',
              borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
              borderRadius: 100,
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
          />
        </>
      )}
    </>
  );
}
