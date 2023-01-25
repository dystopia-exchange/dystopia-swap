import {
  MAX_UINT256,
  ACTIONS,
  CONTRACTS,
  ROUTE_ASSETS,
} from "./constants";
import {formatBN, getTXUUID, parseBN, removeDuplicate} from "../utils";
import stores from "./";
import BigNumber from "bignumber.js";
import pairContractAbi from "./abis/pairOldRouter.json";
import migratorAbi from "./abis/migrator.json";
import router from "next/router";
import {enrichAdditionalApr} from "./helpers/additional-apr-helper";
import {emitError} from "./helpers/emit-helper";
import {enrichPairInfo, getAndUpdatePair, getPairs, loadPair} from "./helpers/pair-helper";
import {getNftById, getVeApr, loadNfts} from "./helpers/ve-helper";
import {getVestVotes, resetVote, vote} from "./helpers/voter-helper";
import {getBalancesForBaseAssets, getBaseAssets, getOrCreateBaseAsset, getTokenBalance} from "./helpers/token-helper";
import {removeBaseAsset, saveLocalAsset} from "./helpers/local-storage-helper";
import {
  claimAllRewards,
  claimBribes,
  claimPairFees,
  claimRewards,
  claimVeDist,
  getRewardBalances
} from "./helpers/reward-helper";
import {
  createGauge,
  createPairDeposit,
  removeLiquidity,
  stakeLiquidity,
  unstakeLiquidity
} from "./helpers/deposit-helper";
import {quoteAddLiquidity, quoteRemoveLiquidity, quoteSwap} from "./helpers/router-helper";
import {swap, wrap, unwrap} from "./helpers/swap-helper";
import {createVest, increaseVestAmount, increaseVestDuration, merge, withdrawVest} from "./helpers/vest-helper";
import {createBribe} from "./helpers/bribe-helper";
import {searchWhitelist, whitelistToken} from "./helpers/whitelist-helpers";

class Store {

  configurationLoading = false;
  userAddress = null;
  id = null;

