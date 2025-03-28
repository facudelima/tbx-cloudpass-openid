const express = require('express'),
  router = express.Router(),
  Promise = require('bluebird'),
  tbxlibs = require('../modules/tbxlibs'),
  {
    createLockMiddleware,
    releaseLock,
    releaseLockAndContinue,
    createAwaitLockMiddleware
  } = require('./middleware/routeLock');

const {apiKey, ErrorAPI, log} = tbxlibs.modules;

/**
 * @openapi
 * /lock:
 *   post:
 *     tags:
 *       - Utils
 *     summary: Test lock
 *     operationId: testlock
 *     responses:
 *       '200':
 *         description: Request was successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleStatus'
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Unauthorized'
 *             examples:
 *               Api Key Error:
 *                 value:
 *                   code: BASE-401
 *                   message: API KEY is required
 *       '500':
 *         description: SYSTEM ERROR
 *         content:
 *           application/json:
 *             examples:
 *               internal error:
 *                 value:
 *                   code: TEST-003
 *                   message: Internal server error
 *     security:
 *       - api_key: []
 */
// create a common key for this request (like: userid+action+uniqueParam)
function keyCreatorFunc(req) {
  if (!req.query.uniqueParam) {
    // return null to avoid lock (skip)
    return null;
  }

  // *AVOID* using database information or external services

  // return a key to create lock
  return req.query.uniqueParam;
}

// simple example
router.post('/simple',
  apiKey,
  createLockMiddleware(keyCreatorFunc, ErrorAPI.error(ErrorAPI.codes.REQ_LOCK_FAIL)),
  (req, res, next) => {
    log.debug('create work for', keyCreatorFunc(req));
    // do some task
    Promise.delay(150)
      .then(() => {
        log.debug('create work OK', keyCreatorFunc(req));
        res.send({ok: true});
      })
      // optional: release by route
      .then(() => next())
      .catch(next);
  }, releaseLock);

// full custom example
let createLockKey = createLockMiddleware(
  keyCreatorFunc,
  // set the error on lock fail
  ErrorAPI.error(ErrorAPI.codes.REQ_LOCK_FAIL),
  // OPTIONAL params:
  {
    // set the error handler for lock fail on lock fail
    errorHandlerFunc: (error, req, res, next) => {
      log.warn('errorHandlerFunc handler', error);
      next(ErrorAPI.error(ErrorAPI.codes.REQ_LOCK_FAIL));
    },
    // default is 5
    ttlInSeconds: 3
  }
);

router.post('/', apiKey, createLockKey, (req, res, next) => {
  log.debug('create work for', keyCreatorFunc(req));
  // do some task
  Promise.delay(150)
    .then(() => {
      log.debug('create work OK', keyCreatorFunc(req));
      res.send({ok: true});
    })
    // optional: release by code
    .then(() => releaseLock(req, res))
    .catch(next);
});

// simple example
router.post('/postProcess',
  apiKey,
  createLockMiddleware(keyCreatorFunc, ErrorAPI.error(ErrorAPI.codes.REQ_LOCK_FAIL)),
  (req, res, next) => {
    log.debug('create work for', keyCreatorFunc(req));
    // do some task
    Promise.delay(150)
      .then(() => {
        log.debug('create work OK', keyCreatorFunc(req));
        // response is in last step
      })
      // optional: release by route
      .then(() => next())
      .catch(next);
  }, releaseLockAndContinue, (req, res, next) => {
    // outside the lock
    res.send({ok: true});
  });

// ttl example
router.post('/ttl',
  apiKey,
  createAwaitLockMiddleware(keyCreatorFunc, ErrorAPI.error(ErrorAPI.codes.REQ_LOCK_FAIL), 5),
  (req, res, next) => {
    log.debug('create work for', keyCreatorFunc(req));
    // do some task
    Promise.delay(req.query.delay || 300)
      .then(() => {
        log.debug('create work OK', keyCreatorFunc(req));
        res.send({ok: true});
      })
      // optional: release by route
      .then(() => next())
      .catch(next);
  }, releaseLock);

module.exports = router;
