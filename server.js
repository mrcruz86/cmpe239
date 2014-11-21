var express = require('express');
var app = express();

var childProcess = require("child_process");
var dataStream = childProcess.fork("./background/data_stream");

app.set('views', './app/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.get('/', function (req, res) {
  res.render('index');
});

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Express server listening at http://%s:%s', host, port);

  dataStream.send("start");

  dataStream.on('message', function(msg){
    console.log("Recv'd message from background process.");
    var data = msg.values;
    console.log(data);
	});

});