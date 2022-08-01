import { makeAutoObservable, action } from 'mobx'
import {allowance, approve, doSwap, getSwapContract, swapQuery, api} from "./utils";
import * as ethers from 'ethers'
import { debounce } from "debounce"
import stores from "../../stores";
import { wmaticAbi } from './wmaticAbi'
import {CONTRACTS} from "../../stores/constants";

const erc20abi = [
    // Read-Only Functions
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",

    // Authenticated Functions
    "function transfer(address to, uint amount) returns (bool)",

    // Events
    "event Transfer(address indexed from, address indexed to, uint amount)"
];

function getPoolInfo(multiswapData, poolId) {
    const dexId = parseInt(poolId.slice(-1), 16);

    const _DEX_MASK =
        '0x0000000000000000000000000000000000000000fffffffffffffffffffffff0';

    for (const dex of multiswapData.dexes) {
        if (
            dex.mask &&
            simpleAnd(poolId, _DEX_MASK) === dex.mask &&
            dex.dexId === dexId
        ) {
            return dex;
        }
    }
    return multiswapData.dexes[0]; // first dex must be main Balancer dex
}

function simpleAnd(a, mask) {
    const A = ethers.utils.arrayify(a, undefined);
    const M = ethers.utils.arrayify(mask, undefined);
    const C = [...A];
    for (let i = 0; i < A.length; i++) C[i] = A[i] & M[i];
    return ethers.utils.hexlify(C, {});
}

const WMATIC = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'

class MultiSwapStore {
    tokensMap = {}
    data = {}

    provider = null
    tokenIn = null
    priceInfo = {
        tokenInPrice: null,
        tokenOutPrice: null,
    }
    priceImpact = null
    tokenOut = null
    swapAmount = null
    slippage = '2'
    excludePlatforms = []

    isFetchingSwapQuery = false
    swap = null

    allowed = false
    isFetchingAllowance = false
    isFetchingApprove = false
    isFetchingSwap = false

    debSwapQuery = null
    error = null

    constructor() {
        makeAutoObservable(this, {
            setTokenIn: action.bound,
            setTokenOut: action.bound,
            setSwapAmount: action.bound,
            setSlippage: action.bound,
            setProvider: action.bound,
            excludePlatformToggle: action.bound,
            calcPriceInfo: action.bound,
            reverseTokens: action.bound,
            approve: action.bound,
            doSwap: action.bound,
        })

        this.debSwapQuery = debounce(this._swapQuery.bind(this), 300)
    }

    setProvider(provider) {
        this.provider = provider
    }

    get contract() {
        return getSwapContract(this.provider.getSigner())
    }

    setTokenIn(value) {
        this.tokenIn = value
        this.swap = null
        this.error = null
        this.allowed = false
        this._checkAllowance()
        this.debSwapQuery()
    }

    setTokenOut(value) {
        this.tokenOut = value
        this.swap = null
        this.error = null
        this.debSwapQuery()
    }

    setSwapAmount(value) {
        this.swapAmount = value
        this.error = null
        this.debSwapQuery()
    }

    setSlippage(value) {
        this.slippage = value
    }

    reverseTokens() {
        this.setTokenIn(this.tokenOut)
        this.setTokenOut(this.tokenIn)
    }

    async approve() {
        if (this.provider && this.tokenIn) {
            this.isFetchingApprove = true
            try {
                const res = await approve(this.tokenIn, this.provider)
                await res.wait()
                await this._checkAllowance()
            } catch (e) {
                this.error = 'Transaction of approve is failed'
            } finally {
                this.isFetchingApprove = false
            }
        }
    }

    async calcPriceImpact(priceInfo) {
        const [tokenIn, tokenOut] = await Promise.all([
            this._getToken(this.tokenIn),
            this._getToken(this.tokenOut),
        ])
        const minSwapAmount = ethers.utils.parseUnits('1000', tokenIn.decimals).toString();
        const response = await swapQuery(tokenIn, tokenOut, minSwapAmount, this.excludePlatforms)
        const minSwapPriceInfo = this.calcPriceInfo(tokenIn, tokenOut, response)
        const priceImpact = 100 - (parseFloat(priceInfo.tokenInPrice) * 100 / parseFloat(minSwapPriceInfo.tokenInPrice))
        return priceImpact
    }

    calcPriceInfo(tokenIn, tokenOut, swap) {
        if (!tokenOut || !swap) {
            return {
                tokenInPrice: null,
                tokenOutPrice: null,
            }
        }

        const returnAmount = ethers.utils.formatUnits(swap.returnAmount, tokenOut.decimals).toString();
        const swapAmount = ethers.utils.formatUnits(swap.swapAmount, tokenIn.decimals).toString();
        const tokenInPrice = (parseFloat(returnAmount) / parseFloat(swapAmount))
        const tokenOutPrice = (parseFloat(swapAmount) / parseFloat(returnAmount));

        return {
            tokenInPrice,
            tokenOutPrice,
        }
    }

