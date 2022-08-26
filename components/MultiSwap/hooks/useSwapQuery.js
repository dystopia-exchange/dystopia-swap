import { useState, useEffect } from 'react'
import {swapQuery} from "../utils";

export const useSwapQuery = (tokenIn, tokenOut, swapAmount) => {
    const [swap, setSwap] = useState(null)
    const [isFetching, setIsFetching] = useState(false)

    useEffect(() => {
        setSwap(null)
        setIsFetching(false)

        if (tokenIn && tokenOut && swapAmount) {
            setIsFetching(true)
            swapQuery(tokenIn, tokenOut, swapAmount).then((res) => {
                setSwap(res)
                setIsFetching(false)
            })
        }
    }, [tokenIn, tokenOut, swapAmount])

    return [swap, isFetching]
}
