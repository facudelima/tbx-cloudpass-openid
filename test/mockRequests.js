const  path = require('path');

let mockRequestsFromBase = require('@tbx/node-sharedlib/test/mockRequests')

mockRequestsFromBase.addHandlersFromPath(path.join(__dirname, 'mocks'));

module.exports = {
  init: function (before, after) {
    mockRequestsFromBase.init(before, after);
  },
};
