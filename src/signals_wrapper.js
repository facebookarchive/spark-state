/**
 * Copyright (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 */

const Reactive = require('Reactive')

/**
 * Returns a `ScalarSignal` object that can be modified via calls to the `increment` or `decrement` methods.
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

  signal.set = function (val) {
    throw new Error ('The function `set` from GlobalCounterSignal is no longer supported. Use increment and decrement or GlobalScalarSignal instead.');
  }

  signal.increment = function (i) {
    signal.setValueAndUpdate(signal.pinLastValue() + i)
  }

  signal.decrement = function (i) {
    signal.setValueAndUpdate(signal.pinLastValue() - i)
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

/**
 * Returns a `ScalarSignal` object that can be modified via calls to the `set` method.
 */
export async function Scalar(startValue, signalName) {
  const source = Reactive.scalarSignalSource(signalName)
  source.set(startValue)
  const signal = source.signal

  signal.setValueOnly = function (val) {
    source.set(val);
  }

  signal.setValueAndUpdate = function (val) {
    const oldValue = signal.pinLastValue()
    source.set(val)
    signal.updateState({newValue : val, oldValue})
  }

  signal.set = signal.setValueAndUpdate

  return signal
}
