import BigNumber from "bignumber.js";
import {ACTIONS, CONTRACTS} from "../constants";
import {formatBN, getTXUUID} from '../../utils';
import {getPairContract, loadUserInfoFromSubgraph} from "./pair-helper";
import {enrichLogoUri} from "./token-helper";
import {multicallRequest} from "./multicall-helper";
import {callContractWait} from "./web3-helper";

function bribeModel(
  symbol,
  token0,
  token1,
  totalSupply,
  gaugeTotalSupply,
  balance,
  gaugeReserve0,
  gaugeReserve1,
  bribeAddress
) {
  return {
    rewardType: "Bribe",
    symbol: symbol,
    token0: token0,
    token1: token1,
    balance: balance,
    reserve0: "0",
    reserve1: "0",
    gauge: {
      bribeAddress: bribeAddress,
      balance: balance,
      totalSupply: gaugeTotalSupply,
      reserve0: gaugeReserve0,
      reserve1: gaugeReserve1,
      bribesEarned: []
    }
  }
}

async function getVeDistRewards(
  web3,
  tokenID,
  vestNFTs,
  govToken,
  veToken
) {
  const veDistReward = [];
  if (!tokenID || parseInt(tokenID) === 0) {
    return veDistReward;
  }
  const veDistContract = new web3.eth.Contract(
    CONTRACTS.VE_DIST_ABI,
    CONTRACTS.VE_DIST_ADDRESS
  );
  const veDistEarned = await veDistContract.methods.claimable(tokenID).call();
  let theNFT = vestNFTs.filter((vestNFT) => parseInt(vestNFT.id) === parseInt(tokenID));


  if (BigNumber(veDistEarned).gt(0)) {
    veDistReward.push({
      token: theNFT[0],
      lockToken: veToken,
      rewardToken: govToken,
      earned: formatBN(veDistEarned),
      rewardType: "Distribution",
    });
  }
  return veDistReward;
}

async function collectBribeRewards(tokenID, userInfo, web3, baseAssets) {
  if (!tokenID || parseInt(tokenID) === 0) {
    return [];
  }
  let tokenIdAdr = null;
  const bribes = userInfo?.nfts?.filter(nft => parseInt(nft.id) === parseInt(tokenID))[0]?.bribes ?? [];
  const result = [];


  for (const bribeEntity of bribes) {
    const bribe = bribeEntity.bribe
    const bribeContract = new web3.eth.Contract(CONTRACTS.BRIBE_ABI, bribe.id);

    if (tokenIdAdr === null) {
      tokenIdAdr = await bribeContract.methods.tokenIdToAddress(tokenID).call()
    }

    const gaugePosition = userInfo?.gaugePositions?.filter(pos => pos.gauge.pair.id.toLowerCase() === bribe.pair.id)[0];
    const balance = gaugePosition?.balance ?? "0";
    const gaugeTotalSupply = gaugePosition?.gauge?.totalSupply ?? "0";

    const gaugeRatio = BigNumber(gaugeTotalSupply).div(bribe.pair.totalSupply)
    const gaugeReserve0 = BigNumber(bribe.pair.reserve0).times(gaugeRatio).toString();
    const gaugeReserve1 = BigNumber(bribe.pair.reserve1).times(gaugeRatio).toString();

    enrichLogoUri(baseAssets, bribe.pair.token0);
    enrichLogoUri(baseAssets, bribe.pair.token1);

    const model = bribeModel(
      bribe.pair.symbol,
      bribe.pair.token0,
      bribe.pair.token1,
      bribe.pair.totalSupply,
      gaugeTotalSupply,
      balance,
      gaugeReserve0,
      gaugeReserve1,
      bribe.id
    );
    for (const rt of bribe.bribeTokens) {
      const earned = await bribeContract.methods.earned(rt.token.id, tokenIdAdr).call();
      if (!BigNumber(earned).isZero()) {
        enrichLogoUri(baseAssets, rt.token);

        model.gauge.bribesEarned.push({
          earned: formatBN(earned, rt.token.decimals),
          token: {
            address: rt.token.id,
            symbol: rt.token.symbol,
            logoURI: rt.token.logoURI,
          },
        })
      }
    }
    result.push(model);
  }

  return result;
}

