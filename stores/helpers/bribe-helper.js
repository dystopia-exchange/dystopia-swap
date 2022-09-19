import BigNumber from "bignumber.js";
import {callContractWait} from "./web3-helper";
import {ACTIONS, CONTRACTS, MAX_UINT256} from "../constants";
import {getTXUUID, parseBN} from '../../utils';
import {getTokenAllowance} from "./token-helper";

export const createBribe = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  callback
) => {
  try {
    const {asset, amount, gauge} = payload.content;

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let allowanceTXID = getTXUUID();
    let bribeTXID = getTXUUID();

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Create bribe on ${gauge.token0.symbol}/${gauge.token1.symbol}`,
      verb: "Bribe Created",
      transactions: [
        {
          uuid: allowanceTXID,
          description: `Checking your ${asset.symbol} allowance`,
          status: "WAITING",
        },
        {
          uuid: bribeTXID,
          description: `Create bribe`,
          status: "WAITING",
        },
      ],
    });

    // CHECK ALLOWANCES AND SET TX DISPLAY
    const allowance = await getTokenAllowance(web3, asset, account, gauge.gauge.bribeAddress);

    if (BigNumber(allowance).lt(amount)) {
      emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allow the bribe contract to spend your ${asset.symbol}`,
      });
    } else {
      emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allowance on ${asset.symbol} sufficient`,
        status: "DONE",
      });
    }

    const allowanceCallsPromises = [];

    // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
    if (BigNumber(allowance).lt(amount)) {
      const tokenContract = new web3.eth.Contract(
        CONTRACTS.ERC20_ABI,
        asset.address
      );

      const tokenPromise = new Promise((resolve, reject) => {
        callContractWait(
          web3,
          tokenContract,
          "approve",
          [gauge.gauge.bribeAddress, MAX_UINT256],
          account,
          gasPrice,
          null,
          null,
          allowanceTXID,
          emitter,
          dispatcher,
          (err) => {
            if (err) {
              reject(err);
              return;
            }

            resolve();
          }
        );
      });

      allowanceCallsPromises.push(tokenPromise);
    }

    await Promise.all(allowanceCallsPromises);

    // SUBMIT BRIBE TRANSACTION
    const bribeContract = new web3.eth.Contract(
      CONTRACTS.BRIBE_ABI,
      gauge.gauge.bribeAddress
    );

    const sendAmount = parseBN(amount, asset.decimals);

    await callContractWait(
      web3,
      bribeContract,
      "notifyRewardAmount",
      [asset.address, sendAmount],
      account,
      gasPrice,
      null,
      null,
      bribeTXID,
      emitter,
      dispatcher,
      async (err) => {
        if (err) {
          return emitter.emit(ACTIONS.ERROR, err);
        }

        await callback();

        emitter.emit(ACTIONS.BRIBE_CREATED);
      }
    );
  } catch (ex) {
    console.error("Error create bribe", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};
