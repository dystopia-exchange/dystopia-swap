import BigNumber from "bignumber.js";
import {callContractWait} from "./web3-helper";
import {ACTIONS, CONTRACTS} from "../constants";
import {getTXUUID} from '../../utils';
import {loadUserInfoFromSubgraph} from "./pair-helper";

function getVoterContract(web3) {
  return new web3.eth.Contract(
    CONTRACTS.VOTER_ABI,
    CONTRACTS.VOTER_ADDRESS
  )
}

export const vote = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice
) => {
  try {
    const {tokenID, votes} = payload.content;

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let voteTXID = getTXUUID();

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Cast vote using token #${tokenID}`,
      verb: "Votes Cast",
      transactions: [
        {
          uuid: voteTXID,
          description: `Cast votes`,
          status: "WAITING",
        },
      ],
    });

    const voterContract = getVoterContract(web3);
    let onlyVotes = votes.filter((vote) => BigNumber(vote.value).gt(0) || BigNumber(vote.value).lt(0));
    let pools = onlyVotes.map((vote) => vote.address);
    let voteCounts = onlyVotes.map((vote) => BigNumber(vote.value).times(100).toFixed(0));

    callContractWait(
      web3,
      voterContract,
      "vote",
      [tokenID, pools, voteCounts],
      account,
      gasPrice,
      null,
      null,
      voteTXID,
      emitter,
      dispatcher,
      (err) => {
        if (err) {
          return emitter.emit(ACTIONS.ERROR, err);
        }

        emitter.emit(ACTIONS.VOTE_RETURNED);
      }
    );
  } catch (ex) {
    console.error("Vote error", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const resetVote = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice
) => {
  try {
    const {tokenID} = payload.content;

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let voteTXID = getTXUUID();

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `Reset vote using token #${tokenID}`,
      verb: "Reset Votes",
      transactions: [
        {
          uuid: voteTXID,
          description: `Reset votes`,
          status: "WAITING",
        },
      ],
    });

    // SUBMIT INCREASE TRANSACTION
    await callContractWait(
      web3,
      getVoterContract(web3),
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
          return emitter.emit(ACTIONS.ERROR, err);
        }

        emitter.emit(ACTIONS.VOTE_RETURNED);
      }
    );
  } catch (ex) {
    console.error("Error reset votes", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const getVestVotes = async (
  payload,
  account,
  web3,
  emitter,
  pairs,
  multicall,
  isOnChain
) => {
  if (isOnChain) {
    return getVestVotesOnChain(
      payload,
      web3,
      emitter,
      pairs,
      multicall
    )
  } else {
    return getVestVotesSubgraph(
      payload,
      account,
      emitter,
      pairs
    );
  }
}

const getVestVotesSubgraph = async (
  payload,
  account,
  emitter,
  pairs
) => {
  const userAddress = account;
  const {tokenID} = payload.content;
  if (!tokenID || !userAddress) {
    return [];
  }

  try {
    const userInfo = await loadUserInfoFromSubgraph(userAddress)
    const veInfo = userInfo?.nfts?.filter(nft => nft.id === tokenID)[0]
    let votes = pairs.map(pair => {
      return {
        address: pair.id,
        votePercent: "0"
      }
    });
    if (!!veInfo && !!veInfo.votes) {
      for (const vote of veInfo.votes) {
        votes.filter(v => v.address.toLowerCase() === vote.pool.id.toLowerCase()).map(v => {
          v.votePercent = vote.weightPercent
          return v;
        });
      }
    }


    emitter.emit(ACTIONS.VEST_VOTES_RETURNED, votes);
  } catch (ex) {
    console.error("Error load votes from subgraph", ex);
    throw ex;
  }
};

const getVestVotesOnChain = async (
  payload,
  web3,
  emitter,
  pairs,
  multicall
) => {
  const {tokenID} = payload.content;
  if (!pairs || !tokenID) {
    return [];
  }

  try {
    const filteredPairs = pairs.filter((pair) => pair && pair.gauge && pair.gauge.address);
    const voterContract = getVoterContract(web3);

    const voteCounts = [];
    let calls = [];
    for (let i = 0; i < filteredPairs.length; i++) {
      const pair = filteredPairs[i];
      const call = voterContract.methods.votes(tokenID, pair.address)
      calls.push(call);
      if (calls.length > 50) {
        voteCounts.push(...(await multicall.aggregate(calls)))
        calls = [];
      }
    }

    voteCounts.push(...(await multicall.aggregate(calls)))

    let votes = pairs.map(pair => {
      return {
        address: pair.id,
        votePercent: "0"
      }
    });

    const totalVotes = voteCounts.reduce((curr, acc) => {
      const num = BigNumber(acc).gt(0)
        ? acc
        : BigNumber(acc).times(-1).toNumber(0);
      return curr.plus(num);
    }, BigNumber(0));

    for (let i = 0; i < voteCounts.length; i++) {
      const vote = BigNumber(voteCounts[i]);
      const num = vote.gt(0)
        ? vote
        : vote.times(-1)

      votes.filter(v => v.address.toLowerCase() === filteredPairs[i].address.toLowerCase()).map(v => {
        v.votePercent = num.div(totalVotes).times(100).toString()
        return v;
      });
    }
    emitter.emit(ACTIONS.VEST_VOTES_RETURNED, votes);
  } catch (ex) {
    console.error("Error load votes", ex);
    throw ex
  }
};
