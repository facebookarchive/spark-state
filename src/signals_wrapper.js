/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 */

const Reactive = require('Reactive')
const Enums = require('./enums')

const ARRAY_UPDATE = Enums.ARRAY_UPDATE
const SIGNAL_TYPE = Enums.SIGNAL_TYPE

/**
 * Returns a `ScalarSignal` object that can be modified via calls to the `increment` or `decrement` methods.
 */
export async function Counter(startValue, signalName) {
  const source = Reactive.scalarSignalSource(signalName)
  source.set(startValue)
  const signal = source.signal;

  signal.compareAndUpdateLocal = function(val) {
    if (signal.pinLastValue() !== val) {
      source.set(val)
    }
  }

  signal.setValueOnly = function (val) {
    source.set(val)
  }

  signal.setValueAndUpdate = function (val) {
    const oldValue = signal.pinLastValue();
    source.set(val)
    signal.updateState({ newValue: val, oldValue })
  }

  signal.set = function (val) {
    throw new Error ('The function `set` from GlobalCounterSignal is no longer supported. Use increment and decrement or GlobalScalarSignal instead.');
  }

  signal.increment = function (i) {
    signal.setValueAndUpdate(signal.pinLastValue() + i)
  }

  signal.decrement = function (i) {
    signal.setValueAndUpdate(signal.pinLastValue() - i)
  }

  signal.getSignalType = function () {
    return SIGNAL_TYPE.COUNTER
  }

  return signal
}

/**
 * Returns a `StringSignal` object that can be modified via calls to the `set` method.
 */
export async function String(startValue, signalName) {
  const source = Reactive.stringSignalSource(signalName);
  source.set(startValue);
  const signal = source.signal;

  signal.compareAndUpdateLocal = function(val) {
    if (signal.pinLastValue() !== val) {
      source.set(val)
    }
  }

  signal.setValueOnly = function (val) {
    source.set(val)
  }

  signal.setValueAndUpdate = function (val) {
    const oldValue = signal.pinLastValue();
    source.set(val)
    signal.updateState({ newValue: val, oldValue })
  }

  signal.getSignalType = function () {
    return SIGNAL_TYPE.STRING
  }

  signal.set = signal.setValueAndUpdate;

  return signal
}

/**
 * Returns a `ScalarSignal` object that can be modified via calls to the `set` method.
 */
export async function Scalar(startValue, signalName) {
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

  signal.getSignalType = function () {
    return SIGNAL_TYPE.SCALAR
  }

  signal.set = signal.setValueAndUpdate

  return signal
}

/**
 * Returns an append-only `Array` object that can be modified via calls to the
 * pushContent method
 */
export async function Array(startValue, arrayName) {
  let array = startValue
  let pendingChanges = []

  let isSynced = Reactive.boolSignalSource(arrayName)
  isSynced.set(false)
  array.setIsSynced = function (newSyncValue) {
    isSynced.set(newSyncValue)
  }

  array.isSyncedSignal = isSynced.signal

  array.isSyncedSignal.onOn().subscribe(
    event => {
      if (event.newValue) {
        if (pendingChanges.length > 0) {
          array.updateState({
            updateType: ARRAY_UPDATE.BATCHED,
            batchedChanges: pendingChanges.slice()
          })
          let change = pendingChanges.shift()
          while (change) {
            array.push(change.newValue)
            change = pendingChanges.shift()
          }
        }
      }
  })

  array.getSignalType = function () {
    return SIGNAL_TYPE.ARRAY
  }

  array.compareAndUpdateLocal = function (newArray) {
    const currentLength = array.length
    const newLength = newArray.length
    let i
    for (i = 0; i < currentLength && i < newLength; i++) {
      array[i] = newArray[i]
    }
    if (newLength > currentLength) {
      for (let j = i; j < newArray.length; j++) {
        array.push(newArray[j])
      }
    } else if (newLength < currentLength && newLength != 0) {
      array.splice(i, currentLength - newLength)
    }
  }

  array.pushContent = function (newValue) {
    if (array.isSyncedSignal.pinLastValue()) {
      array.push(newValue)
      array.updateState({newValue, updateType: ARRAY_UPDATE.APPEND})
    } else {
      pendingChanges.push({newValue, updateType: ARRAY_UPDATE.APPEND})
    }
  }

  return array
}
