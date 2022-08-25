import BigNumber from 'bignumber.js'
import * as contractsTestnet from './contractsTestnet'
import * as contracts from './contracts'
import * as actions from './actions'

let isTestnet = process.env.NEXT_PUBLIC_CHAINID == 80001

// URLS
let scan = 'https://bscscan.com/'
let cont = contracts

if (isTestnet) {
  scan = 'https://mumbai.polygonscan.com/'
  cont = contractsTestnet
}

export const ETHERSCAN_URL = scan

export const CONTRACTS = cont
export const ACTIONS = actions

export const MAX_UINT256 = new BigNumber(2).pow(256).minus(1).toFixed(0)
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const CONE_ADDRESS = '0xA60205802E1B5C6EC1CAFA3cAcd49dFeECe05AC9'.toLowerCase();
export const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'.toLowerCase();


export const BLACK_LIST_TOKENS = []

export const BASE_ASSETS_WHITELIST = [
  {
    id: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d",
    chainId: "56",
    symbol: "USDC",
  },
  {
    id: "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
    address: "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
    chainId: "56",
    symbol: "WETH",
  },
  {
    id: "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
    address: "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3",
    chainId: "56",
    symbol: "DAI",
  },
  {
    id: "0x3f56e0c36d275367b8c502090edf38289b3dea0d",
    address: "0x3f56e0c36d275367b8c502090edf38289b3dea0d",
    chainId: "56",
    symbol: "MAI",
  },
  {
    id: "0x55d398326f99059ff775485246999027b3197955",
    address: "0x55d398326f99059ff775485246999027b3197955",
    chainId: "56",
    symbol: "USDT",
  },
  {
    id: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    chainId: "56",
    symbol: "WBNB",
  },
  {
    id: "0x90c97f71e18723b0cf0dfa30ee176ab653e89f40",
    address: "0x90c97f71e18723b0cf0dfa30ee176ab653e89f40",
    chainId: "56",
    symbol: "FRAX",
  },
  {
    id: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    address: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
    chainId: "56",
    symbol: "BUSD",
  },
  {
    id: CONE_ADDRESS,
    address: CONE_ADDRESS,
    chainId: "56",
    symbol: "CONE",
  },
];

const ROUTE_ASSETS_SYMBOLS = [
  "USDC",
  "WBNB",
  "BUSD",
  "CONE",
  "USD+",
];

export const ROUTE_ASSETS = BASE_ASSETS_WHITELIST.filter(x => ROUTE_ASSETS_SYMBOLS.includes(x.symbol));
