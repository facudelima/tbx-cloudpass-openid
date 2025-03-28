const
  fs = require('fs-extra'),
  path = require('path'),
  mockery = require('mockery'),
  chai = require('chai'),
  should = chai.should()
  ;

var rmdir = function (dir) {
  var list = fs.readdirSync(dir);
  for (var i = 0; i < list.length; i++) {
    var filename = path.join(dir, list[i]);
    var stat = fs.statSync(filename);

    if (filename === '.' || filename === '..') {
      // pass these files
    } else if (stat.isDirectory()) {
      // rmdir recursively
      rmdir(filename);
    } else {
      // rm fiilename
      fs.unlinkSync(filename);
    }
  }
  fs.rmdirSync(dir);
};

describe('DB: Driver utils', function () {

  require('./../mockRequests').init(before, after);
  var
    storeUtils = require('../../src/dbs/common/storeUtils'),
    driverUtils = require('../../src/dbs/common/driverUtils');

  before(function (done) {

    mockery.enable({
                     warnOnReplace: false,
                     warnOnUnregistered: false,
                     useCleanCache: true
                   });

    fs.copy(__dirname + '/mockDB', 'src/dbs', done);
  });


  after(function () {
    rmdir('src/dbs/mock');
    mockery.disable();
  });

  describe('storeUtils', function () {
    this.timeout(5000);

    it('createDB check errors', function (done) {

      (function () {
        storeUtils.createDB({}, {});
      }).should.throw();

      (function () {
        storeUtils.createDB({store: 'test'}, {});
      }).should.throw();

      (function () {
        storeUtils.createDB({
          store: 'test',
          driver: 'baddriver'
        }, {});
      }).should.throw();
      done();
    });

    Object.keys(driverUtils._builders).forEach(function (name) {

      it(name + ': createDB and check exist the dbHealthCheck method', function (done) {
        var driver = {
          'driver': name,
          'store': 'mock'
        };

        (function () {
          storeUtils.createDB(driver, {
            badMethod: 'no method'
          });
        }).should.throw();

        var store = storeUtils.createDB(driver, {});

        should.exist(store);
        should.exist(store.dbHealthCheck);
        should.exist(store.dbHealthCheck().then);

        done();
      });
    });

    it('addMethods', function (done) {

      var db = {};
      storeUtils.addMethods(db, {
        m1: function () {
        },
        m2: function () {
        }
      });
      should.exist(db.m1);

      (function () {
        storeUtils.addMethods(db, {
          m1: function () {
          },
          m2: function () {
          }
        });
      }).should.throw();
      done();

    });
  });
});
