const
  request = require('supertest'),
  tbxlibs = require('../tbxlibs.test');

const config = tbxlibs.modules.config;

const apiVersions = config.swagger.basePath;

describe('Testing Router: /docs', function () {

  let app;

  before(function () {
    app = require('../../src/app.js');

  });


  it( 'bad route responde 404', function (done) {

    request(app)
      .get( apiVersions + '/notexist' )
      .expect(404)
      .end(function (err) {
        if (err) throw err;

        done();
      });

  });

  const test = route => {

    it( route + ' responde ok', function (done) {

      request(app)
        .get( route )
        .expect(200)
        .end(function (err) {
          if (err) throw err;

          done();
        });

    });
  };

  describe('Test #GET de /swagger.json', function () {
    test('/swagger.json');
  });

  test('/');

});
