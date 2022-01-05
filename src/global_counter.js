/**
 * Copyright (c) Facebook, Inc. and its affiliates. 
 */

const GlobalSignal = require('./global_signal')
const SignalsWrapper = require('./signals_wrapper')
const SparkAutomergeWrapper = require('./spark_automerge_wrapper')
const INIT_COMMIT_MESSAGE = 'INIT_COUNTER_COMMIT_MESSAGE'

/**
 * If state doesn't have the counter defined, it creates a state with a counter that
 * will be located at property `signalName`. Because should only initiate the counter
 * if no other peer has done it yet.
 *
 * Otherwise, returns the current state. Because the counter was initiated by its own
 * when synchronising
 *
 * NOTE: should always call this function before updating the counter if there is a
 * chance of the counter not been initialized yet.
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
