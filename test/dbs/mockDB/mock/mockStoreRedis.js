/**
 * mock db para test local y unitarios
 *
 * @type {*|exports|module.exports}
 */
/////////  setup mock info
const mock = require('./mocks/main.json');

////////////

const dbAPI = {};


module.exports = function () {
  return dbAPI;
};

module.exports.mock = mock;
