var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var childProcess = require("child_process");

// Fork background process
var dataStream = childProcess.fork("./background/data_stream");
var utilPrice = childProcess.fork("./background/util_price");

// Set global variables
// Array for last hour for graph
var hour = [];

// Current Value
var current = 0;
var currentPrice = 0;
var currentCost = 0;

// Day's total
var dayTotal = 0;
var dayTotalCost = 0;

// Week's Total
var weekTotal = 0;
var weekTotalCost = 0;

// Month's Total
var monthTotal;
var monthTotalCost;

// Average Variables
var oldDateValue;

var sun = {
	"sunCount" : 0,
	"sunTotal" : 0,
	"sunAverage" : 0,
	"mornAverage" : 0,
	"noonAverage" : 0,
	"eveningAverage" : 0,
	"lateAverage": 0 };
var mon = {
	"monCount" : 0,
	"monTotal" : 0,
	"monAverage" : 0,
	"mornAverage" : 0,
	"noonAverage" : 0,
	"eveningAverage" : 0,
	"lateAverage": 0 };
var tue = {
	"tueCount" : 0,
	"tueTotal" : 0,
	"tueAverage" : 0,
	"mornAverage" : 0,
	"noonAverage" : 0,
	"eveningAverage" : 0,
	"lateAverage": 0 };
var wed = {
	"wedCount" : 0,
	"wedTotal" : 0,
	"wedAverage" : 0,
	"mornAverage" : 0,
	"noonAverage" : 0,
	"eveningAverage" : 0,
	"lateAverage": 0 };
var thur ={
	"thurCount" : 0,
	"thurTotal" : 0,
	"thurAverage" : 0,
	"mornAverage" : 0,
	"noonAverage" : 0,
	"eveningAverage" : 0,
	"lateAverage": 0 };
var fri = {
	"friCount" : 0,
	"friTotal" : 0,
	"friAverage" : 0,
	"mornAverage" : 0,
	"noonAverage" : 0,
	"eveningAverage" : 0,
	"lateAverage": 0 };
var sat = {
	"satCount" : 0,
	"satTotal" : 0,
	"satAverage" : 0,
	"mornAverage" : 0,
	"noonAverage" : 0,
	"eveningAverage" : 0,
	"lateAverage": 0 };

var mornAverage;
var noonAverage;
var eveningAverage;
var lateAverage;


