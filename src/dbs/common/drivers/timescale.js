/**
 * base timescale & pg db driver
 *
 */
class TimescaleClient {
  constructor(conf) {
    this.conf = conf;
  }

  connect() {
    if (!this.pool) {
      const { Pool } = require('pg');
      this.pool = new Pool(this.conf);
    }

    return this.pool.connect();
  }

  async query(text, values) {
    const client = await this.connect();
    try {
      return await client.query(text, values);
    } finally {
      client.release();
    }
  }

  async healthCheck() {
    try {
      await this.query('SELECT NOW()');
    } catch (e) {
      return {
        ok: false,
        name: this.conf.store || 'timescale',
        driver: 'timescale',
        error: e.message
      };
    }

    return {
      name: this.conf.store || 'timescale',
      driver: 'timescale',
      ok: true
    };
  }
}

/**
 * create driver
 *
 * @param conf
 * @returns {TimescaleClient}
 */
module.exports = conf => new TimescaleClient(conf);
