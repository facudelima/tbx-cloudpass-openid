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
   * @param {Object} authRequest - Datos de la solicitud de autorización
   * @returns {String} - Código de autorización
   */
  async generateAuthorizationCode(authRequest) {
    const code = uuidv4();
    
    // Almacenar el código y los datos asociados
    await openidStore.storeAuthCode(code, {
      client_id: authRequest.client_id,
      redirect_uri: authRequest.redirect_uri,
      scope: authRequest.scope,
      state: authRequest.state,
      user_id: authRequest.user_id,
      nonce: authRequest.nonce,
      exp: Math.floor(Date.now() / 1000) + 600 // 10 minutos
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
      return this.fixedAuthCodeData;
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
      nonce: tokenData.nonce
    }, this.tokenConfig.secretKey, { algorithm: this.tokenConfig.algorithm });
    
    // Generar token de refresco
    const refreshToken = crypto.randomBytes(64).toString('hex');
    
    // Almacenar el token de refresco
    await openidStore.storeRefreshToken(refreshToken, {
      user_id: tokenData.user_id,
      client_id: tokenData.client_id,
      scope: tokenData.scope,
      jti,
      exp: now + this.tokenConfig.refreshTokenExpiry
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
    const tokenData = await openidStore.getRefreshToken(refreshToken);
    
    if (!tokenData) {
      return null;
    }
    
    // Verificar que el token no haya expirado
    if (tokenData.exp < Math.floor(Date.now() / 1000)) {
      await openidStore.removeRefreshToken(refreshToken);
      return null;
    }
    
    // Verificar que el cliente coincida
    if (tokenData.client_id !== clientId) {
      return null;
    }
    
    // Eliminar el token de refresco anterior
    await openidStore.removeRefreshToken(refreshToken);
    
    // Generar nuevos tokens
    return this.generateTokens({
      user_id: tokenData.user_id,
      client_id: tokenData.client_id,
      scope: tokenData.scope
    });
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
      country_code: "UY"
    };
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