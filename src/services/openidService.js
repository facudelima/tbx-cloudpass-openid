const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/openid.json');
const openidStore = require('../dbs/openidStore');

/**
 * Servicio para manejar la funcionalidad de OpenID
 */
class OpenIDService {
  constructor() {
    this.tokenConfig = {
      accessTokenExpiry: config.accessTokenExpiry || 600, // 10 minutos por defecto
      refreshTokenExpiry: config.refreshTokenExpiry || 86400, // 24 horas por defecto
      issuer: config.issuer || 'cloudpass-automation',
      audience: config.audience || 'cloudpass-clients',
      algorithm: 'HS256',
      secretKey: config.secretKey || crypto.randomBytes(64).toString('hex')
    };

    // Código de autorización fijo para pruebas de automatización
    this.fixedAuthCode = '0000-0000-0000-0000';
    this.fixedAuthCodeData = {
      client_id: 'automation_client',
      redirect_uri: 'https://automation.cloudpass.local/callback',
      scope: 'openid profile email',
      state: 'automation_state',
      user_id: 'automation_user',
      nonce: 'automation_nonce'
    };
  }

  /**
   * Genera un código de autorización
   * @param {Object} data - Datos para generar el código
   * @returns {Promise<String>} - Código de autorización
   */
  async generateAuthorizationCode(data) {
    // Siempre retornamos el código fijo
    const code = '0000-0000-0000-0000';

    // Almacenamos los datos asociados al código
    await openidStore.storeAuthCode(code, {
      ...data,
      country_code: data.country_code // Guardamos el country_code
    });

    return code;
  }

  /**
   * Valida un código de autorización
   * @param {String} code - Código de autorización
   * @param {String} clientId - ID del cliente
   * @param {String} redirectUri - URI de redirección
   * @returns {Object|null} - Datos asociados al código o null si es inválido
   */
  async validateAuthorizationCode(code, clientId, redirectUri) {
    // Caso especial para el código fijo de automatización
    if (code === this.fixedAuthCode) {
      const codeData = await openidStore.getAuthCode(code);
      if (!codeData) {
        return null;
      }
      return {
        ...this.fixedAuthCodeData,
        user_id: codeData.user_id, // Usamos el user_id del código de autorización
        country_code: codeData.country_code // Mantenemos el country_code
      };
    }

    const codeData = await openidStore.getAuthCode(code);

    if (!codeData) {
      return null;
    }

    // Verificar que el código no haya expirado
    if (codeData.exp < Math.floor(Date.now() / 1000)) {
      await openidStore.removeAuthCode(code);
      return null;
    }

    // Verificar que el cliente y la URI de redirección coincidan
    if (codeData.client_id !== clientId || codeData.redirect_uri !== redirectUri) {
      return null;
    }

    // Eliminar el código después de usarlo
    await openidStore.removeAuthCode(code);

    return codeData;
  }

  /**
   * Genera tokens de acceso y refresco
   * @param {Object} tokenData - Datos para generar los tokens
   * @returns {Object} - Tokens generados
   */
  async generateTokens(tokenData) {
    const now = Math.floor(Date.now() / 1000);

    // Generar ID de token
    const jti = uuidv4();

    // Generar token de acceso
    const accessToken = jwt.sign({
      iss: this.tokenConfig.issuer,
      sub: tokenData.user_id,
      aud: this.tokenConfig.audience,
      exp: now + this.tokenConfig.accessTokenExpiry,
      iat: now,
      jti,
      scope: tokenData.scope,
      client_id: tokenData.client_id,
      nonce: tokenData.nonce,
      country_code: tokenData.country_code // Incluimos el country_code en el token
    }, this.tokenConfig.secretKey, { algorithm: this.tokenConfig.algorithm });

    // Generar token de refresco
    const refreshToken = crypto.randomBytes(64).toString('hex');

    // Almacenar el token de refresco
    await openidStore.storeRefreshToken(refreshToken, {
      user_id: tokenData.user_id,
      client_id: tokenData.client_id,
      scope: tokenData.scope,
      jti,
      exp: now + this.tokenConfig.refreshTokenExpiry,
      country_code: tokenData.country_code // Incluimos el country_code en el token de refresco
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.tokenConfig.accessTokenExpiry,
      refresh_token: refreshToken,
      refresh_token_expires_in: this.tokenConfig.refreshTokenExpiry,
      scope: tokenData.scope
    };
  }

  /**
   * Refresca un token de acceso usando un token de refresco
   * @param {String} refreshToken - Token de refresco
   * @param {String} clientId - ID del cliente
   * @returns {Object|null} - Nuevos tokens o null si el token de refresco es inválido
   */
  async refreshAccessToken(refreshToken, clientId) {
    // Caso especial para respuesta inválida de refresh token
    if (refreshToken === 'test_invalid_refresh_token') {
      return null; // Esto activará un error invalid_grant
    }

    // Obtener datos del token de refresco
    const tokenData = await openidStore.getRefreshToken(refreshToken);

    if (!tokenData) {
      return null;
    }

    // Verificar que el client_id coincida
    if (tokenData.client_id !== clientId) {
      return null;
    }

    // Verificar si el token ha expirado
    if (tokenData.exp < Math.floor(Date.now() / 1000)) {
      await openidStore.removeRefreshToken(refreshToken);
      return null;
    }

    const now = Math.floor(Date.now() / 1000);

    // Generar nuevo token de acceso
    const accessToken = jwt.sign({
      iss: this.tokenConfig.issuer,
      sub: tokenData.user_id,
      aud: this.tokenConfig.audience,
      exp: now + this.tokenConfig.accessTokenExpiry,
      iat: now,
      jti: tokenData.jti,
      scope: tokenData.scope,
      client_id: tokenData.client_id,
      country_code: tokenData.country_code
    }, this.tokenConfig.secretKey, { algorithm: this.tokenConfig.algorithm });

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: this.tokenConfig.accessTokenExpiry,
      scope: tokenData.scope
    };
  }

