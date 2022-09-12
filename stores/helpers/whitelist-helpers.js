import {ACTIONS, CONTRACTS} from "../constants";
import {formatBN, getTXUUID} from '../../utils';
import {callContractWait} from "./web3-helper";

export const searchWhitelist = async (
  payload,
  web3,
  emitter,
  getBaseAssetCall
) => {
  try {
    const {search} = payload.content;

    const voterContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS);

    const [isWhitelisted, listingFee] = await Promise.all([
      voterContract.methods.isWhitelisted(search).call(),
      voterContract.methods.listingFee().call(),
    ]);

    const token = await getBaseAssetCall(search);
    token.isWhitelisted = isWhitelisted;
    token.listingFee = formatBN(listingFee);

    emitter.emit(ACTIONS.SEARCH_WHITELIST_RETURNED, token);
  } catch (ex) {
    console.error(ex);
    this.emitter.emit(ACTIONS.ERROR, ex);
  }
};

export const whitelistToken = async (
  payload,
  account,
  web3,
  emitter,
  dispatcher,
  gasPrice,
  callback
) => {
  try {
    const {token, nft} = payload.content;

    // ADD TRNASCTIONS TO TRANSACTION QUEUE DISPLAY
    let whitelistTXID = getTXUUID();

    emitter.emit(ACTIONS.TX_ADDED, {
      title: `WHITELIST ${token.symbol}`,
      verb: "Token Whitelisted",
      transactions: [
        {
          uuid: whitelistTXID,
          description: `Whitelisting ${token.symbol}`,
          status: "WAITING",
        },
      ],
    });

    // SUBMIT WHITELIST TRANSACTION
    const voterContract = new web3.eth.Contract(CONTRACTS.VOTER_ABI, CONTRACTS.VOTER_ADDRESS);

    await callContractWait(
      web3,
      voterContract,
      "whitelist",
      [token.address, nft.id],
      account,
      gasPrice,
      null,
      null,
      whitelistTXID,
      emitter,
      dispatcher,
      async (err) => {
        if (err) {
          return emitter.emit(ACTIONS.ERROR, err);
        }

        await callback(dispatcher, token)

        emitter.emit(ACTIONS.WHITELIST_TOKEN_RETURNED);
      }
    );
  } catch (ex) {
    console.error("Whitelist error", ex);
    emitter.emit(ACTIONS.ERROR, ex);
  }
};
