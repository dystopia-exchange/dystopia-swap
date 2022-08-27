import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles, styled } from '@mui/styles';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Typography,
  Slider,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails, Button, DialogTitle, DialogContent, Dialog, InputBase, MenuItem, Select,
} from '@mui/material';
import numeral from "numeral";
import BigNumber from 'bignumber.js';

import { formatCurrency } from '../../utils';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import TablePaginationActions from '../table-pagination/table-pagination';
import SortSelect from '../select-sort/select-sort';
import { formatSymbol } from '../../utils';
import css from "./ssVotesTable.module.css";
import cssTokenSelect from '../select-token/select-token.module.css';

const CustomSlider = styled(Slider)(({theme, appTheme, disabled}) => {

  const MuiSliderthumb = {
    backgroundColor: '#C0E255',
  }

  const MuiSliderTrack = {
    // backgroundColor: '#9BC9E4',
  }

  const MuiSliderRail = {
    background: appTheme === 'dark'
      ? 'linear-gradient(to left, #1B4F20 50%, #631515 50%)'
      : 'linear-gradient(to left, #A2E3A9 50%, #EC9999 50%)'
  }

  if (disabled) {
    MuiSliderthumb.backgroundColor = appTheme === 'dark' ? '#7F828B' : '#A3A9BA'
    MuiSliderTrack.backgroundColor = '#D4D5DB'
    MuiSliderRail.background = 'rgb(210 210 210)'
  }

  return ({
    color: appTheme === 'dark' ? '#3880ff' : '#3880ff',
    height: 4,
    padding: '15px 0',
    '& .MuiSlider-thumb': {
      borderRadius: 12,
      height: 12,
      width: 24,
      backgroundColor: MuiSliderthumb.backgroundColor,
      boxShadow: 'none',
      '&:focus, &:hover, &.Mui-active': {
        boxShadow: 'none',
        '@media (hover: none)': {
          boxShadow: 'none',
        },
      },
    },
    '& .MuiSlider-valueLabel': {
      fontSize: 16,
      fontWeight: 500,
      top: -8,
      // border: '1px solid #0B5E8E',
      background: 'transparent',
      padding: 5,
      borderRadius: 0,
      '&:before': {
        borderBottom: '1px solid #0B5E8E',
        borderRight: '1px solid #0B5E8E',
      },
      '& *': {
        color: '#E4E9F4',
      },
    },
    '& .MuiSlider-track': {
      border: 'none',
      backgroundColor: MuiSliderTrack.backgroundColor,
      opacity: 0,
    },
    '& .MuiSlider-rail': {
      opacity: 1,
      // backgroundColor: '#9BC9E4',
      background: MuiSliderRail.background,
    },
    '& .MuiSlider-mark': {
      opacity: 0,
      backgroundColor: "transparent",
      height: 2,
      width: 2,
      '&.MuiSlider-markActive': {
        // backgroundColor: disabled ? MuiSliderTrack.backgroundColor : '#CFE5F2',
        opacity: 0,
      },
    },
    '& .MuiSlider-mark:nth-of-type(20n)': {
      opacity: 1,

      '&.MuiSlider-markActive': {
        opacity: 1,
      }
    },
  });
});

function descendingComparator(a, b, orderBy, sliderValues) {
  if (!a || !b) {
    return 0;
  }

  switch (orderBy) {
    case 'asset':
      return formatSymbol(a.symbol).localeCompare(formatSymbol(b.symbol));

    case 'tvl':
      if (BigNumber(b?.tvl).lt(a?.tvl)) {
        return -1;
      }
      if (BigNumber(b?.tvl).gt(a?.tvl)) {
        return 1;
      }
      return 0;

    case 'balance':
      if (BigNumber(b?.gauge?.balance).lt(a?.gauge?.balance)) {
        return -1;
      }
      if (BigNumber(b?.gauge?.balance).gt(a?.gauge?.balance)) {
        return 1;
      }
      return 0;

    case 'liquidity':
      let reserveA = BigNumber(a?.reserve0).plus(a?.reserve1).toNumber();
      let reserveB = BigNumber(b?.reserve0).plus(b?.reserve1).toNumber();

      if (BigNumber(reserveB).lt(reserveA)) {
        return -1;
      }
      if (BigNumber(reserveB).gt(reserveA)) {
        return 1;
      }
      return 0;

    case 'totalVotes':
      if (BigNumber(b?.gauge?.weight).lt(a?.gauge?.weight)) {
        return -1;
      }
      if (BigNumber(b?.gauge?.weight).gt(a?.gauge?.weight)) {
        return 1;
      }
      return 0;

    case 'apy':
      let apyA = a?.gaugebribes.bribeTokens.length ? (
        a?.gaugebribes.bribeTokens.map((bribe, idx) => {
          return BigNumber(bribe.left).toNumber()
        }).reduce((partialSum, a) => partialSum + a, 0)
      ) : 0;

      let apyB = b?.gaugebribes.bribeTokens.length ? (
        b?.gaugebribes.bribeTokens.map((bribe, idx) => {
          return BigNumber(bribe.left).toNumber()
        }).reduce((partialSum, a) => partialSum + a, 0)
      ) : 0;

      return apyA - apyB;

    case 'myVotes':
    case 'mvp':
      // BigNumber(sliderValue).div(100).times(token?.lockValue)
      let sliderValueA = sliderValues.find((el) => el.address === a?.address)?.value;
      if (sliderValueA) {
        sliderValueA = BigNumber(sliderValueA).toNumber(0);
      } else {
        sliderValueA = 0;
      }

      let sliderValueB = sliderValues.find((el) => el.address === b?.address)?.value;
      if (sliderValueB) {
        sliderValueB = BigNumber(sliderValueB).toNumber(0);
      } else {
        sliderValueB = 0;
      }

      return sliderValueA - sliderValueB;

    default:
      return 0;
  }

}

