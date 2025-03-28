/**
 * mock db para test local y unitarios
 *
 * @type {*|exports|module.exports}
 */
const
  Promise = require('bluebird');
/*
  tbxlibs = require('./../../../tbxlibs.test'),
  log = tbxlibs.modules.log,
  ErrorAPI = tbxlibs.modules.ErrorAPI;
*/

/////////  setup mock info
const mock = require('./mocks/main.json');

////////////

const dbAPI = {
  findClient: (id) => {
    return Promise.try(() => {

      // log.info('find mock client', id);

      if (mock.clients && mock.clients[id]) {
        return mock.clients[id];
      }

      throw new new Error('Invalid mock client');

     //  ErrorAPI.throw('Invalid mock client', ErrorAPI.codes.SYSTEM_ERROR);
    });
  }
};


module.exports = () => {
  return dbAPI;
};

module.exports.mock = mock;
