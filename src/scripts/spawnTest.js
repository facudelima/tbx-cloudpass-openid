const
  tbxLibs = require('../modules/tbxlibs'),
  log = tbxLibs.modules.logger,
  argv = require('yargs').argv,
  apm = tbxLibs.modules.apm;

log.debug('spawn test - App params:', argv);

/**
 * call main services & logic from here
 * @returns {Promise<void>}
 */
async function main() {
  log.info('called', argv);
  // do some work
}

// add APM transaction info
apm.startBackgroundTransaction('cron:someID', main)
  .catch(err => {
    // catch & log
    log.error('cron:someID fail', {argv, err});
  })
  .then(() => log.info('ps finish'))
  // ensure to save transaction info
  .then(() => apm.shutdown())
  // close process & resources
  .finally(() => process.exit());
