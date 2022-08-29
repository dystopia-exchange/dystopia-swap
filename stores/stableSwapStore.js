import DEFAULT_TOKEN_LIST from './constants/tokenlist.json'
import {
  MAX_UINT256,
  ZERO_ADDRESS,
  ACTIONS,
  CONTRACTS,
  BASE_ASSETS_WHITELIST,
  BLACK_LIST_TOKENS,
  ROUTE_ASSETS, DIRECT_SWAP_ROUTES, ALLOWED_DUPLICATE_SYMBOLS
} from "./constants";
import { v4 as uuidv4 } from "uuid";

import * as moment from "moment";
import { formatCurrency, retry } from "../utils";
import stores from "./";

import BigNumber from "bignumber.js";
import { createClient } from "urql";
import { assertValidExecutionArguments } from "graphql/execution/execute";
import axios from "axios";
import pairContractAbi from "./abis/pairOldRouter.json";
import migratorAbi from "./abis/migrator.json";
import FactoryAbi from "./abis/FactoryAbi.json";
import { ConstructionOutlined } from "@mui/icons-material";
import {
  USD_PLUS_ADDRESS,
  USD_PLUS_BOOSTED_DATA_URL,
} from "./constants/contracts";
import {
  ST_MATIC_ADDRESS,
  ST_MATIC_BOOSTED_DATA_URL
} from "./constants/contracts";
import router from "next/router";
import { assetIcons } from '../public/images/assets/asset-icons'

const pairsQuery = `
{
  pairs(first: 1000) {
    id
    name
    symbol
    isStable
    reserve0
    reserve1
    token0Price
    token1Price
    totalSupply
    reserveUSD
    token0 {
      id
      symbol
      name
      decimals
      isWhitelisted
      derivedETH
    }
    token1 {
      id
      symbol
      name
      decimals
      isWhitelisted
      derivedETH
    }
    gauge {
      id
      totalSupply
      totalSupplyETH
      expectAPR
      voteWeight
      totalWeight
      bribe {
        id
      }
      rewardTokens {
        apr
      }
    }
    gaugebribes {
      id
      bribeTokens {
        apr
        left
        token {
          symbol
        }
      }
    }
  }
}
`;

const tokensQuery = `
  query {
    tokens{
      id
      symbol
      name
      decimals
      isWhitelisted
      derivedETH
    }
  }
`;
const bundleQuery = `
  query {
    bundle(id:1){
      ethPrice
    }
  }
`;

const veDistQuery = `
{
  veDistEntities {
    apr
  }
}
`;

const veQuery = `
query ve($id: ID!) {
  veNFTEntities(where: {id: $id}) {
    gauges {
      gauge {
        id
      }
    }
    bribes {
      id
    }    
  }
}
`;

const client = createClient({ url: process.env.NEXT_PUBLIC_API });

