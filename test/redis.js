// this file setups redis mock drivers

/**
 * mock init
 */
before(async () => {
  let ok = await require('../src/dbs/common/drivers/mockedredis').testInit()

  if (ok && require('./tbxlibs.test').modules.config.isTestEnv()) {
    //mongo ok, override
    let db = require('./tbxlibs.test').modules.config.db;
    for (let k in db) {
      if(db[k].driver === 'redis' || db[k].driver === 'REDIS_DRIVER') {
        db[k].driver = 'mockedredis';
      }
    }
  }
})

/**
 * force reset al keys after test
 */
// beforeEach(() => require('../src/dbs/common/drivers/mockedredis').resetMockedKeys());

/**
 * stop redis after suit
 */
after(async () => {
  await require('../src/dbs/common/drivers/mockedredis').testingTeardown()
})
