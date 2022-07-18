import { makeAutoObservable, action } from 'mobx'
import {allowance, approve, doSwap, getSwapContract, swapQuery} from "./utils";
import * as ethers from 'ethers'

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

class MultiSwapStore {
    tokensMap = {}

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
        this.allowed = false
        this._checkAllowance()
        this._swapQuery()
    }
    setTokenOut(value) {
        this.tokenOut = value
        this._swapQuery()
    }
    setSwapAmount(value) {
        this.swapAmount = value
        this._swapQuery()
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
            await approve(this.tokenIn, this.provider)
            await this._checkAllowance()
            this.isFetchingApprove = false
        }
    }

    async doSwap() {
        if (this.swap) {
            this.isFetchingSwap = true
            await doSwap(this.swap, this.slippage)
            this.isFetchingSwap = false
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
            const tokenIn = await this._getToken(this.tokenIn)
            const tokenOut = await this._getToken(this.tokenOut)
            const swapAmount = ethers.utils.parseUnits(this.swapAmount, tokenOut.decimals).toString();
            this.isFetchingSwapQuery = true
            const response = await swapQuery(tokenIn, tokenOut, swapAmount)
            this.swap = response
            this.isFetchingSwapQuery = false
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
}

export const multiSwapStore = new MultiSwapStore()
