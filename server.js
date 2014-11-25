var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var childProcess = require("child_process");
var dataStream = childProcess.fork("./background/data_stream");

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

  dataStream.send("start");

  io.on('connection', function (socket) {
  	console.log("Connection set");
  	dataStream.on('message', function(msg){
	    console.log("Recv'd message from background process.");
	    var data = msg.values;
	    socket.emit('stream', data);
	    console.log(data);
		});
  });

});