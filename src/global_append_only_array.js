/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const GlobalSignal = require('./global_signal')
const SignalsWrapper = require('./signals_wrapper')
const SparkAutomergeWrapper = require('./spark_automerge_wrapper')
const Time = require('Time')
const INIT_COMMIT_MESSAGE = 'INIT_ARRAY_COMMIT_MESSAGE'

/**
 * If state doesn't have the array defined, this method creates a state with an array
 * (`startValue`) that will be located at `arrayName`.
 * This ensures that the array is only initialized if no other peer has done so yet.
 *
 * If the array is already defined, this returns it.
 *
 * NOTE: This method should always be called before updating the counter if there is a
 * chance that the counter has not been initialized yet.
 */

function guaranteeStateArray(state, arrayName, startValue) {
  return (Object.prototype.hasOwnProperty.call(state, arrayName)
    ? state
    : SparkAutomergeWrapper.initSignalScalar(INIT_COMMIT_MESSAGE, arrayName, startValue))
}

/**
 * Creates a new append-only GlobalArray with a globally unique name as specified by `arrayName`,
 * and with the initial value `startValue`.
 */
export async function createGlobalAppendOnlyArray(startValue, arrayName) {
  if (!Array.isArray(startValue)) {
    throw new TypeError("startValue must be an array");
  }

  const array = await SignalsWrapper.AppendOnlyArray(startValue, arrayName)

  const updateState = (state, arrayName, event) => {
    return SparkAutomergeWrapper.pushToArray(
      state,
      `Pushing ${event.newValues.length} new value(s) to array`,
      arrayName,
      event.newValues
    )
  }

  await GlobalSignal.createGlobalSignal(
    array,
    startValue,
    arrayName,
    guaranteeStateArray,
    updateState
  )

  return array
}
