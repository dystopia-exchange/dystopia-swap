import { useState, useEffect } from 'react'

export const useReverseTokens = (props) => {
    const {
        tokenIn,
        setTokenIn,
        tokenOut,
        setTokenOut,
    } = props

    const [doReverseTokens, setDoReverseTokens] = useState(null)

    useEffect(() => {
        setDoReverseTokens(() => {
            setTokenIn(setTokenOut)
            setTokenOut(tokenIn)
        })
    }, [
        tokenIn,
        setTokenIn,
        tokenOut,
        setTokenOut,
    ])

    return [doReverseTokens]
}
