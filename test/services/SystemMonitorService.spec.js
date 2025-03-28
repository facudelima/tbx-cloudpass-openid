const chai = require("chai"),
  should = chai.should(),
  tbxlibs = require("../tbxlibs.test"),
  { ErrorAPI } = tbxlibs.modules;

describe("SystemMonitorService", () => {
  // request mock
  require("../mockRequests").init(before, after);

  let systemMonitorService;

  before(() => {
    // always creates a new instance
    systemMonitorService = require('../../src/services/systemMonitorService');

    should.exist(systemMonitorService);
  });

  it("acknowledge", async () => {

    await systemMonitorService.clearErrors();

    let result = await systemMonitorService.getLastsErrors();
    should.exist(result);
    result.should.have.property('length', 0);

    result = await systemMonitorService.runMonitorStatus();
    should.exist(result);
    result.should.have.property('ok', true);

    result = await systemMonitorService.acknowledgeError(ErrorAPI.error('errorDetails', ErrorAPI.codes.SYSTEM_ERROR),{param:1});
    should.exist(result);
    result.should.equal(true);

    result = await systemMonitorService.getLastsErrors();
    should.exist(result);
    result.should.have.property('length', 1);

    result = await systemMonitorService.acknowledgeError('anError',{param:2});
    should.exist(result);
    result.should.equal(true);

    result = await systemMonitorService.getLastsErrors();
    should.exist(result);
    result.should.have.property('length', 2);

    result = await systemMonitorService.runMonitorStatus();
    should.exist(result);
    result.should.have.property('ok', false);

    await systemMonitorService.clearErrors();
    result = await systemMonitorService.getLastsErrors();
    should.exist(result);
    result.should.have.property('length', 0);
  });

  it('Deletes errors by date', async () => {
    await systemMonitorService.acknowledgeError('An error',{param: 3});
    const startDate = new Date();
    // Delay a little bit to avoid registering the next error in same date as the variable in the upper line
    await new Promise((resolve, reject) => {
      setTimeout(() => resolve(true), 200);
    });
    await systemMonitorService.acknowledgeError('An error',{param: 4});

    let result = await systemMonitorService.getLastsErrors();
    should.exist(result);
    result.should.have.property('length', 2);

    await systemMonitorService.deleteErrorsByDate(startDate);
    result = await systemMonitorService.getLastsErrors();
    should.exist(result);
    result.should.have.property('length', 1);

    await systemMonitorService.clearErrors();
    result = await systemMonitorService.getLastsErrors();
    should.exist(result);
    result.should.have.property('length', 0);
  });
});
