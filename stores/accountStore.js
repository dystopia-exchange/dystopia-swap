import async from "async";
import { ACTIONS, CONTRACTS } from "./constants";
import Multicall from "@dopex-io/web3-multicall";
import detectProvider from "@metamask/detect-provider";
import { injected, walletconnect, walletlink, network } from "./connectors";
import { providers } from "ethers";
import Web3 from "web3";

class Store {
  constructor(dispatcher, emitter) {
    this.dispatcher = dispatcher;
    this.emitter = emitter;

    this.store = {
      account: null,
      chainInvalid: false,
      web3context: null,
      tokens: [],
      connectorsByName: {
        MetaMask: injected,
        TrustWallet: injected,
        WalletLink: walletlink,
        WalletConnect: walletconnect,
      },
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
    const provider = await detectProvider();
    // this.getGasPrices();
    injected.isAuthorized().then(async (isAuthorized) => {
      const { supportedChainIds } = injected;
      let providerChain = await provider.request({ method: "eth_chainId" });
      const { chainId = process.env.NEXT_PUBLIC_CHAINID } =
        { chainId: providerChain } || {};
      // fall back to ethereum mainnet if chainId undefined
      const parsedChainId = parseInt(chainId, 16);
      const isChainSupported = supportedChainIds.includes(parsedChainId);
      if (!isChainSupported) {
        this.setStore({ chainInvalid: true });
        this.emitter.emit(ACTIONS.ACCOUNT_CHANGED);
      }

      if (isAuthorized && isChainSupported) {
        injected
          .activate()
          .then((a) => {
            this.setStore({
              account: { address: a.account },
              web3context: { library: { provider: a.provider } },
            });
            this.emitter.emit(ACTIONS.ACCOUNT_CONFIGURED);
          })
          .then(() => {
            this.dispatcher.dispatch({
              type: ACTIONS.CONFIGURE_SS,
              content: { connected: true },
            });
          })
          .catch((e) => {
            this.emitter.emit(ACTIONS.ERROR, e);
            this.emitter.emit(ACTIONS.ACCOUNT_CONFIGURED);

            this.dispatcher.dispatch({
              type: ACTIONS.CONFIGURE_SS,
              content: { connected: false },
            });
          });
      } else {
        //we can ignore if not authorized.
        this.emitter.emit(ACTIONS.ACCOUNT_CONFIGURED);
        this.emitter.emit(ACTIONS.CONFIGURED);
      }
    });

    if (window.ethereum || provider) {
      this.updateAccount();
    } else {
      window.removeEventListener("ethereum#initialized", this.updateAccount);
      window.addEventListener("ethereum#initialized", this.updateAccount, {
        once: true,
      });
    }
  };

  updateAccount = () => {
    const that = this;
    const res = window.ethereum.on(
      "accountsChanged",
      async function (accounts) {
        that.setStore({
          account: { address: accounts[0] },
          web3context: {
            library: { provider: window.ethereum || (await detectProvider()) },
          },
        });
        that.emitter.emit(ACTIONS.ACCOUNT_CHANGED);
        that.emitter.emit(ACTIONS.ACCOUNT_CONFIGURED);

        that.dispatcher.dispatch({
          type: ACTIONS.CONFIGURE_SS,
          content: { connected: true },
        });
      }
    );

    window.ethereum.on("chainChanged", function (chainId) {
      const supportedChainIds = [process.env.NEXT_PUBLIC_CHAINID];
      const parsedChainId = parseInt(chainId + "", 16) + "";
      const isChainSupported = supportedChainIds.includes(parsedChainId);
      that.setStore({ chainInvalid: !isChainSupported });
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

  getWeb3Provider = async () => {
    let web3context = this.getStore("web3context");
    let provider = null;
    console.log(web3context, "heyyyy");
    if (!web3context) {
      provider = network.providers["1"];
    } else {
      provider = web3context.library.provider;
    }

    if (!provider) {
      return null;
    }
    return new Web3(provider);
  };
  connectWalletConnect = async () => {
    try {
      const that = this;
      const provider = that.getStore("connectorsByName")["WalletConnect"];
      // const provider = connectorsByName[name];
      await provider.enable();
      const web3 = new Web3(provider);
      const web3Provider = new providers.Web3Provider(provider);
      that.setStore({
        account: { address: provider.accounts[0] },
        web3context: { library: { provider: web3Provider.provider } },
      });
      this.emitter.emit(ACTIONS.ACCOUNT_CONFIGURED);
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
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
