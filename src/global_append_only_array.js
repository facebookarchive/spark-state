/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const GlobalSignal = require('./global_signal')
const SignalsWrapper = require('./signals_wrapper')
const SparkAutomergeWrapper = require('./spark_automerge_wrapper')
const Time = require('Time')
const INIT_COMMIT_MESSAGE = 'INIT_ARRAY_COMMIT_MESSAGE'

/**
 * Creates a new state with a globally unique name as specified by `arrayName`, and with the initial value set by `startValue`.
 *
 * If an array with a matching `arrayName` has already been defined, calling the method returns the existing array instead of creating a new one.
 *
 * This method should always be called before updating the counter if there is a chance that the counter has not been initialized.
 */

function guaranteeStateArray(state, arrayName, startValue) {
  return (Object.prototype.hasOwnProperty.call(state, arrayName)
    ? state
    : SparkAutomergeWrapper.initSignalScalar(INIT_COMMIT_MESSAGE, arrayName, startValue))
}

/**
 * Creates a new `GlobalAppendOnlyArray` object with a globally unique name as specified by `arrayName`, and with the initial value set by `startValue`.
 *
 * Append-only arrays only support new elements being added to the end of the array. Elements can't be inserted elsewhere in the array, or removed.
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
