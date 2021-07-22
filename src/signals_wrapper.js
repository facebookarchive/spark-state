/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 */

const Reactive = require('Reactive')

/**
 * Returns an `ScalarSignal` object that can be modified with
 * `set` `increment` and `decrement` functions
 */
export async function Counter(startValue, signalName) {
  const source = Reactive.scalarSignalSource(signalName)
  source.set(startValue)
  const signal = source.signal;

  signal.setValueOnly = function (val) {
    source.set(val)
  }

  signal.setValueAndUpdate = function (val) {
    const oldValue = signal.pinLastValue();
    source.set(val)
    signal.updateState({ newValue: val, oldValue })
  }

  signal.set = signal.setValueAndUpdate;

  signal.increment = function (i) {
    signal.setValueAndUpdate(signal.pinLastValue() + i)
  }

  signal.decrement = function (i) {
    signal.setValueAndUpdate(signal.pinLastValue() - i)
  }

  return signal
}

/**
 * Creates an StringSignal object that can be modified with
 * `set` function
 */
export async function String(startValue, signalName) {
  const source = Reactive.stringSignalSource(signalName);
  source.set(startValue);
  const signal = source.signal;

  signal.setValueOnly = function (val) {
    source.set(val)
  }

  signal.setValueAndUpdate = function (val) {
    const oldValue = signal.pinLastValue();
    source.set(val)
    signal.updateState({ newValue: val, oldValue })
  }

  signal.set = signal.setValueAndUpdate;

  return signal
}
