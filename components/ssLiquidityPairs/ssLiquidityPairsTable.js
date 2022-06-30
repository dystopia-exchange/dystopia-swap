import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { makeStyles, styled, useTheme } from "@mui/styles";
import QuizIcon from "@mui/icons-material/Quiz";
import numeral from "numeral";
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
  Popover,
} from "@mui/material";
import { useRouter } from "next/router";
import BigNumber from "bignumber.js";
import {
  FilterAltOutlined,
  Search,
  Add,
  Close,
  ArrowDropDown,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import SortSelect from "../select-sort/select-sort";
import { formatCurrency } from "../../utils";
import classes from "./ssLiquidityPairs.module.css";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import TablePaginationActions from "../table-pagination/table-pagination";
import { formatSymbol } from "../../utils";
import SwitchCustom from "../../ui/Switch";
import { TableBodyPlaceholder } from "../../components/table";

function descendingComparator(a, b, orderBy) {
  if (!a || !b) {
    return 0;
  }

  switch (orderBy) {
    case "pair":
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

    case "poolBalance":
      let poolBalanceA = BigNumber(a.balance)
        .div(a.totalSupply)
        .times(a.reserve0)
        .plus(BigNumber(a.balance).div(a.totalSupply).times(a.reserve1))
        .toNumber();

      let poolBalanceB = BigNumber(b.balance)
        .div(b.totalSupply)
        .times(b.reserve0)
        .plus(BigNumber(b.balance).div(b.totalSupply).times(b.reserve1))
        .toNumber();

      if (BigNumber(poolBalanceB).lt(poolBalanceA)) {
        return -1;
      }
      if (BigNumber(poolBalanceB).gt(poolBalanceA)) {
        return 1;
      }
      return 0;

    case "stakedBalance":
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

    case "poolAmount":
      let reserveA = BigNumber(a?.reserve0).plus(a?.reserve1).toNumber();
      let reserveB = BigNumber(b?.reserve0).plus(b?.reserve1).toNumber();

      if (BigNumber(reserveB).lt(reserveA)) {
        return -1;
      }
      if (BigNumber(reserveB).gt(reserveA)) {
        return 1;
      }
      return 0;

    case "stakedAmount":
      if (!(a && a.gauge)) {
        return 1;
      }

      if (!(b && b.gauge)) {
        return -1;
      }

      let stakedAmountA = BigNumber(a?.gauge?.reserve0)
        .plus(a?.gauge?.reserve1)
        .toNumber();
      let stakedAmountB = BigNumber(b?.gauge?.reserve0)
        .plus(b?.gauge?.reserve1)
        .toNumber();

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
    id: "pair",
    numeric: false,
    disablePadding: false,
    label: "Pool",
    isSticky: true,
    isHideInDetails: true,
  },
  {
    id: "balance",
    numeric: true,
    disablePadding: false,
    label: "Wallet",
  },
  {
    id: "apr",
    numeric: true,
    disablePadding: false,
    label: "APR%",
  },
  {
    id: "tvl",
    numeric: true,
    disablePadding: false,
    label: "TVL",
  },
  {
    id: "poolBalance",
    numeric: true,
    disablePadding: false,
    label: "My Pool Amount",
  },
  {
    id: "stakedBalance",
    numeric: true,
    disablePadding: false,
    label: "My Staked Amount",
  },
  {
    id: "poolAmount",
    numeric: true,
    disablePadding: false,
    label: "Total Pool Amount",
    isHideInDetails: true,
  },
  {
    id: "stakedAmount",
    numeric: true,
    disablePadding: false,
    label: "Total Pool Staked",
  },
  // {
  //   id: 'apy',
  //   numeric: true,
  //   disablePadding: false,
  //   label: 'APY',
  // },
  {
    id: "",
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
  const { order, orderBy, onRequestSort } = props;
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
                  borderBottom: `1px solid ${
                    appTheme === "dark" ? "#5F7285" : "#9BC9E4"
                  }`,
                  zIndex: 10,
                }}
              >
                <TableSortLabel
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : "asc"}
                  onClick={createSortHandler(headCell.id)}
                  IconComponent={() =>
                    orderBy === headCell.id ? sortIcon(order) : null
                  }
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
                  borderBottom: `1px solid ${
                    appTheme === "dark" ? "#5F7285" : "#9BC9E4"
                  }`,
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

