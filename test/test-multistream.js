var stream = require('stream');
var SS = require('../');
var sink = require('stream-sink');

exports.testMultiSync = function(test) {
    var a = new stream.PassThrough();
    var b = new stream.PassThrough();
    var c = new stream.PassThrough();
    var ss = SS()
    var done = false;
    ss.pipe(sink()).on('data', function(data) {
        done = true;
        clearTimeout(to);
        test.equal('hello world!', data, "Data in sink should be identical");
        test.done();
    });

    ss.write(a);
    a.end('hello');
    b.end(' world');
    ss.write(b);
    ss.end(c);
    c.end('!');
    
    var to = setTimeout(function(){
        if(!done) {
            test.fail('no end detected');
            test.done();
        }
    }, 20)
}


exports.testMultiAsync = function(test) {
    var a = new stream.PassThrough();
    var b = new stream.PassThrough();
    var c = new stream.PassThrough();
    var ss = SS()
    var done = false;
    ss.pipe(sink()).on('data', function(data) {
        done = true;
        test.equal('hello world!', data, "Data in sink should be identical");
        clearTimeout(to);
        test.done();
    });

    ss.write(a);
    ss.write(b);

    setTimeout(function() {
        a.write('hello');
    }, 10)
    setTimeout(function() {
        b.write(' world');
    }, 20);
    setTimeout(function() {
        a.end();
    }, 30);
    setTimeout(function() {
        b.end();
    }, 40)
    setTimeout(function() {
        ss.end(c);
    }, 50)
    setTimeout(function() {
        c.end('!');
    })
    
    var to = setTimeout(function(){
        if(!done) {
            test.fail('no end detected');
            test.done();
        }
    }, 1000)
}

