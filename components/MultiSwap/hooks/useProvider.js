import React, { useState, useEffect } from 'react'
import stores from "../../../stores";
import {ethers} from "ethers";

export const useProvider = () => {
    const [provider, setProvider] = useState(null)

    useEffect(() => {
        async function getProvider() {
            const web3context = await stores.accountStore.getStore('web3context');
            if (web3context) {
                setProvider(new ethers.providers.Web3Provider(web3context.library.instance))
            }
        }
        getProvider()
    }, [])

    return [provider]
}
