/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const GlobalCounter = require('./global_counter')
const GlobalString = require('./global_string')
const GlobalMap = require('./global_map')
const GlobalScalar = require('./global_scalar')
const GlobalArray = require('./global_array')

module.exports.createGlobalCounterSignal = GlobalCounter.createGlobalCounterSignal
module.exports.createGlobalStringSignal = GlobalString.createGlobalStringSignal
module.exports.createGlobalPeersMap = GlobalMap.createGlobalPeersMap
module.exports.createGlobalScalarSignal = GlobalScalar.createGlobalScalarSignal
module.exports.createGlobalArray = GlobalArray.createGlobalArray
