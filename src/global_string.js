/**
 * Copyright (c) Facebook, Inc. and its affiliates. 
 */

const GlobalSignal = require('./global_signal')
const SignalsWrapper = require('./signals_wrapper')
const SparkAutomergeWrapper = require('./spark_automerge_wrapper')
const INIT_COMMIT_MESSAGE = 'INIT_STRING_COMMIT_MESSAGE'

/**
 * If state doesn't have the string defined, this method creates a state with a string that
 * will be located at property `signalName`. This ensures that a string is only initialized
 * if no other peer has done so yet.
 * 
 * If the string is already defined, this returns the current state, as the string will have been
 * initialized when synchronizing.
 *
 * NOTE: This method should always be called before updating the string if there is a
 * chance that the string has not been initialized yet.
 */
function guaranteeStateString(state, signalName, startValue) {
  return (Object.prototype.hasOwnProperty.call(state, signalName) ? state : SparkAutomergeWrapper.initSignalString(INIT_COMMIT_MESSAGE, signalName, startValue))
}

/**
 * Creates a new `GlobalStringSignal` with a globally unique name as specified by `signalName`, and with the initial value set by `startValue`.
 */
export async function createGlobalStringSignal(startValue, signalName) {
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
