const express = require('express'),
  router = express.Router(),
  path = require('path'),
  fs = require('fs'),
  Promise = require('bluebird'),

  tbxlibs = require('../modules/tbxlibs'),
  systemMonitorService = require('../services/systemMonitorService');

const { config, ErrorAPI, log, apiKey } = tbxlibs.modules,
  systemService = tbxlibs.services.systemService;

const uptimeDate = new Date();
const serverName = process.env.NEW_RELIC_APP_NAME || process.env.SERVER_HOST || 'local';

// usefully in debug
router.use((req, res, next) => {
  res.set('X-Server-Name', serverName);
  next();
});

/**
 * @openapi
 * /system/version:
 *   get:
 *     tags:
 *       - System
 *     summary: System version
 *     description: ''
 *     responses:
 *       '200':
 *         description: Request was successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleStatus'
 *       '500':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get('/version', (req, res) => {
  let { initialConfig } = config;

  res.json({
    date: new Date(),
    ok: true,
    name: initialConfig.package.name,
    description: initialConfig.package.description,
    version: initialConfig.package.version,
    env: process.env.NODE_ENV,
    uptimeDate,
    serverName
  });
});

/**
 * @openapi
 * /system/ping:
 *   get:
 *     tags:
 *       - System
 *     summary: System ping
 *     description: ''
 *     responses:
 *       '200':
 *         description: Request was successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleStatus'
 *       '500':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

router.get('/ping', (req, res) => {
  log.debug('ping request');

  res.json({
    date: new Date(),
    ok: true
  });
});

function validateOkResponsesAndSend(req, res, name = 'testing') {
  return info => {
    log.debug(name, info);

    info = Array.isArray(info) ? info : [info];
    const ok = !info.find(i => !i.ok);

    res.status(ok ? 200 : 500).json({
      date: new Date(),
      ok,
      info
    });
  };
}

/**
 * internal method, dont publish!
 */
router.get('/check', (req, res, next) => {
  log.debug('/check performDBTest request');

  Promise.try(() => systemService.performDBTest())
    .then(validateOkResponsesAndSend(req, res, 'check'))
    .catch(next);
});

/**
 * internal method, dont publish!
 */
router.get('/fullcheck', apiKey, (req, res, next) => {
  log.debug('system check request');

  Promise.try(() => systemService.performTest())
    .then(validateOkResponsesAndSend(req, res, 'check'))
    .catch(next);
});

/**
 * internal method, dont publish!
 */
router.delete('/cache', apiKey, (req, res, next) => {
  log.debug('cache CLEAR request');

  Promise.try(() => systemService.clearCache(true))
    .then(r => r.map(ok => ({ ok })))
    .then(validateOkResponsesAndSend(req, res, 'cache'))
    .catch(next);
});

/**
 * internal method, dont publish!
 */
router.get('/cache', apiKey, (req, res, next) => {
  log.debug('cache check request');

  Promise.try(() => systemService.cacheInfo(true))
    .then(r => r.map(info => ({ ok: true, info })))
    .then(validateOkResponsesAndSend(req, res, 'cache'))
    .catch(next);
});

/**
 * internal method, dont publish!
 */
router.get('/monitor', (req, res, next) => {
  log.debug('runMonitorStatus request');

  Promise.try(() => systemService.runMonitorStatus().then(validateOkResponsesAndSend(req, res, 'monitor')))
    .catch(e => {
      // ignore in apm monitor
      next.expected = true;
      next(e);
    });
});

router.delete('/monitor', apiKey, (req, res, next) => {
  systemMonitorService.clearErrors()
    .then(() => res.send({ok: true}))
    .catch(err => res.send({ok: false, err}));
});

const loadedFiles = {};

function getLazyFile(file) {
  if (typeof loadedFiles[file] === 'undefined') {
    try {
      loadedFiles[file] = fs.readFileSync(path.join(__dirname, '..', '..', file));
    } catch (e) {
      log.error('Fail to get file', file, e);
      loadedFiles[file] = null;
    }
  }

  return loadedFiles[file];
}

/**
 * internal method, dont publish!
 */
router.get('/changelog', apiKey, (req, res) => {
  log.debug('changelog request');

  const data = getLazyFile('CHANGELOG.md');

  if (!data) {
    return ErrorAPI.catchInto(req, res)(ErrorAPI.error('Not found', ErrorAPI.codes.SYSTEM_ERROR));
  }

  res.setHeader('Content-Type', 'text/markdown');
  res.send(data);
  res.end();
});

/**
 * internal method, dont publish!
 */
router.get('/readme', apiKey, (req, res) => {
  log.debug('monitorCheck request');

  const data = getLazyFile('README.md');

  if (!data) {
    return ErrorAPI.catchInto(req, res)(ErrorAPI.error('Not found', ErrorAPI.codes.SYSTEM_ERROR));
  }

  res.setHeader('Content-Type', 'text/markdown');
  res.send(data);
  res.end();
});

router.get('/node/version', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(process.version);
  res.end();
});

module.exports = router;
