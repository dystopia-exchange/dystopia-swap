import Multicall from "@dopex-io/web3-multicall";
import detectProvider from "@metamask/detect-provider";
import { ethers } from "ethers";
import stores from "../stores";
import { ACTIONS, CONTRACTS } from "./constants";
// import {
//   injected,
//   walletconnect,
//   walletlink,
//   network
// } from './connectors';

import Web3 from "web3";

class Store {
  constructor(dispatcher, emitter) {
    this.dispatcher = dispatcher;
    this.emitter = emitter;

    this.store = {
      account: null,
      chainInvalid: false,
      web3provider: null,
      web3modal: null,
      web3context: null,
      tokens: [],
      // connectorsByName: {
      //   MetaMask: injected,
      //   TrustWallet: injected,
      //   WalletLink: walletlink,
      //   WalletConnect: walletconnect,
      // },
      gasPrices: {
        standard: 90,
        fast: 100,
        instant: 130,
      },
      gasSpeed: "fast",
      currentBlock: 12906197,
    };

    dispatcher.register(
      function (payload) {
        switch (payload.type) {
          case ACTIONS.CONFIGURE:
            this.configure(payload);
            break;
          default: {
          }
        }
      }.bind(this)
    );
  }

  getStore(index) {
    return this.store[index];
  }

  setStore(obj) {
    this.store = { ...this.store, ...obj };
    return this.emitter.emit(ACTIONS.STORE_UPDATED);
  }

  configure = async () => {
    const supportedChainIds = [process.env.NEXT_PUBLIC_CHAINID];
    const provider = await detectProvider();
    this.getGasPrices();

    let providerChain = provider
      ? await provider.request({ method: "eth_chainId" })
      : null;

    this.emitter.emit(ACTIONS.ACCOUNT_CONFIGURED);

    this.dispatcher.dispatch({
      type: ACTIONS.CONFIGURE_SS,
      content: { connected: false },
    });

    if (window.ethereum || provider ? provider : null) {
      // this.subscribeProvider();
    } else {
    }

    window.removeEventListener("ethereum#initialized", this.subscribeProvider);
    window.addEventListener("ethereum#initialized", this.subscribeProvider, {
      once: true,
    });
  };

  setProvider = async (provider) => {
    this.ethersProvider = new ethers.providers.Web3Provider(provider);
    const signer = this.ethersProvider.getSigner();
    this.provider = provider;

    try {
      const address = await signer.getAddress();
      this.setWalletAddress(address);
      // await this.getNetwork()
    } catch (error) {
      console.log(error);
    }
  };

  subscribeProvider = () => {
    const that = this;

    window.ethereum.on("accountsChanged", async function (accounts) {
      const address = accounts[0];
      await stores.stableSwapStore.configure();
      that.setStore({
        account: { address },
      });
      that.emitter.emit(ACTIONS.ACCOUNT_CHANGED);
      that.emitter.emit(ACTIONS.ACCOUNT_CONFIGURED);
      that.dispatcher.dispatch({
        type: ACTIONS.CONFIGURE_SS,
        content: { connected: true },
      });
    });

    window.ethereum.on("chainChanged", async function (chainId) {
      const supportedChainIds = [process.env.NEXT_PUBLIC_CHAINID];
      const parsedChainId = parseInt(chainId + "", 16) + "";
      const isChainSupported = supportedChainIds.includes(parsedChainId);
      that.setStore({ chainInvalid: !isChainSupported });
      await stores.stableSwapStore.configure();
      that.emitter.emit(ACTIONS.ACCOUNT_CHANGED);
      that.emitter.emit(ACTIONS.ACCOUNT_CONFIGURED);
      that.configure();
    });
  };

  getGasPrices = async (payload) => {
    const gasPrices = await this._getGasPrices();
    let gasSpeed = localStorage.getItem("dystopia.finance-gas-speed");

    if (!gasSpeed) {
      gasSpeed = "fast";
      localStorage.getItem("dystopia.finance-gas-speed", "fast");
    }

    this.setStore({ gasPrices: gasPrices, gasSpeed: gasSpeed });
    this.emitter.emit(ACTIONS.GAS_PRICES_RETURNED);
  };

  _getGasPrices = async () => {
    try {
      const web3 = await this.getWeb3Provider();
      const gasPrice = await web3.eth.getGasPrice();
      const gasPriceInGwei = web3.utils.fromWei(gasPrice, "gwei");
      return {
        standard: gasPriceInGwei,
        fast: gasPriceInGwei,
        instant: gasPriceInGwei,
      };
    } catch (e) {
      console.log(e);
      return {};
    }
  };

  getGasPrice = async (speed) => {
    let gasSpeed = speed;
    if (!speed) {
      gasSpeed = this.getStore("gasSpeed");
    }

    try {
      const web3 = await this.getWeb3Provider();
      const gasPrice = await web3.eth.getGasPrice();
      const gasPriceInGwei = web3.utils.fromWei(gasPrice, "gwei");
      return gasPriceInGwei;
    } catch (e) {
      console.log(e);
      return {};
    }
  };

  isWeb3ProviderExist = async () => {
    const hasEthereum = !!window?.ethereum;
    const hasProvider = await detectProvider();
    return hasEthereum || hasProvider;
  }

  getWeb3Provider = async () => {
    // let web3context = this.getStore('web3context');
    // let provider = null;

    // if (!web3context) {
    //   provider = network.providers['1'];
    // } else {
    //   provider = web3context.library.provider;
    // }

    // if (!provider) {
    //   return null;
    // }
    let web3provider = this.getStore("web3provider");

    if (web3provider === null) {
      return new Web3(window.ethereum || (await detectProvider()));
    }

    return web3provider;
  };

  getMulticall = async () => {
    const web3 = await this.getWeb3Provider();
    const multicall = new Multicall({
      multicallAddress: CONTRACTS.MULTICALL_ADDRESS,
      provider: web3,
    });
    return multicall;
  };
}

export default Store;