const useStyles = makeStyles({
  root: {
    width: "100%",
  },
  assetTableRow: {
    "&:hover": {
      background: "rgba(104,108,122,0.05)",
    },
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
  headerText: {
    fontWeight: "500 !important",
    fontSize: "12px !important",
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
  imgLogoContainer: {
    padding: 1,
    width: 39,
    height: 39,
    borderRadius: "100px",
    background: "rgb(25, 33, 56)",
    border: "2px solid #DBE6EC",
  },
  "imgLogoContainer--dark": {
    border: "2px solid #151718",
    ["@media (max-width:660px)"]: {
      border: "2px solid #24292d",
    },
  },
  imgLogoContainer2: {
    marginLeft: -10,
  },
  imgLogo: {
    width: 37,
    height: 37,
    margin: -2,
    borderRadius: "100px",
  },
  doubleImages: {
    display: "flex",
    position: "relative",
    width: "80px",
    height: "35px",
  },
  searchContainer: {
    display: "flex",
  },
  searchInput: {
    width: 430,
    height: 52,
    zIndex: 99,
    "& > fieldset": {
      border: "none",
    },
    ["@media (max-width:1360px)"]: {
      // eslint-disable-line no-useless-computed-key
      position: "absolute",
      top: 31,
      right: 0,
    },
    ["@media (max-width:660px)"]: {
      top: 31,
      left: 0,
      width: "calc(100% - 60px)",
    },
  },
  actionsButtons: {
    ["@media (max-width:660px)"]: {
      position: "absolute",
      right: 0,
      top: 63,
    },
  },
  myDeposits: {
    display: "flex",
    alignItems: "center",
    paddingLeft: 30,
    borderRadius: 100,
    marginLeft: 20,
    fontSize: "18px !important",
    ["@media (max-width:660px)"]: {
      // eslint-disable-line no-useless-computed-key
      padding: "9px 0",
      paddingLeft: 20,
    },
    ["@media (max-width:540px)"]: {
      // eslint-disable-line no-useless-computed-key
      fontSize: "12px !important",
      paddingLeft: 10,
      marginLeft: 10,
    },
  },
  myDepositsText: {
    ["@media (max-width:530px)"]: {
      // eslint-disable-line no-useless-computed-key
      display: "flex",
      flexDirection: "column",
    },
  },
  "myDeposits--light": {
    background: "#DBE6EC",
    border: "1px solid #86B9D6",
  },
  "myDeposits--dark": {
    background: "#151718",
    border: "1px solid #5F7285",
  },
  toolbar: {
    marginBottom: 30,
    padding: 0,
    minHeight: "auto",
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
  "filterButton--light": {
    background: "#0B5E8E",
    color: "#fff",
    "&:hover": {
      background: "#86B9D6",
    },
    "&:active": {
      background: "#86B9D6",
      border: "1px solid #0B5E8E",
    },
  },
  "filterButton--dark": {
    background: "#4CADE6",
    color: "#0A2C40",
    "&:hover": {
      background: "#5F7285",
    },
    "&:active": {
      background: "#5F7285",
      border: "1px solid #4CADE6",
    },
  },
  searchButton: {
    width: 50,
    height: 50,
    marginLeft: 10,
    borderRadius: 100,
  },
  "searchButton--light": {
    background: "#0B5E8E",
    color: "#fff",
    "&:hover": {
      background: "#86B9D6",
    },
    "&:active": {
      background: "#86B9D6",
      border: "1px solid #0B5E8E",
    },
  },
  "searchButton--dark": {
    background: "#4CADE6",
    color: "#0A2C40",
    "&:hover": {
      background: "#5F7285",
    },
    "&:active": {
      background: "#5F7285",
      border: "1px solid #4CADE6",
    },
  },
  filterContainer: {
    minWidth: "340px",
    marginTop: "15px",
    padding: "30px",
    paddingBottom: "20px",
    boxShadow: "0 10px 20px 0 rgba(0,0,0,0.2)",
  },
  "filterContainer--light": {
    background: "#DBE6EC",
    border: "1px solid #0B5E8E",
  },
  "filterContainer--dark": {
    background: "#151718",
    border: "1px solid #4CADE6",
  },
  alignContentRight: {
    textAlign: "right",
  },
  labelColumn: {
    display: "flex",
    alignItems: "center",
  },
  filterItem: {
    position: "relative",
    padding: "10px 0",
    borderBottom: "1px solid #86B9D6",
    "&:last-child": {
      borderBottom: "none",
    },
    "&:not(:last-child)::before": {
      content: `''`,
      position: "absolute",
      width: 5,
      height: 1,
      bottom: -1,
      left: 0,
      background: "#0B5E8E",
    },
    "&:not(:last-child)::after": {
      content: `''`,
      position: "absolute",
      width: 5,
      height: 1,
      bottom: -1,
      right: 0,
      background: "#0B5E8E",
    },
  },
  "filterItem--dark": {
    borderColor: "#5F7285",
    "&:not(:last-child)::before": {
      backgroundColor: "#4CADE6",
    },
    "&:not(:last-child)::after": {
      backgroundColor: "#4CADE6",
    },
  },
  filterLabel: {
    fontSize: "18px",
  },
  "filterLabel--light": {
    color: "#325569",
  },
  "filterLabel--dark": {
    color: "#C6CDD2",
  },
  filterListTitle: {
    fontWeight: 600,
    fontSize: 18,
  },
  "filterListTitle--light": {
    color: "#0A2C40",
  },
  "filterListTitle--dark": {
    color: "#ffffff",
  },
  infoIcon: {
    color: "#06D3D7",
    fontSize: "16px",
    marginLeft: "10px",
  },
  symbol: {
    minWidth: "40px",
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
    display: "none",
    fontSize: "12px",
    // '@media (max-width: 1000px)': {
    //   display: 'block',
    // },
  },
  addButton: {
    display: "flex",
    alignItems: "center",
    width: 215,
    height: 50,
    cursor: "pointer",
  },
  "addButton--light": {
    "&:hover > p": {
      background: "#C6BAF0",
    },
    "&:active > p": {
      background: "#B9A4EE",
    },
  },
  "addButton--dark": {
    "&:hover > p": {
      background: "#402E61",
    },
    "&:active > p": {
      background: "#523880",
    },
  },
  addButtonIcon: {
    width: 50,
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#8F5AE8",
  },
  actionButtonText: {
    width: 200,
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 16,
    lineHeight: "120%",
    background: "#D2D0F2",
    color: "#8F5AE8",
    transition: "all ease 300ms",
    ["@media (max-width:530px)"]: {
      // eslint-disable-line no-useless-computed-key
      width: 100,
      fontSize: 14,
      padding: "8px 10px",
    },
  },
  "actionButtonText--light": {
    background: "#D2D0F2",
  },
  "actionButtonText--dark": {
    background: "#33284C",
  },
  table: {
    tableLayout: "auto",
  },
  accordionSummaryContent: {
    margin: 0,
    padding: 0,
  },
  sortSelect: {
    position: "absolute",
    top: 63,
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
  popoverPaper: {
    width: 340,
    height: 256,
    padding: 0,
    background: "none",
    border: "none !important",
    boxShadow: "5px 5px 20px rgba(14, 44, 79, 0.25)",
    borderRadius: 0,
    overflow: "hidden",
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
    const localToggleString = localStorage.getItem("solidly-pairsToggle-v1");
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
    { id: "balance--asc", label: "Wallet: high to low" },
    { id: "balance--desc", label: "Wallet: low to high" },
    { id: "poolBalance--asc", label: "My Pool Amount: high to low" },
    { id: "poolBalance--desc", label: "My Pool Amount: low to high" },
    { id: "stakedBalance--asc", label: "My Staked Amount: high to low" },
    { id: "stakedBalance--desc", label: "My Staked Amount: low to high" },
    { id: "poolAmount--asc", label: "Total Pool Amount: high to low" },
    { id: "poolAmount--desc", label: "Total Pool Amount: low to high" },
    { id: "stakedAmount--asc", label: "Total Pool Staked: high to low" },
    { id: "stakedAmount--desc", label: "Total Pool Staked: low to high" },
  ];

  const [search, setSearch] = useState("");
  const [toggleActive, setToggleActive] = useState(localToggles.toggleActive);
  const [toggleActiveGauge, setToggleActiveGauge] = useState(
    localToggles.toggleActiveGauge
  );
  const [toggleStable, setToggleStable] = useState(localToggles.toggleStable);
  const [toggleVariable, setToggleVariable] = useState(
    localToggles.toggleVariable
  );
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showSearch, setShowSearch] = useState(localToggles.showSearch);
  const [sortValueId, setSortValueId] = useState("stakedBalance--desc");
  const [sortDirection, setSortDirection] = useState("asc");

  window.addEventListener("resize", () => {
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
      case "toggleActive":
        setToggleActive(isChecked);
        props.setToggleActive(isChecked);
        localToggles.toggleActive = isChecked;
        break;
      case "toggleActiveGauge":
        setToggleActiveGauge(isChecked);
        props.setToggleActiveGauge(isChecked);
        localToggles.toggleActiveGauge = isChecked;
        break;
      case "toggleStable":
        setToggleStable(isChecked);
        props.setToggleStable(isChecked);
        localToggles.toggleStable = isChecked;
        break;
      case "toggleVariable":
        setToggleVariable(isChecked);
        props.setToggleVariable(isChecked);
        localToggles.toggleVariable = isChecked;
        break;
      case "showSearch":
        setShowSearch(event.showSearch);
        props.setShowSearch(event.showSearch);
        localToggles.showSearch = event.showSearch;
        break;
      default:
    }

    // set locally saved toggles
    try {
      localStorage.setItem(
        "solidly-pairsToggle-v1",
        JSON.stringify(localToggles)
      );
    } catch (ex) {
      console.log(ex);
    }
  };

  const onCreate = () => {
    router.push("/liquidity/create");
  };

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const handleSearch = () => {
    onToggle({
      target: { name: "showSearch" },
      showSearch: !localToggles.showSearch,
    });
  };

  const open = Boolean(anchorEl);
  const id = open ? "transitions-popper" : undefined;

  const handleChangeSort = ({ target: { value } }) => {
    const property = value.substring(0, value.indexOf("--"));
    const event = value.substring(value.indexOf("--") + 2);

    setSortValueId(value);
    setSortDirection(event);

    props.handleRequestSort(event, property);
  };

  const { appTheme } = useAppThemeContext();

  return (
    <Toolbar
      className={[
        classes.toolbar,
        "g-flex-column__item-fixed",
        "g-flex",
        "g-flex--space-between",
      ].join(" ")}
    >
      <div
        className={[classes.addButton, classes[`addButton--${appTheme}`]].join(
          " "
        )}
        onClick={onCreate}
      >
        <div className={classes.addButtonIcon}>
          <Add style={{ width: 20, color: "#fff" }} />
        </div>

        <Typography
          className={[
            classes.actionButtonText,
            classes[`actionButtonText--${appTheme}`],
          ].join(" ")}
        >
          Add Liquidity
        </Typography>
      </div>

      {windowWidth <= 660 && (
        <div className={classes.sortSelect}>
          <SortSelect
            value={sortValueId}
            options={options}
            handleChange={handleChangeSort}
            sortDirection={sortDirection}
          />
        </div>
      )}

      <div className={classes.searchContainer}>
        {(windowWidth > 1360 || showSearch) && (
          <TextField
            className={classes.searchInput}
            variant="outlined"
            fullWidth
            placeholder="Search by name or paste address"
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              style: {
                background: appTheme === "dark" ? "#151718" : "#DBE6EC",
                border: "1px solid",
                borderColor: appTheme === "dark" ? "#5F7285" : "#86B9D6",
                borderRadius: 0,
              },
              classes: {
                root: classes.searchInput,
              },
              startAdornment: (
                <InputAdornment position="start">
                  <Search
                    style={{
                      width: 20,
                      height: 20,
                      color: appTheme === "dark" ? "#4CADE6" : "#0B5E8E",
                    }}
                  />
                </InputAdornment>
              ),
            }}
            inputProps={{
              style: {
                padding: 11.5,
                borderRadius: 0,
                border: "none",
                fontSize: 18,
                fontWeight: 400,
                lineHeight: "120%",
                color: appTheme === "dark" ? "#C6CDD2" : "#325569",
              },
            }}
          />
        )}

        <div
          className={[
            classes.myDeposits,
            classes[`myDeposits--${appTheme}`],
          ].join(" ")}
        >
          <Typography
            className={classes.myDepositsText}
            style={{
              fontSize: "inherit",
            }}
          >
            <span
              style={{
                fontSize: "inherit",
                fontWeight: 500,
                color: appTheme === "dark" ? "#5F7285" : "#86B9D6",
                paddingRight: 4,
              }}
            >
              Show:
            </span>

            <span
              style={{
                fontSize: "inherit",
                fontWeight: 500,
                color: appTheme === "dark" ? "#4CADE6" : "#0B5E8E",
                whiteSpace: "nowrap",
              }}
            >
              My Deposits
            </span>
          </Typography>

          <div
            style={{
              marginLeft: windowWidth > 540 ? 10 : 0,
              marginRight: 10,
            }}
          >
            <SwitchCustom
              checked={toggleActive}
              onChange={onToggle}
              name={"toggleActive"}
            />
          </div>
        </div>

        <div
          className={[
            classes.actionsButtons,
            "g-flex",
            "g-flex--align-center",
          ].join(" ")}
        >
          <Tooltip placement="top" title="Filter list">
            <IconButton
              className={[
                classes.filterButton,
                classes[`filterButton--${appTheme}`],
              ].join(" ")}
              onClick={handleClick}
              aria-label="filter list"
            >
              <FilterAltOutlined />
            </IconButton>
          </Tooltip>

          {windowWidth <= 1360 && (
            <IconButton
              className={[
                classes.searchButton,
                classes[`searchButton--${appTheme}`],
              ].join(" ")}
              onClick={handleSearch}
              aria-label="filter list"
            >
              <Search />
            </IconButton>
          )}
        </div>
      </div>

      <Popover
        classes={{
          paper: [
            classes.popoverPaper,
            classes[`popoverPaper--${appTheme}`],
          ].join(" "),
        }}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <div
          className={[
            classes.filterContainer,
            classes[`filterContainer--${appTheme}`],
          ].join(" ")}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Typography
              className={[
                classes.filterListTitle,
                classes[`filterListTitle--${appTheme}`],
              ].join(" ")}
            >
              List Filters
            </Typography>

            <Close
              style={{
                cursor: "pointer",
                color: appTheme === "dark" ? "#ffffff" : "#0A2C40",
              }}
              onClick={handleClick}
            />
          </div>

          <div
            className={[
              classes.filterItem,
              classes[`filterItem--${appTheme}`],
              "g-flex",
              "g-flex--align-center",
              "g-flex--space-between",
            ].join(" ")}
          >
            <Typography
              className={[
                classes.filterLabel,
                classes[`filterLabel--${appTheme}`],
              ].join(" ")}
            >
              Show Active Gauges
            </Typography>

            <SwitchCustom
              checked={toggleActiveGauge}
              name={"toggleActiveGauge"}
              onChange={onToggle}
            />
          </div>

          <div
            className={[
              classes.filterItem,
              classes[`filterItem--${appTheme}`],
              "g-flex",
              "g-flex--align-center",
              "g-flex--space-between",
            ].join(" ")}
          >
            <Typography
              className={[
                classes.filterLabel,
                classes[`filterLabel--${appTheme}`],
              ].join(" ")}
            >
              Show Stable Pools
            </Typography>

            <SwitchCustom
              checked={toggleStable}
              name={"toggleStable"}
              onChange={onToggle}
            />
          </div>

          <div
            className={[
              classes.filterItem,
              classes[`filterItem--${appTheme}`],
              "g-flex",
              "g-flex--align-center",
              "g-flex--space-between",
            ].join(" ")}
          >
            <Typography
              className={[
                classes.filterLabel,
                classes[`filterLabel--${appTheme}`],
              ].join(" ")}
            >
              Show Volatile Pools
            </Typography>

            <SwitchCustom
              checked={toggleVariable}
              name={"toggleVariable"}
              onChange={onToggle}
            />
          </div>
        </div>
      </Popover>
    </Toolbar>
  );
};

export default function EnhancedTable({ pairs, isLoading }) {
  const classes = useStyles();
  const router = useRouter();

  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("stakedBalance");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const localToggles = getLocalToggles();

  const [search, setSearch] = useState("");
  const [toggleActive, setToggleActive] = useState(localToggles.toggleActive);
  const [toggleActiveGauge, setToggleActiveGauge] = useState(
    localToggles.toggleActiveGauge
  );
  const [toggleStable, setToggleStable] = useState(localToggles.toggleStable);
  const [toggleVariable, setToggleVariable] = useState(
    localToggles.toggleVariable
  );
  const [showSearch, setShowSearch] = useState(localToggles.showSearch);
  const [tableHeight, setTableHeight] = useState(
    window.innerHeight - 50 - 124 - 30 - 60 - 54 - 20 - 30
  );
  const [expanded, setExpanded] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";

    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  if (!pairs) {
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

  const filteredPairs = pairs
    .filter((pair) => {
      if (!search || search === "") {
        return true;
      }

      const searchLower = search.toLowerCase();

      return (
        pair.symbol.toLowerCase().includes(searchLower) ||
        pair.address.toLowerCase().includes(searchLower) ||
        pair.token0.symbol.toLowerCase().includes(searchLower) ||
        pair.token0.address.toLowerCase().includes(searchLower) ||
        pair.token0.name.toLowerCase().includes(searchLower) ||
        pair.token1.symbol.toLowerCase().includes(searchLower) ||
        pair.token1.address.toLowerCase().includes(searchLower) ||
        pair.token1.name.toLowerCase().includes(searchLower)
      );
    })
    .filter((pair) => {
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

  const { appTheme } = useAppThemeContext();

  window.addEventListener("resize", () => {
    setWindowWidth(window.innerWidth);
    setTableHeight(window.innerHeight - 50 - 124 - 30 - 60 - 54 - 20 - 30);
  });

  const handleChangeAccordion = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };
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

  return (
    <div
      className={["g-flex-column__item", "g-flex-column"].join(" ")}
      style={{
        overflowY: windowWidth <= 400 ? "auto" : "hidden",
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
        setSortDirection={setSortDirection}
      />

      {windowWidth > 660 && (
        <>
          <div
            style={{
              marginTop: windowWidth <= 1360 && showSearch ? 45 : 0,
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
                {filteredPairs.length === 0 && !isLoading && (
                  <TableBody>
                    <tr>
                      <td colSpan="7">
                        <TableBodyPlaceholder message="You have not added any liquidity yet" />
                      </td>
                    </tr>
                  </TableBody>
                )}

                {filteredPairs.length === 0 && isLoading && (
                  <TableBody>
                    <tr>
                      <td colSpan="7">
                        <TableBodyPlaceholder message="Loading your Deposit from the blockchain, please wait" />
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
                          className={classes.assetTableRow}
                        >
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
                                <div
                                  className={[
                                    classes.imgLogoContainer,
                                    classes[`imgLogoContainer--${appTheme}`],
                                  ].join(" ")}
                                >
                                  <img
                                    className={classes.imgLogo}
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
                                </div>

                                <div
                                  className={[
                                    classes.imgLogoContainer,
                                    classes.imgLogoContainer2,
                                    classes[`imgLogoContainer--${appTheme}`],
                                  ].join(" ")}
                                >
                                  <img
                                    className={classes.imgLogo}
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
                                  {row?.isStable
                                    ? "Stable Pool"
                                    : "Volatile Pool"}
                                </Typography>
                              </div>
                            </div>
                          </StickyTableCell>

                          <TableCell
                            className={[
                              classes.cell,
                              classes.hiddenMobile,
                            ].join(" ")}
                            style={{
                              background:
                                appTheme === "dark" ? "#151718" : "#DBE6EC",
                              borderBottom: `1px solid ${
                                appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                              }`,
                              overflow: "hidden",
                            }}
                            align="right"
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "flex-end",
                              }}
                            >
                              {row && row.token0 && row.token0.balance && (
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
                                    }}
                                  >
                                    {formatCurrency(row.token0.balance)}
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
                                    }}
                                  >
                                    {formatCurrency(row.token1.balance)}
                                  </Typography>
                                </div>
                              )}

                              {!(row && row.token0 && row.token0.balance) && (
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-end",
                                    paddingLeft: 10,
                                  }}
                                >
                                  <Skeleton
                                    variant="rect"
                                    width={120}
                                    height={16}
                                    style={{
                                      marginTop: "1px",
                                      marginBottom: "1px",
                                    }}
                                  />
                                </div>
                              )}
                              {row && row.token1 && row.token1.balance && (
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
                                    {formatSymbol(row.token0.symbol)}
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
                                    {formatSymbol(row.token1.symbol)}
                                  </Typography>
                                </div>
                              )}
                              {!(row && row.token1 && row.token1.balance) && (
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-end",
                                    paddingLeft: 10,
                                  }}
                                >
                                  <Skeleton
                                    variant="rect"
                                    width={120}
                                    height={16}
                                    style={{
                                      marginTop: "1px",
                                      marginBottom: "1px",
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell
                            className={[
                              classes.cell,
                              classes.hiddenMobile,
                            ].join(" ")}
                            style={{
                              background:
                                appTheme === "dark" ? "#151718" : "#DBE6EC",
                              borderBottom: `1px solid ${
                                appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                              }`,
                            }}
                            align="right"
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
                                              BigNumber(
                                                row?.gauge?.boostedApr0
                                              ),
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
                            {!(row && row?.gauge?.apr) && (
                              <div
                                className={classes.inlineEnd}
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-end",
                                  paddingLeft: 10,
                                }}
                              >
                                <Skeleton
                                  variant="rect"
                                  width={120}
                                  height={16}
                                  style={{
                                    marginTop: "1px",
                                    marginBottom: "1px",
                                  }}
                                />
                              </div>
                            )}
                          </TableCell>
                          <TableCell
                            className={[
                              classes.cell,
                              classes.hiddenMobile,
                            ].join(" ")}
                            style={{
                              background:
                                appTheme === "dark" ? "#151718" : "#DBE6EC",
                              borderBottom: `1px solid ${
                                appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                              }`,
                            }}
                            align="right"
                          >
                            {tableCellContent(
                              isNaN(BigNumber(row?.tvl))
                                ? "$ 0"
                                : `${numeral(parseInt(row?.tvl)).format(
                                    "($ 0a)"
                                  )} `,
                              null,
                              null,
                              null
                            )}
                            {!(row && row?.tvl) && (
                              <div
                                className={classes.inlineEnd}
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-end",
                                  paddingLeft: 10,
                                }}
                              >
                                <Skeleton
                                  variant="rect"
                                  width={120}
                                  height={16}
                                  style={{
                                    marginTop: "1px",
                                    marginBottom: "1px",
                                  }}
                                />
                              </div>
                            )}
                          </TableCell>

                          <TableCell
                            className={[
                              classes.cell,
                              classes.hiddenMobile,
                            ].join(" ")}
                            style={{
                              background:
                                appTheme === "dark" ? "#151718" : "#DBE6EC",
                              borderBottom: `1px solid ${
                                appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                              }`,
                            }}
                            align="right"
                          >
                            {row && row.balance && row.totalSupply && (
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
                                      color:
                                        appTheme === "dark"
                                          ? "#ffffff"
                                          : "#0A2C40",
                                    }}
                                  >
                                    {formatCurrency(
                                      BigNumber(row.balance)
                                        .div(row.totalSupply)
                                        .times(row.reserve0)
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
                                    }}
                                  >
                                    {formatCurrency(
                                      BigNumber(row.balance)
                                        .div(row.totalSupply)
                                        .times(row.reserve1)
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
                                    {row.token0.symbol}
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
                                    {row.token1.symbol}
                                  </Typography>
                                </div>
                              </div>
                            )}
                            {!(row && row.balance && row.totalSupply) && (
                              <div
                                className={classes.inlineEnd}
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-end",
                                  paddingLeft: 10,
                                }}
                              >
                                <Skeleton
                                  variant="rect"
                                  width={120}
                                  height={16}
                                  style={{
                                    marginTop: "1px",
                                    marginBottom: "1px",
                                  }}
                                />
                              </div>
                            )}
                          </TableCell>

                          {row?.gauge?.address && (
                            <TableCell
                              className={[
                                classes.cell,
                                classes.hiddenMobile,
                              ].join(" ")}
                              style={{
                                background:
                                  appTheme === "dark" ? "#151718" : "#DBE6EC",
                                borderBottom: `1px solid ${
                                  appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                                }`,
                              }}
                              align="right"
                            >
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
                                      color:
                                        appTheme === "dark"
                                          ? "#ffffff"
                                          : "#0A2C40",
                                    }}
                                  >
                                    {row &&
                                    row.gauge &&
                                    row.gauge.balance &&
                                    row.gauge.totalSupply
                                      ? formatCurrency(
                                          BigNumber(row.gauge.balance)
                                            .div(row.gauge.totalSupply)
                                            .times(row.gauge.reserve0)
                                        )
                                      : "0.00"}
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
                                    }}
                                  >
                                    {row &&
                                    row.gauge &&
                                    row.gauge.balance &&
                                    row.gauge.totalSupply
                                      ? formatCurrency(
                                          BigNumber(row.gauge.balance)
                                            .div(row.gauge.totalSupply)
                                            .times(row.gauge.reserve1)
                                        )
                                      : "0.00"}
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
                                    {formatSymbol(row.token0.symbol)}
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
                          )}

                          {!row?.gauge?.address && (
                            <TableCell
                              className={[
                                classes.cell,
                                classes.hiddenMobile,
                              ].join(" ")}
                              style={{
                                background:
                                  appTheme === "dark" ? "#151718" : "#DBE6EC",
                                borderBottom: `1px solid ${
                                  appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                                }`,
                              }}
                              align="right"
                            >
                              <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 500,
                                  fontSize: 14,
                                  lineHeight: "120%",
                                  color:
                                    appTheme === "dark" ? "#ffffff" : "#0A2C40",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Gauge not available
                              </Typography>
                            </TableCell>
                          )}

                          <TableCell
                            className={[
                              classes.cell,
                              classes.hiddenSmallMobile,
                            ].join(" ")}
                            style={{
                              background:
                                appTheme === "dark" ? "#151718" : "#DBE6EC",
                              borderBottom: `1px solid ${
                                appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                              }`,
                            }}
                            align="right"
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "flex-end",
                              }}
                            >
                              {row && row.reserve0 && row.token0 && (
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
                                    {formatCurrency(row.reserve0)}
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
                                    {formatCurrency(row.reserve1)}
                                  </Typography>
                                </div>
                              )}
                              {!(row && row.reserve0 && row.token0) && (
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-end",
                                    paddingLeft: 10,
                                  }}
                                >
                                  <Skeleton
                                    variant="rect"
                                    width={120}
                                    height={16}
                                    style={{
                                      marginTop: "1px",
                                      marginBottom: "1px",
                                    }}
                                  />
                                </div>
                              )}
                              {row && row.reserve1 && row.token1 && (
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
                                    {formatSymbol(row.token0.symbol)}
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
                                    {formatSymbol(row.token1.symbol)}
                                  </Typography>
                                </div>
                              )}
                              {!(row && row.reserve1 && row.token1) && (
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-end",
                                    paddingLeft: 10,
                                  }}
                                >
                                  <Skeleton
                                    variant="rect"
                                    width={120}
                                    height={16}
                                    style={{
                                      marginTop: "1px",
                                      marginBottom: "1px",
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {row?.gauge?.address && (
                            <TableCell
                              className={[
                                classes.cell,
                                classes.hiddenMobile,
                              ].join(" ")}
                              style={{
                                background:
                                  appTheme === "dark" ? "#151718" : "#DBE6EC",
                                borderBottom: `1px solid ${
                                  appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                                }`,
                              }}
                              align="right"
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                }}
                              >
                                {row &&
                                  row.gauge &&
                                  row.gauge.reserve0 &&
                                  row.token0 && (
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
                                        {formatCurrency(row.gauge.reserve0)}
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
                                        {formatCurrency(row.gauge.reserve1)}
                                      </Typography>
                                    </div>
                                  )}
                                {!(
                                  row &&
                                  row.gauge &&
                                  row.gauge.reserve0 &&
                                  row.token0
                                ) && (
                                  <div
                                    className={classes.inlineEnd}
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "flex-end",
                                      paddingLeft: 10,
                                    }}
                                  >
                                    <Skeleton
                                      variant="rect"
                                      width={120}
                                      height={16}
                                      style={{
                                        marginTop: "1px",
                                        marginBottom: "1px",
                                      }}
                                    />
                                  </div>
                                )}
                                {row &&
                                  row.gauge &&
                                  row.gauge.reserve1 &&
                                  row.token1 && (
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
                                        {formatSymbol(row.token0.symbol)}
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
                                        {formatSymbol(row.token1.symbol)}
                                      </Typography>
                                    </div>
                                  )}
                                {!(
                                  row &&
                                  row.gauge &&
                                  row.gauge.reserve1 &&
                                  row.token1
                                ) && (
                                  <div
                                    className={classes.inlineEnd}
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "flex-end",
                                      paddingLeft: 10,
                                    }}
                                  >
                                    <Skeleton
                                      variant="rect"
                                      width={120}
                                      height={16}
                                      style={{
                                        marginTop: "1px",
                                        marginBottom: "1px",
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          )}

                          {!row?.gauge?.address && (
                            <TableCell
                              className={[
                                classes.cell,
                                classes.hiddenMobile,
                              ].join(" ")}
                              style={{
                                background:
                                  appTheme === "dark" ? "#151718" : "#DBE6EC",
                                borderBottom: `1px solid ${
                                  appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                                }`,
                              }}
                              align="right"
                            >
                              <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 500,
                                  fontSize: 14,
                                  lineHeight: "120%",
                                  color:
                                    appTheme === "dark" ? "#ffffff" : "#0A2C40",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Gauge not available
                              </Typography>
                            </TableCell>
                          )}

                          <TableCell
                            className={classes.cell}
                            style={{
                              background:
                                appTheme === "dark" ? "#151718" : "#DBE6EC",
                              borderBottom: `1px solid ${
                                appTheme === "dark" ? "#2D3741" : "#CFE5F2"
                              }`,
                            }}
                            align="right"
                          >
                            <Button
                              variant="outlined"
                              color="primary"
                              style={{
                                padding: "7px 14px",
                                border: "1px solid #5688A5",
                                borderColor:
                                  appTheme === "dark" ? "#C6CDD2" : "#5688A5",
                                borderRadius: 100,
                                fontWeight: 500,
                                fontSize: 14,
                                lineHeight: "120%",
                                color:
                                  appTheme === "dark" ? "#C6CDD2" : "#5688A5",
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
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredPairs.length}
              rowsPerPage={rowsPerPage}
              page={page}
              labelRowsPerPage={
                window.innerWidth < 550 ? null : "Rows per page:"
              }
              rowsPerPageOptions={window.innerWidth < 435 ? [] : [5, 10, 25]}
              ActionsComponent={TablePaginationActions}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </div>
        </>
      )}

      {windowWidth <= 660 && (
        <div
          style={{
            overflowY: windowWidth > 400 ? "auto" : "visible",
            marginTop: 20,
          }}
        >
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
                    background: appTheme === "dark" ? "#24292D" : "#DBE6EC",
                    border: `1px solid ${
                      appTheme === "dark" ? "#2D3741" : "#9BC9E4"
                    }`,
                    borderRadius: 0,
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
                      className={["g-flex-column", "g-flex-column__item"].join(
                        " "
                      )}
                    >
                      <div
                        style={{
                          padding: "15px 20px",
                        }}
                        className={["g-flex", "g-flex--align-center"].join(" ")}
                      >
                        <div className={classes.doubleImages}>
                          <div
                            className={[
                              classes.imgLogoContainer,
                              classes[`imgLogoContainer--${appTheme}`],
                            ].join(" ")}
                          >
                            <img
                              className={classes.imgLogo}
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
                          </div>

                          <div
                            className={[
                              classes.imgLogoContainer,
                              classes.imgLogoContainer2,
                              classes[`imgLogoContainer--${appTheme}`],
                            ].join(" ")}
                          >
                            <img
                              className={classes.imgLogo}
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
                            {row?.isStable ? "Stable Pool" : "Volatile Pool"}
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
                        className={["g-flex", "g-flex--align-center"].join(" ")}
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
                                  appTheme === "dark" ? "#C6CDD2" : "#5688A5"
                                }`,
                                borderColor:
                                  appTheme === "dark" ? "#C6CDD2" : "#5688A5",
                                borderRadius: 100,
                                fontWeight: 500,
                                fontSize: 14,
                                lineHeight: "120%",
                                color:
                                  appTheme === "dark" ? "#C6CDD2" : "#5688A5",
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();

                                onView(row);
                              }}
                            >
                              Manage
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
                            Total Pool Amount
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
                                    appTheme === "dark" ? "#ffffff" : "#0A2C40",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {formatCurrency(row.reserve0)}
                              </Typography>

                              <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 500,
                                  fontSize: 14,
                                  lineHeight: "120%",
                                  color:
                                    appTheme === "dark" ? "#ffffff" : "#0A2C40",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {formatCurrency(row.reserve1)}
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
                                    appTheme === "dark" ? "#7C838A" : "#5688A5",
                                }}
                              >
                                {formatSymbol(row.token0.symbol)}
                              </Typography>

                              <Typography
                                className={`${classes.textSpaced} ${classes.symbol}`}
                                style={{
                                  fontWeight: 400,
                                  fontSize: 14,
                                  lineHeight: "120%",
                                  color:
                                    appTheme === "dark" ? "#7C838A" : "#5688A5",
                                }}
                              >
                                {formatSymbol(row.token1.symbol)}
                              </Typography>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          background:
                            appTheme === "dark" ? "#151718" : "#9BC9E4",
                        }}
                        className={[
                          classes.cellHeadPaddings,
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
                            color: appTheme === "dark" ? "#4CADE6" : "#0B5E8E",
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
                            className={["g-flex", "g-flex--align-center"].join(
                              " "
                            )}
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
                                  appTheme === "dark" ? "#C6CDD2" : "#325569",
                                borderRight: `1px solid ${
                                  appTheme === "dark" ? "#2D3741" : "#9BC9E4"
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
                                  {headCell.id === "balance" &&
                                    formatCurrency(row.token0.balance)}
                                  {headCell.id === "apr" &&
                                    tableCellContent(
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
                                                  BigNumber(
                                                    row?.gauge?.boostedApr0
                                                  ),
                                                  BigNumber(
                                                    row?.gauge?.boostedApr1
                                                  )
                                                ),
                                                2
                                              )}
                                              %{" - "}
                                              {formatCurrency(
                                                BigNumber.sum(
                                                  BigNumber(row?.gauge?.apr),
                                                  BigNumber(
                                                    row?.gauge?.boostedApr0
                                                  ),
                                                  BigNumber(
                                                    row?.gauge?.boostedApr1
                                                  )
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
                                                      BigNumber(
                                                        row?.gauge?.boostedApr0
                                                      ),
                                                      BigNumber(
                                                        row?.gauge?.boostedApr1
                                                      )
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
                                                    BigNumber(
                                                      row?.gauge?.boostedApr0
                                                    ),
                                                    2
                                                  )}
                                                  %
                                                </b>{" "}
                                                {row.token0.symbol} APR
                                              </dd>
                                              <dd>
                                                <b>
                                                  {formatCurrency(
                                                    BigNumber(
                                                      row?.gauge?.boostedApr1
                                                    ),
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
                                  {headCell.id === "tvl" &&
                                    tableCellContent(
                                      `${numeral(parseInt(row?.tvl)).format(
                                        "($ 0a)"
                                      )} `
                                    )}
                                  {headCell.id === "poolBalance" &&
                                    formatCurrency(
                                      BigNumber(row.balance)
                                        .div(row.totalSupply)
                                        .times(row.reserve0)
                                    )}
                                  {headCell.id === "stakedBalance" &&
                                    row?.gauge?.address &&
                                    formatCurrency(
                                      BigNumber(row.gauge.balance)
                                        .div(row.gauge.totalSupply)
                                        .times(row.gauge.reserve0)
                                    )}
                                  {headCell.id === "stakedBalance" &&
                                    !row?.gauge?.address &&
                                    "Gauge not available"}
                                  {headCell.id === "stakedAmount" &&
                                    row?.gauge?.address &&
                                    formatCurrency(row.gauge.reserve0)}
                                  {headCell.id === "stakedAmount" &&
                                    !row?.gauge?.address &&
                                    "Gauge not available"}
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
                                    formatCurrency(row.token1.balance)}

                                  {headCell.id === "poolBalance" &&
                                    formatCurrency(
                                      BigNumber(row.balance)
                                        .div(row.totalSupply)
                                        .times(row.reserve1)
                                    )}
                                  {headCell.id === "stakedBalance" &&
                                    row?.gauge?.address &&
                                    formatCurrency(
                                      BigNumber(row.gauge.balance)
                                        .div(row.gauge.totalSupply)
                                        .times(row.gauge.reserve1)
                                    )}
                                  {headCell.id === "stakedBalance" &&
                                    !row?.gauge?.address &&
                                    "Gauge not available"}
                                  {headCell.id === "stakedAmount" &&
                                    row?.gauge?.address &&
                                    formatCurrency(row.gauge.reserve1)}
                                  {headCell.id === "stakedAmount" &&
                                    !row?.gauge?.address &&
                                    "Gauge not available"}
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
                                {headCell.id === "apr" ||
                                headCell.id === "tvl" ? null : (
                                  <>
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
                                      {formatSymbol(row.token0.symbol)}
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
                                      {formatSymbol(row.token1.symbol)}
                                    </Typography>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ))}
                  </AccordionDetails>
                </Accordion>
              );
            })}
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
            classes={{
              displayedRows: classes.displayedRows,
            }}
            component="div"
            count={filteredPairs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            labelRowsPerPage={window.innerWidth < 550 ? null : "Rows per page:"}
            rowsPerPageOptions={window.innerWidth < 435 ? [] : [5, 10, 25]}
            ActionsComponent={TablePaginationActions}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </div>
      )}
    </div>
  );
}
