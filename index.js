// Load the http module to create an http server.
var http = require('http');
var request = require('request');
var path = require('path');
var fs = require('fs');

// Set a the default values
var argv = require('yargs')
    .default('host')
    .default('port', 8000)
    .default('url')
    .default('logfile')
    .argv;

var logPath = argv.logfile && path.join(__dirname, argv.logfile);

var logStream = logPath ? fs.createWriteStream(logPath) : process.stdout;

var host = argv.host || '127.0.0.1' + ':' + argv.port;

var destinationUrl = argv.url || 'http://' + host;

logStream.write("\ndestinationUrl = " + destinationUrl);

// Echo server -------------------------------------------------------
var server = http.createServer(function (req, res) {
//    res.writeHead(200, {"Content-Type": "text/plain"});
//    res.end("Hello World\n");

    logStream.write("\nEcho request received at: " + req.url + ":\n" + JSON.stringify(req.headers));

    for (var header in req.headers) {
        res.setHeader(header, req.headers[header])
    }

    req.pipe(logStream, {end: false})
    req.pipe(res, {end: false})

}).listen(8000);

logStream.write("\nEcho Server running at http://127.0.0.1:8000/");

// Proxy Server -------------------------------------------------------
//var destinationUrl = '127.0.0.1:8000';

http.createServer(function (req, res) {

    console.log("\nProxying request to: " + destinationUrl + req.url);

    var url = destinationUrl;
    if (req.headers['x-destination-url']) {
        url = req.headers['x-destination-url'];
        delete req.headers['x-destination-url'];
    }

    var options = {
        headers: req.headers,
        url: url + req.url
    };

    req.pipe(logStream, {end: false});

    var destinationResponse = req.pipe(request(options), {end: false});

    logStream.write("\nRequest proxied to: " + options.url + ": \n" + JSON.stringify(req.headers));
    logStream.write("\nResponse headers: " + JSON.stringify(destinationResponse.headers));

    destinationResponse.pipe(res, {end: false});
    destinationResponse.pipe(logStream, {end: false});

}).listen(8001)

logStream.write("\nProxy Server running at http://127.0.0.1:8001/");

