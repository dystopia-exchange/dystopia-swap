import React, { useState } from "react";
import PropTypes from "prop-types";
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
} from "@mui/material";
import { makeStyles, styled, useTheme } from "@mui/styles";
import { useRouter } from "next/router";
import BigNumber from "bignumber.js";
import { formatCurrency } from "../../utils";
import stores from "../../stores";
import { ACTIONS } from "../../stores/constants";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import { ArrowDropDown, ExpandLess, ExpandMore } from "@mui/icons-material";
import TablePaginationActions from "../table-pagination/table-pagination";
import { formatSymbol } from "../../utils";

function descendingComparator(a, b, orderBy) {
  if (!a || !b) {
    return 0;
  }

  let aAmount = 0;
  let bAmount = 0;

  switch (orderBy) {
    case "reward":
      if (b?.rewardType < a?.rewardType) {
        return -1;
      }
      if (b?.rewardType > a?.rewardType) {
        return 1;
      }
      if (b?.symbol < a?.symbol) {
        return -1;
      }
      if (b?.symbol > a?.symbol) {
        return 1;
      }
      return 0;

    case "balance":
      if (a?.rewardType === "Bribe") {
        aAmount = a?.gauge?.balance;
      } else {
        aAmount = a?.balance;
      }

      if (b?.rewardType === "Bribe") {
        bAmount = b?.gauge?.balance;
      } else {
        bAmount = b?.balance;
      }

      if (BigNumber(bAmount).lt(aAmount)) {
        return -1;
      }
      if (BigNumber(bAmount).gt(aAmount)) {
        return 1;
      }
      return 0;

    case "earned":
      if (a?.rewardType === "Bribe") {
        aAmount = a?.gauge?.bribes?.length;
      } else {
        aAmount = 2;
      }

      if (b.rewardType === "Bribe") {
        bAmount = b?.gauge?.bribes?.length;
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
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
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
    id: "reward",
    numeric: false,
    disablePadding: false,
    label: "Reward Source",
    isSticky: true,
    isHideInDetails: true,
  },
  {
    id: "balance",
    numeric: true,
    disablePadding: false,
    label: "Your Position",
  },
  {
    id: "earned",
    numeric: true,
    disablePadding: false,
    label: "You Earned",
    isHideInDetails: true,
  },
  {
    id: "bruh",
    numeric: true,
    disablePadding: false,
    label: "Actions",
    isHideInDetails: true,
  },
];

const StickyTableCell = styled(TableCell)(({ theme, appTheme }) => ({
  color: appTheme === "dark" ? "#C6CDD2 !important" : "#325569 !important",
  width: 310,
  left: 0,
  position: "sticky",
  // zIndex: 5,
  whiteSpace: "nowrap",
  padding: "20px 25px 15px",
}));

const StyledTableCell = styled(TableCell)(({ theme, appTheme }) => ({
  background: appTheme === "dark" ? "#24292D" : "#CFE5F2",
  width: "auto",
  whiteSpace: "nowrap",
  padding: "20px 25px 15px",
}));

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
                  background: '#060B17',
                  borderBottom: "1px solid #D3F85A",
                  // zIndex: 10,
                }}
              >
                <TableSortLabel
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : "asc"}
                  onClick={createSortHandler(headCell.id)}
                >
                  <Typography
                    className={classes.headerText}
                    style={{
                      fontWeight: 500,
                      fontSize: 14,
                      lineHeight: "16px",
                      color: '#8191B9'
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
                  background: '#060B17',
                  borderBottom: "1px solid #D3F85A",
                  color: '#8191B9',
                }}
                key={headCell.id}
                align={headCell.numeric ? "right" : "left"}
                padding={"normal"}
                sortDirection={orderBy === headCell.id ? order : false}
              >
                <TableSortLabel
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : "asc"}
                  IconComponent={ArrowDropDown}
                  style={{
                    color: '#8191B9',
                  }}
                  onClick={createSortHandler(headCell.id)}
                >
                  <Typography
                    className={classes.headerText}
                    style={{
                      fontWeight: 500,
                      fontSize: 14,
                      lineHeight: "16px",
                      width: headCell.width || "auto",
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
    assetTableRow: {
      "&:hover": {
        background: "rgba(104,108,122,0.05)",
      },
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
    inlineEnd: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    icon: {
      marginRight: "12px",
    },
    textSpaced: {
      lineHeight: "1.5",
      fontWeight: "200",
      fontSize: "12px",

    },
    textSpacedPadded: {
      paddingLeft: "10px",
      lineHeight: "1.5",
      fontWeight: "200",
      fontSize: "12px",
    },
    headerText: {
      fontWeight: "200",
      fontSize: "12px",
    },
    cell: {},
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
      borderBottom: "1px solid rgba(104, 108, 122, 0.25)",
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
      borderBottom: "1px rgba(104, 108, 122, 0.25)",
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
      marginRight: 10,
      border: "2px solid #DBE6EC",
      background: "#13B5EC",
      borderRadius: "30px",
    },
    img1Logo: {
      position: "absolute",
      left: "0px",
      top: "0px",
      // outline: "2px solid #DBE6EC",
      // background: "#13B5EC",
      borderRadius: "30px",
    },
    img2Logo: {
      position: "absolute",
      left: "28px",
      zIndex: "1",
      top: "0px",
      // outline: "2px solid #DBE6EC",
      // background: "#13B5EC",
      borderRadius: "30px",
    },
    overrideTableHead: {
      borderBottom: "1px solid rgba(126,153,176,0.15) !important",
    },
    doubleImages: {
      display: "flex",
      position: "relative",
      width: "80px",
      height: "35px",
    },
    searchContainer: {
      flex: 1,
      minWidth: "300px",
      marginRight: "30px",
    },
    buttonOverride: {
      color: "rgb(6, 211, 215)",
      background: "rgb(23, 52, 72)",
      fontWeight: "700",
      "&:hover": {
        background: "rgb(19, 44, 60)",
      },
    },
    toolbar: {
      margin: "24px 0px",
      padding: "0px",
      minHeight: "auto",
    },
    tableContainer: {
      border: "1px solid rgba(126,153,176,0.2)",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
    },
    filterButton: {
      background: "#111729",
      border: "1px solid rgba(126,153,176,0.3)",
      color: "#06D3D7",
      marginRight: "30px",
    },
    actionButtonText: {
      fontSize: "15px",
      fontWeight: "700",
    },
    filterContainer: {
      background: "#212b48",
      minWidth: "300px",
      marginTop: "15px",
      borderRadius: "10px",
      padding: "20px",
      boxShadow: "0 10px 20px 0 rgba(0,0,0,0.2)",
      border: "1px solid rgba(126,153,176,0.2)",
    },
    alignContentRight: {
      textAlign: "right",
    },
    labelColumn: {
      display: "flex",
      alignItems: "center",
    },
    filterLabel: {
      fontSize: "14px",
    },
    filterListTitle: {
      marginBottom: "10px",
      paddingBottom: "20px",
      borderBottom: "1px solid rgba(126,153,176,0.2)",
    },
    infoIcon: {
      color: "#06D3D7",
      fontSize: "16px",
      marginLeft: "10px",
    },
    symbol: {
      minWidth: "40px",
    },
    table: {
      tableLayout: "auto",
    },
    tableBody: {
      background: appTheme === "dark" ? "#151718" : "#DBE6EC",
    },
    accordionSummaryContent: {
      margin: 0,
      padding: 0,
    },
    sortSelect: {
      position: "absolute",
      top: 60,
    },
    cellPaddings: {
      padding: "11px 20px",
      ["@media (max-width:530px)"]: {
        // eslint-disable-line no-useless-computed-key
        padding: 10,
      },
    },
    cellHeadPaddings: {
      padding: "20px 20px",
      ["@media (max-width:530px)"]: {
        // eslint-disable-line no-useless-computed-key
        // padding: "5px 10px",
      },
    },
  };
});

