import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Button,
  CircularProgress,
  InputAdornment,
  TextField,
  IconButton,
} from "@mui/material";
import BigNumber from "bignumber.js";
import { Add, Search } from "@mui/icons-material";
import { useRouter } from "next/router";
import classes from "./ssVotes.module.css";
import { formatCurrency } from "../../utils";
import GaugesTable from "./ssVotesTable.js";
import stores from "../../stores";
import { ACTIONS } from "../../stores/constants";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import TokenSelect from "../select-token/select-token";

export default function ssVotes() {
  const router = useRouter();

  const [, updateState] = useState();
  const forceUpdate = useCallback(() => updateState({}), []);

  const [gauges, setGauges] = useState([]);
  const [voteLoading, setVoteLoading] = useState(false);
  const [votes, setVotes] = useState([]);
  const [veToken, setVeToken] = useState(null);
  const [token, setToken] = useState(null);
  const [vestNFTs, setVestNFTs] = useState([]);
  const [search, setSearch] = useState("");
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showSearch, setShowSearch] = useState(false);

  const { appTheme } = useAppThemeContext();

  const ssUpdated = async () => {
    setVeToken(stores.stableSwapStore.getStore("veToken"));
    const as = stores.stableSwapStore.getStore("pairs");

    const filteredAssets = as.filter((asset) => {
      return asset.gauge && asset.gauge.address;
    });
    setGauges(filteredAssets);

    const tvldata = await stores.stableSwapStore.getStore("tvls");

    const nfts = stores.stableSwapStore.getStore("vestNFTs");
    setVestNFTs(nfts);

    if (nfts?.length > 0) {
      nfts.sort((a, b) => +a.id - +b.id);

      setToken(nfts[0]);
    }

    if (
      nfts &&
      nfts.length > 0 &&
      filteredAssets &&
      filteredAssets.length > 0
    ) {
      stores.dispatcher.dispatch({
        type: ACTIONS.GET_VEST_VOTES,
        content: { tokenID: nfts[0].id },
      });
      // stores.dispatcher.dispatch({ type: ACTIONS.GET_VEST_BALANCES, content: { tokenID: nfts[0].id } })
    }

    forceUpdate();
  };

  useEffect(() => {
    const vestVotesReturned = (vals) => {
      setVotes(
        vals.map((asset) => {
          return {
            address: asset?.address,
            value: BigNumber(
              asset && asset.votePercent ? asset.votePercent : 0
            ).toNumber(0),
          };
        })
      );
      forceUpdate();
    };

    const vestBalancesReturned = (vals) => {
      setGauges(vals);
      forceUpdate();
    };

    const stableSwapUpdated = () => {
      ssUpdated();
    };

    const voteReturned = () => {
      setVoteLoading(false);
    };

    ssUpdated();

    stores.emitter.on(ACTIONS.UPDATED, stableSwapUpdated);
    stores.emitter.on(ACTIONS.VOTE_RETURNED, voteReturned);
    stores.emitter.on(ACTIONS.ERROR, voteReturned);
    stores.emitter.on(ACTIONS.VEST_VOTES_RETURNED, vestVotesReturned);
    // stores.emitter.on(ACTIONS.VEST_NFTS_RETURNED, vestNFTsReturned)
    stores.emitter.on(ACTIONS.VEST_BALANCES_RETURNED, vestBalancesReturned);

    return () => {
      stores.emitter.removeListener(ACTIONS.UPDATED, stableSwapUpdated);
      stores.emitter.removeListener(ACTIONS.VOTE_RETURNED, voteReturned);
      stores.emitter.removeListener(ACTIONS.ERROR, voteReturned);
      stores.emitter.removeListener(
        ACTIONS.VEST_VOTES_RETURNED,
        vestVotesReturned
      );
      // stores.emitter.removeListener(ACTIONS.VEST_NFTS_RETURNED, vestNFTsReturned)
      stores.emitter.removeListener(
        ACTIONS.VEST_BALANCES_RETURNED,
        vestBalancesReturned
      );
    };
  }, []);

  const onVote = () => {
    setVoteLoading(true);
    stores.dispatcher.dispatch({
      type: ACTIONS.VOTE,
      content: { votes, tokenID: token.id },
    });
  };
  const onResetVotes = () => {
    if (token?.id) {
      setVoteLoading(true);
      stores.dispatcher.dispatch({
        type: ACTIONS.RESET_VOTE,
        content: { tokenID: token.id },
      });
    }
  };

  let totalVotes = votes.reduce((acc, curr) => {
    return BigNumber(acc)
      .plus(BigNumber(curr.value).lt(0) ? curr.value * -1 : curr.value)
      .toNumber();
  }, 0);

  const handleChange = (event) => {
    setToken(event.target.value);
    stores.dispatcher.dispatch({
      type: ACTIONS.GET_VEST_VOTES,
      content: { tokenID: event.target.value.id },
    });
  };

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
  };

  const onBribe = () => {
    router.push("/bribe/create");
  };

  const handleSearch = () => {
    setShowSearch(!showSearch);
  };

  window.addEventListener("resize", () => {
    setWindowWidth(window.innerWidth);
  });

  const noTokenSelected = token === null;

  const disableCastVotes = totalVotes > 100;

  return (
    <>
      <div
        className={[
          classes.topBarContainer,
          "g-flex",
          "g-flex--align-center",
          "g-flex--space-between",
        ].join(" ")}
      >
        <div
          style={{
            position: "relative",
          }}
          className={["g-flex", "g-flex--align-center"].join(" ")}
        >
          <div
            className={[
              classes.infoSection,
              classes[`infoSection--${appTheme}`],
              "g-flex",
              "g-flex--align-center",
              "g-flex--no-wrap",
              "g-flex--space-between",
            ].join(" ")}
          >
            <div className={["g-flex", "g-flex--align-center"].join(" ")}>
              <Typography
                style={{
                  fontWeight: 400,
                  fontSize: windowWidth < 660 ? 14 : 18,
                  color: appTheme === "dark" ? "#ffffff" : "#5688A5",
                  whiteSpace: "nowrap",
                }}
              >
                Votes:
              </Typography>

              <Typography
                className={[
                  `${
                    BigNumber(totalVotes).gt(100)
                      ? classes.errorText
                      : classes.helpText
                  }`,
                  noTokenSelected ? classes.infoSectionPercentDisabled : "",
                ].join(" ")}
              >
                {formatCurrency(totalVotes)}%
              </Typography>
            </div>
            <Button
              className={[
                classes.buttonOverrideFixed,
                classes[`buttonOverrideFixed--${appTheme}`],
                noTokenSelected || disableCastVotes
                  ? classes[`buttonOverrideFixedDisabled--${appTheme}`]
                  : null,
              ].join(" ")}
              variant="contained"
              size="large"
              color="primary"
              disabled={
                disableCastVotes ||
                voteLoading ||
                BigNumber(totalVotes).eq(0) ||
                BigNumber(totalVotes).gt(100)
              }
              onClick={onVote}
            >
              <Typography
                style={{
                  fontWeight: 700,
                  fontSize: windowWidth < 660 ? 14 : 16,
                  // color: appTheme === 'dark' ? '#8F5AE8' : '#8F5AE8',
                  whiteSpace: "nowrap",
                }}
              >
                {voteLoading ? `Casting Votes` : `Cast Votes`}
              </Typography>
              {voteLoading && (
                <CircularProgress size={10} className={classes.loadingCircle} />
              )}
            </Button>
            <Button
              className={[
                classes.buttonOverrideFixed,
                classes[`buttonOverrideFixed--${appTheme}`],
                noTokenSelected || disableCastVotes
                  ? classes[`buttonOverrideFixedDisabled--${appTheme}`]
                  : null,
              ].join(" ")}
              variant="contained"
              size="large"
              color="primary"
              disabled={voteLoading}
              onClick={onResetVotes}
            >
              <Typography
                style={{
                  fontWeight: 700,
                  fontSize: windowWidth < 660 ? 14 : 16,
                  // color: appTheme === 'dark' ? '#8F5AE8' : '#8F5AE8',
                  whiteSpace: "nowrap",
                }}
              >
                {voteLoading ? `Reseting Votes` : `Reset Votes`}
              </Typography>
              {voteLoading && (
                <CircularProgress size={10} className={classes.loadingCircle} />
              )}
            </Button>
          </div>

          <div
            className={[
              classes.addButton,
              classes[`addButton--${appTheme}`],
              "g-flex",
              "g-flex--align-center",
              "g-flex--justify-center",
            ].join(" ")}
            onClick={onBribe}
          >
            <div
              className={[
                classes.addButtonIcon,
                "g-flex",
                "g-flex--align-center",
                "g-flex--justify-center",
              ].join(" ")}
            >
              <Add style={{ width: 20, color: "#fff" }} />
            </div>

            <Typography
              className={[
                classes.actionButtonText,
                classes[`actionButtonText--${appTheme}`],
                "g-flex",
                "g-flex--align-center",
                "g-flex--justify-center",
              ].join(" ")}
            >
              Create Bribe
            </Typography>
          </div>
        </div>

        <div
          className={[classes.controls, "g-flex", "g-flex--align-center"].join(
            " "
          )}
        >
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
                  padding: 12,
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

          <div className={classes.tokenSelect}>
            {TokenSelect({
              value: token,
              options: vestNFTs,
              symbol: veToken?.symbol,
              handleChange,
              placeholder: "Click to select veDYST",
            })}
          </div>

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

      <GaugesTable
        gauges={gauges.filter((pair) => {
          if (!search || search === "") {
            return true;
          }

          const searchLower = search.toLowerCase();

          if (
            pair.symbol.toLowerCase().includes(searchLower) ||
            pair.address.toLowerCase().includes(searchLower) ||
            pair.token0.symbol.toLowerCase().includes(searchLower) ||
            pair.token0.address.toLowerCase().includes(searchLower) ||
            pair.token0.name.toLowerCase().includes(searchLower) ||
            pair.token1.symbol.toLowerCase().includes(searchLower) ||
            pair.token1.address.toLowerCase().includes(searchLower) ||
            pair.token1.name.toLowerCase().includes(searchLower)
          ) {
            return true;
          }

          return false;
        })}
        setParentSliderValues={setVotes}
        defaultVotes={votes}
        veToken={veToken}
        token={token}
        noTokenSelected={noTokenSelected}
        showSearch={showSearch}
      />
    </>
  );
}
