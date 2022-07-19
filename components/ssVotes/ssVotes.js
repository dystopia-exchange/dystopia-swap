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
          <div className={classes.title}>
              Vote
          </div>
          <div className={[classes.yourVotes, "g-flex", "g-flex--align-center"].join(" ")}>
              <Typography
                  style={{
                      fontWeight: 400,
                      fontSize: windowWidth < 660 ? 14 : 16,
                      color: '#E4E9F4',
                      whiteSpace: "nowrap",
                  }}
              >
                  You Votes:
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
                  {formatCurrency(totalVotes)} %
              </Typography>
          </div>
        <div
          style={{
            // position: "relative",
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
            <Button
              className={[
                classes.buttonOverrideFixedCast,
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
                {voteLoading ? `Casting Votes` : `Cast Votes`}
              {voteLoading && (
                <CircularProgress size={10} className={classes.loadingCircle} />
              )}
            </Button>
            <Button
              className={[
                classes.buttonOverrideFixedReset,
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
                  fontWeight: 600,
                  fontSize: windowWidth < 660 ? 14 : 18,
                  color: '#779BF4',
                  whiteSpace: "nowrap",
                }}
              >
                {voteLoading ? (windowWidth >= 806 ? `Reseting Votes` : 'Reseting') : (windowWidth >= 806 ? `Reset Votes` : 'Reset')}
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
          {1/*(windowWidth > 1200 || showSearch)*/ && (
            <TextField
              className={classes.searchInputRoot}
              variant="outlined"
              fullWidth
              placeholder="Type or paste the address"
              value={search}
              onChange={onSearchChanged}
              InputProps={{
                style: {
                  background: '#171D2D',
                  border: "1px solid",
                  borderColor: '#779BF4',
                  borderRadius: 12,
                },
                classes: {
                  root: classes.searchInput,
                },
                endAdornment: (
                  <InputAdornment position="start" style={{marginRight: 8,}}>
                      <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10.5 20C15.7467 20 20 15.7467 20 10.5C20 5.25329 15.7467 1 10.5 1C5.25329 1 1 5.25329 1 10.5C1 15.7467 5.25329 20 10.5 20Z" stroke="#779BF4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <div style={{position: 'relative'}}>
                          <svg style={{position: 'absolute', top: 8, right: 0,}} width="4" height="4" viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 3L1 1" stroke="#779BF4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                      </div>
                  </InputAdornment>
                ),
              }}
              inputProps={{
                style: {
                  padding: 16,
                  borderRadius: 0,
                  border: "none",
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: "120%",
                  color: '#d4ddff',
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
              placeholder: "Click to select veCONE",
            })}
          </div>

          {/*{windowWidth <= 1360 && (
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
          )}*/}
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
