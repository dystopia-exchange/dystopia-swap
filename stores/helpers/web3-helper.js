import BigNumber from "bignumber.js";
import {
  emitNotificationConfirmed,
  emitNotificationPending,
  emitNotificationRejected,
  emitNotificationSubmitted
} from "./emit-helper";

export const callContractWait = async (
  web3,
  contract,
  method,
  params,
  account,
  gasPrice,
  dispatchEvent,
  dispatchContent,
  uuid,
  emitter,
  dispatcher,
  callback,
  paddGasCost,
  sendValue = null
) => {
  emitNotificationPending(emitter, uuid)

  await contract.methods[method](...params)
    .estimateGas({from: account, value: sendValue})
    .then(async (gasAmount) => {

      let sendGasAmount = BigNumber(gasAmount).times(1.5).toFixed(0);
      let sendGasPrice = BigNumber(gasPrice).toFixed(0);

      await contract.methods[method](...params)
        .send({
          from: account,
          gasPrice: web3.utils.toWei(sendGasPrice, "gwei"),
          gas: sendGasAmount,
          value: sendValue,
          // maxFeePerGas: web3.utils.toWei(gasPrice, "gwei"),
          // maxPriorityFeePerGas: web3.utils.toWei("2", "gwei"),
        })
        .on("transactionHash", async function (txHash) {
          emitNotificationSubmitted(emitter, uuid, txHash)
        })
        .on("receipt", async function (receipt) {
          emitNotificationConfirmed(emitter, uuid, receipt.transactionHash)
          callback(null, receipt.transactionHash);
          if (dispatchEvent) {
            dispatcher.dispatch({
              type: dispatchEvent,
              content: dispatchContent,
            });
          }
        })
        .on("error", async function (error) {
          if (error.message) {
            emitNotificationRejected(emitter, uuid, error.message)
            return callback(error.message);
          }
          emitNotificationRejected(emitter, uuid, error)
          callback(error);
        })
        .catch(async (error) => {
          if (error.message) {
            emitNotificationRejected(emitter, uuid, error.message)
            return callback(error.message);
          }
          emitNotificationRejected(emitter, uuid, error)
          await callback(error);
        });
    })
    .catch((ex) => {
      console.log("Call tx error", contract._address, method, params, ex);
      if (ex.message) {
        emitNotificationRejected(emitter, uuid, ex.message)
        return callback(ex.message);
      }
      emitNotificationRejected(emitter, uuid, "Error estimating gas")
      callback(ex);
    });
};

export function excludeErrors(error) {
  const msg = error?.message;
  return !msg?.includes("-32601")
    && !msg?.includes("User denied transaction signature")
}

function parseRpcError(error) {
  // return error.reason ? error.reason : error;
  return error
}
