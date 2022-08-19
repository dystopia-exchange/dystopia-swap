import { useState, useEffect } from "react";
import {useProvider} from "./useProvider";
import {allowance} from "../utils";


export const useAllowed = (tokenIn) => {
    const [allowed, setAllowed] = useState(false)
    const [isFetching, setIsFetching] = useState(false)

    const [provider] = useProvider()

    useEffect(() => {
        setIsFetching(false)

        if (tokenIn && provider) {
            setIsFetching(true)
            allowance(tokenIn, provider).then((res) => {
                setAllowed(res)
                setIsFetching(false)
            })
        }
    }, [tokenIn, provider])

    return [allowed, isFetching]
}
