import { makeAutoObservable, action } from 'mobx'
import { allowance, approve, doSwap, getSwapContract, swapQuery, api } from "./helpers/multiswap-helper";
import * as ethers from 'ethers'
import { debounce } from "debounce"
import stores from "./";
import {
    FTM_SYMBOL,
    WFTM_ADDRESS,
    WFTM_DECIMALS,
    WFTM_SYMBOL,
    ROUTER_ADDRESS,
    multiSwapAddress,
    ERC20_ABI,
    FTM_DECIMALS
} from "./constants/contracts";
import {DIRECT_SWAP_ROUTES, GAS_MULTIPLIER, MAX_UINT256, MULTISWAP_INCLUDE, ZERO_ADDRESS} from "./constants";
import { v4 as uuidv4 } from 'uuid';
import {formatCurrency, getTXUUID} from "../utils";
import {
    emitNewNotifications, emitNotificationConfirmed,
    emitNotificationDone,
    emitNotificationPending, emitNotificationRejected,
    emitNotificationSubmitted,
    emitStatus
} from "./helpers/emit-helper";
import {getTokenAllowance, isNetworkToken} from "./helpers/token-helper";
import BigNumber from "bignumber.js";

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

    constructor(dispatcher, emitter) {
        this.dispatcher = dispatcher;
        this.emitter = emitter;
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
        // if(this.swapQueryTimeout) {
        //     clearInterval(this.swapQueryTimeout)
        // }
        // this.debSwapQuery()
        // this.swapQueryTimeout = setInterval(this._swapQuery.bind(this), 10000)
        // this.debSwapQuery = debounce(this._swapQuery.bind(this), 500)
        this._swapQuery()
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
        this.swap = null
        this._checkAllowance()
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
                this.swap.swapData.tokenIn = ZERO_ADDRESS
            }
            if (this.tokenOut === FTM_SYMBOL) {
                this.swap.swapData.tokenOut = ZERO_ADDRESS
            }
        }

        this.isFetchingSwap = true

        if (this.isDirectRoute || this.isMultiswapInclude) {
            const [tokenIn, tokenOut] = await Promise.all([
                this._getToken(this.tokenIn, false),
                this._getToken(this.tokenOut, false),
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
                await stores.stableSwapStore.loadBaseAssets()
            } catch (e) {
                console.log('error', e)
                this.error = this.parseError(e)
            } finally {
                this.isFetchingSwap = false
            }
        } else {
            let allowanceTXID = getTXUUID();
            let swapTXID = getTXUUID();
            try {
                // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
                const account = stores.stableSwapStore.userAddress;
                const web3 = await stores.stableSwapStore.getWeb3();
                const emitter = this.emitter
                const fromAmount = this.swapAmount

                const [fromAsset, toAsset] = await Promise.all([
                    this._getToken(this.tokenIn, false),
                    this._getToken(this.tokenOut, false),
                ])

                await emitNewNotifications(this.emitter, [
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
                ]);

                let allowance;

                // CHECK ALLOWANCES AND SET TX DISPLAY
                if (!isNetworkToken(fromAsset.address)) {
                    allowance = await getTokenAllowance(web3, fromAsset, account, multiSwapAddress);

                    if (BigNumber(allowance).lt(fromAmount)) {
                        await emitStatus(emitter, allowanceTXID, `Allow the router to spend your ${fromAsset.symbol}`)
                    } else {
                        await emitNotificationDone(emitter, allowanceTXID, `Allowance on ${fromAsset.symbol} sufficient`)
                    }
                } else {
                    allowance = MAX_UINT256;
                    console.log("Allowance", allowanceTXID)
                    await emitNotificationDone(emitter, allowanceTXID, `Allowance on ${fromAsset.symbol} sufficient`)
                }

                // SUBMIT REQUIRED ALLOWANCE TRANSACTIONS
                if (BigNumber(allowance).lt(fromAmount)) {
                    const res = await approve(this.tokenIn, this.provider, multiSwapAddress, web3.utils.toWei(BigNumber(await stores.accountStore.getGasPrice()).times(GAS_MULTIPLIER).toFixed(0), "gwei"))
                    emitNotificationSubmitted(emitter, allowanceTXID, res?.hash)
                    await res?.wait(2)
                    emitNotificationConfirmed(emitter, allowanceTXID, res?.hash)
                }

                emitNotificationPending(emitter, swapTXID)
                const res = await doSwap(this.swap, this.slippage, this.provider, this.emitter, web3.utils.toWei(BigNumber(await stores.accountStore.getGasPrice()).times(GAS_MULTIPLIER).toFixed(0), "gwei"))
                emitNotificationSubmitted(emitter, swapTXID, res?.hash)

                await res?.wait(2)
                emitNotificationConfirmed(emitter, swapTXID, res?.hash)

                await stores.stableSwapStore._refreshAssetBalance(web3, account, this.swap?.tokenIn);
                await stores.stableSwapStore._refreshAssetBalance(web3, account, this.swap?.tokenOut);
            } catch (e) {
                console.log('error', e)
                this.error = this.parseError(e)
                emitNotificationRejected(this.emitter, swapTXID, this.error)
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

    async _getToken(address, giveWrappedForNative = true) {
        if (address === FTM_SYMBOL) {
            if (giveWrappedForNative) {
                return {
                    address: WFTM_ADDRESS,
                    symbol: WFTM_SYMBOL,
                    decimals: WFTM_DECIMALS,
                }
            }
            return {
                address: FTM_SYMBOL,
                symbol: FTM_SYMBOL,
                decimals: FTM_DECIMALS,
            }
        }

        if (!(address in this.tokensMap)) {
            const erc20 = new ethers.Contract(address, ERC20_ABI, this.provider)
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

    get isMultiswapInclude() {
        return !(MULTISWAP_INCLUDE.includes(this.tokenIn?.toLowerCase()) || MULTISWAP_INCLUDE.includes(this.tokenOut?.toLowerCase()))
    }

    async _swapQuery() {
        if (!this.swapQueryInProgress) {
            console.log('>>> SWAP QUERY')
            this.swapQueryInProgress = true;
            if (this.isWrapUnwrap) {
                this.allowed = true
                const returnAmount = ethers.utils.parseUnits(this.swapAmount ?? '0', 18).toString()
                this.swap = {returnAmount}
                this.swapQueryInProgress = false;
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
                if (this.isDirectRoute || this.isMultiswapInclude) {
                    const response = await stores.stableSwapStore.quoteSwap({
                        content: {
                            fromAsset: tokenIn,
                            toAsset: tokenOut,
                            fromAmount: this.swapAmount,
                        },
                    })

                    // console.log('directSwapRoute old router response', response)

                    if (response === null) {
                        this.swap = null
                        this.error = 'Swap query request error. Try again.'
                    }

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
        if (this.isWrapUnwrap) {
            this.allowed = true;
            return true
        }

        if (this.tokenIn === FTM_SYMBOL) {
            this.allowed = true;
            return true
        }

        if (this.provider && this.isDirectRoute !== undefined) {
            this.isFetchingAllowance = true
            const tokenIn = await this._getToken(this.tokenIn)
            const response = await allowance(this.tokenIn, this.provider, this.swapAmount, tokenIn.decimals, this.isDirectRoute || this.isMultiswapInclude ? ROUTER_ADDRESS : multiSwapAddress)
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
}

export default MultiSwapStore;
