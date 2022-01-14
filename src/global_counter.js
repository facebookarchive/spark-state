/**
 * Copyright (c) Facebook, Inc. and its affiliates. 
 */

const GlobalSignal = require('./global_signal')
const SignalsWrapper = require('./signals_wrapper')
const SparkAutomergeWrapper = require('./spark_automerge_wrapper')
const INIT_COMMIT_MESSAGE = 'INIT_COUNTER_COMMIT_MESSAGE'

/**
 * If state doesn't have the counter defined, this method creates a state with a counter that
 * will be located at property `signalName`. This ensures that a counter is only initialized
 * if no other peer has done so yet.
 * 
 * If the counter is already defined, this returns the current state, as the counter will have been
 * initialized when synchronizing.
 *
 * NOTE: This method should always be called before updating the counter if there is a
 * chance that the counter has not been initialized yet.
 */
function guaranteeStateCounter(state, signalName, startValue) {
  return (Object.prototype.hasOwnProperty.call(state, signalName) ? state : SparkAutomergeWrapper.initSignalCounter(INIT_COMMIT_MESSAGE, signalName, startValue))
}

/**
 * Creates a new `GlobalCounterSignal` with a globally unique name as specified by `signalName`, and with the initial value set by `startValue`.
 */
export async function createGlobalCounterSignal(startValue, signalName) {
  const signal = await SignalsWrapper.Counter(startValue, signalName)

  const updateState = (state, signalName, event) => {
    return SparkAutomergeWrapper.incrementSignalCounter(
      state,
      'increment value',
      signalName,
      event.newValue - event.oldValue
    )
  }
  await GlobalSignal.createGlobalSignal(signal, startValue, signalName, guaranteeStateCounter, updateState)

  return signal
}
