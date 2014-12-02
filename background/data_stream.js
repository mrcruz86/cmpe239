var https = require('https');

process.on('message', function(msg) {

    // clearInterval(stream);
    var feedDate;

    var getData = function() {

        var currentTime = new Date();
        var endTime = currentTime.toISOString();
        var oldTime = (currentTime - 10000);
        var startTime = new Date(oldTime).toISOString();
        /**
         * HOW TO Make an HTTP Call - GET
         */
        // options for GET
        var optionsget = {
            host : 'api-m2x.att.com', // here only the domain name
            // (no http/https !)
            port : 443,
            path : '/v1/feeds/eb490911a6841dc667afffe26949f366/streams/power/values?start=' + startTime + '&end=' + endTime + '&limit=1&pretty"', // the rest of the url with parameters if needed (start=2014-11-16T12:00:00Z&end=2014-11-18T12:00:00Z)
            method : 'GET', // do GET
            headers: {'X-M2X-KEY' : '5b526fd341164a34b98ff576f7e2cbc9'}
        };
         
        // console.info('Options prepared:');
        // console.info(optionsget);
        // console.info('Do the GET call');
         
        // do the GET request
        var reqGet = https.request(optionsget, function(res) {
            console.log("DATA: statusCode: ", res.statusCode);
            // uncomment it for header details
        //  console.log("headers: ", res.headers);
         
         
            res.on('data', function(d) {
                // console.info('GET result:\n');
                var j = JSON.parse(d);
                // console.info(j);
                // console.info('\n\nCall completed');
                if (j.values.length == 0) {
                    j.values.push({'at' : endTime, 'value' : 0});
                    // console.info("in empty value");
                }
                console.info("DATA: " + JSON.stringify(j.values[0]));
                if (feedDate != j.values[0].at.toString()) {
                    process.send(j);
                }
                
                feedDate = new Date(j.values[0].at).toString();
                
            });
         
        });
         
        reqGet.end();
        reqGet.on('error', function(e) {
            console.error(e);
        });
    }
    getData();
    var stream = setInterval(getData, 10000);

});