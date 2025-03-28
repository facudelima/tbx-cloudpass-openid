// this file setups mongodb mock drivers

/**
 * mock init
 */
before(async () => {
  let ok = await require('../src/dbs/common/drivers/mockedmongodb').testInit()

  if (ok && require('./tbxlibs.test').modules.config.isTestEnv()) {
    //mongo ok, override
    let db = require('./tbxlibs.test').modules.config.db;
    for (let k in db) {
      if(db[k].driver === 'mongodb' || db[k].driver === 'DB_MONGO_DRIVER') {
        db[k].driver = 'mockedmongodb';
      }
    }
  }
})

/**
 * force reset mongo db collections after test
 */
// beforeEach(() => require('../src/dbs/common/drivers/mockedmongodb')._resetMockedCollections());

/**
 * stop mongo after suit
 */
after(async () => {
  await require('../src/dbs/common/drivers/mockedmongodb').testingTeardown()
})

