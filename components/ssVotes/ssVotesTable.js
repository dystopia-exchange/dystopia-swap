import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { makeStyles, styled } from "@mui/styles";
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
  AccordionDetails,
  Button,
  DialogTitle,
  DialogContent,
  Dialog,
  Hidden,
} from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import QuizIcon from "@mui/icons-material/Quiz";
import Icon from "@mui/material/Icon";
import numeral from "numeral";
import BigNumber from "bignumber.js";

import { formatCurrency } from "../../utils";
import {
  ArrowDropDown,
  Close,
  ExpandLess,
  ExpandMore,
} from "@mui/icons-material";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import TablePaginationActions from "../table-pagination/table-pagination";
import SortSelect from "../select-sort/select-sort";
import { formatSymbol } from "../../utils";

const CustomSlider = styled(Slider)(({ theme, appTheme, disabled }) => {
  const MuiSliderthumb = {
    backgroundColor: appTheme === "dark" ? "#4CADE6" : "#5688A5",
  };

  const MuiSliderTrack = {
    backgroundColor: "#9BC9E4",
  };

  const MuiSliderRail = {
    background:
      appTheme === "dark"
        ? "linear-gradient(to left, #1B4F20 50%, #631515 50%)"
        : "linear-gradient(to left, #A2E3A9 50%, #EC9999 50%)",
  };

  if (disabled) {
    MuiSliderthumb.backgroundColor =
      appTheme === "dark" ? "#7F828B" : "#A3A9BA";
    MuiSliderTrack.backgroundColor = "#D4D5DB";
    MuiSliderRail.background = "rgb(210 210 210)";
  }

  return {
    color: appTheme === "dark" ? "#3880ff" : "#3880ff",
    height: 2,
    padding: "15px 0",
    "& .MuiSlider-thumb": {
      height: 10,
      width: 10,
      backgroundColor: MuiSliderthumb.backgroundColor,
      boxShadow: "none",
      "&:focus, &:hover, &.Mui-active": {
        boxShadow: "none",
        "@media (hover: none)": {
          boxShadow: "none",
        },
      },
    },
    "& .MuiSlider-valueLabel": {
      fontSize: 10,
      fontWeight: 400,
      top: -6,
      border: "1px solid #0B5E8E",
      background: "#B9DFF5",
      padding: 5,
      borderRadius: 0,
      "&:before": {
        borderBottom: "1px solid #0B5E8E",
        borderRight: "1px solid #0B5E8E",
      },
      "& *": {
        color: "#325569",
      },
    },
    "& .MuiSlider-track": {
      border: "none",
      backgroundColor: MuiSliderTrack.backgroundColor,
      opacity: 0,
    },
    "& .MuiSlider-rail": {
      opacity: 1,
      // backgroundColor: '#9BC9E4',
      background: MuiSliderRail.background,
    },
    "& .MuiSlider-mark": {
      opacity: 0,
      backgroundColor: disabled ? MuiSliderTrack.backgroundColor : "#CFE5F2",
      height: 2,
      width: 2,
      "&.MuiSlider-markActive": {
        backgroundColor: disabled ? MuiSliderTrack.backgroundColor : "#CFE5F2",
        opacity: 0,
      },
    },
    "& .MuiSlider-mark:nth-of-type(20n)": {
      opacity: 1,

      "&.MuiSlider-markActive": {
        opacity: 1,
      },
    },
  };
});

function descendingComparator(a, b, orderBy, sliderValues) {
  if (!a || !b) {
    return 0;
  }

  switch (orderBy) {
    case "asset":
      return formatSymbol(a.symbol).localeCompare(formatSymbol(b.symbol));

    case "tvl":
      if (BigNumber(b?.tvl).lt(a?.tvl)) {
        return -1;
      }
      if (BigNumber(b?.tvl).gt(a?.tvl)) {
        return 1;
      }
      return 0;

    case "balance":
      if (BigNumber(b?.gauge?.balance).lt(a?.gauge?.balance)) {
        return -1;
      }
      if (BigNumber(b?.gauge?.balance).gt(a?.gauge?.balance)) {
        return 1;
      }
      return 0;

    case "liquidity":
      let reserveA = BigNumber(a?.reserve0).plus(a?.reserve1).toNumber();
      let reserveB = BigNumber(b?.reserve0).plus(b?.reserve1).toNumber();

      if (BigNumber(reserveB).lt(reserveA)) {
        return -1;
      }
      if (BigNumber(reserveB).gt(reserveA)) {
        return 1;
      }
      return 0;

    case "totalVotes":
      if (BigNumber(b?.gauge?.weightPercent).lt(a?.gauge?.weightPercent)) {
        return -1;
      }
      if (BigNumber(b?.gauge?.weightPercent).gt(a?.gauge?.weightPercent)) {
        return 1;
      }
      return 0;

    case "apy":
      let apyA = a?.gaugebribes.length
        ? a?.gaugebribes
            .map((bribe, idx) => {
              return BigNumber(bribe.rewardAmount).toNumber();
            })
            .reduce((partialSum, a) => partialSum + a, 0)
        : 0;

      let apyB = b?.gaugebribes.length
        ? b?.gaugebribes
            .map((bribe, idx) => {
              return BigNumber(bribe.rewardAmount).toNumber();
            })
            .reduce((partialSum, a) => partialSum + a, 0)
        : 0;

      return apyA - apyB;

    case "myVotes":
    case "mvp":
      // BigNumber(sliderValue).div(100).times(token?.lockValue)
      let sliderValueA = sliderValues.find(
        (el) => el.address === a?.address
      )?.value;
      if (sliderValueA) {
        sliderValueA = BigNumber(sliderValueA).toNumber(0);
      } else {
        sliderValueA = 0;
      }

      let sliderValueB = sliderValues.find(
        (el) => el.address === b?.address
      )?.value;
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
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy, sliderValues)
    : (a, b) => -descendingComparator(a, b, orderBy, sliderValues);
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
    id: "asset",
    numeric: false,
    disablePadding: false,
    label: "Asset",
    isSticky: true,
    isHideInDetails: true,
  },
  {
    id: "tvl",
    numeric: true,
    disablePadding: false,
    label: "TVL",
  },
  {
    id: "apr",
    numeric: true,
    disablePadding: false,
    label: "APR %",
  },
  {
    id: "balance",
    numeric: true,
    disablePadding: false,
    label: "My Stake",
  },
  {
    id: "liquidity",
    numeric: true,
    disablePadding: false,
    label: "Total Liquidity",
  },
  {
    id: "totalVotes",
    numeric: true,
    disablePadding: false,
    label: "Total Votes",
    isHideInDetails: true,
  },
  {
    id: "apy",
    numeric: true,
    disablePadding: false,
    label: "Bribes",
  },
  {
    id: "myVotes",
    numeric: true,
    disablePadding: false,
    label: "My Votes",
  },
  {
    id: "mvp",
    numeric: true,
    disablePadding: false,
    label: "My Vote %",
    width: 200,
    isHideInDetails: true,
  },
];

