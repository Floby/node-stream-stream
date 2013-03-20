var util = require('util');
var stream = require('stream');

function StreamStream (options) {
    // use without new
    if(!(this instanceof StreamStream)) return new StreamStream(options);

    this._output = new stream.PassThrough();
    this._queue = [];

    // super
    stream.Readable.call(this, options);
}
util.inherits(StreamStream, stream.Readable);

StreamStream.prototype._read = function _read(size) {
    var data = this._output.read(size);
    var res;
    if(data === null) {
        if(this._ended) res = this.push(null);
        else res = this.push('');
    }
    else {
        res = this.push(data);
    }

    if(res === false) {
        // STOP READING
    }
};

StreamStream.prototype.write = function write(stream) {
    var length = this._queue.push(stream);
    if(length == 1) {
        this._startStream(stream);
    }
};

StreamStream.prototype._startStream = function _startStream(stream) {
    if(stream !== this._first()) {
        throw new Error('Unexpected stream to start up');
    }
    stream.once('end', function() {
        if(stream !== this._first()) {
            throw new Error('Unexpected stream to remove from the queue');
        }
        this._queue.shift();
        var first = this._first();
        if(first) {
            this._startStream(first);
        }
    }.bind(this));

    stream.pipe(this._output, { end: false });
    this.read(0);
};

StreamStream.prototype.end = function end(stream) {
    if(stream) this.write(stream);
    this._ending = true;
    var last = this._last();
    if(last) {
        last.once('end', this._end.bind(this));
    }
    else {
        this._end();
    }
};

StreamStream.prototype._end = function _end() {
    this._ending = true;
    this._ended = true;
    this._output.end();
    this.read(0);
};


StreamStream.prototype._last = function _last() {
    if(this._queue.length == 0) return null;
    return this._queue[this._queue.length - 1];
};

StreamStream.prototype._first = function _first() {
    return this._queue[0];
};

module.exports = StreamStream;

