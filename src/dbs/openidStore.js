const config = require('../config/openid.json');

/**
 * Almacén de datos en memoria para OpenID
 */
class OpenIDStore {
  constructor() {
    // Almacenamiento en memoria
    this.storage = {
      authCodes: new Map(),
      refreshTokens: new Map()
    };

    // Prefijos para las claves
    this.prefixes = {
      authCode: 'auth_code:',
      refreshToken: 'refresh_token:'
    };
  }

  /**
   * Almacena un código de autorización
   * @param {String} code - Código de autorización
   * @param {Object} data - Datos asociados al código
   * @returns {Promise<Boolean>} - Resultado de la operación
   */
  async storeAuthCode(code, data) {
    const key = this.prefixes.authCode + code;

    try {
      this.storage.authCodes.set(key, {
        data: JSON.stringify(data),
        expiry: Date.now() + 600000 // 10 minutos en milisegundos
      });
      return true;
    } catch (error) {
      console.error('Error al almacenar código de autorización:', error);
      return false;
    }
  }

  /**
   * Obtiene los datos asociados a un código de autorización
   * @param {String} code - Código de autorización
   * @returns {Promise<Object|null>} - Datos asociados al código o null si no existe
   */
  async getAuthCode(code) {
    const key = this.prefixes.authCode + code;

    try {
      const entry = this.storage.authCodes.get(key);

      if (!entry) {
        return null;
      }

      // Verificar si ha expirado
      if (entry.expiry < Date.now()) {
        this.storage.authCodes.delete(key);
        return null;
      }

      return JSON.parse(entry.data);
    } catch (error) {
      console.error('Error al obtener código de autorización:', error);
      return null;
    }
  }

  /**
   * Elimina un código de autorización
   * @param {String} code - Código de autorización
   * @returns {Promise<Boolean>} - Resultado de la operación
   */
  async removeAuthCode(code) {
    const key = this.prefixes.authCode + code;

    try {
      this.storage.authCodes.delete(key);
      return true;
    } catch (error) {
      console.error('Error al eliminar código de autorización:', error);
      return false;
    }
  }

  /**
   * Almacena un token de refresco
   * @param {String} token - Token de refresco
   * @param {Object} data - Datos asociados al token
   * @returns {Promise<Boolean>} - Resultado de la operación
   */
  async storeRefreshToken(token, data) {
    const key = this.prefixes.refreshToken + token;
    const ttl = config.refreshTokenExpiry || 86400; // 24 horas por defecto

    try {
      this.storage.refreshTokens.set(key, {
        data: JSON.stringify(data),
        expiry: Date.now() + (ttl * 1000) // Convertir segundos a milisegundos
      });
      return true;
    } catch (error) {
      console.error('Error al almacenar token de refresco:', error);
      return false;
    }
  }

  /**
   * Obtiene los datos asociados a un token de refresco
   * @param {String} token - Token de refresco
   * @returns {Promise<Object|null>} - Datos asociados al token o null si no existe
   */
  async getRefreshToken(token) {
    const key = this.prefixes.refreshToken + token;

    try {
      const entry = this.storage.refreshTokens.get(key);

      if (!entry) {
        return null;
      }

      // Verificar si ha expirado
      if (entry.expiry < Date.now()) {
        this.storage.refreshTokens.delete(key);
        return null;
      }

      return JSON.parse(entry.data);
    } catch (error) {
      console.error('Error al obtener token de refresco:', error);
      return null;
    }
  }

  /**
   * Elimina un token de refresco
   * @param {String} token - Token de refresco
   * @returns {Promise<Boolean>} - Resultado de la operación
   */
  async removeRefreshToken(token) {
    const key = this.prefixes.refreshToken + token;

    try {
      this.storage.refreshTokens.delete(key);
      return true;
    } catch (error) {
      console.error('Error al eliminar token de refresco:', error);
      return false;
    }
  }
}

module.exports = new OpenIDStore();
