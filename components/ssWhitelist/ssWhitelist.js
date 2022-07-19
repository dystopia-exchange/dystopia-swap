import React, { useState, useEffect, useCallback } from "react";
import {
  Paper,
  TextField,
  InputAdornment,
  CircularProgress,
  Typography,
  Tooltip,
  Button,
  Popover,
} from "@mui/material";
import BigNumber from "bignumber.js";
import TokenSelect from "../select-token/select-token";
import classes from "./ssWhitelist.module.css";
import stores from "../../stores";
import { ACTIONS, ETHERSCAN_URL } from "../../stores/constants";
import { formatAddress, formatCurrency } from "../../utils";
import { formatSymbol } from "../../utils";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import Hint from "../hint/hint";

export default function ssWhitelist() {
  const [web3, setWeb3] = useState(null);
  const [loading, setLoading] = useState(false);
  const [whitelistLoading, setWhitelistLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [token, setToken] = useState(null);
  const [nfts, setNFTS] = useState([]);
  const [nft, setNFT] = useState(null);
  const [veToken, setVeToken] = useState(null);
  const { appTheme } = useAppThemeContext();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [feeHintAnchor, setFeeHintAnchor] = React.useState(null);
  const [actionHintAnchor, setActionHintAnchor] = React.useState(null);

  const handleClickFeePopover = (event) => {
    setFeeHintAnchor(event.currentTarget);
  };

  const handleCloseFeePopover = () => {
    setFeeHintAnchor(null);
  };

  const handleClickActionPopover = (event) => {
    setActionHintAnchor(event.currentTarget);
  };

  const handleCloseActionPopover = () => {
    setActionHintAnchor(null);
  };

  const openFeeHint = Boolean(feeHintAnchor);
  const openActionHint = Boolean(actionHintAnchor);

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
    if (web3?.utils.isAddress(event.target.value)) {
      setLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.SEARCH_WHITELIST,
        content: { search: event.target.value },
      });
    } else {
      setToken(null);
    }
  };

  useEffect(() => {
    window.setTimeout(() => {
      stores.dispatcher.dispatch({type: ACTIONS.GET_VEST_NFTS, content: {}});
    }, 1);

    const searchReturned = async (res) => {
      setToken(res);
      setLoading(false);
    };

    const whitelistReturned = async (res) => {
      setWhitelistLoading(false);
    };

    const ssUpdated = () => {
      setVeToken(stores.stableSwapStore.getStore("veToken"));

      const nfts = stores.stableSwapStore.getStore("vestNFTs");
      setNFTS(nfts);

      if (nfts?.length > 0) {
        setNFT(nfts[0]);
      }
    };

    const accountChanged = async () => {
      const w3 = await stores.accountStore.getWeb3Provider();
      setWeb3(w3);
    };

    const errorReturned = () => {
      setWhitelistLoading(false);
    };

    stores.emitter.on(ACTIONS.ERROR, errorReturned);
    stores.emitter.on(ACTIONS.UPDATED, ssUpdated);
    stores.emitter.on(ACTIONS.ACCOUNT_CHANGED, accountChanged);
    stores.emitter.on(ACTIONS.ACCOUNT_CONFIGURED, accountChanged);
    stores.emitter.on(ACTIONS.SEARCH_WHITELIST_RETURNED, searchReturned);
    stores.emitter.on(ACTIONS.WHITELIST_TOKEN_RETURNED, whitelistReturned);

    accountChanged();

    return () => {
      stores.emitter.removeListener(ACTIONS.ERROR, errorReturned);
      stores.emitter.removeListener(ACTIONS.UPDATED, ssUpdated);
      stores.emitter.removeListener(ACTIONS.ACCOUNT_CHANGED, accountChanged);
      stores.emitter.removeListener(ACTIONS.ACCOUNT_CONFIGURED, accountChanged);
      stores.emitter.removeListener(
        ACTIONS.SEARCH_WHITELIST_RETURNED,
        searchReturned
      );
      stores.emitter.removeListener(
        ACTIONS.WHITELIST_TOKEN_RETURNED,
        whitelistReturned
      );
    };
  }, []);

  const onAddressClick = (address) => {
    window.open(`${ETHERSCAN_URL}token/${address}`, "_blank");
  };

  const onWhitelist = () => {
    setWhitelistLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.WHITELIST_TOKEN,
      content: { token, nft },
    });
  };

  const handleChange = (event) => {
    setNFT(event.target.value);
  };

  window.addEventListener("resize", () => {
    setWindowWidth(window.innerWidth);
  });

  const renderToken = () => {
    return (
      <>
        {windowWidth > 820 && (
          <div
            className={[classes.results, classes[`results--${appTheme}`]].join(
              " "
            )}
          >
            <div
              className={[
                classes.tokenHeader,
                classes[`tokenHeader--${appTheme}`],
                "g-flex",
                "g-flex--align-center",
              ].join(" ")}
            >
              <div
                className={[
                  classes.tokenHeaderLabel,
                  classes.tokenCellName,
                  "g-flex__item",
                ].join(" ")}
              >
                Asset to Whitelist
              </div>

              <div
                className={[classes.tokenHeaderLabel, classes.cellStatus].join(
                  " "
                )}
              >
                Whitelist Status
              </div>

              <div
                className={[
                  classes.tokenHeaderLabel,
                  classes.cellFee,
                  "g-flex",
                  "g-flex--align-center",
                  "g-flex--justify-end",
                ].join(" ")}
              >
                <Hint
                  hintText={
                    "Listing fee either needs to be locked in your veDYST NFT or be paid and burnt on the list."
                  }
                  open={openFeeHint}
                  anchor={feeHintAnchor}
                  handleClick={handleClickFeePopover}
                  handleClose={handleCloseFeePopover}
                ></Hint>

                <div
                  style={{
                    marginLeft: 10,
                  }}
                >
                  Listing Fee
                </div>
              </div>

              <div
                className={[classes.tokenHeaderLabel, classes.cellAction].join(
                  " "
                )}
              >
                Action
              </div>
            </div>

            <div
              className={[
                classes.tokenBody,
                classes[`tokenBody--${appTheme}`],
                "g-flex",
                "g-flex--align-center",
              ].join(" ")}
            >
              <div
                className={[
                  classes.tokenBodyCell,
                  classes.tokenCellName,
                  "g-flex",
                  "g-flex--align-center",
                  "g-flex__item",
                ].join(" ")}
              >
                <img
                  src={token.logoURI || ""}
                  alt=""
                  width="70"
                  height="70"
                  className={classes.tokenLogo}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                  }}
                />

                <div>
                  <Typography
                    className={[
                      classes.tokenName,
                      classes[`tokenName--${appTheme}`],
                    ].join(" ")}
                  >
                    {token.name}
                  </Typography>

                  <Tooltip title="View in explorer">
                    <Typography
                      className={[
                        classes.tokenAddress,
                        classes[`tokenAddress--${appTheme}`],
                      ].join(" ")}
                      onClick={() => {
                        onAddressClick(token.address);
                      }}
                    >
                      {formatAddress(token.address)}
                    </Typography>
                  </Tooltip>
                </div>
              </div>

              <div
                className={[
                  classes.tokenBodyCell,
                  classes.cellStatus,
                  "g-flex",
                  "g-flex--align-center",
                  "g-flex--justify-end",
                ].join(" ")}
              >
                {token.isWhitelisted && (
                  <Typography
                    className={[
                      classes.isWhitelist,
                      classes[`isWhitelist--${appTheme}`],
                    ].join(" ")}
                  >
                    Already Whitelisted
                  </Typography>
                )}

                {!token.isWhitelisted && (
                  <Typography
                    className={[
                      classes.notWhitelist,
                      classes[`notWhitelist--${appTheme}`],
                    ].join(" ")}
                  >
                    Not Whitelisted
                  </Typography>
                )}
              </div>

              <div
                className={[
                  classes.tokenBodyCell,
                  classes.cellFee,
                  "g-flex",
                  "g-flex--align-center",
                  "g-flex--justify-end",
                ].join(" ")}
              >
                <Typography
                  className={[
                    classes.listingFee,
                    classes[`listingFee--${appTheme}`],
                  ].join(" ")}
                >
                  {formatCurrency(token.listingFee)}
                </Typography>

                <Typography
                  className={[
                    classes.listingFeeSymbol,
                    classes[`listingFeeSymbol--${appTheme}`],
                  ].join(" ")}
                >
                  {formatSymbol(veToken?.symbol)}
                </Typography>
              </div>

              <div
                className={[
                  classes.tokenBodyCell,
                  classes.cellAction,
                  "g-flex",
                  "g-flex--align-center",
                  "g-flex--justify-end",
                ].join(" ")}
              >
                {!token.isWhitelisted &&
                  nft &&
                  BigNumber(nft.lockValue).gt(token.listingFee) && (
                    <div
                      onClick={onWhitelist}
                      className={[
                        classes.buttonOverride,
                        classes[`buttonOverride--${appTheme}`],
                        "g-flex",
                        "g-flex--align-center",
                        "g-flex--justify-center",
                      ].join(" ")}
                    >
                      <Typography className={classes.actionButtonText}>
                        {whitelistLoading ? `Whitelisting` : `Whitelist`}
                      </Typography>
                    </div>
                  )}

                {(!nft ||
                  (token.isWhitelisted &&
                    nft &&
                    BigNumber(nft.lockValue).gt(token.listingFee))) && (
                  <>
                    {!token.isWhitelisted && (
                      <Hint
                        hintText={
                          "Vest Value < Fee means you cannot proceed with the whitelisting as there is not enough funds locked in the chosen veDYST."
                        }
                        open={openActionHint}
                        anchor={actionHintAnchor}
                        handleClick={handleClickActionPopover}
                        handleClose={handleCloseActionPopover}
                      ></Hint>
                    )}

                    <div
                      color="primary"
                      className={[
                        classes.buttonOverrideDisabled,
                        classes[`buttonOverrideDisabled--${appTheme}`],
                      ].join(" ")}
                    >
                      {token.isWhitelisted
                        ? "Nothing to do"
                        : "Vest value < Fee"}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {windowWidth <= 820 && (
          <div
            className={[
              classes.adaptiveContainer,
              classes[`adaptiveContainer--${appTheme}`],
              "g-flex--column",
            ].join(" ")}
          >
            <div
              className={[
                classes.adaptiveHeader,
                classes[`adaptiveHeader--${appTheme}`],
                "g-flex",
              ].join(" ")}
            >
              <div
                className={[
                  "g-flex",
                  "g-flex--align-center",
                  "g-flex__item",
                ].join(" ")}
              >
                <img
                  src={token.logoURI || ""}
                  alt=""
                  width="70"
                  height="70"
                  className={classes.tokenLogo}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                  }}
                />

                <div>
                  <Typography
                    className={[
                      classes.tokenName,
                      classes[`tokenName--${appTheme}`],
                    ].join(" ")}
                  >
                    {token.name}
                  </Typography>

                  <Tooltip title="View in explorer">
                    <Typography
                      className={[
                        classes.tokenAddress,
                        classes[`tokenAddress--${appTheme}`],
                      ].join(" ")}
                      onClick={() => {
                        onAddressClick(token.address);
                      }}
                    >
                      {formatAddress(token.address)}
                    </Typography>
                  </Tooltip>
                </div>
              </div>

              <div
                className={[
                  classes.adaptiveHeaderStatus,
                  "g-flex",
                  "g-flex--align-center",
                  "g-flex--justify-end",
                ].join(" ")}
              >
                {token.isWhitelisted && (
                  <Typography
                    className={[
                      classes.isWhitelist,
                      classes[`isWhitelist--${appTheme}`],
                    ].join(" ")}
                  >
                    Already Whitelisted
                  </Typography>
                )}

                {!token.isWhitelisted && (
                  <Typography
                    className={[
                      classes.notWhitelist,
                      classes[`notWhitelist--${appTheme}`],
                    ].join(" ")}
                  >
                    Not Whitelisted
                  </Typography>
                )}
              </div>
            </div>

            <div className={[classes.adaptiveTable, "g-flex"].join(" ")}>
              <div className={[classes.adaptive, "g-flex-column"].join(" ")}>
                <div
                  className={[
                    classes.adaptiveActionLabel,
                    classes[`adaptiveActionLabel--${appTheme}`],
                    "g-flex",
                    "g-flex--align-center",
                    "g-flex__item",
                  ].join(" ")}
                >
                  Action
                </div>

                <div
                  className={[
                    classes.adaptiveActionItem,
                    classes[`adaptiveActionItem--${appTheme}`],
                    "g-flex",
                    "g-flex--align-center",
                    "g-flex__item",
                  ].join(" ")}
                >
                  {!token.isWhitelisted &&
                    nft &&
                    BigNumber(nft.lockValue).gt(token.listingFee) && (
                      <div
                        onClick={onWhitelist}
                        className={[
                          classes.buttonOverride,
                          classes[`buttonOverride--${appTheme}`],
                          "g-flex",
                          "g-flex--align-center",
                          "g-flex--justify-center",
                        ].join(" ")}
                      >
                        <Typography className={classes.actionButtonText}>
                          {whitelistLoading ? `Whitelisting` : `Whitelist`}
                        </Typography>
                      </div>
                    )}

                  {(!nft ||
                    (token.isWhitelisted &&
                      nft &&
                      BigNumber(nft.lockValue).gt(token.listingFee))) && (
                    <>
                      {!token.isWhitelisted && (
                        <Hint
                          hintText={
                            "Vest Value < Fee means you cannot proceed with the whitelisting as there is not enough funds locked in the chosen veDYST."
                          }
                          open={openActionHint}
                          anchor={actionHintAnchor}
                          handleClick={handleClickActionPopover}
                          handleClose={handleCloseActionPopover}
                        ></Hint>
                      )}

                      <div
                        color="primary"
                        className={[
                          classes.buttonOverrideDisabled,
                          classes[`buttonOverrideDisabled--${appTheme}`],
                        ].join(" ")}
                      >
                        {token.isWhitelisted
                          ? "Nothing to do"
                          : "Vest value < Fee"}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className={[classes.adaptive, "g-flex-column"].join(" ")}>
                <div
                  className={[
                    classes.adaptiveActionLabel,
                    classes[`adaptiveActionLabel--${appTheme}`],
                    "g-flex",
                    "g-flex--align-center",
                    "g-flex--justify-end",
                    "g-flex__item",
                  ].join(" ")}
                >
                  <Hint
                    hintText={
                      "Listing fee either needs to be locked in your veDYST NFT or be paid and burnt on the list."
                    }
                    open={openFeeHint}
                    anchor={feeHintAnchor}
                    handleClick={handleClickFeePopover}
                    handleClose={handleCloseFeePopover}
                  ></Hint>

                  <div style={{ marginLeft: 10 }}>Listing Fee</div>
                </div>

                <div
                  className={[
                    classes.adaptiveActionItem,
                    classes[`adaptiveActionItem--${appTheme}`],
                    "g-flex",
                    "g-flex--align-center",
                    "g-flex--justify-end",
                    "g-flex__item",
                  ].join(" ")}
                >
                  <Typography
                    className={[
                      classes.listingFee,
                      classes[`listingFee--${appTheme}`],
                    ].join(" ")}
                  >
                    {formatCurrency(token.listingFee)}
                  </Typography>

                  <Typography
                    className={[
                      classes.listingFeeSymbol,
                      classes[`listingFeeSymbol--${appTheme}`],
                    ].join(" ")}
                  >
                    {formatSymbol(veToken?.symbol)}
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div
        className={[
          classes.controls,
          "g-flex",
          "g-flex--align-center",
          "g-flex--space-between",
        ].join(" ")}
      >
        <TextField
          autoFocus
          fullWidth
          placeholder={
            windowWidth > 540
              ? "Paste the token address you want to whitelist: 0x..."
              : "Token to whitelist: 0x"
          }
          value={search}
          onChange={onSearchChanged}
          autoComplete={"off"}
          InputProps={{
            style: {
              background: appTheme === "dark" ? "#151718" : "#DBE6EC",
              border: "1px solid",
              borderColor: appTheme === "dark" ? "#5F7285" : "#86B9D6",
              borderRadius: 0,
              maxWidth: 700,
              height: 50,
            },
            classes: {
              root: classes.searchInput,
            },
            startAdornment: (
              <InputAdornment position="start">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.518 9.69309L13.0165 12.1909L12.191 13.0163L9.69321 10.5179C8.76381 11.263 7.60779 11.6682 6.41663 11.6665C3.51863 11.6665 1.16663 9.3145 1.16663 6.4165C1.16663 3.5185 3.51863 1.1665 6.41663 1.1665C9.31463 1.1665 11.6666 3.5185 11.6666 6.4165C11.6683 7.60767 11.2631 8.76368 10.518 9.69309ZM9.34788 9.26025C10.0882 8.49894 10.5016 7.47842 10.5 6.4165C10.5 4.16017 8.67238 2.33317 6.41663 2.33317C4.16029 2.33317 2.33329 4.16017 2.33329 6.4165C2.33329 8.67225 4.16029 10.4998 6.41663 10.4998C7.47854 10.5015 8.49906 10.0881 9.26038 9.34775L9.34788 9.26025Z"
                    fill={appTheme === "dark" ? "#4CADE6" : "#0B5E8E"}
                  />
                </svg>
              </InputAdornment>
            ),
          }}
          inputProps={{
            className: [
              classes.searchInputText,
              classes[`searchInputText--${appTheme}`],
            ].join(" "),
          }}
        />

        <div style={{ maxWidth: 300 }}>
          {TokenSelect({
            value: nft,
            options: nfts,
            symbol: veToken?.symbol,
            handleChange,
            placeholder: "Click to select veDYST",
          })}
        </div>
      </div>

      {(loading || token?.address) && (
        <div className={["g-flex-column"].join(" ")}>
          {loading && (
            <CircularProgress
              style={{
                position: "absolute",
                top: 200,
                left: "50%",
                color: "#ffffff",
              }}
            />
          )}
          {token?.address && renderToken()}
        </div>
      )}
    </>
  );
}