const StickyTableCell = styled(TableCell)(({ theme, appTheme }) => ({
  color: appTheme === "dark" ? "#C6CDD2 !important" : "#325569 !important",
  width: 310,
  left: 0,
  position: "sticky",
  zIndex: 5,
  whiteSpace: "nowrap",
  padding: "20px 25px 15px",
}));

const StyledTableCell = styled(TableCell)(({ theme, appTheme }) => ({
  background: appTheme === "dark" ? "#24292D" : "#CFE5F2",
  width: "auto",
  whiteSpace: "nowrap",
  padding: "20px 25px 15px",
}));

const sortIcon = (sortDirection) => {
  const { appTheme } = useAppThemeContext();

  return (
    <>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        style={{
          transform:
            sortDirection === "desc" ? "rotate(180deg)" : "rotate(0deg)",
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.83325 8.33337L9.99992 12.5L14.1666 8.33337H5.83325Z"
          fill={appTheme === "dark" ? "#5F7285" : "#9BC9E4"}
        />
      </svg>
    </>
  );
};

function EnhancedTableHead(props) {
  const { classes, order, orderBy, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const { appTheme } = useAppThemeContext();

  return (
    <TableHead>
      <TableRow
        style={{
          border: "1px solid #9BC9E4",
          borderColor: appTheme === "dark" ? "#5F7285" : "#9BC9E4",
          whiteSpace: "nowrap",
        }}
      >
        {headCells.map((headCell) => (
          <>
            {headCell.isSticky ? (
              <StickyTableCell
                appTheme={appTheme}
                key={headCell.id}
                align={headCell.numeric ? "right" : "left"}
                padding={"normal"}
                sortDirection={orderBy === headCell.id ? order : false}
                style={{
                  background: appTheme === "dark" ? "#24292D" : "#CFE5F2",
                  borderBottom: "1px solid #9BC9E4",
                  borderColor: appTheme === "dark" ? "#5F7285" : "#9BC9E4",
                  zIndex: 10,
                }}
              >
                <TableSortLabel
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : "asc"}
                  IconComponent={() =>
                    orderBy === headCell.id ? sortIcon(order) : null
                  }
                  onClick={createSortHandler(headCell.id)}
                >
                  <Typography
                    className={classes.headerText}
                    style={{
                      fontWeight: 600,
                      fontSize: 12,
                      lineHeight: "120%",
                      color: appTheme === "dark" ? "#C6CDD2" : "#325569",
                    }}
                  >
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
            ) : (
              <StyledTableCell
                style={{
                  background: appTheme === "dark" ? "#24292D" : "#CFE5F2",
                  borderBottom: "1px solid #9BC9E4",
                  borderColor: appTheme === "dark" ? "#5F7285" : "#9BC9E4",
                  color: appTheme === "dark" ? "#C6CDD2" : "#325569",
                }}
                key={headCell.id}
                align={headCell.numeric ? "right" : "left"}
                padding={"normal"}
                sortDirection={orderBy === headCell.id ? order : false}
              >
                <TableSortLabel
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : "asc"}
                  IconComponent={() =>
                    orderBy === headCell.id ? sortIcon(order) : null
                  }
                  style={{
                    color: appTheme === "dark" ? "#C6CDD2" : "#325569",
                  }}
                  onClick={createSortHandler(headCell.id)}
                >
                  <Typography
                    className={classes.headerText}
                    style={{
                      fontWeight: 600,
                      fontSize: 12,
                      lineHeight: "120%",
                      width: headCell.width || "auto",
                      color: appTheme === "dark" ? "#C6CDD2" : "#325569",
                    }}
                  >
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
            )}
          </>
        ))}
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(["asc", "desc"]).isRequired,
  orderBy: PropTypes.string.isRequired,
};

const useStyles = makeStyles((theme) => {
  const { appTheme } = useAppThemeContext();

  return {
    root: {
      width: "100%",
    },
    paper: {
      width: "100%",
      marginBottom: theme.spacing(2),
    },
    visuallyHidden: {
      border: 0,
      clip: "rect(0 0 0 0)",
      height: 1,
      margin: -1,
      overflow: "hidden",
      padding: 0,
      position: "absolute",
      top: 20,
      width: 1,
    },
    inline: {
      display: "flex",
      alignItems: "center",
    },
    inlineBetween: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 0px",
    },
    icon: {
      marginRight: "12px",
    },
    textSpaced: {
      lineHeight: "1.5",
      fontWeight: "200",
      fontSize: "12px",
    },
    textSpacedFloat: {
      lineHeight: "1.5",
      fontWeight: "200",
      fontSize: "12px",
      float: "right",
    },
    symbol: {
      minWidth: "40px",
    },
    cell: {
      width: "100px",
    },
    cellSuccess: {
      color: "#4eaf0a",
    },
    cellAddress: {
      cursor: "pointer",
    },
    aligntRight: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
    },
    skelly: {
      marginBottom: "12px",
      marginTop: "12px",
    },
    skelly1: {
      marginBottom: "12px",
      marginTop: "24px",
    },
    skelly2: {
      margin: "12px 6px",
    },
    tableBottomSkelly: {
      display: "flex",
      justifyContent: "flex-end",
    },
    assetInfo: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flex: 1,
      padding: "24px",
      width: "100%",
      flexWrap: "wrap",
      borderBottom: "1px solid rgba(128, 128, 128, 0.32)",
      background:
        "radial-gradient(circle, rgba(63,94,251,0.7) 0%, rgba(47,128,237,0.7) 48%) rgba(63,94,251,0.7) 100%",
    },
    assetInfoError: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flex: 1,
      padding: "24px",
      width: "100%",
      flexWrap: "wrap",
      borderBottom: "1px solid rgba(128, 128, 128, 0.32)",
      background: "#dc3545",
    },
    infoField: {
      flex: 1,
    },
    flexy: {
      padding: "6px 0px",
    },
    overrideCell: {
      padding: "0px",
    },
    hoverRow: {
      cursor: "pointer",
    },
    statusLiquid: {
      color: "#dc3545",
    },
    statusWarning: {
      color: "#FF9029",
    },
    statusSafe: {
      color: "green",
    },
    imgLogo: {
      marginRight: "12px",
    },
    tableContainer: {
      overflowX: "hidden",
    },
    overrideTableHead: {
      borderBottom: "1px solid rgba(104,108,122,0.2) !important",
    },
    headerText: {
      fontWeight: "200",
      fontSize: "12px",
    },
    tooltipContainer: {
      minWidth: "240px",
      padding: "0px 15px",
    },
    infoIcon: {
      color: "#06D3D7",
      fontSize: "16px",
      float: "right",
      marginLeft: "10px",
    },
    doubleImages: {
      display: "flex",
      position: "relative",
      width: "80px",
      height: "35px",
    },
    img1Logo: {
      position: "absolute",
      left: "0px",
      top: "0px",
      borderRadius: "30px",
      outline: "2px solid #DBE6EC",
      background: "#13B5EC",
    },
    img2Logo: {
      position: "absolute",
      left: "28px",
      zIndex: "1",
      top: "0px",
      outline: "2px solid #DBE6EC",
      background: "#13B5EC",
      borderRadius: "30px",
    },
    "img1Logo--dark": {
      outline: "2px solid #151718",
      ["@media (max-width:660px)"]: {
        outline: "2px solid #24292d",
      },
    },
    "img2Logo--dark": {
      outline: "2px solid #151718",
      ["@media (max-width:660px)"]: {
        outline: "2px solid #24292d",
      },
    },
    inlineEnd: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      width: "max-content",
    },
    table: {
      tableLayout: "auto",
    },
    tableBody: {
      background: appTheme === "dark" ? "#151718" : "#DBE6EC",
    },
    sortSelect: {
      position: "absolute",
      top: 125,
      ["@media (max-width:660px)"]: {
        // eslint-disable-line no-useless-computed-key
        top: 145,
      },
    },
    accordionSummaryContent: {
      margin: 0,
      padding: 0,
    },
    dialogPaper: {
      borderRadius: 0,
    },
    dialogBody: {
      background: "rgba(0, 0, 0, 0.1) !important",
      backdropFilter: "blur(10px) !important",
    },
    cellPaddings: {
      padding: "11px 20px",
      ["@media (max-width:530px)"]: {
        // eslint-disable-line no-useless-computed-key
        padding: 10,
      },
    },
    cellHeadPaddings: {
      padding: "5px 20px",
      ["@media (max-width:530px)"]: {
        // eslint-disable-line no-useless-computed-key
        padding: "5px 10px",
      },
    },
  };
});

