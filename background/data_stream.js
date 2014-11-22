var https = require('https');

process.on('message', function(msg) {

    setInterval(function() {
        /**
         * HOW TO Make an HTTP Call - GET
         */
        // options for GET
        var optionsget = {
            host : 'api-m2x.att.com', // here only the domain name
            // (no http/https !)
            port : 443,
            path : '/v1/feeds/eb490911a6841dc667afffe26949f366/streams/power/values?start=2014-11-16T12:00:00Z&end=2014-11-18T12:00:00Z&limit=3&pretty"', // the rest of the url with parameters if needed
            method : 'GET', // do GET
            headers: {'X-M2X-KEY' : '5b526fd341164a34b98ff576f7e2cbc9'}
        };
         
        console.info('Options prepared:');
        console.info(optionsget);
        console.info('Do the GET call');
         
        // do the GET request
        var reqGet = https.request(optionsget, function(res) {
            console.log("statusCode: ", res.statusCode);
            // uncomment it for header details
        //  console.log("headers: ", res.headers);
         
         
            res.on('data', function(d) {
                console.info('GET result:\n');
                var j = JSON.parse(d);
                console.info(j);
                console.info('\n\nCall completed');
                process.send(j);
            });
         
        });
         
        reqGet.end();
        reqGet.on('error', function(e) {
            console.error(e);
        });
    }, 10000);

});