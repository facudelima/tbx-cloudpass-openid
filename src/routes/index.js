/**
 * express js, rutas de /
 *
 * @type {*|exports|module.exports}
 */
const express = require('express'),
  router = express.Router();
const
  tbxlibs = require('../modules/tbxlibs');

const { config } = tbxlibs.modules;
const openidRoutes = require('./openid');

/**
 * @openapi
 * components:
 *   schemas:
 *     Error:
 *       required:
 *         - code
 *       type: object
 *       properties:
 *         code:
 *           type: string
 *           description: Unique error code
 *         message:
 *           type: string
 *           description:  Error message
 *
 *     SimpleStatus:
 *       required:
 *         - status
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *
 *     SimpleBooleanStatus:
 *       required:
 *         - status
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 */

router.get('/', (req, res) => {
  const { initialConfig } = config;

  res.send({
    title: initialConfig.package.description || initialConfig.package.name,
    version: initialConfig.package.version
  });
});

// Registrar las rutas de OpenID directamente en la raíz
router.use('/', openidRoutes);

module.exports = router;
