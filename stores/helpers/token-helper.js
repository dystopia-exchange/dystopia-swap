import DEFAULT_TOKEN_LIST from '../constants/tokenlist.json'
import {
  BASE_ASSETS_WHITELIST,
  BLACK_LIST_TOKENS,
  CONTRACTS,
  QUERIES,
  RENAME_ASSETS,
  NETWORK_TOKEN_NAME
} from "../constants";
import {formatBN, removeDuplicate} from '../../utils';
import {getLocalAssets} from "./local-storage-helper";
import {createClient} from "urql";

const client = createClient({url: process.env.NEXT_PUBLIC_API});

export function getTokenContract(web3, address) {
  return new web3.eth.Contract(
    CONTRACTS.ERC20_ABI,
    address
  );
}

export function isNetworkToken(tokenAdr) {
  return tokenAdr === NETWORK_TOKEN_NAME;
}

export async function getEthPrice() {
  return parseFloat((await client.query(QUERIES.bundleQuery).toPromise()).data.bundle.ethPrice);
}

export async function getTokenBalance(tokenAdr, web3, accountAdr, decimals) {
  if (!tokenAdr || !web3 || !accountAdr) {
    return "0";
  }
  try {
    return formatBN(await getTokenContract(web3, tokenAdr).methods.balanceOf(accountAdr).call(), decimals);
  } catch (e) {
    console.log("Error get balance", tokenAdr, accountAdr, e)
    return "0";
  }
}

export async function getOrCreateBaseAsset(baseAssets, token, web3, account, getBalance) {
  if (!token || !web3 || !account) {
    return null;
  }
  const theBaseAsset = baseAssets.filter(as => as?.address?.toLowerCase() === token?.toLowerCase()).reduce((a, b) => b, null);
  if (theBaseAsset !== null) {
    return theBaseAsset;
  }
  return await createBaseAsset(token, web3, account, getBalance);
}

export const createBaseAsset = async (address, web3, account, getBalance) => {
  try {
    const baseAssetContract = getTokenContract(web3, address);

    const [symbol, decimals, name] = await Promise.all([
      baseAssetContract.methods.symbol().call(),
      baseAssetContract.methods.decimals().call(),
      baseAssetContract.methods.name().call(),
    ]);

    return {
      address: address,
      symbol: symbol,
      name: name,
      decimals: parseInt(decimals),
      logoURI: null,
      local: true,
      balance: getBalance ? await getTokenBalance(address, web3, account, decimals) : null
    };
  } catch (ex) {
    console.log("Create base asset error", ex);
    return null;
  }
};

async function getTokenList() {
  if (parseInt(process.env.NEXT_PUBLIC_CHAINID) === 80001) {
    // some test token list
  } else {
    return {data: {tokens: DEFAULT_TOKEN_LIST,},}
  }
}

async function getTokensFromSubgraph() {
  const resp = await client.query(QUERIES.tokensQuery).toPromise();
  if (!!resp.error) {
    console.log("Token query error", resp.error);
  } else {
    // console.log('Token query', resp)
  }
  return resp.data.tokens;
}

export const getBaseAssets = async () => {
  try {
    let baseAssets = await getTokensFromSubgraph();
    const defaultTokenList = await getTokenList();


    for (let i = 0; i < baseAssets.length; i++) {
      const baseAsset = baseAssets[i];

      const tokenInfo = defaultTokenList.data.tokens.filter(t => t?.address?.toLowerCase() === baseAsset?.id?.toLowerCase())[0];
      baseAsset.address = baseAsset.id
      baseAsset.balance = 0
      baseAsset.chainId = 0

      if (!!tokenInfo) {
        baseAsset.logoURI = tokenInfo.logoURI;
      }

      if (baseAsset.address.toLowerCase() === CONTRACTS.GOV_TOKEN_ADDRESS.toLowerCase()) {
        baseAsset.logoURI = CONTRACTS.GOV_TOKEN_LOGO
      }

      if (RENAME_ASSETS[baseAsset.name]) {
        baseAsset.symbol = RENAME_ASSETS[baseAsset.name];
        baseAsset.name = RENAME_ASSETS[baseAsset.name];
      }
    }

    // todo a bit mess with cases, need to keep only 1 constant for each value
    const nativeFTM = {
      id: CONTRACTS.FTM_ADDRESS,
      address: CONTRACTS.FTM_ADDRESS,
      decimals: CONTRACTS.FTM_DECIMALS,
      logoURI: CONTRACTS.FTM_LOGO,
      name: CONTRACTS.FTM_NAME,
      symbol: CONTRACTS.FTM_SYMBOL,
    };
    baseAssets.unshift(nativeFTM);

    let localBaseAssets = getLocalAssets();

    baseAssets = baseAssets
      .filter((token) => BLACK_LIST_TOKENS.indexOf(token.id?.toLowerCase()) === -1);

    let dupAssets = [];
    baseAssets.forEach((token, id) => {
      BASE_ASSETS_WHITELIST.forEach((wl) => {
        if (token.id?.toLowerCase() !== wl.address?.toLowerCase()
          && wl.symbol?.toLowerCase() === token.symbol?.toLowerCase()) {
          dupAssets.push(id);
        }
      });
    });

    for (let i = dupAssets.length - 1; i >= 0; i--){
      baseAssets.splice(dupAssets[i], 1);
    }

    const result = removeDuplicate([...localBaseAssets, ...baseAssets]);
    return result.map(asset => Object.assign({}, asset));
  } catch (ex) {
    console.log("Error load base assets", ex);
    throw ex;
  }
};

export const getBalancesForBaseAssets = async (web3, account, baseAssets, multicall) => {
  if (!web3 || !account || !baseAssets || !multicall) {
    return;
  }
  try {
    let batch = [];
    let tokens = [];
    for (let i = 0; i < baseAssets.length; i++) {
      const asset = baseAssets[i];
      if (asset.address === CONTRACTS.FTM_SYMBOL) {
        asset.balance = formatBN(await web3.eth.getBalance(account));
        continue;
      }

      batch.push(getTokenContract(web3, asset.address).methods.balanceOf(account))
      tokens.push(asset.address)
      if (batch.length > 30) {
        const results = await multicall.aggregate(batch);
        tokens.forEach((token, i) => {
          const a = baseAssets.filter(a => a.address === token)[0]
          a.balance = formatBN(results[i], a.decimals);
        })
        batch = [];
        tokens = [];
      }
    }

    const results = await multicall.aggregate(batch);
    tokens.forEach((token, i) => {
      const a = baseAssets.filter(a => a.address === token)[0]
      a.balance = formatBN(results[i], a.decimals);
    })
  } catch (ex) {
    console.log("Get base asset info error", ex);
    throw ex;
  }
};

export const getTokenAllowance = async (web3, token, account, spender) => {
  try {
    const tokenContract = getTokenContract(web3, token.address);
    const allowance = await tokenContract.methods
      .allowance(account, spender)
      .call();
    return formatBN(allowance, token.decimals);
  } catch (ex) {
    console.error("Get token allowance error", ex);
    return "0";
  }
};

export function enrichLogoUri(baseAssets, tokenModel) {
  const asset = baseAssets.filter(a => a.id.toLowerCase() === tokenModel.id.toLowerCase())[0]
  tokenModel.logoURI = asset?.logoURI;
}
