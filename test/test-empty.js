var SS = require('../');
var Sink = require('./sink');


exports.testEmpty = function(test) {
    var ss = SS();
    var finished = false;
    ss.pipe(Sink()).on('data', function(data) {
        test.equal(data, '', "There should be no data");
        finished = true;
        test.done();
    });

    setTimeout(function() {
        if(!finished) {
            test.fail('No end detected');
            test.done();
        }
    }, 10);

    ss.end();
}
