var http = require('http');

process.on('message', function(msg) {

    clearInterval(daily);

    var getPrice = function() {

        var currentTime = new Date();
        var endTime = currentTime.toISOString();
        var oldTime = (currentTime - 10000);
        var startTime = new Date(oldTime).toISOString();
        /**
         * HOW TO Make an HTTP Call - GET
         */
        // options for GET
        var optionsget = {
            host : 'api.eia.gov', // here only the domain name
            // (no http/https !)
            // port : 443,
            path : '/series/?series_id=ELEC.PRICE.CA-RES.M&api_key=A2F4FC29C9B2CCF5106C80CFCFFA7430&num=1&out=json', // the rest of the url with parameters if needed (start=2014-11-16T12:00:00Z&end=2014-11-18T12:00:00Z)
            method : 'GET' // do GET
        };
         
        // console.info('Price Options prepared:');
        // console.info(optionsget);
        // console.info('Do the Price GET call');
         
        // do the GET request
        var reqGet = http.request(optionsget, function(res) {
            console.log("PRICE: statusCode: ", res.statusCode);
            // uncomment it for header details
            // console.log("headers: ", res.headers);
         
         
            res.on('data', function(d) {
                // console.info('GET PRICE result:\n');
                var j = JSON.parse(d);
                // console.info(j);
                // console.info('\n\nPrice Call completed');
                console.info("PRICE: " + j.series[0].data[0][1]);
                process.send(j.series[0].data[0]);
            });
         
        });
         
        reqGet.end();
        reqGet.on('error', function(e) {
            console.error(e);
        });
    }
    getPrice();
    var daily = setInterval(getPrice, 86400000);

});