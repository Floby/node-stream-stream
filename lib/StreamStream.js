var util = require('util');
var stream = require('stream');

function StreamStream (options) {
    // use without new
    if(!(this instanceof StreamStream)) return new StreamStream(options);

    this._output = new stream.PassThrough();
    this._queue = [];

    // super
    stream.Duplex.call(this, options);
    options = options || {};

    if(options) {
        this._separator = options.separator;
    }

    this._readableState.objectMode = options.objectMode;
    this._writableState.objectMode = true;

    this.on('finish', function() {
        this._ending = true;
        var last = this._last();
        var self = this;
        if (last) {
            last.once('end', _end.bind(this));
        }
        else {
            _end.call(this);
        }
    });
}
util.inherits(StreamStream, stream.Duplex);

function _end () {
    this._ended = true;
    this._output.end();
    this.read(0);
}

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

StreamStream.prototype._write = function _write(stream, encoding, callback) {
    var length = this._queue.push(stream);
    if(length == 1) {
        this._startStream(stream);
    }
    callback();
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

        if(this._separator && (this._queue.length > 1)) {
            try {
                this._output.write(this._separator);
            } catch(e) {
                console.log('error in sep', e);
            }
        }

        var first = this._first();
        if(first) {
            this._startStream(first);
        }
    }.bind(this));

    stream.pipe(this._output, { end: false });
    this.read(0);
};

/*
StreamStream.prototype.end = function end(stream, encoding, callback) {
    if(stream) this.write(stream, encoding, callback);
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
*/

StreamStream.prototype._last = function _last() {
    if(this._queue.length == 0) return null;
    return this._queue[this._queue.length - 1];
};

StreamStream.prototype._first = function _first() {
    return this._queue[0];
};

module.exports = StreamStream;
