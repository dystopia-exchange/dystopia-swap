import React, { useEffect } from 'react'
import Web3Modal from 'web3modal'
import CoinbaseWalletSDK from '@coinbase/wallet-sdk'
import WalletConnectProvider from '@walletconnect/web3-provider'
import stores from '../../stores'
import Web3 from 'web3'
import { ACTIONS } from '../../stores/constants'
import { ethers } from 'ethers'
import {useAppThemeContext} from "../../ui/AppThemeProvider";

const {
  ERROR,
  CONNECTION_DISCONNECTED,
  CONNECTION_CONNECTED,
  CONFIGURE_SS,
} = ACTIONS;

export const WalletConnect = (props) => {
  const {appTheme} = useAppThemeContext();

  const connect = async function web3Init() {
    const web3modal = new Web3Modal({
      theme: appTheme === 'dark' ? {
        background: 'rgba(21, 23, 24, 0.8)',
        main: '#ffffff',
        hover: '#24292D',
      } : {
        background: 'rgb(219, 230, 236)',
        hover: '#B9DFF5',
        // border: 'rgb(134, 185, 214)', not working ):
      },
      cacheProvider: true,
      network: "matic",
      providerOptions: {
        walletlink: {
          package: CoinbaseWalletSDK,
          options: {
            appName: 'Dystopia app',
            infuraId: `${process.env.NEXT_PUBLIC_INFURA_KEY}`,
            rpc: {
              137: `https://polygon-rpc.com/`,
            },
            supportedChainIds: [137],
            network: "matic",
          },
        },
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            infuraId: `${process.env.NEXT_PUBLIC_INFURA_KEY}`,
            rpc: {
              137: `https://polygon-rpc.com/`,
            },
            network: "matic",
            supportedChainIds: [137],
          },
        },
      },
    })


    const instance = await web3modal.connect()
      .catch((err) => {
        console.log('ERR:', err)
      })

    if (instance === undefined) {
      return
    }

    const provider = new ethers.providers.Web3Provider(instance)

    const signer = provider.getSigner()
    const address = await signer.getAddress()

    if (!provider) {
      return
    }

    const web3 = new Web3(instance);
    stores.accountStore.subscribeProvider();

    const chainId = await web3.eth.getChainId()

    const supportedChainIds = [process.env.NEXT_PUBLIC_CHAINID];
    const isChainSupported = supportedChainIds.includes(String(chainId));
    stores.accountStore.setStore({ chainInvalid: !isChainSupported });

    stores.accountStore.setStore({
      account: { address },
      web3provider: web3,
      web3modal,
      web3context: {
        library: {
          provider: web3,
          instance,
        }
      },
    });

    setTimeout(() => {
      stores.emitter.emit(CONNECTION_CONNECTED);
      stores.emitter.emit(ACTIONS.ACCOUNT_CONFIGURED);
      stores.dispatcher.dispatch({
        type: ACTIONS.CONFIGURE_SS,
        content: { connected: true },
      });
    }, 100)

    return { web3provider: web3, address }
  }

  useEffect(() => {
    if (window.localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER')) {
      connect()
    }
  }, [])

  return props.children({ connect })
}