  constructor(dispatcher, emitter) {
    this.id = Date.now()
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

          /*case ACTIONS.GET_BALANCES:
            this.getBalances(payload);
            break;
          case ACTIONS.SEARCH_ASSET:
            this.searchBaseAsset(payload);
            break;*/

          // LIQUIDITY
          /*case ACTIONS.CREATE_PAIR_AND_STAKE:
            this.createPairStake(payload);
            break;*/
          case ACTIONS.CREATE_PAIR_AND_DEPOSIT:
            this.createPairDeposit(payload);
            break;
          case ACTIONS.ADD_LIQUIDITY:
            this.addLiquidity(payload);
            break;
          case ACTIONS.STAKE_LIQUIDITY:
            this.stakeLiquidity(payload);
            break;
          /*case ACTIONS.ADD_LIQUIDITY_AND_STAKE:
            this.addLiquidityAndStake(payload);
            break;*/
          case ACTIONS.QUOTE_ADD_LIQUIDITY:
            this.quoteAddLiquidity(payload);
            break;
          /*case ACTIONS.GET_LIQUIDITY_BALANCES:
            this.getLiquidityBalances(payload);
            break;*/
          case ACTIONS.REMOVE_LIQUIDITY:
            this.removeLiquidity(payload);
            break;
          /*case ACTIONS.UNSTAKE_AND_REMOVE_LIQUIDITY:
            this.unstakeAndRemoveLiquidity(payload);
            break;*/
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
          /*case ACTIONS.GET_VEST_BALANCES:
            this.getVestBalances(payload);
            break;*/

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

  // DISPATCHER FUNCTIONS
  configure = async () => {
    if (this.configurationLoading) {
      return;
    }

    const acc = stores.accountStore.getStore("account")
    if (acc && acc.address) {
      this.userAddress = acc.address
    }

    if (this.getUserAddress() === null || stores.accountStore.getStore("chainInvalid")) {
      // console.log('delay to load config')
      setTimeout(async () => await this.configure(), 1000);
      return;
    }
    // console.log('configure ', this.id)
    try {
      this.configurationLoading = true;

      // remove old values
      this.setStore({
        baseAssets: [],
        govToken: null,
        veToken: null,
        pairs: [],
        vestNFTs: null,
        rewards: {
          bribes: [],
          fees: [],
          rewards: [],
        },
      });


      this.setStore({
        govToken: {
          address: CONTRACTS.GOV_TOKEN_ADDRESS,
          name: CONTRACTS.GOV_TOKEN_NAME,
          symbol: CONTRACTS.GOV_TOKEN_SYMBOL,
          decimals: CONTRACTS.GOV_TOKEN_DECIMALS,
          logoURI: CONTRACTS.GOV_TOKEN_LOGO,
        }
      });

      this.setStore({ veToken: await this._getVeTokenBase() });
      this.setStore({ routeAssets: ROUTE_ASSETS });
      await this.loadBaseAssets()
      await this.getVestNFTs();
      await this.refreshPairs();
      await this._refreshGovTokenInfo(await this.getWeb3(), this.getUserAddress());
      await this._getBaseAssetInfo(await this.getWeb3(), this.getUserAddress());

      /*this.setStore({ baseAssets: await this._getBaseAssets() });
      this.setStore({ pairs: await this._getPairs() });*/

      this.emitter.emit(ACTIONS.UPDATED);
      this.emitter.emit(ACTIONS.CONFIGURED_SS);
    } finally {
      this.configurationLoading = false;
    }
  };

  getStore = (index) => {
    return this.store[index];
  };

  setStore = (obj) => {
    this.store = { ...this.store, ...obj };
    return this.emitter.emit(ACTIONS.STORE_UPDATED);
  };

  getUserAddress() {
    const adr = this.userAddress;
    if (!adr) {
      console.warn("user address not found");
      return null;
    }
    return adr;
  }

  async getWeb3() {
    const web3 = await stores.accountStore.getWeb3Provider();
    if (!web3) {
      console.warn("web3 not found");
      return null;
    }
    return web3;
  }

  ////////////////////////////////////////////////////////////////
  //                 PAIRS
  ////////////////////////////////////////////////////////////////
  refreshPairs = async () => {
    try {
      let pairs = this.getStore("pairs");
      if (!pairs || pairs.length === 0) {
        pairs = await getPairs();
      }
      await enrichPairInfo(
          await this.getWeb3(),
          this.getUserAddress(),
          pairs,
          await stores.accountStore.getMulticall(),
          this.getStore("baseAssets"),
          this.getStore("vestNFTs") ?? []
      );
      await enrichAdditionalApr(pairs)
      this.setStore({pairs: pairs});
    } catch (e) {
      console.error("Error refresh pairs", e);
      await emitError(this.emitter, "Error refresh pairs")
    }
  };

  getPairByAddress = async (pairAddress) => {
    try {
      const pairs = this.getStore("pairs");
      const pair = await getAndUpdatePair(pairAddress, await this.getWeb3(), this.getUserAddress(), pairs);
      this.setStore({pairs: pairs ?? []});
      return pair;
    } catch (e) {
      console.error("Error getting pair", e);
      await emitError(this.emitter, "Error get pair by address")
    }
  };

  getPair = async (addressA, addressB, stab) => {
    try {
      return await loadPair(
          addressA,
          addressB,
          stab,
          await this.getWeb3(),
          this.getUserAddress(),
          this.getStore("pairs"),
          this.getStore("baseAssets")
      );
    } catch (e) {
      console.error("Error get pair by assets", e);
      await emitError(this.emitter, "Error get pair by assets")
    }
  };

  //////////////////////////////////////////////////////////////
  //                   VE
  //////////////////////////////////////////////////////////////

  _getVeTokenBase = async () => {
    try {
      return {
        address: CONTRACTS.VE_TOKEN_ADDRESS,
        name: CONTRACTS.VE_TOKEN_NAME,
        symbol: CONTRACTS.VE_TOKEN_SYMBOL,
        decimals: CONTRACTS.VE_TOKEN_DECIMALS,
        logoURI: CONTRACTS.VE_TOKEN_LOGO,
        veDistApr: await getVeApr(),
      };
    } catch (e) {
      console.error("Error load ve info", e);
      await emitError(this.emitter, "Error load ve info")
    }
  };

  getNFTByID = async (id) => {
    try {
      const existNfts = this.getStore("vestNFTs") ?? [];
      const nft = getNftById(id, existNfts);
      if (nft !== null) {
        return nft;
      }
      const freshNft = await loadNfts(this.getUserAddress(), await this.getWeb3(), id);
      if (freshNft.length > 0) {
        existNfts.push(...freshNft)
      }
      return getNftById(id, existNfts);
    } catch (e) {
      console.log("Error get NFT by ID", e);
      await emitError(this.emitter, "Error get NFT by ID")
    }
  };

  getVestNFTs = async () => {
    try {
      const nfts = await loadNfts(this.getUserAddress(), await this.getWeb3());
      this.setStore({vestNFTs: nfts});
      this.emitter.emit(ACTIONS.VEST_NFTS_RETURNED, nfts);
      return nfts;
    } catch (e) {
      console.log("Error get Vest NFTs", e);
      await emitError(this.emitter, "Error get Vest NFTs")
    }
  };

  getVestVotes = async (payload) => {
    try {
      await getVestVotes(
          payload,
          this.getUserAddress(),
          await this.getWeb3(),
          this.emitter,
          this.getStore("pairs"),
          await stores.accountStore.getMulticall(),
          false // set true if any issues with subgraph
      );
    } catch (e) {
      console.log("Error get Vest Votes", e);
      await emitError(this.emitter, "Error get Vest Votes")
    }
  };

  //////////////////////////////////////////////////////////////
  //                   ASSETS
  //////////////////////////////////////////////////////////////

  async loadBaseAssets() {
    try {
      this.setStore({baseAssets: await getBaseAssets()});
    } catch (e) {
      console.log("Error get Base Assets", e);
      await emitError(this.emitter, "Error load Base Assets")
    }
  }

  removeBaseAsset = (asset) => {
    try {
      const baseAssets = removeDuplicate(removeBaseAsset(asset, this.getStore("baseAssets")));
      this.setStore({baseAssets: baseAssets});
      this.emitter.emit(ACTIONS.BASE_ASSETS_UPDATED, baseAssets);
    } catch (e) {
      console.log("Error remove base asset", e);
      emitError(this.emitter, "Error remove base asset")
    }
  };

  getBaseAsset = async (address, save, getBalance) => {
    if (!address) {
      return null;
    }
    try {
      const baseAssets = this.getStore("baseAssets");
      const newBaseAsset = await getOrCreateBaseAsset(baseAssets, address, await this.getWeb3(), this.getUserAddress(), getBalance);

      //only save when a user adds it. don't for when we look up a pair and find his asset.
      if (save) {
        saveLocalAsset(newBaseAsset);
        const storeBaseAssets = removeDuplicate([...baseAssets, newBaseAsset]);
        this.setStore({baseAssets: storeBaseAssets});
        this.emitter.emit(ACTIONS.BASE_ASSETS_UPDATED, storeBaseAssets);
      }
      return newBaseAsset;
    } catch (ex) {
      console.log("Get base asset error", ex);
      await emitError(this.emitter, "Error load base asset")
      return null;
    }
  };

  _refreshGovTokenInfo = async (web3, account) => {
    try {
      const govToken = this.getStore("govToken");
      const balance = await getTokenBalance(govToken.address, web3, account, govToken.decimals);
      govToken.balanceOf = parseBN(balance, govToken.decimals);
      govToken.balance = balance
      this.setStore({govToken});
      this.emitter.emit(ACTIONS.GOVERNANCE_ASSETS_UPDATED, govToken);
    } catch (ex) {
      console.log("Get gov token info error", ex);
      await emitError(this.emitter, "Error load governance token")
    }
  };

  _getBaseAssetInfo = async (web3, account) => {
    try {
      const baseAssets = this.getStore("baseAssets");
      await getBalancesForBaseAssets(web3, account, baseAssets, await stores.accountStore.getMulticall())
      this.setStore({baseAssets});
    } catch (e) {
      console.log("Error load governance token", e);
      await emitError(this.emitter, "Error load governance token")
    }
  };

  _refreshAssetBalance = async (web3, account, assetAddress) => {
    try {
      const baseAssets = this.getStore("baseAssets");
      const govToken = this.getStore("govToken");
      const asset = baseAssets?.filter((asset) => asset.address.toLowerCase() === assetAddress.toLowerCase())[0]
      if (!asset) {
        return;
      }
      if (asset.address === CONTRACTS.FTM_SYMBOL) {
        asset.balance = formatBN(await web3.eth.getBalance(account))
      } else {
        asset.balance = await getTokenBalance(assetAddress, web3, account, asset.decimals)
      }
      if (assetAddress.toLowerCase() === govToken.address.toLowerCase()) {
        await this._refreshGovTokenInfo(web3, account);
      }
      this.emitter.emit(ACTIONS.UPDATED);
    } catch (ex) {
      console.log("Refresh balance error", ex);
      await emitError(this.emitter, "Error refresh asset balances")
    }
  };

  //////////////////////////////////////////////////////////////
  //                   REWARDS
  //////////////////////////////////////////////////////////////

  getRewardBalances = async (payload) => {
    try {
      const rewards = await getRewardBalances(
          payload,
          this.getUserAddress(),
          await this.getWeb3(),
          this.emitter,
          this.getStore("pairs"),
          this.getStore("veToken"),
          this.getStore("govToken"),
          this.getStore("vestNFTs"),
          this.getStore("baseAssets") ?? [],
          await stores.accountStore.getMulticall(),
      );
      this.setStore({rewards});
      this.emitter.emit(ACTIONS.REWARD_BALANCES_RETURNED, rewards);
    } catch (e) {
      console.log("Error refresh reward balances", e);
      await emitError(this.emitter, "Error refresh reward balances")
    }
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////
  //                              Transactions calls
  ////////////////////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////////////////////////
  //                            LIQUIDITY
  ////////////////////////////////////////////////////////////////////////////////

  createPairDeposit = async (payload) => {
    const {token0, token1, amount0, amount1, isStable, slippage} = payload.content;
    await createPairDeposit(
        token0,
        token1,
        amount0,
        amount1,
        isStable,
        slippage,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        true,
        async () => await this.refreshPairs()
    );
  };

  quoteAddLiquidity = async (payload) => {
    await quoteAddLiquidity(
        payload,
        await this.getWeb3(),
        this.emitter,
    )
  };

  addLiquidity = async (payload) => {
    const {token0, token1, amount0, amount1, pair, slippage} = payload.content;
    await createPairDeposit(
        token0,
        token1,
        amount0,
        amount1,
        pair.isStable,
        slippage,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        false,
        async () => await this.refreshPairs()
    );
  };

  quoteRemoveLiquidity = async (payload) => {
    await quoteRemoveLiquidity(
        payload,
        await this.getWeb3(),
        this.emitter,
    )
  };

  removeLiquidity = async (payload) => {
    await removeLiquidity(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async () => await this.refreshPairs()
    )
  };


  ////////////////////////////////////////////////////////////////////////////////
  //                            STAKE
  ////////////////////////////////////////////////////////////////////////////////

  createGauge = async (payload) => {
    await createGauge(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async () => await this.refreshPairs()
    )
  };

  stakeLiquidity = async (payload) => {
    await stakeLiquidity(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async () => await this.refreshPairs()
    )
  };

  unstakeLiquidity = async (payload) => {
    await unstakeLiquidity(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async () => await this.refreshPairs()
    )
  };

  ////////////////////////////////////////////////////////////////////////////////
  //                            SWAP
  ////////////////////////////////////////////////////////////////////////////////

  quoteSwap = async (payload) => {
    return await quoteSwap(
        payload,
        await this.getWeb3(),
        this.getStore("routeAssets"),
        this.emitter,
        this.getStore("baseAssets")
    )
  };

  swap = async (payload) => {
    await swap(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async (web3, account, fromAsset, toAsset) => {
          await this._refreshAssetBalance(web3, account, fromAsset.address);
          await this._refreshAssetBalance(web3, account, toAsset.address);
        }
    )
  };

  wrap = async (payload) => {
    await wrap(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async (web3, account, fromAsset, toAsset) => {
          await this._refreshAssetBalance(web3, account, fromAsset.address);
          await this._refreshAssetBalance(web3, account, toAsset.address);
        }
    )
  };

  unwrap = async (payload) => {
    await unwrap(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async (web3, account, fromAsset, toAsset) => {
          await this._refreshAssetBalance(web3, account, fromAsset.address);
          await this._refreshAssetBalance(web3, account, toAsset.address);
        }
    )
  };

  ////////////////////////////////////////////////////////////////////////////////
  //                            VESTING
  ////////////////////////////////////////////////////////////////////////////////

  createVest = async (payload) => {
    await createVest(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        this.getStore("govToken"),
        async (web3, account) => {
          await this._refreshGovTokenInfo(web3, account);
          await this.getNFTByID("fetchAll");
        }
    )
  };

  increaseVestAmount = async (payload) => {
    await increaseVestAmount(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        this.getStore("govToken"),
        async (web3, account) => {
          await this._refreshGovTokenInfo(web3, account);
          await this.getNFTByID("fetchAll");
        }
    )
  };

  increaseVestDuration = async (payload) => {
    await increaseVestDuration(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async (tokenID) => {
          await this.getNFTByID(tokenID);
        }
    )
  };

  withdrawVest = async (payload) => {
    await withdrawVest(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async () => {
          await this.getNFTByID("fetchAll");
        }
    )
  };

  merge = async (payload) => {
    await merge(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async () => {
          await this.getNFTByID("fetchAll");
          await router.push("/vest");
        }
    )
  };

  ////////////////////////////////////////////////////////////////////////////////
  //                            VOTES
  ////////////////////////////////////////////////////////////////////////////////

  vote = async (payload) => {
    await vote(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
    )
  };

  resetVote = async (payload) => {
    await resetVote(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
    )
  };

  //////////////////////////////////////////////////////////////
  //                   BRIBE
  //////////////////////////////////////////////////////////////

  createBribe = async (payload) => {
    await createBribe(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async () => await this.refreshPairs()
    );
  };

  //////////////////////////////////////////////////////////////
  //                   CLAIM
  //////////////////////////////////////////////////////////////

  claimBribes = async (payload) => {
    await claimBribes(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async (tokenID) => await this.getRewardBalances({content: {tokenID}})
    )
  };

  claimAllRewards = async (payload) => {
    await claimAllRewards(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async (tokenID) => await this.getRewardBalances({content: {tokenID}})
    )
  };

  claimRewards = async (payload) => {
    await claimRewards(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async (tokenID) => await this.getRewardBalances({content: {tokenID}})
    )
  };

  claimVeDist = async (payload) => {
    await claimVeDist(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async (tokenID) => await this.getRewardBalances({content: {tokenID}})
    )
  };

  claimPairFees = async (payload) => {
    await claimPairFees(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async (tokenID) => await this.getRewardBalances({content: {tokenID}})
    )
  };

  //////////////////////////////////////////////////////////////
  //                   WHITELIST
  //////////////////////////////////////////////////////////////

  searchWhitelist = async (payload) => {
    try {
      await searchWhitelist(
          payload,
          await this.getWeb3(),
          this.emitter,
          async (search) => await this.getBaseAsset(search)
      );
    } catch (e) {
      console.log("Error search whitelist tokens", e);
      await emitError(this.emitter, "Error search whitelist tokens")
    }
  };

  whitelistToken = async (payload) => {
    await whitelistToken(
        payload,
        this.getUserAddress(),
        await this.getWeb3(),
        this.emitter,
        this.dispatcher,
        await stores.accountStore.getGasPrice(),
        async (dispatcher, token) => {
          window.setTimeout(() => {
            dispatcher.dispatch({
              type: ACTIONS.SEARCH_WHITELIST,
              content: {search: token.address},
            });
          }, 2);
        }
    )
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
      let allowanceTXID = getTXUUID();
      let depositTXID = getTXUUID();

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
    // this.emitter.emit(ACTIONS.TX_PENDING, { uuid });

    const gasCost = contract.methods[method](...params)
      .estimateGas({ from: account.address, value: sendValue })
      .then((gasAmount) => {
        const context = this;

        let sendGasAmount = BigNumber(gasAmount).times(1.2).toFixed(0);
        let sendGasPrice = BigNumber(gasPrice).times(1.2).toFixed(0);
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

}

export default Store;
