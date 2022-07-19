import React, { useState, useEffect, useCallback } from "react";
import {
  Paper,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  InputBase,
  Select,
  ClickAwayListener,
  MenuItem,
} from "@mui/material";
import { ArrowBackIosNew } from "@mui/icons-material";
import classes from "./vest.module.css";
import { useRouter } from "next/router";
import { useAppThemeContext } from "../../../ui/AppThemeProvider";
import Form from "../../../ui/MigratorForm";
import Borders from "../../../ui/Borders";
import stores from "../../../stores";
import { ACTIONS } from "../../../stores/constants";
import { formatCurrency } from "../../../utils/utils";
import moment from "moment";

const merge = () => {
  const router = useRouter();

  const { appTheme } = useAppThemeContext();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [vestNFTs, setVestNFTs] = useState();

  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  useEffect(() => {
    window.addEventListener("resize", () => {
      setWindowWidth(window.innerWidth);
    });

    const vestNFTsReturned = (nfts) => {
      setVestNFTs(nfts);
      forceUpdate();
    };

    window.setTimeout(() => {
      stores.dispatcher.dispatch({ type: ACTIONS.GET_VEST_NFTS, content: {} });
    }, 1);

    stores.emitter.on(ACTIONS.VEST_NFTS_RETURNED, vestNFTsReturned);
    return () => {
      stores.emitter.removeListener(
        ACTIONS.VEST_NFTS_RETURNED,
        vestNFTsReturned
      );
    };
  }, []);

  const onBack = () => {
    router.push("/vest");
  };

  const [openSelectToken1, setOpenSelectToken1] = useState(false);
  const [openSelectToken2, setOpenSelectToken2] = useState(false);
  const [firstSelectedNft, setFirstSelectedNft] = useState();
  const [secondSelectedNft, setSecondSelectedNft] = useState();
  const [lockloader, setLockLoading] = useState(false);

  const openSelect1 = () => {
    setOpenSelectToken1(!openSelectToken1);
  };
  const openSelect2 = () => {
    setOpenSelectToken2(!openSelectToken2);
  };

  const closeSelect1 = () => {
    setOpenSelectToken1(false);
  };
  const closeSelect2 = () => {
    setOpenSelectToken2(false);
  };

  const handleChange1 = (e) => {
    setFirstSelectedNft(e.target.value);
  };

  const handleChange2 = (e) => {
    setSecondSelectedNft(e.target.value);
  };
  const merge = async (firstSelectedNft, secondSelectedNft) => {
    setLockLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.MERGE_NFT,
      content: { tokenIDOne: firstSelectedNft, tokenIDTwo: secondSelectedNft },
    });
    setLockLoading(false);
  };
  const selectArrow1 = () => {
    return (
      <ClickAwayListener onClickAway={closeSelect1}>
        <div
          onClick={openSelect1}
          className={[
            classes.slippageIconContainer,
            openSelectToken1 ? classes["selectTokenIconContainer--active"] : "",
            classes[`slippageIconContainer--${appTheme}`],
          ].join(" ")}
        >
          <Borders
            offsetLeft={-1}
            offsetRight={-1}
            offsetTop={-1}
            offsetBottom={-1}
          />
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className={[
                classes.slippageIcon,
                openSelectToken1 ? classes["slippageIcon--active"] : "",
                classes[`slippageIcon--${appTheme}`],
              ].join(" ")}
              d="M9.99999 10.9766L14.125 6.85156L15.3033 8.0299L9.99999 13.3332L4.69666 8.0299L5.87499 6.85156L9.99999 10.9766Z"
            />
          </svg>
        </div>
      </ClickAwayListener>
    );
  };
  const selectArrow2 = () => {
    return (
      <ClickAwayListener onClickAway={closeSelect2}>
        <div
          onClick={openSelect2}
          className={[
            classes.slippageIconContainer,
            openSelectToken2 ? classes["selectTokenIconContainer--active"] : "",
            classes[`slippageIconContainer--${appTheme}`],
          ].join(" ")}
        >
          <Borders
            offsetLeft={-1}
            offsetRight={-1}
            offsetTop={-1}
            offsetBottom={-1}
          />
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              className={[
                classes.slippageIcon,
                openSelectToken2 ? classes["slippageIcon--active"] : "",
                classes[`slippageIcon--${appTheme}`],
              ].join(" ")}
              d="M9.99999 10.9766L14.125 6.85156L15.3033 8.0299L9.99999 13.3332L4.69666 8.0299L5.87499 6.85156L9.99999 10.9766Z"
            />
          </svg>
        </div>
      </ClickAwayListener>
    );
  };

  const renderNftSelect1 = () => {
    return (
      <>
        <Borders
          offsetLeft={-1}
          offsetRight={-1}
          offsetTop={-1}
          offsetBottom={-1}
        />
        <Select
          className={[
            classes.tokenSelect,
            classes[`tokenSelect--${appTheme}`],
          ].join(" ")}
          fullWidth
          value={firstSelectedNft}
          {...{
            displayEmpty: firstSelectedNft == undefined ? true : undefined,
            renderValue: firstSelectedNft == undefined ? (selected) => {
              if (selected == undefined) {
                return (
                  <div
                    style={{
                      padding: 10,
                      paddingRight: 30,
                      fontWeight: 500,
                      fontSize: 18,
                      color: appTheme === 'dark' ? '#5F7285' : '#0B5E8E',
                    }}>
                    {"First Nft to Merge"}
                  </div>
                );
              }
            } : undefined,
          }}
          
          MenuProps={{
            classes: {
              list: appTheme === "dark" ? classes["list--dark"] : classes.list,
            },
          }}
          open={openSelectToken1}
          onChange={handleChange1}
          IconComponent={selectArrow1}
          inputProps={{
            className:
              appTheme === "dark"
                ? classes["tokenSelectInput--dark"]
                : classes.tokenSelectInput,
          }}
        >
          {vestNFTs &&
            vestNFTs.map((option) => {
              return (
                <MenuItem
                  style={{ border: "1px solid #86B9D6" }}
                  key={option.id}
                  value={option}
                >
                  <div className={classes.newLockNft}>
                    <div className={classes.newNftTitle}>
                      <h4 className={classes.tokenNo}>Token #{option.id}</h4>
                      <p className={classes.expiry}>Vest Expires:</p>
                    </div>
                    <div className={classes.newNftValue}>
                      <p className={classes.expiry}>
                        {Number(option.lockAmount).toFixed(2)} CONE
                      </p>
                      <p className={classes.expiry}>
                        {moment.unix(option.lockEnds).format("YYYY-MM-DD")}
                      </p>
                    </div>
                  </div>
                </MenuItem>
              );
            })}
        </Select>
      </>
    );
  };
  const renderNftSelect2 = () => {
    return (
      <>
        <Borders
          offsetLeft={-1}
          offsetRight={-1}
          offsetTop={-1}
          offsetBottom={-1}
        />
        <Select
          className={[
            classes.tokenSelect,
            classes[`tokenSelect--${appTheme}`],
          ].join(" ")}
          fullWidth
          {...{
            displayEmpty: secondSelectedNft == undefined ? true : undefined,
            renderValue: secondSelectedNft == undefined ? (selected) => {
              if (selected == undefined) {
                return (
                  <div
                    style={{
                      padding: 10,
                      paddingRight: 30,
                      fontWeight: 500,
                      fontSize: 18,
                      color: appTheme === 'dark' ? '#5F7285' : '#0B5E8E',
                    }}>
                    {"Second Nft to Merge"}
                  </div>
                );
              }
            } : undefined,
          }}
          MenuProps={{
            classes: {
              list: appTheme === "dark" ? classes["list--dark"] : classes.list,
            },
          }}
          open={openSelectToken2}
          onChange={handleChange2}
          IconComponent={selectArrow2}
          inputProps={{
            className:
              appTheme === "dark"
                ? classes["tokenSelectInput--dark"]
                : classes.tokenSelectInput,
            disableUnderline: "true",
          }}
        >
          {vestNFTs &&
            vestNFTs.map((option) => {
              return (
                <MenuItem
                  style={{ border: "1px solid #86B9D6" }}
                  key={option.id}
                  value={option}
                >
                  <div className={classes.newLockNft}>
                    <div className={classes.newNftTitle}>
                      <h4 className={classes.tokenNo}>Token #{option.id}</h4>
                      <p className={classes.expiry}>Vest Expires:</p>
                    </div>
                    <div className={classes.newNftValue}>
                      <p className={classes.expiry}>
                        {Number(option.lockAmount).toFixed(2)} CONE
                      </p>
                      <p className={classes.expiry}>
                        {moment.unix(option.lockEnds).format("YYYY-MM-DD")}
                      </p>
                    </div>
                  </div>
                </MenuItem>
              );
            })}
        </Select>
      </>
    );
  };

  return (
    <Paper
      elevation={0}
      className={[
        classes.container3,
        classes[(`container3--${appTheme}`, "g-flex-column")],
      ].join(" ")}
    >
      <div
        className={[
          classes.titleSection,
          classes[`titleSection--${appTheme}`],
        ].join(" ")}
      >
        <Tooltip title="Manage Existing Lock" placement="top">
          <IconButton onClick={onBack}>
            <ArrowBackIosNew
              className={[
                classes.backIcon,
                classes[`backIcon--${appTheme}`],
              ].join(" ")}
            />
          </IconButton>
        </Tooltip>
      </div>
      <Form>
        <h2
          style={{ color: appTheme === "dark" ? "#fff" : "#0A2C40" }}
          className={classes.heading1}
        >
          Choose 2 NFTs to merge:
        </h2>
        <div className={classes.dropdownCtn}>
          <div className={classes.dropdown}>{renderNftSelect1()}</div>
          <div className={classes.dropdown}>{renderNftSelect2()}</div>
        </div>
        <div className={classes.line}>
          <Borders heightZero={true} />
        </div>
        {firstSelectedNft !== undefined && secondSelectedNft !== undefined ? (
          <div>
            <h2
              style={{ color: appTheme === "dark" ? "#fff" : "#0A2C40" }}
              className={classes.heading1}
            >
              New Lock NFT:
            </h2>
            <div className={classes.newLockNftImp}>
              <Borders
                offsetLeft={-1}
                offsetRight={-1}
                offsetTop={-1}
                offsetBottom={-1}
              />
              {firstSelectedNft.lockEnds > secondSelectedNft.lockEnds ? (
                <>
                  <div className={classes.newNftTitle}>
                    <h4 className={classes.tokenNo}>
                      Token #{secondSelectedNft.id}
                    </h4>
                    <p className={classes.expiry}>Vest Expires:</p>
                  </div>
                  <div className={classes.newNftValue}>
                    <p className={classes.expiry}>
                      {(
                        Number(firstSelectedNft.lockAmount) +
                        Number(secondSelectedNft.lockAmount)
                      ).toFixed(2)}
                    </p>
                    <p className={classes.expiry}>
                      {moment
                        .unix(firstSelectedNft.lockEnds)
                        .format("YYYY-MM-DD")}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className={classes.newNftTitle}>
                    <h4 className={classes.tokenNo}>
                      Token #{secondSelectedNft.id}
                    </h4>
                    <p className={classes.expiry}>Vest Expires:</p>
                  </div>
                  <div className={classes.newNftValue}>
                    <p className={classes.expiry}>
                      {(
                        Number(firstSelectedNft.lockAmount) +
                        Number(secondSelectedNft.lockAmount)
                      ).toFixed(2)}
                    </p>
                    <p className={classes.expiry}>
                      {moment
                        .unix(secondSelectedNft.lockEnds)
                        .format("YYYY-MM-DD")}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}
      </Form>

      <div className={classes.actionsContainer}>
        {firstSelectedNft === undefined ||
        secondSelectedNft === undefined ||
        secondSelectedNft.id == firstSelectedNft.id ? (
          <Button
            fullWidth
            variant="contained"
            size="large"
            color="primary"
            className={classes.buttonOverride}
            disabled
          >
            <Typography className={classes.actionButtonText}>
              Select NFTs to merge
            </Typography>
          </Button>
        ) : (
          <Button
            fullWidth
            variant="contained"
            size="large"
            color="primary"
            className={classes.buttonOverride}
            onClick={() => merge(firstSelectedNft, secondSelectedNft)}
          >
            <Typography className={classes.actionButtonText}>
              Merge NFTs
            </Typography>
          </Button>
        )}
      </div>
    </Paper>
  );
};

export default merge;
