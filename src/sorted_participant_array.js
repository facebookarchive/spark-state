/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const Participants = require('Participants')
const Time = require('Time')
const GlobalAppendOnlyArray = require('./global_append_only_array')
const Reactive = require('Reactive')
const Diagnostics = require('Diagnostics')

const SPARK_SORTED_PARTICIPANTS = "sparkSortedParticipants";
const SPARK_SORTED_PARTICIPANTS_COMPLETE = "sparkSortedParticipantsComplete";

let currentSortedParticipantArray_ = null;

export async function createSortedParticipantArray() {

  if (currentSortedParticipantArray_ != null) {
    return currentSortedParticipantArray_;
  }

  const globalParticipantsArray =
    await GlobalAppendOnlyArray.createGlobalAppendOnlyArray([], SPARK_SORTED_PARTICIPANTS);

  const sortedParticipantsWrapper = {}

  const isSynced = Reactive.boolSignalSource(SPARK_SORTED_PARTICIPANTS_COMPLETE);
  isSynced.set(false);
  sortedParticipantsWrapper.isSyncedSignal = isSynced.signal;

  // Add local or send to changes queue
  const localParticipant = await Participants.self;
  globalParticipantsArray.push(localParticipant.id);

  // Wait for all current participants to be added
  const initialSyncInterval = Time.setInterval(async () => {
    const complete = isSortedParticipantArrayComplete();
    if (complete) {
      Diagnostics.log("Complete from peers!")
      isSynced.set(true);
      Time.clearInterval(initialSyncInterval);
    }
  }, 1000);

  sortedParticipantsWrapper.getSortedActiveParticipants = async () => {
    const activeParticipantsMap = await getActiveParticipantsMap();
    const sortedActiveParticipants = [];
    const globalParticipantsSnapshot = globalParticipantsArray.getSnapshot();
    for (let participantId of globalParticipantsSnapshot) {
      if (activeParticipantsMap.has(participantId)) {
        sortedActiveParticipants.push(activeParticipantsMap.get(participantId));
        activeParticipantsMap.delete(participantId);
      }
    }
    return sortedActiveParticipants;
  }

  sortedParticipantsWrapper.getSortedAllTimeParticipants = async () => {
    const allParticipantsMap = new Map();
    (await Participants.getAllOtherParticipants()).forEach(p => allParticipantsMap.set(p.id, p));
    allParticipantsMap.set(localParticipant.id, localParticipant);

    const sortedAllTimeParticipants = [];
    const globalParticipantsSnapshot = globalParticipantsArray.getSnapshot();
    for (let participantId of globalParticipantsSnapshot) {
      if (allParticipantsMap.has(participantId)) {
        sortedAllTimeParticipants.push(allParticipantsMap.get(participantId));
        allParticipantsMap.delete(participantId);
      }
    }
    return sortedAllTimeParticipants;
  }

  // Monitor changes
  Participants.onOtherParticipantAdded().subscribe(async (participant) => {
    // When a new participant is added to the call, the array is not synced
    // until this participant is added to the global array
    isSynced.set(false);
    let intervalRuns = 0;
    const addParticipantInterval = Time.setInterval(async () => {
      intervalRuns++;
      let complete = await isSortedParticipantArrayComplete();
      if (complete) {
        Time.clearInterval(addParticipantInterval);
        updateIsSyncedAfterIntervals(intervalRuns);
      }
    }, 1000);

    // Monitor the new participant for status changes to emit
    // an isSynced signal
    participant.isActiveInCall.monitor().subscribe((event) => {
      isSynced.set(false);
      Time.setTimeout(() => {
        isSynced.set(true);
      }, 50);
    })
  })

  const currentParticipants = await Participants.getAllOtherParticipants();
  currentParticipants.forEach(participant => {
    // Monitor all current participants for status changes to emit
    // an isSynced signal
    participant.isActiveInCall.monitor().subscribe((event) => {
      isSynced.set(false);
      Time.setTimeout(() => {
        isSynced.set(true);
      }, 50);
    })
  })

  // Helper functions
  async function getActiveParticipantsMap() {
    const peers = await Participants.getAllOtherParticipants();
    const activeParticipantsMap = new Map();
    peers.forEach(p => {
      if (p.isActiveInCall.pinLastValue()) {
        activeParticipantsMap.set(p.id, p);
      }
    });
    activeParticipantsMap.set(localParticipant.id, localParticipant);
    return activeParticipantsMap;
  }

  async function isSortedParticipantArrayComplete() {
    const participantsFromAPI = await Participants.getAllOtherParticipants();
    participantsFromAPI.push(localParticipant);
    const participantsFromArray = new Set(globalParticipantsArray.getSnapshot());
    return participantsFromAPI.every(p => participantsFromArray.has(p.id));
  }

  function updateIsSyncedAfterIntervals(intervalRuns) {
    if (intervalRuns > 1) {
      isSynced.set(true);
    } else {
      Time.setTimeout(() => {
        isSynced.set(true);
      }, 50);
    }
  }

  currentSortedParticipantArray_ = sortedParticipantsWrapper;
  return sortedParticipantsWrapper;
}
