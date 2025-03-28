const express = require('express'),
  router = express.Router(),

  tbxlibs = require('../modules/tbxlibs'),
  systemMonitorService = require('../services/systemMonitorService');

const {apiKey, apm, log} = tbxlibs.modules;

/**
 * @openapi
 * /cron/test:
 *   post:
 *     tags:
 *       - Crons
 *     summary: Test Cron
 *     operationId: testCron
 *     responses:
 *       '200':
 *         description: Request was successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SimpleStatus'
 *       '400':
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BadRequest'
 *             examples:
 *               Invalid Parameters:
 *                 value:
 *                   code: TEST-002
 *                   message: 'Message may vary depending on the parameter'
 *       '500':
 *         description: SYSTEM ERROR
 *         content:
 *           application/json:
 *             examples:
 *               internal error:
 *                 value:
 *                   code: TEST-003
 *                   message: Internal server error
 *     security:
 *       - api_key: []
 */

router.post('/test', apiKey, (req, res) => {
  // do something in bg. dot use await!
  apm.startBackgroundTransaction('TestService:cron', async() => {
    try {
      // main services call goes here (await result)
      // await someService.doSomethingExpensive()
    } catch (e) {
      // add error to /monitor
      await systemMonitorService.acknowledgeError(e, {cronId: 'cron:test'});
      // notice apm
      throw e;
    }
  })
    // mem clearing
    .then(() => null)
    // remember to handle errors
    .catch(e => {
      // log failures
      log.warn('test cron fail', e);
    });

  res.send({
    status: true
  });
});

module.exports = router;
