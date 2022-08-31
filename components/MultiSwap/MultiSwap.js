import React  from 'react'
import { observer } from 'mobx-react'
import { multiSwapStore } from './store'
import { useProvider } from "./hooks"

export const MultiSwap = observer((props) => {
    const [provider] = useProvider()

    const {
        tokenIn, setTokenIn,
        tokenOut, setTokenOut,
        swapAmount, setSwapAmount,
        slippage, setSlippage,
        swap, isFetchingSwapQuery,
        allowed, isFetchingAllowance,
        reverseTokens: doReverseTokens,
        approve: doApprove, isFetchingApprove,
        doSwap, isFetchingSwap,
        tokensMap, data: multiswapData,
        routes,
    } = multiSwapStore

    if (multiSwapStore.provider === null && provider) {
        multiSwapStore.setProvider(provider)
    }

    return (
        <div style={{ color: '#fff' }}>
            {props.children({
                tokenIn, setTokenIn,
                tokenOut, setTokenOut,
                swapAmount, setSwapAmount,
                slippage, setSlippage,
                allowed, isFetchingAllowance,
                swap, isFetchingSwapQuery,
                doApprove, isFetchingApprove,
                doSwap, isFetchingSwap,
                doReverseTokens,
                tokensMap,
                multiswapData,
                routes,
            })}
        </div>
    )
})
