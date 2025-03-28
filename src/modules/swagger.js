/**
 * swagger configs & utils
 *
 * @type {SwaggerParser|exports|module.exports}
 */
const
  swaggerJSDoc = require('swagger-jsdoc'),
  tbxlibs = require('./tbxlibs');

const { config, log } = tbxlibs.modules;
const { initialConfig } = config;

log.info('Loading swagger utils');

const swaggerDefinition = {
  openapi: config.swagger.openapi,
  servers: [
    {
      url: '{protocol}://' + config.swagger.host + config.swagger.basePath,
      variables: {
        protocol: {
          enum: config.swagger.schemes,
          // default https
          default: config.swagger.schemes[0]
        }
      }
    }
  ],
  info: {
    title: initialConfig.package.name,
    version: initialConfig.package.version,
    description: initialConfig.package.description
  }
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJSDoc(options);
