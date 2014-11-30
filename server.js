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
var weekTotalCost;

// Month's Total
var monthTotal;
var monthTotalCost;


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

// Connects with the client, when data is received from the streams, tranform it and send it to the client
  io.on('connection', function (socket) {
  	console.log("Connection set");

  	// Get the current utility price for electricty in cents per kilowatt hour
  	utilPrice.on('message', function(msg){
  		currentPrice = msg[1];
  		console.log("Current Price: " + currentPrice);
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
	    if (hour.length == 360) {
	    	for (i = 0; i < 359; i++) {
	    		hour[i] = hour[i + 1];
	    	}
	    	hour[359] = current;
	    } else {
	    	hour.push(current[0]);
	    }
	    socket.emit('hour', hour);
	    console.log(hour);

		});
  });

});