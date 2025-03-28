const
  storeUtils = require('./common/storeUtils'),
  tbxlibs = require('../modules/tbxlibs');

const
  config = tbxlibs.modules.config;

/**
 * Use this form of driver whit
 */
class SysMonitorStore {
  constructor(driver) {
    this.storeDriver = driver;
  }

  // private, never expose storeDriver methods
  _getCollection() {
    return this.storeDriver.getCollection('sysMonitor');
  }

  /**
   *
   * @param fromDate {Date}
   * @returns {Promise<*>}
   */
  async findErrors(fromDate, resolved = false) {
    const col = await this._getCollection();
    let result = await col.find({resolved, created: {$gt: fromDate}})
      .sort({_id: -1})
      .limit(100)
      .toArray();

    return result.map(r => {
      // hide db specific properties
      delete r._id;
      return r;
    });
  }

  async getTotalErrorCount() {
    const col = await this._getCollection();
    return col.countDocuments({});
  }

  async saveError(error) {
    const col = await this._getCollection();
    await col.insertOne(error);
    return true;
  }

  async clearErrors() {
    const col = await this._getCollection();
    await col.updateMany({resolved: false}, {$set: {resolved: true, resolvedDate: new Date()}});
    return true;
  }

  async deleteErrorsByDate(from) {
    const col = await this._getCollection();
    await col.deleteMany({ created: { $lte: from } });
    return true;
  }
}

/**
 *
 * @type {TestMongoStore}
 */
module.exports = new SysMonitorStore(storeUtils.createDirectDriver(config.db.sysMonitor));
tbxlibs.services.systemService.register(this, 'SysMonitorStore');
