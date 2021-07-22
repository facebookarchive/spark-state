/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

/* eslint-disable no-unexpected-multiline */
/* eslint-disable func-call-spacing */

//= =============================================================================
// Welcome to scripting in Spark AR Studio! Helpful links:
//
// Scripting Basics - https://fb.me/spark-scripting-basics
// Reactive Programming - https://fb.me/spark-reactive-programming
// Scripting Object Reference - https://fb.me/spark-scripting-reference
// Changelogs - https://fb.me/spark-changelog
//
// For projects created with v87 onwards, JavaScript is always executed in strict mode.
//= =============================================================================

// How to load in modules
const Scene = require('Scene')
const State = require('spark-state')
const Reactive = require('Reactive')
const Participants = require('Participants')
const TouchGestures = require('TouchGestures');

(async function () { // Enables async/await in JS [part 1]
  const [counterText] = await Promise.all([
    Scene.root.findFirst('counterText')
  ])

  // Create a global counter variable as a local signal
  const incrementCounterVal = await State.createCounterGlobalSignal(0, 'incrementCounterVal')
  const decrementCounterVal = await State.createCounterGlobalSignal(0, 'decrementCounterVal')

  // When global counter (local signal) changes, update the counter text box
  counterText.text = Reactive.val('Counters: ').concat(incrementCounterVal.toString()).concat(' | ').concat(decrementCounterVal.toString())

  // When the current participant tap the screen,
  // increase/decrease the global counter by updating the local signal
  TouchGestures.onTap().subscribe((gesture) => {
    incrementCounterVal.increment(1)
    decrementCounterVal.decrement(2)
  })

  // COUNTERS MAP
  const [peersPointsText] = await Promise.all([
    Scene.root.findFirst('peersPointsText')
  ])
  // Create a global map with peer's ids each one associated to counter set in 0
  const peersPoints = await State.createPeersMapGlobal(0, 'points')

  let text = await formatPeersMap(peersPoints, '- Participants Ponints -', (value) => value.toString())
  peersPointsText.text = text

  const myParticipantId = (await Participants.self).id
  // When the current participant tap the screen,
  // increase the global counter asociated with its key
  TouchGestures.onTap().subscribe(async (gesture) => {
    const myCounter = (await peersPoints.get(myParticipantId))
    myCounter.increment(1)
  })

  // When there is a new peer in the call,
  // show its counter on the screen
  peersPoints.setOnNewPeerCallback((peerId) => {
    text = updatePeersMap(text, peersPoints, peerId, (value) => value.toString())
    peersPointsText.text = text
  })

  // STRINGS MAP
  const [peersAnimalsText] = await Promise.all([
    Scene.root.findFirst('peersAnimalsText')
  ])
  const animalList = ['dog', 'cat', 'frog', 'duck']
  let nextAnimalPosition = 0
  // Create a global map with peer's ids each one associated to counter set in 0
  const peersAnimals = await State.createPeersMapGlobal(animalList[nextAnimalPosition], 'animals')

  let animalsText = await formatPeersMap(peersAnimals, '- Participants Animals -')
  peersAnimalsText.text = animalsText
  // When the current participant tap the screen,
  // increase the global counter asociated with its key
  TouchGestures.onTap().subscribe(async (gesture) => {
    nextAnimalPosition = (nextAnimalPosition + 1) % animalList.length
    await peersAnimals.set(myParticipantId, animalList[nextAnimalPosition])
  })

  // When there is a new peer in the call,
  // show its counter on the screen
  peersAnimals.setOnNewPeerCallback((peerId) => {
    animalsText = updatePeersMap(animalsText, peersAnimals, peerId)
    peersAnimalsText.text = animalsText
  })

  // STRING
  const INITAL_VALUE = (id) => `- String test ${id} -\n`
  const [stringText1, stringText2] = await Promise.all([
    Scene.root.findFirst('stringText1'),
    Scene.root.findFirst('stringText2')
  ])

  const stringGlobalSignal1 = await State.createStringGlobalSignal(INITAL_VALUE(1), 'stringSignal1')
  const stringGlobalSignal2 = await State.createStringGlobalSignal(INITAL_VALUE(2), 'stringSignal2')

  stringText1.text = stringGlobalSignal1
  stringText2.text = stringGlobalSignal2

  TouchGestures.onTap().subscribe(async (gesture) => {
    stringGlobalSignal1.concat('concatenating 1 ')
  })
  TouchGestures.onTap().subscribe(async (gesture) => {
    stringGlobalSignal2.concat('concatenating 2 ')
  })

  TouchGestures.onLongPress().subscribe(async (gesture) => {
    stringGlobalSignal1.set(INITAL_VALUE(1))
  })
  TouchGestures.onLongPress().subscribe(async (gesture) => {
    stringGlobalSignal2.set(INITAL_VALUE(2))
  })
})() // Enables async/await in JS [part 2]

async function formatPeersMap(peersMap, title, toStringSignal) {
  // When map values (local signal) changes, update the counter text box
  let text = Reactive.val(title)
  for (const key of await peersMap.keys()) {
    text = text.concat(`\n${key}: `).concat(toStringSignal ? toStringSignal(peersMap[key]) : peersMap[key])
  }
  return text
}

function updatePeersMap(text, peersMap, peerId, toStringSignal) {
  return text.concat(`\n${peerId}: `).concat(toStringSignal ? toStringSignal(peersMap[peerId]) : peersMap[peerId])
}
