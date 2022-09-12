import {ACTIONS} from "../constants";

export function emitNotificationDone(emitter, uuid, description) {
  emitNotification(emitter, ACTIONS.TX_STATUS, uuid, description, "DONE");
}

export function emitNotificationPending(emitter, uuid,) {
  emitNotification(emitter, ACTIONS.TX_PENDING, uuid);
}

export function emitNotificationRejected(emitter, uuid, error) {
  emitNotification(emitter, ACTIONS.TX_REJECTED, uuid, null, null, error);
}

export function emitNotificationSubmitted(emitter, uuid, txHash) {
  emitNotification(emitter, ACTIONS.TX_SUBMITTED, uuid, null, null, null, txHash);
}

export function emitNotificationConfirmed(emitter, uuid, txHash) {
  emitNotification(emitter, ACTIONS.TX_CONFIRMED, uuid, null, null, null, txHash);
}

export function emitStatus(emitter, uuid, description, status) {
  emitNotification(emitter, ACTIONS.TX_STATUS, uuid, description, status);
}

function emitNotification(emitter, action, uuid, description, status, error, txHash) {
  setTimeout(async () => {
    await emitter.emit(action, {uuid, description, status, error, txHash})
  }, 1);
}

export async function emitNewNotifications(emitter, transactions) {
  await emitter.emit(ACTIONS.TX_ADDED, {transactions});
}

export async function emitError(emitter, error) {
  await emitter.emit(ACTIONS.ERROR, error);
}
