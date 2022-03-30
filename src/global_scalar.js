/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const GlobalSignal = require('./global_signal')
const SparkAutomergeWrapper = require('./spark_automerge_wrapper')
const INIT_COMMIT_MESSAGE = 'INIT_SCALAR_COMMIT_MESSAGE'
const Reactive = require('Reactive')

/**
 * Returns a `ScalarSignal` object that can be modified via calls to the `set` method.
 */
async function Scalar(startValue, signalName) {
  const source = Reactive.scalarSignalSource(signalName)
  source.set(startValue)
  const signal = source.signal

  signal.compareAndUpdateLocal = function(val) {
    if (signal.pinLastValue() !== val) {
      source.set(val)
    }
  }

  signal.setValueOnly = function (val) {
    source.set(val);
  }

  signal.setValueAndUpdate = function (val) {
    const oldValue = signal.pinLastValue()
    source.set(val)
    signal.updateState({newValue : val, oldValue})
  }

  signal.setReceivedAllValues = function (val) {}

  signal.set = signal.setValueAndUpdate

  return signal
}

/**
 * If state doesn't have the scalar defined, this method creates a state with a scalar that
 * will be located at property `signalName`. This ensures that a scalar is only initialized
 * if no other peer has done so yet.
 *
 * If the scalar is already defined, this returns the current state, as the scalar will have been
 * initialized when synchronizing.
 *
 * NOTE: This method should always be called before updating the scalar if there is a
 * chance that the scalar has not been initialized yet.
 */
function guaranteeStateScalar(state, signalName, startValue) {
  return (Object.prototype.hasOwnProperty.call(state, signalName) ? state : SparkAutomergeWrapper.initSignalScalar(INIT_COMMIT_MESSAGE, signalName, startValue))
}

/**
 * Creates a new `GlobalScalarSignal` with a globally unique name as specified by `signalName`, and with the initial value set by `startValue`.
 */
export async function createGlobalScalarSignal(startValue, signalName) {
  const signal = await Scalar(startValue, signalName)

  const updateState = (state, signalName, event) => {
    return SparkAutomergeWrapper.setSignalScalar(
      state,
      'update value',
      signalName,
      event.newValue
    )
  }

  await GlobalSignal.createGlobalSignal(signal, startValue, signalName, guaranteeStateScalar, updateState)

  return signal
}
