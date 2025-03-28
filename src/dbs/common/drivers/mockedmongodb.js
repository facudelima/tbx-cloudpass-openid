const
  fs = require('fs'),
  path = require('path'),
  Promise = require('bluebird');

let mongod = null;
const mockedCollectionsPath = path.resolve(__dirname, '..', '..', '..', '..', 'test', 'dbs', 'mockedmongodb');
let mongoBin = null;

let stub = {
  mock: true,
  filePostfix: 'Mongodb',

  healthCheck: () => {
    return Promise.resolve({
      mock: true,
      ok: true
    });
  },

  async _createClient(uri) {
    const MongoClient = require('mongodb').MongoClient;
    this.client = await new Promise((resolve, reject) => MongoClient.connect(uri, (err, db) => {
      if (err) {
        return reject(err);
      }
      resolve(db);
    }));

    this._db = await this.client.db();
    if (mongod) {
      this._db._testUri = await mongod.getUri();
      this._db._mongoBin = mongoBin;
    }
  },

  async getDB() {
    if (!this.client) {
      let mongod = await testInit();
      if (!mongod) {
        throw new Error('Fail to create mongodb in memory');
      }
      await this._createClient(await mongod.getUri());
    }
    return this._db;
  },

  async getCollection(collection) {
    if (!collection) {
      throw Error('Invalid collection name ' + collection);
    }
    let db = await this.getDB();

    return db.collection(collection);
  },

  /**
   * reset all declared collections
   * @returns {bluebird<void>}
   * @private
   */
  async _resetMockedCollections() {
    await Promise.all(fs.readdirSync(mockedCollectionsPath).map(async f => {
      if (!f.endsWith('.json')) {
        // next
        return;
      }
      let input = require(path.join(mockedCollectionsPath, f));
      let collection = path.parse(f).name;

      let col = await this.getCollection(collection);

      await col.deleteMany({});

      if (Array.isArray(input)) {
        if (input.length) {
          await col.insertMany(input);
        }
      } else {
        await col.insertOne(input);
      }
    }));

    // call extra logic
    await require(path.join(mockedCollectionsPath, 'setup'))(await this.getDB());
  }
};

/**
 * create main mongoDb stub
 * @returns {bluebird<null>}
 */
async function testInit() {
  if (!mongod) {
    try {
      const {MongoMemoryServer, MongoBinary} = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      mongoBin = await MongoBinary.getPath();
      await stub._createClient(await mongod.getUri());
      await stub._resetMockedCollections();
    } catch (e) {
      console.info('mongodb-memory-server error', e.message);
    }
  }

  return mongod;
}

/**
 * factory func
 *
 * @param config
 * @returns {
 * {
 * getCollection(*): bluebird<*>, _
 * resetMockedCollections(): bluebird<void>,
 * healthCheck: function(): *,
 * mock: boolean,
 * getDB(): bluebird<*>}
 * }
 */
module.exports = (config) => {
  return {...stub};
};

/**
 * expose global method (for mocha)
 * @returns {bluebird<void>}
 * @private
 */
module.exports._resetMockedCollections = async() => {
  if (mongod) {
    await stub._resetMockedCollections();
  }
};

/**
 * clean up
 */
module.exports.testingTeardown = () => {
  if (mongod && mongod.stop) {
    Promise.delay(300).then(() => mongod.stop());
  }
};

/**
 *
 * @type {function(): null}
 */
module.exports.testInit = testInit;