const removeDuplicate = (arr) => {
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

class Store {
  constructor(dispatcher, emitter) {
    this.dispatcher = dispatcher;
    this.emitter = emitter;

    this.store = {
      baseAssets: [],
      assets: [],
      govToken: null,
      veToken: null,
      pairs: [],
      vestNFTs: [],
      migratePair: [],
      rewards: {
        bribes: [],
        fees: [],
        rewards: [],
      },
      tvls: [],
      apr: [],
    };

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case ACTIONS.CONFIGURE_SS:
            this.configure(payload);
            break;
          case ACTIONS.GET_BALANCES:
            this.getBalances(payload);
            break;
          case ACTIONS.SEARCH_ASSET:
            this.searchBaseAsset(payload);
            break;

          // LIQUIDITY
          case ACTIONS.CREATE_PAIR_AND_STAKE:
            this.createPairStake(payload);
            break;
          case ACTIONS.CREATE_PAIR_AND_DEPOSIT:
            this.createPairDeposit(payload);
            break;
          case ACTIONS.ADD_LIQUIDITY:
            this.addLiquidity(payload);
            break;
          case ACTIONS.STAKE_LIQUIDITY:
            this.stakeLiquidity(payload);
            break;
          case ACTIONS.ADD_LIQUIDITY_AND_STAKE:
            this.addLiquidityAndStake(payload);
            break;
          case ACTIONS.QUOTE_ADD_LIQUIDITY:
            this.quoteAddLiquidity(payload);
            break;
          case ACTIONS.GET_LIQUIDITY_BALANCES:
            this.getLiquidityBalances(payload);
            break;
          case ACTIONS.REMOVE_LIQUIDITY:
            this.removeLiquidity(payload);
            break;
          case ACTIONS.UNSTAKE_AND_REMOVE_LIQUIDITY:
            this.unstakeAndRemoveLiquidity(payload);
            break;
          case ACTIONS.QUOTE_REMOVE_LIQUIDITY:
            this.quoteRemoveLiquidity(payload);
            break;
          case ACTIONS.UNSTAKE_LIQUIDITY:
            this.unstakeLiquidity(payload);
            break;
          case ACTIONS.CREATE_GAUGE:
            this.createGauge(payload);
            break;

          // SWAP
          case ACTIONS.QUOTE_SWAP:
            this.quoteSwap(payload);
            break;
          case ACTIONS.SWAP:
            this.swap(payload);
            break;
          case ACTIONS.WRAP:
            this.wrap(payload);
            break;
          case ACTIONS.UNWRAP:
            this.unwrap(payload);
            break;

          // VESTING
          case ACTIONS.GET_VEST_NFTS:
            this.getVestNFTs(payload);
            break;
          case ACTIONS.CREATE_VEST:
            this.createVest(payload);
            break;
          case ACTIONS.INCREASE_VEST_AMOUNT:
            this.increaseVestAmount(payload);
            break;
          case ACTIONS.INCREASE_VEST_DURATION:
            this.increaseVestDuration(payload);
            break;
          case ACTIONS.MERGE_NFT:
            this.merge(payload);
            break;
          case ACTIONS.WITHDRAW_VEST:
            this.withdrawVest(payload);
            break;

          //VOTE
          case ACTIONS.VOTE:
            this.vote(payload);
            break;
          case ACTIONS.RESET_VOTE:
            this.resetVote(payload);
            break;
          case ACTIONS.GET_VEST_VOTES:
            this.getVestVotes(payload);
            break;
          case ACTIONS.CREATE_BRIBE:
            this.createBribe(payload);
            break;
          case ACTIONS.GET_VEST_BALANCES:
            this.getVestBalances(payload);
            break;

          //REWARDS
          case ACTIONS.GET_REWARD_BALANCES:
            this.getRewardBalances(payload);
            break;
          case ACTIONS.CLAIM_BRIBE:
            this.claimBribes(payload);
            break;
          case ACTIONS.CLAIM_PAIR_FEES:
            this.claimPairFees(payload);
            break;
          case ACTIONS.CLAIM_REWARD:
            this.claimRewards(payload);
            break;
          case ACTIONS.CLAIM_VE_DIST:
            this.claimVeDist(payload);
            break;
          case ACTIONS.CLAIM_ALL_REWARDS:
            this.claimAllRewards(payload);
            break;

          //WHITELIST
          case ACTIONS.SEARCH_WHITELIST:
            this.searchWhitelist(payload);
            break;
          case ACTIONS.WHITELIST_TOKEN:
            this.whitelistToken(payload);
            break;

          // migrate
          case ACTIONS.MIGRATE:
            this.migrate(payload);
            break;
          default: {
          }
        }
      }.bind(this)
    );
  }

  getStore = (index) => {
    return this.store[index];
  };

  setStore = (obj) => {
    this.store = { ...this.store, ...obj };
    return this.emitter.emit(ACTIONS.STORE_UPDATED);
  };

  // COMMON GETTER FUNCTIONS Assets, BaseAssets, Pairs etc
  getAsset = (address) => {
    const assets = this.store.assets;
    if (!assets || assets.length === 0) {
      return null;
    }

    let theAsset = assets.filter((ass) => {
      if (!ass) {
        return false;
      }
      return ass.address.toLowerCase() === address.toLowerCase();
    });

    if (!theAsset || theAsset.length === 0) {
      return null;
    }

    return theAsset[0];
  };

  getNFTByID = async (id) => {
    try {
      const vestNFTs = this.getStore("vestNFTs");
      let theNFT = vestNFTs.filter((vestNFT) => {
        return vestNFT.id == id;
      });

      if (theNFT.length > 0) {
        return theNFT[0];
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const veToken = this.getStore("veToken");
      const govToken = this.getStore("govToken");

      const vestingContract = new web3.eth.Contract(
        CONTRACTS.VE_TOKEN_ABI,
        CONTRACTS.VE_TOKEN_ADDRESS
      );

      const nftsLength = await vestingContract.methods
        .balanceOf(account.address)
        .call();
      const arr = Array.from({ length: parseInt(nftsLength) }, (v, i) => i);

      const nfts = await Promise.all(
        arr.map(async (idx) => {
          const tokenIndex = await vestingContract.methods
            .tokenOfOwnerByIndex(account.address, idx)
            .call();
          const locked = await vestingContract.methods
            .locked(tokenIndex)
            .call();
          const lockValue = await vestingContract.methods
            .balanceOfNFT(tokenIndex)
            .call();

          return {
            id: tokenIndex,
            lockEnds: locked.end,
            lockAmount: BigNumber(locked.amount)
              .div(10 ** parseInt(govToken.decimals))
              .toFixed(parseInt(govToken.decimals)),
            lockValue: BigNumber(lockValue)
              .div(10 ** 18)
              .toFixed(18),
          };
        })
      );

      this.setStore({ vestNFTs: nfts });

      theNFT = nfts.filter((nft) => {
        return nft.id == id;
      });

      if (theNFT.length > 0) {
        return theNFT[0];
      }

      return null;
    } catch (ex) {
      console.log(ex);
      return null;
    }
  };

  _updateVestNFTByID = async (id) => {
    try {
      const vestNFTs = this.getStore("vestNFTs");
      let theNFT = vestNFTs.filter((vestNFT) => {
        return vestNFT.id == id;
      });

      if (theNFT.length == 0) {
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const veToken = this.getStore("veToken");
      const govToken = this.getStore("govToken");

      const vestingContract = new web3.eth.Contract(
        CONTRACTS.VE_TOKEN_ABI,
        CONTRACTS.VE_TOKEN_ADDRESS
      );

      const locked = await vestingContract.methods.locked(id).call();
      const lockValue = await vestingContract.methods.balanceOfNFT(id).call();

      const newVestNFTs = vestNFTs.map((nft) => {
        if (nft.id == id) {
          return {
            id: id,
            lockEnds: locked.end,
            lockAmount: BigNumber(locked.amount)
              .div(10 ** parseInt(govToken.decimals))
              .toFixed(parseInt(govToken.decimals)),
            lockValue: BigNumber(lockValue)
              .div(10 ** 18)
              .toFixed(18),
          };
        }

        return nft;
      });

      this.setStore({ vestNFTs: newVestNFTs });
      this.emitter.emit(ACTIONS.UPDATED);
      return null;
    } catch (ex) {
      console.log(ex);
      return null;
    }
  };

  getPairByAddress = async (pairAddress) => {
    try {
      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const pairs = this.getStore("pairs");
      let thePair = pairs.filter((pair) => {
        return pair.address.toLowerCase() == pairAddress.toLowerCase();
      });
      if (thePair.length > 0) {
        const pc = new web3.eth.Contract(CONTRACTS.PAIR_ABI, pairAddress);

        const [totalSupply, reserve0, reserve1, balanceOf] = await Promise.all([
          pc.methods.totalSupply().call(),
          pc.methods.reserve0().call(),
          pc.methods.reserve1().call(),
          pc.methods.balanceOf(account.address).call(),
        ]);

        const returnPair = thePair[0];
        returnPair.balance = BigNumber(balanceOf)
          .div(10 ** returnPair.decimals)
          .toFixed(parseInt(returnPair.decimals));
        returnPair.totalSupply = BigNumber(totalSupply)
          .div(10 ** returnPair.decimals)
          .toFixed(parseInt(returnPair.decimals));
        returnPair.reserve0 = BigNumber(reserve0)
          .div(10 ** returnPair.token0.decimals)
          .toFixed(parseInt(returnPair.token0.decimals));
        returnPair.reserve1 = BigNumber(reserve1)
          .div(10 ** returnPair.token1.decimals)
          .toFixed(parseInt(returnPair.token1.decimals));

        return returnPair;
      }

      const pairContract = new web3.eth.Contract(
        CONTRACTS.PAIR_ABI,
        pairAddress
      );
      const gaugesContract = new web3.eth.Contract(
        CONTRACTS.VOTER_ABI,
        CONTRACTS.VOTER_ADDRESS
      );
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
        pairContract.methods.balanceOf(account.address).call(),
        pairContract.methods.stable().call(),
        gaugesContract.methods.gauges(pairAddress).call(),
        gaugesContract.methods.weights(pairAddress).call(),
        pairContract.methods.claimable0(account.address).call(),
        pairContract.methods.claimable1(account.address).call(),
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
        token0Contract.methods.balanceOf(account.address).call(),
        token1Contract.methods.symbol().call(),
        token1Contract.methods.decimals().call(),
        token1Contract.methods.balanceOf(account.address).call(),
      ]);

      thePair = {
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
          gaugeContract.methods.balanceOf(account.address).call(),
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
          { length: parseInt(tokensLength) },
          (v, i) => i
        );

        const bribes = await Promise.all(
          arry.map(async (idx) => {
            const tokenAddress = await bribeContract.methods
              .rewards(idx)
              .call();
            const token = await this.getBaseAsset(tokenAddress);

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

      pairs.push(thePair);
      this.setStore({ pairs: pairs });

      return thePair;
    } catch (ex) {
      console.log(ex);
      return null;
    }
  };

  getPair = async (addressA, addressB, stab) => {
    if (addressA === "MATIC") {
      addressA = CONTRACTS.WFTM_ADDRESS;
    }
    if (addressB === "MATIC") {
      addressB = CONTRACTS.WFTM_ADDRESS;
    }

    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      console.warn("web3 not found");
      return null;
    }
    const account = stores.accountStore.getStore("account");
    if (!account) {
      console.warn("account not found");
      return null;
    }

    const pairs = this.getStore("pairs");
    let thePair = pairs.filter((pair) => {
      return (
        (pair.token0.address.toLowerCase() == addressA.toLowerCase() &&
          pair.token1.address.toLowerCase() == addressB.toLowerCase() &&
          pair.isStable == stab) ||
        (pair.token0.address.toLowerCase() == addressB.toLowerCase() &&
          pair.token1.address.toLowerCase() == addressA.toLowerCase() &&
          pair.isStable == stab)
      );
    });
    if (thePair.length > 0) {
      const pc = new web3.eth.Contract(CONTRACTS.PAIR_ABI, thePair[0].address);

      const [totalSupply, reserve0, reserve1, balanceOf] = await Promise.all([
        pc.methods.totalSupply().call(),
        pc.methods.reserve0().call(),
        pc.methods.reserve1().call(),
        pc.methods.balanceOf(account.address).call(),
      ]);

      const returnPair = thePair[0];
      returnPair.balance = BigNumber(balanceOf)
        .div(10 ** returnPair.decimals)
        .toFixed(parseInt(returnPair.decimals));
      returnPair.totalSupply = BigNumber(totalSupply)
        .div(10 ** returnPair.decimals)
        .toFixed(parseInt(returnPair.decimals));
      returnPair.reserve0 = BigNumber(reserve0)
        .div(10 ** returnPair.token0.decimals)
        .toFixed(parseInt(returnPair.token0.decimals));
      returnPair.reserve1 = BigNumber(reserve1)
        .div(10 ** returnPair.token1.decimals)
        .toFixed(parseInt(returnPair.token1.decimals));

      return returnPair;
    }

    const factoryContract = new web3.eth.Contract(
      CONTRACTS.FACTORY_ABI,
      CONTRACTS.FACTORY_ADDRESS
    );
    const pairAddress = await factoryContract.methods
      .getPair(addressA, addressB, stab)
      .call();

    if (pairAddress && pairAddress != ZERO_ADDRESS) {
      const pairContract = new web3.eth.Contract(
        CONTRACTS.PAIR_ABI,
        pairAddress
      );
      const gaugesContract = new web3.eth.Contract(
        CONTRACTS.VOTER_ABI,
        CONTRACTS.VOTER_ADDRESS
      );

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
        pairContract.methods.balanceOf(account.address).call(),
        pairContract.methods.stable().call(),
        gaugesContract.methods.gauges(pairAddress).call(),
        gaugesContract.methods.weights(pairAddress).call(),
        pairContract.methods.claimable0(account.address).call(),
        pairContract.methods.claimable1(account.address).call(),
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
        token0Contract.methods.balanceOf(account.address).call(),
        token1Contract.methods.symbol().call(),
        token1Contract.methods.decimals().call(),
        token1Contract.methods.balanceOf(account.address).call(),
      ]);

      thePair = {
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
          gaugeContract.methods.balanceOf(account.address).call(),
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
          { length: parseInt(tokensLength) },
          (v, i) => i
        );

        const bribes = await Promise.all(
          arry.map(async (idx) => {
            const tokenAddress = await bribeContract.methods
              .rewards(idx)
              .call();
            const token = await this.getBaseAsset(tokenAddress);

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

      pairs.push(thePair);
      this.setStore({ pairs: pairs });

      return thePair;
    }

    return null;
  };

  removeBaseAsset = (asset) => {
    try {
      let localBaseAssets = [];
      const localBaseAssetsString = localStorage.getItem("stableSwap-assets");

      if (localBaseAssetsString && localBaseAssetsString !== "") {
        localBaseAssets = JSON.parse(localBaseAssetsString);

        localBaseAssets = localBaseAssets.filter(function (obj) {
          return obj.address.toLowerCase() !== asset.address.toLowerCase();
        });

        localStorage.setItem(
          "stableSwap-assets",
          JSON.stringify(localBaseAssets)
        );

        let baseAssets = this.getStore("baseAssets");
        baseAssets = baseAssets.filter(function (obj) {
          return (
            obj.address.toLowerCase() !== asset.address.toLowerCase() &&
            asset.local === true
          );
        });

        this.setStore({ baseAssets: removeDuplicate(baseAssets) });
        this.emitter.emit(
          ACTIONS.BASE_ASSETS_UPDATED,
          removeDuplicate(baseAssets)
        );
      }
    } catch (ex) {
      console.log(ex);
      return null;
    }
  };

  getLocalAssets = () => {
    try {
      let localBaseAssets = [];
      const localBaseAssetsString = localStorage.getItem("stableSwap-assets");

      if (localBaseAssetsString && localBaseAssetsString !== "") {
        localBaseAssets = JSON.parse(localBaseAssetsString);
      }

      return localBaseAssets;
    } catch (ex) {
      console.log(ex);
      return [];
    }
  };

  getBaseAsset = async (address, save, getBalance) => {
    try {
      const baseAssets = this.getStore("baseAssets");

      const theBaseAsset = baseAssets.filter((as) => {
        return as.address.toLowerCase() === address.toLowerCase();
      });
      if (theBaseAsset.length > 0) {
        return theBaseAsset[0];
      }

      // not found, so we search the blockchain for it.
      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const baseAssetContract = new web3.eth.Contract(
        CONTRACTS.ERC20_ABI,
        address
      );

      const [symbol, decimals, name] = await Promise.all([
        baseAssetContract.methods.symbol().call(),
        baseAssetContract.methods.decimals().call(),
        baseAssetContract.methods.name().call(),
      ]);

      const newBaseAsset = {
        address: address,
        symbol: symbol,
        name: name,
        decimals: parseInt(decimals),
        logoURI: null,
        local: true,
      };

      if (getBalance) {
        const account = stores.accountStore.getStore("account");
        if (account) {
          const balanceOf = await baseAssetContract.methods
            .balanceOf(account.address)
            .call();
          newBaseAsset.balance = BigNumber(balanceOf)
            .div(10 ** newBaseAsset.decimals)
            .toFixed(newBaseAsset.decimals);
        }
      } // GET BACK HERE

      //only save when a user adds it. don't for when we lookup a pair and find he asset.
      if (save) {
        let localBaseAssets = this.getLocalAssets();
        localBaseAssets = [...localBaseAssets, newBaseAsset];
        localStorage.setItem(
          "stableSwap-assets",
          JSON.stringify(localBaseAssets)
        );

        const baseAssets = this.getStore("baseAssets");
        const storeBaseAssets = removeDuplicate([...baseAssets, newBaseAsset]);

        this.setStore({ baseAssets: storeBaseAssets });
        this.emitter.emit(ACTIONS.BASE_ASSETS_UPDATED, storeBaseAssets);
      }

      return newBaseAsset;
    } catch (ex) {
      console.log(ex);
      // this.emitter.emit(ACTIONS.ERROR, ex)
      return null;
    }
  };

  fetchBaseAssets = async (addresses) => {
    if (addresses && Array.isArray(addresses)) {
      const web3 = await stores.accountStore.getWeb3Provider();
      const account = stores.accountStore.getStore("account");

      await Promise.all(addresses.map((addr) => this._getSpecificAssetInfo(web3, account, addr)));

      this.emitter.emit(ACTIONS.BASE_ASSETS_UPDATED);
    }
  }

  // DISPATCHER FUNCTIONS
  configure = async (payload) => {
    try {
      this.setStore({ govToken: this._getGovTokenBase() });
      this.setStore({ veToken: await this._getVeTokenBase() });
      this.setStore({ baseAssets: await this._getBaseAssets() });
      this.setStore({ pairs: await this._getPairs() });
      this.setStore({ routeAssets: ROUTE_ASSETS });

      this.emitter.emit(ACTIONS.UPDATED);
      this.emitter.emit(ACTIONS.CONFIGURED_SS);

      setTimeout(() => {
        this.dispatcher.dispatch({ type: ACTIONS.GET_BALANCES });
      }, 1);
    } catch (ex) {
      console.log(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  _getBaseAssets = async () => {
    try {
      const baseAssetsCall = await client.query(tokensQuery).toPromise();
      // console.log("QUERY TWO RESPONSE",baseAssetsCall)
      let baseAssets = baseAssetsCall.data.tokens;
      const defaultTokenList =
        process.env.NEXT_PUBLIC_CHAINID == 80001
          ? await axios.get(
              `https://raw.githubusercontent.com/sanchitdawarsd/default-token-list/master/tokens/matic-testnet.json`
            )
          : {data: DEFAULT_TOKEN_LIST,}
          /*await axios.get(
              `https://raw.githubusercontent.com/dystopia-exchange/default-token-list/master/tokens/matic.json`
            )*/;
      // console.log("defaultTokenList RESPONSE",defaultTokenList)
      const nativeFTM = {
        id: CONTRACTS.FTM_ADDRESS,
        address: CONTRACTS.FTM_ADDRESS,
        decimals: CONTRACTS.FTM_DECIMALS,
        logoURI: CONTRACTS.FTM_LOGO,
        name: CONTRACTS.FTM_NAME,
        symbol: CONTRACTS.FTM_SYMBOL,
      };

      for (let i = 0; i < defaultTokenList.data.length; i++) {
        for (let j = 0; j < baseAssets.length; j++) {
          baseAssets[j].address = baseAssets[j].id
          baseAssets[j].balance = 0
          baseAssets[j].chainId = 0

          if (defaultTokenList.data[i].address.toLowerCase() === baseAssets[j].address.toLowerCase()) {
            baseAssets[j].logoURI = defaultTokenList.data[i].logoURI;
          }

          if (baseAssets[j].name === "miMATIC") {
            baseAssets[j].symbol = "MAI";
            baseAssets[j].name = "MAI";
          }
        }
      }

      baseAssets.unshift(nativeFTM);

      let localBaseAssets = this.getLocalAssets();

      baseAssets = baseAssets.filter((token) => {
        return BLACK_LIST_TOKENS.indexOf(token.address.toLowerCase()) === -1;
      });
      let dupAssets = [];
      baseAssets.forEach((token, id) => {
        BASE_ASSETS_WHITELIST.forEach((wl) => {
          if (
              token.address.toLowerCase() !== wl.address.toLowerCase()
              && wl.symbol.toLowerCase() === token.symbol.toLowerCase()
              && !ALLOWED_DUPLICATE_SYMBOLS.includes(token.symbol)
          ) {
            dupAssets.push(id);
          }
        });
      });
      for (var i = dupAssets.length - 1; i >= 0; i--) {
        baseAssets.splice(dupAssets[i], 1);
      }

      // console.log("baseAssets",removeDuplicate([...baseAssets, ...localBaseAssets]))
      return removeDuplicate([...localBaseAssets, ...baseAssets]);
    } catch (ex) {
      console.log(ex);
      return [];
    }
  };

  _getUSDPRouteAssets = async () => {
    try {
      const USDPlus = {
        address: CONTRACTS.USDP_ADDRESS,
        decimals: CONTRACTS.USDP_DECIMALS,
        logoURI: CONTRACTS.USDP_LOGO,
        name: CONTRACTS.USDP_NAME,
        symbol: CONTRACTS.USDP_SYMBOL,
      };
      return [USDPlus];
    } catch (ex) {
      console.log(ex);
      return [];
    }
  };

  _getPairs = async () => {
    try {
      const pairsCall = await client.query(pairsQuery).toPromise();
      // console.log('QUERY PAIRS ERROR', pairsCall);
      if(!!pairsCall.error) {
        console.log('QUERY PAIRS ERROR', pairsCall.error);
      }

      // for compatability fill some fields
      for(let i = 0; i < pairsCall.data.pairs.length; i++) {
        pairsCall.data.pairs[i].address = pairsCall.data.pairs[i].id;
        pairsCall.data.pairs[i].decimals = 18;
        pairsCall.data.pairs[i].rewardType = null;
        if(!!pairsCall.data.pairs[i].gauge) {
          pairsCall.data.pairs[i].gauge.address = pairsCall.data.pairs[i].gauge.id;
          pairsCall.data.pairs[i].gauge.bribeAddress = pairsCall.data.pairs[i].gauge.bribe.id;
          pairsCall.data.pairs[i].gauge.balance = 0;
          pairsCall.data.pairs[i].gauge.apr = 0;
          pairsCall.data.pairs[i].gauge.reserve0 = 0;
          pairsCall.data.pairs[i].gauge.reserve1 = 0;
          pairsCall.data.pairs[i].gauge.weight = 0;
          pairsCall.data.pairs[i].gauge.weightPercent = 0;
          pairsCall.data.pairs[i].gauge.bribesEarned = 0;
          pairsCall.data.pairs[i].gauge.rewardsEarned = 0;


          pairsCall.data.pairs[i].gauge.bribe.address = pairsCall.data.pairs[i].gauge.bribe.id;
          pairsCall.data.pairs[i].gauge.bribe.rewardRate = 0;
          pairsCall.data.pairs[i].gauge.bribe.rewardAmount = 0;

          pairsCall.data.pairs[i].gaugebribes.address = pairsCall.data.pairs[i].gaugebribes.id;
        }
        pairsCall.data.pairs[i].token0.address = pairsCall.data.pairs[i].token0.id;
        pairsCall.data.pairs[i].token0.chainId = null;
        pairsCall.data.pairs[i].token0.balance = 0;
        pairsCall.data.pairs[i].token0.logoURI = '';

        pairsCall.data.pairs[i].token1.address = pairsCall.data.pairs[i].token1.id;
        pairsCall.data.pairs[i].token1.chainId = null;
        pairsCall.data.pairs[i].token1.balance = 0;
        pairsCall.data.pairs[i].token1.logoURI = '';

        pairsCall.data.pairs[i].claimable0 = 0;
        pairsCall.data.pairs[i].claimable1 = 0;
      }


      const find = "miMATIC";
      const regex = new RegExp(find, "g");
      const regex1 = new RegExp("miMATIC", "g");
      let pairsCall2;
      try {
        pairsCall2 = pairsCall.data.pairs.map((object) => {
          const obj = object;
          obj.name = obj?.name.replace(regex1, "MAI");
          obj.symbol = obj?.symbol.replace(regex1, "MAI");
          obj.token0.name = obj?.token0?.name?.replace(regex, "MAI");
          obj.token0.symbol = obj?.token0?.symbol?.replace(regex, "MAI");
          obj.token1.name = obj?.token1?.name?.replace(regex, "MAI");
          obj.token1.symbol = obj?.token1?.symbol?.replace(regex, "MAI");
          obj.token0.name = obj?.token0?.name?.replace(regex1, "MAI");
          obj.token0.symbol = obj?.token0?.symbol?.replace(regex1, "MAI");
          obj.token1.name = obj?.token1?.name?.replace(regex1, "MAI");
          obj.token1.symbol = obj?.token1?.symbol?.replace(regex1, "MAI");
          return obj;
        });
      } catch (e) {
        console.log(e, "error");
      }
      pairsCall2 = pairsCall2.filter((pair) => {
        return BLACK_LIST_TOKENS.indexOf(pair.token0.address.toLowerCase()) === -1
          && BLACK_LIST_TOKENS.indexOf(pair.token1.address.toLowerCase()) === -1
      });
      return pairsCall2;
    } catch (ex) {
      console.log(ex);
      return [];
    }
  };
  _getGovTokenBase = () => {
    return {
      address: CONTRACTS.GOV_TOKEN_ADDRESS,
      name: CONTRACTS.GOV_TOKEN_NAME,
      symbol: CONTRACTS.GOV_TOKEN_SYMBOL,
      decimals: CONTRACTS.GOV_TOKEN_DECIMALS,
      logoURI: CONTRACTS.GOV_TOKEN_LOGO,
    };
  };

  _getVeTokenBase = async () => {
    let apr = 0;
    try {
      const veDistResponse = await client.query(veDistQuery).toPromise();
      if (!veDistResponse.error && veDistResponse.data.veDistEntities.length !== 0) {
        apr = veDistResponse.data.veDistEntities[0].apr;
      }
    } catch (e) {
      console.log(e);
    }
    return {
      address: CONTRACTS.VE_TOKEN_ADDRESS,
      name: CONTRACTS.VE_TOKEN_NAME,
      symbol: CONTRACTS.VE_TOKEN_SYMBOL,
      decimals: CONTRACTS.VE_TOKEN_DECIMALS,
      logoURI: CONTRACTS.VE_TOKEN_LOGO,
      veDistApr: apr,
    };
  };

  getBalances = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      this._getGovTokenInfo(web3, account);
      await this._getBaseAssetInfo(web3, account);
      await this._getPairInfo(web3, account);
    } catch (ex) {
      console.log(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  _getVestNFTs = async (web3, account) => {
    try {
      const veToken = this.getStore("veToken");
      const govToken = this.getStore("govToken");

      const vestingContract = new web3.eth.Contract(
        CONTRACTS.VE_TOKEN_ABI,
        CONTRACTS.VE_TOKEN_ADDRESS
      );

      const nftsLength = await vestingContract.methods
        .balanceOf(account.address)
        .call();
      const arr = Array.from({ length: parseInt(nftsLength) }, (v, i) => i);

      const nfts = await Promise.all(
        arr.map(async (idx) => {
          const tokenIndex = await vestingContract.methods
            .tokenOfOwnerByIndex(account.address, idx)
            .call();
          const locked = await vestingContract.methods
            .locked(tokenIndex)
            .call();
          const lockValue = await vestingContract.methods
            .balanceOfNFT(tokenIndex)
            .call();

          return {
            id: tokenIndex,
            lockEnds: locked.end,
            lockAmount: BigNumber(locked.amount)
              .div(10 ** govToken.decimals)
              .toFixed(govToken.decimals),
            lockValue: BigNumber(lockValue)
              .div(10 ** 18)
              .toFixed(18),
          };
        })
      );

      this.setStore({ vestNFTs: nfts });
      this.emitter.emit(ACTIONS.UPDATED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  _getGovTokenInfo = async (web3, account) => {
    try {
      const govToken = this.getStore("govToken");
      if (!govToken) {
        console.warn("govToken not found");
        return null;
      }

      const veTokenContract = new web3.eth.Contract(
        CONTRACTS.GOV_TOKEN_ABI,
        CONTRACTS.GOV_TOKEN_ADDRESS
      );

      const [balanceOf] = await Promise.all([
        veTokenContract.methods.balanceOf(account.address).call(),
      ]);

      govToken.balanceOf = balanceOf;
      govToken.balance = BigNumber(balanceOf)
        .div(10 ** govToken.decimals)
        .toFixed(govToken.decimals);

      this.setStore({ govToken });
      this.emitter.emit(ACTIONS.UPDATED);

      this._getVestNFTs(web3, account);
    } catch (ex) {
      console.log(ex);
    }
  };

  _getPairInfo = async (web3, account, overridePairs) => {
    try {
      const multicall = await stores.accountStore.getMulticall();

      let pairs = [];

      if (overridePairs) {
        pairs = overridePairs;
      } else {
        pairs = this.getStore("pairs");
      }

      const ethPrice = parseFloat((await client.query(bundleQuery).toPromise()).data.bundle.ethPrice);

      const voterContract = new web3.eth.Contract(
        CONTRACTS.VOTER_ABI,
        CONTRACTS.VOTER_ADDRESS
      );
      const totalWeight = BigNumber(await voterContract.methods.totalWeight().call())
        .div(10 ** 18)

      const ps = await Promise.all(
        pairs.map(async (pair) => {
          try {
            const pairContract = new web3.eth.Contract(
              CONTRACTS.PAIR_ABI,
              pair.address
            );
            const token0Contract = new web3.eth.Contract(
              CONTRACTS.ERC20_ABI,
              pair.token0.address
            );
            const token1Contract = new web3.eth.Contract(
              CONTRACTS.ERC20_ABI,
              pair.token1.address
            );

            const token0 = await this.getBaseAsset(
              pair.token0.address,
              false,
              true
            );
            const token1 = await this.getBaseAsset(
              pair.token1.address,
              false,
              true
            );

            const [balanceOf, claimable0, claimable1] =
              await multicall.aggregate([
                // pairContract.methods.totalSupply(),
                // pairContract.methods.getReserves(),
                pairContract.methods.balanceOf(account.address),
                pairContract.methods.claimable0(account.address),
                pairContract.methods.claimable1(account.address),
              ]);

            pair.token0 = token0 != null ? token0 : pair.token0;
            pair.token1 = token1 != null ? token1 : pair.token1;
            pair.balance = BigNumber(balanceOf)
              .div(10 ** pair.decimals)
              .toFixed(parseInt(pair.decimals));
            pair.claimable0 = BigNumber(claimable0)
              .div(10 ** parseInt(pair.token0.decimals))
              .toFixed(parseInt(pair.token0.decimals));
            pair.claimable1 = BigNumber(claimable1)
              .div(10 ** parseInt(pair.token1.decimals))
              .toFixed(parseInt(pair.token1.decimals));

            pair.tvl = pair.reserveUSD;
            return pair;
          } catch (ex) {
            return pair;
          }
        })
      );
      this.setStore({ pairs: ps });
      this.emitter.emit(ACTIONS.UPDATED);

      const ps1 = await Promise.all(
        ps.map(async (pair) => {
          try {
            if (pair.gauge && pair.gauge.address !== ZERO_ADDRESS) {
              const gaugeContract = new web3.eth.Contract(
                CONTRACTS.GAUGE_ABI,
                pair.gauge.address
              );

              const [gaugeBalance] =
                await multicall.aggregate([
                  gaugeContract.methods.balanceOf(account.address),
                ]);

              pair.gauge.balance =
                parseInt(gaugeBalance) !== 0
                  ? BigNumber(parseInt(gaugeBalance))
                      .div(10 ** 18)
                      .toFixed(18)
                  : 0;

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

              pair.gauge.weight = BigNumber(parseFloat(pair.gauge.voteWeight));
              pair.gauge.weightPercent =
                parseInt(pair.gauge.totalWeight) !== 0
                  ? BigNumber(parseFloat(pair.gauge.voteWeight))
                      .times(100)
                      .div(totalWeight)
                      .toFixed(2)
                  : 0;

              if(pair.gauge.weight.isZero()) {
                pair.gauge.expectAPR = 0;
              }

              let apr = new BigNumber(0);
              const rts = pair.gauge.rewardTokens;
              for(let i = 0; i < rts.length; i++) {
                apr = apr.plus(BigNumber(parseFloat(rts[i].apr)))
              }

              pair.gauge.apr = apr;
              pair.gauge.boostedApr0 = new BigNumber(0);
              pair.gauge.boostedApr1 = new BigNumber(0);

              const reserve0ETH = BigNumber(parseFloat(pair.reserve0)).times(pair.token0.derivedETH)
              const reserve1ETH = BigNumber(parseFloat(pair.reserve1)).times(pair.token1.derivedETH)

              if (
                  pair.token0.address.toLowerCase() ===
                  CONTRACTS.ST_MATIC_ADDRESS.toLowerCase()
              ) {
                let boostedApr0Response = await axios.get(
                    CONTRACTS.ST_MATIC_BOOSTED_DATA_URL
                );

                if (boostedApr0Response.data && boostedApr0Response.data.apr) {
                  pair.gauge.boostedApr0 = new BigNumber(
                      boostedApr0Response.data.apr
                  ).times(reserve0ETH).div(reserve0ETH.plus(reserve1ETH));
                }
              }

              if (
                pair.token0.address.toLowerCase() ===
                CONTRACTS.USD_PLUS_ADDRESS.toLowerCase()
              ) {
                let boostedApr0Response = await axios.get(
                  CONTRACTS.USD_PLUS_BOOSTED_DATA_URL
                );

                if (boostedApr0Response.data) {
                  pair.gauge.boostedApr0 = new BigNumber(
                    boostedApr0Response.data
                  ).times(100)
                    .times(reserve0ETH).div(reserve0ETH.plus(reserve1ETH));
                }
              }

              if (
                  pair.token1.address.toLowerCase() ===
                  CONTRACTS.ST_MATIC_ADDRESS.toLowerCase()
              ) {
                let boostedApr1Response = await axios.get(
                    CONTRACTS.ST_MATIC_BOOSTED_DATA_URL
                );

                if (boostedApr1Response.data && boostedApr1Response.data.apr) {
                  pair.gauge.boostedApr1 = new BigNumber(
                      boostedApr1Response.data.apr
                  ).times(reserve1ETH).div(reserve0ETH.plus(reserve1ETH));
                }
              }

              if (
                pair.token1.address.toLowerCase() ===
                CONTRACTS.USD_PLUS_ADDRESS.toLowerCase()
              ) {
                let boostedApr1Response = await axios.get(
                  CONTRACTS.USD_PLUS_BOOSTED_DATA_URL
                );

                if (boostedApr1Response.data) {
                  pair.gauge.boostedApr1 = new BigNumber(
                    boostedApr1Response.data
                  ).times(100)
                    .times(reserve1ETH).div(reserve0ETH.plus(reserve1ETH));
                }
              }

              return pair;
            }
            return pair;
          } catch (ex) {
            return pair;
          }
        })
      );

      this.setStore({ pairs: ps1 });
      this.emitter.emit(ACTIONS.UPDATED);
    } catch (ex) {
      console.log(ex);
    }
  };

  _getBaseAssetInfo = async (web3, account) => {
    try {
      const baseAssets = this.getStore("baseAssets");
      if (!baseAssets) {
        console.warn("baseAssets not found");
        return null;
      }

      const voterContract = new web3.eth.Contract(
        CONTRACTS.VOTER_ABI,
        CONTRACTS.VOTER_ADDRESS
      );

      const baseAssetsBalances = await Promise.all(
        baseAssets.map(async (asset) => {
          try {
            if (asset.address === "MATIC") {
              let bal = await web3.eth.getBalance(account.address);
              return {
                balanceOf: bal,
                maticBalance: bal,
                isWhitelisted: true,
              };
            }

            const assetContract = new web3.eth.Contract(
              CONTRACTS.ERC20_ABI,
              asset.address
            );
            let bal = await web3.eth.getBalance(account.address);
            //rechange isWhitelisted!!
            const [balanceOf] = await Promise.all([
              //  voterContract.methods.isWhitelisted(asset.address).call(),
              assetContract.methods.balanceOf(account.address).call(),
            ]);
            return {
              balanceOf,
              bal,
              false: Boolean, //rechange isWhitelisted!!
            };
          } catch (ex) {
            return {
              balanceOf: "0",
              maticBalance: "0",
              isWhitelisted: false,
            };
          }
        })
      );

      for (let i = 0; i < baseAssets.length; i++) {
        baseAssets[i].balance = BigNumber(baseAssetsBalances[i].balanceOf)
          .div(10 ** parseInt(baseAssets[i].decimals))
          .toFixed(parseInt(baseAssets[i].decimals));
        baseAssets[i].isWhitelisted = baseAssetsBalances[i].isWhitelisted;
      }
      this.setStore({ baseAssets });
      this.emitter.emit(ACTIONS.UPDATED);
    } catch (ex) {
      console.log(ex);
    }
  };

  searchBaseAsset = async (payload) => {
    try {
      let localBaseAssets = [];
      const localBaseAssetsString = localStorage.getItem("stableSwap-assets");

      if (localBaseAssetsString && localBaseAssetsString !== "") {
        localBaseAssets = JSON.parse(localBaseAssetsString);
      }

      const theBaseAsset = localBaseAssets.filter((as) => {
        return (
          as.address.toLowerCase() === payload.content.address.toLowerCase()
        );
      });
      if (theBaseAsset.length > 0) {
        this.emitter.emit(ACTIONS.ASSET_SEARCHED, theBaseAsset);
        return;
      }

      const baseAssetContract = new web3.eth.Contract(
        CONTRACTS.ERC20_ABI,
        payload.content.address
      );

      const [symbol, decimals, name] = await Promise.all([
        baseAssetContract.methods.symbol().call(),
        baseAssetContract.methods.decimals().call(),
        baseAssetContract.methods.name().call(),
      ]);

      const newBaseAsset = {
        address: payload.content.address,
        symbol: symbol,
        name: name,
        decimals: parseInt(decimals),
      };

      localBaseAssets = [...localBaseAssets, newBaseAsset];
      localStorage.setItem(
        "stableSwap-assets",
        JSON.stringify(localBaseAssets)
      );

      const baseAssets = this.getStore("baseAssets");
      const storeBaseAssets = [...baseAssets, ...localBaseAssets];

      this.setStore({ baseAssets: storeBaseAssets });

      this.emitter.emit(ACTIONS.ASSET_SEARCHED, newBaseAsset);
    } catch (ex) {
      console.log(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  createPairStake = async (payload) => {
    try {
      const context = this;

      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { token0, token1, amount0, amount1, isStable, token, slippage } =
        payload.content;

      let toki0 = token0.address;
      let toki1 = token1.address;
      if (token0.address === "MATIC") {
        toki0 = CONTRACTS.WFTM_ADDRESS;
      }
      if (token1.address === "MATIC") {
        toki1 = CONTRACTS.WFTM_ADDRESS;
      }

      const factoryContract = new web3.eth.Contract(
        CONTRACTS.FACTORY_ABI,
        CONTRACTS.FACTORY_ADDRESS
      );
      const pairFor = await factoryContract.methods
        .getPair(toki0, toki1, isStable)
        .call();

      const hasPair = pairFor && pairFor != ZERO_ADDRESS;

      // if (pairFor && pairFor != ZERO_ADDRESS) {
      //   await context.updatePairsCall(web3, account);
      //   this.emitter.emit(ACTIONS.ERROR, "Pair already exists");
      //   return null;
      // }

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowance0TXID = this.getTXUUID();
      let allowance1TXID = this.getTXUUID();
      let depositTXID = this.getTXUUID();
      let createGaugeTXID = this.getTXUUID();
      let stakeAllowanceTXID = this.getTXUUID();
      let stakeTXID = this.getTXUUID();

      //DOD A CHECK FOR IF THE POOL ALREADY EXISTS

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Create liquidity pool for ${token0.symbol}/${token1.symbol}`,
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
            description: `Add liquidity`,
            status: "WAITING",
          },
          {
            uuid: createGaugeTXID,
            description: `Create gauge`,
            status: "WAITING",
          },
          {
            uuid: stakeAllowanceTXID,
            description: `Checking your pool allowance`,
            status: "WAITING",
          },
          {
            uuid: stakeTXID,
            description: `Stake LP tokens in the gauge`,
            status: "WAITING",
          },
        ],
      });

      let allowance0 = 0;
      let allowance1 = 0;

      // CHECK ALLOWANCES AND SET TX DISPLAY
      if (token0.address !== "MATIC") {
        allowance0 = await this._getDepositAllowance(web3, token0, account);
        if (BigNumber(allowance0).lt(amount0)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allow the router to spend your ${token0.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allowance on ${token0.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance0 = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance0TXID,
          description: `Allowance on ${token0.symbol} sufficient`,
          status: "DONE",
        });
      }

      if (token1.address !== "MATIC") {
        allowance1 = await this._getDepositAllowance(web3, token1, account);
        if (BigNumber(allowance1).lt(amount1)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allow the router to spend your ${token1.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allowance on ${token1.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance1 = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance1TXID,
          description: `Allowance on ${token1.symbol} sufficient`,
          status: "DONE",
        });
      }

      const gasPrice = await stores.accountStore.getGasPrice();

      const allowanceCallsPromises = [];

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance0).lt(amount0)) {
        const tokenContract = new web3.eth.Contract(
          CONTRACTS.ERC20_ABI,
          token0.address
        );

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(
            web3,
            tokenContract,
            "approve",
            [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            allowance0TXID,
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
        const tokenContract = new web3.eth.Contract(
          CONTRACTS.ERC20_ABI,
          token1.address
        );

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(
            web3,
            tokenContract,
            "approve",
            [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            allowance1TXID,
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

      const done = await Promise.all(allowanceCallsPromises);

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
        account.address,
        deadline,
      ];
      let sendValue = null;

      if (token0.address === "MATIC") {
        func = "addLiquidityMATIC";
        params = [
          token1.address,
          isStable,
          sendAmount1,
          sendAmount1Min,
          sendAmount0Min,
          account.address,
          deadline,
        ];
        sendValue = sendAmount0;
      }
      if (token1.address === "MATIC") {
        func = "addLiquidityMATIC";
        params = [
          token0.address,
          isStable,
          sendAmount0,
          sendAmount0Min,
          sendAmount1Min,
          account.address,
          deadline,
        ];
        sendValue = sendAmount1;
      }

      const routerContract = new web3.eth.Contract(
        CONTRACTS.ROUTER_ABI,
        CONTRACTS.ROUTER_ADDRESS
      );
      this._callContractWait(
        web3,
        routerContract,
        func,
        params,
        account,
        gasPrice,
        null,
        null,
        depositTXID,
        async (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          // GET PAIR FOR NEWLY CREATED LIQUIDITY POOL
          let tok0 = token0.address;
          let tok1 = token1.address;
          if (token0.address === "MATIC") {
            tok0 = CONTRACTS.WFTM_ADDRESS;
          }
          if (token1.address === "MATIC") {
            tok1 = CONTRACTS.WFTM_ADDRESS;
          }
          const pairFor = await factoryContract.methods
            .getPair(tok0, tok1, isStable)
            .call();

          const gaugesContract = new web3.eth.Contract(
            CONTRACTS.VOTER_ABI,
            CONTRACTS.VOTER_ADDRESS
          );

          const gaugeAddress = await gaugesContract.methods
            .gauges(pairFor)
            .call();

          const depositInGauge = async (gaugeAddress, pairFor) => {
            const pairContract = new web3.eth.Contract(
              CONTRACTS.PAIR_ABI,
              pairFor
            );
            const gaugeContract = new web3.eth.Contract(
              CONTRACTS.GAUGE_ABI,
              gaugeAddress
            );

            const balanceOf = await pairContract.methods
              .balanceOf(account.address)
              .call();

            const pair = await this.getPairByAddress(pairFor);
            const stakeAllowance = await this._getStakeAllowance(
              web3,
              pair,
              account
            );

            if (
              BigNumber(stakeAllowance).lt(
                BigNumber(balanceOf)
                  .div(10 ** parseInt(pair.decimals))
                  .toFixed(parseInt(pair.decimals))
              )
            ) {
              this.emitter.emit(ACTIONS.TX_STATUS, {
                uuid: stakeAllowanceTXID,
                description: `Allow the router to spend your ${pair.symbol}`,
              });
            } else {
              this.emitter.emit(ACTIONS.TX_STATUS, {
                uuid: stakeAllowanceTXID,
                description: `Allowance on ${pair.symbol} sufficient`,
                status: "DONE",
              });
            }

            const allowanceCallsPromise = [];

            if (
              BigNumber(stakeAllowance).lt(
                BigNumber(balanceOf)
                  .div(10 ** parseInt(pair.decimals))
                  .toFixed(parseInt(pair.decimals))
              )
            ) {
              const stakePromise = new Promise((resolve, reject) => {
                context._callContractWait(
                  web3,
                  pairContract,
                  "approve",
                  [pair.gauge.address, MAX_UINT256],
                  account,
                  gasPrice,
                  null,
                  null,
                  stakeAllowanceTXID,
                  (err) => {
                    if (err) {
                      reject(err);
                      return;
                    }

                    resolve();
                  }
                );
              });

              allowanceCallsPromise.push(stakePromise);
            }

            const done = await Promise.all(allowanceCallsPromise);

            let sendTok = "0";
            if (token && token.id) {
              sendTok = token.id;
            }

            this._callContractWait(
              web3,
              gaugeContract,
              "deposit",
              [balanceOf, sendTok],
              account,
              gasPrice,
              null,
              null,
              stakeTXID,
              async (err) => {
                if (err) {
                  return this.emitter.emit(ACTIONS.ERROR, err);
                }

                await context.updatePairsCall(web3, account);

                this.emitter.emit(ACTIONS.PAIR_CREATED, pairFor);
              }
            );
          };

          if (gaugeAddress === "0x0000000000000000000000000000000000000000") {
            // SUBMIT CREATE GAUGE TRANSACTION
            this._callContractWait(
              web3,
              gaugesContract,
              "createGauge",
              [pairFor],
              account,
              gasPrice,
              null,
              null,
              createGaugeTXID,
              async (err) => {
                if (err) {
                  return this.emitter.emit(ACTIONS.ERROR, err);
                }

                const gaugeAddress = await gaugesContract.methods
                  .gauges(pairFor)
                  .call();

                await depositInGauge(gaugeAddress, pairFor);
              }
            );
          } else {
            const pair = await this.getPairByAddress(pairFor);
            this.emitter.emit(ACTIONS.TX_STATUS, {
              uuid: createGaugeTXID,
              description: `Allowance on ${pair.symbol} sufficient`,
              status: "DONE",
            });

            await depositInGauge(gaugeAddress, pairFor);
          }
        },
        null,
        sendValue
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  migrate = async (payload) => {
    try {
      const context = this;

      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const {
        migrator,
        token0,
        token1,
        amount,
        isStable,
        allowance,
        pairDetails,
      } = payload.content;

      const migratorContract = new web3.eth.Contract(
        migratorAbi,
        migrator.migratorAddress[process.env.NEXT_PUBLIC_CHAINID]
      );

      const now = new Date();
      const utcMilllisecondsSinceEpoch = now.getTime();
      const utcSecondsSinceEpoch = Math.round(
        utcMilllisecondsSinceEpoch / 1000 + 1800
      );

      let func = "migrate";
      let params = [
        token0.address,
        token1.address,
        isStable,
        amount,
        0,
        0,
        utcSecondsSinceEpoch,
      ];
      let sendValue = null;

      const gasPrice = await stores.accountStore.getGasPrice();
      const allowanceCallsPromises = [];

      if (token0.address === "MATIC") {
        token0.address = CONTRACTS.WFTM_ADDRESS;
      }
      if (token1.address === "MATIC") {
        token1.address = CONTRACTS.WFTM_ADDRESS;
      }

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID();
      let depositTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Migrating liquidity pool for ${token0.symbol}/${token1.symbol}`,
        type: "Migrate Liquidity",
        verb: "Liquidity Pool Migrated",
        transactions: [
          {
            uuid: allowanceTXID,
            description: `Checking your ${pairDetails.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: depositTXID,
            description: `Migrating liquidity pool from ${migrator.label} to Dystopia Pool`,
            status: "WAITING",
          },
        ],
      });
      // CHECK ALLOWANCES AND SET TX DISPLAY

      if (!BigNumber(allowance).gt(amount)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow the router to spend your ${pairDetails.symbol}`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${pairDetails.symbol} sufficient`,
          status: "DONE",
        });
      }

      if (!BigNumber(allowance).gt(amount)) {
        const pairContract = new web3.eth.Contract(
          pairContractAbi,
          pairDetails.pairAddress
        );
        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(
            web3,
            pairContract,
            "approve",
            [
              migrator.migratorAddress[process.env.NEXT_PUBLIC_CHAINID],
              MAX_UINT256,
            ],
            account,
            gasPrice,
            null,
            null,
            allowanceTXID,
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
      const done = await Promise.all(allowanceCallsPromises);

      this._callContractWait(
        web3,
        migratorContract,
        func,
        params,
        account,
        gasPrice,
        null,
        null,
        depositTXID,
        async (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }
        }
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  createPairDeposit = async (payload) => {
    try {
      const context = this;
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { token0, token1, amount0, amount1, isStable, slippage } =
        payload.content;

      let toki0 = token0.address;
      let toki1 = token1.address;
      if (token0.address === "MATIC") {
        toki0 = CONTRACTS.WFTM_ADDRESS;
      }
      if (token1.address === "MATIC") {
        toki1 = CONTRACTS.WFTM_ADDRESS;
      }

      const factoryContract = new web3.eth.Contract(
        CONTRACTS.FACTORY_ABI,
        CONTRACTS.FACTORY_ADDRESS
      );
      const pairFor = await factoryContract.methods
        .getPair(toki0, toki1, isStable)
        .call();

      if (pairFor && pairFor != ZERO_ADDRESS) {
        await context.updatePairsCall(web3, account);
        this.emitter.emit(ACTIONS.ERROR, "Pair already exists");
        return null;
      }

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowance0TXID = this.getTXUUID();
      let allowance1TXID = this.getTXUUID();
      let depositTXID = this.getTXUUID();
      let createGaugeTXID = this.getTXUUID();

      //DOD A CHECK FOR IF THE POOL ALREADY EXISTS

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Create liquidity pool for ${token0.symbol}/${token1.symbol}`,
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
            description: `Create liquidity pool`,
            status: "WAITING",
          },
          {
            uuid: createGaugeTXID,
            description: `Create gauge`,
            status: "WAITING",
          },
        ],
      });

      let allowance0 = 0;
      let allowance1 = 0;

      // CHECK ALLOWANCES AND SET TX DISPLAY
      if (token0.address !== "MATIC") {
        allowance0 = await this._getDepositAllowance(web3, token0, account);
        if (BigNumber(allowance0).lt(amount0)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allow the router to spend your ${token0.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allowance on ${token0.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance0 = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance0TXID,
          description: `Allowance on ${token0.symbol} sufficient`,
          status: "DONE",
        });
      }

      if (token1.address !== "MATIC") {
        allowance1 = await this._getDepositAllowance(web3, token1, account);
        if (BigNumber(allowance1).lt(amount1)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allow the router to spend your ${token1.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allowance on ${token1.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance1 = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance1TXID,
          description: `Allowance on ${token1.symbol} sufficient`,
          status: "DONE",
        });
      }

      const gasPrice = await stores.accountStore.getGasPrice();

      const allowanceCallsPromises = [];

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance0).lt(amount0)) {
        const tokenContract = new web3.eth.Contract(
          CONTRACTS.ERC20_ABI,
          token0.address
        );

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(
            web3,
            tokenContract,
            "approve",
            [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            allowance0TXID,
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
        const tokenContract = new web3.eth.Contract(
          CONTRACTS.ERC20_ABI,
          token1.address
        );

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(
            web3,
            tokenContract,
            "approve",
            [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            allowance1TXID,
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

      const done = await Promise.all(allowanceCallsPromises);

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
        account.address,
        deadline,
      ];
      let sendValue = null;

      if (token0.address === "MATIC") {
        func = "addLiquidityMATIC";
        params = [
          token1.address,
          isStable,
          sendAmount1,
          sendAmount1Min,
          sendAmount0Min,
          account.address,
          deadline,
        ];
        sendValue = sendAmount0;
      }
      if (token1.address === "MATIC") {
        func = "addLiquidityMATIC";
        params = [
          token0.address,
          isStable,
          sendAmount0,
          sendAmount0Min,
          sendAmount1Min,
          account.address,
          deadline,
        ];
        sendValue = sendAmount1;
      }
      const routerContract = new web3.eth.Contract(
        CONTRACTS.ROUTER_ABI,
        CONTRACTS.ROUTER_ADDRESS
      );
      this._callContractWait(
        web3,
        routerContract,
        func,
        params,
        account,
        gasPrice,
        null,
        null,
        depositTXID,
        async (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          // GET PAIR FOR NEWLY CREATED LIQUIDITY POOL
          let tok0 = token0.address;
          let tok1 = token1.address;
          if (token0.address === "MATIC") {
            tok0 = CONTRACTS.WFTM_ADDRESS;
          }
          if (token1.address === "MATIC") {
            tok1 = CONTRACTS.WFTM_ADDRESS;
          }
          const pairFor = await factoryContract.methods
            .getPair(tok0, tok1, isStable)
            .call();

          // SUBMIT CREATE GAUGE TRANSACTION
          const gaugesContract = new web3.eth.Contract(
            CONTRACTS.VOTER_ABI,
            CONTRACTS.VOTER_ADDRESS
          );
          this._callContractWait(
            web3,
            gaugesContract,
            "createGauge",
            [pairFor],
            account,
            gasPrice,
            null,
            null,
            createGaugeTXID,
            async (err) => {
              if (err) {
                return this.emitter.emit(ACTIONS.ERROR, err);
              }

              await context.updatePairsCall(web3, account);

              this.emitter.emit(ACTIONS.PAIR_CREATED, pairFor);
            }
          );
        },
        null,
        sendValue
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  updatePairsCall = async (web3, account) => {
    try {
      const response = await client.query(pairsQuery).toPromise();
      const pairsCall = response;
      this.setStore({ pairs: pairsCall.data.pairs });

      await this._getPairInfo(web3, account, pairsCall.data.pairs);
    } catch (ex) {
      console.log(ex);
    }
  };

  sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  getTXUUID = () => {
    return uuidv4();
  };

  addLiquidity = async (payload) => {
    try {
      const context = this;

      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { token0, token1, amount0, amount1, minLiquidity, pair, slippage } =
        payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowance0TXID = this.getTXUUID();
      let allowance1TXID = this.getTXUUID();
      let depositTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Add liquidity to ${pair.symbol}`,
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
            description: `Deposit tokens in the pool`,
            status: "WAITING",
          },
        ],
      });

      let allowance0 = 0;
      let allowance1 = 0;

      // CHECK ALLOWANCES AND SET TX DISPLAY
      if (token0.address !== "MATIC") {
        allowance0 = await this._getDepositAllowance(web3, token0, account);
        if (BigNumber(allowance0).lt(amount0)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allow the router to spend your ${token0.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allowance on ${token0.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance0 = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance0TXID,
          description: `Allowance on ${token0.symbol} sufficient`,
          status: "DONE",
        });
      }

      if (token1.address !== "MATIC") {
        allowance1 = await this._getDepositAllowance(web3, token1, account);
        if (BigNumber(allowance1).lt(amount1)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allow the router to spend your ${token1.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allowance on ${token1.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance1 = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance1TXID,
          description: `Allowance on ${token1.symbol} sufficient`,
          status: "DONE",
        });
      }

      const gasPrice = await stores.accountStore.getGasPrice();

      const allowanceCallsPromises = [];

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance0).lt(amount0)) {
        const tokenContract = new web3.eth.Contract(
          CONTRACTS.ERC20_ABI,
          token0.address
        );

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(
            web3,
            tokenContract,
            "approve",
            [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            allowance0TXID,
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

      if (BigNumber(allowance1).lt(amount1)) {
        const tokenContract = new web3.eth.Contract(
          CONTRACTS.ERC20_ABI,
          token1.address
        );

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(
            web3,
            tokenContract,
            "approve",
            [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            allowance1TXID,
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

      const done = await Promise.all(allowanceCallsPromises);

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

      const routerContract = new web3.eth.Contract(
        CONTRACTS.ROUTER_ABI,
        CONTRACTS.ROUTER_ADDRESS
      );

      let func = "addLiquidity";
      let params = [
        token0.address,
        token1.address,
        pair.isStable,
        sendAmount0,
        sendAmount1,
        sendAmount0Min,
        sendAmount1Min,
        account.address,
        deadline,
      ];
      let sendValue = null;

      if (token0.address === "MATIC") {
        func = "addLiquidityMATIC";
        params = [
          token1.address,
          pair.isStable,
          sendAmount1,
          sendAmount1Min,
          sendAmount0Min,
          account.address,
          deadline,
        ];
        sendValue = sendAmount0;
      }
      if (token1.address === "MATIC") {
        func = "addLiquidityMATIC";
        params = [
          token0.address,
          pair.isStable,
          sendAmount0,
          sendAmount0Min,
          sendAmount1Min,
          account.address,
          deadline,
        ];
        sendValue = sendAmount1;
      }

      this._callContractWait(
        web3,
        routerContract,
        func,
        params,
        account,
        gasPrice,
        null,
        null,
        depositTXID,
        (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          this._getPairInfo(web3, account);

          this.emitter.emit(ACTIONS.LIQUIDITY_ADDED);
        },
        null,
        sendValue
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  stakeLiquidity = async (payload) => {
    try {
      const context = this;

      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { pair, token, amount, percent } = payload.content;

      let stakeAllowanceTXID = this.getTXUUID();
      let stakeTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
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

      const stakeAllowance = await this._getStakeAllowance(web3, pair, account);

      const pairContract = new web3.eth.Contract(
        CONTRACTS.PAIR_ABI,
        pair.address
      );
      const balanceOf = await pairContract.methods
        .balanceOf(account.address)
        .call();

      if (
        BigNumber(stakeAllowance).lt(
          BigNumber(balanceOf)
            .div(10 ** parseInt(pair.decimals))
            .toFixed(parseInt(pair.decimals))
        )
      ) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: stakeAllowanceTXID,
          description: `Allow the router to spend your ${pair.symbol}`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: stakeAllowanceTXID,
          description: `Allowance on ${pair.symbol} sufficient`,
          status: "DONE",
        });
      }

      const gasPrice = await stores.accountStore.getGasPrice();

      const allowanceCallsPromises = [];

      if (
        BigNumber(stakeAllowance).lt(
          BigNumber(balanceOf)
            .div(10 ** parseInt(pair.decimals))
            .toFixed(parseInt(pair.decimals))
        )
      ) {
        const stakePromise = new Promise((resolve, reject) => {
          context._callContractWait(
            web3,
            pairContract,
            "approve",
            [pair.gauge.address, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            stakeAllowanceTXID,
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

      const done = await Promise.all(allowanceCallsPromises);

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

      if (percent == 100) {
        this._callContractWait(
          web3,
          gaugeContract,
          "depositAll",
          [sendTok],
          account,
          gasPrice,
          null,
          null,
          stakeTXID,
          (err) => {
            if (err) {
              return this.emitter.emit(ACTIONS.ERROR, err);
            }

            this._getPairInfo(web3, account);

            this.emitter.emit(ACTIONS.LIQUIDITY_STAKED);
          }
        );
      } else {
        this._callContractWait(
          web3,
          gaugeContract,
          "deposit",
          [am, sendTok],
          account,
          gasPrice,
          null,
          null,
          stakeTXID,
          (err) => {
            if (err) {
              return this.emitter.emit(ACTIONS.ERROR, err);
            }

            this._getPairInfo(web3, account);

            this.emitter.emit(ACTIONS.LIQUIDITY_STAKED);
          }
        );
      }
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  addLiquidityAndStake = async (payload) => {
    try {
      const context = this;

      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const {
        token0,
        token1,
        amount0,
        amount1,
        minLiquidity,
        pair,
        token,
        slippage,
      } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowance0TXID = this.getTXUUID();
      let allowance1TXID = this.getTXUUID();
      let stakeAllowanceTXID = this.getTXUUID();
      let depositTXID = this.getTXUUID();
      let stakeTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Add liquidity to ${pair.symbol}`,
        type: "Liquidity",
        verb: "Liquidity Added",
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
            uuid: stakeAllowanceTXID,
            description: `Checking your ${pair.symbol} allowance`,
            status: "WAITING",
          },
          {
            uuid: depositTXID,
            description: `Deposit tokens in the pool`,
            status: "WAITING",
          },
          {
            uuid: stakeTXID,
            description: `Stake LP tokens in the gauge`,
            status: "WAITING",
          },
        ],
      });

      let allowance0 = 0;
      let allowance1 = 0;

      // CHECK ALLOWANCES AND SET TX DISPLAY
      if (token0.address !== "MATIC") {
        allowance0 = await this._getDepositAllowance(web3, token0, account);
        if (BigNumber(allowance0).lt(amount0)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allow the router to spend your ${token0.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance0TXID,
            description: `Allowance on ${token0.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance0 = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance0TXID,
          description: `Allowance on ${token0.symbol} sufficient`,
          status: "DONE",
        });
      }

      if (token1.address !== "MATIC") {
        allowance1 = await this._getDepositAllowance(web3, token1, account);
        if (BigNumber(allowance1).lt(amount1)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allow the router to spend your ${token1.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowance1TXID,
            description: `Allowance on ${token1.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance1 = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowance1TXID,
          description: `Allowance on ${token1.symbol} sufficient`,
          status: "DONE",
        });
      }

      const stakeAllowance = await this._getStakeAllowance(web3, pair, account);

      if (BigNumber(stakeAllowance).lt(minLiquidity)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: stakeAllowanceTXID,
          description: `Allow the router to spend your ${pair.symbol}`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: stakeAllowanceTXID,
          description: `Allowance on ${pair.symbol} sufficient`,
          status: "DONE",
        });
      }

      const gasPrice = await stores.accountStore.getGasPrice();

      const allowanceCallsPromises = [];

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance0).lt(amount0)) {
        const tokenContract = new web3.eth.Contract(
          CONTRACTS.ERC20_ABI,
          token0.address
        );

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(
            web3,
            tokenContract,
            "approve",
            [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            allowance0TXID,
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
        const tokenContract = new web3.eth.Contract(
          CONTRACTS.ERC20_ABI,
          token1.address
        );

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(
            web3,
            tokenContract,
            "approve",
            [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            allowance1TXID,
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

      if (BigNumber(stakeAllowance).lt(minLiquidity)) {
        const pairContract = new web3.eth.Contract(
          CONTRACTS.ERC20_ABI,
          pair.address
        );

        const stakePromise = new Promise((resolve, reject) => {
          context._callContractWait(
            web3,
            pairContract,
            "approve",
            [pair.gauge.address, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            stakeAllowanceTXID,
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

      const done = await Promise.all(allowanceCallsPromises);

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

      const routerContract = new web3.eth.Contract(
        CONTRACTS.ROUTER_ABI,
        CONTRACTS.ROUTER_ADDRESS
      );
      const gaugeContract = new web3.eth.Contract(
        CONTRACTS.GAUGE_ABI,
        pair.gauge.address
      );
      const pairContract = new web3.eth.Contract(
        CONTRACTS.PAIR_ABI,
        pair.address
      );

      let func = "addLiquidity";
      let params = [
        token0.address,
        token1.address,
        pair.isStable,
        sendAmount0,
        sendAmount1,
        sendAmount0Min,
        sendAmount1Min,
        account.address,
        deadline,
      ];
      let sendValue = null;

      if (token0.address === "MATIC") {
        func = "addLiquidityMATIC";
        params = [
          token1.address,
          pair.isStable,
          sendAmount1,
          sendAmount1Min,
          sendAmount0Min,
          account.address,
          deadline,
        ];
        sendValue = sendAmount0;
      }
      if (token1.address === "MATIC") {
        func = "addLiquidityMATIC";
        params = [
          token0.address,
          pair.isStable,
          sendAmount0,
          sendAmount0Min,
          sendAmount1Min,
          account.address,
          deadline,
        ];
        sendValue = sendAmount1;
      }

      this._callContractWait(
        web3,
        routerContract,
        func,
        params,
        account,
        gasPrice,
        null,
        null,
        depositTXID,
        async (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          const balanceOf = await pairContract.methods
            .balanceOf(account.address)
            .call();

          let sendTok = "0";
          if (token && token.id) {
            sendTok = token.id;
          }

          this._callContractWait(
            web3,
            gaugeContract,
            "deposit",
            [balanceOf, sendTok],
            account,
            gasPrice,
            null,
            null,
            stakeTXID,
            (err) => {
              if (err) {
                return this.emitter.emit(ACTIONS.ERROR, err);
              }

              this._getPairInfo(web3, account);

              this.emitter.emit(ACTIONS.ADD_LIQUIDITY_AND_STAKED);
            }
          );
        },
        null,
        sendValue
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  _getDepositAllowance = async (web3, token, account) => {
    try {
      const tokenContract = new web3.eth.Contract(
        CONTRACTS.ERC20_ABI,
        token.address
      );
      const allowance = await tokenContract.methods
        .allowance(account.address, CONTRACTS.ROUTER_ADDRESS)
        .call();
      return BigNumber(allowance)
        .div(10 ** parseInt(token.decimals))
        .toFixed(parseInt(token.decimals));
    } catch (ex) {
      console.error(ex);
      return null;
    }
  };

  _getStakeAllowance = async (web3, pair, account) => {
    try {
      const tokenContract = new web3.eth.Contract(
        CONTRACTS.ERC20_ABI,
        pair.address
      );
      const allowance = await tokenContract.methods
        .allowance(account.address, pair.gauge.address)
        .call();
      return BigNumber(allowance)
        .div(10 ** parseInt(pair.decimals))
        .toFixed(parseInt(pair.decimals));
    } catch (ex) {
      console.error(ex);
      return null;
    }
  };

  _getWithdrawAllowance = async (web3, pair, account) => {
    try {
      const tokenContract = new web3.eth.Contract(
        CONTRACTS.ERC20_ABI,
        pair.address
      );
      const allowance = await tokenContract.methods
        .allowance(account.address, CONTRACTS.ROUTER_ADDRESS)
        .call();
      return BigNumber(allowance)
        .div(10 ** parseInt(pair.decimals))
        .toFixed(parseInt(pair.decimals));
    } catch (ex) {
      console.error(ex);
      return null;
    }
  };

  quoteAddLiquidity = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { pair, token0, token1, amount0, amount1 } = payload.content;

      if (!pair || !token0 || !token1 || amount0 == "" || amount1 == "") {
        return null;
      }

      const gasPrice = await stores.accountStore.getGasPrice();
      const routerContract = new web3.eth.Contract(
        CONTRACTS.ROUTER_ABI,
        CONTRACTS.ROUTER_ADDRESS
      );

      const sendAmount0 = BigNumber(amount0)
        .times(10 ** parseInt(token0.decimals))
        .toFixed(0);
      const sendAmount1 = BigNumber(amount1)
        .times(10 ** parseInt(token1.decimals))
        .toFixed(0);

      let addy0 = token0.address;
      let addy1 = token1.address;

      if (token0.address === "MATIC") {
        addy0 = CONTRACTS.WFTM_ADDRESS;
      }
      if (token1.address === "MATIC") {
        addy1 = CONTRACTS.WFTM_ADDRESS;
      }

      const res = await routerContract.methods
        .quoteAddLiquidity(
          addy0,
          addy1,
          pair.isStable,
          sendAmount0,
          sendAmount1
        )
        .call();

      const returnVal = {
        inputs: {
          token0,
          token1,
          amount0,
          amount1,
        },
        output: BigNumber(res.liquidity)
          .div(10 ** parseInt(pair.decimals))
          .toFixed(parseInt(pair.decimals)),
      };
      this.emitter.emit(ACTIONS.QUOTE_ADD_LIQUIDITY_RETURNED, returnVal);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  getLiquidityBalances = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { pair } = payload.content;

      if (!pair) {
        return;
      }

      const token0Contract = new web3.eth.Contract(
        CONTRACTS.ERC20_ABI,
        pair.token0.address
      );
      const token1Contract = new web3.eth.Contract(
        CONTRACTS.ERC20_ABI,
        pair.token1.address
      );
      const pairContract = new web3.eth.Contract(
        CONTRACTS.ERC20_ABI,
        pair.address
      );

      const balanceCalls = [
        token0Contract.methods.balanceOf(account.address).call(),
        token1Contract.methods.balanceOf(account.address).call(),
        pairContract.methods.balanceOf(account.address).call(),
      ];

      if (pair.gauge) {
        const gaugeContract = new web3.eth.Contract(
          CONTRACTS.ERC20_ABI,
          pair.gauge.address
        );
        balanceCalls.push(
          gaugeContract.methods.balanceOf(account.address).call()
        );
        // balanceCalls.push(gaugeContract.methods.earned(incentiveAddress, account.address).call())
      }

      const [
        token0Balance,
        token1Balance,
        poolBalance,
        gaugeBalance /*, earned*/,
      ] = await Promise.all(balanceCalls);

      const returnVal = {
        token0: BigNumber(token0Balance)
          .div(10 ** parseInt(pair.token0.decimals))
          .toFixed(parseInt(pair.token0.decimals)),
        token1: BigNumber(token1Balance)
          .div(10 ** parseInt(pair.token1.decimals))
          .toFixed(parseInt(pair.token1.decimals)),
        pool: BigNumber(poolBalance)
          .div(10 ** 18)
          .toFixed(18),
      };

      if (pair.gauge) {
        returnVal.gauge = gaugeBalance
          ? BigNumber(gaugeBalance)
              .div(10 ** 18)
              .toFixed(18)
          : null;
        // returnVal.earned = BigNumber(earned).div(10**incentiveAsset.decimals).toFixed(incentiveAsset.decimals),
      }

      this.emitter.emit(ACTIONS.GET_LIQUIDITY_BALANCES_RETURNED, returnVal);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  removeLiquidity = async (payload) => {
    try {
      const context = this;

      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { token0, token1, pair, percent, slippage } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID();
      let withdrawTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
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
      const allowance = await this._getWithdrawAllowance(web3, pair, account);

      if (BigNumber(allowance).lt(pair.balance)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow the router to spend your ${pair.symbol}`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${pair.symbol} sufficient`,
          status: "DONE",
        });
      }

      const gasPrice = await stores.accountStore.getGasPrice();

      const allowanceCallsPromises = [];

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance).lt(pair.balance)) {
        const tokenContract = new web3.eth.Contract(
          CONTRACTS.ERC20_ABI,
          pair.address
        );

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(
            web3,
            tokenContract,
            "approve",
            [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            allowanceTXID,
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

      const done = await Promise.all(allowanceCallsPromises);

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
      this._callContractWait(
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
          account.address,
          deadline,
        ],
        account,
        gasPrice,
        null,
        null,
        withdrawTXID,
        (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          this._getPairInfo(web3, account);

          this.emitter.emit(ACTIONS.LIQUIDITY_REMOVED);
        }
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  unstakeAndRemoveLiquidity = async (payload) => {
    try {
      const context = this;

      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { token0, token1, amount, amount0, amount1, pair, slippage } =
        payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID();
      let withdrawTXID = this.getTXUUID();
      let unstakeTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
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
            uuid: unstakeTXID,
            description: `Unstake LP tokens from the gauge`,
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
      const allowance = await this._getWithdrawAllowance(web3, pair, account);

      if (BigNumber(allowance).lt(amount)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow the router to spend your ${pair.symbol}`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${pair.symbol} sufficient`,
          status: "DONE",
        });
      }

      const gasPrice = await stores.accountStore.getGasPrice();

      const allowanceCallsPromises = [];

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance).lt(amount)) {
        const tokenContract = new web3.eth.Contract(
          CONTRACTS.ERC20_ABI,
          pair.address
        );

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(
            web3,
            tokenContract,
            "approve",
            [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            allowanceTXID,
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

      const done = await Promise.all(allowanceCallsPromises);

      // SUBMIT DEPOSIT TRANSACTION
      const sendSlippage = BigNumber(100).minus(slippage).div(100);
      const sendAmount = BigNumber(amount)
        .times(10 ** pair.decimals)
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

      const routerContract = new web3.eth.Contract(
        CONTRACTS.ROUTER_ABI,
        CONTRACTS.ROUTER_ADDRESS
      );
      const gaugeContract = new web3.eth.Contract(
        CONTRACTS.GAUGE_ABI,
        pair.gauge.address
      );
      const pairContract = new web3.eth.Contract(
        CONTRACTS.PAIR_ABI,
        pair.address
      );

      this._callContractWait(
        web3,
        gaugeContract,
        "withdraw",
        [sendAmount],
        account,
        gasPrice,
        null,
        null,
        unstakeTXID,
        async (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          const balanceOf = await pairContract.methods
            .balanceOf(account.address)
            .call();

          this._callContractWait(
            web3,
            routerContract,
            "removeLiquidity",
            [
              token0.address,
              token1.address,
              pair.isStable,
              balanceOf,
              sendAmount0Min,
              sendAmount1Min,
              account.address,
              deadline,
            ],
            account,
            gasPrice,
            null,
            null,
            withdrawTXID,
            (err) => {
              if (err) {
                return this.emitter.emit(ACTIONS.ERROR, err);
              }

              this._getPairInfo(web3, account);

              this.emitter.emit(ACTIONS.REMOVE_LIQUIDITY_AND_UNSTAKED);
            }
          );
        }
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  unstakeLiquidity = async (payload) => {
    try {
      const context = this;

      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { token0, token1, amount, percent, amount0, amount1, pair } =
        payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let unstakeTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
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

      const gasPrice = await stores.accountStore.getGasPrice();

      // SUBMIT DEPOSIT TRANSACTION
      const sendAmount = BigNumber(amount)
        .times(10 ** pair.decimals)
        .toFixed(0);

      const gaugeContract = new web3.eth.Contract(
        CONTRACTS.GAUGE_ABI,
        pair.gauge.address
      );

      if (percent == 100) {
        this._callContractWait(
          web3,
          gaugeContract,
          "withdrawAll",
          [],
          account,
          gasPrice,
          null,
          null,
          unstakeTXID,
          async (err) => {
            if (err) {
              return this.emitter.emit(ACTIONS.ERROR, err);
            }

            this._getPairInfo(web3, account);

            this.emitter.emit(ACTIONS.LIQUIDITY_UNSTAKED);
          }
        );
      } else {
        this._callContractWait(
          web3,
          gaugeContract,
          "withdraw",
          [sendAmount],
          account,
          gasPrice,
          null,
          null,
          unstakeTXID,
          async (err) => {
            if (err) {
              return this.emitter.emit(ACTIONS.ERROR, err);
            }

            this._getPairInfo(web3, account);

            this.emitter.emit(ACTIONS.LIQUIDITY_UNSTAKED);
          }
        );
      }
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  quoteRemoveLiquidity = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { pair, token0, token1, withdrawAmount } = payload.content;

      if (!pair || !token0 || !token1 || withdrawAmount == "") {
        return null;
      }

      const gasPrice = await stores.accountStore.getGasPrice();
      const routerContract = new web3.eth.Contract(
        CONTRACTS.ROUTER_ABI,
        CONTRACTS.ROUTER_ADDRESS
      );

      const sendWithdrawAmount = BigNumber(withdrawAmount)
        .times(10 ** pair.decimals)
        .toFixed(0);

      const res = await routerContract.methods
        .quoteRemoveLiquidity(
          token0.address,
          token1.address,
          pair.isStable,
          sendWithdrawAmount
        )
        .call();

      const returnVal = {
        inputs: {
          token0,
          token1,
          withdrawAmount,
        },
        output: {
          amount0: BigNumber(res.amountA)
            .div(10 ** parseInt(token0.decimals))
            .toFixed(parseInt(token0.decimals)),
          amount1: BigNumber(res.amountB)
            .div(10 ** parseInt(token1.decimals))
            .toFixed(parseInt(token1.decimals)),
        },
      };
      this.emitter.emit(ACTIONS.QUOTE_REMOVE_LIQUIDITY_RETURNED, returnVal);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  createGauge = async (payload) => {
    try {
      const context = this;

      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { pair } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let createGaugeTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
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

      const gasPrice = await stores.accountStore.getGasPrice();

      const gaugesContract = new web3.eth.Contract(
        CONTRACTS.VOTER_ABI,
        CONTRACTS.VOTER_ADDRESS
      );
      this._callContractWait(
        web3,
        gaugesContract,
        "createGauge",
        [pair.address],
        account,
        gasPrice,
        null,
        null,
        createGaugeTXID,
        async (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          await this.updatePairsCall(web3, account);

          this.emitter.emit(ACTIONS.CREATE_GAUGE_RETURNED);
        }
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  quoteSwap = async (payload) => {
    try {
      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      // some path logic. Have a base asset (FTM) swap from start asset to FTM, swap from FTM back to out asset. Don't know.
      const _routeAssets = this.getStore("routeAssets");

      const { fromAsset, toAsset, fromAmount } = payload.content;

      const routerContract = new web3.eth.Contract(
        CONTRACTS.ROUTER_ABI,
        CONTRACTS.ROUTER_ADDRESS
      );
      const sendFromAmount = BigNumber(fromAmount)
        .times(10 ** parseInt(fromAsset.decimals))
        .toFixed();

      if (
        !fromAsset ||
        !toAsset ||
        !fromAmount ||
        !fromAsset.address ||
        !toAsset.address ||
        fromAmount === ""
      ) {
        return null;
      }

      const directSwapRoute =
          (DIRECT_SWAP_ROUTES[fromAsset.address.toLowerCase()] && DIRECT_SWAP_ROUTES[fromAsset.address.toLowerCase()]  === toAsset.address.toLowerCase())
      || (DIRECT_SWAP_ROUTES[toAsset.address.toLowerCase()] && DIRECT_SWAP_ROUTES[toAsset.address.toLowerCase()]  === fromAsset.address.toLowerCase())

      const routeAssets = _routeAssets;

      let addy0 = fromAsset.address;
      let addy1 = toAsset.address;

      if (fromAsset.address === "MATIC") {
        addy0 = CONTRACTS.WFTM_ADDRESS;
      }
      if (toAsset.address === "MATIC") {
        addy1 = CONTRACTS.WFTM_ADDRESS;
      }

      let amountOuts = [];

      if (!directSwapRoute) {
        amountOuts = routeAssets
            .map((routeAsset) => {
              return [
                {
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
                },
                {
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
                },
                {
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
                },
                {
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
                },
              ];
            })
            .flat();
      }

      amountOuts.push({
        routes: [
          {
            from: addy0,
            to: addy1,
            stable: true,
          },
        ],
        routeAsset: null,
      });

      amountOuts.push({
        routes: [
          {
            from: addy0,
            to: addy1,
            stable: false,
          },
        ],
        routeAsset: null,
      });

      // const multicall = await stores.accountStore.getMulticall();

      const retryCall = async () => {
        const res = await Promise.allSettled(
          amountOuts.map(async (route) => {
            const fn = retry({
              fn: routerContract.methods.getAmountsOut(
                sendFromAmount,
                route.routes
              ).call,
            });
            return await fn();
          })
        );

        return res
          .filter((el, index) => {
            if (
              el.status === "fulfilled" &&
              el.value !== undefined &&
              el.value !== null
            ) {
              return true;
            } else {
              amountOuts[index] = null;
              return false;
            }
          })
          .map((el) => el.value);
      };

      const receiveAmounts = await retryCall();

      amountOuts = amountOuts.filter((el) => el !== null);

      for (let i = 0; i < receiveAmounts.length; i++) {
        amountOuts[i].receiveAmounts = receiveAmounts[i];
        amountOuts[i].finalValue = BigNumber(
          receiveAmounts[i][receiveAmounts[i].length - 1]
        )
          .div(10 ** parseInt(toAsset.decimals))
          .toFixed(parseInt(toAsset.decimals));
      }

      const bestAmountOut = amountOuts
        .filter((ret) => {
          return ret != null;
        })
        .reduce((best, current) => {
          if (!best) {
            return current;
          }
          return BigNumber(best.finalValue).gt(current.finalValue)
            ? best
            : current;
        });

      if (!bestAmountOut) {
        this.emitter.emit(
          ACTIONS.ERROR,
          "No valid route found to complete swap"
        );
        return null;
      }

      const libraryContract = new web3.eth.Contract(
        CONTRACTS.LIBRARY_ABI,
        CONTRACTS.LIBRARY_ADDRESS
      );
      let totalRatio = 1;

      for (let i = 0; i < bestAmountOut.routes.length; i++) {
        let amountIn = bestAmountOut.receiveAmounts[i];
        // let amountOut = bestAmountOut.receiveAmounts[i + 1];

        const res = await libraryContract.methods
          .getTradeDiff3(
            amountIn,
            bestAmountOut.routes[i].from,
            bestAmountOut.routes[i].to,
            bestAmountOut.routes[i].stable
          )
          .call();
        const ratio = BigNumber(res.b).div(res.a);
        totalRatio = BigNumber(totalRatio).times(ratio).toFixed(18);
        // console.log('>>> SWAP', i, bestAmountOut.routes[i].from, bestAmountOut.routes[i].to, bestAmountOut.routes[i].stable, res, ratio, totalRatio);
      }

      const priceImpact = BigNumber(1).minus(totalRatio).times(100).toFixed(18);

      const returnValue = {
        inputs: {
          fromAmount: fromAmount,
          fromAsset: fromAsset,
          toAsset: toAsset,
        },
        output: bestAmountOut,
        priceImpact: priceImpact,
      };

      this.emitter.emit(ACTIONS.QUOTE_SWAP_RETURNED, returnValue);
      return returnValue
    } catch (ex) {
      console.error(ex);

      this.emitter.emit(ACTIONS.QUOTE_SWAP_RETURNED, null);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  swap = async (payload) => {
    try {
      const context = this;

      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { fromAsset, toAsset, fromAmount, toAmount, quote, slippage } =
        payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID();
      let swapTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Swap ${fromAsset.symbol} for ${toAsset.symbol}`,
        type: "Swap",
        verb: "Swap Successful",
        transactions: [
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
        ],
      });

      let allowance = 0;

      // CHECK ALLOWANCES AND SET TX DISPLAY
      if (fromAsset.address !== "MATIC") {
        allowance = await this._getSwapAllowance(web3, fromAsset, account);

        if (BigNumber(allowance).lt(fromAmount)) {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowanceTXID,
            description: `Allow the router to spend your ${fromAsset.symbol}`,
          });
        } else {
          this.emitter.emit(ACTIONS.TX_STATUS, {
            uuid: allowanceTXID,
            description: `Allowance on ${fromAsset.symbol} sufficient`,
            status: "DONE",
          });
        }
      } else {
        allowance = MAX_UINT256;
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${fromAsset.symbol} sufficient`,
          status: "DONE",
        });
      }

      const gasPrice = await stores.accountStore.getGasPrice();

      const allowanceCallsPromises = [];

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance).lt(fromAmount)) {
        const tokenContract = new web3.eth.Contract(
          CONTRACTS.ERC20_ABI,
          fromAsset.address
        );

        const tokenPromise = new Promise((resolve, reject) => {
          context._callContractWait(
            web3,
            tokenContract,
            "approve",
            [CONTRACTS.ROUTER_ADDRESS, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            allowanceTXID,
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

      const done = await Promise.all(allowanceCallsPromises);

      // SUBMIT SWAP TRANSACTION
      let _slippage = slippage;
      if (
        fromAsset.address.toLowerCase() ===
          CONTRACTS.SPHERE_ADDRESS.toLowerCase() &&
        Number(slippage) <= 22
      ) {
        _slippage = (30 + Number(slippage)).toString();
      }
      const sendSlippage = BigNumber(100).minus(_slippage).div(100);

      const sendFromAmount = BigNumber(fromAmount)
        .times(10 ** fromAsset.decimals)
        .toFixed(0);
      const sendMinAmountOut = BigNumber(quote.output.finalValue)
        .times(10 ** toAsset.decimals)
        .times(sendSlippage)
        .toFixed(0);
      const deadline = "" + moment().add(600, "seconds").unix();

      const routerContract = new web3.eth.Contract(
        CONTRACTS.ROUTER_ABI,
        CONTRACTS.ROUTER_ADDRESS
      );

      let func = "swapExactTokensForTokens";
      let params = [
        sendFromAmount,
        sendMinAmountOut,
        quote.output.routes,
        account.address,
        deadline,
      ];
      let sendValue = null;

      if (
        fromAsset.address.toLowerCase() ===
        CONTRACTS.SPHERE_ADDRESS.toLowerCase()
      ) {
        // SPHERE token address
        func = "swapExactTokensForTokensSupportingFeeOnTransferTokens";
      }

      if (fromAsset.address === "MATIC") {
        func = "swapExactMATICForTokens";
        params = [
          sendMinAmountOut,
          quote.output.routes,
          account.address,
          deadline,
        ];
        sendValue = sendFromAmount;
      }
      if (toAsset.address === "MATIC") {
        func = "swapExactTokensForMATIC";
        if (
          fromAsset.address.toLowerCase() ===
          CONTRACTS.SPHERE_ADDRESS.toLowerCase()
        ) {
          func = "swapExactTokensForMATICSupportingFeeOnTransferTokens";
        }
      }

      this._callContractWait(
        web3,
        routerContract,
        func,
        params,
        account,
        gasPrice,
        null,
        null,
        swapTXID,
        (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          this._getSpecificAssetInfo(web3, account, fromAsset.address);
          this._getSpecificAssetInfo(web3, account, toAsset.address);
          this._getPairInfo(web3, account);

          this.emitter.emit(ACTIONS.SWAP_RETURNED);
        },
        null,
        sendValue
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };
  wrap = async (payload) => {
    try {
      const allowanceCallsPromises = [];

      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { fromAsset, toAsset, fromAmount, toAmount } = payload.content;

      const gasPrice = await stores.accountStore.getGasPrice();
      let wrapTXID = this.getTXUUID();

      const sendFromAmount = BigNumber(fromAmount)
        .times(10 ** fromAsset.decimals)
        .toFixed(0);

      const sendValue = sendFromAmount;
      const wmaticContract = new web3.eth.Contract(
        CONTRACTS.WFTM_ABI,
        CONTRACTS.WFTM_ADDRESS
      );
      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Wrap ${fromAsset.symbol} for ${toAsset.symbol}`,
        type: "Wrap",
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
        this._callContractWait(
          web3,
          wmaticContract,
          "deposit",
          [],
          account,
          gasPrice,
          null,
          null,
          wrapTXID,
          (err) => {
            if (err) {
              reject(err);
              return;
            }

            resolve();
          },
          null,
          sendValue
        );
      });

      allowanceCallsPromises.push(depositPromise);
      const done = await Promise.all(allowanceCallsPromises);
      this.emitter.emit(ACTIONS.WRAP_RETURNED);
    } catch (e) {
      console.log(e);
      this.emitter.emit(ACTIONS.ERROR, e);
    }
  };
  unwrap = async (payload) => {
    try {
      const allowanceCallsPromises = [];

      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { fromAsset, toAsset, fromAmount, toAmount } = payload.content;

      let unwrapTXID = this.getTXUUID();
      const gasPrice = await stores.accountStore.getGasPrice();

      const sendFromAmount = BigNumber(fromAmount)
        .times(10 ** fromAsset.decimals)
        .toFixed(0);
      const wmaticContract = new web3.eth.Contract(
        CONTRACTS.WFTM_ABI,
        CONTRACTS.WFTM_ADDRESS
      );
      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Unwrap ${fromAsset.symbol} for ${toAsset.symbol}`,
        type: "Unwrap",
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
        this._callContractWait(
          web3,
          wmaticContract,
          "withdraw",
          [sendFromAmount],
          account,
          gasPrice,
          null,
          null,
          unwrapTXID,
          (err) => {
            if (err) {
              reject(err);
              return;
            }

            resolve();
          }
        );
      });

      allowanceCallsPromises.push(withdrawPromise);
      const done = await Promise.all(allowanceCallsPromises);
      this.emitter.emit(ACTIONS.UNWRAP_RETURNED);
    } catch (e) {
      console.log(e);
      this.emitter.emit(ACTIONS.ERROR, e);
    }
  };
  _getSpecificAssetInfo = async (web3, account, assetAddress) => {
    try {
      const baseAssets = this.getStore("baseAssets");
      if (!baseAssets) {
        console.warn("baseAssets not found");
        return null;
      }

      const ba = await Promise.all(
        baseAssets.map(async (asset) => {
          if (asset.address.toLowerCase() === assetAddress.toLowerCase()) {
            if (asset.address === "MATIC") {
              let bal = await web3.eth.getBalance(account.address);
              asset.balance = BigNumber(bal)
                .div(10 ** parseInt(asset.decimals))
                .toFixed(parseInt(asset.decimals));
            } else {
              const assetContract = new web3.eth.Contract(
                CONTRACTS.ERC20_ABI,
                asset.address
              );

              const [balanceOf] = await Promise.all([
                assetContract.methods.balanceOf(account.address).call(),
              ]);

              asset.balance = BigNumber(balanceOf)
                .div(10 ** parseInt(asset.decimals))
                .toFixed(parseInt(asset.decimals));
            }
          }

          return asset;
        })
      );

      this.setStore({ baseAssets: removeDuplicate(ba) });
      this.emitter.emit(ACTIONS.UPDATED);
    } catch (ex) {
      console.log(ex);
      return null;
    }
  };

  _getSwapAllowance = async (web3, token, account) => {
    try {
      const tokenContract = new web3.eth.Contract(
        CONTRACTS.ERC20_ABI,
        token.address
      );
      const allowance = await tokenContract.methods
        .allowance(account.address, CONTRACTS.ROUTER_ADDRESS)
        .call();
      return BigNumber(allowance)
        .div(10 ** parseInt(token.decimals))
        .toFixed(parseInt(token.decimals));
    } catch (ex) {
      console.error(ex);
      return null;
    }
  };

  getVestNFTs = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const veToken = this.getStore("veToken");
      const govToken = this.getStore("govToken");

      const vestingContract = new web3.eth.Contract(
        CONTRACTS.VE_TOKEN_ABI,
        CONTRACTS.VE_TOKEN_ADDRESS
      );

      const nftsLength = await vestingContract.methods
        .balanceOf(account.address)
        .call();
      const arr = Array.from({ length: parseInt(nftsLength) }, (v, i) => i);

      const nfts = await Promise.all(
        arr.map(async (idx) => {
          const tokenIndex = await vestingContract.methods
            .tokenOfOwnerByIndex(account.address, idx)
            .call();
          const locked = await vestingContract.methods
            .locked(tokenIndex)
            .call();
          const lockValue = await vestingContract.methods
            .balanceOfNFT(tokenIndex)
            .call();

          return {
            id: tokenIndex,
            lockEnds: locked.end,
            lockAmount: BigNumber(locked.amount)
              .div(10 ** parseInt(govToken.decimals))
              .toFixed(parseInt(govToken.decimals)),
            lockValue: BigNumber(lockValue)
              .div(10 ** 18)
              .toFixed(18),
          };
        })
      );

      this.setStore({ vestNFTs: nfts });
      this.emitter.emit(ACTIONS.VEST_NFTS_RETURNED, nfts);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  createVest = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const govToken = this.getStore("govToken");
      const { amount, unlockTime } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID();
      let vestTXID = this.getTXUUID();

      const unlockString = moment()
        .add(unlockTime, "seconds")
        .format("YYYY-MM-DD");

      this.emitter.emit(ACTIONS.TX_ADDED, {
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
      const allowance = await this._getVestAllowance(web3, govToken, account);

      if (BigNumber(allowance).lt(amount)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow the vesting contract to use your ${govToken.symbol}`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${govToken.symbol} sufficient`,
          status: "DONE",
        });
      }

      const gasPrice = await stores.accountStore.getGasPrice();

      const allowanceCallsPromises = [];

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance).lt(amount)) {
        const tokenContract = new web3.eth.Contract(
          CONTRACTS.ERC20_ABI,
          govToken.address
        );

        const tokenPromise = new Promise((resolve, reject) => {
          this._callContractWait(
            web3,
            tokenContract,
            "approve",
            [CONTRACTS.VE_TOKEN_ADDRESS, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            allowanceTXID,
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

      const done = await Promise.all(allowanceCallsPromises);

      // SUBMIT VEST TRANSACTION
      const sendAmount = BigNumber(amount)
        .times(10 ** govToken.decimals)
        .toFixed(0);

      const veTokenContract = new web3.eth.Contract(
        CONTRACTS.VE_TOKEN_ABI,
        CONTRACTS.VE_TOKEN_ADDRESS
      );

      this._callContractWait(
        web3,
        veTokenContract,
        "createLock",
        [sendAmount, unlockTime + ""],
        account,
        gasPrice,
        null,
        null,
        vestTXID,
        (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          this._getGovTokenInfo(web3, account);
          this.getNFTByID("fetchAll");

          this.emitter.emit(ACTIONS.CREATE_VEST_RETURNED);
        }
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  _getVestAllowance = async (web3, token, account) => {
    try {
      const tokenContract = new web3.eth.Contract(
        CONTRACTS.ERC20_ABI,
        token.address
      );
      const allowance = await tokenContract.methods
        .allowance(account.address, CONTRACTS.VE_TOKEN_ADDRESS)
        .call();
      return BigNumber(allowance)
        .div(10 ** parseInt(token.decimals))
        .toFixed(parseInt(token.decimals));
    } catch (ex) {
      console.error(ex);
      return null;
    }
  };

  increaseVestAmount = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const govToken = this.getStore("govToken");
      const { amount, tokenID } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID();
      let vestTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
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
      const allowance = await this._getVestAllowance(web3, govToken, account);

      if (BigNumber(allowance).lt(amount)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow vesting contract to use your ${govToken.symbol}`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${govToken.symbol} sufficient`,
          status: "DONE",
        });
      }

      const gasPrice = await stores.accountStore.getGasPrice();

      const allowanceCallsPromises = [];

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance).lt(amount)) {
        const tokenContract = new web3.eth.Contract(
          CONTRACTS.ERC20_ABI,
          govToken.address
        );

        const tokenPromise = new Promise((resolve, reject) => {
          this._callContractWait(
            web3,
            tokenContract,
            "approve",
            [CONTRACTS.VE_TOKEN_ADDRESS, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            allowanceTXID,
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

      const done = await Promise.all(allowanceCallsPromises);

      // SUBMIT INCREASE TRANSACTION
      const sendAmount = BigNumber(amount)
        .times(10 ** govToken.decimals)
        .toFixed(0);

      const veTokenContract = new web3.eth.Contract(
        CONTRACTS.VE_TOKEN_ABI,
        CONTRACTS.VE_TOKEN_ADDRESS
      );

      this._callContractWait(
        web3,
        veTokenContract,
        "increaseAmount",
        [tokenID, sendAmount],
        account,
        gasPrice,
        null,
        null,
        vestTXID,
        (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          this._getGovTokenInfo(web3, account);
          this._updateVestNFTByID(tokenID);

          this.emitter.emit(ACTIONS.INCREASE_VEST_AMOUNT_RETURNED);
        }
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  increaseVestDuration = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const govToken = this.getStore("govToken");
      const { tokenID, unlockTime } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let vestTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
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

      const gasPrice = await stores.accountStore.getGasPrice();

      // SUBMIT INCREASE TRANSACTION
      const veTokenContract = new web3.eth.Contract(
        CONTRACTS.VE_TOKEN_ABI,
        CONTRACTS.VE_TOKEN_ADDRESS
      );

      this._callContractWait(
        web3,
        veTokenContract,
        "increaseUnlockTime",
        [tokenID, unlockTime + ""],
        account,
        gasPrice,
        null,
        null,
        vestTXID,
        (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          this._updateVestNFTByID(tokenID);

          this.emitter.emit(ACTIONS.INCREASE_VEST_DURATION_RETURNED);
        }
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  withdrawVest = async (payload) => {
    try {
      const { tokenID } = payload.content;

      const veGaugesQueryResponse = (await client.query(veQuery, {id: tokenID}).toPromise());
      // console.log('VE GAUGES', veGaugesQueryResponse)
      if(!!veGaugesQueryResponse.error) {
        console.log("VE GAUGES QUERY ERROR", veGaugesQueryResponse.error);
      }

      const gauges = veGaugesQueryResponse.data.veNFTEntities[0].gauges;
      const bribes = veGaugesQueryResponse.data.veNFTEntities[0].bribes;
      let gaugesLength = gauges.length;
      let bribesLength = bribes.length;

      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const govToken = this.getStore("govToken");
      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let vestTXID = this.getTXUUID();

      let withdrawAllTXID = [];
      let arrTx = [];
      if (gaugesLength != 0 || gaugesLength != null || gaugesLength != "") {
        for (var i = 0; i < gaugesLength; i++) {
          withdrawAllTXID[i] = this.getTXUUID();
          let a = {
            uuid: withdrawAllTXID[i],
            description: `Withdrawing your tokens for gauge `,
            status: "WAITING",
          };
          arrTx.push(a);
        }
      }
      let voteTXID = this.getTXUUID();

      let c = {
        uuid: vestTXID,
        description: `Withdrawing your expired tokens`,
        status: "WAITING",
      };
      arrTx.push(c);

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Withdraw vest amount on token #${tokenID}`,
        type: "Vest",
        verb: "Vest Withdrawn",
        transactions: arrTx,
      });

      const gasPrice = await stores.accountStore.getGasPrice();

      // SUBMIT INCREASE TRANSACTION
      const veTokenContract = new web3.eth.Contract(
        CONTRACTS.VE_TOKEN_ABI,
        CONTRACTS.VE_TOKEN_ADDRESS
      );
      let allowanceCallsPromise = [];
      if (gaugesLength !== 0) {
        for (var i = 0; i < gaugesLength; i++) {
          let gaugeContract = new web3.eth.Contract(
            CONTRACTS.GAUGE_ABI,
            gauges[i].gauge.id
          );
          const withdrawAll = new Promise((resolve, reject) => {
            this._callContractWait(
              web3,
              gaugeContract,
              "withdrawAll",
              [],
              account,
              gasPrice,
              null,
              null,
              withdrawAllTXID[i],
              (err) => {
                if (err) {
                  reject(err);
                  return;
                }

                resolve();
              }
            );
          });

          allowanceCallsPromise.push(withdrawAll);

          const done = await Promise.all(allowanceCallsPromise);
        }
      }


      // SUBMIT INCREASE TRANSACTION
      if (bribesLength !== 0) {
        let b = {
          uuid: voteTXID,
          description: `Reset votes`,
          status: "WAITING",
        };
        arrTx.push(b);

        const voterContract = new web3.eth.Contract(
          CONTRACTS.VOTER_ABI,
          CONTRACTS.VOTER_ADDRESS
        );

        const reset = new Promise((resolve, reject) => {
          this._callContractWait(
            web3,
            voterContract,
            "reset",
            [tokenID],
            account,
            gasPrice,
            null,
            null,
            voteTXID,
            (err) => {
              if (err) {
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

      const withdraw = new Promise((resolve, reject) => {
        this._callContractWait(
          web3,
          veTokenContract,
          "withdraw",
          [tokenID],
          account,
          gasPrice,
          null,
          null,
          vestTXID,
          (err) => {
            if (err) {
              reject(err);
              return;
            }
            this._updateVestNFTByID(tokenID);

            this.emitter.emit(ACTIONS.WITHDRAW_VEST_RETURNED);
            resolve();
          }
        );
      });
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };
  merge = async (payload) => {
    try {
      const { tokenIDOne, tokenIDTwo } = payload.content;

      const veGaugesQueryResponse = (await client.query(veQuery, {id: tokenIDOne.id}).toPromise());
      // console.log('VE GAUGES', veGaugesQueryResponse)
      if(!!veGaugesQueryResponse.error) {
        console.log("VE GAUGES QUERY ERROR", veGaugesQueryResponse.error);
      }

      const gauges = veGaugesQueryResponse.data.veNFTEntities[0].gauges;
      const bribes = veGaugesQueryResponse.data.veNFTEntities[0].bribes;
      let gaugesLength = gauges.length;
      let bribesLength = bribes.length;


      let allowanceCallsPromise = [];
      let voteResetTXID = this.getTXUUID();
      let allowanceTXID = this.getTXUUID();
      let mergeTXID = this.getTXUUID();

      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const vedystcontract = new web3.eth.Contract(
        CONTRACTS.VE_TOKEN_ABI,
        CONTRACTS.VE_TOKEN_ADDRESS
      );

      let withdrawAllTXID = [];
      let arrTx = [];
      let c = {
        uuid: allowanceTXID,
        description: `Checking Allowance for veDYST to Merge`,
        status: "WAITING",
      };
      arrTx.push(c);

      if (gaugesLength !== 0) {
        for (var i = 0; i < gaugesLength; i++) {
          withdrawAllTXID[i] = this.getTXUUID();
          let a = {
            uuid: withdrawAllTXID[i],
            description: `Withdrawing your tokens for gauge `,
            status: "WAITING",
          };
          arrTx.push(a);
        }
      }

      if(bribesLength !== 0) {
        let b = {
          uuid: voteResetTXID,
          description: `Reset votes`,
          status: "WAITING",
        };
        arrTx.push(b);
      }

      let d = {
        uuid: mergeTXID,
        description: `Merge veDYST`,
        status: "WAITING",
      };
      arrTx.push(d);

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `Withdraw vest amount on token #${tokenIDOne.id}`,
        type: "Vest",
        verb: "Vest Withdrawn",
        transactions: arrTx,
      });

      let isApproved = await vedystcontract.methods
        .isApprovedForAll(account.address, CONTRACTS.VE_TOKEN_ADDRESS)
        .call();

      if (!isApproved) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow the veDYST For Merge`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on veDYST sufficient`,
          status: "DONE",
        });
      }
      if (bribesLength !== 0) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: voteResetTXID,
          description: `Reset the veDYST Votes`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: voteResetTXID,
          description: `Votes Reseted`,
          status: "DONE",
        });
      }

      const gasPrice = await stores.accountStore.getGasPrice();
      if (!isApproved) {
        const approve = new Promise((resolve, reject) => {
          this._callContractWait(
            web3,
            vedystcontract,
            "setApprovalForAll",
            [CONTRACTS.VE_TOKEN_ADDRESS, "true"],
            account,
            gasPrice,
            null,
            null,
            allowanceTXID,
            (err) => {
              if (err) {
                reject(err);
                return;
              }

              resolve();
            }
          );
        });

        allowanceCallsPromise.push(approve);
        await Promise.all(allowanceCallsPromise);
      }
      if (gaugesLength !== 0) {
        for (var i = 0; i < gaugesLength; i++) {
          let gaugeContract = new web3.eth.Contract(
            CONTRACTS.GAUGE_ABI,
            gauges[i].gauge.id
          );
          const withdrawAll = new Promise((resolve, reject) => {
            this._callContractWait(
              web3,
              gaugeContract,
              "withdrawAll",
              [],
              account,
              gasPrice,
              null,
              null,
              withdrawAllTXID[i],
              (err) => {
                if (err) {
                  reject(err);
                  return;
                }

                resolve();
              }
            );
          });

          allowanceCallsPromise.push(withdrawAll);

          const done = await Promise.all(allowanceCallsPromise);
        }
      }

      // SUBMIT INCREASE TRANSACTION
      const voterContract = new web3.eth.Contract(
        CONTRACTS.VOTER_ABI,
        CONTRACTS.VOTER_ADDRESS
      );

      if (bribesLength > 0) {
        const reset = new Promise((resolve, reject) => {
          this._callContractWait(
            web3,
            voterContract,
            "reset",
            [tokenIDOne.id],
            account,
            gasPrice,
            null,
            null,
            voteResetTXID,
            (err) => {
              if (err) {
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
      const merge = new Promise((resolve, reject) => {
        this._callContractWait(
          web3,
          vedystcontract,
          "merge",
          [tokenIDOne.id, tokenIDTwo.id],
          account,
          gasPrice,
          null,
          null,
          mergeTXID,
          (err) => {
            if (err) {
              reject(err);
              return;
            }

            resolve();
          }
        );
      });

      allowanceCallsPromise.push(merge);
      await Promise.all(allowanceCallsPromise);
      router.push("/vest");
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  vote = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const govToken = this.getStore("govToken");
      const { tokenID, votes } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let voteTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
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

      const gasPrice = await stores.accountStore.getGasPrice();

      // SUBMIT INCREASE TRANSACTION
      const gaugesContract = new web3.eth.Contract(
        CONTRACTS.VOTER_ABI,
        CONTRACTS.VOTER_ADDRESS
      );

      let onlyVotes = votes.filter((vote) => {
        return BigNumber(vote.value).gt(0) || BigNumber(vote.value).lt(0);
      });

      let tokens = onlyVotes.map((vote) => {
        return vote.address;
      });

      let voteCounts = onlyVotes.map((vote) => {
        return BigNumber(vote.value).times(100).toFixed(0);
      });

      this._callContractWait(
        web3,
        gaugesContract,
        "vote",
        [tokenID, tokens, voteCounts],
        account,
        gasPrice,
        null,
        null,
        voteTXID,
        (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          this.emitter.emit(ACTIONS.VOTE_RETURNED);
        }
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  resetVote = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { tokenID } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let voteTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
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

      const gasPrice = await stores.accountStore.getGasPrice();

      // SUBMIT INCREASE TRANSACTION
      const gaugesContract = new web3.eth.Contract(
        CONTRACTS.VOTER_ABI,
        CONTRACTS.VOTER_ADDRESS
      );

      this._callContractWait(
        web3,
        gaugesContract,
        "reset",
        [tokenID],
        account,
        gasPrice,
        null,
        null,
        voteTXID,
        (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          this.emitter.emit(ACTIONS.VOTE_RETURNED);
        }
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  getVestVotes = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { tokenID } = payload.content;
      const pairs = this.getStore("pairs");

      if (!pairs) {
        return null;
      }

      if (!tokenID) {
        return;
      }

      const filteredPairs = pairs.filter((pair) => {
        return pair && pair.gauge && pair.gauge.address;
      });

      const gaugesContract = new web3.eth.Contract(
        CONTRACTS.VOTER_ABI,
        CONTRACTS.VOTER_ADDRESS
      );

      const multicall = await stores.accountStore.getMulticall();
      const calls = filteredPairs.map((pair) => {
        let v = gaugesContract.methods.votes(tokenID, pair.address);
        return v;
      });

      const voteCounts = await multicall.aggregate(calls);
      let votes = [];

      const totalVotes = voteCounts.reduce((curr, acc) => {
        let num = BigNumber(acc).gt(0)
          ? acc
          : BigNumber(acc).times(-1).toNumber(0);
        return BigNumber(curr).plus(num);
      }, 0);
      let t = 0;
      for (let i = 0; i < voteCounts.length; i++) {
        t = t + parseInt(voteCounts[i]);
      }

      for (let i = 0; i < voteCounts.length; i++) {
        votes.push({
          address: filteredPairs[i].address,
          votePercent:
            BigNumber(totalVotes).gt(0) || BigNumber(totalVotes).lt(0)
              ? (voteCounts[i] / t) * 100
              : "0",
        });
      }
      this.emitter.emit(ACTIONS.VEST_VOTES_RETURNED, votes);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  createBribe = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { asset, amount, gauge } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let allowanceTXID = this.getTXUUID();
      let bribeTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
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
      const allowance = await this._getBribeAllowance(
        web3,
        asset,
        gauge,
        account
      );

      if (BigNumber(allowance).lt(amount)) {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allow the bribe contract to spend your ${asset.symbol}`,
        });
      } else {
        this.emitter.emit(ACTIONS.TX_STATUS, {
          uuid: allowanceTXID,
          description: `Allowance on ${asset.symbol} sufficient`,
          status: "DONE",
        });
      }

      const gasPrice = await stores.accountStore.getGasPrice();

      const allowanceCallsPromises = [];

      // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
      if (BigNumber(allowance).lt(amount)) {
        const tokenContract = new web3.eth.Contract(
          CONTRACTS.ERC20_ABI,
          asset.address
        );

        const tokenPromise = new Promise((resolve, reject) => {
          this._callContractWait(
            web3,
            tokenContract,
            "approve",
            [gauge.gauge.bribeAddress, MAX_UINT256],
            account,
            gasPrice,
            null,
            null,
            allowanceTXID,
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

      const done = await Promise.all(allowanceCallsPromises);

      // SUBMIT BRIBE TRANSACTION
      const bribeContract = new web3.eth.Contract(
        CONTRACTS.BRIBE_ABI,
        gauge.gauge.bribeAddress
      );

      const sendAmount = BigNumber(amount)
        .times(10 ** asset.decimals)
        .toFixed(0);

      this._callContractWait(
        web3,
        bribeContract,
        "notifyRewardAmount",
        [asset.address, sendAmount],
        account,
        gasPrice,
        null,
        null,
        bribeTXID,
        async (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          await this.updatePairsCall(web3, account);

          this.emitter.emit(ACTIONS.BRIBE_CREATED);
        }
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  _getBribeAllowance = async (web3, token, pair, account) => {
    try {
      const tokenContract = new web3.eth.Contract(
        CONTRACTS.ERC20_ABI,
        token.address
      );
      const allowance = await tokenContract.methods
        .allowance(account.address, pair.gauge.bribeAddress)
        .call();
      return BigNumber(allowance)
        .div(10 ** parseInt(token.decimals))
        .toFixed(parseInt(token.decimals));
    } catch (ex) {
      console.error(ex);
      return null;
    }
  };

  getVestBalances = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { tokenID } = payload.content;
      const pairs = this.getStore("pairs");

      if (!pairs) {
        return null;
      }

      if (!tokenID) {
        return;
      }

      const filteredPairs = pairs.filter((pair) => {
        return pair && pair.gauge;
      });
      const multicall = await stores.accountStore.getMulticall();

      const bribesEarned = await Promise.all(
        filteredPairs.map(async (pair) => {
          const bribeContract = new web3.eth.Contract(
            CONTRACTS.BRIBE_ABI,
            pair.gauge.bribeAddress
          );
          const [rewardsListLength] = await multicall.aggregate([
            bribeContract.methods.rewardTokensLength(),
          ]);

          if (rewardsListLength > 0) {
            const bribeTokens = [
              { rewardRate: "", rewardAmount: "", address: "" },
            ];
            for (let i = 0; i < rewardsListLength; i++) {
              let [bribeTokenAddress] = await multicall.aggregate([
                bribeContract.methods.rewardTokens(i),
              ]);

              bribeTokens.push({
                address: bribeTokenAddress,
                rewardAmount: 0,
                rewardRate: 0,
              });
            }

            bribeTokens.unshift();

            const bribesEarned = await Promise.all(
              bribeTokens.map(async (bribe) => {
                const bribeContract = new web3.eth.Contract(
                  CONTRACTS.BRIBE_ABI,
                  pair.gauge.bribeAddress
                );
                const [add] = await Promise.all([
                  bribeContract.methods.tokenIdToAddress(tokenID).call(),
                ]);
                const [earned] = await Promise.all([
                  bribeContract.methods.earned(bribe.address, add).call(),
                ]);
                const tokenContract = new web3.eth.Contract(
                  CONTRACTS.ERC20_ABI,
                  bribe.address
                );
                const [decimals] = await multicall.aggregate([
                  tokenContract.methods.decimals(),
                ]);

                return {
                  earned: BigNumber(earned)
                    .div(10 ** parseInt(decimals))
                    .toFixed(parseInt(decimals)),
                };
              })
            );
            pair.gauge.bribesEarned = bribesEarned ? bribesEarned : null;

            return pair;
          }
        })
      );

      this.emitter.emit(ACTIONS.VEST_BALANCES_RETURNED, bribesEarned);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  getRewardBalances = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { tokenID } = payload.content;

      const pairs = this.getStore("pairs");
      const veToken = this.getStore("veToken");
      const govToken = this.getStore("govToken");

      const filteredPairs = [
        ...pairs.filter((pair) => {
          return pair && pair.gauge;
        }),
      ];

      const filteredPairs2 = [
        ...pairs.filter((pair) => {
          return pair && pair.gauge;
        }),
      ];

      let veDistReward = [];

      let filteredBribes = [];

      const multicall = await stores.accountStore.getMulticall();

      if (tokenID) {
        const bribesEarned = await Promise.all(
          filteredPairs.map(async (pair) => {
            const bribeContract = new web3.eth.Contract(
              CONTRACTS.BRIBE_ABI,
              pair.gauge.bribeAddress
            );
            const [rewardsListLength] = await multicall.aggregate([
              bribeContract.methods.rewardTokensLength(),
            ]);

            const bribeTokens = [
              { rewardRate: "", rewardAmount: "", address: "", symbol: "" },
            ];
            for (let i = 0; i < rewardsListLength; i++) {
              let [bribeTokenAddress] = await multicall.aggregate([
                bribeContract.methods.rewardTokens(i),
              ]);

              bribeTokens.push({
                address: bribeTokenAddress,
                rewardAmount: 0,
                rewardRate: 0,
                symbol: null,
              });
            }

            bribeTokens.shift();

            const bribesEarned = await Promise.all(
              bribeTokens.map(async (bribe) => {
                const bribeContract = new web3.eth.Contract(
                  CONTRACTS.BRIBE_ABI,
                  pair.gauge.bribeAddress
                );
                const [add] = await Promise.all([
                  bribeContract.methods.tokenIdToAddress(tokenID).call(),
                ]);
                const [earned] = await Promise.all([
                  bribeContract.methods.earned(bribe.address, add).call(),
                ]);
                const tokenContract = new web3.eth.Contract(
                  CONTRACTS.ERC20_ABI,
                  bribe.address
                );
                const [decimals, symbol] = await multicall.aggregate([
                  tokenContract.methods.decimals(),
                  tokenContract.methods.symbol(),
                ]);

                bribe.earned = BigNumber(earned)
                  .div(10 ** decimals)
                  .toFixed(parseInt(decimals));
                bribe.symbol = symbol;
                return bribe;
              })
            );

            pair.gauge.bribesEarned = bribesEarned;

            return pair;
          })
        );
        filteredBribes = bribesEarned
          .filter((pair) => {
            if (
              pair.gauge &&
              pair.gauge.bribesEarned &&
              pair.gauge.bribesEarned.length > 0
            ) {
              let shouldReturn = false;

              for (let i = 0; i < pair.gauge.bribesEarned.length; i++) {
                if (BigNumber(pair.gauge.bribesEarned[i].earned).gt(0)) {
                  shouldReturn = true;
                }
              }

              return shouldReturn;
            }

            return false;
          })
          .map((pair) => {
            pair.rewardType = "Bribe";
            return pair;
          });

        const veDistContract = new web3.eth.Contract(
          CONTRACTS.VE_DIST_ABI,
          CONTRACTS.VE_DIST_ADDRESS
        );
        const veDistEarned = await veDistContract.methods
          .claimable(tokenID)
          .call();
        const vestNFTs = this.getStore("vestNFTs");
        let theNFT = vestNFTs.filter((vestNFT) => {
          return vestNFT.id == tokenID;
        });

        if (BigNumber(veDistEarned).gt(0)) {
          veDistReward.push({
            token: theNFT[0],
            lockToken: veToken,
            rewardToken: govToken,
            earned: BigNumber(veDistEarned)
              .div(10 ** govToken.decimals)
              .toFixed(govToken.decimals),
            rewardType: "Distribution",
          });
        }
      }

      const filteredFees = [];
      for (let i = 0; i < pairs.length; i++) {
        let pair = Object.assign({}, pairs[i]);
        if (
          BigNumber(pair.claimable0).gt(0) ||
          BigNumber(pair.claimable1).gt(0)
        ) {
          pair.rewardType = "Fees";
          filteredFees.push(pair);
        }
      }
      const rewardsEarned = await Promise.all(
        filteredPairs2.map(async (pair) => {
          const gaugeContract = new web3.eth.Contract(
            CONTRACTS.GAUGE_ABI,
            pair.gauge.address
          );

          const [earned] = await Promise.all([
            gaugeContract.methods
              .earned(CONTRACTS.GOV_TOKEN_ADDRESS, account.address)
              .call(),
          ]);

          pair.gauge.rewardsEarned = BigNumber(earned)
            .div(10 ** 18)
            .toFixed(18);

          return pair;
        })
      );
      const filteredRewards = [];
      for (let j = 0; j < rewardsEarned.length; j++) {
        let pair = Object.assign({}, rewardsEarned[j]);
        if (
          pair.gauge &&
          pair.gauge.rewardsEarned &&
          BigNumber(pair.gauge.rewardsEarned).gt(0)
        ) {
          pair.rewardType = "Reward";
          filteredRewards.push(pair);
        }
      }

      const rewards = {
        bribes: filteredBribes,
        fees: filteredFees,
        rewards: filteredRewards,
        veDist: veDistReward,
      };

      this.setStore({
        rewards,
      });

      this.emitter.emit(ACTIONS.REWARD_BALANCES_RETURNED, rewards);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  claimBribes = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { pair, tokenID } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let claimTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
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

      const gasPrice = await stores.accountStore.getGasPrice();

      // SUBMIT CLAIM TRANSACTION
      const gaugesContract = new web3.eth.Contract(
        CONTRACTS.VOTER_ABI,
        CONTRACTS.VOTER_ADDRESS
      );

      const sendGauges = [pair.gauge.bribeAddress];
      const sendTokens = [
        pair.gauge.bribesEarned.map((bribe) => {
          return bribe.address;
        }),
      ];

      this._callContractWait(
        web3,
        gaugesContract,
        "claimBribes",
        [sendGauges, sendTokens, tokenID],
        account,
        gasPrice,
        null,
        null,
        claimTXID,
        async (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          this.getRewardBalances({ content: { tokenID } });
          this.emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED);
        }
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  claimAllRewards = async (payload) => {
    try {
      const context = this;
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { pairs, tokenID } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let claimTXID = this.getTXUUID();
      let feeClaimTXIDs = [];
      let rewardClaimTXIDs = [];
      let distributionClaimTXIDs = [];

      let bribePairs = pairs.filter((pair) => {
        return pair.rewardType === "Bribe";
      });

      let feePairs = pairs.filter((pair) => {
        return pair.rewardType === "Fees";
      });

      let rewardPairs = pairs.filter((pair) => {
        return pair.rewardType === "Reward";
      });

      let distribution = pairs.filter((pair) => {
        return pair.rewardType === "Distribution";
      });

      const sendGauges = bribePairs.map((pair) => {
        return pair.gauge.bribeAddress;
      });
      const sendTokens = bribePairs.map((pair) => {
        return pair.gauge.bribesEarned.map((bribe) => {
          return bribe.address;
        });
      });

      if (
        bribePairs.length == 0 &&
        feePairs.length == 0 &&
        rewardPairs.length == 0
      ) {
        this.emitter.emit(ACTIONS.ERROR, "Nothing to claim");
        this.emitter.emit(ACTIONS.CLAIM_ALL_REWARDS_RETURNED);
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

      if (feePairs.length > 0) {
        for (let i = 0; i < feePairs.length; i++) {
          const newClaimTX = this.getTXUUID();

          feeClaimTXIDs.push(newClaimTX);
          sendOBJ.transactions.push({
            uuid: newClaimTX,
            description: `Claiming fees for ${feePairs[i].symbol}`,
            status: "WAITING",
          });
        }
      }

      if (rewardPairs.length > 0) {
        for (let i = 0; i < rewardPairs.length; i++) {
          const newClaimTX = this.getTXUUID();

          rewardClaimTXIDs.push(newClaimTX);
          sendOBJ.transactions.push({
            uuid: newClaimTX,
            description: `Claiming reward for ${rewardPairs[i].symbol}`,
            status: "WAITING",
          });
        }
      }

      if (distribution.length > 0) {
        for (let i = 0; i < distribution.length; i++) {
          const newClaimTX = this.getTXUUID();

          distributionClaimTXIDs.push(newClaimTX);
          sendOBJ.transactions.push({
            uuid: newClaimTX,
            description: `Claiming distribution for NFT #${distribution[i].token.id}`,
            status: "WAITING",
          });
        }
      }

      this.emitter.emit(ACTIONS.TX_ADDED, sendOBJ);

      const gasPrice = await stores.accountStore.getGasPrice();

      if (bribePairs.length > 0) {
        // SUBMIT CLAIM TRANSACTION
        const gaugesContract = new web3.eth.Contract(
          CONTRACTS.VOTER_ABI,
          CONTRACTS.VOTER_ADDRESS
        );

        const claimPromise = new Promise((resolve, reject) => {
          context._callContractWait(
            web3,
            gaugesContract,
            "claimBribes",
            [sendGauges, sendTokens, tokenID],
            account,
            gasPrice,
            null,
            null,
            claimTXID,
            (err) => {
              if (err) {
                reject(err);
                return;
              }

              resolve();
            }
          );
        });

        await Promise.all([claimPromise]);
      }

      if (feePairs.length > 0) {
        for (let i = 0; i < feePairs.length; i++) {
          const pairContract = new web3.eth.Contract(
            CONTRACTS.PAIR_ABI,
            feePairs[i].address
          );

          const claimPromise = new Promise((resolve, reject) => {
            context._callContractWait(
              web3,
              pairContract,
              "claimFees",
              [],
              account,
              gasPrice,
              null,
              null,
              feeClaimTXIDs[i],
              (err) => {
                if (err) {
                  reject(err);
                  return;
                }

                resolve();
              }
            );
          });

          await Promise.all([claimPromise]);
        }
      }

      if (rewardPairs.length > 0) {
        for (let i = 0; i < rewardPairs.length; i++) {
          const gaugeContract = new web3.eth.Contract(
            CONTRACTS.GAUGE_ABI,
            rewardPairs[i].gauge.address
          );
          const sendTok = [CONTRACTS.GOV_TOKEN_ADDRESS];

          const rewardPromise = new Promise((resolve, reject) => {
            context._callContractWait(
              web3,
              gaugeContract,
              "getReward",
              [account.address, sendTok],
              account,
              gasPrice,
              null,
              null,
              rewardClaimTXIDs[i],
              (err) => {
                if (err) {
                  reject(err);
                  return;
                }

                resolve();
              }
            );
          });

          await Promise.all([rewardPromise]);
        }
      }

      if (distribution.length > 0) {
        const veDistContract = new web3.eth.Contract(
          CONTRACTS.VE_DIST_ABI,
          CONTRACTS.VE_DIST_ADDRESS
        );
        for (let i = 0; i < distribution.length; i++) {
          const rewardPromise = new Promise((resolve, reject) => {
            context._callContractWait(
              web3,
              veDistContract,
              "claim",
              [tokenID],
              account,
              gasPrice,
              null,
              null,
              distributionClaimTXIDs[i],
              (err) => {
                if (err) {
                  reject(err);
                  return;
                }

                resolve();
              }
            );
          });

          await Promise.all([rewardPromise]);
        }
      }

      this.getRewardBalances({ content: { tokenID } });
      this.emitter.emit(ACTIONS.CLAIM_ALL_REWARDS_RETURNED);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  claimRewards = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { pair, tokenID } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let claimTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
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

      const gasPrice = await stores.accountStore.getGasPrice();

      // SUBMIT CLAIM TRANSACTION
      const gaugeContract = new web3.eth.Contract(
        CONTRACTS.GAUGE_ABI,
        pair.gauge.address
      );

      const sendTokens = [CONTRACTS.GOV_TOKEN_ADDRESS];

      this._callContractWait(
        web3,
        gaugeContract,
        "getReward",
        [account.address, sendTokens],
        account,
        gasPrice,
        null,
        null,
        claimTXID,
        async (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          this.getRewardBalances({ content: { tokenID } });
          this.emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED);
        }
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  claimVeDist = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { tokenID } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let claimTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
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

      const gasPrice = await stores.accountStore.getGasPrice();

      // SUBMIT CLAIM TRANSACTION
      const veDistContract = new web3.eth.Contract(
        CONTRACTS.VE_DIST_ABI,
        CONTRACTS.VE_DIST_ADDRESS
      );

      this._callContractWait(
        web3,
        veDistContract,
        "claim",
        [tokenID],
        account,
        gasPrice,
        null,
        null,
        claimTXID,
        async (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          this.getRewardBalances({ content: { tokenID } });
          this.emitter.emit(ACTIONS.CLAIM_VE_DIST_RETURNED);
        }
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  claimPairFees = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { pair, tokenID } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let claimTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
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

      const gasPrice = await stores.accountStore.getGasPrice();

      // SUBMIT CLAIM TRANSACTION
      const pairContract = new web3.eth.Contract(
        CONTRACTS.PAIR_ABI,
        pair.address
      );

      this._callContractWait(
        web3,
        pairContract,
        "claimFees",
        [],
        account,
        gasPrice,
        null,
        null,
        claimTXID,
        async (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          this.getRewardBalances({ content: { tokenID } });
          this.emitter.emit(ACTIONS.CLAIM_REWARD_RETURNED);
        }
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  searchWhitelist = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }
      const veToken = this.getStore("veToken");

      const { search } = payload.content;

      const voterContract = new web3.eth.Contract(
        CONTRACTS.VOTER_ABI,
        CONTRACTS.VOTER_ADDRESS
      );

      const [isWhitelisted, listingFee] = await Promise.all([
        voterContract.methods.isWhitelisted(search).call(),
        voterContract.methods.listingFee().call(),
      ]);

      const token = await this.getBaseAsset(search);
      token.isWhitelisted = isWhitelisted;
      token.listingFee = BigNumber(listingFee)
        .div(10 ** 18)
        .toFixed(18);

      this.emitter.emit(ACTIONS.SEARCH_WHITELIST_RETURNED, token);
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  whitelistToken = async (payload) => {
    try {
      const account = stores.accountStore.getStore("account");
      if (!account) {
        console.warn("account not found");
        return null;
      }

      const web3 = await stores.accountStore.getWeb3Provider();
      if (!web3) {
        console.warn("web3 not found");
        return null;
      }

      const { token, nft } = payload.content;

      // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
      let whitelistTXID = this.getTXUUID();

      this.emitter.emit(ACTIONS.TX_ADDED, {
        title: `WHITELIST ${token.symbol}`,
        verb: "Token Whitelisted",
        transactions: [
          {
            uuid: whitelistTXID,
            description: `Whitelisting ${token.symbol}`,
            status: "WAITING",
          },
        ],
      });

      const gasPrice = await stores.accountStore.getGasPrice();

      // SUBMIT WHITELIST TRANSACTION
      const voterContract = new web3.eth.Contract(
        CONTRACTS.VOTER_ABI,
        CONTRACTS.VOTER_ADDRESS
      );

      this._callContractWait(
        web3,
        voterContract,
        "whitelist",
        [token.address, nft.id],
        account,
        gasPrice,
        null,
        null,
        whitelistTXID,
        async (err) => {
          if (err) {
            return this.emitter.emit(ACTIONS.ERROR, err);
          }

          window.setTimeout(() => {
            this.dispatcher.dispatch({
              type: ACTIONS.SEARCH_WHITELIST,
              content: { search: token.address },
            });
          }, 2);

          this.emitter.emit(ACTIONS.WHITELIST_TOKEN_RETURNED);
        }
      );
    } catch (ex) {
      console.error(ex);
      this.emitter.emit(ACTIONS.ERROR, ex);
    }
  };

  _callContractWait = (
    web3,
    contract,
    method,
    params,
    account,
    gasPrice,
    dispatchEvent,
    dispatchContent,
    uuid,
    callback,
    paddGasCost,
    sendValue = null
  ) => {
    // console.log(method)
    // console.log(params)
    // if(sendValue) {
    //   console.log(sendValue)
    // }
    // console.log(uuid)
    //estimate gas
    this.emitter.emit(ACTIONS.TX_PENDING, { uuid });

    const gasCost = contract.methods[method](...params)
      .estimateGas({ from: account.address, value: sendValue })
      .then((gasAmount) => {
        const context = this;

        let sendGasAmount = BigNumber(gasAmount).times(1.5).toFixed(0);
        let sendGasPrice = BigNumber(gasPrice).times(1.5).toFixed(0);
        // if (paddGasCost) {
        //   sendGasAmount = BigNumber(sendGasAmount).times(1.15).toFixed(0)
        // }
        //
        // const sendGasAmount = '3000000'
        // const context = this
        //
        contract.methods[method](...params)
          .send({
            from: account.address,
            gasPrice: web3.utils.toWei(sendGasPrice, "gwei"),
            gas: sendGasAmount,
            value: sendValue,
            // maxFeePerGas: web3.utils.toWei(gasPrice, "gwei"),
            // maxPriorityFeePerGas: web3.utils.toWei("2", "gwei"),
          })
          .on("transactionHash", function (txHash) {
            context.emitter.emit(ACTIONS.TX_SUBMITTED, { uuid, txHash });
          })
          .on("receipt", function (receipt) {
            context.emitter.emit(ACTIONS.TX_CONFIRMED, {
              uuid,
              txHash: receipt.transactionHash,
            });
            callback(null, receipt.transactionHash);
            if (dispatchEvent) {
              context.dispatcher.dispatch({
                type: dispatchEvent,
                content: dispatchContent,
              });
            }
          })
          .on("error", function (error) {
            if (!error.toString().includes("-32601")) {
              if (error.message) {
                context.emitter.emit(ACTIONS.TX_REJECTED, {
                  uuid,
                  error: error.message,
                });
                return callback(error.message);
              }
              context.emitter.emit(ACTIONS.TX_REJECTED, { uuid, error: error });
              callback(error);
            }
          })
          .catch((error) => {
            if (!error.toString().includes("-32601")) {
              if (error.message) {
                context.emitter.emit(ACTIONS.TX_REJECTED, {
                  uuid,
                  error: error.message,
                });
                return callback(error.message);
              }
              context.emitter.emit(ACTIONS.TX_REJECTED, { uuid, error: error });
              callback(error);
            }
          });
      })
      .catch((ex) => {
        console.log(ex);
        if (ex.message) {
          this.emitter.emit(ACTIONS.TX_REJECTED, { uuid, error: ex.message });
          return callback(ex.message);
        }
        this.emitter.emit(ACTIONS.TX_REJECTED, {
          uuid,
          error: "Error estimating gas",
        });
        callback(ex);
      });
  };

  _makeBatchRequest = (web3, callFrom, calls) => {
    let batch = new web3.BatchRequest();

    let promises = calls.map((call) => {
      return new Promise((res, rej) => {
        let req = call.request({ from: callFrom }, (err, data) => {
          if (err) rej(err);
          else res(data);
        });
        batch.add(req);
      });
    });
    batch.execute();

    return Promise.all(promises);
  };
  //
  // _getMulticallWatcher = (web3, calls) => {
  //
  // }
}

export default Store;
