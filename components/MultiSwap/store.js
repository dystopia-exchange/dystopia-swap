import { makeAutoObservable, action } from 'mobx'
import { allowance, approve, doSwap, getSwapContract, swapQuery, api } from "./utils";
import * as ethers from 'ethers'
import { debounce } from "debounce"
import stores from "../../stores";
// import { wmaticAbi } from './wmaticAbi'
// import { CONTRACTS } from "../../stores/constants";
import {FTM_SYMBOL, WFTM_ADDRESS, WFTM_DECIMALS, WFTM_SYMBOL} from "../../stores/constants/contracts";
import { ACTIONS, DIRECT_SWAP_ROUTES } from "../../stores/constants";
import {ROUTER_ADDRESS} from "../../stores/constants/contracts";
import {multiSwapAddress} from "./constants";
import { v4 as uuidv4 } from 'uuid';

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

// const WMATIC = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'

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
    swapQueryTimeout = null
    swapQueryInProgress = false
    error = null
    swapTXHash = null;

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
        this.debSwapQuery = debounce(this._swapQuery.bind(this), 500)
    }

    startSwapQueryPolling() {
        if(this.swapQueryTimeout) {
            clearInterval(this.swapQueryTimeout)
        }
        this.debSwapQuery()
        this.swapQueryTimeout = setInterval(this._swapQuery.bind(this), 10000)
    }

    setProvider(provider) {
        this.provider = provider
    }

    get contract() {
        return getSwapContract(this.provider.getSigner())
    }

    get getTXUUID() {
        return uuidv4();
    };

    setTokenIn(value) {
        this.tokenIn = value
        this.swap = null
        this.error = null
        this.allowed = false
        this._checkAllowance()
        this.startSwapQueryPolling()
    }

    setTokenOut(value) {
        this.tokenOut = value
        this.swap = null
        this.error = null
        this.startSwapQueryPolling()
    }

    setSwapAmount(value) {
        this.swapAmount = value
        this.error = null
        this.startSwapQueryPolling()
    }

    setSlippage(value) {
        this.slippage = value
    }

    reverseTokens() {
        const { tokenOut, tokenIn } = this
        if (this.isWrapUnwrap) {
            this.swap = null
            this.error = null
            this.allowed = true
            this.tokenIn = tokenOut
            this.tokenOut = tokenIn
            this.startSwapQueryPolling()
        } else {
            this.setTokenIn(tokenOut)
            this.setTokenOut(tokenIn)
            this._checkAllowance()
            this.startSwapQueryPolling()
        }
    }

    async approve() {
        if (this.provider && this.tokenIn) {
            this.isFetchingApprove = true
            try {
                // console.log('CALL APPROVE', this.allowed)
                await this._checkAllowance()
                // console.log('allowed', this.allowed)
                if(!this.allowed) {
                    const res = await approve(this.tokenIn, this.provider, this.isDirectRoute ? ROUTER_ADDRESS : multiSwapAddress)
                    await res?.wait(2)
                }
                await this._checkAllowance()
            } catch (e) {
                // console.error('CALL APPROVE ERROR', e)
                this.error = 'Transaction of approve is failed'
            } finally {
                // console.log('END CALL APPROVE')
                this.isFetchingApprove = false
            }
        }
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
        this.swapTXHash = this.getTXUUID;
        if (this.swap === null) {
            return
        }

        if (this.swap && this.swap.swapData) {
            if (this.tokenIn === FTM_SYMBOL) {
                this.swap.swapData.tokenIn = '0x0000000000000000000000000000000000000000'
            }
            if (this.tokenOut === FTM_SYMBOL) {
                this.swap.swapData.tokenOut = '0x0000000000000000000000000000000000000000'
            }
        }

        this.isFetchingSwap = true

        if (this.isDirectRoute) {
            const [tokenIn, tokenOut] = await Promise.all([
                this._getToken(this.tokenIn),
                this._getToken(this.tokenOut),
            ])
            try {
                await stores.stableSwapStore.swap({
                    content: {
                        fromAsset: tokenIn,
                        toAsset: tokenOut,
                        fromAmount: this.swapAmount,
                        quote: this.swap.quote,
                        slippage: this.slippage,
                    }
                })
                await stores.stableSwapStore.fetchBaseAssets([this.tokenIn, this.tokenOut])
            } catch (e) {
                console.log('error', e)
                this.error = this.parseError(e)
            } finally {
                this.isFetchingSwap = false
            }
        } else {
            await this.notificationHandler({action: ACTIONS.TX_ADDED, content: {
                    fromAsset: {address: this.swap?.tokenIn},
                    toAsset: {address: this.swap?.tokenOut},
                    fromAmount: this.swapAmount
                }
            });
            try {
                const res = await doSwap(this.swap, this.slippage, this.provider, this.notificationHandler)
                await res?.wait(2)
                await stores.stableSwapStore.fetchBaseAssets([this.tokenIn, this.tokenOut])
                await this.notificationHandler({action: ACTIONS.TX_CONFIRMED, content: {txHash: res.hash}});
            } catch (e) {
                console.log('error', e)
                this.error = this.parseError(e)
                await this.notificationHandler({action: ACTIONS.TX_REJECTED, content: {error: e}});
            } finally {
                this.isFetchingSwap = false
            }
        }
        if(this.swapQueryTimeout) {
            clearInterval(this.swapQueryTimeout);
        }
        this.swapQueryTimeout = null;
    }

    parseError(err) {
        if(err?.message?.indexOf('MSAmountOutLessThanRequired') !== -1) {
            return "Returned amount less than expected. Increase slippage."
        }  else if(err?.message?.indexOf('User denied transaction signature') !== -1) {
            return null
        } else {
            return 'Swap request error'
        }
    }

    async _getToken(address) {
        if (address === FTM_SYMBOL) {
            return {
                address: WFTM_ADDRESS,
                symbol: WFTM_SYMBOL,
                decimals: WFTM_DECIMALS,
            }
        }

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

    get isWrapUnwrap() {
        return (this.tokenIn === FTM_SYMBOL && ''.concat(this.tokenOut).toLowerCase() === WFTM_ADDRESS.toLowerCase())
            || (''.concat(this.tokenIn).toLowerCase() === WFTM_ADDRESS.toLowerCase() && this.tokenOut === FTM_SYMBOL)
    }

    get isDirectRoute() {
        return (!!DIRECT_SWAP_ROUTES[this.tokenIn?.toLowerCase()] && DIRECT_SWAP_ROUTES[this.tokenIn?.toLowerCase()] === this.tokenOut?.toLowerCase())
            || (!!DIRECT_SWAP_ROUTES[this.tokenOut?.toLowerCase()] && DIRECT_SWAP_ROUTES[this.tokenOut?.toLowerCase()] === this.tokenIn?.toLowerCase())
    }

    async _swapQuery() {
        if (!this.swapQueryInProgress) {
            // console.log('>>> SWAP QUERY')
            this.swapQueryInProgress = true;
            if (this.isWrapUnwrap) {
                this.allowed = true
                const returnAmount = ethers.utils.parseUnits(this.swapAmount ?? '0', 18).toString()
                this.swap = {returnAmount}
                return
            }

            if (this.tokenIn === FTM_SYMBOL) {
                this.allowed = true
            }

            if (this.tokenIn && this.tokenOut && this.swapAmount && this.provider) {
                const [tokenIn, tokenOut] = await Promise.all([
                    this._getToken(this.tokenIn),
                    this._getToken(this.tokenOut),
                ])
                // console.log('tokenIn', JSON.parse(JSON.stringify(this.tokenIn)))
                const swapAmount = ethers.utils.parseUnits(this.swapAmount, tokenIn.decimals).toString();
                this.isFetchingSwapQuery = true

                // query old router for direct swap routes
                if (this.isDirectRoute) {
                    const response = await stores.stableSwapStore.quoteSwap({
                        content: {
                            fromAsset: tokenIn,
                            toAsset: tokenOut,
                            fromAmount: this.swapAmount,
                        },
                    })

                    // console.log('directSwapRoute old router response', response)

                    if (response?.output?.finalValue) {
                        this.swap = {
                            returnAmount: response.output.receiveAmounts[1],
                            priceImpact: response.priceImpact,
                            swapAmount: response.output.receiveAmounts[0],
                            tokenAddresses: [this.tokenIn, this.tokenOut],
                            swaps: [{
                                poolId: '0x421a018cc5839c4c0300afb21c725776dc389b1addddddddddddddddddddddd0',
                                assetInIndex: 0,
                                assetOutIndex: 1,
                                amount: response.output.receiveAmounts[0],
                            }],
                            quote: response,
                        }
                        this.priceInfo = this.calcPriceInfo(tokenIn, tokenOut, this.swap)
                        this.priceImpact = this.swap.priceImpact
                    }

                    this.isFetchingSwapQuery = false
                } else {
                    try {
                        const response = await swapQuery(tokenIn, tokenOut, swapAmount, this.excludePlatforms)
                        this.swap = response
                        // console.log(this.swap)
                        this.priceInfo = this.calcPriceInfo(tokenIn, tokenOut, response)
                        this.priceImpact = this.swap.priceImpact * 100
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
            this.swapQueryInProgress = false;
        }
    }

    async _checkAllowance() {
        await this.notificationHandler({action: ACTIONS.TX_ALLOWANCE_ADDED, content: {
                fromAsset: {address: this.swap?.tokenIn},
                toAsset: {address: this.swap?.tokenOut}
            }
        });

        if (this.isWrapUnwrap) {
            this.allowed = true;
            await this.notificationHandler({action: ACTIONS.TX_STATUS, content: {
                    fromAsset: {address: this.swap?.tokenIn},
                    toAsset: {address: this.swap?.tokenOut},
                    allowed: true
                }
            });
            return true
        }

        if (this.tokenIn === FTM_SYMBOL) {
            this.allowed = true;
            await this.notificationHandler({action: ACTIONS.TX_STATUS, content: {
                    fromAsset: {address: this.swap?.tokenIn},
                    toAsset: {address: this.swap?.tokenOut},
                    allowed: true
                }
            });
            return true
        }

        // console.log('_checkAllowance', this.isDirectRoute)
        if (this.provider && this.isDirectRoute !== undefined) {
            this.isFetchingAllowance = true
            const response = await allowance(this.tokenIn, this.provider, this.isDirectRoute ? ROUTER_ADDRESS : multiSwapAddress)
            this.allowed = response
            this.isFetchingAllowance = false

            await this.notificationHandler({action: ACTIONS.TX_STATUS, content: {
                    fromAsset: {address: this.swap?.tokenIn},
                    toAsset: {address: this.swap?.tokenOut},
                    allowed: response
                }
            });
            return response
        }
        await this.notificationHandler({action: ACTIONS.TX_STATUS, content: {
                fromAsset: {address: this.swap?.tokenIn},
                toAsset: {address: this.swap?.tokenOut},
                allowed: false
            }
        });
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
                const dex = {
                    name: this.swap.swapPlatforms ? this.swap.swapPlatforms[s.poolId] : 'Dystopia',
                };

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

    notificationHandler = async (data) => {
        const {content = {}, action} = data ?? {};
        const fromAsset = {...content.fromAsset, symbol: this.tokenIn};
        const toAsset = {...content.toAsset, symbol: this.tokenOut};
        try {
            await stores.stableSwapStore.emitMultiSwapNotification({action, content: {...content, fromAsset, toAsset, swapTXHash: this.swapTXHash}});
        } catch (e) {
            console.log('notification error', e);
            await this.notificationHandler({action: ACTIONS.TX_REJECTED, content: {error: e}});
        }
    }
}

export const multiSwapStore = new MultiSwapStore()
