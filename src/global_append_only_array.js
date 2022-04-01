/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

const GlobalSignal = require('./global_signal')
const SparkAutomergeWrapper = require('./spark_automerge_wrapper')
const Time = require('Time')
const Reactive = require('Reactive')
const INIT_COMMIT_MESSAGE = 'INIT_ARRAY_COMMIT_MESSAGE'

/**
 * Returns an append-only `Array` object that can be modified via calls to the
 * push method.
 */
export async function AppendOnlyArray(startValue, arrayName) {
  let arrayWrapper = {}
  let localArray = startValue.slice()
  let localChangesQueue = []

  let receivedAllValues = Reactive.boolSignalSource(`${arrayName}_receivedAllValues`)
  receivedAllValues.set(false)

  receivedAllValues.signal.onOn().subscribe(
    event => {
      if (event.newValue) {
        if (localChangesQueue.length > 0) {
          receivedAllValues.set(false)
          arrayWrapper.updateState({
            newValues: localChangesQueue.slice()
          })
          localArray.push(...localChangesQueue)
          localChangesQueue = []
          Time.setTimeout(() => {
            receivedAllValues.set(true)
          }, 50)
        }
      }
  })

  arrayWrapper.setReceivedAllValues = function (newValue) {
    receivedAllValues.set(newValue)
  }

  arrayWrapper.receivedAllValuesSignal = receivedAllValues.signal

  arrayWrapper.compareAndUpdateLocal = function (newArray) {
    const currentLength = localArray.length
    const newLength = newArray.length
    let i
    for (i = 0; i < currentLength && i < newLength; i++) {
      localArray[i] = newArray[i]
    }
    if (newLength > currentLength) {
      for (let j = i; j < newArray.length; j++) {
        localArray.push(newArray[j])
      }
    } else if (newLength < currentLength && newLength != 0) {
      localArray.splice(i, currentLength - newLength)
    }
  }

  // Pushes the new value when the global array is synchronised with at least one peer
  arrayWrapper.push = function (newValue) {
    if (receivedAllValues.signal.pinLastValue()) {
      receivedAllValues.set(false)
      localArray.push(newValue)
      arrayWrapper.updateState({newValues: [newValue]})
      Time.setTimeout(() => {
        receivedAllValues.set(true)
      }, 50)
    } else {
      localChangesQueue.push(newValue)
    }
  }

  // Returns a copy with the current elements of the array
  arrayWrapper.getSnapshot = function (index) {
    return localArray.slice()
  }

  arrayWrapper.length = function () {
    return localArray.length
  }

  arrayWrapper.get = function (index) {
    return localArray[index]
  }

  return arrayWrapper
}

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

  const array = await AppendOnlyArray(startValue, arrayName)

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
