/**
 * Copyright (c) Facebook, Inc. and its affiliates. 
 */

const GlobalSignal = require('./global_signal')
const SignalsWrapper = require('./signals_wrapper')
const SparkAutomergeWrapper = require('./spark_automerge_wrapper')
const INIT_COMMIT_MESSAGE = 'INIT_STRING_COMMIT_MESSAGE'

/**
 * If state doesn't have the string defined, it creates a state with a string that
 * will be located at property `signalName`. Because should only initiate the string
 * if no other peer has done it yet.
 *
 * Otherwise, returns the current state. Because the string was initiated by its own
 * when synchronising
 *
 * NOTE: should always call this function before updating the string if there is a
 * chance of the string not been initialized yet.
 */
function guaranteeStateString(state, signalName, startValue) {
  return (Object.prototype.hasOwnProperty.call(state, signalName) ? state : SparkAutomergeWrapper.initSignalString(INIT_COMMIT_MESSAGE, signalName, startValue))
}

export async function createStringGlobalSignal(startValue, signalName) {
  const signal = await SignalsWrapper.String(startValue, signalName)

  const updateState = (state, signalName, event) => {
    return SparkAutomergeWrapper.setSignalString(
      state,
      'update value',
      signalName,
      event.newValue
    )
  }

  await GlobalSignal.createGlobalSignal(signal, startValue, signalName, guaranteeStateString, updateState)

  return signal
}
