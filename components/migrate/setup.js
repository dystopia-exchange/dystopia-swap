import React, { useState, useEffect } from "react";
import {
  TextField,
  Typography,
  InputAdornment,
  Button,
  MenuItem,
  IconButton,
  Dialog,
  InputLabel,
  InputBase,
  FormControl,
  CircularProgress,
  Tooltip,
  Stack,
  Radio,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import {
  Search,
  KeyboardArrowDown,
  ArrowForwardIos,
  DeleteOutline,
} from "@mui/icons-material";
import migrate from "../../stores/configurations/migrators";
import FactoryAbi from "../../stores/abis/FactoryAbi.json";
import pairContractAbi from "../../stores/abis/pairOldRouter.json";
import Form from "../../ui/Form";
import {
  formatCurrency,
  formatAddress,
  formatCurrencyWithSymbol,
  formatCurrencySmall,
} from "../../utils";
import migratorAbi from "../../stores/abis/migrator.json";
import classes from "./ssSwap.module.css";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import stores from "../../stores";
import { ACTIONS, ETHERSCAN_URL } from "../../stores/constants";
import BigNumber from "bignumber.js";

const BootstrapInput = styled(InputBase)(({ theme }) => ({
  "& .MuiInputBase-input": {
    borderRadius: 0,
    position: "relative",
    color: "#5688A5",
    backgroundColor: "transparent",
    border: "1px solid #86B9D6",
    fontSize: 16,
    padding: "10px 26px 10px 12px",
    fontFamily: "Roboto Mono",
    fontStyle: "normal",
    fontWeight: "500",
    fontSize: "18px",
    transition: theme.transitions.create(["border-color", "box-shadow"]),
    "&:focus": {
      borderRadius: 0,
      borderColor: "#80bdff",
      boxShadow: "0 0 0 0.2rem rgba(0,123,255,.25)",
    },
  },
}));
export default function Setup() {
  const [fromAssetValue, setFromAssetValue] = useState(null);
  const [toAssetValue, setToAssetValue] = useState(null);
  const { appTheme } = useAppThemeContext();
  const [isStable, toggleStablePool] = useState(false);
  const [pairDetails, setPairDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [fromAssetError, setFromAssetError] = useState(false);
  const [platform, setPlatform] = React.useState(migrate[1].value);
  const [fromAssetOptions, setFromAssetOptions] = useState([]);
  const [toAssetOptions, setToAssetOptions] = useState([]);
  const [selectedValue, setSelectedValue] = React.useState("a");

  const handleRadioChange = (event) => {
    setSelectedValue(event.target.value);
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
    console.log(token0, token1, "tokensAddress");
    try {
      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
      } else {
        const account = stores.accountStore.getStore("account");
        if (!account) {
          console.warn("account not found");
        } else {
          const factoryContract = new web3.eth.Contract(FactoryAbi, platform);
          const pairAddress = await factoryContract.methods
            .getPair(token0, token1)
            .call();
          console.log("ftech noww", pairAddress);
          if (pairAddress !== "0x0000000000000000000000000000000000000000") {
            const pairContract = new web3.eth.Contract(
              pairContractAbi,
              pairAddress
            );
            console.log(pairContract, "pairContract");
            let lpBalance = await pairContract.methods
              .balanceOf(account.address)
              .call();
            const getTotalSupply = await pairContract.methods
              .totalSupply()
              .call();
            lpBalance = web3.utils.fromWei(lpBalance.toString(), "ether");
            const migrator = migrate.find(
              (eachMigrate) => eachMigrate.value === platform
            );
            const allowence = await pairContract.methods
              .allowance(
                account.address,
                migrator.migratorAddress[process.env.NEXT_PUBLIC_CHAINID]
              )
              .call();
            console.log({ getTotalSupply });
            const totalSupply = web3.utils.fromWei(
              getTotalSupply.toString(),
              "ether"
            );
            const getReserves = await pairContract.methods.getReserves().call();
            const symbol = await pairContract.methods.symbol().call();
            console.log({ getReserves });
            const weiReserve1 = web3.utils.fromWei(
              getReserves._reserve0.toString(),
              "ether"
            );
            const weiReserve2 = web3.utils.fromWei(
              getReserves._reserve1.toString(),
              "ether"
            );
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
            const pairDetails = {
              isValid: true,
              symbol:symbol,
              lpBalance: parseFloat(lpBalance).toFixed(5),
              totalSupply,
              token0Bal: parseFloat(token0Bal).toFixed(5),
              token1Bal: parseFloat(token1Bal).toFixed(5),
              allowence,
              pairAddress,
              poolTokenPercentage: Math.floor(poolTokenPercentage),
            };
            setAmount(parseFloat(lpBalance).toFixed(5));
            setPairDetails(pairDetails);
            console.log(pairDetails, "hehe4");
          } else {
            const pairDetails = {
              isValid: false,
              lpBalance: 0,
              allowence: 0,
            };
            setPairDetails(pairDetails);
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
      getPairDetails(value.address, toAssetValue.address);
    } else {
      if (value.address === fromAssetValue.address) {
        setFromAssetError(toAssetValue);
        setToAssetValue(fromAssetValue);
      } else {
        setToAssetValue(value);
      }
      getPairDetails(fromAssetValue.address, value.address);
    }
  };

  useEffect(
    function () {
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
        console.log(baseAsset[0]?.address, baseAsset[1]?.address, "hehe2");
        //await getPairDetails(baseAsset[0].address,baseAsset[1].address)
        // forceUpdate()
      };

      stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
      ssUpdated();
    },
    [fromAssetValue, toAssetValue, pairDetails]
  );

  const handleChange = (event) => {
    setPlatform(event.target.value);
    getPairDetails(fromAssetValue.address, toAssetValue.address);
  };

  const migrateLiquidity = async () => {
    try {
      setLoading(true);
      const migrator = migrate.find(
        (eachMigrate) => eachMigrate.value === platform
      );
      stores.dispatcher.dispatch({
        type: ACTIONS.MIGRATE,
        content: {
          migrator: migrator,
          token0: fromAssetValue,
          token1: toAssetValue,
          amount: amount,
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

  const handleAmountChange = (event) => {
    if (parseFloat(event.target.value) >= parseFloat(pairDetails.lpBalance)) {
      setAmount(pairDetails.lpBalance);
    } else {
      setAmount(event.target.value);
    }
  };

  let buttonText = "Approve";

  if (loading && pairDetails && parseFloat(pairDetails.allowence) === 0) {
    buttonText = "Approving...";
  } else if (loading && pairDetails && parseFloat(pairDetails.allowence) > 0) {
    buttonText = "Migrating...";
  } else if (pairDetails && parseFloat(pairDetails.allowence) > 0) {
    buttonText = "Migrate Liquidity";
  }
  let disableButton = false;
  if (
    loading &&
    pairDetails &&
    !pairDetails.isValid &&
    parseFloat(pairDetails.lpBalance) <= 0
  ) {
    disableButton = true;
  }
  const migrator = migrate.find(
    (eachMigrate) => eachMigrate.value === platform
  );
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
  return (
    <div>
      <Form>
        <div
          className={[classes[`form`], classes[`form--${appTheme}`]].join(" ")}
        >
          <div className={classes.infoContainer}>
            <div style={{ marginBottom: "20px" }}>
              <p
                className={classes.titleText}
                style={{ color: appTheme === "light" ? "#0A2C40" : "white" }}
              >
                Source of Migration:
              </p>
              <FormControl
                variant="standard"
                sx={{ minWidth: 120, width: "300px" }}
              >
                {/* <InputLabel id="demo-simple-select-standard-label">Select Exchange Platform</InputLabel> */}
                <Select
                  labelId="demo-simple-select-standard-label"
                  id="demo-simple-select-standard"
                  value={platform}
                  onChange={handleChange}
                  label="Exchange Platform"
                  // IconComponent={(_props) => (
                  //   <div className={[classes[`selecticonIcon`], classes[`selecticonIcon--${appTheme}`]].join(' ')}><KeyboardArrowDown /></div>
                  // )}
                  IconComponent={OpenDown}
                  input={<BootstrapInput />}
                >
                  {migrate.map((eachPlatform) => (
                    <MenuItem value={eachPlatform.value}>
                      {eachPlatform.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <div className={classes.swapInputs}>
              <div
                className={[
                  classes.textField,
                  classes[`textField--From-${appTheme}`],
                ].join(" ")}
              >
                <Typography className={classes.inputTitleText} noWrap>
                  Token 0
                </Typography>

                <Typography className={classes.inputBalanceText} noWrap>
                  Balance:
                  <span>
                    {fromAssetValue && fromAssetValue.balance
                      ? " " + formatCurrency(fromAssetValue.balance)
                      : ""}
                  </span>
                </Typography>
                <div className={`${classes.massiveInputContainer}`}>
                  <div className={classes.massiveInputAssetSelect}>
                    <AssetSelect
                      type="From"
                      value={fromAssetValue}
                      assetOptions={fromAssetOptions}
                      onSelect={onAssetSelect}
                    />
                  </div>
                  <Typography
                    className={[
                      classes.smallerText,
                      classes[`smallerText--${appTheme}`],
                    ].join(" ")}
                  >
                    {fromAssetValue?.symbol}
                  </Typography>
                </div>
              </div>
              <div
                className={[
                  classes.textField,
                  classes[`textField--To-${appTheme}`],
                ].join(" ")}
                style={{ marginTop: "50px" }}
              >
                <Typography className={classes.inputTitleText} noWrap>
                  Token 1
                </Typography>

                <Typography className={classes.inputBalanceText} noWrap>
                  Balance:
                  <span>
                    {toAssetValue && toAssetValue.balance
                      ? " " + formatCurrency(toAssetValue.balance)
                      : ""}
                  </span>
                </Typography>
                <div className={`${classes.massiveInputContainer}`}>
                  <div className={classes.massiveInputAssetSelect}>
                    <AssetSelect
                      type="To"
                      value={toAssetValue}
                      assetOptions={toAssetOptions}
                      onSelect={onAssetSelect}
                    />
                  </div>
                  <Typography
                    className={[
                      classes.smallerText,
                      classes[`smallerText--${appTheme}`],
                    ].join(" ")}
                  >
                    {toAssetValue?.symbol}
                  </Typography>
                </div>
              </div>
            </div>
            {pairDetails && !pairDetails.isValid && (
              <span className={classes.inputBalanceErrorText}>
                Pair is Invaild
              </span>
            )}
            {pairDetails && pairDetails.isValid && (
              <div>
                <div
                  className={[
                    classes.textField,
                    classes[`textField--To-${appTheme}`],
                  ].join(" ")}
                  style={{ marginTop: "50px" }}
                >
                  <Typography className={classes.inputTitleText} noWrap>
                    Liq. Pair
                  </Typography>

                  <Typography className={classes.inputBalanceText} noWrap>
                    Balance:
                    <span>
                      {pairDetails && pairDetails.lpBalance
                        ? pairDetails.lpBalance
                        : "0"}
                    </span>
                  </Typography>
                  <div className={`${classes.massiveInputContainer}`}>
                    <div className={classes.massiveInputAssetSelect}>
                      <div
                        className={classes.displaySelectContainer}
                        style={{ padding: "61px 0px 19px" }}
                      >
                        <div
                          className={classes.assetSelectMenuItem}
                          style={{ display: "flex" }}
                        >
                          <div
                            className={[classes.displayDualIconContainer].join(
                              " "
                            )}
                            style={{
                              width: "60px",
                              height: "60px",
                              borderRadius: "50%",
                              border:
                                appTheme === "light"
                                  ? "1px solid rgb(50 73 87)"
                                  : "1px solid rgb(50 73 87)",
                              background: "#B8DFF5",
                              padding: "10px",
                            }}
                          >
                            <img
                              className={classes.displayAssetIcon}
                              alt=""
                              src={
                                fromAssetValue
                                  ? `${fromAssetValue.logoURI}`
                                  : ""
                              }
                              height="40px"
                              style={{ width: "40px", height: "40px" }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/tokens/unknown-logo.png";
                              }}
                            />
                          </div>
                          <div
                            className={[classes.displayDualIconContainer].join(
                              " "
                            )}
                            style={{
                              width: "60px",
                              height: "60px",
                              borderRadius: "50%",
                              border:
                                appTheme === "light"
                                  ? "1px solid rgb(50 73 87)"
                                  : "1px solid rgb(50 73 87)",
                              position: "absolute",
                              left: "50px",
                              background: "#B8DFF5",
                              padding: "10px",
                            }}
                          >
                            <img
                              className={classes.displayAssetIcon}
                              alt=""
                              src={
                                toAssetValue ? `${toAssetValue.logoURI}` : ""
                              }
                              height="40px"
                              style={{ width: "40px", height: "40px" }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/tokens/unknown-logo.png";
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <InputBase
                      className={classes.massiveInputAmount}
                      placeholder="0.00"
                      inputProps={{
                        className: [
                          classes.largeInput,
                          classes[`largeInput--${appTheme}`],
                        ].join(" "),
                      }}
                      InputProps={{
                        disableUnderline: true,
                      }}
                      type="number"
                      max
                      fullWidth
                      value={amount}
                      onChange={(event) => handleAmountChange(event)}
                    />
                    <Typography
                      className={[
                        classes.smallerText,
                        classes[`smallerText--${appTheme}`],
                      ].join(" ")}
                      style={{ top: "118px", left: "151px" }}
                    >
                      {fromAssetValue?.symbol}/{toAssetValue?.symbol}
                    </Typography>
                  </div>
                </div>
                <div
                  className={[
                    classes.pairContainer,
                    classes[`pairContainer--${appTheme}`],
                  ].join(" ")}
                  style={{ marginTop: "20px" }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                      className={classes.assetSelectMenuItem}
                      style={{ display: "flex" }}
                    >
                      <div
                        className={[classes.displayDualIconContainer].join(" ")}
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "50%",
                          border:
                            appTheme === "light"
                              ? "1px solid rgb(50 73 87)"
                              : "1px solid rgb(50 73 87)",
                          background: "#B8DFF5",
                          padding: "10px",
                        }}
                      >
                        <img
                          className={classes.displayAssetIcon}
                          alt=""
                          src={
                            fromAssetValue ? `${fromAssetValue.logoURI}` : ""
                          }
                          style={{ width: "30px", height: "30px" }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/tokens/unknown-logo.png";
                          }}
                        />
                      </div>
                      <div
                        className={[classes.displayDualIconContainer].join(" ")}
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "50%",
                          border:
                            appTheme === "light"
                              ? "1px solid rgb(50 73 87)"
                              : "1px solid rgb(50 73 87)",
                          position: "absolute",
                          left: "80px",
                          background: "#B8DFF5",
                          padding: "10px",
                        }}
                      >
                        <img
                          className={classes.displayAssetIcon}
                          alt=""
                          src={toAssetValue ? `${toAssetValue.logoURI}` : ""}
                          style={{ width: "30px", height: "30px" }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/tokens/unknown-logo.png";
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ marginLeft: "50px" }}>
                      <div>
                        {fromAssetValue?.symbol}/{toAssetValue?.symbol}
                      </div>
                      <span
                        style={{
                          color: appTheme === "light" ? "#86B9D6" : "#5F7285",
                          fontSize: "16px",
                        }}
                      >
                        {migrator.label} Pool
                      </span>
                    </div>
                  </div>
                  <span style={{ color: "#304C5E", fontWeight: "800" }}>
                    {pairDetails.lpBalance}
                  </span>
                </div>
                <div
                  className={[
                    classes.pairDetails,
                    classes[`pairDetails--${appTheme}`],
                  ].join(" ")}
                >
                  Your Pool Share:
                  <span style={{ color: "#304C5E", fontWeight: "800" }}>
                    {pairDetails.poolTokenPercentage}%
                  </span>
                </div>
                <div style={{ display: "flex", width: "100%" }}>
                  <div
                    className={[
                      classes.pairDetails,
                      classes[`pairDetails--${appTheme}`],
                    ].join(" ")}
                  >
                    {fromAssetValue?.symbol}:
                    <span style={{ color: "#304C5E", fontWeight: "800" }}>
                      {pairDetails.token0Bal}
                    </span>
                  </div>
                  <div
                    className={[
                      classes.pairDetails,
                      classes[`pairDetails--${appTheme}`],
                    ].join(" ")}
                  >
                    {toAssetValue?.symbol}
                    <span style={{ color: "#304C5E", fontWeight: "800" }}>
                      {pairDetails.token1Bal}
                    </span>
                  </div>
                </div>
                <div className={classes.radioContainer}>
                  <div
                    onClick={() => toggleStablePool(true)}
                    className={classes.radioButton}
                    style={{
                      color: isStable ? "white" : "#0C5E8E",
                      background: isStable
                        ? appTheme === "light"
                          ? "#86B9D6"
                          : "#5F7285"
                        : "transparent",
                    }}
                  >
                    <Radio
                      checked={isStable}
                      onClick={() => toggleStablePool(true)}
                      value="a"
                      name="radio-buttons"
                      inputProps={{ "aria-label": "A" }}
                    />
                    Stable
                  </div>
                  <div
                    onClick={() => toggleStablePool(false)}
                    className={classes.radioButton}
                    style={{
                      color: !isStable ? "white" : "#0C5E8E",
                      background: !isStable
                        ? appTheme === "light"
                          ? "#86B9D6"
                          : "#5F7285"
                        : "transparent",
                    }}
                  >
                    <Radio
                      checked={!isStable}
                      onClick={() => toggleStablePool(false)}
                      value="b"
                      name="radio-buttons"
                      inputProps={{ "aria-label": "B" }}
                    />
                    Volatile
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Form>
      <div
        className={[classes[`buttonOverrideContainer--${appTheme}`]].join(" ")}
      >
        <Button
          variant="contained"
          size="large"
          color="primary"
          onClick={migrateLiquidity}
          disabled={disableButton}
          className={[
            classes.buttonOverride,
            classes[`buttonOverride--${appTheme}`],
          ].join(" ")}
        >
          <span className={classes.actionButtonText}>{buttonText}</span>
          {loading && (
            <CircularProgress size={10} className={classes.loadingCircle} />
          )}
        </Button>
      </div>
    </div>
  );
  function AssetSelect({ type, value, assetOptions, onSelect }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [filteredAssetOptions, setFilteredAssetOptions] = useState([]);

    const [manageLocal, setManageLocal] = useState(false);

    const openSearch = () => {
      setSearch("");
      setOpen(true);
    };

    useEffect(
      async function () {
        let ao = assetOptions.filter((asset) => {
          if (search && search !== "") {
            return (
              asset.address.toLowerCase().includes(search.toLowerCase()) ||
              asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
              asset.name.toLowerCase().includes(search.toLowerCase())
            );
          } else {
            return true;
          }
        });
        setFilteredAssetOptions(ao);

        //no options in our default list and its an address we search for the address
        if (ao.length === 0 && search && search.length === 42) {
          const baseAsset = await stores.stableSwapStore.getBaseAsset(
            event.target.value,
            true,
            true
          );
        }

        return () => {};
      },
      [assetOptions, search]
    );

    const onSearchChanged = async (event) => {
      setSearch(event.target.value);
    };

    const onLocalSelect = (type, asset) => {
      setSearch("");
      setManageLocal(false);
      setOpen(false);
      onSelect(type, asset);
    };

    const onClose = () => {
      setManageLocal(false);
      setSearch("");
      setOpen(false);
    };

    const toggleLocal = () => {
      setManageLocal(!manageLocal);
    };

    const deleteOption = (token) => {
      stores.stableSwapStore.removeBaseAsset(token);
    };

    const viewOption = (token) => {
      window.open(`${ETHERSCAN_URL}token/${token.address}`, "_blank");
    };

    const renderManageOption = (type, asset, idx) => {
      return (
        <MenuItem
          val={asset.address}
          key={asset.address + "_" + idx}
          className={[
            classes.assetSelectMenu,
            classes[`assetSelectMenu--${appTheme}`],
          ].join(" ")}
        >
          <div className={classes.assetSelectMenuItem}>
            <div className={classes.displayDualIconContainerSmall}>
              <img
                className={[
                  classes.assetOptionIcon,
                  classes[`assetOptionIcon--${appTheme}`],
                ].join(" ")}
                alt=""
                src={asset ? `${asset.logoURI}` : ""}
                height="50px"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "public/tokens/unknown-logo.png";
                }}
              />
            </div>
          </div>
          <div className={classes.assetSelectIconName}>
            <Typography variant="h5">{asset ? asset.symbol : ""}</Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {asset ? asset.name : ""}
            </Typography>
          </div>
          <div className={classes.assetSelectActions}>
            <IconButton
              onClick={() => {
                deleteOption(asset);
              }}
            >
              <DeleteOutline />
            </IconButton>
            <IconButton
              onClick={() => {
                viewOption(asset);
              }}
            >
              ↗
            </IconButton>
          </div>
        </MenuItem>
      );
    };

    const renderAssetOption = (type, asset, idx) => {
      return (
        <MenuItem
          val={asset.address}
          key={asset.address + "_" + idx}
          className={classes.assetSelectMenu}
          onClick={() => {
            onLocalSelect(type, asset);
          }}
        >
          <div className={classes.assetSelectMenuItem}>
            <div className={classes.displayDualIconContainerSmall}>
              <img
                className={classes.displayAssetIconSmall}
                alt=""
                src={asset ? `${asset.logoURI}` : ""}
                height="60px"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/tokens/unknown-logo.png";
                }}
              />
            </div>
          </div>
          <div className={classes.assetSelectIconName}>
            <Typography variant="h5">{asset ? asset.symbol : ""}</Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {asset ? asset.name : ""}
            </Typography>
          </div>
          <div className={classes.assetSelectBalance}>
            <Typography variant="h5">
              {asset && asset.balance ? formatCurrency(asset.balance) : "0.00"}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {"Balance"}
            </Typography>
          </div>
        </MenuItem>
      );
    };

    const renderManageLocal = () => {
      return (
        <>
          <div className={classes.searchContainer}>
            <div className={classes.searchInline}>
              <TextField
                autoFocus
                variant="outlined"
                fullWidth
                placeholder="MATIC, DAI, 0x..."
                value={search}
                onChange={onSearchChanged}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            <div className={classes.assetSearchResults}>
              {filteredAssetOptions
                ? filteredAssetOptions
                    .filter((option) => {
                      return option.local === true;
                    })
                    .map((asset, idx) => {
                      return renderManageOption(type, asset, idx);
                    })
                : []}
            </div>
          </div>
          <div className={classes.manageLocalContainer}>
            <Button onClick={toggleLocal}>Back to Assets</Button>
          </div>
        </>
      );
    };

    const renderOptions = () => {
      return (
        <>
          <div className={classes.searchContainer}>
            <div className={classes.searchInline}>
              <TextField
                autoFocus
                variant="outlined"
                fullWidth
                placeholder="MATIC,UST, 0x..."
                value={search}
                onChange={onSearchChanged}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            <div className={classes.assetSearchResults}>
              {filteredAssetOptions
                ? filteredAssetOptions
                    .sort((a, b) => {
                      if (BigNumber(a.balance).lt(b.balance)) return 1;
                      if (BigNumber(a.balance).gt(b.balance)) return -1;
                      if (a.symbol.toLowerCase() < b.symbol.toLowerCase())
                        return -1;
                      if (a.symbol.toLowerCase() > b.symbol.toLowerCase())
                        return 1;
                      return 0;
                    })
                    .map((asset, idx) => {
                      return renderAssetOption(type, asset, idx);
                    })
                : []}
            </div>
          </div>
          <div className={classes.manageLocalContainer}>
            <Button onClick={toggleLocal}>Manage Local Assets</Button>
          </div>
        </>
      );
    };

    return (
      <React.Fragment>
        <div
          className={classes.displaySelectContainer}
          onClick={() => {
            openSearch();
          }}
        >
          <div className={classes.assetSelectMenuItem}>
            <div
              className={[
                classes.displayDualIconContainer,
                classes[`displayDualIconContainer--${appTheme}`],
              ].join(" ")}
            >
              <img
                className={classes.displayAssetIcon}
                alt=""
                src={value ? `${value.logoURI}` : ""}
                height="100px"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/tokens/unknown-logo.png";
                }}
              />
              {/* <Typography variant='subtitle1' color='primary'>{value ? value.name : type === 'from' ? 'Select Token 0' : 'Select Token 1'}</Typography> */}
            </div>
          </div>
        </div>
        <Dialog
          onClose={onClose}
          aria-labelledby="simple-dialog-title"
          open={open}
        >
          {!manageLocal && renderOptions()}
          {manageLocal && renderManageLocal()}
        </Dialog>
      </React.Fragment>
    );
  }
}
