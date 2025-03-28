const
  {subHours, startOfHour} = require('date-fns'),
  tbxlibs = require('../modules/tbxlibs'),
  sysMonitorStore = require('../dbs/sysMonitorStore');

const {log, config, ErrorAPI} = tbxlibs.modules,
  {systemService} = tbxlibs.services;

const ERROR_LIMIT = 100;

/**
 * The service keeps tracks of /monitor errors.
 * Note: it might be several services to handle runMonitorStatus(). This is just a particular case for simple services
 */
class SystemMonitorService {
  /**
   * adds a new error to show in /monitor
   * @param stringOrApiError
   * @param detailsObj
   * @returns {Promise<boolean>}
   */
  async acknowledgeError(stringOrApiError, detailsObj = {}) {
    let error = {
      created: new Date(),
      info: detailsObj,
      resolved: false
    };

    if (ErrorAPI.isApiError(stringOrApiError)) {
      error.code = stringOrApiError.code;
      error.message = stringOrApiError.message;
      error.details = stringOrApiError.details;
    } else {
      error.message = stringOrApiError.message || stringOrApiError;
    }

    log.info('SystemMonitorService.acknowledgeError', error);
    await sysMonitorStore.saveError(error);

    return true;
  }

  /**
   * get the last errors (it uses monitorIntervalInHours configs)
   * @returns {Promise<*>}
   */
  async getLastsErrors() {
    let from = subHours(startOfHour(new Date()), config.systemMonitorService.monitorIntervalInHours);

    return sysMonitorStore.findErrors(from, false);
  }

  /**
   * clear all errors in /monitor
   * @returns {Promise<boolean>}
   */
  async clearErrors() {
    await sysMonitorStore.clearErrors();
    return true;
  }

  async deleteErrorsByDate(from) {
    await sysMonitorStore.deleteErrorsByDate(from);
    return true;
  }

  /**
   * this method is for /monitor
   * @returns {Promise<{name: string, ok: boolean, info: {errorsCount, errors: *}}>}
   */
  async runMonitorStatus() {
    const totalErrorsCount = await sysMonitorStore.getTotalErrorCount();
    let errors = await this.getLastsErrors();

    return {
      ok: !errors.length,
      name: 'SystemMonitorService',
      info: {
        description: `Information about general errors. ` +
          `A maximum of ${ERROR_LIMIT} errors are shown, please review the service's database to view more if needed.`,
        errorsCount: totalErrorsCount,
        errors
      }
    };
  }
}

module.exports = new SystemMonitorService();
// export the class (useful in test)
module.exports._class = SystemMonitorService;

// create a system reference
systemService.register(module.exports, 'SystemMonitorService');
