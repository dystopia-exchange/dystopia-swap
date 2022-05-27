import React, { useState, useEffect } from "react";
import {
  TextField,
  Typography,
  InputAdornment,
  Button,
  Dialog,
  InputBase,
  DialogTitle,
  DialogContent,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Search, KeyboardArrowDown, Close } from "@mui/icons-material";
import migrate from "../../stores/configurations/migrators";
import FactoryAbi from "../../stores/abis/FactoryAbi.json";
import pairContractAbi from "../../stores/abis/pairOldRouter.json";
import Form from "../../ui/MigratorForm";
import classes from "./ssMigrate.module.css";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import stores from "../../stores";
import { ACTIONS, CONTRACTS, ETHERSCAN_URL } from "../../stores/constants";
import {BigNumber} from "ethers";
import {parseUnits} from "ethers/lib/utils";
import Borders from "../../ui/Borders";
import AssetSelect from "../../ui/AssetSelect";
import Loader from "../../ui/Loader";
import Web3 from 'web3'

export default function Setup() {
  const [fromAssetValue, setFromAssetValue] = useState(null);
  const [toAssetValue, setToAssetValue] = useState(null);
  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);
  const { appTheme } = useAppThemeContext();
  const [isStable, toggleStablePool] = useState(false);
  const [toggleArrow, setToggleArrow] = useState(true);
  const [pairDetails, setPairDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [fromAssetError, setFromAssetError] = useState(false);
  const [platform, setPlatform] = React.useState(null);
  const [fromAssetOptions, setFromAssetOptions] = useState([]);
  const [toAssetOptions, setToAssetOptions] = useState([]);
  const [selectedValue, setSelectedValue] = React.useState("a");
  const [checkpair, setcheckpair] = useState(false);
  const [dystopiaPair, setdystopiaPair] = useState(null);
  const [quote, setQuote] = useState(null);
  const [amount0, setAmount0] = useState("");
  const [amount1, setAmount1] = useState("");

  const handleRadioChange = async (bool) => {
    toggleStablePool(bool);
    const pair = await stores.stableSwapStore.getPair(
      fromAssetValue.address,
      toAssetValue.address,
      bool
    );
    if (pair != null) {
      pair.reserve0 =
        (parseFloat(pair?.balance.toString()) /
          parseFloat(pair?.totalSupply.toString())) *
        parseFloat(pair?.reserve0);
      pair.reserve1 =
        (parseFloat(pair?.balance.toString()) /
          parseFloat(pair?.totalSupply.toString())) *
        parseFloat(pair?.reserve1.toString());

      setdystopiaPair(pair);
      let removedToken0 =
        (amount * pairDetails?.weiReserve1) / pairDetails?.totalSupply;
      let removedToken1 =
        (amount * pairDetails?.weiReserve2) / pairDetails?.totalSupply;
      if (pairDetails?.isValid && removedToken0 > 0 && removedToken1 > 0) {
        await callQuoteAddLiquidity(
          removedToken0,
          removedToken1,
          bool,
          pairDetails.token0,
          pairDetails.token1
        );
      }
    }
  };

  function ValueLabelComponent(props) {
    const { children, value } = props;

    return (
      <Tooltip enterTouchDelay={0} placement="top" title={value}>
        {children}
      </Tooltip>
    );
  }

  const getPairDetails = async (token0, token1) => {
    const multicall = await stores.accountStore.getMulticall();

    if (token0 == "MATIC") {
      token0 = CONTRACTS.WFTM_ADDRESS;
    }
    if (token1 == "MATIC") {
      token1 = CONTRACTS.WFTM_ADDRESS;
    }

    try {
      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
      } else {
        const account = stores.accountStore.getStore("account");
        if (!account) {
          console.warn("account not found");
        } else {
          const factoryContract = new web3.eth.Contract(
            FactoryAbi,
            platform.value,
          );
          const pairAddress = await factoryContract.methods
            .getPair(token0, token1)
            .call();
          if (pairAddress !== "0x0000000000000000000000000000000000000000") {
            const pairContract = new web3.eth.Contract(
              pairContractAbi,
              pairAddress,
            );

            const migrator = migrate.find(
              (eachMigrate) => eachMigrate == platform,
            );
            let [
              getReserves,
              symbol,
              allowence,
              getTotalSupply,
              lpBalance,
              token0Add,
              token1Add,
            ] = await multicall.aggregate([
              pairContract.methods.getReserves(),
              pairContract.methods.symbol(),
              pairContract.methods.allowance(
                account.address,
                migrator.migratorAddress[process.env.NEXT_PUBLIC_CHAINID],
              ),
              pairContract.methods.totalSupply(),
              pairContract.methods.balanceOf(account.address),
              pairContract.methods.token0(),
              pairContract.methods.token1(),
            ]);

            const token0Contract = new web3.eth.Contract(
              pairContractAbi,
              token0Add,
            );
            const token1Contract = new web3.eth.Contract(
              pairContractAbi,
              token1Add,
            );
            let [token0symbol, token1symbol, decimal0, decimal1] =
              await multicall.aggregate([
                token0Contract.methods.symbol(),
                token1Contract.methods.symbol(),
                token0Contract.methods.decimals(),
                token1Contract.methods.decimals(),
              ]);

            let totalSupply = web3.utils.fromWei(
              getTotalSupply.toString(),
              "ether",
            );
            lpBalance = web3.utils.fromWei(lpBalance.toString(), "ether");

            const weiReserve1 = getReserves[0] / 10 ** decimal0;

            const weiReserve2 = getReserves[1] / 10 ** decimal1;

            const token0Bal =
              (parseFloat(lpBalance.toString()) /
                parseFloat(totalSupply.toString())) *
              parseFloat(weiReserve1);
            const token1Bal =
              (parseFloat(lpBalance.toString()) /
                parseFloat(totalSupply.toString())) *
              parseFloat(weiReserve2.toString());
            const poolTokenPercentage =
              (parseFloat(lpBalance) * 100) / parseFloat(totalSupply);

            let token0 = {
              symbol: token0symbol,
              decimals: decimal0,
              balanceOf: token0Bal,
              address: token0Add,
            };
            let token1 = {
              symbol: token1symbol,
              decimals: decimal1,
              balanceOf: token1Bal,
              address: token1Add,
            };

            let pairDetails = {
              isValid: true,
              symbol: symbol,
              token0symbol: token0symbol,
              token1symbol: token1symbol,
              lpBalance: parseFloat(lpBalance).toFixed(12),
              totalSupply,
              token0,
              token1,
              token0Bal: parseFloat(token0Bal).toFixed(18),
              token1Bal: parseFloat(token1Bal).toFixed(18),
              allowence,
              weiReserve1,
              weiReserve2,
              pairAddress,
              poolTokenPercentage: Math.floor(poolTokenPercentage),
            };

            setAmount(parseFloat(lpBalance).toFixed(12));
            setPairDetails(pairDetails);
            return pairDetails;
          } else {
            let pairDetails = {
              isValid: false,
              lpBalance: 0,
              allowence: 0,
            };
            setPairDetails(pairDetails);
            return pairDetails;
          }
        }
      }
    } catch (e) {
      console.log(e, "e");
    }
  };

  const onAssetSelect = async (type, value) => {
    if (type === "From") {
      if (value.address === toAssetValue.address) {
        setToAssetValue(fromAssetValue);
        setFromAssetValue(toAssetValue);
      } else {
        setFromAssetValue(value);
      }
    } else {
      if (value.address === fromAssetValue.address) {
        setFromAssetError(toAssetValue);
        setToAssetValue(fromAssetValue);
      } else {
        setToAssetValue(value);
      }
    }
    setPairDetails(null);
    setcheckpair(false);
    setdystopiaPair(false);
    setQuote(null);
    forceUpdate();
  };
  const ssUpdated = async () => {
    const baseAsset = await stores.stableSwapStore.getStore("baseAssets");

    setToAssetOptions(baseAsset);
    setFromAssetOptions(baseAsset);

    if (baseAsset.length > 0 && toAssetValue == null) {
      setToAssetValue(baseAsset[0]);
    }

    if (baseAsset.length > 0 && fromAssetValue == null) {
      setFromAssetValue(baseAsset[1]);
    }
    forceUpdate();
  };

  useEffect(() => {
    stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
    ssUpdated();
    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
    };
  }, []);

  const handleChange = (event) => {
    setPlatform(event);
    setPairDetails(null);
    setcheckpair(false);
  };

  const migrateLiquidity = async () => {
    try {
      setLoading(true);
      const migrator = migrate.find((eachMigrate) => eachMigrate == platform);
      const web3 = await stores.accountStore.getWeb3Provider();
      
      let am = (parseUnits(amount.toString()));
      

      stores.dispatcher.dispatch({
        type: ACTIONS.MIGRATE,
        content: {
          migrator: migrator,
          token0: fromAssetValue,
          token1: toAssetValue,
          amount: am,
          isStable: isStable,
          allowance: pairDetails.allowence,
          pairDetails: pairDetails,
        },
      });
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleAmountChange = async (event) => {
let am
    if (parseFloat(event.target.value) >= parseFloat(pairDetails.lpBalance)) {
      setAmount(pairDetails.lpBalance);
am = pairDetails.lpBalance
    } else {
      setAmount(event.target.value);
      am = event.target.value
    }

    if (
      parseFloat(am) <= 0 ||
      am == null ||
      am == "" ||
      isNaN(am)
    ) {
      setdystopiaPair(false);
    } else {
      setdystopiaPair(true);
    }

    pairDetails.token0Bal =
      (parseFloat(am.toString()) /
        parseFloat(pairDetails.totalSupply.toString())) *
      parseFloat(pairDetails.weiReserve1);

    pairDetails.token1Bal =
      (parseFloat(am.toString()) /
        parseFloat(pairDetails.totalSupply.toString())) *
      parseFloat(pairDetails.weiReserve2.toString());

    let removedToken0 =
      (am * pairDetails?.weiReserve1) /
      pairDetails?.totalSupply;
    let removedToken1 =
      (am * pairDetails?.weiReserve2) /
      pairDetails?.totalSupply;

    if (pairDetails?.isValid && removedToken0 > 0 && removedToken1 > 0)
      await callQuoteAddLiquidity(
        removedToken0,
        removedToken1,
        pairDetails.isStable,
        pairDetails.token0,
        pairDetails.token1
      );
  };
  const handleMax = async (lpBalance) => {
    setAmount(lpBalance);
    pairDetails.token0Bal =
      (parseFloat(lpBalance.toString()) /
        parseFloat(pairDetails.totalSupply.toString())) *
      parseFloat(pairDetails.weiReserve1);

    pairDetails.token1Bal =
      (parseFloat(lpBalance.toString()) /
        parseFloat(pairDetails.totalSupply.toString())) *
      parseFloat(pairDetails.weiReserve2.toString());

    let removedToken0 =
      (lpBalance * pairDetails?.weiReserve1) / pairDetails?.totalSupply;
    let removedToken1 =
      (lpBalance * pairDetails?.weiReserve2) / pairDetails?.totalSupply;

    if (pairDetails?.isValid && removedToken0 > 0 && removedToken1 > 0){
      await callQuoteAddLiquidity(
        removedToken0,
        removedToken1,
        pairDetails.isStable,
        pairDetails.token0,
        pairDetails.token1
      );
      setdystopiaPair(true) }
  };

  let buttonText = "Approve";

  if (loading && pairDetails && parseFloat(pairDetails.allowence) === 0) {
    buttonText = "Approving...";
  } else if (loading && pairDetails && parseFloat(pairDetails.allowence) > 0) {
    buttonText = "Migrating...";
  } else if (pairDetails && parseFloat(pairDetails.allowence) > 0) {
    buttonText = "Migrate Liquidity";
  }

  const disableButton =
    !platform ||
    (loading &&
      pairDetails &&
      !pairDetails.isValid &&
      Number(parseInt(pairDetails?.lpBalance)) == Number(0));
  const migrator = migrate.find((eachMigrate) => eachMigrate == platform);
  const OpenDown = (props) => {
    return (
      <div
        {...props}
        className={`${props.className} ${[
          classes[`selecticonIcon`],
          classes[`selecticonIcon--${appTheme}`],
        ].join(" ")}`}
      >
        <KeyboardArrowDown />
      </div>
    );
  };
  const callQuoteAddLiquidity = async (
    amount0,
    amount1,
    isStable,
    token0,
    token1
  ) => {
    const web3 = await stores.accountStore.getWeb3Provider();
    const routerContract = new web3.eth.Contract(
      CONTRACTS.ROUTER_ABI,
      CONTRACTS.ROUTER_ADDRESS
    );
    console
    const sendAmount0 = parseUnits(amount0.toString(),token0.decimals)
    const sendAmount1 = parseUnits(amount1.toString(),token0.decimals)

    let addy0 = token0.address;
    let addy1 = token1.address;

    if (token0.address === "MATIC") {
      addy0 = CONTRACTS.WFTM_ADDRESS;
    }
    if (token1.address === "MATIC") {
      addy1 = CONTRACTS.WFTM_ADDRESS;
    }

    let res = await routerContract.methods
      .quoteAddLiquidity(addy0, addy1, isStable, sendAmount0, sendAmount1)
      .call();
    res = { res, token0: token0, token1: token1 };
    setQuote(res);

  };
  const checkPair = async (fromAssetValue, toAssetValue, isStable) => {
    const web3 = await stores.accountStore.getWeb3Provider();

    await getPairDetails(fromAssetValue, toAssetValue).then(async (a) => {
      if (!a?.isValid) setcheckpair(false);
      else setcheckpair(true);

      let removedToken0 = (a?.lpBalance * a?.weiReserve1) / a?.totalSupply;
      let removedToken1 = (a?.lpBalance * a?.weiReserve2) / a?.totalSupply;

      if (a?.isValid && removedToken0 > 0 && removedToken1 > 0)
        await callQuoteAddLiquidity(
          removedToken0,
          removedToken1,
          isStable,
          a.token0,
          a.token1
        );
    });
    const pair = await stores.stableSwapStore.getPair(
      fromAssetValue,
      toAssetValue,
      isStable,
    );

    if (pair != null) {
      pair.reserve0 =
        (parseFloat(pair?.balance.toString()) /
          parseFloat(pair?.totalSupply.toString())) *
        parseFloat(pair?.reserve0);
      pair.reserve1 =
        (parseFloat(pair?.balance.toString()) /
          parseFloat(pair?.totalSupply.toString())) *
        parseFloat(pair?.reserve1.toString());

      setdystopiaPair(pair);
    } else {
      setdystopiaPair(false);
    }
  };

  const arrowIcon = () => {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M9.99962 10.9773L14.1246 6.85232L15.303 8.03065L9.99962 13.334L4.69629 8.03065L5.87462 6.85232L9.99962 10.9773Z"
          fill={appTheme === "dark" ? "#4CADE6" : "#0B5E8E"}
        />
      </svg>
    );
  };

  const PlatformSelect = ({ onSelect }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [filteredPlatform, setFilteredPlatform] = useState([]);

    const handleClickOpen = () => {
      setOpen(true);
    };
    const handleClose = () => {
      onSelect(type, asset);
      setOpen(false);
    };
    const handleCloseSelect = (platform) => {
      onSelect(platform);
      setOpen(false);
    };

    const onClose = () => {
      setSearch("");
      setOpen(false);
    };

    const openSearch = () => {
      setSearch("");
      setOpen(true);
    };

    useEffect(
      async function () {
        let ao = migrate.filter((eachPlatform) => {
          if (search && search !== "") {
            return eachPlatform.label
              .toLowerCase()
              .includes(search.toLowerCase());
          } else {
            return true;
          }
        });
        setFilteredPlatform(ao);

        //no options in our default list and its an address we search for the address
        if (ao.length === 0 && search && search.length === 42) {
          const baseAsset = await stores.stableSwapStore.getBaseAsset(
            event.target.value,
            true,
            true,
          );
        }

        return () => { };
      },
      [search],
    );

    const onSearchChanged = async (event) => {
      setSearch(event.target.value);
    };

    return (
      <>
        <div
          className={[
            classes.select,
            classes[`select--${appTheme}`],
            "g-flex",
            "g-flex--align-center",
          ].join(" ")}
          onClick={handleClickOpen}
        >
          <div
            style={{
              position: 'relative',
              height: '100%',
            }}
            className={["g-flex__item", "g-flex", "g-flex--align-center"].join(
              " "
            )}
          >
            <Borders
              offsetLeft={-1}
              offsetRight={-1}
              offsetTop={-1}
              offsetBottom={-1}
            />

            <div className={classes.selectLabel}>
              {platform ? platform.label : "Select a platform"}
            </div>
          </div>

          <div
            className={[
              classes.selectArrow,
              "g-flex__item-fixed",
              "g-flex",
              "g-flex--align-center",
              "g-flex--justify-center",
            ].join(" ")}
          >
            <Borders
              offsetLeft={-1}
              offsetRight={-1}
              offsetTop={-1}
              offsetBottom={-1}
            />

            {arrowIcon()}
          </div>
        </div>

        <Dialog
          classes={{
            paperScrollPaper: classes.paperScrollPaper,
          }}
          aria-labelledby="simple-dialog-title"
          open={open}
          style={{ borderRadius: 0 }}
          onClick={(e) => {
            if (e.target.classList.contains("MuiDialog-container")) {
              onClose();
            }
          }}
        >
          <div
            className={[classes.dialogContainer, "g-flex-column"].join(" ")}
            style={{
              width: 460,
              height: 710,
              background: appTheme === "dark" ? "#151718" : "#DBE6EC",
              border:
                appTheme === "dark" ? "1px solid #5F7285" : "1px solid #86B9D6",
              borderRadius: 0,
              overflow: "hidden",
            }}
          >
            <DialogTitle
              className={[
                classes.dialogTitle,
                "g-flex-column__item-fixed",
              ].join(" ")}
              style={{
                padding: 30,
                paddingBottom: 0,
                fontWeight: 500,
                fontSize: 18,
                lineHeight: "140%",
                color: "#0A2C40",
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
                    display: "flex",
                    alignItems: "center",
                    color: appTheme === "dark" ? "#ffffff" : "#0A2C40",
                  }}
                >
                  Select a platform
                </div>

                <Close
                  style={{
                    cursor: "pointer",
                    color: appTheme === "dark" ? "#ffffff" : "#0A2C40",
                  }}
                  onClick={onClose}
                />
              </div>
            </DialogTitle>

            <div className={classes.searchInline}>
              <Borders />

              <TextField
                variant="outlined"
                fullWidth
                placeholder="Search by name"
                value={search}
                onChange={onSearchChanged}
                InputProps={{
                  classes: {
                    root: [
                      classes.searchInput,
                      classes[`searchInput--${appTheme}`],
                    ].join(" "),
                    inputAdornedStart: [
                      classes.searchInputText,
                      classes[`searchInputText--${appTheme}`],
                    ].join(" "),
                  },
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search
                        style={{
                          color: appTheme === "dark" ? "#4CADE6" : "#0B5E8E",
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </div>

            <DialogContent
              className={[
                classes.dialogContent,
                "g-flex-column__item",
                "g-flex-column",
              ].join(" ")}
            >
              {filteredPlatform.length === 0
                ? migrate.map((eachPlatform, index) => (
                  <div
                    key={index}
                    className={[
                      classes.pairDetails,
                      classes[`pairDetails--${appTheme}`],
                      "g-flex",
                      "g-flex--align-center",
                    ].join(" ")}
                  >
                    <Borders
                      offsetLeft={-1}
                      offsetRight={-1}
                      offsetTop={-1}
                      offsetBottom={-1}
                    />

                    {eachPlatform.label}
                  </div>
                ))
                : filteredPlatform.map((eachPlatform, index) => (
                  <div
                    key={index}
                    className={[
                      classes.pairDetails,
                      classes[`pairDetails--${appTheme}`],
                      "g-flex",
                      "g-flex--align-center",
                    ].join(" ")}
                    onClick={() => handleCloseSelect(eachPlatform)}
                  >
                    <Borders
                      offsetLeft={-1}
                      offsetRight={-1}
                      offsetTop={-1}
                      offsetBottom={-1}
                    />

                    {eachPlatform.label}
                  </div>
                ))}
            </DialogContent>
          </div>
        </Dialog>
      </>
    );
  };

  return (
    <div className={["g-flex-column", "g-flex--align-center"].join(" ")}>
      <Form>
        <div
          className={[classes[`form`], classes[`form--${appTheme}`]].join(" ")}
        >
          <div
            className={[
              classes.titleText,
              classes[`titleText--${appTheme}`],
            ].join(" ")}
          >
            Source of Migration:
          </div>

          <PlatformSelect onSelect={handleChange} />

          <div
            className={[
              classes.dividerLine,
              classes[`dividerLine--${appTheme}`],
            ].join(" ")}
          ></div>

          <div className={[classes.pairsContainer, "g-flex"].join(" ")}>
            <div
              className={[
                classes.pair,
                classes[`pair--${appTheme}`],
                "g-flex-column",
              ].join(" ")}
            >
              <div
                className={[
                  classes.pairTitle,
                  classes[`pairTitle--${appTheme}`],
                  "g-flex",
                  "g-flex--align-center",
                ].join(" ")}
              >
                <Borders
                  offsetLeft={-1}
                  offsetRight={-1}
                  offsetTop={-1}
                  offsetBottom={-1}
                />
                Token 1
              </div>

              <div
                className={[
                  classes.pairContent,
                  classes[`pairContent--${appTheme}`],
                  "g-flex",
                  "g-flex--align-center",
                ].join(" ")}
              >
                <Borders
                  offsetLeft={-1}
                  offsetRight={-1}
                  offsetTop={-1}
                  offsetBottom={-1}
                />

                <AssetSelect
                  type={"From"}
                  value={fromAssetValue}
                  assetOptions={fromAssetOptions}
                  onSelect={onAssetSelect}
                  showBalance={false}
                  size={"small"}
                  interactiveBorder={false}
                />

                <div>{fromAssetValue?.symbol}</div>
              </div>
            </div>

            <div
              className={[
                classes.pair,
                classes[`pair--${appTheme}`],
                "g-flex-column",
              ].join(" ")}
            >
              <div
                className={[
                  classes.pairTitle,
                  classes[`pairTitle--${appTheme}`],
                  "g-flex",
                  "g-flex--align-center",
                ].join(" ")}
              >
                <Borders
                  offsetLeft={-1}
                  offsetRight={-1}
                  offsetTop={-1}
                  offsetBottom={-1}
                />
                Token 2
              </div>

              <div
                className={[
                  classes.pairContent,
                  classes[`pairContent--${appTheme}`],
                  "g-flex",
                  "g-flex--align-center",
                ].join(" ")}
              >
                <Borders
                  offsetLeft={-1}
                  offsetRight={-1}
                  offsetTop={-1}
                  offsetBottom={-1}
                />

                <AssetSelect
                  type={"To"}
                  value={toAssetValue}
                  assetOptions={toAssetOptions}
                  onSelect={onAssetSelect}
                  showBalance={false}
                  size={"small"}
                  interactiveBorder={false}
                />

                <div>{toAssetValue?.symbol}</div>
              </div>
            </div>

            <div
              className={[
                classes.pairsCircle,
                classes[`pairsCircle--${appTheme}`],
              ].join(" ")}
            >
              <div
                className={[
                  classes.pairsCircleInside,
                  classes[`pairsCircleInside--${appTheme}`],
                  "g-flex",
                  "g-flex--align-center",
                  "g-flex--justify-center",
                ].join(" ")}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.75844 9.11694L7.93761 7.93777C8.47929 7.39604 9.12238 6.9663 9.83015 6.67311C10.5379 6.37992 11.2965 6.22902 12.0626 6.22902C12.8287 6.22902 13.5873 6.37992 14.2951 6.67311C15.0028 6.9663 15.6459 7.39604 16.1876 7.93777L16.4818 8.23277C17.5758 9.32679 18.1904 10.8106 18.1904 12.3578C18.1904 13.9049 17.5758 15.3888 16.4818 16.4828C15.3878 17.5768 13.904 18.1914 12.3568 18.1914C10.8096 18.1914 9.3258 17.5768 8.23178 16.4828L9.41094 15.3036C9.79724 15.6933 10.2567 16.0029 10.7629 16.2145C11.2692 16.4261 11.8123 16.5357 12.361 16.5369C12.9097 16.5381 13.4532 16.4309 13.9604 16.2215C14.4676 16.0121 14.9284 15.7045 15.3164 15.3165C15.7044 14.9285 16.0119 14.4677 16.2213 13.9606C16.4308 13.4534 16.538 12.9098 16.5368 12.3611C16.5356 11.8124 16.426 11.2694 16.2143 10.7631C16.0027 10.2569 15.6931 9.7974 15.3034 9.41111L15.0084 9.11611C14.2271 8.33498 13.1675 7.89616 12.0626 7.89616C10.9578 7.89616 9.89814 8.33498 9.11678 9.11611L7.93761 10.2953L6.75928 9.11611L6.75844 9.11694ZM11.7676 3.51861L10.5893 4.69694C10.203 4.30725 9.74352 3.99769 9.23727 3.78605C8.73102 3.5744 8.18796 3.46483 7.63925 3.46363C7.09054 3.46243 6.547 3.56962 6.03983 3.77905C5.53265 3.98847 5.07184 4.29601 4.68385 4.68401C4.29585 5.07201 3.98831 5.53282 3.77888 6.03999C3.56946 6.54716 3.46227 7.0907 3.46347 7.63941C3.46467 8.18812 3.57424 8.73119 3.78589 9.23744C3.99753 9.74369 4.30709 10.2031 4.69678 10.5894L4.99178 10.8844C5.77314 11.6656 6.83276 12.1044 7.93761 12.1044C9.04246 12.1044 10.1021 11.6656 10.8834 10.8844L12.0626 9.70527L13.2409 10.8844L12.0626 12.0628C11.5209 12.6045 10.8778 13.0342 10.1701 13.3274C9.4623 13.6206 8.70371 13.7715 7.93761 13.7715C7.17152 13.7715 6.41293 13.6206 5.70515 13.3274C4.99738 13.0342 4.35429 12.6045 3.81261 12.0628L3.51845 11.7678C2.42443 10.6738 1.80981 9.18995 1.80981 7.64277C1.80981 6.0956 2.42443 4.61179 3.51844 3.51778C4.61246 2.42376 6.09627 1.80914 7.64344 1.80914C9.19062 1.80914 10.6744 2.42376 11.7684 3.51778L11.7676 3.51861Z"
                    fill={appTheme === "dark" ? "#7C838A" : "#5688A5"}
                  />
                </svg>
              </div>
            </div>
          </div>

          {pairDetails && !pairDetails.isValid && (
            <div
              className={[
                classes.inputBalanceErrorText,
                classes[`inputBalanceErrorText--${appTheme}`],
                "g-flex",
                "g-flex--align-center",
              ].join(" ")}
            >
              The chosen Liquidity Pair does not exist
            </div>
          )}

          {pairDetails && pairDetails.isValid && (
            <>
              <div className={['g-flex'].join(" ")} style={{width: '100%', marginTop: 20}}>
                <div className={['g-flex-column', 'g-flex__item-fixed'].join(' ')}>
                  <div
                    className={[
                      classes.liqHeader,
                      classes[`liqHeader--${appTheme}`],
                      classes.liqHeaderLabel,
                      "g-flex",
                      "g-flex--align-center",
                    ].join(" ")}
                  >
                    <Borders
                      offsetLeft={-1}
                      offsetRight={-1}
                      offsetTop={-1}
                      offsetBottom={-1}
                    />

                    <div>Liq. Pair</div>
                  </div>

                  <div
                    className={[
                      classes.liqBody,
                      classes[`liqBody--${appTheme}`],
                      classes.liqBodyLabel,
                      "g-flex",
                      "g-flex--align-center",
                    ].join(" ")}
                  >
                    <Borders
                      offsetLeft={-1}
                      offsetRight={-1}
                      offsetTop={-1}
                      offsetBottom={-1}
                    />

                    <div
                      className={[
                        classes.liqBodyIconContainer,
                        classes[`liqBodyIconContainer--${appTheme}`],
                      ].join(" ")}
                    >
                      <img
                        className={classes.liqBodyIcon}
                        alt=""
                        src={fromAssetValue ? `${fromAssetValue.logoURI}` : ""}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                        }}
                      />
                    </div>

                    <div
                      className={[
                        classes.liqBodyIconContainer,
                        classes[`liqBodyIconContainer--${appTheme}`],
                      ].join(" ")}
                    >
                      <img
                        className={classes.liqBodyIcon}
                        alt=""
                        src={toAssetValue ? `${toAssetValue.logoURI}` : ""}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className={["g-flex-column", "g-flex__item"].join(" ")}>
                  <div
                    className={[
                      classes.liqHeader,
                      classes[`liqHeader--${appTheme}`],
                      "g-flex",
                      "g-flex--align-center",
                      "g-flex--space-between",
                    ].join(" ")}
                  >
                    <Borders
                      offsetLeft={-1}
                      offsetRight={-1}
                      offsetTop={-1}
                      offsetBottom={-1}
                    />

                    <div
                      className={["g-flex", "g-flex--align-center"].join(" ")}
                    >
                      <img
                        src="/images/ui/icon-wallet.svg"
                        className={classes.walletIcon}
                      />

                      <div>
                        {pairDetails && pairDetails.lpBalance
                          ? Number(pairDetails.lpBalance).toFixed(5)
                          : "0"}
                      </div>
                    </div>

                    <div
                      className={[
                        classes.balanceMax,
                        classes[`balanceMax--${appTheme}`],
                      ].join(" ")}
                      onClick={() =>
                        handleMax(pairDetails.lpBalance)
                      }
                    >
                      MAX
                    </div>
                  </div>

                  <div
                    className={[
                      classes.liqBody,
                      classes[`liqBody--${appTheme}`],
                      "g-flex",
                      "g-flex--align-center",
                    ].join(" ")}
                  >
                    <Borders
                      offsetLeft={-1}
                      offsetRight={-1}
                      offsetTop={-1}
                      offsetBottom={-1}
                    />

                    <div>
                      <InputBase
                        className={classes.massiveInputAmount}
                        placeholder="0.00"
                        inputProps={{
                          className: [
                            classes.largeInput,
                            classes[`largeInput--${appTheme}`],
                          ].join(" "),
                        }}
                        fullWidth
                        value={amount}
                        onChange={(event) => handleAmountChange(event)}
                      />

                      <Typography
                        className={[
                          classes.smallerText,
                          classes[`smallerText--${appTheme}`],
                        ].join(" ")}
                      >
                        {fromAssetValue?.symbol}/{toAssetValue?.symbol}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={[
                  classes.pairContainer,
                  classes[`pairContainer--${appTheme}`],
                  "g-flex",
                  "g-flex--align-center",
                  "g-flex--space-between",
                ].join(" ")}
              >
                <div className={["g-flex", "g-flex--align-center"].join(" ")}>
                  <div
                    className={[
                      classes.pairIconContainer,
                      classes[`pairIconContainer--${appTheme}`],
                    ].join(" ")}
                  >
                    <img
                      className={classes.pairIcon}
                      alt=""
                      src={fromAssetValue ? `${fromAssetValue.logoURI}` : ""}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                      }}
                    />
                  </div>

                  <div
                    className={[
                      classes.pairIconContainer,
                      classes[`pairIconContainer--${appTheme}`],
                    ].join(" ")}
                  >
                    <img
                      className={classes.pairIcon}
                      alt=""
                      src={toAssetValue ? `${toAssetValue.logoURI}` : ""}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                      }}
                    />
                  </div>

                  <div style={{ marginLeft: 10 }}>
                    <div
                      className={[
                        classes.pairSymbolLabel,
                        classes[`pairSymbolLabel--${appTheme}`],
                      ].join(" ")}
                    >
                      {fromAssetValue?.symbol}/{toAssetValue?.symbol}
                    </div>

                    <div
                      className={[
                        classes.pairPoolLabel,
                        classes[`pairPoolLabel--${appTheme}`],
                      ].join(" ")}
                    >
                      {platform.label} Pool
                    </div>
                  </div>
                </div>

                <div
                  className={[
                    classes.pairBalance,
                    classes[`pairBalance--${appTheme}`],
                  ].join(" ")}
                >
                  {Number(amount).toFixed(5)}
                </div>
              </div>

              <div
                className={[
                  classes.poolShare,
                  classes[`poolShare--${appTheme}`],
                  "g-flex",
                  "g-flex--align-center",
                  "g-flex--space-between",
                ].join(" ")}
              >
                <Borders
                  offsetLeft={-1}
                  offsetRight={-1}
                  offsetTop={-1}
                  offsetBottom={-1}
                />

                <div>Your Pool Share:</div>

                <div
                  className={[
                    classes.poolShareBalance,
                    classes[`poolShareBalance--${appTheme}`],
                  ].join(" ")}
                >
                  {pairDetails.poolTokenPercentage}%
                </div>
              </div>

              <div
                className={[
                  classes.poolShareCoins,
                  classes[`poolShareCoins--${appTheme}`],
                  "g-flex",
                  "g-flex--align-center",
                ].join(" ")}
              >
                <div
                  className={[
                    classes.poolShareCoin,
                    classes[`poolShareCoin--${appTheme}`],
                    "g-flex__item",
                    "g-flex",
                    "g-flex--align-center",
                    "g-flex--space-between",
                  ].join(" ")}
                >
                  <Borders
                    offsetLeft={-1}
                    offsetRight={-1}
                    offsetTop={-1}
                    offsetBottom={-1}
                  />

                  <div>{pairDetails?.token0symbol}</div>

                  <div
                    className={[
                      classes.poolShareCoinBalance,
                      classes[`poolShareCoinBalance--${appTheme}`],
                    ].join(" ")}
                  >
                    {isNaN(Number(pairDetails.token0Bal).toFixed(2))
                      ? 0
                      : Number(pairDetails.token0Bal).toFixed(2)}
                  </div>
                </div>

                <div
                  className={[
                    classes.poolShareCoin,
                    classes[`poolShareCoin--${appTheme}`],
                    "g-flex__item",
                    "g-flex",
                    "g-flex--align-center",
                    "g-flex--space-between",
                  ].join(" ")}
                >
                  <Borders
                    offsetLeft={-1}
                    offsetRight={-1}
                    offsetTop={-1}
                    offsetBottom={-1}
                  />

                  <div>{pairDetails?.token1symbol}</div>

                  <div
                    className={[
                      classes.poolShareCoinBalance,
                      classes[`poolShareCoinBalance--${appTheme}`],
                    ].join(" ")}
                  >
                    {isNaN(Number(pairDetails.token1Bal).toFixed(2))
                      ? 0
                      : Number(pairDetails.token1Bal).toFixed(2)}
                  </div>
                </div>
              </div>

              {!(parseFloat(pairDetails.lpBalance) <= 0 ||
                parseFloat(amount) <= 0 ||
                amount == null ||
                amount == "" ||
                isNaN(amount))
                ? (
                dystopiaPair ? (
                  <div>
                    <div
                      className={[
                        classes.toggleArrow,
                        "g-flex",
                        "g-flex--align-center",
                      ].join(" ")}
                      onClick={() => setToggleArrow(!toggleArrow)}
                    >
                      <div
                        className={[
                          classes.toggleArrowBg,
                          classes[`toggleArrowBg--${appTheme}`],
                        ].join(" ")}
                      ></div>

                      <svg
                        className={[
                          classes.toggleArrowBtn,
                          classes[`toggleArrowBtn--${appTheme}`],
                          toggleArrow ? classes.toggleArrowBtnOpen : "",
                        ].join(" ")}
                        width="39"
                        height="39"
                        viewBox="0 0 34 34"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <rect
                          x="0.5"
                          y="0.5"
                          width="33"
                          height="33"
                          rx="16.5"
                          fill={appTheme === "dark" ? "#151718" : "#dbe6ec"}
                          stroke={appTheme === "dark" ? "#5F7285" : "#86B9D6"}
                        />
                        <path
                          d="M16.9998 18.1717L21.9498 13.2217L23.3638 14.6357L16.9998 20.9997L10.6358 14.6357L12.0498 13.2217L16.9998 18.1717Z"
                          fill={appTheme === "dark" ? "#4CADE6" : "#0B5E8E"}
                        />
                      </svg>
                    </div>

                    {toggleArrow ? (
                      <div>
                        <div
                          className={[
                            classes.pairContainer,
                            classes[`pairContainer--${appTheme}`],
                            "g-flex",
                            "g-flex--align-center",
                            "g-flex--space-between",
                          ].join(" ")}
                        >
                          <div
                            className={["g-flex", "g-flex--align-center"].join(
                              " "
                            )}
                          >
                            <div
                              className={[
                                classes.pairIconContainer,
                                classes[`pairIconContainer--${appTheme}`],
                              ].join(" ")}
                            >
                              <img
                                className={classes.pairIcon}
                                alt=""
                                src={
                                  fromAssetValue
                                    ? `${fromAssetValue.logoURI}`
                                    : ""
                                }
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                }}
                              />
                            </div>

                            <div
                              className={[
                                classes.pairIconContainer,
                                classes[`pairIconContainer--${appTheme}`],
                              ].join(" ")}
                            >
                              <img
                                className={classes.pairIcon}
                                alt=""
                                src={
                                  toAssetValue ? `${toAssetValue.logoURI}` : ""
                                }
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                }}
                              />
                            </div>

                            <div style={{ marginLeft: 10 }}>
                              <div
                                className={[
                                  classes.pairSymbolLabel,
                                  classes[`pairSymbolLabel--${appTheme}`],
                                ].join(" ")}
                              >
                                {fromAssetValue?.symbol}/{toAssetValue?.symbol}
                              </div>

                              <div
                                className={[
                                  classes.pairPoolLabel,
                                  classes[`pairPoolLabel--${appTheme}`],
                                ].join(" ")}
                              >
                                Dystopia Pool
                              </div>
                            </div>
                          </div>

                          <div
                            className={[
                              classes.pairBalance,
                              classes[`pairBalance--${appTheme}`],
                            ].join(" ")}
                          >
                            {Number(quote?.res?.liquidity / 10 ** 18).toFixed(
                              5
                            )}
                          </div>
                        </div>

                        <div
                          className={[
                            classes.poolShareCoins,
                            classes[`poolShareCoins--${appTheme}`],
                            "g-flex",
                            "g-flex--align-center",
                          ].join(" ")}
                        >
                          <div
                            className={[
                              classes.poolShareCoin,
                              classes[`poolShareCoin--${appTheme}`],
                              "g-flex__item",
                              "g-flex",
                              "g-flex--align-center",
                              "g-flex--space-between",
                            ].join(" ")}
                          >
                            <Borders
                              offsetLeft={-1}
                              offsetRight={-1}
                              offsetTop={-1}
                              offsetBottom={-1}
                            />

                            <div>{quote?.token0?.symbol}</div>

                            <div
                              className={[
                                classes.poolShareCoinBalance,
                                classes[`poolShareCoinBalance--${appTheme}`],
                              ].join(" ")}
                            >
                              ~
                              {Number(
                                quote?.res?.amountA /
                                10 ** quote?.token0?.decimals
                              ).toFixed(2)}
                            </div>
                          </div>

                          <div
                            className={[
                              classes.poolShareCoin,
                              classes[`poolShareCoin--${appTheme}`],
                              "g-flex__item",
                              "g-flex",
                              "g-flex--align-center",
                              "g-flex--space-between",
                            ].join(" ")}
                          >
                            <Borders
                              offsetLeft={-1}
                              offsetRight={-1}
                              offsetTop={-1}
                              offsetBottom={-1}
                            />

                            <div>{quote?.token1?.symbol}</div>

                            <div
                              className={[
                                classes.poolShareCoinBalance,
                                classes[`poolShareCoinBalance--${appTheme}`],
                              ].join(" ")}
                            >
                              ~
                              {Number(
                                quote?.res?.amountB /
                                10 ** quote?.token1?.decimals
                              ).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className={classes.toggles}>
                          <div
                            className={[
                              classes.toggleOption,
                              classes[`toggleOption--${appTheme}`],
                              `${isStable && classes.active}`,
                            ].join(" ")}
                            onClick={() => {
                              handleRadioChange(true);
                            }}
                          >
                            {!isStable && (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
                                  fill={
                                    appTheme === "dark" ? "#151718" : "#DBE6EC"
                                  }
                                  stroke={
                                    appTheme === "dark" ? "#4CADE6" : "#0B5E8E"
                                  }
                                />
                              </svg>
                            )}

                            {isStable && (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
                                  fill={
                                    appTheme === "dark" ? "#151718" : "#DBE6EC"
                                  }
                                  stroke={
                                    appTheme === "dark" ? "#4CADE6" : "#0B5E8E"
                                  }
                                />
                                <path
                                  d="M5 10C5 7.23858 7.23858 5 10 5C12.7614 5 15 7.23858 15 10C15 12.7614 12.7614 15 10 15C7.23858 15 5 12.7614 5 10Z"
                                  fill={
                                    appTheme === "dark" ? "#4CADE6" : "#0B5E8E"
                                  }
                                />
                              </svg>
                            )}

                            <Typography
                              className={[
                                classes.toggleOptionText,
                                classes[`toggleOptionText--${appTheme}`],
                              ].join(" ")}
                            >
                              Stable
                            </Typography>
                          </div>

                          <div
                            className={[
                              classes.toggleOption,
                              classes[`toggleOption--${appTheme}`],
                              `${!isStable && classes.active}`,
                            ].join(" ")}
                            onClick={() => {
                              handleRadioChange(false);
                            }}
                          >
                            {isStable && (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
                                  fill={
                                    appTheme === "dark" ? "#151718" : "#DBE6EC"
                                  }
                                  stroke={
                                    appTheme === "dark" ? "#4CADE6" : "#0B5E8E"
                                  }
                                />
                              </svg>
                            )}

                            {!isStable && (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M0.5 10C0.5 4.7533 4.7533 0.5 10 0.5C15.2467 0.5 19.5 4.7533 19.5 10C19.5 15.2467 15.2467 19.5 10 19.5C4.7533 19.5 0.5 15.2467 0.5 10Z"
                                  fill={
                                    appTheme === "dark" ? "#151718" : "#DBE6EC"
                                  }
                                  stroke={
                                    appTheme === "dark" ? "#4CADE6" : "#0B5E8E"
                                  }
                                />
                                <path
                                  d="M5 10C5 7.23858 7.23858 5 10 5C12.7614 5 15 7.23858 15 10C15 12.7614 12.7614 15 10 15C7.23858 15 5 12.7614 5 10Z"
                                  fill={
                                    appTheme === "dark" ? "#4CADE6" : "#0B5E8E"
                                  }
                                />
                              </svg>
                            )}

                            <Typography
                              className={[
                                classes.toggleOptionText,
                                classes[`toggleOptionText--${appTheme}`],
                              ].join(" ")}
                            >
                              Volatile
                            </Typography>
                          </div>
                        </div>

                        <div
                          className={[
                            classes.quoteLoader,
                            classes[`quoteLoader--${appTheme}`],
                          ].join(" ")}
                        >
                          ~
                          {(
                            Number(pairDetails.token0Bal) -
                            Number(
                              quote?.res?.amountA /
                              10 ** quote?.token0?.decimals
                            )
                          ).toFixed(2)}
                          {quote?.token0?.symbol} and ~
                          {(
                            Number(pairDetails.token1Bal) -
                            Number(
                              quote?.res?.amountB /
                              10 ** quote?.token1?.decimals
                            )
                          ).toFixed(2)}
                          {quote?.token1?.symbol} will be refunded to your
                          wallet due to the price difference.
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null
              ) : null}
            </>
          )}
        </div>
      </Form>

      {checkpair ? (
        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={migrateLiquidity}
          disabled={
            parseFloat(pairDetails.lpBalance) <= 0 ||
            parseFloat(amount) <= 0 ||
            amount == null ||
            amount == "" ||
            isNaN(amount)
          }
          className={[
            classes.buttonOverride,
            classes[`buttonOverride--${appTheme}`],
          ].join(" ")}
        >
          <span className={classes.actionButtonText}>{buttonText}</span>
          {loading && (
            <Loader color={appTheme === "dark" ? "#8F5AE8" : "#8F5AE8"} />
          )}
        </Button>
      ) : (
        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={() =>
            checkPair(fromAssetValue.address, toAssetValue.address, isStable)
          }
          disabled={disableButton}
          className={[
            classes.buttonOverride,
            classes[`buttonOverride--${appTheme}`],
          ].join(" ")}
        >
          <span className={classes.actionButtonText}>
            {platform ? "Check Pair" : "Choose Source of Migration"}
          </span>

          {loading && (
            <Loader color={appTheme === "dark" ? "#8F5AE8" : "#8F5AE8"} />
          )}
        </Button>
      )}
    </div>
  );
}
