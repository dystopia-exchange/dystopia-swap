import BigNumber from "bignumber.js";
import {calculateApr, formatBN} from '../../utils';
import {createClient} from "urql";
import {BLACK_LIST_TOKENS, CONTRACTS, QUERIES, ZERO_ADDRESS} from "../constants";
import {getEthPrice, getOrCreateBaseAsset, isNetworkToken} from "./token-helper";
import {multicallRequest} from "./multicall-helper";
import {WFTM_ADDRESS} from "../constants/contracts";

const client = createClient({url: process.env.NEXT_PUBLIC_API});

export function getPairContract(web3, pairAddress) {
  return new web3.eth.Contract(CONTRACTS.PAIR_ABI, pairAddress);
}

function getGaugeContract(web3, gaugeAddress) {
  return new web3.eth.Contract(CONTRACTS.GAUGE_ABI, gaugeAddress);
}

function getVoterContract(web3) {
  return new web3.eth.Contract(
    CONTRACTS.VOTER_ABI,
    CONTRACTS.VOTER_ADDRESS
  );
}

function findPair(pairs, pairAddress) {
  return pairs?.filter((pair) => pair?.address?.toLowerCase() === pairAddress?.toLowerCase()).reduce((a, b) => b, null);
}

function getPairByTokens(pairs, t0, t1, stable) {
  if (!t0 || !t1) {
    return null;
  }
  return pairs.filter((pair) => (pair?.token0?.address?.toLowerCase() === t0.toLowerCase() &&
      pair?.token1?.address?.toLowerCase() === t1.toLowerCase() &&
      pair?.isStable === stable) ||
    (pair?.token0?.address?.toLowerCase() === t1.toLowerCase() &&
      pair?.token1?.address?.toLowerCase() === t0.toLowerCase() &&
      pair?.isStable === stable))
    .reduce((a, b) => b, null);
}

async function updatePairFields(pair, web3, account) {
  // console.log('updatePairFields', pair, account);
  try {
    const pairCtr = getPairContract(web3, pair.address);

    const [totalSupply, reserve0, reserve1, balanceOf] = await Promise.all([
      pairCtr.methods.totalSupply().call(),
      pairCtr.methods.reserve0().call(),
      pairCtr.methods.reserve1().call(),
      pairCtr.methods.balanceOf(account).call(),
    ]);
    pair.balance = formatBN(balanceOf, pair.decimals);
    pair.totalSupply = formatBN(totalSupply, pair.decimals);
    pair.reserve0 = formatBN(reserve0, pair.token0.decimals)
    pair.reserve1 = formatBN(reserve1, pair.token1.decimals)
  } catch (e) {
    console.error("Update pair error", e);
    throw e;
  }
  return pair;
}

async function loadPairFromSubgraph(pairAddress) {
  const resp = (await client.query(QUERIES.pairQuery, {id: pairAddress.toLowerCase()}).toPromise());
  if (!!resp.error) {
    console.log("Pair query error", resp.error);
  } else {
    // console.log('Pair query', resp)
  }
  return resp.data;
}

