import BigNumber from "bignumber.js";
import * as moment from "moment/moment";
import {getPairAddressByTokens} from "./pair-helper";
import {getTokenAllowance, getTokenContract} from "./token-helper";
import {callContractWait} from "./web3-helper";
import {v4 as uuidv4} from "uuid";
import {ACTIONS, CONTRACTS, MAX_UINT256, ZERO_ADDRESS} from "../constants";
import {parseBN} from '../../utils';
import {FTM_SYMBOL} from "../constants/contracts";

const getTXUUID = () => {
  return uuidv4();
};

export const createPairDeposit = async (
  token0,
  token1,
  amount0,
  amount1,
  isStable,
  slippage,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  isCreateGauge,
  callback
) => {
  try {

    let toki0 = token0.address;
    let toki1 = token1.address;
    if (token0.address === FTM_SYMBOL) {
      toki0 = CONTRACTS.WFTM_ADDRESS;
    }
    if (token1.address === FTM_SYMBOL) {
      toki1 = CONTRACTS.WFTM_ADDRESS;
    }

    const pairFor = await getPairAddressByTokens(web3, toki0, toki1, isStable);

    if (isCreateGauge) {
      if (pairFor && pairFor !== ZERO_ADDRESS) {
        emitter.emit(ACTIONS.ERROR, "Pair already exists")
        await callback();
        return null;
      }
    }

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let allowance0TXID = getTXUUID();
    let allowance1TXID = getTXUUID();
    let depositTXID = getTXUUID();
    let createGaugeTXID = getTXUUID();

    //DOD A CHECK FOR IF THE POOL ALREADY EXISTS


    if (isCreateGauge) {
      emitter.emit(ACTIONS.TX_ADDED, {
        title: `Create liquidity pool for ${isStable ? 's' : 'v'}-${token0.symbol}/${token1.symbol}`,
        type: "Liquidity",
        verb: "Liquidity Pool Created",
        transactions: [
          {
            uuid: allowance0TXID,
            description: `Checking your ${token0.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: allowance1TXID,
            description: `Checking your ${token1.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: depositTXID,
            description: `Create liquidity pool ${isStable ? 's' : 'v'}-${token0.symbol}/${token1.symbol}`,
            status: "WAITING",
          },
          {
            uuid: createGaugeTXID,
            description: `Create gauge`,
            status: "WAITING",
          },
        ],
      });
    } else {
      emitter.emit(ACTIONS.TX_ADDED, {
        title: `Add liquidity to ${isStable ? 's' : 'v'}-${token0.symbol}/${token1.symbol}`,
        verb: "Liquidity Added",
        type: "Liquidity",
        transactions: [
          {
            uuid: allowance0TXID,
            description: `Checking your ${token0.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: allowance1TXID,
            description: `Checking your ${token1.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: depositTXID,
            description: `Deposit tokens in the pool ${isStable ? 's' : 'v'}-${token0.symbol}/${token1.symbol}`,
            status: "WAITING",
          },
        ],
      });
    }

    let allowance0;
    let allowance1;

    // CHECK ALLOWANCES AND SET TX DISPLAY
    if (token0.address !== FTM_SYMBOL) {
      allowance0 = await getTokenAllowance(web3, token0, account, CONTRACTS.ROUTER_ADDRESS);
      if (BigNumber(allowance0).lt(amount0)) {
        emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance0TXID,
          description: `Allow the router to spend your ${token0.symbol}`,
        });
      } else {
        emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance0TXID,
          description: `Allowance on ${token0.symbol} sufficient`,
          status: "DONE",
        });
      }
    } else {
      allowance0 = MAX_UINT256;
      emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowance0TXID,
        description: `Allowance on ${token0.symbol} sufficient`,
        status: "DONE",
      });
    }

    if (token1.address !== FTM_SYMBOL) {
      allowance1 = await getTokenAllowance(web3, token1, account, CONTRACTS.ROUTER_ADDRESS);
      if (BigNumber(allowance1).lt(amount1)) {
        emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance1TXID,
          description: `Allow the router to spend your ${token1.symbol}`,
        });
      } else {
        emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance1TXID,
          description: `Allowance on ${token1.symbol} sufficient`,
          status: "DONE",
        });
      }
    } else {
      allowance1 = MAX_UINT256;
      emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowance1TXID,
        description: `Allowance on ${token1.symbol} sufficient`,
        status: "DONE",
      });
    }

    const allowanceCallsPromises = [];

    // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
    if (BigNumber(allowance0).lt(amount0)) {
      const tokenContract = getTokenContract(web3, token0.address);

      const tokenPromise = new Promise((resolve, reject) => {
        callContractWait(
          web3,
          tokenContract,
          "approve",
          [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256],
          account,
          gasPrice,
          null,
          null,
          allowance0TXID,
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

    if (BigNumber(allowance1).lt(amount1)) {
      const tokenContract = getTokenContract(web3, token1.address);

      const tokenPromise = new Promise((resolve, reject) => {
        callContractWait(
          web3,
          tokenContract,
          "approve",
          [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256],
          account,
          gasPrice,
          null,
          null,
          allowance1TXID,
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

    // SUBMIT DEPOSIT TRANSACTION
    const sendSlippage = BigNumber(100).minus(slippage).div(100);
    const sendAmount0 = BigNumber(amount0)
      .times(10 ** parseInt(token0.decimals))
      .toFixed(0);
    const sendAmount1 = BigNumber(amount1)
      .times(10 ** parseInt(token1.decimals))
      .toFixed(0);
    const deadline = "" + moment().add(600, "seconds").unix();
    const sendAmount0Min = BigNumber(amount0)
      .times(sendSlippage)
      .times(10 ** parseInt(token0.decimals))
      .toFixed(0);
    const sendAmount1Min = BigNumber(amount1)
      .times(sendSlippage)
      .times(10 ** parseInt(token1.decimals))
      .toFixed(0);

    let func = "addLiquidity";
    let params = [
      token0.address,
      token1.address,
      isStable,
      sendAmount0,
      sendAmount1,
      sendAmount0Min,
      sendAmount1Min,
      account,
      deadline,
    ];
    let sendValue = null;

    if (token0.address === FTM_SYMBOL) {
      func = "addLiquidityMATIC";
      params = [
        token1.address,
        isStable,
        sendAmount1,
        sendAmount1Min,
        sendAmount0Min,
        account,
        deadline,
      ];
      sendValue = sendAmount0;
    }
    if (token1.address === FTM_SYMBOL) {
      func = "addLiquidityMATIC";
      params = [
        token0.address,
        isStable,
        sendAmount0,
        sendAmount0Min,
        sendAmount1Min,
        account,
        deadline,
      ];
      sendValue = sendAmount1;
    }
    const routerContract = new web3.eth.Contract(
      CONTRACTS.ROUTER_ABI,
      CONTRACTS.ROUTER_ADDRESS
    );
    callContractWait(
      web3,
      routerContract,
      func,
      params,
      account,
      gasPrice,
      null,
      null,
      depositTXID,
      emitter,
      dispatcher,
      async (err) => {
        if (err) {
          return emitter.emit(ACTIONS.ERROR, err);
        }
        if (isCreateGauge) {
          // GET PAIR FOR NEWLY CREATED LIQUIDITY POOL
          let tok0 = token0.address;
          let tok1 = token1.address;
          if (token0.address === FTM_SYMBOL) {
            tok0 = CONTRACTS.WFTM_ADDRESS;
          }
          if (token1.address === FTM_SYMBOL) {
            tok1 = CONTRACTS.WFTM_ADDRESS;
          }
          const pairFor = await getPairAddressByTokens(web3, tok0, tok1, isStable);

          // SUBMIT CREATE GAUGE TRANSACTION
          const gaugesContract = new web3.eth.Contract(
            CONTRACTS.VOTER_ABI,
            CONTRACTS.VOTER_ADDRESS
          );
          callContractWait(
            web3,
            gaugesContract,
            "createGauge",
            [pairFor],
            account,
            gasPrice,
            null,
            null,
            createGaugeTXID,
            emitter,
            dispatcher,
            async (err) => {
              if (err) {
                return emitter.emit(ACTIONS.ERROR, err);
              }
              await callback();
              emitter.emit(ACTIONS.PAIR_CREATED, pairFor);
            }
          );
        } else {
          await callback();
          emitter.emit(ACTIONS.LIQUIDITY_ADDED);
        }
      },
      null,
      sendValue
    );
  } catch (ex) {
    console.error("Create liquidity error", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const stakeLiquidity = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  callback
) => {
  try {
    const {pair, token, amount, percent} = payload.content;

    let stakeAllowanceTXID = getTXUUID();
    let stakeTXID = getTXUUID();

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Stake ${pair.symbol} in the gauge`,
      type: "Liquidity",
      verb: "Liquidity Staked",
      transactions: [
        {
          uuid: stakeAllowanceTXID,
          description: `Checking your ${pair.symbol} allowance`,
          status: "WAITING",
        },
        {
          uuid: stakeTXID,
          description: `Stake LP tokens in the gauge`,
          status: "WAITING",
        },
      ],
    });
    const stakeAllowance = await getTokenAllowance(web3, pair, account, pair.gauge.address);

    const pairContract = new web3.eth.Contract(
      CONTRACTS.PAIR_ABI,
      pair.address
    );
    const balanceOf = await pairContract.methods.balanceOf(account).call();

    if (
      BigNumber(stakeAllowance).lt(
        BigNumber(balanceOf)
          .div(10 ** parseInt(pair.decimals))
          .toFixed(parseInt(pair.decimals))
      )
    ) {
      emitter.emit(ACTIONS.TX_STATUS, {
        uuid: stakeAllowanceTXID,
        description: `Allow the router to spend your ${pair.symbol}`,
      });
    } else {
      emitter.emit(ACTIONS.TX_STATUS, {
        uuid: stakeAllowanceTXID,
        description: `Allowance on ${pair.symbol} sufficient`,
        status: "DONE",
      });
    }

    const allowanceCallsPromises = [];

    if (
      BigNumber(stakeAllowance).lt(
        BigNumber(balanceOf)
          .div(10 ** parseInt(pair.decimals))
          .toFixed(parseInt(pair.decimals))
      )
    ) {
      const stakePromise = new Promise((resolve, reject) => {
        callContractWait(
          web3,
          pairContract,
          "approve",
          [pair.gauge.address, MAX_UINT256],
          account,
          gasPrice,
          null,
          null,
          stakeAllowanceTXID,
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

      allowanceCallsPromises.push(stakePromise);
    }

    await Promise.all(allowanceCallsPromises);

    const gaugeContract = new web3.eth.Contract(
      CONTRACTS.GAUGE_ABI,
      pair.gauge.address
    );

    let sendTok = "0";
    if (token && token.id) {
      sendTok = token.id;
    }
    let am = BigNumber(amount)
      .times(10 ** pair.decimals)
      .toFixed(0);

    if (parseFloat(percent) === 100) {
      await callContractWait(
        web3,
        gaugeContract,
        "depositAll",
        [sendTok],
        account,
        gasPrice,
        null,
        null,
        stakeTXID,
        emitter,
        dispatcher,
        async (err) => {
          if (err) {
            return emitter.emit(ACTIONS.ERROR, err);
          }

          await callback();

          emitter.emit(ACTIONS.LIQUIDITY_STAKED);
        }
      );
    } else {
      await callContractWait(
        web3,
        gaugeContract,
        "deposit",
        [am, sendTok],
        account,
        gasPrice,
        null,
        null,
        stakeTXID,
        emitter,
        dispatcher,
        async (err) => {
          if (err) {
            return emitter.emit(ACTIONS.ERROR, err);
          }

          await callback();

          emitter.emit(ACTIONS.LIQUIDITY_STAKED);
        }
      );
    }
  } catch (ex) {
    console.error("Error deposit to gauge", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const removeLiquidity = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  callback
) => {
  try {
    const {token0, token1, pair, percent, slippage} = payload.content;

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let allowanceTXID = getTXUUID();
    let withdrawTXID = getTXUUID();

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Remove liquidity from ${pair.symbol}`,
      type: "Liquidity",
      verb: "Liquidity Removed",
      transactions: [
        {
          uuid: allowanceTXID,
          description: `Checking your ${pair.symbol} allowance`,
          status: "WAITING",
        },
        {
          uuid: withdrawTXID,
          description: `Withdraw tokens from the pool`,
          status: "WAITING",
        },
      ],
    });

    // CHECK ALLOWANCES AND SET TX DISPLAY
    const allowance = await getTokenAllowance(web3, pair, account, CONTRACTS.ROUTER_ADDRESS);

    if (BigNumber(allowance).lt(pair.balance)) {
      emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allow the router to spend your ${pair.symbol}`,
      });
    } else {
      emitter.emit(ACTIONS.TX_STATUS, {
        uuid: allowanceTXID,
        description: `Allowance on ${pair.symbol} sufficient`,
        status: "DONE",
      });
    }

    const allowanceCallsPromises = [];

    // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
    if (BigNumber(allowance).lt(pair.balance)) {
      const tokenContract = getTokenContract(web3, pair.address);

      const tokenPromise = new Promise((resolve, reject) => {
        callContractWait(
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
          (err) => {
            if (err) {
              console.log(err);
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

    // SUBMIT WITHDRAW TRANSACTION
    const sendAmount = BigNumber(pair.balance)
      .times(percent)
      .div(100)
      .times(10 ** pair.decimals)
      .toFixed(0);

    const routerContract = new web3.eth.Contract(
      CONTRACTS.ROUTER_ABI,
      CONTRACTS.ROUTER_ADDRESS
    );

    const quoteRemove = await routerContract.methods
      .quoteRemoveLiquidity(
        token0.address,
        token1.address,
        pair.isStable,
        sendAmount
      )
      .call();

    const sendSlippage = BigNumber(100).minus(slippage).div(100);
    const deadline = "" + moment().add(600, "seconds").unix();
    const sendAmount0Min = BigNumber(quoteRemove.amountA)
      .times(sendSlippage)
      .toFixed(0);
    const sendAmount1Min = BigNumber(quoteRemove.amountB)
      .times(sendSlippage)
      .toFixed(0);
    callContractWait(
      web3,
      routerContract,
      "removeLiquidity",
      [
        token0.address,
        token1.address,
        pair.isStable,
        sendAmount,
        sendAmount0Min,
        sendAmount1Min,
        account,
        deadline,
      ],
      account,
      gasPrice,
      null,
      null,
      withdrawTXID,
      emitter,
      dispatcher,
      async (err) => {
        if (err) {
          return emitter.emit(ACTIONS.ERROR, err);
        }

        await callback();

        emitter.emit(ACTIONS.LIQUIDITY_REMOVED);
      }
    );
  } catch (ex) {
    console.error("Remove liquidity error", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const unstakeLiquidity = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  callback
) => {
  try {

    const {amount, percent, pair} = payload.content;

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let unstakeTXID = getTXUUID();

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Unstake liquidity from gauge`,
      type: "Liquidity",
      verb: "Liquidity Unstaked",
      transactions: [
        {
          uuid: unstakeTXID,
          description: `Unstake LP tokens from the gauge`,
          status: "WAITING",
        },
      ],
    });

    // SUBMIT DEPOSIT TRANSACTION
    const sendAmount = parseBN(amount, pair.decimals);

    const gaugeContract = new web3.eth.Contract(CONTRACTS.GAUGE_ABI, pair.gauge.address);

    if (parseFloat(percent) === 100) {
      callContractWait(
        web3,
        gaugeContract,
        "withdrawAll",
        [],
        account,
        gasPrice,
        null,
        null,
        unstakeTXID,
        emitter,
        dispatcher,
        async (err) => {
          if (err) {
            return emitter.emit(ACTIONS.ERROR, err);
          }

          await callback();

          emitter.emit(ACTIONS.LIQUIDITY_UNSTAKED);
        }
      );
    } else {
      callContractWait(
        web3,
        gaugeContract,
        "withdraw",
        [sendAmount],
        account,
        gasPrice,
        null,
        null,
        unstakeTXID,
        emitter,
        dispatcher,
        async (err) => {
          if (err) {
            return emitter.emit(ACTIONS.ERROR, err);
          }

          await callback();

          emitter.emit(ACTIONS.LIQUIDITY_UNSTAKED);
        }
      );
    }
  } catch (ex) {
    console.error(ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const createGauge = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  callback
) => {
  try {
    const {pair} = payload.content;

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let createGaugeTXID = getTXUUID();

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Create liquidity gauge for ${pair.token0.symbol}/${pair.token1.symbol}`,
      type: "Liquidity",
      verb: "Gauge Created",
      transactions: [
        {
          uuid: createGaugeTXID,
          description: `Create gauge`,
          status: "WAITING",
        },
      ],
    });

    const gaugesContract = new web3.eth.Contract(
      CONTRACTS.VOTER_ABI,
      CONTRACTS.VOTER_ADDRESS
    );
    callContractWait(
      web3,
      gaugesContract,
      "createGauge",
      [pair.address],
      account,
      gasPrice,
      null,
      null,
      createGaugeTXID,
      emitter,
      dispatcher,
      async (err) => {
        if (err) {
          return emitter.emit(ACTIONS.ERROR, err);
        }

        await callback();

        emitter.emit(ACTIONS.CREATE_GAUGE_RETURNED);
      }
    );
  } catch (ex) {
    console.error(ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};
