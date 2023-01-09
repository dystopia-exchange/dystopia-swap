import BigNumber from "bignumber.js";
import {v4 as uuidv4} from "uuid";
import {assetIcons} from "../public/images/assets/asset-icons";
import {ALLOWED_DUPLICATE_SYMBOLS} from "../stores/constants"

export const getTXUUID = () => {
  return uuidv4();
};

export function formatBN(num, decimals = '18') {
  if (!num) {
    return "0";
  }
  return BigNumber(num)
      .div(BigNumber(10).pow(BigNumber(parseInt(decimals))))
      .toFixed(parseInt(decimals));
}

export function parseBN(num, decimals = '18') {
  if (num === null || num === undefined) {
    // parse function pretty critical coz using in contract calls
    // better to throw an error
    throw new Error("Invalid bn: " + num);
  }
  try {
    return BigNumber(num)
        .times(BigNumber(10).pow(parseInt(decimals)))
        .toFixed(0, BigNumber.ROUND_DOWN);
  } catch (e) {
    console.info("Error parse bn: ", num)
    throw e;
  }
}

export function formatCurrency(amount, decimals = 2) {
  if (!isNaN(amount)) {
    if (BigNumber(amount).gt(0) && BigNumber(amount).lt(0.01)) {
      return "< 0.01";
    }

    const formatter = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    return formatter.format(amount);
  } else {
    return 0;
  }
}

export function calculateApr(
    timeStart,
    timeEnd,
    profit,
    positionAmount,
) {
  const period = BigNumber(timeEnd).minus(timeStart);
  if (period.isZero() || BigNumber(positionAmount).isZero()) {
    return '0';
  }
  return BigNumber(profit).div(positionAmount).div(period.div(60 * 60 * 24)).times(36500).toString();
}

export function formatAddress(address, length = "short") {
  if (address && length === "short") {
    address =
      address.substring(0, 6) +
      "..." +
      address.substring(address.length - 4, address.length);
    return address;
  } else if (address && length === "long") {
    address =
      address.substring(0, 12) +
      "..." +
      address.substring(address.length - 8, address.length);
    return address;
  } else {
    return null;
  }
}

export function bnDec(decimals) {
  return new BigNumber(10).pow(parseInt(decimals));
}

export function sqrt(value) {
  if (value < 0n) {
    throw new Error("square root of negative numbers is not supported");
  }

  if (value < 2n) {
    return value;
  }

  function newtonIteration(n, x0) {
    // eslint-disable-next-line no-bitwise
    const x1 = (n / x0 + x0) >> 1n;
    if (x0 === x1 || x0 === x1 - 1n) {
      return x0;
    }
    return newtonIteration(n, x1);
  }

  return newtonIteration(value, 1n);
}

export function multiplyBnToFixed(...args) {
  if (args.length < 3)
    throw new Error(
      "multiplyBnToFixed needs at least 3 arguments: first bn, second bn to multiply with first, and number of decimals."
    );

  const decimals = args[args.length - 1];
  const bigNumbers = args.slice(0, -1);

  return bnToFixed(
    multiplyArray(bigNumbers),
    decimals * bigNumbers.length,
    decimals
  );
}

export function sumArray(numbers) {
  return numbers.reduce((total, n) => total + Number(n), 0);
}

export function bnToFixed(bn, decimals, displayDecimals = decimals) {
  const bnDecimals = new BigNumber(10).pow(decimals);

  return new BigNumber(bn)
    .dividedBy(bnDecimals)
    .toFixed(displayDecimals, BigNumber.ROUND_DOWN);
}

export function floatToFixed(float, decimals = 0) {
  return new BigNumber(float).toFixed(decimals, BigNumber.ROUND_DOWN);
}

export function multiplyArray(numbers) {
  return numbers.reduce((total, n) => total * n, 1);
}

export const formatSymbol = (symbol) => {
  if (typeof symbol !== "string") return symbol;
  if (symbol.includes("sAMM")) return symbol.replace("sAMM-", "");
  if (symbol.includes("vAMM")) return symbol.replace("vAMM-", "");
  return symbol;
};

export const validateInput = (value) => {
  if (Number.isNaN(parseFloat(value))) {
    return "";
  }

  const numbers = "0123456789";
  let hasDot = false;
  const val = Array.from(value)
    .filter((el) => {
      if (el === "." && !hasDot) {
        hasDot = true;
        return true;
      }
      return numbers.includes(el);
    })
    .join("");

  return val;
};

export const formatToString = (value) => {
  if (value[value.length - 1] === ".") {
    return value;
  }

  if (value.includes(".")) {
    const [whole, fractional] = value.split(".");
    if (fractional.length >= 18) {
      const formated = new BigNumber(value ?? 0).toFixed(18);
      return formated;
    }
  }

  const formated = new BigNumber(value ?? 0).toFixed();

  if (
    (value.length > 2 && formated === "0") ||
    formated.length < value.length
  ) {
    return value;
  }

  return formated;
};

export const formatInputAmount = (value) => {
  const formated =
    formatToString(validateInput(value)) === "NaN"
      ? ""
      : formatToString(validateInput(value));
  return formated;
};

const MAX_REQUEST_RETRY = 3;

export const retry = ({ fn, args, defaultValue }) => {
  let retryCount = 0;
  const wrappedFn = async () => {
    try {
      const response = args ? await fn(...args) : await fn();
      return response;
    } catch (err) {
      retryCount++;
      if (retryCount > MAX_REQUEST_RETRY) {
        return defaultValue ?? null;
      } else {
        return await wrappedFn();
      }
    }
  };

  return wrappedFn;
};

