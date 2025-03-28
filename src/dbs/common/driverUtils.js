/**
 * helper para crear clientes de distintas DB
 */
const
  fs = require('fs'),
  path = require('path'),
  driverBuilders = {};

fs
  .readdirSync(path.join(__dirname, 'drivers'))
  .forEach((file) => {
    const driverPath = path.join(__dirname, 'drivers', file);
    const driver = file.substr(0, file.indexOf('.')).toLowerCase();
    driverBuilders[driver] = require(driverPath);
  });

/**
 * add missing methods to drivers
 *
 * @type {{addDBChek: (function(*, *=): {healthCheck}|*), createStub: (function(*=): *), _builders: {}}}
 */
module.exports = {
  _builders: driverBuilders,
  /**
   * agrega el cks a la db
   * @param realDB
   * @param storeDriver
   * @param driver
   * @returns {*}
   */
  addDBChek(realDB, storeDriver) {
    if (!realDB.healthCheck) {
      realDB.dbHealthCheck = storeDriver.healthCheck.bind(storeDriver);
    }

    realDB.dbCheck = realDB.dbHealthCheck;

    return realDB;
  },

  /**
   * genera el driver
   * @param driver
   * @returns {*}
   */
  createStub(driver) {
    const builder = driverBuilders[driver.driver];

    if (!builder) {
      throw new Error('Invalid driver: ' + driver.driver);
    }

    const storeDriver = builder(driver);
    storeDriver._driver = driver;
    return storeDriver;
  }
};