// Setup routes
app.set('views', './app/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(express.static(__dirname + '/app'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));

app.get('/', function (req, res) {
  res.render('index');
});

server.listen(8000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Express server listening at http://%s:%s', host, port);

// Starts background processes for data stream from device and utility price
  dataStream.send("start");
  utilPrice.send("start");

  setInterval(function() {
  	var d = new Date().getDay();
  	if (d == 0) {
  		sun.sunCount += 1;
  	} else if (d == 1) {
  		mon.monCount += 1;
  	} else if (d == 2) {
  		tue.tueCount += 1;
  	} else if (d == 3) {
  		wed.wedCount += 1;
  	} else if (d == 4) {
  		thur.thurCount += 1;
  	} else if (d == 5) {
  		fri.friCount += 1;
  	} else if (d == 6) {
  		sat.satCount += 1;
  	}
  }, 86400000);


// Connects with the client, when data is received from the streams, tranform it and send it to the client
  io.on('connection', function (socket) {
  	console.log("Connection set");

  	// Get the current utility price for electricty in cents per kilowatt hour
  	utilPrice.on('message', function(msg){
  		currentPrice = msg[1];
  		console.log("Current Price: " + currentPrice);
  	});

  	utilPrice.on('exit', function() {
  		console.log('price process closing');
  	});

  	// Get current power usage from device stream
  	dataStream.on('message', function(msg){
	    console.log("Recv'd message from background process.");

	    // Set current usage
	    current = msg.values;
	    socket.emit('stream', current);
	    console.log(current[0].value);

	    // Set current cost
	    currentCost = (current[0].value * (currentPrice / 60 / 6));
	    socket.emit('streamCost', currentCost);
	    console.log("current cost: " + currentCost);

	    // Set dayTotal and dayTotalCost
	    var today = new Date().getDay();
	    console.log("Today is " + today);
	    var feedDate = new Date(msg.values[0].at).getDay();
	    console.log("Feed day is " + feedDate);
	    if (today == feedDate) {
	    	console.log("Value to be added to day: " + msg.values[0].value);
	    	// Set dayTotal
	    	dayTotal = dayTotal + msg.values[0].value;
	    	// Set dayTotalCost
	    	dayTotalCost = dayTotalCost + currentCost;
	    	socket.emit('day', dayTotal);
	    	socket.emit('dayCost', dayTotalCost);
	    	console.log("Day Total: " + dayTotal);
	    }

	    // Set weekTotal and weekTotal Cost
	    if (today == 0) {
	    	weekTotal = dayTotal;
	    	weekTotalCost = dayTotalCost;
	    } else {
	    	weekTotal += current[0].value;
	    	weekTotalCost += currentCost;
	    }
	    socket.emit('week', weekTotal);
	    socket.emit('weekCost', weekTotalCost);
	    console.log("Week Total: " + weekTotal);

	    // Set monthTotal

	    // Set monthTotalCost

	    // Set Array
	    if (hour.length == 30) {
	    	for (i = 0; i < 29; i++) {
	    		hour[i] = hour[i + 1];
	    	}
	    	hour[29] = current[0];
	    } else {
	    	hour.push(current[0]);
	    }
	    socket.emit('hour', hour);
	    console.log(hour);

	    //================================================//
	    // Averages:
	    var thisSunTotal = 0;
	    var thisMonTotal = 0;
	    var thisTueTotal = 0;
	    var thisWedTotal = 0;
	    var thisThurTotal = 0;
	    var thisFriTotal = 0;
	    var thisSatTotal = 0;
	    var daySegTotal = 0;
	    var feedHour = new Date(msg.values[0].at).getHours();
	    if (today == 0) {
	    	sat.satTotal += thisSatTotal;
	    	sat.satAverage = (sat.satTotal / sat.satCount);
	    	thisSatTotal = 0;
	    	thisSunTotal = dayTotal;
	    	// while (feedHour > 0 || feedHour < 6) {
	    	// 	daySegTotal += current[0].value;
	    	// }
	    };
	    if (today == 1) {
	    	sun.sunTotal += thisSunTotal;
	    	sun.sunAverage = (sun.sunTotal / sun.sunCount);
	    	thisSunTotal = 0;
	    	thisMonTotal = dayTotal;
	    };
	    if (today == 2) {
	    	mon.monTotal += thisMonTotal;
	    	mon.monAverage = (mon.monTotal / mon.monCount);
	    	thisMonTotal = 0;
	    	thisTueTotal = dayTotal;
	    };
	    if (today == 3) {
	    	tue.tueTotal += thisTueTotal;
	    	tue.tueAverage = (tue.tueTotal / tue.tueCount);
	    	thisTueTotal = 0;
	    	thisWedTotal = dayTotal;
	    };
	    if (today == 4) {
	    	wed.wedTotal += thisWedTotal;
	    	wed.wedAverage = (wed.wedTotal / wed.wedCount);
	    	thisWedTotal = 0;
	    	thisThurTotal = dayTotal;
	    };
	    if (today == 5) {
	    	thur.thurTotal += thisThurTotal;
	    	thur.thurAverage = (thur.thurTotal / thur.thurCount);
	    	thisThurTotal = 0;
	    	thisFriTotal = dayTotal;
	    };
	    if (today == 6) {
	    	fri.friTotal += thisFriTotal;
	    	fri.friAverage = (fri.friTotal / fri.friCount);
	    	thisFriTotal = 0;
	    	thisSatTotal = dayTotal;
	    };
		});

		socket.on('disconnect', function() {
			console.log("disconnecting");
		});
  });
	dataStream.on('exit', function() {
		console.log('data process closing');
	});
});