// it is very rare case when a pair just created, use on-chain info for the most fresh data
async function loadFullPairInfo(pairAddress, web3, account, baseAssets) {
  console.log("LOAD FULL PAIR INFO")
  const pairContract = getPairContract(web3, pairAddress);
  const gaugesContract = getVoterContract(web3);

  const [totalWeight] = await Promise.all([
    gaugesContract.methods.totalWeight().call(),
  ]);

  const [
    token0,
    token1,
    totalSupply,
    symbol,
    reserve0,
    reserve1,
    decimals,
    balanceOf,
    stable,
    gaugeAddress,
    gaugeWeight,
    claimable0,
    claimable1,
  ] = await Promise.all([
    pairContract.methods.token0().call(),
    pairContract.methods.token1().call(),
    pairContract.methods.totalSupply().call(),
    pairContract.methods.symbol().call(),
    pairContract.methods.reserve0().call(),
    pairContract.methods.reserve1().call(),
    pairContract.methods.decimals().call(),
    pairContract.methods.balanceOf(account).call(),
    pairContract.methods.stable().call(),
    gaugesContract.methods.gauges(pairAddress).call(),
    gaugesContract.methods.weights(pairAddress).call(),
    pairContract.methods.claimable0(account).call(),
    pairContract.methods.claimable1(account).call(),
  ]);

  const token0Contract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token0);
  const token1Contract = new web3.eth.Contract(CONTRACTS.ERC20_ABI, token1);

  const [
    token0Symbol,
    token0Decimals,
    token0Balance,
    token1Symbol,
    token1Decimals,
    token1Balance,
  ] = await Promise.all([
    token0Contract.methods.symbol().call(),
    token0Contract.methods.decimals().call(),
    token0Contract.methods.balanceOf(account).call(),
    token1Contract.methods.symbol().call(),
    token1Contract.methods.decimals().call(),
    token1Contract.methods.balanceOf(account).call(),
  ]);

  const thePair = {
    address: pairAddress,
    symbol: symbol,
    decimals: parseInt(decimals),
    isStable: stable,
    token0: {
      address: token0,
      symbol: token0Symbol,
      balance: BigNumber(token0Balance)
        .div(10 ** token0Decimals)
        .toFixed(parseInt(token0Decimals)),
      decimals: parseInt(token0Decimals),
    },
    token1: {
      address: token1,
      symbol: token1Symbol,
      balance: BigNumber(token1Balance)
        .div(10 ** token1Decimals)
        .toFixed(parseInt(token1Decimals)),
      decimals: parseInt(token1Decimals),
    },
    balance: BigNumber(balanceOf)
      .div(10 ** decimals)
      .toFixed(parseInt(decimals)),
    totalSupply: BigNumber(totalSupply)
      .div(10 ** decimals)
      .toFixed(parseInt(decimals)),
    reserve0: BigNumber(reserve0)
      .div(10 ** token0Decimals)
      .toFixed(parseInt(token0Decimals)),
    reserve1: BigNumber(reserve1)
      .div(10 ** token1Decimals)
      .toFixed(parseInt(token1Decimals)),
    claimable0: BigNumber(claimable0)
      .div(10 ** token0Decimals)
      .toFixed(parseInt(token0Decimals)),
    claimable1: BigNumber(claimable1)
      .div(10 ** token1Decimals)
      .toFixed(parseInt(token1Decimals)),
  };

  if (gaugeAddress !== ZERO_ADDRESS) {
    const gaugeContract = new web3.eth.Contract(
      CONTRACTS.GAUGE_ABI,
      gaugeAddress
    );

    const [totalSupply, gaugeBalance, bribeAddress] = await Promise.all([
      gaugeContract.methods.totalSupply().call(),
      gaugeContract.methods.balanceOf(account).call(),
      gaugesContract.methods.bribes(gaugeAddress).call(),
    ]);

    const bribeContract = new web3.eth.Contract(
      CONTRACTS.BRIBE_ABI,
      bribeAddress
    );

    const tokensLength = await bribeContract.methods
      .rewardsListLength()
      .call();
    const arry = Array.from(
      {length: parseInt(tokensLength)},
      (v, i) => i
    );

    const bribes = await Promise.all(
      arry.map(async (idx) => {
        const tokenAddress = await bribeContract.methods
          .rewards(idx)
          .call();
        const token = await getOrCreateBaseAsset(baseAssets, tokenAddress, web3, account, false);

        const [rewardRate] = await Promise.all([
          bribeContract.methods.rewardRate(tokenAddress).call(),
        ]);

        return {
          token: token,
          rewardRate: BigNumber(rewardRate)
            .div(10 ** token.decimals)
            .toFixed(token.decimals),
          rewardAmount: BigNumber(rewardRate)
            .times(604800)
            .div(10 ** token.decimals)
            .toFixed(token.decimals),
        };
      })
    );

    thePair.gauge = {
      address: gaugeAddress,
      bribeAddress: bribeAddress,
      decimals: 18,
      balance: BigNumber(gaugeBalance)
        .div(10 ** 18)
        .toFixed(18),
      totalSupply: BigNumber(totalSupply)
        .div(10 ** 18)
        .toFixed(18),
      weight: BigNumber(gaugeWeight)
        .div(10 ** 18)
        .toFixed(18),
      weightPercent: BigNumber(gaugeWeight)
        .times(100)
        .div(totalWeight)
        .toFixed(2),
      bribes: bribes,
    };
  }
  return thePair;
}

