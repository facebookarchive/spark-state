/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const GlobalCounter = require('./global_counter')
const GlobalString = require('./global_string')
const GlobalMap = require('./global_map')
const GlobalScalar = require('./global_scalar')
// const GlobalAppendOnlyArray = require('./global_append_only_array')
const SortedParticipantArray = require('./sorted_participant_array')

module.exports.createGlobalCounterSignal = GlobalCounter.createGlobalCounterSignal
module.exports.createGlobalStringSignal = GlobalString.createGlobalStringSignal
module.exports.createGlobalPeersMap = GlobalMap.createGlobalPeersMap
module.exports.createGlobalScalarSignal = GlobalScalar.createGlobalScalarSignal
// module.exports.createGlobalAppendOnlyArray = GlobalAppendOnlyArray.createGlobalAppendOnlyArray
module.exports.createSortedParticipantArray = SortedParticipantArray.createSortedParticipantArray
