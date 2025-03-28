const
  tbxlibs = require('../modules/tbxlibs'),
  lockRedisStore = require('../dbs/internalRedisStore'),
  {addMilliseconds} = require('date-fns');

const {log, config} = tbxlibs.modules,
  {systemService} = tbxlibs.services;

/**
 * based on https://redis.io/docs/latest/develop/use/patterns/distributed-locks/
 */
class InterApiLockService {
  constructor(store) {
    this.store = store;
  }
  get behaviourAwait() {
    return 'await';
  }
  get behaviourReject() {
    return 'reject';
  }

  async acquireLock(key, errorObj, params = {}) {
    if (!key || config.lock.disableLocks === 'true') {
      return {
        locked: false,
        key
      };
    }

    const {
      keyData,
      ttlInSeconds = config.lock.ttlInSeconds,
      behaviour = this.behaviourReject
    } = params;

    // exists? create
    let result;
    try {
      result = await this.store.verifyOrCreateLockKey(key, keyData ?? {created: new Date()}, ttlInSeconds);
    } catch (e) {
      log.warn('verifyOrCreateLockKey fail' + e.message, {e, key, params});
      return {
        locked: true,
        key,
        failCreate: true
      };
    }

    if (!result || !result.created) {
      if (behaviour === this.behaviourAwait) {
        return this._awaitLock(key, errorObj, params);
      }
      log.warn('acquireLock fail', {key, params, result});
      // fail to create, throw business error
      throw errorObj;
    }

    log.debug('acquireLock', key, true);
    return {
      locked: true,
      key
    };
  }

  async _awaitLock(key, errorObj, params) {
    const {
      retry = 0,
      ttlInSeconds = config.lock.ttlInSeconds,
      expireDate = null,
      pollingIntervalInMlSeconds = config.lock.pollingIntervalInMlSeconds
    } = params;

    if (expireDate && expireDate.getTime() < new Date().getTime()) {
      log.warn('acquireLock fail', {key, params});
      // fail to create, throw business error
      errorObj.details = {
        ttlInSeconds
      };
      throw errorObj;
    }

    let fixedParams = {
      ...params,
      retry: retry + 1,
      expireDate: expireDate ?? addMilliseconds(new Date(), ttlInSeconds * 1000)
    };

    log.debug('acquireLock delay', {key, fixedParams});
    // delay
    await new Promise((resolve, reject) => setTimeout(resolve, pollingIntervalInMlSeconds));

    return this.acquireLock(key, errorObj, fixedParams);
  }

  async releaseLock(key, current, options) {
    log.debug('releaseLock', key);
    try {
      await this.store.releaseByLockKey(key);
    } catch (e) {
      log.warn('releaseLock fail ' + e.message, {key, e});
    }
    return true;
  }
}

// store can be any whit:
// - verifyOrCreateLockKey(key, data, ttl) { return {created:true/false} }
// - crearLockKey(key)
module.exports = new InterApiLockService(lockRedisStore);
systemService.register(module.exports, 'InterApiLockService');
