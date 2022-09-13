import AccountStore from './accountStore';
import StableSwapStore from './stableSwapStore';
import MultiSwapStore from "./multiSwapStore";

const Dispatcher = require('flux').Dispatcher;
const Emitter = require('events').EventEmitter;

const dispatcher = new Dispatcher();
const emitter = new Emitter();

const accountStore = new AccountStore(dispatcher, emitter);
const stableSwapStore = new StableSwapStore(dispatcher, emitter);
const multiSwapStore = new MultiSwapStore();

export default {
  accountStore,
  stableSwapStore,
  multiSwapStore,
  dispatcher,
  emitter,
};