export async function getPairAddressByTokens(web3, addressA, addressB, stable) {
  if (!addressA || !addressB) {
    return null;
  }
  const factoryContract = new web3.eth.Contract(
    CONTRACTS.FACTORY_ABI,
    CONTRACTS.FACTORY_ADDRESS
  );
  return await factoryContract.methods
    .getPair(addressA, addressB, stable)
    .call();
}

export const loadPair = async (
  addressA,
  addressB,
  stable,
  web3,
  account,
  pairs,
  baseAssets
) => {
  // console.log('>>> GET PAIR')
  if (!account || !web3) {
    return null;
  }
  if (isNetworkToken(addressA)) {
    addressA = WFTM_ADDRESS;
  }
  if (isNetworkToken(addressB)) {
    addressB = WFTM_ADDRESS;
  }

// if pair exist just update fields and return
  let existPair = getPairByTokens(pairs, addressA, addressB, stable)
  if (existPair !== null) {
    // console.log('pair exist', existPair)
    return updatePairFields(existPair, web3, account)
  }

  const pairAddress = await getPairAddressByTokens(web3, addressA, addressB, stable);

  if (!pairAddress || pairAddress === ZERO_ADDRESS) {
    // console.log('pair not found');
    return null;
  }

  const thePair = await loadFullPairInfo(pairAddress, web3, account, baseAssets);

  pairs.push(thePair);
  return thePair;
};

export const getAndUpdatePair = async (
  pairAddress,
  web3,
  account,
  pairs
) => {
  // console.log(">>> GET AND UPDATE PAIR");
  if (!account || !web3) {
    return null;
  }

  // if pair exist just update fields and return
  const existPair = findPair(pairs, pairAddress)
  if (existPair !== null) {
    return updatePairFields(existPair, web3, account)
  }
  // if pair not exist return null, use getPair function
  return null
};

async function getPairsSubgraph() {
  const pairsCall = await client.query(QUERIES.pairsQuery).toPromise();
  if (!!pairsCall.error) {
    console.log('QUERY PAIRS ERROR', pairsCall.error);
  } else {
    // console.log('QUERY PAIRS ERROR', pairsCall);
  }
  const pairs = pairsCall.data.pairs;
  // for compatability fill some fields
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    pair.address = pair.id;
    pair.decimals = 18;
    pair.rewardType = null;
    if (!!pair.gauge) {
      pair.gauge.address = pair.gauge?.id;
      pair.gauge.bribeAddress = pair.gauge?.bribe?.id;
      pair.gauge.balance = 0;
      pair.gauge.apr = 0;
      pair.gauge.reserve0 = 0;
      pair.gauge.reserve1 = 0;
      pair.gauge.weight = 0;
      pair.gauge.weightPercent = 0;
      pair.gauge.bribesEarned = 0;
      pair.gauge.rewardsEarned = 0;


      pair.gauge.bribe.address = pair.gauge?.bribe?.id;
      pair.gauge.bribe.rewardRate = 0;
      pair.gauge.bribe.rewardAmount = 0;

      pair.gaugebribes.address = pair.gaugebribes?.id;
    }
    pair.token0.address = pair.token0.id;
    pair.token0.chainId = 'not_inited';
    pair.token0.balance = 0;
    pair.token0.logoURI = 'not_inited';

    pair.token1.address = pair.token1.id;
    pair.token1.chainId = 'not_inited';
    pair.token1.balance = 0;
    pair.token1.logoURI = 'not_inited';

    pair.claimable0 = 0;
    pair.claimable1 = 0;
  }
  return pairs;
}

