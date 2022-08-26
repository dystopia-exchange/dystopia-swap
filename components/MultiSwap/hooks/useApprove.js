import { useState, useEffect } from "react";
import {useProvider} from "./useProvider";
import {approve} from "../utils";

export const useApprove = (tokenIn) => {
    const [doApprove, setDoApprove] = useState(null)
    const [isFetching, setIsFetching] = useState(false)
    const [provider] = useProvider()

    useEffect(() => {
        setIsFetching(false)

        if (provider && tokenIn) {
            setDoApprove(() => {
                setIsFetching(true)
                approve(tokenIn, provider).then(() => {
                    setIsFetching(false)
                })
            })
        }
    }, [provider, tokenIn])

    return [doApprove, isFetching]
}
