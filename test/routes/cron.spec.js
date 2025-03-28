const
  request = require('supertest'),
  tbxlibs = require('../tbxlibs.test'),
  chai = require('chai');

const expect = chai.expect;
const config = tbxlibs.modules.config;
const ErrorAPI = tbxlibs.modules.ErrorAPI;
const apiVersions = config.swagger.basePath;

describe('Testing Router: /cron', function () {

  // request mock
  require("../mockRequests").init(before, after);

  let app;

  before(function () {
    app = require('../../src/app.js');

  });

  it('cron responde ok', async () => {
    return request(app)
      .post( apiVersions + '/cron/test' )
      .set('Authorization', config.api.key)
      .expect(200)
      .then( (res) => {
        expect(res.body.status).to.equal(true)
      });

  });

});