export default function EnhancedTable({
  gauges,
  setParentSliderValues,
  defaultVotes,
  veToken,
  token,
  showSearch,
  noTokenSelected,
}) {
  const classes = useStyles();
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("totalVotes");
  const [sliderValues, setSliderValues] = useState(defaultVotes);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [tableHeight, setTableHeight] = useState(
    window.innerHeight - 50 - 64 - 30 - 60 - 54 - 20 - 30
  );
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const options = [
    { id: "balance--desc", label: "My Stake: high to low" },
    { id: "balance--asc", label: "My Stake: low to high" },
    { id: "liquidity--desc", label: "Total Liquidity: high to low" },
    { id: "liquidity--asc", label: "Total Liquidity: low to high" },
    { id: "totalVotes--desc", label: "Total Votes: high to low" },
    { id: "totalVotes--asc", label: "Total Votes: low to high" },
    { id: "apy--desc", label: "Bribes: high to low" },
    { id: "apy--asc", label: "Bribes: low to high" },
    { id: "myVotes--desc", label: "My Votes: high to low" },
    { id: "myVotes--asc", label: "My Votes: low to high" },
  ];

  const [sortValueId, setSortValueId] = useState("totalVotes--desc");
  const [sortDirection, setSortDirection] = useState("asc");
  const [expanded, setExpanded] = useState("");
  const [voteDialogOpen, setVoteDialogOpen] = useState(false);

  const { appTheme } = useAppThemeContext();

  useEffect(() => {
    setSliderValues(defaultVotes);
  }, [defaultVotes]);

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

  const handleChangeSort = ({ target: { value } }) => {
    const property = value.substring(0, value.indexOf("--"));
    const event = value.substring(value.indexOf("--") + 2);

    setSortValueId(value);
    setSortDirection(event);

    handleRequestSort(event, property);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
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
        <Skeleton
          variant="rect"
          width={"100%"}
          height={40}
          className={classes.skelly1}
        />
        <Skeleton
          variant="rect"
          width={"100%"}
          height={70}
          className={classes.skelly}
        />
        <Skeleton
          variant="rect"
          width={"100%"}
          height={70}
          className={classes.skelly}
        />
        <Skeleton
          variant="rect"
          width={"100%"}
          height={70}
          className={classes.skelly}
        />
        <Skeleton
          variant="rect"
          width={"100%"}
          height={70}
          className={classes.skelly}
        />
        <Skeleton
          variant="rect"
          width={"100%"}
          height={70}
          className={classes.skelly}
        />
      </div>
    );
  }

  const marks = [
    {
      value: -100,
      label: "-100",
    },
    {
      value: 0,
      label: "0",
    },
    {
      value: 100,
      label: "100",
    },
  ];

  function tableCellContent(data1, data2, symbol1, symbol2) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div
          className={classes.inlineEnd}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <Typography
            className={classes.textSpaced}
            style={{
              fontWeight: 500,
              fontSize: 14,
              lineHeight: "120%",
              color: appTheme === "dark" ? "#ffffff" : "#0A2C40",
            }}
          >
            {data1}
          </Typography>

          <Typography
            className={classes.textSpaced}
            style={{
              fontWeight: 500,
              fontSize: 14,
              lineHeight: "120%",
              color: appTheme === "dark" ? "#ffffff" : "#0A2C40",
            }}
          >
            {data2}
          </Typography>
        </div>

        {(symbol1 || symbol2) && (
          <div
            className={classes.inlineEnd}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              paddingLeft: 10,
            }}
          >
            <Typography
              className={`${classes.textSpaced} ${classes.symbol}`}
              style={{
                fontWeight: 400,
                fontSize: 14,
                lineHeight: "120%",
                color: appTheme === "dark" ? "#7C838A" : "#5688A5",
              }}
            >
              {symbol1}
            </Typography>

            <Typography
              className={`${classes.textSpaced} ${classes.symbol}`}
              style={{
                fontWeight: 400,
                fontSize: 14,
                lineHeight: "120%",
                color: appTheme === "dark" ? "#7C838A" : "#5688A5",
              }}
            >
              {symbol2}
            </Typography>
          </div>
        )}
      </div>
    );
  }

  const handleChangeAccordion = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  const closeModal = () => {
    setVoteDialogOpen(false);
  };

  const openVoteDialog = () => {
    setVoteDialogOpen(true);
  };

  window.addEventListener("resize", () => {
    setTableHeight(window.innerHeight - 50 - 64 - 30 - 60 - 54 - 20 - 30);
    setWindowWidth(window.innerWidth);
  });

  return (
    <>
      {windowWidth > 660 && (
        <div
          style={{
            marginTop:
              (windowWidth <= 1360 && showSearch) || windowWidth <= 1210
                ? 45
                : 0,
          }}
          // className={['g-flex-column__item', 'g-flex-column'].join(' ')}
        >
          <TableContainer
            className={"g-flex-column__item"}
            style={{
              overflow: "auto",
              maxHeight: tableHeight,
              height: "auto",
              background: appTheme === "dark" ? "#24292D" : "#dbe6ec",
            }}
          >
            <Table
              stickyHeader
              className={classes.table}
              aria-labelledby="tableTitle"
              size={"medium"}
              aria-label="enhanced table"
            >
              <EnhancedTableHead
                classes={classes}
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
              />

              <TableBody
                classes={{
                  root: classes.tableBody,
                }}
              >
                {stableSort(gauges, getComparator(order, orderBy, sliderValues))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
                    if (!row) {
                      return null;
                    }
                    let sliderValue = sliderValues.find(
                      (el) => el.address === row?.address
                    )?.value;
                    if (sliderValue) {
                      sliderValue = BigNumber(sliderValue).toNumber(0);
                    } else {
                      sliderValue = 0;
                    }

                    return (
                      <TableRow key={row?.gauge?.address}>
                        <StickyTableCell
                          style={{
                            background:
                              appTheme === "dark" ? "#151718" : "#DBE6EC",
                            borderBottom: `1px solid ${
                              appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                            }`,
                          }}
                          className={classes.cell}
                        >
                          <div className={classes.inline}>
                            <div className={classes.doubleImages}>
                              <img
                                className={[
                                  classes.img1Logo,
                                  classes[`img1Logo--${appTheme}`],
                                ].join(" ")}
                                src={
                                  row && row.token0 && row.token0.logoURI
                                    ? row.token0.logoURI
                                    : ``
                                }
                                width="37"
                                height="37"
                                alt=""
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                }}
                              />
                              <img
                                className={[
                                  classes.img2Logo,
                                  classes[`img2Logo--${appTheme}`],
                                ].join(" ")}
                                src={
                                  row && row.token1 && row.token1.logoURI
                                    ? row.token1.logoURI
                                    : ``
                                }
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
                                  lineHeight: "120%",
                                  color:
                                    appTheme === "dark" ? "#ffffff" : "#0A2C40",
                                }}
                                noWrap
                              >
                                {formatSymbol(row?.symbol)}
                              </Typography>
                              <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 400,
                                  fontSize: 14,
                                  lineHeight: "120%",
                                  color:
                                    appTheme === "dark" ? "#7C838A" : "#5688A5",
                                }}
                                noWrap
                              >
                                {row?.isStable
                                  ? "Stable Pool"
                                  : "Volatile Pool"}
                              </Typography>
                            </div>
                          </div>
                        </StickyTableCell>
                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background:
                              appTheme === "dark" ? "#151718" : "#DBE6EC",
                            borderBottom: `1px solid ${
                              appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                            }`,
                            overflow: "hidden",
                          }}
                        >
                          {tableCellContent(
                            `${numeral(parseInt(row?.tvl)).format("($ 0a)")} `,
                            null,
                            null,
                            null
                          )}
                        </TableCell>
                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background:
                              appTheme === "dark" ? "#151718" : "#DBE6EC",
                            borderBottom: `1px solid ${
                              appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                            }`,
                            overflow: "hidden",
                          }}
                        >
                          {tableCellContent(
                            `${formatCurrency(
                              BigNumber.sum(
                                BigNumber(row?.gauge?.apr).div(100).times(40),
                                BigNumber(row?.gauge?.boostedApr0),
                                BigNumber(row?.gauge?.boostedApr1)
                              ),
                              0
                            )}→${formatCurrency(
                              BigNumber.sum(
                                BigNumber(row?.gauge?.apr),
                                BigNumber(row?.gauge?.boostedApr0),
                                BigNumber(row?.gauge?.boostedApr1)
                              ),
                              0
                            )}%`,
                            null,
                            <Tooltip
                              title={
                                <React.Fragment>
                                  {
                                    "APR based on current prices of tokens, token boosted APR and your locked DYST amount."
                                  }
                                  <br />
                                  <br />
                                  {"Total APR"}
                                  <br />
                                  <b>
                                    {formatCurrency(
                                      BigNumber.sum(
                                        BigNumber(row?.gauge?.apr)
                                          .div(100)
                                          .times(40),
                                        BigNumber(row?.gauge?.boostedApr0),
                                        BigNumber(row?.gauge?.boostedApr1)
                                      ),
                                      2
                                    )}
                                    %{" - "}
                                    {formatCurrency(
                                      BigNumber.sum(
                                        BigNumber(row?.gauge?.apr),
                                        BigNumber(row?.gauge?.boostedApr0),
                                        BigNumber(row?.gauge?.boostedApr1)
                                      ),
                                      2
                                    )}
                                    %
                                  </b>
                                  <br />
                                  <dl>
                                    <dt>
                                      <b>
                                        {formatCurrency(
                                          BigNumber.sum(
                                            BigNumber(row?.gauge?.boostedApr0),
                                            BigNumber(row?.gauge?.boostedApr1)
                                          ),
                                          2
                                        )}
                                        %
                                      </b>{" "}
                                      Boosted APR
                                    </dt>
                                    <dd>
                                      <b>
                                        {formatCurrency(
                                          BigNumber(row?.gauge?.boostedApr0),
                                          2
                                        )}
                                        %
                                      </b>{" "}
                                      {row.token0.symbol} APR
                                    </dd>
                                    <dd>
                                      <b>
                                        {formatCurrency(
                                          BigNumber(row?.gauge?.boostedApr1),
                                          2
                                        )}
                                        %
                                      </b>{" "}
                                      {row.token1.symbol} APR
                                    </dd>
                                    <dt>
                                      <b>
                                        {formatCurrency(
                                          BigNumber(row?.gauge?.apr)
                                            .div(100)
                                            .times(40),
                                          2
                                        )}
                                        %
                                      </b>{" "}
                                      Min staking APR
                                    </dt>
                                    <dd>
                                      <b>
                                        {formatCurrency(
                                          BigNumber(row?.gauge?.apr)
                                            .div(100)
                                            .times(40),
                                          2
                                        )}
                                        %
                                      </b>{" "}
                                      Min APR
                                    </dd>
                                    <dd>
                                      <b>
                                        {formatCurrency(
                                          BigNumber(row?.gauge?.apr),
                                          2
                                        )}
                                        %
                                      </b>{" "}
                                      Max APR
                                    </dd>
                                  </dl>
                                </React.Fragment>
                              }
                            >
                              <QuizIcon fontSize="small" />
                            </Tooltip>,
                            null
                          )}
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background:
                              appTheme === "dark" ? "#151718" : "#DBE6EC",
                            borderBottom: `1px solid ${
                              appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                            }`,
                            overflow: "hidden",
                          }}
                        >
                          {tableCellContent(
                            formatCurrency(
                              BigNumber(row?.gauge?.balance)
                                .div(row?.gauge?.totalSupply)
                                .times(row?.gauge?.reserve0)
                            ),
                            formatCurrency(
                              BigNumber(row?.gauge?.balance)
                                .div(row?.gauge?.totalSupply)
                                .times(row?.gauge?.reserve1)
                            ),
                            row.token0.symbol,
                            row.token1.symbol
                          )}
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background:
                              appTheme === "dark" ? "#151718" : "#DBE6EC",
                            borderBottom: `1px solid ${
                              appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                            }`,
                            overflow: "hidden",
                          }}
                        >
                          {tableCellContent(
                            formatCurrency(BigNumber(row?.reserve0)),
                            formatCurrency(BigNumber(row?.reserve1)),
                            row.token0.symbol,
                            row.token1.symbol
                          )}
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background:
                              appTheme === "dark" ? "#151718" : "#DBE6EC",
                            borderBottom: `1px solid ${
                              appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                            }`,
                            overflow: "hidden",
                          }}
                        >
                          {tableCellContent(
                            formatCurrency(row?.gauge?.weight),
                            `${formatCurrency(row?.gauge?.weightPercent)} %`,
                            null,
                            null
                          )}
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background:
                              appTheme === "dark" ? "#151718" : "#DBE6EC",
                            borderBottom: `1px solid ${
                              appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                            }`,
                            overflow: "hidden",
                          }}
                        >
                          {row?.gaugebribes.length
                            ? row?.gaugebribes.map((bribe, idx) => {
                                return (
                                  <>
                                    {tableCellContent(
                                      formatCurrency(bribe.rewardAmount),
                                      null,
                                      bribe.symbol,
                                      null
                                    )}
                                  </>
                                );
                              })
                            : null}
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background:
                              appTheme === "dark" ? "#151718" : "#DBE6EC",
                            borderBottom: `1px solid ${
                              appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                            }`,
                            overflow: "hidden",
                          }}
                        >
                          {tableCellContent(
                            formatCurrency(
                              BigNumber(sliderValue)
                                .div(100)
                                .times(token?.lockValue)
                            ),
                            `${formatCurrency(sliderValue)} %`,
                            null,
                            null
                          )}
                        </TableCell>

                        <TableCell
                          className={classes.cell}
                          align="right"
                          style={{
                            background:
                              appTheme === "dark" ? "#151718" : "#DBE6EC",
                            borderBottom: `1px solid ${
                              appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                            }`,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              paddingTop: 12,
                              paddingLeft: 12,
                              paddingRight: 12,
                            }}
                          >
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
                              disabled={noTokenSelected}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            className={"g-flex-column__item-fixed"}
            style={{
              width: "100%",
              marginTop: 20,
              padding: "0 30px",
              background: appTheme === "dark" ? "#24292D" : "#dbe6ec",
              border: "1px solid #86B9D6",
              borderColor: appTheme === "dark" ? "#5F7285" : "#86B9D6",
              borderRadius: 100,
              color: appTheme === "dark" ? "#7C838A" : "#5688A5",
            }}
            labelRowsPerPage={window.innerWidth < 550 ? "" : "Rows per page:"}
            rowsPerPageOptions={window.innerWidth < 435 ? [] : [5, 10, 25]}
            component="div"
            count={gauges.length}
            rowsPerPage={rowsPerPage}
            page={page}
            ActionsComponent={TablePaginationActions}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </div>
      )}

      {windowWidth <= 660 && (
        <>
          <div className={classes.sortSelect}>
            {SortSelect({
              value: sortValueId,
              options,
              handleChange: handleChangeSort,
              sortDirection,
            })}
          </div>
          <div
            style={{
              overflow: "auto",
              marginTop: 100,
            }}
          >
            {stableSort(gauges, getComparator(order, orderBy, sliderValues))
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                if (!row) {
                  return null;
                }
                const labelId = `accordion-${index}`;

                let sliderValue = sliderValues.find(
                  (el) => el.address === row?.address
                )?.value;
                if (sliderValue) {
                  sliderValue = BigNumber(sliderValue).toNumber(0);
                } else {
                  sliderValue = 0;
                }

                return (
                  <>
                    <Dialog
                      open={voteDialogOpen}
                      onClose={closeModal}
                      onClick={(e) => {
                        if (
                          e.target.classList.contains("MuiDialog-container")
                        ) {
                          closeModal();
                        }
                      }}
                      fullWidth={false}
                      maxWidth="false"
                      fullScreen={false}
                      BackdropProps={{
                        style: { backgroundColor: "transparent" },
                      }}
                      classes={{
                        paper: classes.dialogPaper,
                        scrollPaper: classes.dialogBody,
                      }}
                    >
                      <div
                        style={{
                          background:
                            appTheme === "dark" ? "#151718" : "#DBE6EC",
                          border:
                            appTheme === "dark"
                              ? "1px solid #5F7285"
                              : "1px solid #86B9D6",
                          borderRadius: 0,
                        }}
                      >
                        <DialogTitle
                          style={{
                            padding: 30,
                            paddingBottom: 16,
                            fontWeight: 500,
                            fontSize: 18,
                            lineHeight: "140%",
                            color: "#0A2C40",
                            background:
                              appTheme === "dark" ? "#151718" : "#CFE5F2",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <div
                              style={{
                                color:
                                  appTheme === "dark" ? "#ffffff" : "#0A2C40",
                              }}
                            >
                              My Vote %
                            </div>

                            {/*<Close
                            style={{
                              cursor: 'pointer',
                              color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
                            }}
                            onClick={closeModal}/>*/}
                          </div>
                        </DialogTitle>

                        <DialogContent
                          style={{
                            padding: 30,
                            paddingBottom: 20,
                            background:
                              appTheme === "dark" ? "#24292D" : "#DBE6EC",
                          }}
                        >
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

                          <Button
                            variant="outlined"
                            color="primary"
                            style={{
                              width: 199,
                              height: 50,
                              marginTop: 20,
                              backgroundImage:
                                'url("/images/ui/btn-simple.svg")',
                              border: "none",
                              borderRadius: 0,
                              fontWeight: 700,
                              fontSize: 16,
                              color:
                                appTheme === "dark" ? "#7F828B" : "#8F5AE8",
                            }}
                            onClick={closeModal}
                          >
                            Save & Close
                          </Button>
                        </DialogContent>
                      </div>
                    </Dialog>

                    <Accordion
                      key={labelId}
                      style={{
                        margin: 0,
                        marginBottom: 20,
                        background: appTheme === "dark" ? "#24292D" : "#DBE6EC",
                        border: `1px solid ${
                          appTheme === "dark" ? "#2D3741" : "#9BC9E4"
                        }`,
                      }}
                      disableGutters={true}
                      expanded={expanded === labelId}
                      onChange={handleChangeAccordion(labelId)}
                    >
                      <AccordionSummary
                        style={{
                          padding: 0,
                        }}
                        classes={{
                          content: classes.accordionSummaryContent,
                        }}
                        expandIcon={null}
                        aria-controls="panel1a-content"
                      >
                        <div
                          className={[
                            "g-flex-column",
                            "g-flex-column__item",
                          ].join(" ")}
                        >
                          <div
                            className={[
                              classes.cellHeadPaddings,
                              "g-flex",
                              "g-flex--align-center",
                            ].join(" ")}
                          >
                            <div className={classes.doubleImages}>
                              <img
                                className={[
                                  classes.img1Logo,
                                  classes[`img1Logo--${appTheme}`],
                                ].join(" ")}
                                src={
                                  row && row.token0 && row.token0.logoURI
                                    ? row.token0.logoURI
                                    : ``
                                }
                                width="37"
                                height="37"
                                alt=""
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                }}
                              />
                              <img
                                className={[
                                  classes.img2Logo,
                                  classes[`img2Logo--${appTheme}`],
                                ].join(" ")}
                                src={
                                  row && row.token1 && row.token1.logoURI
                                    ? row.token1.logoURI
                                    : ``
                                }
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
                                  lineHeight: "120%",
                                  color:
                                    appTheme === "dark" ? "#ffffff" : "#0A2C40",
                                }}
                                noWrap
                              >
                                {row?.symbol}
                              </Typography>
                              <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 400,
                                  fontSize: 14,
                                  lineHeight: "120%",
                                  color:
                                    appTheme === "dark" ? "#7C838A" : "#5688A5",
                                }}
                                noWrap
                              >
                                {row?.isStable
                                  ? "Stable Pool"
                                  : "Volatile Pool"}
                              </Typography>
                            </div>
                          </div>

                          <div
                            style={{
                              borderTop: `1px solid ${
                                appTheme === "dark" ? "#2D3741" : "#9BC9E4"
                              }`,
                              borderBottom: `1px solid ${
                                appTheme === "dark" ? "#2D3741" : "#9BC9E4"
                              }`,
                            }}
                            className={["g-flex", "g-flex--align-center"].join(
                              " "
                            )}
                          >
                            <div
                              style={{
                                width: "50%",
                                borderRight: `1px solid ${
                                  appTheme === "dark" ? "#2D3741" : "#9BC9E4"
                                }`,
                              }}
                            >
                              <Typography
                                className={classes.cellHeadPaddings}
                                style={{
                                  background:
                                    appTheme === "dark" ? "#151718" : "#CFE5F2",
                                  fontWeight: 500,
                                  fontSize: 12,
                                  lineHeight: "120%",
                                  borderBottom: `1px solid ${
                                    appTheme === "dark" ? "#2D3741" : "#9BC9E4"
                                  }`,
                                  color:
                                    appTheme === "dark" ? "#C6CDD2" : "#325569",
                                }}
                                noWrap
                              >
                                Action
                              </Typography>

                              <div className={classes.cellPaddings}>
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  style={{
                                    padding: "7px 14px",
                                    border: `1px solid ${
                                      appTheme === "dark"
                                        ? "#C6CDD2"
                                        : "#5688A5"
                                    }`,
                                    borderColor:
                                      appTheme === "dark"
                                        ? "#C6CDD2"
                                        : "#5688A5",
                                    borderRadius: 100,
                                    fontWeight: 500,
                                    fontSize: 14,
                                    lineHeight: "120%",
                                    color:
                                      appTheme === "dark"
                                        ? "#C6CDD2"
                                        : "#5688A5",
                                  }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    event.preventDefault();

                                    openVoteDialog(row);
                                  }}
                                >
                                  Vote
                                </Button>
                              </div>
                            </div>

                            <div
                              style={{
                                width: "50%",
                              }}
                            >
                              <Typography
                                className={classes.cellHeadPaddings}
                                style={{
                                  background:
                                    appTheme === "dark" ? "#151718" : "#CFE5F2",
                                  fontWeight: 500,
                                  fontSize: 12,
                                  lineHeight: "120%",
                                  borderBottom: `1px solid ${
                                    appTheme === "dark" ? "#2D3741" : "#9BC9E4"
                                  }`,
                                  color:
                                    appTheme === "dark" ? "#C6CDD2" : "#325569",
                                  textAlign: "right",
                                }}
                                noWrap
                              >
                                Total Votes
                              </Typography>

                              <div
                                className={classes.cellPaddings}
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                }}
                              >
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-end",
                                  }}
                                >
                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: "120%",
                                      color:
                                        appTheme === "dark"
                                          ? "#ffffff"
                                          : "#0A2C40",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {formatCurrency(row?.gauge?.weight)}
                                  </Typography>

                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: "120%",
                                      color:
                                        appTheme === "dark"
                                          ? "#ffffff"
                                          : "#0A2C40",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {formatCurrency(row?.gauge?.weight)} %
                                  </Typography>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              padding: "6px 20px",
                              background:
                                appTheme === "dark" ? "#151718" : "#9BC9E4",
                            }}
                            className={[
                              "g-flex",
                              "g-flex--align-center",
                              "g-flex--space-between",
                            ].join(" ")}
                          >
                            <Typography
                              style={{
                                fontWeight: 500,
                                fontSize: 12,
                                lineHeight: "120%",
                                color:
                                  appTheme === "dark" ? "#4CADE6" : "#0B5E8E",
                              }}
                              noWrap
                            >
                              {expanded !== labelId ? "Show" : "Hide"} Details
                            </Typography>

                            {expanded !== labelId && (
                              <ExpandMore
                                style={{
                                  color:
                                    appTheme === "dark" ? "#4CADE6" : "#0B5E8E",
                                }}
                              />
                            )}

                            {expanded === labelId && (
                              <ExpandLess
                                style={{
                                  color:
                                    appTheme === "dark" ? "#4CADE6" : "#0B5E8E",
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </AccordionSummary>

                      <AccordionDetails
                        style={{
                          padding: 0,
                        }}
                      >
                        {headCells.map((headCell) => (
                          <>
                            {!headCell.isHideInDetails && (
                              <div
                                style={{
                                  height: 56,
                                  borderTop: `1px solid ${
                                    appTheme === "dark" ? "#2D3741" : "#9BC9E4"
                                  }`,
                                }}
                                className={[
                                  "g-flex",
                                  "g-flex--align-center",
                                ].join(" ")}
                              >
                                <Typography
                                  className={classes.cellHeadPaddings}
                                  style={{
                                    width: "50%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    fontWeight: 500,
                                    fontSize: 12,
                                    lineHeight: "120%",
                                    color:
                                      appTheme === "dark"
                                        ? "#C6CDD2"
                                        : "#325569",
                                    borderRight: `1px solid ${
                                      appTheme === "dark"
                                        ? "#2D3741"
                                        : "#9BC9E4"
                                    }`,
                                  }}
                                  noWrap
                                >
                                  {headCell.label}
                                </Typography>

                                <div
                                  className={classes.cellPaddings}
                                  style={{
                                    width: "50%",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <div
                                    className={classes.inlineEnd}
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "flex-end",
                                    }}
                                  >
                                    <Typography
                                      className={classes.textSpaced}
                                      style={{
                                        fontWeight: 500,
                                        fontSize: 14,
                                        lineHeight: "120%",
                                        color:
                                          appTheme === "dark"
                                            ? "#ffffff"
                                            : "#0A2C40",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {headCell.id === "tvl" &&
                                        `${numeral(parseInt(row?.tvl)).format(
                                          "($ 0a)"
                                        )} `}
                                      {headCell.id === "apr" &&
                                        `${formatCurrency(
                                          BigNumber.sum(
                                            BigNumber(row?.gauge?.apr)
                                              .div(100)
                                              .times(40),
                                            BigNumber(row?.gauge?.boostedApr0),
                                            BigNumber(row?.gauge?.boostedApr1)
                                          ),
                                          0
                                        )}→${formatCurrency(
                                          BigNumber.sum(
                                            BigNumber(row?.gauge?.apr),
                                            BigNumber(row?.gauge?.boostedApr0),
                                            BigNumber(row?.gauge?.boostedApr1)
                                          ),
                                          0
                                        )} %`}
                                      {headCell.id === "balance" &&
                                        formatCurrency(
                                          BigNumber(row?.gauge?.balance)
                                            .div(row?.gauge?.totalSupply)
                                            .times(row?.gauge?.reserve0)
                                        )}
                                      {headCell.id === "liquidity" &&
                                        formatCurrency(
                                          BigNumber(row?.reserve0)
                                        )}
                                      {headCell.id === "apy" &&
                                      row?.gaugebribes.length
                                        ? row?.gaugebribes.map((bribe, idx) => {
                                            return (
                                              <div
                                                className={[
                                                  "g-flex-column",
                                                  "g-flex--align-end",
                                                ].join(" ")}
                                              >
                                                {formatCurrency(
                                                  bribe.rewardAmount
                                                )}
                                              </div>
                                            );
                                          })
                                        : null}

                                      {headCell.id === "myVotes" &&
                                        formatCurrency(
                                          BigNumber(sliderValue)
                                            .div(100)
                                            .times(token?.lockValue)
                                        )}
                                    </Typography>

                                    <Typography
                                      className={classes.textSpaced}
                                      style={{
                                        fontWeight: 500,
                                        fontSize: 14,
                                        lineHeight: "120%",
                                        color:
                                          appTheme === "dark"
                                            ? "#ffffff"
                                            : "#0A2C40",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {headCell.id === "balance" &&
                                        formatCurrency(
                                          BigNumber(row?.gauge?.balance)
                                            .div(row?.gauge?.totalSupply)
                                            .times(row?.gauge?.reserve1)
                                        )}
                                      {headCell.id === "liquidity" &&
                                        formatCurrency(
                                          BigNumber(row?.reserve1)
                                        )}
                                      {headCell.id === "apy" && ""}
                                      {headCell.id === "myVotes" &&
                                        `${formatCurrency(sliderValue)} %`}
                                    </Typography>
                                  </div>

                                  <div
                                    className={classes.inlineEnd}
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "flex-end",
                                      paddingLeft: 10,
                                    }}
                                  >
                                    <Typography
                                      className={`${classes.textSpaced} ${classes.symbol}`}
                                      style={{
                                        fontWeight: 400,
                                        fontSize: 14,
                                        lineHeight: "120%",
                                        color:
                                          appTheme === "dark"
                                            ? "#7C838A"
                                            : "#5688A5",
                                      }}
                                    >
                                      {headCell.id === "balance" &&
                                        formatSymbol(row.token0.symbol)}
                                      {headCell.id === "liquidity" &&
                                        formatSymbol(row.token0.symbol)}
                                      {headCell.id === "apy" &&
                                      row?.gaugebribes.length
                                        ? row?.gaugebribes.map((bribe, idx) => {
                                            return (
                                              <div
                                                className={[
                                                  "g-flex-column",
                                                  "g-flex--align-end",
                                                ].join(" ")}
                                              >
                                                {formatSymbol(bribe.symbol)}
                                              </div>
                                            );
                                          })
                                        : null}
                                      {headCell.id === "myVotes" &&
                                        formatSymbol(row.token0.symbol)}
                                    </Typography>

                                    <Typography
                                      className={`${classes.textSpaced} ${classes.symbol}`}
                                      style={{
                                        fontWeight: 400,
                                        fontSize: 14,
                                        lineHeight: "120%",
                                        color:
                                          appTheme === "dark"
                                            ? "#7C838A"
                                            : "#5688A5",
                                      }}
                                    >
                                      {headCell.id === "balance" &&
                                        formatSymbol(row.token1.symbol)}
                                      {headCell.id === "liquidity" &&
                                        formatSymbol(row.token1.symbol)}
                                      {headCell.id === "apy" && ""}
                                      {headCell.id === "myVotes" &&
                                        formatSymbol(row.token1.symbol)}
                                    </Typography>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  </>
                );
              })}
          </div>
          <TablePagination
            className={"g-flex-column__item-fixed"}
            style={{
              width: "100%",
              padding: "0 30px",
              background: appTheme === "dark" ? "#24292D" : "#dbe6ec",
              border: "1px solid #86B9D6",
              borderColor: appTheme === "dark" ? "#5F7285" : "#86B9D6",
              borderRadius: 100,
              color: appTheme === "dark" ? "#7C838A" : "#5688A5",
              marginBottom: 40,
            }}
            component="div"
            count={gauges.length}
            rowsPerPage={rowsPerPage}
            page={page}
            labelRowsPerPage={window.innerWidth < 550 ? null : "Rows per page:"}
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