export const retryForSwapQuote = ({ fn, args, defaultValue }) => {
  let retryCount = 0;
  const wrappedFn = async () => {
    try {
      const response = args ? await fn(...args) : await fn();
      return response;
    } catch (err) {
      if (err.toString().includes('execution reverted') || err.toString().includes('Out of Gas')) {
        retryCount++;
        if (retryCount > MAX_REQUEST_RETRY) {
          return defaultValue ?? null;
        } else {
          return await wrappedFn();
        }
      } else {
        console.log('retryForSwapQuote bad error catched')
        console.log(err)
        return undefined
      }
    }
  };

  return wrappedFn;
};

export const removeDuplicate = (arr) => {
  const assets = arr.reduce((acc, item) => {
    if (item.symbol in assetIcons) {
      item.logoURI = '/images/assets/' + assetIcons[item.symbol]
    }
    if (ALLOWED_DUPLICATE_SYMBOLS.includes(item.symbol)) {
      acc[item.address.toLowerCase()] = item;
    } else {
      acc[item.symbol] = item;
    }

    return acc;
  }, {});
  return Object.values(assets);
};

// ROUTES

export function buildRoutes(routeAssets, addy0, addy1, directRoute) {
  let result = []

  if (!directRoute) {
    result = routeAssets
        .map((routeAsset) => {

          const arr = [];

          if (addy0.toLowerCase() === routeAsset.address.toLowerCase()
              || addy1.toLowerCase() === routeAsset.address.toLowerCase()) {
            return arr;
          }
          arr.push({
            routes: [
              {
                from: addy0,
                to: routeAsset.address,
                stable: true,
              },
              {
                from: routeAsset.address,
                to: addy1,
                stable: true,
              },
            ],
            routeAsset: routeAsset,
          });


          arr.push({
            routes: [
              {
                from: addy0,
                to: routeAsset.address,
                stable: false,
              },
              {
                from: routeAsset.address,
                to: addy1,
                stable: false,
              },
            ],
            routeAsset: routeAsset,
          });

          arr.push({
            routes: [
              {
                from: addy0,
                to: routeAsset.address,
                stable: true,
              },
              {
                from: routeAsset.address,
                to: addy1,
                stable: false,
              },
            ],
            routeAsset: routeAsset,
          });
          arr.push({
            routes: [
              {
                from: addy0,
                to: routeAsset.address,
                stable: false,
              },
              {
                from: routeAsset.address,
                to: addy1,
                stable: true,
              },
            ],
            routeAsset: routeAsset,
          });
          return arr;
        })
        .flat();
  }

  result.push({
    routes: [
      {
        from: addy0,
        to: addy1,
        stable: true,
      },
    ],
    routeAsset: null,
  });
  result.push({
    routes: [
      {
        from: addy0,
        to: addy1,
        stable: false,
      },
    ],
    routeAsset: null,
  });
  // console.log(">>> ROUTES:", result)
  return result;
}

/// PRICE CALCULATIONS

export function getPrice(reserveIn, reserveOut, stable) {
  const minimalValue = BigNumber(1e-9);
  if (stable) {
    return getAmountOutStable(minimalValue, reserveIn, reserveOut).div(minimalValue);
  } else {
    return getAmountOutVolatile(minimalValue, reserveIn, reserveOut).div(minimalValue);
  }
}

export function getAmountOut(amountIn, reserveIn, reserveOut, stable) {
  if (stable) {
    return getAmountOutStable(amountIn, reserveIn, reserveOut);
  } else {
    return getAmountOutVolatile(amountIn, reserveIn, reserveOut);
  }
}

function getAmountOutVolatile(amountIn, reserveIn, reserveOut) {
  // console.log("getAmountOutVolatile", amountIn.toString(), reserveIn.toString(), reserveOut.toString())
  return amountIn.times(reserveOut).div(reserveIn.plus(amountIn));
}

function getAmountOutStable(amountIn, reserveIn, reserveOut) {
  const xy = _k(reserveIn, reserveOut);
  return reserveOut.minus(_getY(amountIn.plus(reserveIn), xy, reserveOut));
}

function _k(_x, _y) {
  const _a = _x.times(_y);
  const _b = _x.times(_x).plus(_y.times(_y));
  // x3y+y3x >= k
  return _a.times(_b);
}

function _getY(x0, xy, y) {
  for (let i = 0; i < 255; i++) {
    const yPrev = y;
    const k = _f(x0, y);
    if (k.lt(xy)) {
      const dy = xy.minus(k).div(_d(x0, y));
      y = y.plus(dy);
    } else {
      const dy = k.minus(xy).div(_d(x0, y));
      y = y.minus(dy);
    }
    if (_closeTo(y, yPrev, 1)) {
      break;
    }
  }
  return y;
}

function _f(x0, y) {
  return x0.times(y.pow(3)).plus(y.times(x0.pow(3)));
}

function _d(x0, y) {
  return BigNumber(3).times(x0.times(y.pow(2))).plus(x0.pow(3));
}

function _closeTo(a, b, target) {
  if (a.gt(b)) {
    if (a.minus(b).lt(target)) {
      return true;
    }
  } else {
    if (b.minus(a).lt(target)) {
      return true;
    }
  }
  return false;
}
