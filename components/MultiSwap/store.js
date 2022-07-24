import { makeAutoObservable, action } from 'mobx'
import {allowance, approve, doSwap, getSwapContract, swapQuery, api} from "./utils";
import * as ethers from 'ethers'
import { debounce } from "debounce"
import stores from "../../stores";
import {ACTIONS} from "../../stores/constants";

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
    console.log('getPoolInfo poolId', poolId);
    const dexId = parseInt(poolId.slice(-1), 16);
    console.log('dexId', dexId);

    for (const dex of multiswapData.dexes) {
        if (
            dex.mask &&
            simpleAnd(poolId, dex.mask) === dex.mask &&
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


class MultiSwapStore {
    tokensMap = {}
    data = {}

    provider = null

    tokenIn = null
    tokenOut = null
    swapAmount = null
    slippage = '2'

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
        this.setTokenIn(this.setTokenOut)
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

    async doSwap() {
        if (this.swap) {
            this.isFetchingSwap = true
                try {
                const res = await doSwap(this.swap, this.slippage, this.provider)
                await res.wait()
                await stores.stableSwapStore.fetchBaseAssets(
                    [this.tokenIn, this.tokenOut]
                )
            } catch (e) {
                this.error = 'Swap request error'
            } finally {
                this.isFetchingSwap = false
            }
        }
    }

    async _getToken(address) {
        if (!(address in this.tokensMap)) {
            const erc20 = new ethers.Contract(address, erc20abi, this.provider)
            const decimals = await erc20.decimals()
            const symbol = await erc20.symbol()
            const token = {
                address,
                decimals,
                symbol,
            }
            this.tokensMap[address] = token
        }
        return this.tokensMap[address]
    }

    async _swapQuery() {
        if (this.tokenIn && this.tokenOut && this.swapAmount && this.provider) {
            const [tokenIn, tokenOut] = await Promise.all([
              this._getToken(this.tokenIn),
              this._getToken(this.tokenOut),
            ])
            const swapAmount = ethers.utils.parseUnits(this.swapAmount, tokenIn.decimals).toString();
            this.isFetchingSwapQuery = true

            try {
                const response = await swapQuery(tokenIn, tokenOut, swapAmount)
                this.swap = response

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
            return this.swap.swaps.map((s) => {
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
            }).reduce((acc, item) => {
                if (item.percentage !== null) {
                    acc.push([item])
                } else {
                    acc[acc.length - 1].push(item)
                }
                return acc
            }, [])
        }
    }
}

export const multiSwapStore = new MultiSwapStore()
