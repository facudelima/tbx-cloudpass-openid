/**
 * mock drivers. for test
 *
 * @param config
 * @returns {{healthCheck: (function(): Promise<{driver, mock: boolean, ok: boolean}>), mock: boolean, config}}
 */
module.exports = (config) => {
  return {
    config,
    mock: true,

    healthCheck: () => {
      return Promise.resolve({
        driver: config,
        mock: true,
        ok: true
      });
    }
  };
};
