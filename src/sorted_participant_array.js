/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const Participants = require('Participants')
const Time = require('Time')
const GlobalArray = require('./global_array')
const Reactive = require('Reactive')

const Diagnostics = require('Diagnostics')

const MAX_WAIT_FOR_SELF_ADD = 10000
const SPARK_SORTED_PARTICIPANTS = "sparkSortedParticipants"

export async function createSortedParticipantArray() {
  const localParticipant = await Participants.self
  const sortedParticipants = await GlobalArray.createGlobalArray([], SPARK_SORTED_PARTICIPANTS)

  const isComplete = Reactive.boolSignalSource("sparkSortedParticipantsComplete")
  isComplete.set(false)
  sortedParticipants.isCompleteSignal = isComplete.signal

  // Add local or send to changes queue
  sortedParticipants.pushContent(localParticipant.id)

  // Add fallback for adding local participant
  const addLocalParticipantTimeOut = Time.setTimeout(() => {
    if (!sortedParticipants.some(p => p === localParticipant.id)) {
      sortedParticipants.setIsSynced(true);
    }
  }, MAX_WAIT_FOR_SELF_ADD)

  // Wait for all current participants to be added
  const initialSyncInterval = Time.setInterval(async () => {
    const complete = isSortedParticipantArrayComplete();
    if (complete) {
      isComplete.set(true);
      Time.clearTimeout(initialSyncInterval);
    }
  }, 1000);

  sortedParticipants.getSortedActiveParticipants = async () => {
    const activeParticipants = new Set(await getActiveParticipantIDs());
    let sortedActiveParticipants = [];
    for (let participantId of sortedParticipants) {
      if (activeParticipants.has(participantId)) {
        sortedActiveParticipants.push(participantId);
        activeParticipants.delete(participantId);
      }
    }
    return sortedActiveParticipants;
  }

  sortedParticipants.getSortedParticipants = async () => {
    const peers = (await Participants.getAllOtherParticipants()).map(p => p.id)
    const allParticipants = new Set(peers)
    allParticipants.add(localParticipant.id)

    let sortedAllParticipants = []
    for (let participantId of sortedParticipants) {
      if (allParticipants.has(participantId)) {
        sortedAllParticipants.push(participantId)
        allParticipants.delete(participantId)
      }
    }
    return sortedAllParticipants
  }

  // Monitor changes
  Participants.onOtherParticipantAdded().subscribe(async (participant) => {
    // When a new participant is added to the call, we clear the "complete" flag
    // until this participant is added to the global array
    isComplete.set(false);
    const addParticipantInterval = Time.setInterval(async () => {
      let complete = await isSortedParticipantArrayComplete();
      if (complete) {
        isComplete.set(true);
        Time.clearInterval(addParticipantInterval);
      }
    }, 1000);
  });

  // Helper functions
  async function getActiveParticipantIDs() {
    const peers = await Participants.getAllOtherParticipants();
    const activeParticipantIDs = [];
    peers.forEach(p => {
      if (p.isActiveInCall.pinLastValue()) {
        activeParticipantIDs.push(p.id);
      }
    });
    activeParticipantIDs.push(localParticipant.id);
    return activeParticipantIDs;
  }

  async function isSortedParticipantArrayComplete() {
    const activeParticipantIDs = await getActiveParticipantIDs();
    const currentParticipants = new Set(sortedParticipants);
    return activeParticipantIDs.every(p => currentParticipants.has(p));
  }

  return sortedParticipants;
}
