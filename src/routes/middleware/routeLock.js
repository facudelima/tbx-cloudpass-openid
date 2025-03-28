const tbxlibs = require('../../modules/tbxlibs');
const interApiLockService = require('../../services/interApiLockService');

const {log, apm} = tbxlibs.modules;

module.exports = {
  createAwaitLockMiddleware(keyCreatorFunc, errorObj, ttlInSeconds = 5, options = {}) {
    options.behaviour = interApiLockService.behaviourAwait;
    options.ttlInSeconds = ttlInSeconds;
    return module.exports.createLockMiddleware(keyCreatorFunc, errorObj, options);
  },
  /**
   * Creates main lock
   * @param keyCreatorFunc
   * @param errorObj
   * @param options
   */
  createLockMiddleware(keyCreatorFunc, errorObj, options = {}) {
    return (req, res, next) => {
      let key = null;
      try {
        key = keyCreatorFunc(req);
      } catch (e) {
        key = null;
        log.warn('createLockKeyMiddleware, fail to get lock key, ignoring lock!!', e);
      }
      if (key) {
        res.locals.lock = {
          lock: true,
          key,
          errorObj,
          options
        };
        interApiLockService.acquireLock(`${req.path}:${key}`, errorObj, options)
          .then(currentLock => {
            res.locals.lock.current = currentLock;
            next();
          })
          .catch(error => {
            // lock fail
            if (options.errorHandlerFunc) {
              try {
                return options.errorHandlerFunc(error, req, res, next);
              } catch (e) {
                log.warn('createLockKeyMiddleware, fail to errorHandlerFunc!!', e);
                next(e);
              }
            } else {
              return next(error);
            }
          });
      } else {
        next();
      }
    };
  },
  /**
   * release current route lock and calls next()
   * @param req
   * @param res
   * @param next
   */
  releaseLockAndContinue(req, res, next) {
    let {lock, key, current, options} = res.locals.lock || {};
    if (lock) {
      apm.startBackgroundTransaction('releaseLock',
        () => interApiLockService.releaseLock(key, current, options));
    }
    next();
  },
  /**
   * release current route lock
   * @param req
   * @param res
   */
  releaseLock(req, res) {
    let {lock, key, current, options} = res.locals.lock || {};
    if (lock) {
      apm.startBackgroundTransaction('releaseLock',
        () => interApiLockService.releaseLock(`${req.path}:${key}`, current, options));
    }
  }
};