  /**
   * Valida un token de acceso
   * @param {String} accessToken - Token de acceso
   * @returns {Object|null} - Datos del token o null si es inválido
   */
  async validateAccessToken(accessToken) {
    try {
      const decoded = jwt.verify(accessToken, this.tokenConfig.secretKey, {
        algorithms: [this.tokenConfig.algorithm],
        issuer: this.tokenConfig.issuer,
        audience: this.tokenConfig.audience
      });

      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtiene información del usuario a partir de un token de acceso
   * @param {String} accessToken - Token de acceso
   * @returns {Object|null} - Información del usuario o null si el token es inválido
   */
  async getUserInfo(accessToken) {
    const tokenData = await this.validateAccessToken(accessToken);

    if (!tokenData) {
      return null;
    }

    // En un caso real, aquí se obtendría la información del usuario desde una base de datos
    // Para este ejemplo, devolvemos información básica basada en el sub (user_id)
    return {
      subscriber_id: tokenData.sub,
      name: `User ${tokenData.sub}`,
      email: `${tokenData.sub}@example.com`,
      email_verified: true,
      country_code: tokenData.country_code // Usamos el country_code del token
    };
  }

  /**
   * Valida los casos especiales de subscriber_id
   * @param {String} subscriberId - ID del suscriptor
   * @param {String} resourceId - ID del recurso
   * @returns {Object|null} - Resultado de la validación o null si no es un caso especial
   */
  async validateSpecialCases(subscriberId, resourceId) {
    // Caso especial para subscriber_id no existente
    if (subscriberId === 'test_user_not_exist') {
      return {
        access: false,
        error: {
          errorCode: 'IDP-011',
          details: 'Usuario no Existente'
        }
      };
    }

    // Caso especial para timeout
    if (subscriberId === 'test_user_timeout') {
      // Simular un retraso de 10 segundos
      await new Promise((resolve) => setTimeout(resolve, 10000));
      return {
        access: true,
        resource_id: resourceId
      };
    }

    // Caso especial para template inválido
    if (subscriberId === 'test_user_invalid_template') {
      return {
        access: false,
        reason: 'invalid_template_response'
      };
    }

    // Caso especial para URN inválida
    if (resourceId === 'urn:tve:invalidUrn') {
      return {
        access: false,
        error: {
          errorCode: 'IDP-002',
          details: 'URN Invalida'
        }
      };
    }

    return null;
  }

  /**
   * Verifica la autorización de un usuario
   * @param {String} accessToken - Token de acceso
   * @param {String} resourceId - ID del recurso al que se intenta acceder (debe comenzar con "urn:tve:")
   * @returns {Object} - Resultado de la autorización
   */
  async authorize(accessToken, resourceId) {
    const tokenData = await this.validateAccessToken(accessToken);

    if (!tokenData) {
      return {
        access: false,
        reason: 'invalid_token'
      };
    }

    // Validar casos especiales
    const specialCaseResult = await this.validateSpecialCases(tokenData.sub, resourceId);
    if (specialCaseResult) {
      return specialCaseResult;
    }

    // Verificar que el resourceId comience con "urn:tve:"
    if (!resourceId || !resourceId.startsWith('urn:tve:')) {
      return {
        access: false,
        reason: 'invalid_resource'
      };
    }

    // En un caso real, aquí se verificaría si el usuario tiene permisos para el recurso
    // Para este ejemplo, autorizamos todas las solicitudes con un token válido
    return {
      access: true,
      resource_id: resourceId
    };
  }
}

module.exports = new OpenIDService();
