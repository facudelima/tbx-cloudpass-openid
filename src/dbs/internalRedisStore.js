const
  storeUtils = require('./common/storeUtils'),
  tbxlibs = require('../modules/tbxlibs'),
  packageJson = require('../../package.json');

const
  config = tbxlibs.modules.config;

/**
 * internal redis: cache & locks
 */
class InternalRedisStore {
  constructor(driver, systemService) {
    this.storeDriver = driver;
    if (systemService) {
      systemService.register(this, 'InternalRedisStore');
    }
  }
  // cache options
  get encodeData() {
    return false;
  }
  // cache options
  get ofuscateKeys() {
    return false;
  }

  _getSafeKey(key, usedFor = 'redisLock') {
    return `${packageJson.name}-${usedFor}-${key}`;
  }

  // ////////////////////// api lock methods

  async verifyOrCreateLockKey(key, keyData, ttlInSeconds) {
    let redis = await this.storeDriver.getClient();
    let safeKey = this._getSafeKey(key);
    let exists = await redis.exists(safeKey);

    if (exists) {
      return {
        created: false
      };
    }
    await redis.set(safeKey, JSON.stringify(keyData || {}), 'EX', ttlInSeconds);

    return {
      created: true,
      keyData
    };
  }

  async releaseByLockKey(key) {
    let redis = await this.storeDriver.getClient();
    await redis.del(this._getSafeKey(key));
    return true;
  }

  // ////////////////////// cache methods

  async cacheGet(namespace, key) {
    let redis = await this.storeDriver.getClient();
    let existent = await redis.get(this._getSafeKey(key, 'intCache'));

    if (existent) {
      return JSON.parse(existent);
    }

    return null;
  }
  async cacheSet(namespace, key, val, ttlInSeconds = 120) {
    let redis = await this.storeDriver.getClient();
    await redis.set(this._getSafeKey(key, 'intCache'), JSON.stringify(val || {}), 'EX', ttlInSeconds);
    return val;
  }
  async cacheDel(namespace, key) {
    let redis = await this.storeDriver.getClient();
    await redis.del(this._getSafeKey(key, 'intCache'));
    return true;
  }
  async cacheClearNamespace(namespace) {
    let redis = await this.storeDriver.getClient();
    let keys = await redis.keys(this._getSafeKey('*', 'intCache'));

    if (keys.length === 0) {
      return true;
    }
    await redis.del(keys);
    return true;
  }

  // ////////////////////// cache methods end
}

/**
 *
 * @type {InternalRedisStore}
 */
module.exports = new InternalRedisStore(
  storeUtils.createDirectDriver(config.db.internalRedis),
  tbxlibs.services.systemService
);
