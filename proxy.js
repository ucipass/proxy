//  Tip of the hat to: https://stackoverflow.com/questions/8165570/https-proxy-server-in-node-js/49864522#49864522

const http = require("http");
const net = require('net');
const httpProxy = require("http-proxy");
const readlineSync = require('readline-sync');
const log = require("ucipass-logger")("proxy")
log.transports.console.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL :'info'
const PROXY_PORT = 3128

class Proxy{
  constructor(PROXY_PORT){
    this.port = PROXY_PORT ? PROXY_PORT : process.env.PROXY_PORT ? process.env.PROXY_PORT :  3128
    this.server = null
    this.proxy = null
    this.sockets = {}
    this.nextSocketId = 0
  }

  async start(){

    log.debug(`Proxy server starting on port ${this.port}`)
    this.server = http.createServer( (req, res)=> {
      let urlObj = new URL(req.url)
      // var target = urlObj.protocol + "//" + urlObj.host;
    
      log.info("HTTP request for:", urlObj.hostname);
    
      this.proxy = httpProxy.createProxyServer({});
      this.proxy.on("error", (err, req, res)=> {
        log.info("proxy error", err);
        res.end();
      });
    
      this.proxy.web(req, res, {target: urlObj.origin});
    })
    
    this.server.on('connection', (socket)=> {
      // Add a newly connected socket
      var socketId = this.nextSocketId++;
      this.sockets[socketId] = socket;
      log.debug('socket', socketId, 'opened');
    
      // Remove the socket when it closes
      socket.on('close',  ()=> {
        log.debug('socket', socketId, 'closed');
        delete this.sockets[socketId];
      });

    });

    var regex_hostport = /^([^:]+)(:([0-9]+))?$/;
    
    var getHostPortFromString = (hostString, defaultPort)=> {
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
    
    this.server.addListener('connect',  (req, socket, bodyhead)=> {
      var socketId = this.nextSocketId++;

      var hostPort = getHostPortFromString(req.url, 443);
      var hostDomain = hostPort[0];
      var port = parseInt(hostPort[1]);
      log.info("HTTPS request for:", hostDomain, port);
    
      var proxySocket = new net.Socket();
      log.debug("psocket",socketId)
      this.sockets[socketId] = proxySocket;

      proxySocket.connect(port, hostDomain, function () {
          proxySocket.write(bodyhead);
          socket.write("HTTP/" + req.httpVersion + " 200 Connection established\r\n\r\n");
        }
      );
    
      proxySocket.on('data', function (chunk) {
        socket.write(chunk);
      });
    
      proxySocket.on('close', ()=> {
        delete this.sockets[socketId];
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

    return new Promise((resolve, reject) => {
      this.server.once('error', function (error) {
        reject(error)
      });

      this.server.listen(this.port,(error)=>{
        resolve(this.server)
      });        
    });

  }

  async stop(){
    return new Promise((resolve, reject) => {
      this.server.close( ()=> { 
        log.debug('Server closed!'); 
        this.server.removeListener("connect",()=>{
          log.debug("removed listerner!")
        })
        if(this.proxy) this.proxy.close(()=>{
          log.debug("proxy closed!")
        })  
    
      });
      // Destroy all open sockets
      for (var socketId in this.sockets) {
        // log.debug('socket', socketId, 'destroyed!!!!!!');
        this.sockets[socketId].destroy();

      }          
    });
  }

}

const proxy = (proxyPort)=>{ return (new Proxy(proxyPort)).start()}

module.exports = proxy

if (require.main === module) {
  let PROXY_PORT = process.env.PROXY_PORT ? process.env.PROXY_PORT : readlineSync.question(`Enter PROXY_PORT [3128]: `);
  proxy(PROXY_PORT)
  .then ( server => log.info (`Proxy server started on port ${server.address().port}`))
  .catch( error  => log.error(`Proxy start failure: ${error.message}`))
}