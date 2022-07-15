import React, { useState } from 'react'
import { useAllowed, useApprove, useSwapQuery, useSwap, useReverseTokens } from "./hooks";

export const MultiSwap = (props) => {
    const [tokenIn, setTokenIn] = useState(null)
    const [tokenOut, setTokenOut] = useState(null)
    const [swapAmount, setSwapAmount] = useState(null)
    const [slippage, setSlippage] = useState(null)

    const [swap, isFetchingSwapQuery] = useSwapQuery(tokenIn, tokenOut, swapAmount)
    const [allowed, isFetchingAllowance] = useAllowed(tokenIn, tokenOut, swapAmount)

    const [doReverseTokens] = useReverseTokens({
        tokenIn,
        setTokenIn,
        tokenOut,
        setTokenOut,
    })
    const [doApprove, isFetchingApprove] = useApprove()
    const [doSwap, isFetchingSwap] = useSwap(swap, slippage)

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
            })}
        </div>
    )
}
