module.exports = {
  name: 'external Service',
  canHandle: (url) => {
    let api = require('../tbxlibs.test').modules.config.externalService.api;
    return (url && url.startsWith(api))
  },
  handle: async (options) => {
    let path = options.uri.substr(require('../tbxlibs.test').modules.config.externalService.api.length);

    if(path == '/echo') {
      return {
        text: (options.qs || {}).text || 'empty',
        mock: true
      }
    }
    if(path == '/system/ping') {
      return {
        ok: true,
        date: new Date().toISOString(),
        mock: true
      };
    }

    throw new Error('Invalid url for mock: ' + options.uri);
  }
};
