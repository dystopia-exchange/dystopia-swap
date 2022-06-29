import BigNumber from "bignumber.js";

// todo: get navigator declared somehow? probably an issue with using nextjs
// function getLang() {
//  if (window.navigator.languages != undefined)
//   return window.navigator.languages[0];
//  else
//   return window.navigator.language;
// }

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
