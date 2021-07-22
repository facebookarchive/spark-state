# Spark State
Spark State introduces a solution to manage effects states by creating globally synchronized data signals on the JS scripting. 


## Geting starting
1. Make sure your Spark AR Studio is at least v128
1. Open your project in Spark AR Studio
1. Open AR Library from Assets Panel
1. Go to "Script Packages" Tab
1. Import "spark-state" package to your project
1. Open your script.js
1. import the module by `const State = require(spark-state)`
1. Add capability of "Scripting Writeable Signal Source" to your project.
1. For now, you also need to import multipeer module and participants module in your script. 
   ```
   const Multipeer = require('Multipeer')
   const Participants = require('Participants')
   ```
   This is because the spark-state uses multipeer and participants capabilities, you need to manually add these two capabilities into your project.


## Documentation

### Global Counter

The global counter signal is a wrapper of a [`ScalarSignal`](https://sparkar.facebook.com/ar-studio/learn/reference/classes/reactivemodule.scalarsignal/#example) therefore, it is possible to subscribe
to a global counter, and it has all method as [`ScalarSignal`](https://sparkar.facebook.com/ar-studio/learn/reference/classes/reactivemodule.scalarsignal/#example). 

<table>
    <thead>
        <ts>
            <th colspan=2>Initialize</th>
        </ts>
    </thead>
    <thead>
        <ts>
            <th>Method</th>
            <th>Description</th>
        </ts>
    </thead>
    <tbody>
        <ts>
            <td><code> createCounterGlobalSignal(startValue, signalName): GlobalCounterSignal </code></td>
            <td> Creates a <code>GlobalCounterSignal</code> signal set on the <code>startValue</code> with a global uniquely referenced name as <code>signalName</code>. </td>
        </ts>
    </tbody>
</table>


<table>
    <thead>
        <ts>
            <th colspan=2> Read/Write </th>
        </ts>
    </thead>
    <thead>
        <ts>
            <th> Method </th>
            <th> Description </th>
        </ts>
    </thead>
    <tbody>
        <ts>
            <td><code>GlobalCounterSignal extends ScalarSignal</code> </td>
            <td> All existing functions on <code>ScalarSignal</code> can be invoked on <code>GlobalCounterSignal</code> </td>
        </ts>
    </tbody>
    <tbody>
        <ts>
            <td><code> GlobalCounterSignal.increment(i) </code></td>
            <td> Adds the integer <code>i</code> to the value of the counter. </td>
        </ts>
    </tbody>
    <tbody>
        <ts>
            <td><code>GlobalCounterSignal.decrement(i)</code></td>
            <td> Subtracts the integer <code>i</code> to the value of the counter. </td>
        </ts>
    </tbody>
    <tbody>
        <ts>
            <td><code>GlobalCounterSignal.set(val)</code></td>
            <td> Set the number <code>val</code> to the value of the counter. </td>
        </ts>
    </tbody>
</table>


### Global Counter

The global counter signal is a wrapper of a [`StringSignal`](https://sparkar.facebook.com/ar-studio/learn/reference/classes/reactivemodule.stringsignal/#example) therefore, it is possible to subscribe
to a global counter, and it has all method as [`ScalarSignal`](https://sparkar.facebook.com/ar-studio/learn/reference/classes/reactivemodule.stringsignal/#example). 

<table>
    <thead>
        <ts>
            <th colspan=2>Initialize</th>
        </ts>
    </thead>
    <thead>
        <ts>
            <th>Method</th>
            <th>Description</th>
        </ts>
    </thead>
    <tbody>
        <ts>
            <td><code> createStringGlobalSignal(startValue, signalName): GlobalStringSignal </code></td>
            <td> Creates a <code>GlobalStringSignal</code> signal set on the <code>startValue</code> with a global uniquely referenced name as <code>signalName</code>. </td>
        </ts>
    </tbody>
</table>


<table>
    <thead>
        <ts>
            <th colspan=2> Read/Write </th>
        </ts>
    </thead>
    <thead>
        <ts>
            <th> Method </th>
            <th> Description </th>
        </ts>
    </thead>
    <tbody>
        <ts>
            <td><code>GlobalStringSignal extends StringSignal</code> </td>
            <td> All existing functions on <code>StringSignal</code> can be invoked on <code>GlobalStringSignal</code> </td>
        </ts>
    </tbody>
    <tbody>
        <ts>
            <td><code>GlobalStringSignal.set(val)</code></td>
            <td> Set the string <code>val</code> to the value of the signal. </td>
        </ts>
    </tbody>
</table>

### Global Peers Map

The global peers map is a key value data type which has all participant ids as keys and their global signals as values. Currently it supports both `GlobalCounterSignal` and `GlobalStringSignal` as its value type.

<table>
    <thead>
        <ts>
            <th colspan=2>Initialize</th>
        </ts>
    </thead>
    <thead>
        <ts>
            <th>Method</th>
            <th>Description</th>
        </ts>
    </thead>
    <tbody>
        <ts>
            <td><code> createPeersMapGlobal(startValue, signalName): GlobalPeersMap</code></td>
            <td> Creates a <code>GlobalPeersMap</code> signal set on the <code>startValue</code> with a global uniquely referenced name as <code>signalName</code>.</td>
        </ts>
    </tbody>
</table>


<table>
    <thead>
        <ts>
            <th colspan=2> Read/Write </th>
        </ts>
    </thead>
    <thead>
        <ts>
            <th> Method </th>
            <th> Description </th>
        </ts>
    </thead>
    <tbody>
        <ts>
            <td><code>GlobalPeersMap.get(participantId)</code> </td>
            <td> Get <code>GlobalCounterSignal</code> or <code>GlobalStringSignal</code> by <code>participantId</code> </td>
        </ts>
    </tbody>
    <tbody>
        <ts>
            <td><code>GlobalPeersMap.set(participantId, value)</code> </td>
            <td> Set <code>GlobalCounterSignal</code> or <code>GlobalStringSignal</code> for <code>participantId</code> with new <code>value</code> </td>
        </ts>
    </tbody>
    <tbody>
        <ts>
            <td><code>GlobalPeersMap.keys()</code> </td>
            <td> Get all keys (participantIds) in the <code>GlobalPeersMap</code></td>
        </ts>
    </tbody>
    <tbody>
        <ts>
            <td><code>GlobalPeersMap.setOnNewPeerCallback(callback)</code> </td>
            <td> Set a <code>callback</code> function when a new peer is added to the peers map</td>
        </ts>
    </tbody>
</table>

## sample code
The sample code, defined on [`script.js`](https://github.com/facebookincubator/spark-state/blob/main/src/script.js), demonstrates usages of all three global signal types supported by the library so far.

## Development

### Run Test

```
$ npm test
```

### Run Tests

```
$ npm run test
```

### Run Linter

- Run normally:
  ```
  $ npm run lint
  ```

- Run on fix mode:
  ```
  $ npm run lint-fix
  ```

### License

spark-state is [MIT licensed](./LICENSE).