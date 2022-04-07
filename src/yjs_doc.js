const Multipeer = require('Multipeer')
const Participants = require('Participants')
const Time = require('Time')

const Y = require('./yjs')
const encoding = require('./encoding')

function Uint8ArrayEquals(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

const NETWORK_ORIGIN = "network"

export async function createYDoc(name) {
  const changesChannel = Multipeer.getBinaryMessageChannel(name + "_changes");
  const stateVectorsChannel = Multipeer.getBinaryMessageChannel(name + "_statevectors");
  const refreshChannel = Multipeer.getMessageChannel(name + "_refresh");

  // init yjs doc
  const doc = new Y.Doc();

  // get current participant id
  const myId = (await Participants.self).id

  // set up state Vectors for self and peers
  let stateVectors = {}
  stateVectors[myId] = Y.encodeStateVector(doc)

  /* Start of Utitily Functions */

  function broadcastChangesToTargetPeer(peerId) {
    const stateUpdate = Y.encodeStateAsUpdate(doc, stateVectors[peerId]);
    const encodedMessage = encoding.encodeMessage({ s: myId, t: peerId }, stateUpdate);
    changesChannel.sendMessage(encodedMessage);
  }

  function broadcastChangesToPeers() {
    for (const peerId in stateVectors) {
      // only send to peer when their state vector is not the same as the local one
      if (peerId !== myId && stateVectors[myId] !== stateVectors[peerId]) {
        broadcastChangesToTargetPeer(peerId);
      }
    }
  }

  function broadcastStateVectorToPeers() {
    stateVectorsChannel.sendMessage(encoding.encodeMessage({ s: myId }, stateVectors[myId]))
  }

  /* End of Utitily Functions */

  // when ydoc is changed, update all peers for my latest states.
  doc.on('update', (_, origin) => {
    // update my state vector and changes to peers when my state has been changed
    stateVectors[myId] = Y.encodeStateVector(doc);
    broadcastStateVectorToPeers();

    if (origin !== NETWORK_ORIGIN) { 
      broadcastChangesToPeers()
    }
  })

  // Send my latest state vector upon peer request
  refreshChannel.onMessage.subscribe((node) => {
    stateVectorsChannel.sendMessage(encoding.encodeMessage({ s: myId }, stateVectors[myId]))
  })

  // Request all peers to send their latest state vector
  refreshChannel.sendMessage(myId);

  // handle new changes coming from other peers
  changesChannel.onMessage.subscribe((m) => {
    const [metaData, msg] = encoding.decodeMessage(m)

    // only handle message addressed to me
    if (metaData.t !== myId) { return; }

    // update ydoc value from peers
    Y.applyUpdate(doc, msg, NETWORK_ORIGIN);
  })

  // handle state vectors coming from other peers
  stateVectorsChannel.onMessage.subscribe((m) => {
    const [metaData, msg] = encoding.decodeMessage(m)
    const peerId = metaData.s
    stateVectors[peerId] = msg

    // if peers are not update to date then send an update message back
    if (!Uint8ArrayEquals(stateVectors[peerId], stateVectors[myId])) {
      broadcastChangesToTargetPeer(peerId)
    }
  })

  broadcastStateVectorToPeers()

  // This is done to periodically request update from peers 
  // if local state vector is lagging behind.
  // When remote peer receives this, it will send an update message if needed.
  // This is necessary because Multipeer API is a lossy channel.
  // This periodically resync is needed to recover lost update.
  Time.setInterval(broadcastStateVectorToPeers, 2000);

  return doc;
}
