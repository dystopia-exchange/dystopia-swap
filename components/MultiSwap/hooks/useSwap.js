import { useState, useEffect } from 'react'
import {doSwap} from "../utils";

export const useSwap = (swap, slippage) => {
    const [_doSwap, setDoSwap] = useState(null)
    const [isFetching, setIsFetching] = useState(false)

    useEffect(() => {
        setDoSwap(null)
        setIsFetching(false)

        if (swap && slippage) {
            setDoSwap(() => {
                setIsFetching(true)
                doSwap(swap, slippage).then(() => {
                    setIsFetching(false)
                })
            })
        }
    }, [swap, slippage])

    return [_doSwap, isFetching]
}
