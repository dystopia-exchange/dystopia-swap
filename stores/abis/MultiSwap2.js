export const multiSwapABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "controller_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "weth_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "balancerVault_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tetuFactory_",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "MSAmountOutLessThanRequired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MSDeadline",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MSForbidden",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MSMalconstructedMultiSwap",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MSSameTokens",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MSSameTokensInSwap",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MSTransferFeesForbiddenForInputToken",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MSTransferFeesForbiddenForOutputToken",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MSUnknownAmountInFirstSwap",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MSWrongTokens",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MSZeroAmount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MSZeroBalancerVault",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MSZeroTetuFactory",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MSZeroWETH",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "controller",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "ts",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "block",
        "type": "uint256"
      }
    ],
    "name": "ContractInitialized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "tokenIn",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountIn",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "tokenOut",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amountOut",
        "type": "uint256"
      }
    ],
    "name": "MultiSwap",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Salvage",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "VERSION",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "WETH",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "balancerVault",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "controller",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "created",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "ts",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "createdBlock",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "ts",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "__controller",
        "type": "address"
      }
    ],
    "name": "initializeControllable",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_value",
        "type": "address"
      }
    ],
    "name": "isController",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_value",
        "type": "address"
      }
    ],
    "name": "isGovernance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "tokenIn",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "tokenOut",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "swapAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "returnAmount",
            "type": "uint256"
          }
        ],
        "internalType": "struct IMultiSwap2.SwapData",
        "name": "swapData",
        "type": "tuple"
      },
      {
        "components": [
          {
            "internalType": "bytes32",
            "name": "poolId",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "assetInIndex",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "assetOutIndex",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "userData",
            "type": "bytes"
          },
          {
            "internalType": "uint32",
            "name": "platformFee",
            "type": "uint32"
          }
        ],
        "internalType": "struct IMultiSwap2.SwapStep[]",
        "name": "swaps",
        "type": "tuple[]"
      },
      {
        "internalType": "contract IAsset[]",
        "name": "tokenAddresses",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "slippage",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      }
    ],
    "name": "multiSwap",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "amountOut",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "salvage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tetuFactory",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]