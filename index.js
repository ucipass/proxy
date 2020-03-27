//  Install npm dependencies first
//  npm init
//  npm install --save url@0.10.3
//  npm install --save http-proxy@1.11.1
//  https://stackoverflow.com/questions/8165570/https-proxy-server-in-node-js/49864522#49864522

const httpProxy = require("http-proxy");
const http = require("http");
const url = require("url");
const net = require('net');
const log = require("ucipass-logger")("proxy")
log.transports.console.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL :'info'
const PROXY_PORT = 3128


class Proxy{
  constructor(PROXY_PORT){
    this.port = PROXY_PORT ? PROXY_PORT : process.env.PROXY_PORT ? process.env.PROXY_PORT :  3128
    this.server = null
  }

  start(){

    var server = this.server
    server = http.createServer(function (req, res) {
      var urlObj = url.parse(req.url);
      var target = urlObj.protocol + "//" + urlObj.host;
    
      log.info("HTTP request for:", target);
    
      var proxy = httpProxy.createProxyServer({});
      proxy.on("error", function (err, req, res) {
        log.info("proxy error", err);
        res.end();
      });
    
      proxy.web(req, res, {target: target});
    }).listen(PROXY_PORT);  //this is the port your clients will connect to
    
    var regex_hostport = /^([^:]+)(:([0-9]+))?$/;
    
    var getHostPortFromString = function (hostString, defaultPort) {
      var host = hostString;
      var port = defaultPort;
    
      var result = regex_hostport.exec(hostString);
      if (result != null) {
        host = result[1];
        if (result[2] != null) {
          port = result[3];
        }
      }
    
      return ( [host, port] );
    };
    
    server.addListener('connect', function (req, socket, bodyhead) {
      var hostPort = getHostPortFromString(req.url, 443);
      var hostDomain = hostPort[0];
      var port = parseInt(hostPort[1]);
      log.info("HTTPS  request for:", hostDomain, port);
    
      var proxySocket = new net.Socket();
      proxySocket.connect(port, hostDomain, function () {
          proxySocket.write(bodyhead);
          socket.write("HTTP/" + req.httpVersion + " 200 Connection established\r\n\r\n");
        }
      );
    
      proxySocket.on('data', function (chunk) {
        socket.write(chunk);
      });
    
      proxySocket.on('end', function () {
        socket.end();
      });
    
      proxySocket.on('error', function () {
        socket.write("HTTP/" + req.httpVersion + " 500 Connection error\r\n\r\n");
        socket.end();
      });
    
      socket.on('data', function (chunk) {
        proxySocket.write(chunk);
      });
    
      socket.on('end', function () {
        proxySocket.end();
      });
    
      socket.on('error', function () {
        proxySocket.end();
      });
    
    });

  }


}

(new Proxy()).start()