async function collectSwapFeesRewards(pairs, web3, userAdr, multicall, baseAssets) {
  const filteredFees = [];
  const pairsWithPositions = pairs.filter(p => !!p.userPosition);

  const results = await multicallRequest(multicall, pairsWithPositions, (calls, el) => {
    const pairContract = getPairContract(web3, el.id);
    calls.push(pairContract.methods.claimable0(userAdr))
    calls.push(pairContract.methods.claimable1(userAdr))
  })

  for (let i = 0; i < pairsWithPositions.length; i++) {
    let pair = Object.assign({}, pairsWithPositions[i]);

    pair.claimable0 = formatBN(results[i * 2], pair.token0.decimals);
    pair.claimable1 = formatBN(results[i * 2 + 1], pair.token1.decimals);

    if (
      BigNumber(pair.claimable0).gt(0) ||
      BigNumber(pair.claimable1).gt(0)
    ) {
      enrichLogoUri(baseAssets, pair.token0);
      enrichLogoUri(baseAssets, pair.token1);
      pair.rewardType = "Fees";
      filteredFees.push(pair);
    }
  }
  return filteredFees;
}

async function collectGaugeRewards(
  multicall,
  pairs,
  web3,
  userAddress,
  baseAssets
) {
  const pairsWithPositions = pairs?.filter(p => !!p.userPosition && !!p.gauge).map(p => Object.assign({}, p)) ?? [];
  const results = await multicallRequest(multicall, pairsWithPositions, (calls, pair) => {
    const gaugeContract = new web3.eth.Contract(CONTRACTS.GAUGE_ABI, pair.gauge.id);
    for (const rt of pair.gauge.rewardTokens) {
      calls.push(gaugeContract.methods.earned(rt.token.id, userAddress))
    }
  })

  let count = 0;
  pairsWithPositions.forEach((pair) => {
    pair.rewardType = "Reward";
    pair.gauge.rewardTokens.forEach((rt, i) => {
      rt.rewardsEarned = formatBN(results[i + count], rt.token.decimals);
      if (!BigNumber(rt.rewardsEarned).isZero()) {
        enrichLogoUri(baseAssets, rt.token);
      }
    });
    count += pair.gauge.rewardTokens.length;
  })

  return pairsWithPositions
    .filter(pair => pair.gauge.rewardTokens.reduce((a, b) => a + +b.rewardsEarned, 0) > 0)
}

export const getRewardBalances = async (
  payload,
  account,
  web3,
  emitter,
  pairs,
  veToken,
  govToken,
  vestNFTs,
  baseAssets,
  multicall
) => {
  // console.log('getRewardBalances')
  const userAddress = account;
  const {tokenID} = payload.content;
  if (!userAddress || tokenID == null || !pairs || !veToken || !govToken || !vestNFTs || !baseAssets) {
    return null;
  }
  try {

    const userInfo = await loadUserInfoFromSubgraph(userAddress);

    const result = [];

    // VE DIST
    const veDist = await getVeDistRewards(
      web3,
      tokenID,
      vestNFTs,
      govToken,
      veToken
    );
    if (veDist && veDist.length > 0) {
      result.push(...veDist);
    }

    // GAUGE REWARDS
    const gauges = await collectGaugeRewards(
      multicall,
      pairs,
      web3,
      userAddress,
      baseAssets
    );
    if (gauges && gauges.length > 0) {
      result.push(...gauges);
    }

    // BRIBES
    const bribes = await collectBribeRewards(tokenID, userInfo, web3, baseAssets);
    if (bribes && bribes.length > 0) {
      result.push(...bribes);
    }

    // SWAP FEES
    const swapFees = await collectSwapFeesRewards(
      pairs,
      web3,
      userAddress,
      multicall,
      baseAssets
    )
    if (swapFees && swapFees.length > 0) {
      result.push(...swapFees);
    }

    return result;
  } catch (ex) {
    console.error("Collect rewards info error", ex);
    emitter.emit(ACTIONS.ERROR, "Error collect rewards info");
  }
};

