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
        var separator = options.separator;
        switch(typeof separator) {
            // if the separator is a constant value
            // we make it a function to be treated in the
            // next case
            case 'string':
                var val = separator;
                separator = function(cb) {
                    process.nextTick(function() {
                        cb(val);
                    })
                }
            // make this._separator() always return
            // a stream filled with the results of the callback
            // if the reset is a stream, pipe it as separator
            case 'function':
                var fn = separator;
                separator = function() {
                    var ps = new stream.PassThrough();
                    ps._isSeparator = true;
                    fn(function(res) {
                        if(res.readable)
                            res.pipe(ps);
                        else 
                            ps.end(res);
                    });
                    return ps;
                }
                break;
            default:
                separator = null;
                break;
        }
        this._separator = separator;
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

    this._hadFirstStream = false;
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

/**
 * Start processing a stream from the queue
 * the given stream MUST be the first in the queue
 * @param stream
 */
StreamStream.prototype._startStream = function _startStream(stream) {
    if(stream !== this._first()) {
        return this.emit('error', new Error('Unexpected stream to start up'));
    }

    if(this._separator 
        && !stream._isSeparator 
        && this._hadFirstStream
        && !stream._separated
    ) {
        var sep = this._separator();
        // push the separator stream in front of the queue
        this._queue.unshift(sep);
        stream._separated = true;
        return this._startStream(sep);
    }

    stream.once('end', function() {
        if(stream !== this._first()) {
            return this.emit('error',
                new Error('Unexpected stream to remove from the queue'));
        }
        this._queue.shift();
        var first = this._first();
        if(first) {
            this._startStream(first);
        }
    }.bind(this));

    stream.pipe(this._output, { end: false });
    this._hadFirstStream = true;
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

