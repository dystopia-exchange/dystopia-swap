import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles, styled, useTheme } from '@mui/styles';
import Skeleton from '@mui/lab/Skeleton';
import {
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  InputAdornment,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Typography,
  Tooltip,
  Toolbar,
  Grid,
  Box, IconButton,
} from '@mui/material';
import { useRouter } from "next/router";
import {
  Add,
  ArrowDropDown,
  EnhancedEncryptionOutlined, KeyboardArrowLeft, KeyboardArrowRight, KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
  Lock,
  LockOutlined,
} from '@mui/icons-material';
import moment from 'moment';

import { formatCurrency } from '../../utils';
import { useAppThemeContext } from '../../ui/AppThemeProvider';

function descendingComparator(a, b, orderBy) {
  if (!a || !b) {
    return 0;
  }

  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
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
  },
  {
    id: '',
    numeric: true,
    disablePadding: false,
    label: 'Actions',
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
  const { classes, order, orderBy, onRequestSort } = props;
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
    fontSize: '12px'
  },
  headerText: {
    fontWeight: '200',
    fontSize: '12px'
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
    borderRadius: '30px'
  },
  img2Logo: {
    position: 'absolute',
    left: '20px',
    zIndex: '1',
    top: '0px'
  },
  overrideTableHead: {
    borderBottom: '1px solid rgba(104,108,122,0.2) !important',
  },
  doubleImages: {
    display: 'flex',
    position: 'relative',
    width: '70px',
    height: '35px'
  },
  buttonOverride: {
    color: 'rgb(6, 211, 215)',
    background: 'rgb(23, 52, 72)',
    fontWeight: '700',
    width: '100%',
    '&:hover': {
      background: 'rgb(19, 44, 60)'
    },
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 30,
    padding: 0,
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
}));

const EnhancedTableToolbar = (props) => {
  const classes = useStyles()
  const router = useRouter()

  const [search, setSearch] = useState('');

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
  };

  const onCreate = () => {
    router.push('/vest/create')
  }

  const {appTheme} = useAppThemeContext();

  return (
    <Toolbar className={ classes.toolbar }>
      <div
        className={[classes.addButton, classes[`addButton--${appTheme}`]].join(' ')}
        onClick={onCreate}>
        <div className={classes.addButtonIcon}>
          <LockOutlined style={{width: 20, color: '#fff'}}/>
        </div>

        <Typography className={[classes.actionButtonText, classes[`actionButtonText--${appTheme}`]].join(' ')}>
          Create Lock
        </Typography>
      </div>
    </Toolbar>
  );
};

