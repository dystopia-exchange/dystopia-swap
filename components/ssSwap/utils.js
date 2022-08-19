import { formatUnits } from '@ethersproject/units'
import { BigNumber } from 'ethers'
import Big from 'big.js'

export const sum = (values = []) => {
    const result = values.reduce((acc, item) => {
        const value = BigNumber.from(item)
        return acc.add(value)
    }, BigNumber.from('0'))

    return result.toString()
}

export const calcApr = (
    rewarsdApr,
    ppfsApr,
    vaultDecimals,
    ) => {
    // @ts-ignore
    const rewardsApr = rewarsdApr.reduce((sum, apr) => {
        const current = BigNumber.from(apr)
        return sum.add(current)
    }, BigNumber.from('0'))

    const rewardsAprFormated = formatUnits(rewardsApr) // already normalized to 18
    const ppfsAprFormated = formatUnits(ppfsApr) // already normalized to 18
    const sum = Big(rewardsAprFormated).add(ppfsAprFormated).mul(1e9).mul(1e9).toFixed(0)

    return BigNumber.from(sum)
}

export const addSpace = (amount) => {
    if (parseFloat(amount) < 1) {
        return amount
    }

    // @ts-ignore
    const [whole, rest] = amount.toString().split('.')

    // @ts-ignore
    const tmp = [...whole]
    const result = tmp
        .reverse()
        .map((el, index) => {
            if (index % 3 === 0 && tmp.length > 3) {
                return el + ' '
            }
            return el
        })
        .reverse()
        .join('')

    if (rest) {
        return result.trim() + '.' + rest
    }

    return result
}

export const toFixed = (value) => {
    // @ts-ignore
    const char = [...value].find((el, index) => {
        return el !== '0' && el !== '.'
    })

    const index = value.indexOf(char)

    return value.slice(0, index + 2)
}

export const millifyValue = (
    val,
    isFormated = false,
    tofixed = 2,
    decimals = 18,
) => {
    if (val === undefined) {
        return
    }

    const value = isFormated ? val : formatUnits(val, decimals)

    if (value === '0') {
        return value
    }

    if (value.slice(0, 2) === '0.' && value.length) {
        return parseFloat(toFixed(value))
    }

    const [whole] = value.split('.')

    const formater = (value) => {
        return addSpace(parseFloat(parseFloat(String(value)).toFixed(tofixed)).toString())
    }

    if (whole.length < 4) {
        return parseFloat(parseFloat(value).toFixed(tofixed))
    }

    if (whole.length >= 4 && whole.length < 7) {
        return formater(Number(whole) / 1000) + 'K'
    }

    if (whole.length >= 7 && whole.length < 10) {
        return formater(Number(whole) / 1000000) + 'M'
    }

    if (whole.length >= 10 && whole.length < 13) {
        return formater(Number(whole) / 1000000000) + 'B'
    }

    // if (whole.length >= 12 && whole.length < 15) {
    //   return addSpace(value.slice(0, 3)) + ''
    // }

    if (whole.length >= 12) {
        return 'Infinity'
    }
}
