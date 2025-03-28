const request = require('supertest'),
  chai = require('chai'),
  should = chai.should(),

  tbxlibs = require('../tbxlibs.test'),
  config = tbxlibs.modules.config
  ;

const apiVersions = config.swagger.basePath;

describe('Router: /system', function () {

  require('../mockRequests').init(before, after);
  let app;

  before(function () {
    app = require('../../src/app.js');
  });

  describe('Test base', ()  => {

    it('responden ping', function (done) {

      request(app)
        .get(apiVersions + '/system/ping')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) throw err;
          should.exist(res.body);
          done();
        });

    });

    it('responden version', function (done) {

      request(app)
        .get(apiVersions + '/system/version')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) throw err;
          should.exist(res.body);
          done();
        });

    });
  });

  describe('Test cache', ()  => {
    it('clear cache', function (done) {

      request(app)
        .delete(apiVersions + '/system/cache')
        .set('Accept', 'application/json')
        .set('Authorization', config.api.key)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) throw err;

          should.exist(res.body);
          res.body.should.have.property('ok', true);

          done();
        });

    });

    it('responden cache', function (done) {

      request(app)
        .get(apiVersions + '/system/cache')
        .set('Accept', 'application/json')
        .set('Authorization', config.api.key)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) throw err;

          should.exist(res.body);
          res.body.should.have.property('ok', true);

          done();
        });

    });
  });

  describe('Test dbs', ()  => {
    it('responden check', function (done) {

      request(app)
        .get(apiVersions + '/system/check')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) throw err;

          should.exist(res.body);
          res.body.should.have.property('ok', true);

          done();
        });

    });

    it('responden fullcheck', function (done) {

      request(app)
        .get(apiVersions + '/system/fullcheck')
        .set('Accept', 'application/json')
        .set('Authorization', config.api.key)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) throw err;

          should.exist(res.body);

          res.body.should.have.property('ok', true);

          done();
        });

    });

  });

  describe('Test monitor', ()  => {

    before(() => {

    });

    it('responden monitoring', function (done) {

      request(app)
        .get(apiVersions + '/system/monitor')
        .set('Accept', 'application/json')
        .set('Authorization', config.api.key)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) throw err;

          should.exist(res.body);

          res.body.should.have.property('ok', true);

          done();
        });

    });

    it('responden monitoring clean', function (done) {

      request(app)
        .delete(apiVersions + '/system/monitor')
        .set('Accept', 'application/json')
        .set('Authorization', config.api.key)
        .expect(200)
        .expect('Content-Type', /json/)
        .end(function (err, res) {
          if (err) throw err;

          should.exist(res.body);

          res.body.should.have.property('ok', true);

          done();
        });

    });


    it('/changelog', function (done) {

      request(app)
        .get(apiVersions + '/system/changelog')
        .set('Accept', 'text/markdown')
        .set('Authorization', config.api.key)
        .expect(200)
        .expect('Content-Type', /markdown/)
        .end(function (err, res) {
          if (err) throw err;

          should.exist(res.body);

          done();
        });

    });


    it('/readme', function (done) {

      request(app)
        .get(apiVersions + '/system/readme')
        .set('Accept', 'text/markdown')
        .set('Authorization', config.api.key)
        .expect(200)
        .expect('Content-Type', /markdown/)
        .end(function (err, res) {
          if (err) throw err;

          should.exist(res.body);

          done();
        });
    });

    it('/node/version', function (done) {

      request(app)
        .get(apiVersions + '/system/readme')
        .set('Accept', 'text/markdown')
        .set('Authorization', config.api.key)
        .expect(200)
        .expect('Content-Type', /markdown/)
        .end(function (err, res) {
          if (err) throw err;

          should.exist(res.body);

          done();
        });
    });
  });
});

