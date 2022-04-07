/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const Automerge = require('Automerge')
const encoding = require('./encoding')
Automerge.useProxyFreeAPI()

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
 * Creates a document with a scalar that will be located at property `signalName`.
 *
 * The value of the scalar will be `startValue`.
 */
function initSignalScalar(message, signalName, startValue) {
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
 * Sets the string `newValue` to the value of the string located at property
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
 * Sets the scalar `newValue` to the value of the scalar located at property
 * `signalName` in the given `state`.
 *
 * The change will be register on the `state` history with the given `message`.
 */
function setSignalScalar(state, message, signalName, newValue) {
  return Automerge.change(state, message, doc => {
    doc.set(signalName, newValue)
  })
}

/**
 * Pushes each element in `newValues` array to the array located at property `arrayName`
 * in the given `state`.
 *
 * The change will be registered on the `state` history with the given `message`.
 */
function pushToArray(state, message, arrayName, newValues) {
  return Automerge.change(state, message, doc => {
    let array = doc.get(arrayName)
    for (let elem of newValues) {
      array.push(elem)
    }
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
  // Due to RTP message size limit, need to split sync message if it is too big
  const maxSyncMsgLength = 800

  Object.entries(syncStates).forEach(([targetPeerId, syncState]) => {
    const [nextSyncState, syncMessage] = Automerge.generateSyncMessage(
      state,
      syncState || initSyncState(),
      maxSyncMsgLength
    )
    syncStates[targetPeerId] = nextSyncState

    if (syncMessage) {
      const metaData = {
        s: peerId, t: targetPeerId
      }
      syncMsgs.push(encoding.encodeMessage(metaData, syncMessage))
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
  const [metaData, syncMessage] = encoding.decodeMessage(msg)
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
  if (typeof value === 'object' && !Array.isArray(value)) {
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
  get,
  initSignalScalar,
  setSignalScalar,
  pushToArray
}
