import React, { useState, useEffect } from 'react'
import {getSwapContract} from "../utils";
import { useProvider } from './useProvider'

export const useMultiswapContract = () => {
    const [multiswapContract, setMultiswapContract] = useState(null)
    const [provider] = useProvider()

    useEffect(() => {
        if (provider && multiswapContract === null) {
            setMultiswapContract(getSwapContract(provider.getSigner()))
        }
    }, [provider])

    return multiswapContract
}