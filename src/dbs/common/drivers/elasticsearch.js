/**
 * ElasticSearch base driver
 *
 */
class ElasticSearch {
  constructor(connectionOptions) {
    this.client = null;
    this.connectionOptions = connectionOptions;

    if (connectionOptions.host && !Array.isArray(connectionOptions.host)) {
      connectionOptions.host = connectionOptions.host.split(',');
    }
  }

  getClient() {
    if (!this.client) {
      const elasticsearch = require('elasticsearch');
      this.client = new elasticsearch.Client(this.connectionOptions);
    }
    return this.client;
  }

  search(query) {
    return this.getClient().search(query);
  }

  searchThroughStream(query) {
    const ElasticsearchScrollStream = require('elasticsearch-scroll-stream');
    return new ElasticsearchScrollStream(this.getClient(), query);
  }

  async connect() {
    this.healthCheck();
    return this;
  }

  async healthCheck() {
    const client = this.getClient();
    return {
      ok: await client.ping(),
      driver: 'elasctic',
      name: this.connectionOptions.store || 'elastic'
    };
  }
}

/**
 * creates driver
 *
 * @param config
 * @returns {ElasticSearch}
 */
module.exports = (config) => new ElasticSearch(config);
