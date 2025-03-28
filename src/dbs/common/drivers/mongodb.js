const
  tbxlibs = require('../../../modules/tbxlibs');

const { config, ErrorApi, log } = tbxlibs.modules;

const clients = {};

/**
 * Base mongodb drivers utils
 *
 */
class MongoDBClient {
  constructor(driver, config) {
    this.driver = driver;
    this.config = config;
  }

  async close() {
    const client = clients[this.driver.url];
    if (client && client.close) {
      await client.close();
    }
    return true;
  }

  async connect() {
    return tbxlibs.modules.promisesHelper.fromCallback((callback) => {
      const MongoClient = require('mongodb').MongoClient;
      MongoClient.connect(this.driver.url, this.driver.settings || {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }, callback);
    });
  }

  async getDB() {
    const client = clients[this.driver.url];
    if (client) {
      return client;
    } else {
      return this.connect()
        .then(connection => (clients[this.driver.url] = connection.db.bind(connection)()));
    }
  }

  async getCollection(collection) {
    collection = collection || this.driver.store;
    if (!collection) {
      throw ErrorApi.error('Invalid collection name', ErrorApi.codes.SYSTEM_DB_ERROR);
    }

    return this.getDB().then(db => db.collection(collection));
  }

  async _sendPing(db) {
    if (db.admin && db.admin().ping) {
      await db.admin().ping();
    } else if (db.runCommand) {
      await db.runCommand({ ping: 1 });
    } else {
      let col = await this.getCollection('test');
      await col.findOne({});
    }
  }

  async healthCheck() {
    let db;
    try {
      db = await this.getDB();
      await this._sendPing(db);
    } catch (e) {
      log.error('Mongo check error', e);
      return {
        ok: false,
        error: e.message,
        ignoreStoreOnFailure: !!this.driver.ignoreStoreOnFailure,
        store: this.driver.store
      };
    }

    return {
      ok: true,
      ignoreStoreOnFailure: !!this.driver.ignoreStoreOnFailure,
      store: this.driver.store
    };
  }
}

/**
 * creates driver
 *
 * @param driver
 * @returns {MongoDBClient}
 */
module.exports = (driver) => {
  if (!driver.store) {
    throw ErrorApi.error('Invalid database configuration the "store" must be setted', ErrorApi.codes.SYSTEM_DB_ERROR);
  }

  return new MongoDBClient(driver, config);
};