function renameTokens(pairs) {
  const find = "miMATIC";
  const regex = new RegExp(find, "g");
  const regex1 = new RegExp("miMATIC", "g");
  try {
    return pairs.map((pair) => {
      pair.name = pair?.name.replace(regex1, "MAI");
      pair.symbol = pair?.symbol.replace(regex1, "MAI");
      pair.token0.name = pair?.token0?.name?.replace(regex, "MAI");
      pair.token0.symbol = pair?.token0?.symbol?.replace(regex, "MAI");
      pair.token1.name = pair?.token1?.name?.replace(regex, "MAI");
      pair.token1.symbol = pair?.token1?.symbol?.replace(regex, "MAI");
      pair.token0.name = pair?.token0?.name?.replace(regex1, "MAI");
      pair.token0.symbol = pair?.token0?.symbol?.replace(regex1, "MAI");
      pair.token1.name = pair?.token1?.name?.replace(regex1, "MAI");
      pair.token1.symbol = pair?.token1?.symbol?.replace(regex1, "MAI");
      return pair;
    });
  } catch (e) {
    console.log("Error rename tokens", e);
    throw e;
  }
}

export const getPairs = async () => {
  return renameTokens(await getPairsSubgraph()).filter((pair) =>
    BLACK_LIST_TOKENS.indexOf(pair.token0.address?.toLowerCase()) === -1
    && BLACK_LIST_TOKENS.indexOf(pair.token1.address?.toLowerCase()) === -1)
};

async function getTotalWight(web3) {
  const voterContract = new web3.eth.Contract(
    CONTRACTS.VOTER_ABI,
    CONTRACTS.VOTER_ADDRESS
  );
  return formatBN(await voterContract.methods.totalWeight().call());
}

export async function loadUserInfoFromSubgraph(userAddress) {
  const resp = (await client.query(QUERIES.userQuery, {id: userAddress.toLowerCase()}).toPromise());
  if (!!resp.error) {
    console.log("User query error", resp.error);
  } else {
    // console.log('User query', userAddress, resp.data.user)
  }
  return resp.data.user;
}

export function enrichPositionInfoToPairs(pairs, userInfo) {
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    pair.userPosition = userInfo?.liquidityPositions?.filter(p => p.pair.id.toLowerCase() === pair.id?.toLowerCase())?.reduce((a, b) => b, null);
  }
}

async function fetchBalancesForPairs(
  pairs,
  multicall,
  web3,
  userAddress
) {

  let balanceCalls = [];
  let balanceCallsPairs = [];
  const pairsWithPosition = [];

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    pair.balance = "0"
    if (!!pair.userPosition) {
      pairsWithPosition.push(pair);
    }
  }

  for (let i = 0; i < pairsWithPosition.length; i++) {
    const pair = pairsWithPosition[i];
    balanceCalls.push(getPairContract(web3, pair.id).methods.balanceOf(userAddress))
    balanceCallsPairs.push(pair);
    if (balanceCalls > 30) {
      const balances = await multicall.aggregate(balanceCalls);
      for (let j = 0; j < balanceCallsPairs.length; j++) {
        balanceCallsPairs[j].balance = formatBN(balances[j], balanceCallsPairs[j].decimals);
      }
      balanceCalls = [];
      balanceCallsPairs = [];
    }
  }
  if (balanceCalls.length > 0) {
    const balances = await multicall.aggregate(balanceCalls);
    for (let j = 0; j < balanceCallsPairs.length; j++) {
      balanceCallsPairs[j].balance = formatBN(balances[j], balanceCallsPairs[j].decimals);
    }
  }
}