export default function EnhancedTable({ vestNFTs, govToken, veToken }) {
  const classes = useStyles();
  const router = useRouter();

  const [order, setOrder] = React.useState('desc');
  const [orderBy, setOrderBy] = React.useState('balance');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [tableHeight, setTableHeight] = useState(window.innerHeight - 50 - 64 - 30 - 60 - 54 - 20 - 30);

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
        <Skeleton variant="rect" width={'100%'} height={40} className={classes.skelly1} />
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly} />
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly} />
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly} />
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly} />
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly} />
      </div>
    );
  }

  const onView = (nft) => {
    router.push(`/vest/${nft.id}`);
  };

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, vestNFTs.length - page * rowsPerPage);

  const {appTheme} = useAppThemeContext();

  function TablePaginationActions(props) {
    const theme = useTheme();
    const { count, page, rowsPerPage, onPageChange } = props;

    const handleFirstPageButtonClick = (event) => {
      onPageChange(event, 0);
    };

    const handleBackButtonClick = (event) => {
      onPageChange(event, page - 1);
    };

    const handleNextButtonClick = (event) => {
      onPageChange(event, page + 1);
    };

    const handleLastPageButtonClick = (event) => {
      onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    };

    return (
      <Box sx={{ flexShrink: 0, ml: 2.5 }}>
        <IconButton
          onClick={handleFirstPageButtonClick}
          disabled={page === 0}
          aria-label="first page"
          style={{
            width: 30,
            height: 30,
            border: '1px solid #86B9D6',
            borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
            color: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
          }}>
          {theme.direction === 'rtl' ? <KeyboardDoubleArrowRight /> : <KeyboardDoubleArrowLeft />}
        </IconButton>

        <IconButton
          onClick={handleBackButtonClick}
          disabled={page === 0}
          aria-label="previous page"
          style={{
            width: 30,
            height: 30,
            marginLeft: 10,
            border: '1px solid #86B9D6',
            borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
            color: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
          }}>
          {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
        </IconButton>

        <IconButton
          onClick={handleNextButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="next page"
          style={{
            width: 30,
            height: 30,
            marginLeft: 10,
            border: '1px solid #86B9D6',
            borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
            color: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
          }}>
          {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
        </IconButton>

        <IconButton
          onClick={handleLastPageButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="last page"
          style={{
            width: 30,
            height: 30,
            marginLeft: 10,
            border: '1px solid #86B9D6',
            borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
            color: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
          }}>
          {theme.direction === 'rtl' ? <KeyboardDoubleArrowLeft /> : <KeyboardDoubleArrowRight />}
        </IconButton>
      </Box>
    );
  }

  window.addEventListener('resize', () => {
    setTableHeight(window.innerHeight - 50 - 64 - 30 - 60 - 54 - 20 - 30);
  });

  return (
    <>
      <EnhancedTableToolbar />
      <Paper elevation={0} className={ classes.tableContainer}>
        <TableContainer
          style={{
            overflow: 'auto',
            height: tableHeight,
          }}>
          <Table
            stickyHeader
            className={classes.table}
            aria-labelledby='tableTitle'
            size={'medium'}
            aria-label='enhanced table'>
            <EnhancedTableHead
              classes={classes}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort} />

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
                        border: '1px dashed #CFE5F2',
                        borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
                      }}
                      className={classes.cell}>
                      <div className={classes.inline}>
                        <div className={ classes.doubleImages}>
                          <img
                            className={classes.img1Logo}
                            src={ govToken?.logoURI }
                            width='35'
                            height='35'
                            alt=''
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/tokens/unknown-logo.png';
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
                      align='right'
                      style={{
                        background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                        border: '1px dashed #CFE5F2',
                        borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
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
                        { govToken?.symbol }
                      </Typography>
                    </TableCell>

                    <TableCell
                      className={classes.cell}
                      align='right'
                      style={{
                        background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                        border: '1px dashed #CFE5F2',
                        borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
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
                        { veToken?.symbol }
                      </Typography>
                    </TableCell>

                    <TableCell
                      className={classes.cell}
                      align='right'
                      style={{
                        background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                        border: '1px dashed #CFE5F2',
                        borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
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
                        { moment.unix(row.lockEnds).format('YYYY-MM-DD') }
                      </Typography>

                      <Typography
                        className={classes.textSpaced}
                        style={{
                          fontWeight: 400,
                          fontSize: 14,
                          lineHeight: '120%',
                          color: appTheme === 'dark' ? '#7C838A' : '#5688A5',
                        }}>
                        Expires { moment.unix(row.lockEnds).fromNow() }
                      </Typography>
                    </TableCell>

                    <TableCell
                      className={classes.cell}
                      align='right'
                      style={{
                        background: appTheme === 'dark' ? '#151718' : '#DBE6EC',
                        border: '1px dashed #CFE5F2',
                        borderColor: appTheme === 'dark' ? '#2D3741' : '#CFE5F2',
                        overflow: 'hidden',
                      }}>
                      <Button
                        variant='outlined'
                        color='primary'
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
          </Table>
        </TableContainer>

        <TablePagination
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
          ActionsComponent={TablePaginationActions}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </>
  );
}
