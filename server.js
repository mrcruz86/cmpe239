var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var childProcess = require("child_process");

// Fork background process
var dataStream = childProcess.fork("./background/data_stream");

// Set global variables
// Array for last hour for graph
var hour = [];

// Current Value
var current;
var currentCost;

// Day's total
var dayTotal = 0;
var dayTotalCost;

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

app.get('/', function (req, res) {
  res.render('index');
});

server.listen(8000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Express server listening at http://%s:%s', host, port);

// Starts background process for data stream from device
  dataStream.send("start");

// Connects with the client, when data is received from data stream, tranform it and send it to the client
  io.on('connection', function (socket) {
  	console.log("Connection set");
  	dataStream.on('message', function(msg){
	    console.log("Recv'd message from background process.");

	    // Set current
	    current = msg.values;
	    socket.emit('stream', current);
	    console.log(current);

	    // Set current cost

	    // Set dayTotal
	    var today = new Date().getDay();
	    console.log("Today is " + today);
	    var feedDate = new Date(msg.values[0].at).getDay();
	    console.log("Feed day is " + feedDate);
	    if (today == feedDate) {
	    	console.log("" + msg.values[0].value);
	    	dayTotal = dayTotal + msg.values[0].value;
	    	socket.emit('day', dayTotal);
	    	console.log("Day Total: " + dayTotal);
	    }

	    // Set dayTotalCost

	    // Set weekTotal
	    if (today == 0) {
	    	weekTotal = dayTotal;
	    } else {
	    	weekTotal += current[0].value;
	    }
	    socket.emit('week', weekTotal);
	    console.log("Week Total: " + weekTotal);

	    // Set weekTotalCost

	    // Set monthTotal

	    // Set monthTotalCost

	    // Set Array

		});
  });

});