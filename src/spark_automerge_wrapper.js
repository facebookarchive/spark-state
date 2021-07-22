/**
 * Copyright (c) Facebook, Inc. and its affiliates. 
 */

const Automerge = require('Automerge')
Automerge.useProxyFreeAPI()

function encodeMessage(metaData, syncMessage) {
  const metaDataStr = JSON.stringify(metaData);
  const metaDataBuf = Uint8Array.from(metaDataStr, s => s.charCodeAt(0));
  const metaDataLength = metaDataBuf.length;
  const metaDataLengthSize = 1, nonZeroPaddingSize = 1;
  const totalSize = metaDataLengthSize + metaDataLength + syncMessage.length + nonZeroPaddingSize;

  let msg = new Uint8Array(totalSize);
  msg[0] = metaDataLength;
  // Set meta data buffer in the message
  msg.set(metaDataBuf, metaDataLengthSize);
  // Set sync message buffer in the message
  msg.set(syncMessage, metaDataLengthSize + metaDataLength);
  // append non zero byte at end of buffer
  // Currently messenger infrastructure is trimming all 0s in the buffer
  // Having last byte as 1 to avoid this
  // Will remove it once messenger team correct this trimming on their side
  msg[totalSize - 1] = 1;

  return msg
}

function decodeMessage(msg) {
  const metaDataLengthSize = 1, nonZeroPaddingSize = 1;
  const metaDataLength = msg[0];
  const totalSize = msg.length;

  // Decode meta data from msg to JSON 
  const metaDataBuf = msg.subarray(metaDataLengthSize, metaDataLengthSize + metaDataLength)
  const metaData = JSON.parse(String.fromCharCode(...metaDataBuf));
  // Decode sync message
  const syncMessage = msg.subarray(metaDataLengthSize + metaDataLength, totalSize - nonZeroPaddingSize);

  return [metaData, syncMessage];
}

/**
 * Creates an empty document object with no changes.
 */
function init() {
  return Automerge.init()
}

/**
 * Creates an empty sync state object with no changes.
 */
function initSyncState() {
  return Automerge.Backend.initSyncState()
}

/**
 * Creates a document with a counter that will be located at property `signalName`.
 *
 * The value of the counter will be `startValue`.
 */
function initSignalCounter(message, signalName, startValue) {
  return Automerge.change(init(), message, doc => {
    doc.set(signalName, new Automerge.Counter(startValue))
  })
}

/**
 * Creates a document with a string that will be located at property `signalName`.
 *
 * The value of the string will be `startValue`.
 */
function initSignalString(message, signalName, startValue) {
  return Automerge.change(init(), message, doc => {
    doc.set(signalName, startValue)
  })
}

/**
 * Adds the integer `incrementValue` to the value of the counter located at property
 * `signalName` in the given `state`.
 *
 * The change will be register on the `state` history with the given `message`.
 */
function incrementSignalCounter(state, message, signalName, incrementValue) {
  return Automerge.change(state, message, doc => {
    const value = doc.get(signalName)
    value.increment(incrementValue)
  })
}

/**
 * Stes the string `newValue` to the value of the string located at property
 * `signalName` in the given `state`.
 *
 * The change will be register on the `state` history with the given `message`.
 */
function setSignalString(state, message, signalName, newValue) {
  return Automerge.change(state, message, doc => {
    doc.set(signalName, newValue)
  })
}

/**
 * Receives the `syncStates` map and `peerId` to be reset.
 *
 * Resets the syn state associated with `peerId`.
 */
function initPeerSyncState(syncStates, peerId) {
  syncStates[peerId] = initSyncState()
}

/**
 * Receives the current `state`, the `syncStates` map, and the current `peerId`.
 *
 * Returns an array with the sync messages. Each message will be destined to a different peer
 * and will be generated based on its the associated synchronization status.
 */
function generateSyncMessages(state, syncStates, peerId) {
  const syncMsgs = []

  Object.entries(syncStates).forEach(([targetPeerId, syncState]) => {
    const [nextSyncState, syncMessage] = Automerge.generateSyncMessage(
      state,
      syncState || initSyncState(),
      4, // max number of changes
    )
    syncStates[targetPeerId] = nextSyncState

    if (syncMessage) {
      const metaData = {
        s: peerId, t: targetPeerId
      }
      syncMsgs.push(encodeMessage(metaData, syncMessage))
    }
  })

  return syncMsgs
}

/**
 * Receives the current `state`, the `syncStates` map, the `msg` sent by another
 * peer and the id of the sender peer (`sourcePeerId`).
 *
 * A new state and sync state will be created based on the current sync state associated with
 * `sourcePeerId` and the received message.
 *
 * Returns
 * `nextBackend`: represents the new state of the given document.
 * `patch`:       indicates if there were changes on between the given `state`
 *                and the returned `nextState`
 */
function processSyncMessage(state, syncStates, sourcePeerId, syncMessage) {
  const [nextBackend, nextSyncState, patch] = Automerge.receiveSyncMessage(
    state,
    syncStates[sourcePeerId] || initSyncState(),
    syncMessage
  )

  syncStates[sourcePeerId] = nextSyncState

  return [nextBackend, patch]
}

/**
 * Receives the current `state`, the `syncStates` map, the `msg` sent by another
 * peer and the id of the current peer (`peerId`).
 *
 * Returns an array with `nextState`, `patch` and `ignoreMessage`.
 *
 * `nextState`:     represents the new state of the given document.
 * `patch`:         indicates if there were changes on between the given `state`
 *                  and the returned `nextState`
 * `ignoreMessage`: indicates if the received was an should be ignore. The flag will
 *                  be on if the message wasnt targeted to the current peer
 */
function processMessage(state, syncStates, peerId, msg) {
  const [metaData, syncMessage] = decodeMessage(msg)
  const sourcePeerId = metaData.s
  const targetPeerId = metaData.t

  if (targetPeerId && targetPeerId !== peerId) {
    return [state, null, true]
  }

  const ret = processSyncMessage(state, syncStates, sourcePeerId, syncMessage)
  ret.push(false)
  return ret
}

function get(state, key) {
  let value = state[key]
  if (typeof value === 'object') {
    value = value.toJSON()
  }
  return value
}

module.exports = {
  init,
  initSyncState,
  initPeerSyncState,
  generateSyncMessages,
  processMessage,
  initSignalCounter,
  initSignalString,
  setSignalString,
  incrementSignalCounter,
  get
}
