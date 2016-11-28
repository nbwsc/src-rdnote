var stream = require('stream')
/*
	stream {
		Source:readable,				|
		Tranform:readable & writeable,	|data flows through pipline
		Destination:writeable			↓
	}


	打开 objectMode.如果没有这个 objectMode，stream 默认把纯数据块送过来，
	否则会把数据快放到一个 object 中，当然这个 object 中还会包含其他信息。


*/
var liner = new stream.Transform( { objectMode: true } )

/*
	Transform 类在应用时需要我们必须提供一个叫做 _transform 的方法，
	还有一个 _flush 方法可以选择提供。

	_transform 方法在每次 stream 中有数据来了之后都会被执行
*/
liner._transform = function (chunk, encoding, done) {
  var data = chunk.toString()
  if (this._lastLineData) data = this._lastLineData + data

  var lines = data.split('\n')

/*
	获得最后一个字符赋值_lastLineData并删除
*/
  this._lastLineData = lines.splice(lines.length-1,1)[0]

  lines.forEach(this.push.bind(this))
  done()
}

liner._flush = function (done) {
     if (this._lastLineData) this.push(this._lastLineData)
     this._lastLineData = null
     done()
}

module.exports = liner
