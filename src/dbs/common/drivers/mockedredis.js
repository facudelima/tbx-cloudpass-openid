let db = {};

/**
 * limited redis mock
 */
let redis = {
  async exists(key) {
    return typeof db[key] !== 'undefined';
  },
  async set(key, val) { // TODO: TTL
    db[key] = val;
  },
  async get(key) {
    return db[key];
  },
  async del(key) {
    delete db[key];
  },
  async ping(str) {
    return str || 'PONG';
  }
};

class Mockedredis {
  constructor(config) {
    this.config = config;
    this.mock = true;
  }

  async connect() {
    return redis;
  }

  async getClient() {
    return this.connect();
  }

  async healthCheck() {
    return {
      name: 'redis',
      ok: true,
      ping: 'PONG'
    };
  }

  async resetMockedKeys() {
    db = {};
  }
}

module.exports = (driver) => {
  let config = require('./redis')._buildRedisConfig({...(driver || {})});
  return new Mockedredis(config);
};

/**
 * expose global method (for mocha)
 * @returns {Promise<void>}
 * @private
 */
module.exports.resetMockedKeys = async() => {
  db = {};
};

/**
 * clean up
 */
module.exports.testingTeardown = () => {
  if (redis && redis.end) {
    Promise.delay(300).then(() => {
      redis.end();
      redis = null;
    });
  }
};

/**
 *
 * @type {function(): null}
 */
module.exports.testInit = () => {};