    async doSwap() {
        if (this.swap === null) {
            return
        }

        this.isFetchingSwap = true

        try {
            if (this.isMaticToken) {
                await this.swapMatic()
            } else {
                const res = await doSwap(this.swap, this.slippage, this.provider)
                await res.wait()
                await stores.stableSwapStore.fetchBaseAssets([this.tokenIn, this.tokenOut])
            }
        } catch (e) {
            console.log('error', e)
            this.error = 'Swap request error'
        } finally {
            this.isFetchingSwap = false
        }
    }

    async _getToken(address) {
        if (!(address in this.tokensMap)) {
            const erc20 = new ethers.Contract(address, erc20abi, this.provider)
            const decimals = await erc20.decimals()
            const symbol = await erc20.symbol()
            const token = { address, decimals, symbol }
            this.tokensMap[address] = token
        }
        return this.tokensMap[address]
    }

    excludePlatformToggle(id) {
        this.error = null

        if (this.excludePlatforms.includes(id)) {
            this.excludePlatforms = this.excludePlatforms.filter(el => el !== id)
        } else {
            this.excludePlatforms = [...this.excludePlatforms, id]
        }

        this._swapQuery()
    }

    get isMaticToken() {
        return this.tokenIn === 'MATIC' || this.tokenOut === 'MATIC'
    }

    async _swapQuery() {
        if (this.isMaticToken) {
            this.allowed = true
            const returnAmount = ethers.utils.parseUnits(this.swapAmount ?? '0', 18).toString()
            this.swap = { returnAmount }
            return
        }

        if (this.tokenIn && this.tokenOut && this.swapAmount && this.provider) {
            const [tokenIn, tokenOut] = await Promise.all([
              this._getToken(this.tokenIn),
              this._getToken(this.tokenOut),
            ])
            const swapAmount = ethers.utils.parseUnits(this.swapAmount, tokenIn.decimals).toString();
            this.isFetchingSwapQuery = true

            try {
                const response = await swapQuery(tokenIn, tokenOut, swapAmount, this.excludePlatforms)
                this.swap = response
                this.priceInfo = this.calcPriceInfo(tokenIn, tokenOut, response)
                this.priceImpact = await this.calcPriceImpact(this.priceInfo)

                if (this.swap?.swaps?.length === 0) {
                    this.error = 'Routes not found'
                }
            } catch (e) {
                this.error = 'Swap query request error'
            } finally {
                this.isFetchingSwapQuery = false
            }
        }
    }

    async _checkAllowance() {
        if (this.isMaticToken) {
            this.allowed = true
            return true
        }

        if (this.provider) {
            this.isFetchingAllowance = true
            const response = await allowance(this.tokenIn, this.provider)
            this.allowed = response
            this.isFetchingAllowance = false
            return response
        }
        return false
    }

    async _fetchData() {
        const requests = [api('info'), api('dexes'), api('tokens')];
        const [service, dexes, tokens] = await Promise.all(requests);
        this.data = { service, dexes, tokens }
    }

    get routes() {
        const tokenByIndex = (swap, i) => {
            const address = swap.tokenAddresses[i];
            this._getToken(address)
            return address
        }

        if (this.swap === null) {
            return null
        } else {
            return this.swap.swaps?.map((s) => {
                let percentage = null;

                if (parseFloat(s.amount) > 0) {
                    percentage = ethers.BigNumber.from(s.amount)
                        .mul(100)
                        .div(this.swap.swapAmount)
                        .toString();
                }

                const tokenIn = tokenByIndex(this.swap, s.assetInIndex);
                const tokenOut = tokenByIndex(this.swap, s.assetOutIndex);
                const dex = getPoolInfo(this.data, s.poolId);

                return {
                    percentage,
                    tokenIn,
                    tokenOut,
                    dex
                }
            })?.reduce((acc, item) => {
                if (item.percentage !== null) {
                    acc.push([item])
                } else {
                    acc[acc.length - 1].push(item)
                }
                return acc
            }, []) ?? []
        }
    }

    get excludedPlatforms() {
        return this.excludePlatforms
    }

    async swapMatic() {
        const tokens = [this.tokenIn, this.tokenOut].map((el) => el.toLowerCase())

        const contract = new ethers.Contract(WMATIC, wmaticAbi, this.provider.getSigner())
        const web3 = await stores.accountStore.getWeb3Provider();
        const gasPrice = await stores.accountStore.getGasPrice();
        const wmaticContract = new web3.eth.Contract(
            CONTRACTS.WFTM_ABI,
            CONTRACTS.WFTM_ADDRESS
        );
        const account = stores.accountStore.getStore("account");

        if (tokens.includes('matic') && tokens.includes(WMATIC.toLowerCase())) {
            const amount = ethers.utils.parseUnits(this.swapAmount, 18).toString()
            let wrapTXID = stores.stableSwapStore.getTXUUID();

            if (this.tokenIn === 'MATIC') {
                const depositPromise = new Promise((resolve, reject) => {
                    stores.stableSwapStore._callContractWait(
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
                        amount,
                    );
                });
                await depositPromise;
            } else {
                const res = await contract.withdraw(amount)
                await res.wait()
                await stores.stableSwapStore.fetchBaseAssets([this.tokenIn])
            }
            await stores.stableSwapStore.fetchBaseAssets([WMATIC])
            await stores.stableSwapStore._getBaseAssetInfo(web3, account)
        }
    }
}

export const multiSwapStore = new MultiSwapStore()
