import BigNumber from "bignumber.js";
import {ACTIONS, CONTRACTS, DIRECT_SWAP_ROUTES} from "../constants";
import {formatBN, parseBN, buildRoutes, getPrice, getAmountOut, retryForSwapQuote} from '../../utils';

export const quoteAddLiquidity = async (
  payload,
  web3,
  emitter
) => {
  try {
    const {pair, token0, token1, amount0, amount1} = payload.content;

    if (!pair || !token0 || !token1 || amount0 === "" || amount1 === "") {
      return null;
    }

    const routerContract = new web3.eth.Contract(
      CONTRACTS.ROUTER_ABI,
      CONTRACTS.ROUTER_ADDRESS
    );

    const sendAmount0 = parseBN(amount0, token0.decimals);
    const sendAmount1 = parseBN(amount1, token1.decimals);

    let addy0 = token0.address;
    let addy1 = token1.address;

    if (token0.address === CONTRACTS.FTM_SYMBOL) {
      addy0 = CONTRACTS.WFTM_ADDRESS;
    }
    if (token1.address === CONTRACTS.FTM_SYMBOL) {
      addy1 = CONTRACTS.WFTM_ADDRESS;
    }

    const res = await routerContract.methods
      .quoteAddLiquidity(
        addy0,
        addy1,
        pair.isStable,
        sendAmount0,
        sendAmount1
      )
      .call();

    const returnVal = {
      inputs: {
        token0,
        token1,
        amount0,
        amount1,
      },
      output: formatBN(res.liquidity, pair.decimals),
    };
    emitter.emit(ACTIONS.QUOTE_ADD_LIQUIDITY_RETURNED, returnVal);
  } catch (ex) {
    console.error("Quot add liquidity error", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const quoteRemoveLiquidity = async (
  payload,
  web3,
  emitter
) => {
  try {

    const {pair, token0, token1, withdrawAmount} = payload.content;

    if (!pair || !token0 || !token1 || withdrawAmount === "") {
      return null;
    }

    const routerContract = new web3.eth.Contract(
      CONTRACTS.ROUTER_ABI,
      CONTRACTS.ROUTER_ADDRESS
    );

    const sendWithdrawAmount = parseBN(withdrawAmount, pair.decimals);

    const res = await routerContract.methods
      .quoteRemoveLiquidity(
        token0.address,
        token1.address,
        pair.isStable,
        sendWithdrawAmount
      )
      .call();

    const returnVal = {
      inputs: {
        token0,
        token1,
        withdrawAmount,
      },
      output: {
        amount0: formatBN(res.amountA, token0.decimals),
        amount1: formatBN(res.amountB, token1.decimals),
      },
    };
    emitter.emit(ACTIONS.QUOTE_REMOVE_LIQUIDITY_RETURNED, returnVal);
  } catch (ex) {
    console.error("Quote remove liq error", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const quoteSwap = async (
  payload,
  web3,
  routeAssets,
  emitter,
  baseAssets
) => {
  try {
    const {fromAsset, toAsset, fromAmount} = payload.content;
    if (
      !fromAsset ||
      !toAsset ||
      !fromAmount ||
      !fromAsset.address ||
      !toAsset.address ||
      fromAmount === ""
    ) {
      return null;
    }

    const directSwapRoute =
        (DIRECT_SWAP_ROUTES[fromAsset.address.toLowerCase()] && DIRECT_SWAP_ROUTES[fromAsset.address.toLowerCase()]  === toAsset.address.toLowerCase())
        || (DIRECT_SWAP_ROUTES[toAsset.address.toLowerCase()] && DIRECT_SWAP_ROUTES[toAsset.address.toLowerCase()]  === fromAsset.address.toLowerCase())

    const routerContract = new web3.eth.Contract(
      CONTRACTS.ROUTER_ABI,
      CONTRACTS.ROUTER_ADDRESS
    );

    const sendFromAmount = parseBN(fromAmount, fromAsset.decimals);

    let addy0 = fromAsset.address;
    let addy1 = toAsset.address;

    if (fromAsset.address === CONTRACTS.FTM_SYMBOL) {
      addy0 = CONTRACTS.WFTM_ADDRESS;
    }
    if (toAsset.address === CONTRACTS.FTM_SYMBOL) {
      addy1 = CONTRACTS.WFTM_ADDRESS;
    }

    let amountOuts = buildRoutes(routeAssets, addy0, addy1, directSwapRoute)
    const retryCall = async () => {
      const res = await Promise.allSettled(
        amountOuts.map(async (route) => {
          const fn = retryForSwapQuote({
            fn: routerContract.methods.getAmountsOut(
              sendFromAmount,
              route.routes
            ).call,
          });
          return await fn();
        })
      );

      if (res.filter(el => el.value === undefined).length !== 0) {
        return null;
      }

      return res
        .filter((el, index) => {
          if (
            el.status === "fulfilled" &&
            el.value !== undefined &&
            el.value !== null
          ) {
            return true;
          } else {
            amountOuts[index] = null;
            return false;
          }
        })
        .map((el) => el.value);
    };

    const receiveAmounts = await retryCall();

    if (receiveAmounts === null) {
      return null;
    }

    amountOuts = amountOuts.filter((el) => el !== null);

    for (let i = 0; i < receiveAmounts.length; i++) {
      amountOuts[i].receiveAmounts = receiveAmounts[i];
      amountOuts[i].finalValue = BigNumber(
        receiveAmounts[i][receiveAmounts[i].length - 1]
      )
        .div(10 ** parseInt(toAsset.decimals))
        .toFixed(parseInt(toAsset.decimals));
    }

    const bestAmountOut = amountOuts
      .filter((ret) => {
        return ret != null;
      })
      .reduce((best, current) => {
        if (!best) {
          return current;
        }
        return BigNumber(best.finalValue).gt(current.finalValue)
          ? best
          : current;
      }, 0);

    if (bestAmountOut === 0) {
      emitter.emit(
        ACTIONS.ERROR,
        "No valid route found to complete swap"
      );
      return null;
    }

    const libraryContract = new web3.eth.Contract(
      CONTRACTS.LIBRARY_ABI,
      CONTRACTS.LIBRARY_ADDRESS
    );
    let totalRatio = 1;

    for (let i = 0; i < bestAmountOut.routes.length; i++) {
      let amountIn = bestAmountOut.receiveAmounts[i];

      try {
        const tokenInDecimals = baseAssets
          .filter(a => a?.address?.toLowerCase() === bestAmountOut.routes[i].from?.toLowerCase())[0]
          .decimals

        const reserves = await libraryContract.methods
          .getNormalizedReserves(
            bestAmountOut.routes[i].from,
            bestAmountOut.routes[i].to,
            bestAmountOut.routes[i].stable
          ).call();

        const priceWithoutImpact = getPrice(
          BigNumber(reserves[0]).div(1e18),
          BigNumber(reserves[1]).div(1e18),
          bestAmountOut.routes[i].stable
        ).times(BigNumber(amountIn).div(10 ** parseInt(tokenInDecimals)));

        const priceAfterSwap = getAmountOut(
          BigNumber(amountIn).div(10 ** parseInt(tokenInDecimals)),
          BigNumber(reserves[0]).div(1e18),
          BigNumber(reserves[1]).div(1e18),
          bestAmountOut.routes[i].stable
        );

        const ratio = priceAfterSwap.div(priceWithoutImpact);
        totalRatio = BigNumber(totalRatio).times(ratio).toFixed(18);
      } catch (e) {
        console.log('Error define trade difference for',
          amountIn?.toString(),
          bestAmountOut.routes[i].from,
          bestAmountOut.routes[i].to,
          bestAmountOut.routes[i].stable, e)
      }

    }

    const priceImpact = BigNumber(1).minus(totalRatio).times(100).toFixed(18);
    const returnValue = {
      inputs: {
        fromAmount: fromAmount,
        fromAsset: fromAsset,
        toAsset: toAsset,
      },
      output: bestAmountOut,
      priceImpact: priceImpact,
    };

    emitter.emit(ACTIONS.QUOTE_SWAP_RETURNED, returnValue);

    return returnValue;
  } catch (ex) {
    console.error("Quote swap error", ex);

    emitter.emit(ACTIONS.QUOTE_SWAP_RETURNED, null);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

