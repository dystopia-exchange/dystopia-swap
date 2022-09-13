
export const pairsQuery = `
{
  pairs(first: 1000) {
    id
    name
    symbol
    isStable
    reserve0
    reserve1
    token0Price
    token1Price
    totalSupply
    reserveUSD
    reserveETH
    token0 {
      id
      symbol
      name
      decimals
      isWhitelisted
      derivedETH
    }
    token1 {
      id
      symbol
      name
      decimals
      isWhitelisted
      derivedETH
    }
    gauge {
      id
      totalSupply
      totalSupplyETH
      expectAPR
      expectAPRDerived
      voteWeight
      totalWeight
      totalDerivedSupply
      bribe {
        id
      }
      rewardTokens {
        apr
        derivedAPR
        left
        finishPeriod
        token {
          id
          symbol
          decimals
          derivedETH
        }
      }
    }
    gaugebribes {
      id
      bribeTokens {
        apr
        left
        token {
          symbol
        }
      }
    }
  }
}
`;

export const pairQuery = `
query pairQuery($id: ID!) {
  pair(id: $id) {
    id
    name
    symbol
    isStable
    reserve0
    reserve1
    token0Price
    token1Price
    totalSupply
    reserveUSD
    token0 {
      id
      symbol
      name
      decimals
      isWhitelisted
      derivedETH
    }
    token1 {
      id
      symbol
      name
      decimals
      isWhitelisted
      derivedETH
    }
    gauge {
      id
      totalSupply
      totalSupplyETH
      expectAPR
      voteWeight
      totalWeight
      bribe {
        id
      }
      rewardTokens {
        apr
      }
    }
    gaugebribes {
      id
      bribeTokens {
        apr
        left
        token {
          symbol
        }
      }
    }
  }
}
`;

export const tokensQuery = `
  query {
    tokens{
      id
      symbol
      name
      decimals
      isWhitelisted
      derivedETH
    }
  }
`;

export const bundleQuery = `
  query {
    bundle(id:1){
      ethPrice
    }
  }
`;

export const veDistQuery = `
{
  veDistEntities {
    apr
  }
}
`;

export const veQuery = `
query ve($id: ID!) {
  veNFTEntity(id: $id) {
    gauges {
      gauge {
        id
        pair {
          id
          symbol
        }
      }
    }
    bribes {
      id
    }    
  }
}
`;

export const userQuery = `
query user($id: ID!) {
  user(id: $id) {
    liquidityPositions{
          liquidityTokenBalance
          pair {
            id
            symbol
            token0{
              id
              symbol
              decimals
            }
            token1 {
              id
              symbol
              decimals
            }
          }
        }
    gaugePositions {
      balance
      gauge {
        totalSupply
        totalDerivedSupply
        id
        bribe{
          id
        }        
        pair {
          id
          symbol
        }
      }
    }
    nfts {
      id
      lockedAmount
      lockedEnd
      attachments
      ve {
        id
        totalLocked
      }
      votes {
        pool {
          id
          symbol
        }
        weight
        weightPercent
      }
      bribes {
        bribe {
          id
          pair {
            id
            symbol
            reserve0
            reserve1
            totalSupply
            token0{
              id
              symbol
              decimals
            }
            token1 {
              id
              symbol
              decimals
            }
          }
          bribeTokens {
            apr
            token {
              id
              decimals
              symbol

            }
          }          
        }
      }
    }
  }
}
`;