async function fetchGaugeBalancesForPairs(
  pairs,
  multicall,
  web3,
  userAddress,
  nfts,
  userInfo
) {
  calcDerivedApr(pairs.filter(pair => pair.gauge && pair.gauge.address !== ZERO_ADDRESS));

  const pairsWithGauges = pairs.filter(pair => !!pair.userPosition && pair.gauge && pair.gauge.address !== ZERO_ADDRESS);

  const gaugeBalances = await multicallRequest(
    multicall,
    pairsWithGauges,
    (calls, pair) => calls.push(getGaugeContract(web3, pair.gauge.address).methods.balanceOf(userAddress))
  );

  for (let i = 0; i < pairsWithGauges.length; i++) {
    pairsWithGauges[i].gauge.balance = formatBN(gaugeBalances[i]);
  }

  const gaugesWithBalances = pairsWithGauges.filter(pair => !BigNumber(pair.gauge.balance).isZero());

  const gaugeVeIds = await multicallRequest(
    multicall,
    gaugesWithBalances,
    (calls, pair) => calls.push(getGaugeContract(web3, pair.gauge.address).methods.tokenIds(userAddress))
  );

  for (let i = 0; i < gaugesWithBalances.length; i++) {
    const pair = gaugesWithBalances[i];
    pair.gauge.veId = gaugeVeIds[i].toString();

    if (pair.gauge.veId !== '0') {
      const gaugePosition = userInfo?.gaugePositions?.filter(g => g.gauge.id.toLowerCase() === pair.gauge.id.toLowerCase())[0]
      if (!!gaugePosition) {


        const nft = nfts?.filter(nft => parseInt(nft.id) === parseInt(pair.gauge.veId))[0];

        pair.gauge.balanceEth = BigNumber(pair.gauge.balance).times(BigNumber(pair.reserveETH).div(pair.totalSupply)).toString();
        pair.gauge.baseBalance = BigNumber(pair.gauge.balance).times(0.4).toString();
        const totalSupplyBase = BigNumber(pair.gauge.totalSupply).times(0.6)
        pair.gauge.veRatio = nft.veRatio;
        pair.gauge.bonusBalance = totalSupplyBase.times(nft.veRatio).toString();
        const fullDerivedBalance = BigNumber(pair.gauge.bonusBalance).plus(pair.gauge.baseBalance);
        pair.gauge.userDerivedBalance = fullDerivedBalance.gt(pair.gauge.balance) ? pair.gauge.balance : fullDerivedBalance.toString();
        pair.gauge.userDerivedBalanceEth = BigNumber(pair.gauge.userDerivedBalance).times(BigNumber(pair.reserveETH).div(pair.totalSupply)).toString();


        let personalAPR = BigNumber(0);
        let aprWithoutBoost = BigNumber(0);
        for (const rt of pair.gauge.rewardTokens) {
          rt.userDerivedBalanceEth = pair.gauge.userDerivedBalanceEth

          const startTime = Math.floor(Date.now() / 1000);

          rt.userPartOfRewards = BigNumber(rt.rewardsLeftEth).times(rt.userDerivedBalanceEth).div(rt.totalDerivedSupplyEth).toString()
          rt.personalAPR = calculateApr(startTime, rt.finishPeriod, rt.userPartOfRewards, pair.gauge.balanceEth);


          const baseBalanceEth = BigNumber(pair.gauge.baseBalance).times(BigNumber(pair.reserveETH).div(pair.totalSupply));
          rt.userPartOfRewardsWithoutBoost = BigNumber(rt.rewardsLeftEth).times(baseBalanceEth).div(rt.totalDerivedSupplyEth).toString()
          rt.aprWithoutBoost = calculateApr(startTime, rt.finishPeriod, rt.userPartOfRewardsWithoutBoost, pair.gauge.balanceEth);

          personalAPR = personalAPR.plus(rt.personalAPR);
          aprWithoutBoost = aprWithoutBoost.plus(rt.aprWithoutBoost);
        }

        pair.gauge.personalAPR = personalAPR.toString();
        pair.gauge.aprWithoutBoost = aprWithoutBoost.toString();
        pair.gauge.boost = personalAPR.div(aprWithoutBoost).toString();
        // console.log("PAIR: ", pair.symbol, pair);
      }
    }
  }
}