export const claimBribes = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  callback
) => {
  try {
    const {pair, tokenID} = payload.content;

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let claimTXID = getTXUUID();

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Claim rewards for ${pair.token0.symbol}/${pair.token1.symbol}`,
      verb: "Rewards Claimed",
      transactions: [
        {
          uuid: claimTXID,
          description: `Claiming your bribes`,
          status: "WAITING",
        },
      ],
    });

    // SUBMIT CLAIM TRANSACTION
    const gaugesContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS);
    const sendGauges = [pair.gauge.bribeAddress];
    const sendTokens = [pair.gauge.bribesEarned.map((bribe) => bribe.token.address)];

    await callContractWait(
      web3,
      gaugesContract,
      "claimBribes",
      [sendGauges, sendTokens, tokenID],
      account,
      gasPrice,
      null,
      null,
      claimTXID,
      emitter,
      dispatcher,
      async (err) => {
        if (err) {
          return emitter.emit(ACTIONS.ERROR, err);
        }
        await callback(tokenID)
        emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED);
      }
    );
  } catch (ex) {
    console.error("Claim bribes error", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const claimAllRewards = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  callback
) => {
  try {
    const {pairs, tokenID} = payload.content;

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let claimTXID = getTXUUID();
    let feeClaimTXIDs = [];
    let rewardClaimTXIDs = [];
    let distributionClaimTXIDs = [];

    let bribePairs = pairs.filter((pair) => pair.rewardType === "Bribe");

    let feePairs = pairs.filter((pair) => pair.rewardType === "Fees");

    let rewardPairs = pairs.filter((pair) => pair.rewardType === "Reward");

    let distribution = pairs.filter((pair) => pair.rewardType === "Distribution");

    const sendGauges = bribePairs.map((pair) => pair.gauge.bribeAddress);
    const sendTokens = bribePairs.map((pair) => pair.gauge.bribesEarned.map((bribe) => bribe.token.address));

    if (
      distribution.length === 0 &&
      bribePairs.length === 0 &&
      feePairs.length === 0 &&
      rewardPairs.length === 0
    ) {
      emitter.emit(ACTIONS.ERROR, "Nothing to claim");
      emitter.emit(ACTIONS.CLAIM_ALL_REWARDS_RETURNED);
      return;
    }

    let sendOBJ = {
      title: `Claim all rewards`,
      verb: "Rewards Claimed",
      transactions: [],
    };

    if (bribePairs.length > 0) {
      sendOBJ.transactions.push({
        uuid: claimTXID,
        description: `Claiming all your available bribes`,
        status: "WAITING",
      });
    }


    for (let i = 0; i < feePairs.length; i++) {
      const newClaimTX = getTXUUID();
      feeClaimTXIDs.push(newClaimTX);
      sendOBJ.transactions.push({
        uuid: newClaimTX,
        description: `Claiming fees for ${feePairs[i].symbol}`,
        status: "WAITING",
      });
    }


    for (let i = 0; i < rewardPairs.length; i++) {
      const newClaimTX = getTXUUID();
      rewardClaimTXIDs.push(newClaimTX);
      sendOBJ.transactions.push({
        uuid: newClaimTX,
        description: `Claiming reward for ${rewardPairs[i].symbol}`,
        status: "WAITING",
      });
    }

    for (let i = 0; i < distribution.length; i++) {
      const newClaimTX = getTXUUID();
      distributionClaimTXIDs.push(newClaimTX);
      sendOBJ.transactions.push({
        uuid: newClaimTX,
        description: `Claiming distribution for NFT #${distribution[i].token.id}`,
        status: "WAITING",
      });
    }

    emitter.emit(ACTIONS.TX_ADDED, sendOBJ);

    if (bribePairs.length > 0) {
      const voterContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS);
      await callContractWait(
        web3,
        voterContract,
        "claimBribes",
        [sendGauges, sendTokens, tokenID],
        account,
        gasPrice,
        null,
        null,
        claimTXID,
        emitter,
        dispatcher,
        async (err) => {
          if (err) {
            return emitter.emit(ACTIONS.ERROR, err);
          }
          await callback(tokenID);
        }
      )
    }

    for (let i = 0; i < feePairs.length; i++) {
      const pairContract = new web3.eth.Contract(CONTRACTS.PAIR_ABI, feePairs[i].address);
      callContractWait(
        web3,
        pairContract,
        "claimFees",
        [],
        account,
        gasPrice,
        null,
        null,
        feeClaimTXIDs[i],
        emitter,
        dispatcher,
        async (err) => {
          if (err) {
            return emitter.emit(ACTIONS.ERROR, err);
          }
          await callback(tokenID);
        }
      );
    }


    for (let i = 0; i < rewardPairs.length; i++) {
      const gaugeContract = new web3.eth.Contract(CONTRACTS.GAUGE_ABI, rewardPairs[i].gauge.address);
      const sendTok = rewardPairs[i].gauge.rewardTokens.map(t => t.token.id);

      callContractWait(
        web3,
        gaugeContract,
        "getReward",
        [account, sendTok],
        account,
        gasPrice,
        null,
        null,
        rewardClaimTXIDs[i],
        emitter,
        dispatcher,
        async (err) => {
          if (err) {
            return emitter.emit(ACTIONS.ERROR, err);
          }
          await callback(tokenID);
        }
      )
    }

    for (let i = 0; i < distribution.length; i++) {
      const veDistContract = new web3.eth.Contract(CONTRACTS.VE_DIST_ABI, CONTRACTS.VE_DIST_ADDRESS);
      callContractWait(
        web3,
        veDistContract,
        "claim",
        [tokenID],
        account,
        gasPrice,
        null,
        null,
        distributionClaimTXIDs[i],
        emitter,
        dispatcher,
        async (err) => {
          if (err) {
            return emitter.emit(ACTIONS.ERROR, err);
          }
          await callback(tokenID);
        }
      );
    }

    emitter.emit(ACTIONS.CLAIM_ALL_REWARDS_RETURNED);
  } catch (ex) {
    console.error("Claim error", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const claimRewards = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  callback
) => {
  try {

    const {pair, tokenID} = payload.content;

    let claimTXID = getTXUUID();

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Claim rewards for ${pair.token0.symbol}/${pair.token1.symbol}`,
      verb: "Rewards Claimed",
      transactions: [
        {
          uuid: claimTXID,
          description: `Claiming your rewards`,
          status: "WAITING",
        },
      ],
    });

    // SUBMIT CLAIM TRANSACTION
    const gaugeContract = new web3.eth.Contract(CONTRACTS.GAUGE_ABI, pair.gauge.address);

    const sendTokens = pair.gauge.rewardTokens.map(t => t.token.id);

    await callContractWait(
      web3,
      gaugeContract,
      "getReward",
      [account, sendTokens],
      account,
      gasPrice,
      null,
      null,
      claimTXID,
      emitter,
      dispatcher,
      async (err) => {
        if (err) {
          return emitter.emit(ACTIONS.ERROR, err);
        }
        await callback(tokenID);
        emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED);
      }
    );
  } catch (ex) {
    console.error("Claim gauge rewards error", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const claimVeDist = async (
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

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let claimTXID = getTXUUID();

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Claim distribution for NFT #${tokenID}`,
      verb: "Rewards Claimed",
      transactions: [
        {
          uuid: claimTXID,
          description: `Claiming your distribution`,
          status: "WAITING",
        },
      ],
    });

    // SUBMIT CLAIM TRANSACTION
    const veDistContract = new web3.eth.Contract(CONTRACTS.VE_DIST_ABI, CONTRACTS.VE_DIST_ADDRESS);

    await callContractWait(
      web3,
      veDistContract,
      "claim",
      [tokenID],
      account,
      gasPrice,
      null,
      null,
      claimTXID,
      emitter,
      dispatcher,
      async (err) => {
        if (err) {
          return emitter.emit(ACTIONS.ERROR, err);
        }

        await callback(tokenID)
        emitter.emit(ACTIONS.CLAIM_VE_DIST_RETURNED);
      }
    );
  } catch (ex) {
    console.error("Claim dis rewards error", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const claimPairFees = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  callback
) => {
  try {
    const {pair, tokenID} = payload.content;

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let claimTXID = getTXUUID();

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Claim fees for ${pair.token0.symbol}/${pair.token1.symbol}`,
      verb: "Fees Claimed",
      transactions: [
        {
          uuid: claimTXID,
          description: `Claiming your fees`,
          status: "WAITING",
        },
      ],
    });

    // SUBMIT CLAIM TRANSACTION
    const pairContract = new web3.eth.Contract(CONTRACTS.PAIR_ABI, pair.address);

    await callContractWait(
      web3,
      pairContract,
      "claimFees",
      [],
      account,
      gasPrice,
      null,
      null,
      claimTXID,
      emitter,
      dispatcher,
      async (err) => {
        if (err) {
          return emitter.emit(ACTIONS.ERROR, err);
        }

        await callback(tokenID)
        emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED);
      }
    );
  } catch (ex) {
    console.error("Claim pair fees error", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

