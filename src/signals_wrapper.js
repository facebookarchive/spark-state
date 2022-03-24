/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 */

const Reactive = require('Reactive')
const Time = require('Time')

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

  signal.setReceivedAllValues = function (val) {}

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

  signal.setReceivedAllValues = function (val) {}

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

  signal.setReceivedAllValues = function (val) {}

  signal.set = signal.setValueAndUpdate

  return signal
}

/**
 * Returns an append-only `Array` object that can be modified via calls to the
 * push method.
 */
export async function AppendOnlyArray(startValue, arrayName) {
  let arrayWrapper = {}
  let localArray = startValue
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
