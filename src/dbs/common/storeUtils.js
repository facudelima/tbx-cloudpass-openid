const
  path = require('path'),
  driverUtils = require('./driverUtils'),
  tbxlibs = require('../../modules/tbxlibs');
const
  { ErrorAPI, log, config } = tbxlibs.modules,
  { systemService } = tbxlibs.services;

const capitalize = (s) => s && s[0].toUpperCase() + s.slice(1);

/**
 * helps to create stores
 */
class StoreUtils {
  /**
   * Validates store methods
   *
   * @param fName
   * @param firm
   * @returns {function|*}
   */
  mustExists(realDB, fName, firm) {
    if (!realDB[fName]) {
      const errorMessage = `Invalid: ${realDB._name} must have
      function: ${fName}, firm: '${firm}, driver: ${realDB._driver.driver}`;

      log.error(errorMessage, '---', realDB._driver, ', mus have methods', realDB._methods);

      ErrorAPI.throw(
        errorMessage,
        ErrorAPI.codes.SYSTEM_DB_ERROR);
    }

    return true;
  }

  createDirectDriver(storeConfig) {
    let realDB = driverUtils.createStub(storeConfig);

    if (realDB.connect && !config.isTestEnv()) {
      process.nextTick(() => realDB.connect());
    }

    // ensure base methods
    realDB.dbCheck = realDB.dbCheck || realDB.dbHealthCheck || realDB.healthCheck;
    if (!realDB.dbCheck && realDB._dirver?.healthCheck) {
      realDB.dbCheck = realDB._dirver.healthCheck.bind(realDB._dirver);
    }
    realDB.healthCheck = realDB.dbCheck;

    // if store fails, service *is not restarted*, it enters a close and reconnect state
    if (storeConfig.ignoreStoreOnFailure) {
      realDB = this.createIgnoreStoreOnFailureSafeguard(realDB, storeConfig);
      this.createIgnoreStoreOnFailureSafeguardMonitor(realDB, storeConfig);
    }

    systemService.registerIfNotPresent(realDB, `${storeConfig.store}:${storeConfig.driver}`);

    return realDB;
  }
  createIgnoreStoreOnFailureSafeguardMonitor(realDB, storeConfig) {
    if (realDB.runMonitorStatus) {
      // use default
      return;
    }

    realDB.runMonitorStatus = async() => {
      return {
        ok: !realDB._lastConectionError,
        name: storeConfig.name,
        info: {
          description: 'automatic monitor added by ignoreStoreOnFailure=true',
          lastError: realDB._lastConectionError
        }
      };
    };
  }
  createIgnoreStoreOnFailureSafeguard(realDB, storeConfig) {
    const realHealthCheck = realDB.healthCheck.bind(realDB);
    let timer = null;
    const recover = async() => {
      try {
        await realDB.connect();
      } catch (e) {}
      timer = null;
    };
    const healthCheck = async() => {
      let result;
      try {
        result = await realHealthCheck();
      } catch (e) {
        log.error(`db store fail to check ${storeConfig.name}, ok forced ${e.message}`, {storeConfig, err: e});
      }
      if (!result.ok && !timer) {
        realDB._lastConectionError = new Date();
        log.warn(`store cron recover ${storeConfig.name}`);
        if (realDB.close) {
          try {
            await realDB.close();
          } catch (e) {}
        }
        timer = setTimeout(recover, 2000);
      } else if (result.ok) {
        realDB._lastConectionError = null;
      }
      return {...result, originalOk: result.ok, ok: true, ignoreStoreOnFailure: true}; // always ok
    };
    realDB.healthCheck = realDB.dbCheck = healthCheck;
    return realDB;
  }

  createDB(driver, methods) {
    log.info('Usign', driver, 'for', driver.store, 'Store');
    this.checkDriver(driver);
    // load db
    const storeDriver = driverUtils.createStub(driver);
    const realDBBuilder = this.requireRealDBBuilder(driver.store, driver, storeDriver);
    const realDB = realDBBuilder(storeDriver, driver.store);

    realDB._name = driver.store;
    realDB._driver = driver.driver;
    realDB._storeDriver = storeDriver;
    realDB._methods = methods;
    Object.keys(methods).forEach((fName) => this.mustExists(realDB, fName, methods[fName]));
    driverUtils.addDBChek(realDB, storeDriver, driver);

    if (realDB.connect && !config.isTestEnv()) {
      process.nextTick(() => realDB.connect());
    }

    return realDB;
  }

  checkDriver(driver) {
    if (!driver.store) {
      throw new Error('Invalid store: ' + driver.store);
    }

    if (!driver.driver) {
      throw new Error('Invalid store driver: ' + driver.driver);
    }
  }

  requireRealDBBuilder(name, driver, storeDriver) {
    let realDBBuilder = null;
    let filePostfix = storeDriver.filePostfix || capitalize(driver.driver);

    try {
      realDBBuilder = require(path.join(__dirname, '..', name, name + 'Store' + filePostfix));
    } catch (e) {
      log.error('error loading store', e);
      throw new Error('Invalid store file: ' + (name + 'Store' + filePostfix));
    }

    if (typeof realDBBuilder !== 'function') {
      log.error('Invalid DB builder method for', driver, 'for', name, 'Store');
      throw new Error('Invalid DB builder method for ' + name);
    }

    return realDBBuilder;
  }

  addMethods(db, obj) {
    Object.keys(obj).forEach((m) => {
      if (db[m]) {
        ErrorAPI.throw(
          'Method exist in original store: ' + m + ', store: ' + db._name,
          ErrorAPI.codes.SYSTEM_DB_ERROR);
      }
      db[m] = obj[m];
    });

    return db;
  }
}

module.exports = new StoreUtils();