function getComparator(order, orderBy, sliderValues) {
  return order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy, sliderValues) : (a, b) => -descendingComparator(a, b, orderBy, sliderValues);
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
    id: 'asset',
    numeric: false,
    disablePadding: false,
    label: 'Asset',
    isSticky: true,
    isHideInDetails: true,
  },
  {
    id: 'tvl',
    numeric: true,
    disablePadding: false,
    label: 'TVL',
    isHideInDetails: true,
  },
  {
    id: 'apr',
    numeric: true,
    disablePadding: false,
    label: 'APR %',
    isHideInDetails: true,
  },
  {
    id: 'balance',
    numeric: true,
    disablePadding: false,
    label: 'My Stake',
  },
  {
    id: 'liquidity',
    numeric: true,
    disablePadding: false,
    label: 'Total Liquidity',
  },
  {
    id: 'totalVotes',
    numeric: true,
    disablePadding: false,
    label: 'Total Votes',
    isHideInDetails: true,
  },
  {
    id: 'apy',
    numeric: true,
    disablePadding: false,
    label: 'Bribes',
  },
  {
    id: 'myVotes',
    numeric: true,
    disablePadding: false,
    label: 'My Votes',
  },
];

const StickyTableCell = styled(TableCell)(({theme, appTheme}) => ({
  color: appTheme === 'dark' ? '#C6CDD2 !important' : '#325569 !important',
  width: 310,
  left: 0,
  position: "sticky",
  zIndex: 5,
  whiteSpace: 'nowrap',
  padding: '15px 24px 16px',
}));