export default function EnhancedTable({ rewards, vestNFTs, tokenID }) {
  const classes = useStyles();
  const router = useRouter();

  const [order, setOrder] = React.useState("desc");
  const [orderBy, setOrderBy] = React.useState("balance");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [tableHeight, setTableHeight] = useState(
    window.innerHeight - 50 - 64 - 74 - 60 - 54 - 20 - 30
  );
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [expanded, setExpanded] = useState("");

  const { appTheme } = useAppThemeContext();

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  if (!rewards) {
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

  const onClaim = (reward) => {
    if (reward.rewardType === "Bribe") {
      stores.dispatcher.dispatch({
        type: ACTIONS.CLAIM_BRIBE,
        content: { pair: reward, tokenID },
      });
    } else if (reward.rewardType === "Fees") {
      stores.dispatcher.dispatch({
        type: ACTIONS.CLAIM_PAIR_FEES,
        content: { pair: reward, tokenID },
      });
    } else if (reward.rewardType === "Reward") {
      stores.dispatcher.dispatch({
        type: ACTIONS.CLAIM_REWARD,
        content: { pair: reward, tokenID },
      });
    } else if (reward.rewardType === "Distribution") {
      stores.dispatcher.dispatch({
        type: ACTIONS.CLAIM_VE_DIST,
        content: { tokenID },
      });
    }
  };

  function tableCellContent(
    data1,
    data2,
    symbol1,
    symbol2,
    imgSource1,
    imgSource2
  ) {
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <Typography
              className={classes.textSpaced}
              style={{
                fontWeight: 400,
                fontSize: 14,
                lineHeight: "16px",
                color: '#E4E9F4',
              }}
            >
              {data1}
            </Typography>
          </div>

          <Typography
            className={classes.textSpaced}
            style={{
              fontWeight: 400,
              fontSize: 14,
              lineHeight: "16px",
              color: '#E4E9F4',
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
                lineHeight: "16px",
                color: '#8191B9',
              }}
            >
              {symbol1}
            </Typography>

            <Typography
              className={`${classes.textSpaced} ${classes.symbol}`}
              style={{
                fontWeight: 400,
                fontSize: 14,
                lineHeight: "16px",
                color: '#8191B9',
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

  window.addEventListener("resize", () => {
    setTableHeight(window.innerHeight - 50 - 64 - 74 - 60 - 54 - 20 - 30);
    setWindowWidth(window.innerWidth);
  });

  return (
    <>
      {windowWidth >= 806 && (
        <div
        // className={['g-flex-column__item', 'g-flex-column'].join(' ')}
        >
          <TableContainer
            className={"g-flex-column__item-fixed"}
            style={{
              overflow: "auto",
              // maxHeight: tableHeight,
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
                {Array.isArray(rewards) > 0
                  ? stableSort(rewards, getComparator(order, orderBy))
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((row, index) => {
                        if (!row) {
                          return null;
                        }

                        return (
                          <TableRow
                            key={"ssRewardsTable" + index}
                            className={classes.assetTableRow}
                          >
                            <StickyTableCell
                              style={{
                                background: '#171D2D',
                                borderBottom: '1px dashed #323B54',
                              }}
                              className={classes.cell}
                            >
                              {["Bribe", "Fees", "Reward"].includes(
                                row.rewardType
                              ) && (
                                <div className={classes.inline}>
                                  <div className={classes.doubleImages}>
                                    <img
                                      className={classes.img1Logo}
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
                                      className={classes.img2Logo}
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
                                        fontSize: 16,
                                        lineHeight: "20px",
                                        color: '#E4E9F4',
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
                                        lineHeight: "16px",
                                        color: '#8191B9',
                                      }}
                                      noWrap
                                    >
                                      {row?.rewardType}
                                    </Typography>
                                  </div>
                                </div>
                              )}
                              {["Distribution"].includes(row.rewardType) && (
                                <div className={classes.inline}>
                                  <div className={classes.doubleImages}>
                                    <img
                                      className={classes.img1Logo}
                                      src={
                                        row &&
                                        row.lockToken &&
                                        row.lockToken.logoURI
                                          ? row.lockToken.logoURI
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
                                          appTheme === "dark"
                                            ? "#ffffff"
                                            : "#0A2C40",
                                      }}
                                      noWrap
                                    >
                                      {formatSymbol(row?.lockToken?.symbol)}
                                    </Typography>
                                    <Typography
                                      className={classes.textSpaced}
                                      style={{
                                        fontWeight: 400,
                                        fontSize: 14,
                                        lineHeight: "120%",
                                        color:
                                          appTheme === "dark"
                                            ? "#7C838A"
                                            : "#5688A5",
                                      }}
                                      noWrap
                                    >
                                      {row?.rewardType}
                                    </Typography>
                                  </div>
                                </div>
                              )}
                            </StickyTableCell>

                            <TableCell
                              className={classes.cell}
                              align="right"
                              style={{
                                background: '#171D2D',
                                borderBottom: '1px dashed #323B54',
                                overflow: "hidden",
                              }}
                            >
                              {row &&
                                row.rewardType === "Bribe" &&
                                row.gauge &&
                                row.gauge.balance &&
                                row.gauge.totalSupply &&
                                tableCellContent(
                                  formatCurrency(
                                    BigNumber(row.gauge.balance)
                                      .div(row.gauge.totalSupply)
                                      .times(row.gauge.reserve0)
                                  ),
                                  formatCurrency(
                                    BigNumber(row.gauge.balance)
                                      .div(row.gauge.totalSupply)
                                      .times(row.gauge.reserve1)
                                  ),
                                  row.token0.symbol,
                                  row.token1.symbol
                                )}

                              {row &&
                                row.rewardType === "Fees" &&
                                row.balance &&
                                row.totalSupply &&
                                tableCellContent(
                                  formatCurrency(
                                    BigNumber(row.balance)
                                      .div(row.totalSupply)
                                      .times(row.reserve0)
                                  ),
                                  formatCurrency(
                                    BigNumber(row.balance)
                                      .div(row.totalSupply)
                                      .times(row.reserve1)
                                  ),
                                  row.token0.symbol,
                                  row.token1.symbol
                                )}

                              {row &&
                                row.rewardType === "Reward" &&
                                row.gauge &&
                                row.gauge.balance &&
                                row.gauge.totalSupply &&
                                tableCellContent(
                                  formatCurrency(
                                    BigNumber(row.gauge.balance)
                                      .div(row.gauge.totalSupply)
                                      .times(row.gauge.reserve0)
                                  ),
                                  formatCurrency(
                                    BigNumber(row.gauge.balance)
                                      .div(row.gauge.totalSupply)
                                      .times(row.gauge.reserve1)
                                  ),
                                  row.token0.symbol,
                                  row.token1.symbol
                                )}

                              {row &&
                                row.rewardType === "Distribution" &&
                                tableCellContent(
                                  formatCurrency(row.token?.lockValue),
                                  null,
                                  row.lockToken.symbol,
                                  null
                                )}
                            </TableCell>

                            <TableCell
                              className={classes.cell}
                              align="right"
                              style={{
                                background: '#171D2D',
                                borderBottom: '1px dashed #323B54',
                                overflow: "hidden",
                              }}
                            >
                              {row &&
                                row.rewardType === "Bribe" &&
                                row.gauge &&
                                row.gauge.bribesEarned &&
                                row.gauge.bribesEarned.map((bribe) => {
                                  return tableCellContent(
                                    formatCurrency(bribe.earned),
                                    null,
                                    bribe.token?.symbol,
                                    null,
                                    bribe && bribe.token && bribe.token.logoURI
                                      ? bribe.token.logoURI
                                      : `/tokens/unknown-logo--${appTheme}.svg`
                                  );
                                })}

                              {row &&
                                row.rewardType === "Fees" &&
                                tableCellContent(
                                  formatCurrency(row.claimable0),
                                  formatCurrency(row.claimable1),
                                  row.token0?.symbol,
                                  row.token1?.symbol,
                                  row.token0 && row.token0.logoURI
                                    ? row.token0.logoURI
                                    : `/tokens/unknown-logo--${appTheme}.svg`,
                                  row.token1 && row.token1.logoURI
                                    ? row.token1.logoURI
                                    : `/tokens/unknown-logo--${appTheme}.svg`
                                )}

                              {row &&
                                row.rewardType === "Reward" &&
                                tableCellContent(
                                  formatCurrency(row.gauge.rewardsEarned),
                                  null,
                                  "DYST",
                                  null
                                )}

                              {row &&
                                row.rewardType === "Distribution" &&
                                tableCellContent(
                                  formatCurrency(row.earned),
                                  null,
                                  row.rewardToken.symbol,
                                  null
                                )}
                            </TableCell>

                            <TableCell
                              className={classes.cell}
                              align="right"
                              style={{
                                background: '#171D2D',
                                borderBottom: '1px dashed #323B54',
                                overflow: "hidden",
                              }}
                            >
                              <Button
                                variant="outlined"
                                color="primary"
                                style={{
                                  padding: "12px 12px",
                                  border: "1px solid #D3F85A",
                                  // borderColor:
                                  //   appTheme === "dark" ? "#C6CDD2" : "#5688A5",
                                  borderRadius: 12,
                                  fontWeight: 600,
                                  fontSize: 14,
                                  lineHeight: "16px",
                                  color: '#D3F85A',
                                  textTransform: 'uppercase',
                                }}
                                onClick={() => {
                                  onClaim(row);
                                }}
                              >
                                CLAIM
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  : (
                      <TableRow>
                        <td style={{
                          color: '#E4E9F4',
                          fontSize: 20,
                          fontWeight: 500,
                          padding: 24,
                          background: '#171D2D',
                        }} colSpan={4}>You don't have any Rewards yet</td>
                      </TableRow>
                    )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            className={"g-flex-column__item-fixed"}
            style={{
              width: "100%",
              // marginTop: 20,
              padding: "0 30px",
              borderTop: '1px solid #D3F85A',
              height: 70,
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'flex-end',
              // background: appTheme === "dark" ? "#24292D" : "#dbe6ec",
              // border: "1px solid #86B9D6",
              // borderColor: appTheme === "dark" ? "#5F7285" : "#86B9D6",
              // borderRadius: 100,
              color: appTheme === "dark" ? "#7C838A" : "#5688A5",
            }}
            ActionsComponent={TablePaginationActions}
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={rewards.length}
            rowsPerPage={rowsPerPage}
            page={page}
            labelRowsPerPage={window.innerWidth < 550 ? null : "Rows per page:"}
            rowsPerPageOptions={window.innerWidth < 435 ? [] : [5, 10, 25]}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </div>
      )}

      {windowWidth < 806 && (
        <>
          <div style={{ overflow: "auto" }}>
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
                          background: '#171D2D',
                          borderRadius: 12,
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
                              {["Bribe", "Fees", "Reward"].includes(
                                row.rewardType
                              ) && (
                                <div className={classes.inline}>
                                  <div className={classes.doubleImages}>
                                    <img
                                      className={classes.img1Logo}
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
                                      className={classes.img2Logo}
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
                                          appTheme === "dark"
                                            ? "#ffffff"
                                            : "#0A2C40",
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
                                          appTheme === "dark"
                                            ? "#7C838A"
                                            : "#5688A5",
                                      }}
                                      noWrap
                                    >
                                      {row?.rewardType}
                                    </Typography>
                                  </div>
                                </div>
                              )}
                              {["Distribution"].includes(row.rewardType) && (
                                <div className={classes.inline}>
                                  <div className={classes.doubleImages}>
                                    <img
                                      className={classes.img1Logo}
                                      src={
                                        row &&
                                        row.lockToken &&
                                        row.lockToken.logoURI
                                          ? row.lockToken.logoURI
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
                                          appTheme === "dark"
                                            ? "#ffffff"
                                            : "#0A2C40",
                                      }}
                                      noWrap
                                    >
                                      {formatSymbol(row?.lockToken?.symbol)}
                                    </Typography>
                                    <Typography
                                      className={classes.textSpaced}
                                      style={{
                                        fontWeight: 400,
                                        fontSize: 14,
                                        lineHeight: "120%",
                                        color:
                                          appTheme === "dark"
                                            ? "#7C838A"
                                            : "#5688A5",
                                      }}
                                      noWrap
                                    >
                                      {row?.rewardType}
                                    </Typography>
                                  </div>
                                </div>
                              )}
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
                              className={["g-flex"].join(" ")}
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
                                    background: '#060B17',
                                    fontWeight: 500,
                                    fontSize: 14,
                                    lineHeight: "120%",
                                    /*borderBottom: `1px solid ${
                                      appTheme === "dark"
                                        ? "#2D3741"
                                        : "#9BC9E4"
                                    }`,*/
                                    color: '#8191B9',
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
                                      padding: "8px 14px",
                                      border: "1px solid #D3F85A",
                                      borderColor: '#D3F85A',
                                      borderRadius: 100,
                                      fontWeight: 600,
                                      fontSize: 14,
                                      lineHeight: "120%",
                                      color: '#D3F85A',
                                      textTransform: 'uppercase',
                                    }}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      event.preventDefault();

                                      onClaim(row);
                                    }}
                                  >
                                    CLAIM
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
                                    background: '#060B17',
                                    fontWeight: 500,
                                    fontSize: 14,
                                    lineHeight: "120%",
                                    /*borderBottom: `1px solid ${
                                      appTheme === "dark"
                                        ? "#2D3741"
                                        : "#9BC9E4"
                                    }`,*/
                                    color: '#8191B9',
                                    textAlign: "right",
                                  }}
                                  noWrap
                                >
                                  You Earned
                                </Typography>

                                <div
                                  className={classes.cellPaddings}
                                  style={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  {row &&
                                    row.rewardType === "Bribe" &&
                                    row.gauge &&
                                    row.gauge.bribesEarned &&
                                    row.gauge.bribesEarned.map((bribe) => {
                                      return tableCellContent(
                                        formatCurrency(bribe.earned),
                                        null,
                                        bribe.token?.symbol,
                                        null,
                                        bribe &&
                                          bribe.token &&
                                          bribe.token.logoURI
                                          ? bribe.token.logoURI
                                          : `/tokens/unknown-logo--${appTheme}.svg`
                                      );
                                    })}

                                  {row &&
                                    row.rewardType === "Fees" &&
                                    tableCellContent(
                                      formatCurrency(row.claimable0),
                                      formatCurrency(row.claimable1),
                                      row.token0?.symbol,
                                      row.token1?.symbol,
                                      row.token0 && row.token0.logoURI
                                        ? row.token0.logoURI
                                        : `/tokens/unknown-logo--${appTheme}.svg`,
                                      row.token1 && row.token1.logoURI
                                        ? row.token1.logoURI
                                        : `/tokens/unknown-logo--${appTheme}.svg`
                                    )}

                                  {row &&
                                    row.rewardType === "Reward" &&
                                    tableCellContent(
                                      formatCurrency(row.gauge.rewardsEarned),
                                      null,
                                      "DYST",
                                      null
                                    )}

                                  {row &&
                                    row.rewardType === "Distribution" &&
                                    tableCellContent(
                                      formatCurrency(row.earned),
                                      null,
                                      row.rewardToken.symbol,
                                      null
                                    )}
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                padding: "10px 20px",
                                background: '#060B17',
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
                                  fontSize: 14,
                                  lineHeight: "120%",
                                  color: '#8191B9',
                                }}
                                noWrap
                              >
                                {expanded !== labelId ? "Show" : "Hide"} details
                              </Typography>

                              {expanded !== labelId && (
                                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M25.5 13C25.5 6.1125 19.8875 0.5 13 0.499999C6.1125 0.499999 0.5 6.1125 0.499999 13C0.499999 19.8875 6.1125 25.5 13 25.5C19.8875 25.5 25.5 19.8875 25.5 13ZM12.3375 16.4875L7.925 12.075C7.7375 11.8875 7.65 11.65 7.65 11.4125C7.65 11.175 7.7375 10.9375 7.925 10.75C8.2875 10.3875 8.8875 10.3875 9.25 10.75L13 14.5L16.75 10.75C17.1125 10.3875 17.7125 10.3875 18.075 10.75C18.4375 11.1125 18.4375 11.7125 18.075 12.075L13.6625 16.4875C13.3 16.8625 12.7 16.8625 12.3375 16.4875Z" fill="#779BF4"/>
                                  </svg>
                              )}

                              {expanded === labelId && (
                                  <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M25.5 13C25.5 19.8875 19.8875 25.5 13 25.5C6.1125 25.5 0.5 19.8875 0.499999 13C0.499999 6.1125 6.1125 0.500001 13 0.500001C19.8875 0.5 25.5 6.1125 25.5 13ZM12.3375 9.5125L7.925 13.925C7.7375 14.1125 7.65 14.35 7.65 14.5875C7.65 14.825 7.7375 15.0625 7.925 15.25C8.2875 15.6125 8.8875 15.6125 9.25 15.25L13 11.5L16.75 15.25C17.1125 15.6125 17.7125 15.6125 18.075 15.25C18.4375 14.8875 18.4375 14.2875 18.075 13.925L13.6625 9.5125C13.3 9.1375 12.7 9.1375 12.3375 9.5125Z" fill="#779BF4"/>
                                  </svg>
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
                                      appTheme === "dark"
                                        ? "#2D3741"
                                        : "#9BC9E4"
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
                                      fontSize: 14,
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
                                        {headCell.id === "balance" && row?.gauge &&
                                          formatCurrency(
                                            BigNumber(row?.gauge?.balance)
                                              .div(row?.gauge?.totalSupply)
                                              .times(row?.gauge?.reserve0)
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
                                        {headCell.id === "balance" && row?.gauge &&
                                          formatCurrency(
                                            BigNumber(row.gauge.balance)
                                              .div(row.gauge.totalSupply)
                                              .times(row.gauge.reserve1)
                                          )}
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
                                        {formatSymbol(row?.token0?.symbol)}
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
                                        {formatSymbol(row?.token1?.symbol)}
                                      </Typography>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    );
                  })
              : null}
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
            }}
            ActionsComponent={TablePaginationActions}
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={rewards.length}
            rowsPerPage={rowsPerPage}
            page={page}
            labelRowsPerPage={window.innerWidth < 550 ? null : "Rows per page:"}
            rowsPerPageOptions={window.innerWidth < 435 ? [] : [5, 10, 25]}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </>
  );
}
