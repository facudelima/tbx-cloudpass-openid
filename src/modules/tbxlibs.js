/**
 *
 * Usar como boostrap en las app
 *
 */

const path = require('path');

const SharedLib = require('@tbx/node-sharedlib');

const lib = new SharedLib();

// conf & load
lib.on(lib.events.PRE_LOAD_CONFIG, (initialConfig) => {
  // change/add config
  if (process.env.NODE_ENV === 'test') {
    // add ENVS
    process.env.TBX_EXTERNAL_SERVICE_API = 'http://external.mock/v1';
    process.env.TBX_EXTERNAL_SERVICE_API_KEY = 1234;

    process.env.TBX_SHOW_API_DOCS = 'true';

    process.env.REDIS_DRIVER = 'mockedredis';
    process.env.DB_ELASTICSEARCH_DRIVER = 'mock';
    process.env.DB_PG_DRIVER = 'mock';
    process.env.DB_MONGO_DRIVER = 'mockedmongodb';
  }

  process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'none';

  // for node 18+
  process.env.TBX_HTTP_LIB = process.env.TBX_HTTP_LIB || 'undici';
});

lib.on(lib.events.LOAD_CONFIG, config => {
  // change/add config
});

lib.on(lib.events.LOAD_ERROR_MODULES, (ErrorApi) => {
  // change or add ErrorApi

  // HTTP_CODE: 400,401,500, etc
  // CUSTOM_CODE -> 3 leter code + 3 digits, 3 letters shoul represent the api
  // CUSTOM_KEY -> an unique key to use this error like: ErrorAPI.throw('a message', ErrorAPI.codes.CUSTOM_KEY);

  // ej: ErrorApi.addErrorCode(HTTP_CODE', 'CUSTOM_KEY (ie: API_INTERNAL_ERROR)',
  //        'CUSTOM_CODE (ie; API-001)', 'Custom message');

  ErrorApi.addErrorCode(500, 'TEST_EXTERNAL_ERROR', 'API-001', 'An error description - TEST_EXTERNAL_ERROR');
  ErrorApi.addErrorCode(409, 'REQ_LOCK_FAIL', 'API-409', 'An error by req lock');
});

lib.on(lib.events.LOAD, sharedLib => {
  // change sharedLib modules

});

// config path
let configsPath = [path.join(__dirname, '..', 'config')];

let configExtra = {
  package: require('../../package.json')
};

module.exports = lib.loadAll({ configExtra, configsPath });
