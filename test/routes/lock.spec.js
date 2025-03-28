const
  request = require('supertest'),
  tbxlibs = require('../tbxlibs.test'),
  chai = require('chai'),
  Promise = require('bluebird');

const expect = chai.expect;
const config = tbxlibs.modules.config;
const ErrorAPI = tbxlibs.modules.ErrorAPI;
const apiVersions = config.swagger.basePath;

describe('Testing Router: /lock', function () {

  // request mock
  // require("../mockRequests").init(before, after);

  let app;

  before(function () {
    app = require('../../src/app.js');
  });

  afterEach(() => new Promise(resolve => setTimeout(resolve, 200)));

  describe('simple test', function() {
    async function mktest(path) {
      let re1 = await request(app)
        .post( apiVersions + '/lock' + path )
        .set('Authorization', config.api.key)
        .expect(200);

      expect(re1.body.ok).to.equal(true);
    }
    it('/ ok', async () => mktest('?uniqueParam=123'));

    it('simple ok', async () => mktest('/simple?uniqueParam=123'));

    it('postProcess ok', async () => mktest('/postProcess?uniqueParam=123'));

    it('ttl ok', async () => mktest('/ttl?uniqueParam=123'));
  })

  it('lock await', async () => {
    let [re1, re2, re3,re4] = await Promise.all([
      request(app)
        .post( apiVersions + '/lock/ttl?uniqueParam=uniqueParamttl' )
        .set('Authorization', config.api.key)
        .expect(200),
      Promise.delay(100).then(() => request(app)
        .post( apiVersions + '/lock/ttl?uniqueParam=uniqueParamttl' )
        .set('Authorization', config.api.key)
        .expect(200)),
      // key is by-path
      Promise.delay(150).then(() => request(app)
        .post( apiVersions + '/lock/ttl?uniqueParam=uniqueParamttl' )
        .set('Authorization', config.api.key)
        .expect(200)),
      Promise.delay(150).then(() => request(app)
        .post( apiVersions + '/lock/ttl?uniqueParam=uniqueParamttl123' )
        .set('Authorization', config.api.key)
        .expect(200))
    ]);

    expect(re1.body.ok).to.equal(true)
    expect(re2.body.ok).to.equal(true)
    expect(re3.body.ok).to.equal(true)
    expect(re4.body.ok).to.equal(true)
  });

  it('lock reject', async () => {

    let [re1, re2, re3,re4] = await Promise.all([
      request(app)
        .post( apiVersions + '/lock?uniqueParam=uniqueParam' )
        .set('Authorization', config.api.key)
        .expect(200),
      Promise.delay(100).then(() => request(app)
        .post( apiVersions + '/lock?uniqueParam=uniqueParamXX' )
        .set('Authorization', config.api.key)
        .expect(200)),
      // key is by-path
      Promise.delay(200).then(() => request(app)
        .post( apiVersions + '/lock?uniqueParam=uniqueParam' )
        .set('Authorization', config.api.key)
        .expect(200)),
      Promise.delay(205).then(() => request(app)
        .post( apiVersions + '/lock?uniqueParam=uniqueParam' )
        .set('Authorization', config.api.key)
        .expect(409))
    ]);

    expect(re1.body.ok).to.equal(true)
    expect(re2.body.ok).to.equal(true)
    expect(re3.body.ok).to.equal(true)
  });

});
