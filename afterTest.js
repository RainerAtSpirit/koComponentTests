var fs = require('fs'),
    request = require('request'),
    _ = require('lodash'),
    xml2js = require('xml2js'),
    glob = require('glob');

var files = glob.sync('./Chrome*.xml');
var parser = new xml2js.Parser();

fs.readFile(files[0], function( err, data ) {

    parser.parseString(data, function( err, result ) {
        if ( err ) {
            return;
        }

        var map = {
            'testName': '',
            'testFramework': 'karma',
            'fileName': '',
            'outcome': 'Passed',
            'durationMilliseconds': '',
            'ErrorMessage': '',
            'ErrorStackTrace': '',
            'StdOut': '',
            'StdErr': ''
        };

        var appVeyorTestBatch = _.map(result.testsuite.testcase, function( test ) {

            var testCase = _.extend({}, map, {
                testName: test.$['classname'] + ' ' + test.$.name,
                durationMilliseconds: (parseFloat(test.$.time, 10) * 1000).toString()
            });

            if ( test.failure ) {

                testCase.outcome = 'Failed';
                testCase.ErrorMessage = _.pluck(test.failure, '_').join('\n');

            }

        });

        request.post('/api/test',
            {
                json: appVeyorTestBatch
            },
            function( error, response, body ) {
                if ( !error && response.statusCode == 200 ) {
                    console.log(body)
                }
            }
        );

    });

});


