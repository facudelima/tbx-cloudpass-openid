#!/usr/bin/env node

/**
 * Module dependencies.
 */

const
  tbxlibs = require('../modules/tbxlibs'),
  app = require('../app'),
  http = require('http');
const
  log = tbxlibs.modules.log;

/**
 * Normalize a port into a number, string, or false.
 */

const normalizePort = (val) => {
  let port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
};

const port = normalizePort(process.env.PORT || '3000');
const host = process.env.SERVER_HOST || 'localhost';

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Event listener for HTTP server "listening" event.
 */

const onListening = () => {
  let addr = server.address();
  let bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  log.warn('Listening on ' + bind, ',', addr);
};

/**
 * Event listener for HTTP server "error" event.
 */

const onError = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  let bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      break;
    default:
      throw error;
  }

  process.exit(1);
};

/**
 * Get port from environment and store in Express.
 */

app.set('port', port);
app.set('address', host);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);

server.on('error', onError);
server.on('listening', onListening);

// nodejs 15+
process.on('unhandledRejection', (reason, promise) => {
  console.error(`**FATAL** Unhandled Rejection: ${reason}`);
  console.error(`**FATAL** Unhandled Rejection: details`, reason, promise);
});
