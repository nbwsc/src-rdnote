# liner 

一个简单的流模块,可提供按行读取

## eg.
```
var fs = require('fs')
var liner = require('./liner')
var source = fs.createReadStream('./your_log_file')
source.pipe(liner)
liner.on('readable', function () {
  var line
  while (line = liner.read()) {
    // do something with line
  }
})
liner.on('end',function(){
	// do something after end event
})
```

### node offical 

|Use-case | Class | Method(s) to implement
|---|---|---
|Reading only | Readable | _read
|Writing only | Writable | _write, _writev
|Reading and writing | Duplex | _read, _write, _writev
|Operate on written data, then read the result | Transform | _transform, _flush

	



打开 objectMode
吼吼，这个 {objectMode: true} 是个啥？如果没有这个 objectMode，stream 默认把纯数据块送过来，否则会把数据快放到一个 object 中，当然这个 object 中还会包含其他信息。

_transform 方法
这只是一个开始，我们继续。Transform 类在应用时需要我们必须提供一个叫做 _transform 的方法，还有一个 _flush 方法可以选择提供。我们先来看一下这个 _transform 方法到底是什么。

_transform 方法在每次 stream 中有数据来了之后都会被执行，先看代码：

liner._transform = function (chunk, encoding, done) {
  var data = chunk.toString()
  if (this._lastLineData) data = this._lastLineData + data 

  var lines = data.split('\n') 
  this._lastLineData = lines.splice(lines.length-1,1)[0] 

  lines.forEach(this.push.bind(this)) 
  done()
}
数据一来，_transform 方法就会被执行。联同数据一起过来的还有数据的编码和一个表示此数据已经接受完毕的信号函数。

在这个问题中，我们并不关心编码问题。通过 toString() 把数据转为需要的字符串，然后再通过 split('\n') 数据块字符串按换行符打散为一个数组。然后在把每一行 push 到对应的处理模块中。

注：push 方法是 Readable stream 类的内置方法，同时在 Node 0.8 版本中和产生 data 时间的的方法是同类的：

stream.emit(‘data’, data) ➤ stream.push(data)
最后通过调用 done() 方法来发出接受完成的信号。由于 done 方法是一个回调函数，我们也可以把它在 _transform 中进行异步调用。

代码中的 _lastLineData 又是神马？在 stream 中我们并不想一块数据的结尾是从一行的中间断开的，为了解决这个问题，我们实际上并不会吧打散的数组中的最后一行送出去，而是留到下一次的数据块来的时候放到下一次数据块的开头。

_flush 方法
然后我们再来看看这个 _flulsh 方法，还记得在 _transform 方法中每次 _lastLineData 的值都不会被送出去吗，是不是最后一次数据块的 _lastLindeData 就没法收到了？没错， _flush方法就是用来处理这种情况的。在所有的数据块都被 _transform 方法处理过后，才会调用 _flush 方法。所以它的作用就是处理残留数据的：

liner._flush = function (done) {
  if (this._lastLineData) this.push(this._lastLineData)
  this._lastLineData = null
  done()
}
如果有 _lastLineData 则把它 push 出去然后清空它，最后调用 ｀done()` 方法标志着完成处理残留数据的工作，同时这也意味着 stream 的结束。需要注意的是， _flush 方法并不是必须的有些场景下就不需要。