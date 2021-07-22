/**
 * Copyright (c) Facebook, Inc. and its affiliates. 
 */

const GlobalCounter = require('./global_counter')
const GlobalString = require('./global_string')
const GlobalMap = require('./global_map')

module.exports.createCounterGlobalSignal = GlobalCounter.createCounterGlobalSignal
module.exports.createStringGlobalSignal = GlobalString.createStringGlobalSignal
module.exports.createPeersMapGlobal = GlobalMap.createPeersMapGlobal
