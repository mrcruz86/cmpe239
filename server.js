var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var childProcess = require("child_process");

// Fork child processes
var dataStream = childProcess.fork("./background/data_stream");
var utilPrice = childProcess.fork("./background/util_price");

// Start child processes
dataStream.send("start");
utilPrice.send("start");

// Setup routes and config
app.set('views', './app/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use(express.static(__dirname + '/app'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));

app.get('/', function (req, res) {
  res.render('index');
});

// Start Server
server.listen(8000, function() {
	console.log('SERVER: Server listening on port 8000');
});

//======================================================//
//============== Setup Global Variables ================//
//======================================================//
// Sliding Window Array
var hour = [];

// Current Value
var current = 0;
var currentPrice = 0;
var currentCost = 0;
var timestamp;

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

var d;
var zeroCount = 0;

//======================================================//
//=================== Server Logic =====================//
//======================================================//

// Setup the day of the week count
var getDay = function() {
	d = new Date().getDay();
	if (d == 0) {
		sun.sunCount += 1;
		console.log("SERVER: Sunday #" + sun.sunCount);
	} else if (d == 1) {
		mon.monCount += 1;
		console.log("SERVER: Monday #" + mon.monCount);
	} else if (d == 2) {
		tue.tueCount += 1;
		console.log("SERVER: Tuesday #" + tue.tueCount);
	} else if (d == 3) {
		wed.wedCount += 1;
		console.log("SERVER: Wednesday #" + wed.wedCount);
	} else if (d == 4) {
		thur.thurCount += 1;
		console.log("SERVER: Thursday #" + thur.thurCount);
	} else if (d == 5) {
		fri.friCount += 1;
		console.log("SERVER: Friday #" + fri.friCount);
	} else if (d == 6) {
		sat.satCount += 1;
		console.log("SERVER: Saturday #" + sat.satCount);
	}
}
getDay();
setInterval(getDay, 86400000);

// Get the current utility price for electricty in cents per kilowatt hour
utilPrice.on('message', function(msg){
	currentPrice = (msg[1] / 60 / 6 / 1000);
	console.log("SERVER: Current Price: " + currentPrice);
});

// Set Array
dataStream.on('message', function(msg) {

	//Set zeroCount looking for disconnect
	if (msg.values[0].value == 0) {
		zeroCount++;
	} else {
		zeroCount = 0;
	}

	// Set current usage
	current = msg.values;
	// socket.emit('stream', current);
	console.log("SERVER: " + current[0].value);

	// Set current cost
	currentCost = (current[0].value * currentPrice);
	// socket.emit('streamCost', currentCost);
	console.log("SERVER: Current Cost: " + currentCost);

	// Set dayTotal and dayTotalCost
  // var today = new Date().getDay();
  // console.log("Today is " + today);
  var feedDate = new Date(msg.values[0].at).getDay();
  console.log("Feed day is " + feedDate);
  if (d == feedDate) {
  	console.log("Value to be added to day: " + msg.values[0].value);
  	// Set dayTotal
  	dayTotal = dayTotal + msg.values[0].value;
  	// Set dayTotalCost
  	dayTotalCost = dayTotalCost + currentCost;
  	// socket.emit('day', dayTotal);
  	// socket.emit('dayCost', dayTotalCost);
  	console.log("Day Total: " + dayTotal);
  }

  // Set weekTotal and weekTotal Cost
  if (d == 0) {
  	weekTotal = dayTotal;
  	weekTotalCost = dayTotalCost;
  } else {
  	weekTotal += current[0].value;
  	weekTotalCost += currentCost;
  }
  // socket.emit('week', weekTotal);
  // socket.emit('weekCost', weekTotalCost);
  console.log("Week Total: " + weekTotal);

  // Set monthTotal

  // Set monthTotalCost

	if (hour.length == 30) {
		if (msg.values[0].value != 0) {
			for (i = 0; i < 29; i++) {
				hour[i] = hour[i + 1];
			}
			hour[29] = msg.values[0];
		} else if (msg.values[0].value == 0 && zeroCount > 3) {
			for (i = 0; i < 29; i++) {
				hour[i] = hour[i + 1];
			}
			hour[29] = msg.values[0];
		}
	} else {
		hour.push(msg.values[0]);
	}
	// socket.emit('hour', hour);
	console.log("SERVER:");
	console.log(hour);

	timestamp = new Date(msg.values[0].at).toString();

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
  if (d == 0) {
  	sat.satTotal += thisSatTotal;
  	sat.satAverage = (sat.satTotal / sat.satCount);
  	thisSatTotal = 0;
  	thisSunTotal = dayTotal;
  	console.log("SERVER:");
  	console.log(sat);
  };
  if (d == 1) {
  	sun.sunTotal += thisSunTotal;
  	sun.sunAverage = (sun.sunTotal / sun.sunCount);
  	thisSunTotal = 0;
  	thisMonTotal = dayTotal;
  	console.log("SERVER:");
  	console.log(sun);
  };
  if (d == 2) {
  	mon.monTotal += thisMonTotal;
  	mon.monAverage = (mon.monTotal / mon.monCount);
  	thisMonTotal = 0;
  	thisTueTotal = dayTotal;
  	console.log("SERVER:");
  	console.log(mon);
  };
  if (d == 3) {
  	tue.tueTotal += thisTueTotal;
  	tue.tueAverage = (tue.tueTotal / tue.tueCount);
  	thisTueTotal = 0;
  	thisWedTotal = dayTotal;
  	console.log("SERVER:");
  	console.log(tue);
  };
  if (d == 4) {
  	wed.wedTotal += thisWedTotal;
  	wed.wedAverage = (wed.wedTotal / wed.wedCount);
  	thisWedTotal = 0;
  	thisThurTotal = dayTotal;
  	console.log("SERVER:");
  	console.log(wed);
  };
  if (d == 5) {
  	thur.thurTotal += thisThurTotal;
  	thur.thurAverage = (thur.thurTotal / thur.thurCount);
  	thisThurTotal = 0;
  	thisFriTotal = dayTotal;
  	console.log("SERVER:");
  	console.log(thur);
  };
  if (d == 6) {
  	fri.friTotal += thisFriTotal;
  	fri.friAverage = (fri.friTotal / fri.friCount);
  	thisFriTotal = 0;
  	thisSatTotal = dayTotal;
  	console.log("SERVER:");
  	console.log(fri);
  };
});


// Connect sockets
io.on('connection', function(socket) {
	console.log('SERVER: socket connection established');

	socket.on('request', function(data) {
		if (timestamp != data) {
			socket.emit('timestamp', timestamp);
			socket.emit('stream', current);
			socket.emit('streamCost', currentCost);
			socket.emit('day', dayTotal);
			socket.emit('dayCost', dayTotalCost);
			socket.emit('week', weekTotal);
			socket.emit('weekCost', weekTotalCost);
			socket.emit('hour', hour);
			socket.emit('sun', sun);
			socket.emit('mon', mon);
			socket.emit('tue', tue);
			socket.emit('wed', wed);
			socket.emit('thur', thur);
			socket.emit('fri', fri);
			socket.emit('sat', sat);
			socket.emit('zero', zeroCount);
		}
	});
});




