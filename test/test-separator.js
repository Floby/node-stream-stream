var util = require('util');
var stream = require('stream');
var SS = require('../');
var sink = require('./sink');

function EmitStream (array) {
    stream.Readable.call(this, {objectMode:true});
    this._source = array.slice();
}
util.inherits(EmitStream, stream.Readable);
EmitStream.prototype._read = function(size) {
    var chunk = this._source.shift();
    if(!chunk) this.push(null);

    var s = new stream.PassThrough();
    process.nextTick(function() {
        s.end(chunk);
    });
    this.push(s);
}

exports.testStreamSeparator = function(test) {
    var emitter = new EmitStream(['one', 'two', 'three']);
    var ss = SS({separator: '\n'});
    var s = sink();
    var done = false;
    var to = setTimeout(function() {
        if(!done) {
            test.fail('No end detected')
            test.done();
        }
    }, 500);

    emitter.pipe(ss).pipe(s).on('data', function(data) {
        test.equal(data, "one\ntwo\nthree", "Data in sink should be identical");
        done = true;
        test.done();
        clearTimeout(to);
    });

}

