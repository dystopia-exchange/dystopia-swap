import axios from "axios";
import BigNumber from "bignumber.js";
import {CONTRACTS} from "../constants";
import {USD_PLUS_ADDRESS} from "../constants/contracts";

let usdPlusBoost = null;

export async function enrichAdditionalApr(pairs) {
  try {
    if (pairs) {
      let usdPlusResp = await usdPlusAprQuery();
      await Promise.all(pairs.map(async pair => {
        await usdPlusApr(pair, usdPlusResp)
      }));
    }
  } catch (e) {
    console.error("Error get additional apr", e);
  }
}

async function usdPlusAprQuery() {
  try {
    if (usdPlusBoost === null) {
      // usdPlusBoost = undefined;
      const resp = await axios.get(CONTRACTS.USD_PLUS_BOOSTED_DATA_URL);
      if (resp && resp.data) {
        usdPlusBoost = resp;
      } else {
        usdPlusBoost = null
      }
    }
    return usdPlusBoost;
  } catch (e) {
    console.error("Error get additional apr", e);
    return "";
  }
}

async function usdPlusApr(pair, aprResponse) {
  const reserve0ETH = BigNumber(parseFloat(pair.reserve0)).times(pair.token0.derivedETH)
  const reserve1ETH = BigNumber(parseFloat(pair.reserve1)).times(pair.token1.derivedETH)
  if (pair.token0.address?.toLowerCase() === USD_PLUS_ADDRESS.toLowerCase()) {
    // setTimeout(async () => {
    try {

      if (aprResponse?.data && pair.gauge) {
        pair.gauge.additionalApr0 = BigNumber(aprResponse.data).times(100)
          .times(reserve0ETH).div(reserve0ETH.plus(reserve1ETH)).toString();
      }
    } catch (e) {
      console.log("Error load usd+ additional apr", e);
    }
    // }, usdPlusBoost === null ? 1 : 3000);
  }
  if (pair.token1.address?.toLowerCase() === USD_PLUS_ADDRESS.toLowerCase()) {
    // setTimeout(async () => {
    try {

      if (aprResponse?.data && pair.gauge) {
        pair.gauge.additionalApr1 = BigNumber(aprResponse.data).times(100)
          .times(reserve1ETH).div(reserve0ETH.plus(reserve1ETH)).toString();
      }
    } catch (e) {
      console.log("Error load usd+ additional apr", e);
    }
    // }, usdPlusBoost === null ? 1 : 3000);
  }
}
