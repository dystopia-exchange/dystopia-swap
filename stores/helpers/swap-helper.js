import BigNumber from "bignumber.js";
import * as moment from "moment/moment";
import {getTokenAllowance, isNetworkToken} from "./token-helper";
import {callContractWait} from "./web3-helper";
import {v4 as uuidv4} from "uuid";
import {ACTIONS, CONTRACTS, MAX_UINT256} from "../constants";
import {formatCurrency, parseBN} from '../../utils';
import {emitNewNotifications, emitStatus, emitNotificationDone} from "./emit-helper";
import {FTM_SYMBOL} from "../constants/contracts";

const getTXUUID = () => {
  return uuidv4();
};

export const swap = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  callback
) => {
  try {

    const {fromAsset, toAsset, fromAmount, quote, slippage} = payload.content;

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let allowanceTXID = getTXUUID();
    let swapTXID = getTXUUID();

    await emitNewNotifications(emitter, [
      {
        uuid: allowanceTXID,
        description: `Checking your ${fromAsset.symbol} allowance`,
        status: "WAITING",
      },
      {
        uuid: swapTXID,
        description: `Swap ${formatCurrency(fromAmount)} ${
          fromAsset.symbol
        } for ${toAsset.symbol}`,
        status: "WAITING",
      },
    ]);

    let allowance;

    // CHECK ALLOWANCES AND SET TX DISPLAY
    if (!isNetworkToken(fromAsset.address)) {
      allowance = await getTokenAllowance(web3, fromAsset, account, CONTRACTS.ROUTER_ADDRESS);

      if (BigNumber(allowance).lt(fromAmount)) {
        await emitStatus(emitter, allowanceTXID, `Allow the router to spend your ${fromAsset.symbol}`)
      } else {
        await emitNotificationDone(emitter, allowanceTXID, `Allowance on ${fromAsset.symbol} sufficient`)
      }
    } else {
      allowance = MAX_UINT256;
      console.log("Allowance", allowanceTXID)
      await emitNotificationDone(emitter, allowanceTXID, `Allowance on ${fromAsset.symbol} sufficient`)
    }

    // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
    if (BigNumber(allowance).lt(fromAmount)) {
      const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, fromAsset.address);

      await callContractWait(
        web3,
        tokenContract,
        "approve",
        [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256],
        account,
        gasPrice,
        null,
        null,
        allowanceTXID,
        emitter,
        dispatcher,
        () => {}
      );
    }

    // SUBMIT SWAP TRANSACTION
    let _slippage = slippage;

    // todo taxable tokens logic, need make universal logic
    if (
      fromAsset.address.toLowerCase() ===
      CONTRACTS.SPHERE_ADDRESS.toLowerCase() &&
      Number(slippage) <= 22
    ) {
      _slippage = (30 + Number(slippage)).toString();
    }

    const sendSlippage = BigNumber(100).minus(_slippage).div(100);

    const sendFromAmount = parseBN(fromAmount, fromAsset.decimals);
    const sendMinAmountOut = BigNumber(quote.output.finalValue)
      .times(10 ** toAsset.decimals)
      .times(sendSlippage)
      .toFixed(0);
    // console.log("fromAmount", fromAmount, sendFromAmount) // 10000000000000000000
    console.log("sendMinAmountOut", quote.output.finalValue, sendMinAmountOut) // 563329031843791

    const deadline = "" + moment().add(600, "seconds").unix();

    const routerContract = new web3.eth.Contract(CONTRACTS.ROUTER_ABI, CONTRACTS.ROUTER_ADDRESS);

    let func = "swapExactTokensForTokens";
    let params = [
      sendFromAmount,
      sendMinAmountOut,
      quote.output.routes,
      account,
      deadline,
    ];
    let sendValue = null;

    // todo taxable tokens logic, need make universal logic
    if (
      fromAsset.address.toLowerCase() ===
      CONTRACTS.SPHERE_ADDRESS.toLowerCase()
    ) {
      // SPHERE token address
      func = "swapExactTokensForTokensSupportingFeeOnTransferTokens";
    }

    if (fromAsset.address === FTM_SYMBOL) {
      func = "swapExactMATICForTokens";
      params = [
        sendMinAmountOut,
        quote.output.routes,
        account,
        deadline,
      ];
      sendValue = sendFromAmount;
    }
    if (toAsset.address === FTM_SYMBOL) {
      func = "swapExactTokensForMATIC";
      if (
        fromAsset.address.toLowerCase() ===
        CONTRACTS.SPHERE_ADDRESS.toLowerCase()
      ) {
        func = "swapExactTokensForMATICSupportingFeeOnTransferTokens";
      }
    }

    await callContractWait(
      web3,
      routerContract,
      func,
      params,
      account,
      gasPrice,
      null,
      null,
      swapTXID,
      emitter,
      dispatcher,
      async (err) => {
        if (err) {
          return emitter.emit(ACTIONS.ERROR, err);
        }

        await callback(web3, account, fromAsset, toAsset);

        emitter.emit(ACTIONS.SWAP_RETURNED);
      },
      null,
      sendValue
    );
  } catch (ex) {
    console.error("Swap error", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const wrap = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  callback
) => {
  try {
    const allowanceCallsPromises = [];

    const {fromAsset, toAsset, fromAmount} = payload.content;

    let wrapTXID = getTXUUID();

    const sendValue = parseBN(fromAmount, fromAsset.decimals);

    const wmaticContract = new web3.eth.Contract(
      CONTRACTS.WFTM_ABI,
      CONTRACTS.WFTM_ADDRESS
    );

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Wrap ${fromAsset.symbol} for ${toAsset.symbol}`,
      type: "Warp",
      verb: "Wrap Successful",
      transactions: [
        {
          uuid: wrapTXID,
          description: `Wrap ${formatCurrency(fromAmount)} ${
            fromAsset.symbol
          } for ${toAsset.symbol}`,
          status: "WAITING",
        },
      ],
    });

    const depositPromise = new Promise((resolve, reject) => {
      callContractWait(
        web3,
        wmaticContract,
        "deposit",
        [],
        account,
        gasPrice,
        null,
        null,
        wrapTXID,
        emitter,
        dispatcher,
        async (err) => {
          if (err) {
            reject(err);
            return;
          }

          await callback(web3, account, fromAsset, toAsset);

          resolve();
        },
        null,
        sendValue
      );
    });

    allowanceCallsPromises.push(depositPromise);
    await Promise.all(allowanceCallsPromises);
    emitter.emit(ACTIONS.WRAP_RETURNED);
  } catch (e) {
    console.log("Wrap error", e);
    emitter.emit(ACTIONS.ERROR, e);
  }
};

export const unwrap = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  callback
) => {
  try {
    const allowanceCallsPromises = [];

    const {fromAsset, toAsset, fromAmount, toAmount} = payload.content;

    let unwrapTXID = getTXUUID();

    const sendFromAmount = parseBN(fromAmount, fromAsset.decimals);
    const wmaticContract = new web3.eth.Contract(
      CONTRACTS.WFTM_ABI,
      CONTRACTS.WFTM_ADDRESS
    );
    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Unwrap ${fromAsset.symbol} for ${toAsset.symbol}`,
      type: "Unwarp",
      verb: "Unwrap Successful",
      transactions: [
        {
          uuid: unwrapTXID,
          description: `Unwrap ${formatCurrency(fromAmount)} ${
            fromAsset.symbol
          } for ${toAsset.symbol}`,
          status: "WAITING",
        },
      ],
    });
    const withdrawPromise = new Promise((resolve, reject) => {
      callContractWait(
        web3,
        wmaticContract,
        "withdraw",
        [sendFromAmount],
        account,
        gasPrice,
        null,
        null,
        unwrapTXID,
        emitter,
        dispatcher,
        async (err) => {
          if (err) {
            reject(err);
            return;
          }

          await callback(web3, account, fromAsset, toAsset);

          resolve();
        }
      );
    });

    allowanceCallsPromises.push(withdrawPromise);
    await Promise.all(allowanceCallsPromises);
    emitter.emit(ACTIONS.UNWRAP_RETURNED);
  } catch (e) {
    console.log("Unwrap error", e);
    emitter.emit(ACTIONS.ERROR, e);
  }
};
