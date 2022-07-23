import * as ethers from 'ethers'
import {_SLIPPAGE_PRECISION, multiSwapAddress} from './constants'
//@ts-ignore
import MultiSwap2Abi from './MultiSwap2.json'
import BigNumber from "bignumber.js";
require('url')

const ERC20Abi = [
    'function approve(address _spender, uint256 _value) public returns (bool success)',
    'function allowance(address owner, address spender) public returns (uint256)',
]

export function getSwapContract(signer) {
    return new ethers.Contract(
        multiSwapAddress,
        MultiSwap2Abi,
        signer
    );
}

export async function allowance(tokenAddress, provider) {
    let contract = new ethers.Contract(
        tokenAddress,
        ERC20Abi,
        provider
    );
    const signer = provider.getSigner()
    const address = await signer.getAddress();
    const res = await contract.callStatic.allowance(address, multiSwapAddress);
    return res && res?._hex && res?._hex !== '0x00'
}


export async function approve(tokenAddress, provider) {
    const amount = ethers.constants.MaxUint256;
    const tokenContract = new ethers.Contract(
        tokenAddress,
        ERC20Abi,
        provider
    );
    const tx = await tokenContract
        .connect(provider.getSigner())
        .approve(multiSwapAddress, amount, { gasLimit: 100000 });

    return tx

    // console.log('Approve tx', tx);
    // await notify(
    //     'Approve ' + tokens[tokenAddress].symbol,
    //     'Click to view transaction',
    //     'https://free-png.ru/wp-content/uploads/2021/07/free-png.ru-3.png',
    //     txScanUrl(tx)
    // );
}

export function getSlippage(value) {
    return (value * _SLIPPAGE_PRECISION) / 100;
}
export function getDeadline() {
    return Math.floor(Date.now() / 1000) + 60 * 30;
}

export async function doSwap(swap, slippage, provider) {
    if (swap && swap.returnAmount) {
        // noinspection JSUnresolvedFunction
        const tx = await getSwapContract()
            .connect(provider.getSigner())
            .multiSwap(
                swap.swapData, // in/out tokens, amounts
                swap.swaps, // array of swaps
                swap.tokenAddresses, // array of inter token addresses
                getSlippage(slippage),
                getDeadline(),
                { gasLimit: 3000000 }
            );

        return tx

        console.log('tx', tx);

        // const tokenIn = tokens[swap.tokenIn].symbol;
        // const tokenOut = tokens[swap.tokenOut].symbol;
        // const amount = $('#swapAmount').val();
        // await notify(
        //     `Swap ${amount} ${tokenIn} 🡆 ${tokenOut}`,
        //     'Click to view transaction',
        //     'https://icon-library.com/images/replace-icon/replace-icon-22.jpg',
        //     txScanUrl(tx)
        // );
    } else console.error('No swap route');
}


export async function api(func = '', query = undefined) {
    const apiUrl = 'https://dolphin-app-wp9hd.ondigitalocean.app/'
    const url = apiUrl + func + '?' + new globalThis.URLSearchParams(query);
    return await (await fetch(url)).json();
}

export async function swapQuery(tokenIn, tokenOut, swapAmount) {
    const query = {
        tokenIn,
        tokenOut,
        swapAmount,
        excludePlatforms: [],
    };

    const swap = await api('swap', {
        swapRequest: JSON.stringify(query),
    });

    return swap
}