const StyledTableCell = styled(TableCell)(({theme, appTheme}) => ({
  background: appTheme === 'dark' ? '#24292D' : '#CFE5F2',
  width: 'auto',
  whiteSpace: 'nowrap',
  padding: '15px 24px 16px',
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
                    background: '#060B17',
                    borderBottom: `1px solid #d3f85a`,
                    // zIndex: 10,
                  }}>
                  <TableSortLabel
                    active={orderBy === headCell.id}
                    direction={orderBy === headCell.id ? order : 'asc'}
                    IconComponent={() => orderBy === headCell.id ? sortIcon(order) : null}
                    onClick={createSortHandler(headCell.id)}>
                    <Typography
                      className={classes.headerText}
                      style={{
                        fontWeight: 500,
                        fontSize: 14,
                        lineHeight: '115%',
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
                        lineHeight: '115%',
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
  return ({
    tokenSelect: {
      marginBottom: 24,
    },
    voteTooltip: {
      background: '#060B17',
      border: '1px solid #D3F85A',
      borderRadius: 12,
      flexDirection: 'column',
      width: 448,
      height: 172,
      position: 'absolute',
      top: 46,
      right: 14,
      zIndex: 1,
      padding: '24px 24px',
    },
    voteTooltipSliderValues: {
      display: 'flex',
      justifyContent: 'space-between',
      color: '#586586',
      fontSize: 16,
      fontWeight: 400,
      marginBottom: 3,
    },
    voteTooltipSlider: {},
    voteTooltipBody: {
      display: 'flex',
      textAlign: 'left',
      marginTop: 3,
      justifyContent: 'space-between',
      height: 56,
    },
    voteTooltipText: {
      width: 160,
      color: '#8191B9',
      fontSize: 16,
      fontWeight: 400,
      display: 'flex',
      alignItems: 'center',
    },
    voteTooltipTextModal: {
      // width: 160,
      color: '#8191B9',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: '20px',
      display: 'flex',
      // alignItems: 'center',
      marginBottom: 12,
    },
    voteTooltipVoteBlock: {
      display: 'flex',
      width: 223,
      border: '1px solid #586586',
      borderRadius: 12,
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
    },
    voteTooltipVoteBlockModal: {
      display: 'flex',
      width: '100%',
      border: '1px solid #586586',
      borderRadius: 12,
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
    },
    voteTooltipVoteBlockTitle: {
      color: '#E4E9F4',
      fontSize: 16,
      fontWeight: 500,
      marginLeft: 14,
    },
    voteTooltipVoteBlockInput: {
      background: '#171D2D',
      border: '1px solid #586586',
      borderRadius: 12,
      width: 113,
      height: 56,
      padding: 0,
      fontSize: 16,
      fontWeight: 400,
      color: '#8191B9',
      paddingLeft: 32,
      boxSizing: 'border-box',
    },
    voteTooltipVoteBlockInputModal: {
      background: '#171D2D',
      border: '1px solid #586586',
      borderRadius: 12,
      width: 193,
      height: 56,
      padding: 0,
      fontSize: 16,
      fontWeight: 400,
      color: '#8191B9',
      paddingLeft: 32,
      boxSizing: 'border-box',
    },
    voteTooltipVoteBlockInputAddornment: {
      position: 'absolute',
      right: 32,
      fontSize: 16,
      fontWeight: 400,
      color: '#8191B9',
    },
    cont: {
      ["@media (min-width:1920px)"]: {
        marginLeft: 400,
      },
    },
    root: {
      width: '100%',
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
    inlinePair: {
      display: 'flex',
      alignItems: 'center',
      background: '#171D2D',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      height: 72,
    },
    inlineBetween: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0px',
    },
    icon: {
      marginRight: '12px',
    },
    textSpaced: {
      lineHeight: '1.5',
      fontWeight: '200',
      fontSize: '12px',
    },
    textSpacedFloat: {
      lineHeight: '1.5',
      fontWeight: '200',
      fontSize: '12px',
      float: 'right',
    },
    symbol: {
      minWidth: '40px',
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
      borderBottom: '1px solid rgba(128, 128, 128, 0.32)',
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
      borderBottom: '1px solid rgba(128, 128, 128, 0.32)',
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
      marginRight: '12px',
    },
    tableContainer: {
      overflowX: 'hidden',
    },
    overrideTableHead: {
      borderBottom: '1px solid rgba(104,108,122,0.2) !important',
    },
    headerText: {
      fontWeight: '200',
      fontSize: '12px',
    },
    tooltipContainer: {
      minWidth: '240px',
      padding: '0px 15px',
    },
    infoIcon: {
      color: '#06D3D7',
      fontSize: '16px',
      float: 'right',
      marginLeft: '10px',
    },
    doubleImages: {
      display: 'flex',
      position: 'relative',
      width: '80px',
      height: '35px',
    },
    img1Logo: {
      position: 'absolute',
      left: '0px',
      top: '0px',
      borderRadius: '30px',
      outline: '2px solid #DBE6EC',
      background: '#13B5EC',
    },
    img2Logo: {
      position: 'absolute',
      left: '28px',
      // zIndex: '1',
      top: '0px',
      outline: '2px solid #DBE6EC',
      background: '#13B5EC',
      borderRadius: '30px',
    },
    'img1Logo--dark': {
      outline: '2px solid #151718',
      ["@media (max-width:660px)"]: {
        outline: '2px solid #24292d',
      }
    },
    'img2Logo--dark': {
      outline: '2px solid #151718',
      ["@media (max-width:660px)"]: {
        outline: '2px solid #24292d',
      }
    },
    inlineEnd: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    table: {
      tableLayout: 'auto',
    },
    tableBody: {
      background: '#171D2D',
    },
    sortSelect: {
      position: 'absolute',
      top: 65,
      right: 48,
      ["@media (max-width:680px)"]: {
        top: 53,
        right: 12,
      },
    },
    accordionSummaryContent: {
      margin: 0,
      padding: 0,
    },
    dialogPaper: {
      borderRadius: 12,
      width: 353,
      background: '#060B17',
      border: '1px solid #D3F85A',
    },
    dialogBody: {
      background: 'rgba(0, 0, 0, 0.1) !important',
      backdropFilter: 'blur(10px) !important',
    },
    cellPaddings: {
      padding: '11px 20px',
      ["@media (max-width:530px)"]: {
        // eslint-disable-line no-useless-computed-key
        // padding: 10,
      },
    },
    cellHeadPaddings: {
      padding: '16px 20px',
      ["@media (max-width:530px)"]: {
        // eslint-disable-line no-useless-computed-key
        // padding: '8px 10px',
      },
    },
  });
});

export default function EnhancedTable({gauges, setParentSliderValues, defaultVotes, veToken, token, showSearch, noTokenSelected, handleChangeNFT, vestNFTs}) {
  const classes = useStyles();
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('totalVotes');
  const [sliderValues, setSliderValues] = useState(defaultVotes);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [tableHeight, setTableHeight] = useState(window.innerHeight/* - 50 - 64 - 30 - 60 - 54 - 20 - 30*/);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const options = [
    {id: 'balance--desc', label: 'My Stake: high to low'},
    {id: 'balance--asc', label: 'My Stake: low to high'},
    {id: 'liquidity--desc', label: 'Total Liquidity: high to low'},
    {id: 'liquidity--asc', label: 'Total Liquidity: low to high'},
    {id: 'totalVotes--desc', label: 'Total Votes: high to low'},
    {id: 'totalVotes--asc', label: 'Total Votes: low to high'},
    {id: 'apy--desc', label: 'Bribes: high to low'},
    {id: 'apy--asc', label: 'Bribes: low to high'},
    {id: 'myVotes--desc', label: 'My Votes: high to low'},
    {id: 'myVotes--asc', label: 'My Votes: low to high'},
  ];

  const [sortValueId, setSortValueId] = useState('totalVotes--desc');
  const [sortDirection, setSortDirection] = useState('asc');
  const [expanded, setExpanded] = useState('');
  const [voteDialogOpen, setVoteDialogOpen] = useState(false);

  const {appTheme} = useAppThemeContext();

  useEffect(() => {
    setSliderValues(defaultVotes);
  }, [defaultVotes]);

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

  const onSliderChange = (event, value, asset) => {
    let newSliderValues = [...sliderValues];

    newSliderValues = newSliderValues.map((val) => {
      if (asset?.address === val.address) {
        val.value = value;
      }
      return val;
    });

    setParentSliderValues(newSliderValues);
  };

  const handleChangeSort = ({target: {value}}) => {
    const property = value.substring(0, value.indexOf('--'));
    const event = value.substring(value.indexOf('--') + 2);

    setSortValueId(value);
    setSortDirection(event);

    handleRequestSort(event, property);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!gauges) {
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

  const marks = [
    {
      value: -100,
      label: '-100',
    },
    {
      value: 0,
      label: '0',
    },
    {
      value: 100,
      label: '100',
    },
  ];

  function tableCellContent(data1, data2, symbol1, symbol2) {
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
          <Typography
            className={classes.textSpaced}
            style={{
              marginBottom: 8,
              fontWeight: 400,
              fontSize: 14,
              lineHeight: '115%',
              color: '#E4E9F4',
            }}>
            {data1}
          </Typography>

          <Typography
            className={classes.textSpaced}
            style={{
              fontWeight: 400,
              fontSize: 14,
              lineHeight: '115%',
              color: '#E4E9F4',
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
                marginBottom: 8,
                fontWeight: 400,
                fontSize: 14,
                lineHeight: '115%',
                color: '#8191B9',
              }}>
              {symbol1}
            </Typography>

            <Typography
              className={`${classes.textSpaced} ${classes.symbol}`}
              style={{
                fontWeight: 400,
                fontSize: 14,
                lineHeight: '120%',
                color: '#8191B9',
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

  const closeModal = () => {
    setVoteDialogOpen(false);
  };

  const openVoteDialog = (row) => {
    setVoteDialogOpen(row?.address);
  };

  window.addEventListener('resize', () => {
    setTableHeight(window.innerHeight - 50 - 64 - 30 - 60 - 54 - 20 - 30);
    setWindowWidth(window.innerWidth);
  });


  const [voteTooltipOpen, setVoteTooltipOpen] = useState(false);

  const [openSelectToken, setOpenSelectToken] = useState(false);

  const toggleSelect = (t) => {
    if (openSelectToken) {
      setOpenSelectToken(false)
    } else {
      setOpenSelectToken(t?.address);
    }
  };

  return (
    <>
      {windowWidth >= 806 &&
        <div
          style={{
            marginTop: 0, /*((windowWidth <= 1360 && showSearch) || windowWidth <= 1210) ? 45 : 0,*/
            border: '1px solid #D3F85A',
            borderRadius: 12,
            overflow: 'hidden',
          }}
          className={classes.cont}
        >
          <TableContainer
            className={'g-flex-column__item'}
            style={{
              overflow: 'auto',
              // maxHeight: 1000,/*tableHeight,*/
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
                {stableSort(gauges, getComparator(order, orderBy, sliderValues))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
                    if (!row) {
                      return null;
                    }
                    let sliderValue = sliderValues.find((el) => el.address === row?.address)?.value;
                    if (sliderValue) {
                      sliderValue = BigNumber(sliderValue).toNumber(0);
                    } else {
                      sliderValue = 0;
                    }

                    return (
                      <TableRow key={row?.gauge?.address}>
                        <StickyTableCell
                          style={{
                            background: '#171D2D',
                            borderBottom: '1px solid #323B54',
                          }}
                          className={classes.cell}>
                          <div className={classes.inline}>
                            <div className={classes.doubleImages}>
                              <img
                                className={[classes.img1Logo, classes[`img1Logo--${appTheme}`]].join(' ')}
                                src={(row && row.token0 && row.token0.logoURI) ? row.token0.logoURI : ``}
                                width="36"
                                height="36"
                                alt=""
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                }}
                              />
                              <img
                                className={[classes.img2Logo, classes[`img2Logo--${appTheme}`]].join(' ')}
                                src={(row && row.token1 && row.token1.logoURI) ? row.token1.logoURI : ``}
                                width="36"
                                height="36"
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
                                  lineHeight: '125%',
                                  color: '#E4E9F4',
                                }}
                                noWrap>
                                {formatSymbol(row?.symbol)}
                              </Typography>
                              <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 400,
                                  fontSize: 14,
                                  lineHeight: '115%',
                                  color: '#8191B9',
                                }}
                                noWrap>
                                {row?.isStable ? 'Stable Pool' : 'Volatile Pool'}
                              </Typography>
                            </div>
                          </div>
                        </StickyTableCell>
                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background: '#171D2D',
                            borderBottom: '1px solid #323B54',
                            overflow: 'hidden',
                          }}>
                            
                          {
                            tableCellContent(
                              `${(numeral(BigNumber(row?.tvl).toLocaleString()).format('($ 0a)'))} `,
                              null,
                              null,
                              null,
                            )
                          }
                        </TableCell>
                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background: '#171D2D',
                            borderBottom: '1px solid #323B54',
                            overflow: 'hidden',
                          }}>
                          {
                            tableCellContent(
                              `${formatCurrency(BigNumber(row?.gauge?.apr), 0)}%`,
                              `${formatCurrency(BigNumber(row?.gauge?.expectAPR), 0)}%`,
                              'Current',
                              'Next week'
                            )
                          }
                          
                        </TableCell>
                        
                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background: '#171D2D',
                            borderBottom: '1px solid #323B54',
                            overflow: 'hidden',
                          }}>
                          {
                            tableCellContent(
                              formatCurrency(BigNumber(row?.gauge?.balance).div(row?.gauge?.totalSupply).times(row?.gauge?.reserve0)),
                              formatCurrency(BigNumber(row?.gauge?.balance).div(row?.gauge?.totalSupply).times(row?.gauge?.reserve1)),
                              row.token0.symbol,
                              row.token1.symbol,
                            )
                          }
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background: '#171D2D',
                            borderBottom: '1px solid #323B54',
                            overflow: 'hidden',
                          }}>
                          {
                            tableCellContent(
                              formatCurrency(BigNumber(row?.reserve0)),
                              formatCurrency(BigNumber(row?.reserve1)),
                              row.token0.symbol,
                              row.token1.symbol,
                            )
                          }
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background: '#171D2D',
                            borderBottom: '1px solid #323B54',
                            overflow: 'hidden',
                          }}>
                          {
                            tableCellContent(
                              formatCurrency(row?.gauge?.weight),
                              `${formatCurrency(row?.gauge?.weightPercent)} %`,
                              null,
                              null,
                            )
                          }
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background: '#171D2D',
                            borderBottom: '1px solid #323B54',
                            overflow: 'hidden',
                          }}>
                          {
                            row?.gaugebribes.bribeTokens.length ? (
                                row?.gaugebribes.bribeTokens
                                  .filter(x => !BigNumber(x?.left).isZero())
                                  .map((bribe, idx) => {
                                  return (
                                    <>
                                      {
                                        tableCellContent(
                                          formatCurrency(bribe.left),
                                          null,
                                          bribe.token.symbol + ` (${Number(bribe.apr).toFixed(1)}% APR)`,
                                          null,
                                        )
                                      }
                                    </>
                                  );
                                })
                              )
                              : null
                          }
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background: '#171D2D',
                            borderBottom: '1px solid #323B54',
                            // overflow: 'hidden',
                          }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            position: 'relative',
                          }}>
                            <div>
                              {
                                tableCellContent(
                                    formatCurrency(BigNumber(sliderValue).div(100).times(token?.lockValue)),
                                    `${formatCurrency(sliderValue)} %`,
                                    null,
                                    null,
                                )
                              }
                            </div>
                            <div>
                              <Button
                                  variant="outlined"
                                  color="primary"
                                  style={{
                                    padding: '7px 14px',
                                    border: `1px solid rgb(211, 248, 90)`,
                                    borderRadius: 12,
                                    fontWeight: 600,
                                    fontSize: 14,
                                    lineHeight: '120%',
                                    color: 'rgb(211, 248, 90)',
                                    textTransform: 'uppercase',
                                    marginLeft: 20,
                                    background: voteTooltipOpen == row.address ? '#C0E255' : 'transparent',
                                  }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    event.preventDefault();

                                    if (voteTooltipOpen == row.address) {
                                      setVoteTooltipOpen(false)
                                    } else {
                                      setVoteTooltipOpen(row.address)
                                    }
                                  }}>
                                VOTE
                              </Button>
                              <div
                                  className={classes.voteTooltip}
                                  style={{display: voteTooltipOpen == row.address ? 'flex' : 'none'}}
                              >
                                <div className={classes.voteTooltipSliderValues}>
                                  <span style={{width: 36,}}>-100</span>
                                  <span>0</span>
                                  <span style={{width: 36,}}>100</span>
                                </div>
                                <div className={classes.voteTooltipSlider}>
                                  <CustomSlider
                                      appTheme={appTheme}
                                      valueLabelDisplay="on"
                                      value={sliderValue}
                                      onChange={(event, value) => {
                                        onSliderChange(event, value, row);
                                      }}
                                      min={-100}
                                      max={100}
                                      marks
                                      step={1}
                                      disabled={noTokenSelected}
                                  />
                                </div>

                                <div className={classes.voteTooltipBody}>
                                  <div className={classes.voteTooltipText}>
                                    Move slider or edit your vote manually
                                  </div>
                                  <div className={classes.voteTooltipVoteBlock}>
                                    <div className={classes.voteTooltipVoteBlockTitle}>Your Vote</div>
                                    <InputBase
                                        value={sliderValue}
                                        onChange={(event, value) => {
                                          onSliderChange(event, event.target.value, row);
                                        }}
                                        inputProps={{
                                          className: classes.voteTooltipVoteBlockInput,
                                        }}
                                        InputProps={{
                                          disableUnderline: true,
                                        }}
                                    />
                                    <div className={classes.voteTooltipVoteBlockInputAddornment}>%</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
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
              padding: '0 30px',
              background: '#060B17',
              borderTop: '1px solid #d3f85a',
              color: '#8191B9',
              // fontSize: 14,
              // fontWeight: 500,
            }}
            labelRowsPerPage={window.innerWidth < 550 ? '' : 'Rows per page:'}
            rowsPerPageOptions={window.innerWidth < 435 ? [] : [5, 10, 25]}
            component="div"
            count={gauges.length}
            rowsPerPage={rowsPerPage}
            page={page}
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
        </div>
      }


      <div className={classes.sortSelect} style={{display: windowWidth < 806 ? 'flex' : 'none'}}>
        {SortSelect({value: sortValueId, options, handleChange: handleChangeSort, sortDirection})}
      </div>

      {windowWidth < 806 && (
        <>
          <div style={{
            overflow: 'auto',
            marginTop: 136,
          }}>
            {stableSort(gauges, getComparator(order, orderBy, sliderValues))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  if (!row) {
                    return null;
                  }
                  const labelId = `accordion-${index}`;

              let sliderValue = sliderValues.find((el) => el.address === row?.address)?.value;
              if (sliderValue) {
                sliderValue = BigNumber(sliderValue).toNumber(0);
              } else {
                sliderValue = 0;
              }

                  return (
                      <>
                        <Dialog
                            open={voteDialogOpen === row.address}
                            onClose={closeModal}
                            onClick={(e) => {
                              if (e.target.classList.contains('MuiDialog-container')) {
                                closeModal()
                              }
                            }}
                            fullWidth={false}
                            fullScreen={false}
                            BackdropProps={{style: {backgroundColor: 'transparent'}}}
                            classes={{
                              paper: classes.dialogPaper,
                              scrollPaper: classes.dialogBody,
                            }}>
                          <div>
                            <DialogTitle style={{
                              padding: 24,
                              paddingBottom: 20,
                              fontWeight: 500,
                              fontSize: 20,
                              lineHeight: '28px',
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}>
                                <div style={{
                                  color: '#E4E9F4',
                                }}>
                                  Vote
                                </div>

                                <svg onClick={closeModal} style={{
                                  cursor: 'pointer',
                                }} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M14.19 0H5.81C2.17 0 0 2.17 0 5.81V14.18C0 17.83 2.17 20 5.81 20H14.18C17.82 20 19.99 17.83 19.99 14.19V5.81C20 2.17 17.83 0 14.19 0ZM13.36 12.3C13.65 12.59 13.65 13.07 13.36 13.36C13.21 13.51 13.02 13.58 12.83 13.58C12.64 13.58 12.45 13.51 12.3 13.36L10 11.06L7.7 13.36C7.55 13.51 7.36 13.58 7.17 13.58C6.98 13.58 6.79 13.51 6.64 13.36C6.35 13.07 6.35 12.59 6.64 12.3L8.94 10L6.64 7.7C6.35 7.41 6.35 6.93 6.64 6.64C6.93 6.35 7.41 6.35 7.7 6.64L10 8.94L12.3 6.64C12.59 6.35 13.07 6.35 13.36 6.64C13.65 6.93 13.65 7.41 13.36 7.7L11.06 10L13.36 12.3Z" fill="#8191B9"/>
                                </svg>
                        </div>
                      </DialogTitle>

                      <DialogContent style={{
                        padding: 24,
                        paddingTop: 0,
                      }}>

                        <div className={classes.inlinePair}>
                          <div className={classes.doubleImages}>
                            <img
                                className={[classes.img1Logo, classes[`img1Logo--${appTheme}`]].join(' ')}
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
                                className={[classes.img2Logo, classes[`img2Logo--${appTheme}`]].join(' ')}
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
                                  fontSize: 16,
                                  lineHeight: '20px',
                                  color: '#E4E9F4',
                                  marginBottom: 2,
                                }}
                                noWrap>
                              {formatSymbol(row?.symbol)}
                            </Typography>
                            <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 400,
                                  fontSize: 14,
                                  lineHeight: '16px',
                                  color: '#8191B9',
                                }}
                                noWrap>
                              {row?.isStable ? 'Stable Pool' : 'Volatile Pool'}
                            </Typography>
                          </div>
                        </div>

                        <div className={classes.tokenSelect}>
                          <Select
                              open={openSelectToken === row.address}
                              onClick={() => {toggleSelect(row)}}
                              className={[cssTokenSelect.tokenSelect, cssTokenSelect[`tokenSelect--${appTheme}`], openSelectToken ? cssTokenSelect.tokenSelectOpen : '',].join(' ')}
                              style={{
                                border: '1px solid #D3F85A', // always visible
                              }}
                              fullWidth
                              MenuProps={{
                                classes: {
                                  list: appTheme === 'dark' ? cssTokenSelect['list--dark'] : cssTokenSelect.list,
                                  paper: cssTokenSelect.listPaper,
                                },
                              }}
                              value={token}
                              {...{
                                displayEmpty: token === null ? true : undefined,
                                renderValue: token === null ? (selected) => {
                                  if (selected === null) {
                                    return (
                                        <div className={cssTokenSelect.placeholder}>
                                          Select veCONE NFT
                                        </div>
                                    );
                                  }
                                } : undefined,
                              }}
                              onChange={handleChangeNFT}
                              IconComponent={arrowIcon}
                              inputProps={{
                                className: appTheme === 'dark' ? cssTokenSelect['tokenSelectInput--dark'] : cssTokenSelect.tokenSelectInput,
                              }}>
                            {(!vestNFTs || !vestNFTs.length) &&
                                <div className={cssTokenSelect.noNFT}>
                                  <div className={cssTokenSelect.noNFTtext}>
                                    You receive NFT by creating a Lock of your CONE for some time, the more CONE you lock and for
                                    the longest time, the more Voting Power your NFT will have.
                                  </div>
                                  <div className={cssTokenSelect.noNFTlinks}>
                        <span className={cssTokenSelect.noNFTlinkButton} onClick={() => {
                          router.push("/swap")
                        }}>BUY CONE</span>
                                    <span className={cssTokenSelect.noNFTlinkButton} onClick={() => {
                                      router.push("/vest")
                                    }}>LOCK CONE FOR NFT</span>
                                  </div>
                                </div>
                            }
                            {vestNFTs?.map((option) => {
                              return (
                                  <MenuItem
                                      key={option.id}
                                      value={option}>
                                    <div
                                        className={[cssTokenSelect.menuOption, 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                                      <Typography
                                          style={{
                                            fontWeight: 500,
                                            fontSize: 16,
                                            color: '#D3F85A',
                                          }}>
                                        #{option.id}
                                      </Typography>

                                      <div className={[cssTokenSelect.menuOptionSec, 'g-flex-column'].join(' ')}>
                                        <Typography
                                            style={{
                                              fontWeight: 400,
                                              fontSize: 16,
                                              color: '#8191B9',
                                            }}>
                                          {formatCurrency(option.lockValue)}
                                          {veToken?.symbol ? ' ' + veToken.symbol : ''}
                                        </Typography>

                                      </div>
                                    </div>
                                  </MenuItem>
                              );
                            })}
                          </Select>
                        </div>

                        <div className={classes.voteTooltipSliderValues}>
                          <span style={{width: 36,}}>-100</span>
                          <span>0</span>
                          <span style={{width: 36,}}>100</span>
                        </div>

                        <CustomSlider
                          appTheme={appTheme}
                          valueLabelDisplay="auto"
                          value={sliderValue}
                          onChange={(event, value) => {
                            onSliderChange(event, value, row);
                          }}
                          min={-100}
                          max={100}
                          marks
                          step={1}
                        />

                        <div className={classes.voteTooltipTextModal}>
                          Move slider or edit your vote manually
                        </div>

                        <div className={classes.voteTooltipVoteBlockModal}>
                          <div className={classes.voteTooltipVoteBlockTitle}>Your Vote</div>
                          <InputBase
                              value={sliderValue}
                              onChange={(event, value) => {
                                onSliderChange(event, event.target.value, row);
                              }}
                              inputProps={{
                                className: classes.voteTooltipVoteBlockInputModal,
                              }}
                              InputProps={{
                                disableUnderline: true,
                              }}
                          />
                          <div className={classes.voteTooltipVoteBlockInputAddornment}>%</div>
                        </div>

                       {/* <Button
                          variant="outlined"
                          color="primary"
                          style={{
                            width: 199,
                            height: 50,
                            marginTop: 20,
                            backgroundImage: 'url("/images/ui/btn-simple.svg")',
                            border: 'none',
                            borderRadius: 0,
                            fontWeight: 700,
                            fontSize: 16,
                            color: appTheme === 'dark' ? '#7F828B' : '#8F5AE8',
                          }}
                          onClick={closeModal}>
                          Save & Close
                        </Button>*/}
                      </DialogContent>
                    </div>
                  </Dialog>

                        <Accordion
                            key={labelId}
                            style={{
                              margin: 0,
                              marginBottom: 20,
                              background: '#171D2D',
                              borderRadius: 12,
                              // border: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
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
                                      className={[classes.img1Logo, classes[`img1Logo--${appTheme}`]].join(' ')}
                                      src={(row && row.token0 && row.token0.logoURI) ? row.token0.logoURI : ``}
                                      width="36"
                                      height="36"
                                      alt=""
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                      }}
                                  />
                                  <img
                                      className={[classes.img2Logo, classes[`img2Logo--${appTheme}`]].join(' ')}
                                      src={(row && row.token1 && row.token1.logoURI) ? row.token1.logoURI : ``}
                                      width="36"
                                      height="36"
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
                                      }}
                                      noWrap>
                                    {row?.symbol}
                                  </Typography>
                                  <Typography
                                      className={classes.textSpaced}
                                      style={{
                                        fontWeight: 400,
                                        fontSize: 14,
                                        lineHeight: '16px',
                                        color: '#8191B9',
                                      }}
                                      noWrap>
                                    {row?.isStable ? 'Stable Pool' : 'Volatile Pool'}
                                  </Typography>
                                </div>
                              </div>

                              <div
                                  style={{
                                    // borderTop: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                                    // borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                                  }}
                                  className={['g-flex', 'g-flex--align-center'].join(' ')}>
                                <div
                                    style={{
                                      width: '50%',
                                      // borderRight: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                                    }}>
                                  <Typography
                                      className={classes.cellHeadPaddings}
                                      style={{
                                        background: '#060B17',
                                        fontWeight: 500,
                                        fontSize: 14,
                                        lineHeight: '120%',
                                        // borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
                                        color: '#8191B9',
                                      }}
                                      noWrap>
                                    My Votes
                                  </Typography>

                                  <div
                                    className={classes.cellPaddings}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      height: 72,
                                      borderRight: '1px solid rgb(6, 11, 23)',
                                    }}
                                  >
                                    <div style={{display: 'flex',}}>
                                      <div
                                          // className={classes.inlineEnd}
                                          style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            // alignItems: 'flex-end',
                                          }}
                                      >
                                        <Typography
                                            className={classes.textSpaced}
                                            style={{
                                              marginBottom: 4,
                                              fontWeight: 400,
                                              fontSize: 14,
                                              lineHeight: '120%',
                                              color: '#E4E9F4',
                                              whiteSpace: 'nowrap',
                                            }}>
                                          {formatCurrency(BigNumber(sliderValue).div(100).times(token?.lockValue))}
                                        </Typography>

                                        <Typography
                                            className={classes.textSpaced}
                                            style={{
                                              fontWeight: 400,
                                              fontSize: 14,
                                              lineHeight: '120%',
                                              color: '#E4E9F4',
                                              whiteSpace: 'nowrap',
                                            }}>
                                          {`${formatCurrency(sliderValue)} %`}
                                        </Typography>
                                      </div>

                                      <Button
                                          variant="outlined"
                                          color="primary"
                                          style={{
                                            padding: '7px 14px',
                                            border: `1px solid rgb(211, 248, 90)`,
                                            borderRadius: 12,
                                            fontWeight: 600,
                                            fontSize: 14,
                                            lineHeight: '120%',
                                            color: 'rgb(211, 248, 90)',
                                            textTransform: 'uppercase',
                                            marginLeft: 20,
                                          }}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            event.preventDefault();

                                            openVoteDialog(row);
                                          }}>
                                        Vote
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                <div
                                    style={{
                                      width: '50%',
                                    }}>
                                  <Typography
                                      className={classes.cellHeadPaddings}
                                      style={{
                                        background: '#060B17',
                                        fontWeight: 500,
                                        fontSize: 14,
                                        lineHeight: '120%',
                                        // borderBottom: `1px solid ${appTheme === 'dark' ? '#2D3741' : '#9BC9E4'}`,
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
                                        alignItems: 'center',
                                        height: 72,
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
                                            marginBottom: 4,
                                            fontWeight: 400,
                                            fontSize: 14,
                                            lineHeight: '120%',
                                            color: '#E4E9F4',
                                            whiteSpace: 'nowrap',
                                          }}>
                                        {`${(numeral(BigNumber(row?.tvl).toLocaleString()).format('($ 0a)'))} `}
                                      </Typography>

                                      <Typography
                                          className={classes.textSpaced}
                                          style={{
                                            fontWeight: 400,
                                            fontSize: 14,
                                            lineHeight: '120%',
                                            color: '#E4E9F4',
                                            whiteSpace: 'nowrap',
                                          }}>
                                        {`${
                                            formatCurrency(BigNumber.sum(BigNumber(row?.gauge?.apr).div(100).times(40),
                                                BigNumber(row?.gauge?.boostedApr0),
                                                BigNumber(row?.gauge?.boostedApr1)
                                            ), 0)
                                        }→${
                                            formatCurrency(BigNumber.sum(BigNumber(row?.gauge?.apr),
                                                BigNumber(row?.gauge?.boostedApr0),
                                                BigNumber(row?.gauge?.boostedApr1)
                                            ),0)
                                        } %`}
                                      </Typography>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div
                                  style={{
                                    padding: '10px 20px',
                                    background: '#060B17',
                                  }}
                                  className={['g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                                <Typography
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '120%',
                                      color: '#779BF4',
                                    }}
                                    noWrap>
                                  {expanded !== labelId ? 'Show' : 'Hide'} details
                                </Typography>

                                {expanded !== labelId &&
                                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M25.5 13C25.5 6.1125 19.8875 0.5 13 0.499999C6.1125 0.499999 0.5 6.1125 0.499999 13C0.499999 19.8875 6.1125 25.5 13 25.5C19.8875 25.5 25.5 19.8875 25.5 13ZM12.3375 16.4875L7.925 12.075C7.7375 11.8875 7.65 11.65 7.65 11.4125C7.65 11.175 7.7375 10.9375 7.925 10.75C8.2875 10.3875 8.8875 10.3875 9.25 10.75L13 14.5L16.75 10.75C17.1125 10.3875 17.7125 10.3875 18.075 10.75C18.4375 11.1125 18.4375 11.7125 18.075 12.075L13.6625 16.4875C13.3 16.8625 12.7 16.8625 12.3375 16.4875Z" fill="#779BF4"/>
                                    </svg>
                                }

                                {expanded === labelId &&
                                    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M25.5 13C25.5 19.8875 19.8875 25.5 13 25.5C6.1125 25.5 0.5 19.8875 0.499999 13C0.499999 6.1125 6.1125 0.500001 13 0.500001C19.8875 0.5 25.5 6.1125 25.5 13ZM12.3375 9.5125L7.925 13.925C7.7375 14.1125 7.65 14.35 7.65 14.5875C7.65 14.825 7.7375 15.0625 7.925 15.25C8.2875 15.6125 8.8875 15.6125 9.25 15.25L13 11.5L16.75 15.25C17.1125 15.6125 17.7125 15.6125 18.075 15.25C18.4375 14.8875 18.4375 14.2875 18.075 13.925L13.6625 9.5125C13.3 9.1375 12.7 9.1375 12.3375 9.5125Z" fill="#779BF4"/>
                                    </svg>
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
                                            height: 72,
                                            borderTop: `1px solid #060B17`,
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
                                              fontSize: 14,
                                              lineHeight: '120%',
                                              color: '#8191B9',
                                              borderRight: `1px solid #060B17`,
                                            }}
                                            noWrap
                                        >
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
                                                  fontWeight: 400,
                                                  fontSize: 14,
                                                  lineHeight: '120%',
                                                  color: '#E4E9F4',
                                                  whiteSpace: 'nowrap',
                                                }}>
                                              {headCell.id === 'tvl' && `${(numeral(BigNumber(row?.tvl).toLocaleString()).format('($ 0a)'))} `}
                                              {headCell.id === 'apr' && `${
                                                  formatCurrency(BigNumber.sum(BigNumber(row?.gauge?.apr).div(100).times(40),
                                                      BigNumber(row?.gauge?.boostedApr0),
                                                      BigNumber(row?.gauge?.boostedApr1)
                                                  ), 0)
                                              }→${
                                                  formatCurrency(BigNumber.sum(BigNumber(row?.gauge?.apr),
                                                      BigNumber(row?.gauge?.boostedApr0),
                                                      BigNumber(row?.gauge?.boostedApr1)
                                                  ),0)
                                              } %`}
                                              {headCell.id === 'balance' && formatCurrency(BigNumber(row?.gauge?.balance).div(row?.gauge?.totalSupply).times(row?.gauge?.reserve0))}
                                              {headCell.id === 'liquidity' && formatCurrency(BigNumber(row?.reserve0))}
                                              {headCell.id === 'apy' && row?.gaugebribes.bribeTokens.length ? (
                                                      row?.gaugebribes.bribeTokens
                                                        .filter(x => !BigNumber(x?.left).isZero())
                                                        .map((bribe, idx) => {
                                                        return (
                                                            <div className={['g-flex-column', 'g-flex--align-end'].join(' ')}>
                                                              {`${Number(bribe.apr).toFixed(1)}% APR`}
                                                            </div>
                                                        );
                                                      })
                                                  )
                                                  : null}

                                    {headCell.id === 'myVotes' && formatCurrency(BigNumber(sliderValue).div(100).times(token?.lockValue))}
                                  </Typography>

                                            <Typography
                                                className={classes.textSpaced}
                                                style={{
                                                  fontWeight: 400,
                                                  fontSize: 14,
                                                  lineHeight: '120%',
                                                  color: '#E4E9F4',
                                                  whiteSpace: 'nowrap',
                                                }}>

                                    {headCell.id === 'balance' && formatCurrency(BigNumber(row?.gauge?.balance).div(row?.gauge?.totalSupply).times(row?.gauge?.reserve1))}
                                    {headCell.id === 'liquidity' && formatCurrency(BigNumber(row?.reserve1))}
                                    {headCell.id === 'apy' && ''}
                                    {headCell.id === 'myVotes' && `${formatCurrency(sliderValue)} %`}
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
                                                  marginBottom: 4,
                                                  fontWeight: 400,
                                                  fontSize: 14,
                                                  lineHeight: '120%',
                                                  color: '#8191B9',
                                                }}>

                                              {headCell.id === 'balance' && formatSymbol(row.token0.symbol)}
                                              {headCell.id === 'liquidity' && formatSymbol(row.token0.symbol)}
                                              {headCell.id === 'apy' && row?.gaugebribes.bribeTokens.length ? (
                                                      row?.gaugebribes.bribeTokens
                                                        .filter(x => !BigNumber(x?.left).isZero())
                                                        .map((bribe, idx) => {
                                                        return (
                                                            <div className={['g-flex-column', 'g-flex--align-end'].join(' ')}>
                                                              {
                                                                formatSymbol(bribe.token.symbol)
                                                              }
                                                            </div>
                                                        );
                                                      })
                                                  )
                                                  : null}
                                              {headCell.id === 'myVotes' && formatSymbol(row.token0.symbol)}
                                            </Typography>

                                            <Typography
                                                className={`${classes.textSpaced} ${classes.symbol}`}
                                                style={{
                                                  fontWeight: 400,
                                                  fontSize: 14,
                                                  lineHeight: '120%',
                                                  color: '#8191B9',
                                                }}
                                            >
                                              {headCell.id === 'balance' && formatSymbol(row.token1.symbol)}
                                              {headCell.id === 'liquidity' && formatSymbol(row.token1.symbol)}
                                              {headCell.id === 'apy' && ''}
                                              {headCell.id === 'myVotes' && formatSymbol(row.token1.symbol)}
                                            </Typography>
                                          </div>
                                        </div>
                                      </div>
                                  }
                                </>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      </>
                  );
                })
            }
          </div>
        <TablePagination
            className={'g-flex-column__item-fixed'}
            style={{
              width: '100%',
              padding: '0 30px',
              background: '#060B17',
              // border: '1px solid #86B9D6',
              // borderColor: appTheme === 'dark' ? '#5F7285' : '#86B9D6',
              // borderRadius: 12,
              marginBottom: 40,
              color: '#8191B9',
              // fontSize: 14,
              // fontWeight: 500,
            }}
            component="div"
            count={gauges.length}
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
        </>
      )}
    </>
  );
}
