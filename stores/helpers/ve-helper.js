import {CONTRACTS, QUERIES} from "../constants";
import BigNumber from "bignumber.js";
import {createClient} from "urql";
import {formatBN} from '../../utils';

const client = createClient({url: process.env.NEXT_PUBLIC_API});

export function getNftById(id, nfts) {
  if (!nfts || nfts.length === 0) {
    return null;
  }
  return nfts.filter(n => parseInt(n.id) === parseInt(id)).reduce((a, b) => b, null);
}

export const loadNfts = async (account, web3, tokenID) => {
  if (!account || !web3) {
    return [];
  }
  try {
    // const userInfo = await loadUserInfoFromSubgraph(account);
    // const userNfts = userInfo?.nfts ?? [];
    const vestingContract = getVestingContract(web3);
    const totalPower = formatBN(await vestingContract.methods.totalSupply().call());
    const nftsLength = await vestingContract.methods.balanceOf(account).call();
    const nftRange = Array.from({length: parseInt(nftsLength)}, (v, i) => i);
    return (await Promise.all(
      nftRange.map(async (idx) => {
        const tokenIndex = await vestingContract.methods.tokenOfOwnerByIndex(account, idx).call();
        if (!tokenID || parseInt(tokenIndex) === parseInt(tokenIndex)) {
          const locked = await vestingContract.methods.locked(tokenIndex).call();
          const lockValue = formatBN(await vestingContract.methods.balanceOfNFT(tokenIndex).call());

          return {
            id: tokenIndex,
            lockEnds: locked.end,
            lockAmount: formatBN(locked.amount),
            lockValue: lockValue,
            // subgraphInfo: userNfts.filter(n => parseInt(n.id) === parseInt(tokenIndex))[0],
            veRatio: BigNumber(lockValue).div(totalPower).toString(),
            percentOfTotalPower: BigNumber(lockValue).div(totalPower).times(100).toString(),
          };
        } else {
          return null;
        }
      })
    )).filter((nft) => !!nft);
  } catch (ex) {
    console.log("Error load veNFTs", ex);
    throw ex;
  }
};

export async function getVeApr() {
  try {
    const veDistResponse = await client.query(QUERIES.veDistQuery).toPromise();
    if (!veDistResponse.error && veDistResponse.data.veDistEntities.length !== 0) {
      return veDistResponse.data.veDistEntities[0].apr;
    }
  } catch (e) {
    console.log("Error get ve apr", e);
    throw e;
  }
  return 0;
}

export async function getVeFromSubgraph(tokenID) {
  const resp = await client.query(QUERIES.veQuery, {id: tokenID}).toPromise();
  if (!!resp.error) {
    console.log("Ve query error", resp.error);
  } else {
    // console.log('Ve query', resp)
  }
  return resp.data.ve;
}

function getVestingContract(web3) {
  return new web3.eth.Contract(
    CONTRACTS.VE_TOKEN_ABI,
    CONTRACTS.VE_TOKEN_ADDRESS
  );
}
