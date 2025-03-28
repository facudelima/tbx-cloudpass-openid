/**
 * MAIN APP
 *
 * Crea la App principal y sus configs
 *
 * @type {*|exports|module.exports}
 */

const
  tbxlibs = require('./modules/tbxlibs'),
  swagger = require('./modules/swagger');

const
  express = require('express'),
  path = require('path'),
  fs = require('fs'),
  favicon = require('serve-favicon'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  compress = require('compression'),
  cors = require('cors'),
  swaggerUi = require('swagger-ui-express'),
  // safe
  {releaseLock} = require('./routes/middleware/routeLock');

// load monitor
require('./services/systemMonitorService');

const { config, ErrorAPI, log } = tbxlibs.modules,
  { cacheFactoryService } = tbxlibs.services;

// optional, set external cache to service-dedicated redis
cacheFactoryService.setDefaultExternalCacheStore(require('./dbs/internalRedisStore'));

const app = express();

require('dnscache')({
  enable: true
});

// main cors config, default is blocked
app.use(cors(config.cors));
// allow from all:
// app.use(cors());
// or check cors.json

// Set proxy configuration
app.enable('trust proxy');
app.set('x-powered-by', false);

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(compress());
app.use(bodyParser.json({ limit: '250mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// nunca usar sin un path, sino genera validaciones al disco que pueden ocacionar problemas de perfomarse
app.use('/public', express.static(path.join(__dirname, 'public')));

if (config.isTestEnv()) {
  log.info('adding Request debugger');
  app.use(require('morgan')('dev'));
}

// version
app.use((req, res, next) => {
  // req.version is used to determine the version
  req.version = req.headers['accept-version'] || req.params.apiversion || 'v0';
  next();
});

// define main routes

const loadAllRoutes = (app, apiVersion) => {
  fs
    .readdirSync(path.join(__dirname, 'routes'))
    .forEach((file) => {
      // Ignorar archivos .json
      if (file.endsWith('.json')) {
        return;
      }
      
      const module = path.join(__dirname, 'routes', file);
      const moduleRoute = file.substr(0, file.indexOf('.')).toLowerCase();

      log.debug('Load module route: /', moduleRoute);

      if (fs.lstatSync(module).isFile()) {
        if (moduleRoute === 'index') {
          app.use(apiVersion + '/', require(module));
        } else {
          app.use(apiVersion + '/' + moduleRoute, require(module));
        }
      }
    });
};

// index
app.use('/', require('./routes/index'));

// all
loadAllRoutes(app, config.swagger.basePath);

if (config.isShowDocs()) {
  const { initialConfig } = config;
  const staticPath = path.join(__dirname, '../docs', 'api', initialConfig.package.name, initialConfig.package.version);
  
  // swagger
  app.use('/explorer', swaggerUi.serve, swaggerUi.setup(swagger, {
    customfavIcon: '/public/favicon.ico',
    customSiteTitle: "OpenID Connect API Documentation"
  }));
  
  app.use('/docs', express.static(staticPath));
  app.use('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swagger);
  });
}

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

if (!config.isProdEnv()) {
  app.locals.pretty = true;
  app.set('view options', { pretty: true });
  app.set('json spaces', 2); // pretty print json responses
}

app.use((err, req, res, next) => {
  if (!err) {
    next(err, req, res, next);
    return;
  }

  // format error
  ErrorAPI.catchInto(req, res)(err);

  // release lock on error
  releaseLock(req, res);
});

module.exports = app;
