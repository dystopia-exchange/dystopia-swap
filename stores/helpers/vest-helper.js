import BigNumber from "bignumber.js";
import * as moment from "moment/moment";
import {getTokenAllowance} from "./token-helper";
import {callContractWait} from "./web3-helper";
import {ACTIONS, CONTRACTS, MAX_UINT256} from "../constants";
import {getTXUUID, parseBN} from '../../utils';
import {getVeFromSubgraph} from "./ve-helper";

function getVeContract(web3) {
  return new web3.eth.Contract(
    CONTRACTS.VE_TOKEN_ABI,
    CONTRACTS.VE_TOKEN_ADDRESS
  );
}

export const createVest = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  govToken,
  callback
) => {
  try {
    const {amount, unlockTime} = payload.content;

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let allowanceTXID = getTXUUID();
    let vestTXID = getTXUUID();

    const unlockString = moment()
      .add(unlockTime, "seconds")
      .format("YYYY-MM-DD");

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Vest ${govToken.symbol} until ${unlockString}`,
      type: "Vest",
      verb: "Vest Created",
      transactions: [
        {
          uuid: allowanceTXID,
          description: `Checking your ${govToken.symbol} allowance`,
          status: "WAITING",
        },
        {
          uuid: vestTXID,
          description: `Vesting your tokens`,
          status: "WAITING",
        },
      ],
    });

    // CHECK ALLOWANCES AND SET TX DISPLAY
    const allowance = await getTokenAllowance(web3, govToken, account, CONTRACTS.VE_TOKEN_ADDRESS);

    if (BigNumber(allowance).lt(amount)) {
      emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allow the vesting contract to use your ${govToken.symbol}`,
      });
    } else {
      emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allowance on ${govToken.symbol} sufficient`,
        status: "DONE",
      });
    }

    // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
    if (BigNumber(allowance).lt(amount)) {
      const tokenContract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, govToken.address);

      await callContractWait(
        web3,
        tokenContract,
        "approve",
        [CONTRACTS.VE_TOKEN_ADDRESS, MAX_UINT256],
        account,
        gasPrice,
        null,
        null,
        allowanceTXID,
        emitter,
        dispatcher,
        () => {
        }
      );
    }

    // SUBMIT VEST TRANSACTION
    const sendAmount = parseBN(amount, govToken.decimals);

    const veTokenContract = getVeContract(web3);

    await callContractWait(
      web3,
      veTokenContract,
      "createLock",
      [sendAmount, unlockTime + ""],
      account,
      gasPrice,
      null,
      null,
      vestTXID,
      emitter,
      dispatcher,
      async (err) => {
        if (err) {
          return emitter.emit(ACTIONS.ERROR, err);
        }

        await callback(web3, account);

        emitter.emit(ACTIONS.CREATE_VEST_RETURNED);
      }
    );
  } catch (ex) {
    console.error("Create vest error", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const increaseVestAmount = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  govToken,
  callback
) => {
  try {
    const {amount, tokenID} = payload.content;

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let allowanceTXID = getTXUUID();
    let vestTXID = getTXUUID();

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Increase vest amount on token #${tokenID}`,
      type: "Vest",
      verb: "Vest Increased",
      transactions: [
        {
          uuid: allowanceTXID,
          description: `Checking your ${govToken.symbol} allowance`,
          status: "WAITING",
        },
        {
          uuid: vestTXID,
          description: `Increasing your vest amount`,
          status: "WAITING",
        },
      ],
    });

    // CHECK ALLOWANCES AND SET TX DISPLAY
    const allowance = await getTokenAllowance(web3, govToken, account, CONTRACTS.VE_TOKEN_ADDRESS);

    if (BigNumber(allowance).lt(amount)) {
      emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allow vesting contract to use your ${govToken.symbol}`,
      });
    } else {
      emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allowance on ${govToken.symbol} sufficient`,
        status: "DONE",
      });
    }

    // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
    if (BigNumber(allowance).lt(amount)) {
      const tokenContract = new web3.eth.Contract(
        CONTRACTS.ERC20_ABI,
        govToken.address
      );

      await Promise.all([
        new Promise((resolve, reject) => {
          callContractWait(
            web3,
            tokenContract,
            "approve",
            [CONTRACTS.VE_TOKEN_ADDRESS, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            allowanceTXID,
            emitter,
            dispatcher,
            (err) => {
              if (err) {
                emitter.emit(ACTIONS.ERROR, err);
                reject(err);
                return;
              }

              resolve();
            }
          );
        })
      ]);
    }

    // SUBMIT INCREASE TRANSACTION
    const sendAmount = parseBN(amount, govToken.decimals);

    const veTokenContract = getVeContract(web3);

    await callContractWait(
      web3,
      veTokenContract,
      "increaseAmount",
      [tokenID, sendAmount],
      account,
      gasPrice,
      null,
      null,
      vestTXID,
      emitter,
      dispatcher,
      async (err) => {
        if (err) {
          return emitter.emit(ACTIONS.ERROR, err);
        }

        await callback(web3, account);

        emitter.emit(ACTIONS.INCREASE_VEST_AMOUNT_RETURNED);
      }
    );
  } catch (ex) {
    console.error(ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const increaseVestDuration = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  callback
) => {
  try {

    const {tokenID, unlockTime} = payload.content;

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let vestTXID = getTXUUID();

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Increase unlock time on token #${tokenID}`,
      type: "Vest",
      verb: "Vest Increased",
      transactions: [
        {
          uuid: vestTXID,
          description: `Increasing your vest duration`,
          status: "WAITING",
        },
      ],
    });

    // SUBMIT INCREASE TRANSACTION
    const veTokenContract = getVeContract(web3);

    await callContractWait(
      web3,
      veTokenContract,
      "increaseUnlockTime",
      [tokenID, unlockTime + ""],
      account,
      gasPrice,
      null,
      null,
      vestTXID,
      emitter,
      dispatcher,
      async (err) => {
        if (err) {
          return emitter.emit(ACTIONS.ERROR, err);
        }

        await callback(tokenID);

        emitter.emit(ACTIONS.INCREASE_VEST_DURATION_RETURNED);
      }
    );
  } catch (ex) {
    console.error("Increase ve duration error", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

function createGaugeWithdrawNotifications(gauges, notifications, gaugeWithdrawTXID) {
  if (gauges) {
    for (let i = 0; i < gauges.length; i++) {
      const gauge = gauges[i];
      gaugeWithdrawTXID[i] = getTXUUID();
      notifications.push({
        uuid: gaugeWithdrawTXID[i],
        description: `Withdrawing your tokens for gauge ${gauge.pair.symbol}`,
        status: "WAITING",
      });
    }
  }
}

export const withdrawVest = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  callback
) => {
  try {
    const {tokenID} = payload.content;
    const ve = getVeFromSubgraph(tokenID)

    const gauges = ve?.gauges ?? [];
    const bribes = ve?.bribes ?? [];
    let gaugesLength = gauges.length;
    let bribesLength = bribes.length;

    // --- ADD TRANSACTIONS TO QUEUE DISPLAY
    let vestTXID = getTXUUID();
    let gaugeWithdrawTXID = [];
    let voteTXID = getTXUUID();

    let notifications = [];

    createGaugeWithdrawNotifications(gauges, notifications, gaugeWithdrawTXID);

    if (bribesLength !== 0) {
      notifications.push({
        uuid: voteTXID,
        description: `Reset votes`,
        status: "WAITING",
      });
    }

    notifications.push({
      uuid: vestTXID,
      description: `Withdrawing your expired tokens`,
      status: "WAITING",
    })

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Withdraw vest amount on token #${tokenID}`,
      type: "Vest",
      verb: "Vest Withdrawn",
      transactions: notifications,
    });
    // ---

    const veTokenContract = getVeContract(web3);

    let allowanceCallsPromise = [];

    for (let i = 0; i < gaugesLength; i++) {
      let gaugeContract = new web3.eth.Contract(
        CONTRACTS.GAUGE_ABI,
        gauges[i].gauge.id
      );
      const withdrawAll = new Promise((resolve, reject) => {
        callContractWait(
          web3,
          gaugeContract,
          "withdrawAll",
          [],
          account,
          gasPrice,
          null,
          null,
          gaugeWithdrawTXID[i],
          emitter,
          dispatcher,
          (err) => {
            if (err) {
              if (err) {
                emitter.emit(ACTIONS.ERROR, err);
              }
              reject(err);
              return;
            }
            resolve();
          }
        );
      });

      allowanceCallsPromise.push(withdrawAll);

      await Promise.all(allowanceCallsPromise);
    }


    // SUBMIT INCREASE TRANSACTION
    if (bribesLength !== 0) {
      const voterContract = new web3.eth.Contract(
        CONTRACTS.VOTER_ABI,
        CONTRACTS.VOTER_ADDRESS
      );

      const reset = new Promise((resolve, reject) => {
        callContractWait(
          web3,
          voterContract,
          "reset",
          [tokenID],
          account,
          gasPrice,
          null,
          null,
          voteTXID,
          emitter,
          dispatcher,
          (err) => {
            if (err) {
              if (err) {
                emitter.emit(ACTIONS.ERROR, err);
              }
              reject(err);
              return;
            }

            resolve();
          }
        );
      });

      allowanceCallsPromise.push(reset);
      await Promise.all(allowanceCallsPromise);
    }

    await callContractWait(
      web3,
      veTokenContract,
      "withdraw",
      [tokenID],
      account,
      gasPrice,
      null,
      null,
      vestTXID,
      emitter,
      dispatcher,
      async (err) => {
        if (err) {
          if (err) {
            return emitter.emit(ACTIONS.ERROR, err);
          }
        }
        await callback();
        emitter.emit(ACTIONS.WITHDRAW_VEST_RETURNED);
      }
    )
  } catch (ex) {
    console.error("Error withdraw ve", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const merge = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  callback
) => {
  try {
    const {tokenIDOne, tokenIDTwo} = payload.content;
    const ve = getVeFromSubgraph(tokenIDOne.id);

    const gauges = ve?.gauges ?? [];
    const bribes = ve?.bribes ?? [];
    let gaugesLength = gauges?.length ?? 0;
    let bribesLength = bribes?.length ?? 0;

    let allowanceTXID = getTXUUID();
    let gaugeWithdrawTXID = [];
    let voteResetTXID = getTXUUID();
    let mergeTXID = getTXUUID();

    const veContract = getVeContract(web3);

    let notifications = [];
    notifications.push({
      uuid: allowanceTXID,
      description: `Checking Allowance for ${CONTRACTS.VE_TOKEN_SYMBOL} to Merge`,
      status: "WAITING",
    });

    createGaugeWithdrawNotifications(gauges, notifications, gaugeWithdrawTXID);

    if (bribesLength !== 0) {
      notifications.push({
        uuid: voteResetTXID,
        description: `Reset votes`,
        status: "WAITING",
      });
    }

    notifications.push({
      uuid: mergeTXID,
      description: `Merge ${CONTRACTS.VE_TOKEN_SYMBOL}`,
      status: "WAITING",
    });

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Merge ve #${tokenIDOne.id} to #${tokenIDTwo.id}`,
      type: "Vest",
      verb: "Vest Withdrawn",
      transactions: notifications,
    });

    let isApproved = await veContract.methods
      .isApprovedForAll(account, CONTRACTS.VE_TOKEN_ADDRESS)
      .call();

    if (!isApproved) {
      emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allow the ${CONTRACTS.VE_TOKEN_SYMBOL} For Merge`,
      });
    } else {
      emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allowance on ${CONTRACTS.VE_TOKEN_SYMBOL} sufficient`,
        status: "DONE",
      });
    }
    if (bribesLength !== 0) {
      emitter.emit(ACTIONS.TX_STATUS, {
        uuid: voteResetTXID,
        description: `Reset the ${CONTRACTS.VE_TOKEN_SYMBOL} Votes`,
      });
    } else {
      emitter.emit(ACTIONS.TX_STATUS, {
        uuid: voteResetTXID,
        description: `Votes Reseted`,
        status: "DONE",
      });
    }

    if (!isApproved) {
      await callContractWait(
        web3,
        veContract,
        "setApprovalForAll",
        [CONTRACTS.VE_TOKEN_ADDRESS, "true"],
        account,
        gasPrice,
        null,
        null,
        allowanceTXID,
        emitter,
        dispatcher,
        (err) => {
          if (err) {
            return emitter.emit(ACTIONS.ERROR, err);
          }
        }
      );
    }
    if (gaugesLength !== 0) {
      for (let i = 0; i < gaugesLength; i++) {
        let gaugeContract = new web3.eth.Contract(
          CONTRACTS.GAUGE_ABI,
          gauges[i].gauge.id
        );
        await callContractWait(
          web3,
          gaugeContract,
          "withdrawAll",
          [],
          account,
          gasPrice,
          null,
          null,
          gaugeWithdrawTXID[i],
          emitter,
          dispatcher,
          (err) => {
            if (err) {
              return emitter.emit(ACTIONS.ERROR, err);
            }
          }
        );
      }
    }

    if (bribesLength > 0) {
      const voterContract = new web3.eth.Contract(
        CONTRACTS.VOTER_ABI,
        CONTRACTS.VOTER_ADDRESS
      );
      await callContractWait(
        web3,
        voterContract,
        "reset",
        [tokenIDOne.id],
        account,
        gasPrice,
        null,
        null,
        voteResetTXID,
        emitter,
        dispatcher,
        (err) => {
          if (err) {
            return emitter.emit(ACTIONS.ERROR, err);
          }
        }
      );
    }

    await callContractWait(
      web3,
      veContract,
      "merge",
      [tokenIDOne.id, tokenIDTwo.id],
      account,
      gasPrice,
      null,
      null,
      mergeTXID,
      emitter,
      dispatcher,
      async (err) => {
        if (err) {
          return emitter.emit(ACTIONS.ERROR, err);
        }
        await callback();
      }
    );

  } catch (ex) {
    console.error("Error merge", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};