function calcDerivedApr(pairs) {
  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];

    let derivedAPR = BigNumber(0);
    const totalDerivedSupplyEth = BigNumber(pair.gauge.totalDerivedSupply).times(BigNumber(pair.reserveETH).div(pair.totalSupply));
    for (const rt of pair.gauge.rewardTokens) {
      rt.totalDerivedSupplyEth = totalDerivedSupplyEth.toString();
      rt.rewardsLeftEth = BigNumber(rt.left).times(rt.token.derivedETH).toString();
      const startTime = Math.floor(Date.now() / 1000)
      rt.derivedAPR = calculateApr(startTime, rt.finishPeriod, rt.rewardsLeftEth, totalDerivedSupplyEth);
      derivedAPR = derivedAPR.plus(rt.derivedAPR);
    }

    if (derivedAPR.lt(0)) {
      derivedAPR = BigNumber(0)
    }

    pair.gauge.derivedAPR = derivedAPR.toString();
  }
}

export const enrichPairInfo = async (
  web3,
  account,
  pairs,
  multicall,
  baseAssets,
  nfts
) => {
  const userAddress = account;
  if (!userAddress || !web3) {
    return;
  }
  try {
    const userInfo = await loadUserInfoFromSubgraph(userAddress);
    enrichPositionInfoToPairs(pairs, userInfo)

    await fetchBalancesForPairs(
      pairs,
      multicall,
      web3,
      userAddress
    );

    await fetchGaugeBalancesForPairs(
      pairs,
      multicall,
      web3,
      userAddress,
      nfts,
      userInfo
    )

    await addTokenInfoToPairs(pairs, baseAssets, web3, userAddress)

    const ethPrice = getEthPrice();
    const totalWeight = await getTotalWight(web3);
    mapPairInfo(pairs, ethPrice, totalWeight);
  } catch (ex) {
    console.log("Error get pair infos", ex);
    throw e;
  }
};

async function addTokenInfoToPairs(pairs, baseAssets, web3, account) {
  await Promise.all(
    pairs.map(async (pair) => {
      const token0 = await getOrCreateBaseAsset(
        baseAssets,
        pair.token0.address,
        web3,
        account,
        false
      );
      const token1 = await getOrCreateBaseAsset(
        baseAssets,
        pair.token1.address,
        web3,
        account,
        false
      );
      pair.token0 = token0 != null ? token0 : pair.token0;
      pair.token1 = token1 != null ? token1 : pair.token1;
      return pair;
    })
  );
}

function mapPairInfo(pairs, ethPrice, totalWeight) {
  pairs.forEach((pair) => {
      pair.tvl = pair.reserveUSD;
      if (!pair.gauge || pair.gauge.address === ZERO_ADDRESS) {
        return;
      }

      pair.gauge.totalSupplyUSD = parseFloat(pair.gauge.totalSupply) / ethPrice;

      pair.gauge.reserve0 =
        parseFloat(pair.totalSupply) > 0
          ? parseFloat(
            BigNumber(parseFloat(pair.reserve0))
              .times(parseFloat(pair.gauge.totalSupply))
              .div(parseFloat(pair.totalSupply))
          ).toFixed(parseInt(pair.token0.decimals))
          : "0";
      pair.gauge.reserve1 =
        parseFloat(pair.totalSupply) > 0
          ? parseFloat(
            BigNumber(parseFloat(pair.reserve1))
              .times(parseFloat(pair.gauge.totalSupply))
              .div(parseFloat(pair.totalSupply))
          ).toFixed(parseInt(pair.token1.decimals))
          : "0";

      pair.gauge.weight = BigNumber(parseFloat(pair.gauge.voteWeight)).toString();
      pair.gauge.weightPercent =
        parseInt(pair.gauge.totalWeight) !== 0
          ? BigNumber(parseFloat(pair.gauge.voteWeight))
            .times(100)
            .div(totalWeight)
            .toFixed(2)
          : 0;

      if (pair.gauge.weight === '0') {
        pair.gauge.expectAPR = 0;
      }

      let apr = new BigNumber(0);
      const rts = pair.gauge.rewardTokens;
      for (let i = 0; i < rts.length; i++) {
        apr = apr.plus(BigNumber(parseFloat(rts[i].apr)))
      }

      pair.gauge.apr = apr.toString();
      pair.gauge.additionalApr0 = "0";
      pair.gauge.additionalApr1 = "0";

    }
  );
}
