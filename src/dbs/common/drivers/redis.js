const buildRedisConfig = (config) => {
  if (config.sentinels && config.sentinels !== '' && config.sentinels !== 'TBX_REDIS_SENTINELS') {
    delete config.host;
    delete config.port;

    config.sentinels = setSentinelsConfig(config.sentinels);
  } else {
    delete config.sentinels;
    config.port = setDefaultPort(config.port);
    config.host = setDefaultHost(config.host);
  }

  config.defaultTTL = setDefaultTTL(config.defaultTTL);

  config.retryStrategy = (times) => {
    if (times >= (parseInt(config.maxRetries) || 5)) {
      return null; // Stop retrying after reaching the maximum number of retries
    }
    return Math.min(times * 200, 5000); // Backoff strategy, waits longer each retry
  };

  return config;
};

const setSentinelsConfig = sentinels => {
  if (!Array.isArray(sentinels)) {
    sentinels = sentinels.split(',').map((h) => {
      let data = h.split(':');

      return { host: data[0], port: data[1] };
    });
  }

  return sentinels;
};

const setDefaultPort = port => {
  if (!port) {
    return '6379';
  }

  return port;
};

const setDefaultHost = host => {
  if (!host) {
    return 'localhost';
  }

  return host;
};

const setDefaultTTL = ttl => {
  if (!ttl) {
    return 60 * 60 * 2; // 2hs
  }

  return ttl;
};

/**
 * base redis client
 */
class RedisClient {
  constructor(driver, config) {
    this.driver = driver;
    this.config = config;
  }

  async close() {
    if (!this.client) {
      return true;
    }
    await this.client.disconnect();
    this.client = null;
    return true;
  }

  async connect() {
    if (this.client) {
      return this.client;
    }
    const Redis = require('ioredis');
    this.client = new Redis(this.config);
    return this.client;
  }

  async getClient() {
    return this.connect();
  }

  async healthCheck() {
    let ping;
    try {
      let client = await this.getClient();
      ping = await client.ping();
    } catch (error) {
      return {
        name: 'redis',
        ok: false,
        store: this.driver.store,
        ignoreStoreOnFailure: !!this.driver.ignoreStoreOnFailure,
        error: error.message
      };
    }
    return {
      name: 'redis',
      ok: true,
      store: this.driver.store,
      ignoreStoreOnFailure: !!this.driver.ignoreStoreOnFailure,
      ping
    };
  }
}

/**
 * creates driver
 *
 * @param driver
 * @returns {RedisClient}
 */
module.exports = (driver) => {
  let redisConfig = buildRedisConfig(Object.assign({}, driver || {}, {
    showFriendlyErrorStack: true
  }));

  return new RedisClient(driver, redisConfig);
};

module.exports._buildRedisConfig = buildRedisConfig;
