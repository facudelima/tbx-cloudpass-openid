const express = require('express');
const router = express.Router();
const openidService = require('../services/openidService');
const config = require('../config/openid.json');
const bodyParser = require('body-parser');

/**
 * @openapi
 * components:
 *   schemas:
 *     TokenResponse:
 *       type: object
 *       properties:
 *         access_token:
 *           type: string
 *         refresh_token:
 *           type: string
 *         token_type:
 *           type: string
 *         expires_in:
 *           type: integer
 *     UserInfo:
 *       type: object
 *       properties:
 *         sub:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *     AuthzResponse:
 *       type: object
 *       properties:
 *         access:
 *           type: boolean
 *         reason:
 *           type: string
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @openapi
 * /authorize:
 *   get:
 *     summary: Endpoint de autenticación
 *     description: Inicia el flujo de autenticación OAuth2/OpenID Connect
 *     parameters:
 *       - name: response_type
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           enum: [code]
 *         description: Tipo de respuesta (solo se admite 'code')
 *       - name: client_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del cliente
 *       - name: redirect_uri
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: URI de redirección después de la autorización
 *       - name: scope
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Alcance de la autorización
 *       - name: state
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Estado para prevenir CSRF
 *       - name: nonce
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Valor único para prevenir replay attacks
 *     responses:
 *       200:
 *         description: Formulario de login HTML
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       400:
 *         description: Error en la solicitud
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 error_description:
 *                   type: string
 */

/**
 * Rutas para OpenID
 */

// Middleware para parsear x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: true }));

// Endpoint de autorización con formulario de login simple
router.get('/authorize', async (req, res) => {
  const { response_type: responseType, client_id: clientId, redirect_uri: redirectUri, 
    scope, state, nonce } = req.query;
  
  // Verificar que el tipo de respuesta sea 'code'
  if (responseType !== 'code') {
    return res.status(400).json({
      error: 'unsupported_response_type',
      error_description: 'Solo se admite response_type=code'
    });
  }
  
  // Verificar que el cliente exista
  const client = config.clients.find(c => c.id === clientId);
  if (!client) {
    return res.status(400).json({
      error: 'invalid_client',
      error_description: 'Cliente no válido'
    });
  }
  
  // Verificar que la URI de redirección esté permitida
  if (!client.redirectUris.includes(redirectUri)) {
    return res.status(400).json({
      error: 'invalid_redirect_uri',
      error_description: 'URI de redirección no permitida'
    });
  }
  
  // Generar un formulario de login simple
  const loginForm = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Login</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          height: 100vh; 
        }
        .login-container { 
          width: 300px; 
          padding: 20px; 
          border: 1px solid #ccc; 
          border-radius: 5px; 
        }
        .form-group { 
          margin-bottom: 15px; 
        }
        label { 
          display: block; 
          margin-bottom: 5px; 
        }
        input[type="text"], 
        input[type="password"] { 
          width: 100%; 
          padding: 8px; 
          box-sizing: border-box; 
        }
        button { 
          background-color: #4CAF50; 
          color: white; 
          padding: 10px 15px; 
          border: none; 
          border-radius: 4px; 
          cursor: pointer; 
        }
        button:hover { 
          background-color: #45a049; 
        }
      </style>
    </head>
    <body>
      <div class="login-container">
        <h2>Login</h2>
        <form action="/authorize" method="post">
          <input type="hidden" name="response_type" value="${responseType}">
          <input type="hidden" name="client_id" value="${clientId}">
          <input type="hidden" name="redirect_uri" value="${redirectUri}">
          <input type="hidden" name="scope" value="${scope || ''}">
          <input type="hidden" name="state" value="${state || ''}">
          <input type="hidden" name="nonce" value="${nonce || ''}">
          
          <div class="form-group">
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" required>
          </div>
          
          <div class="form-group">
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required>
          </div>
          
          <button type="submit">Login</button>
        </form>
      </div>
    </body>
    </html>
  `;
  
  res.send(loginForm);
});

/**
 * @openapi
 * /authorize:
 *   post:
 *     summary: Formulario de login
 *     description: Procesa el formulario de login y redirige con el código de autorización
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               response_type:
 *                 type: string
 *               client_id:
 *                 type: string
 *               redirect_uri:
 *                 type: string
 *               scope:
 *                 type: string
 *               state:
 *                 type: string
 *               nonce:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       302:
 *         description: Redirección con código de autorización
 */

// Endpoint para procesar el formulario de login
router.post('/authorize', async (req, res) => {
  const { client_id: clientId, redirect_uri: redirectUri, scope, state, 
    nonce, username } = req.body;
  
  // Generar código de autorización
  const code = await openidService.generateAuthorizationCode({
    clientId,
    redirectUri,
    scope,
    state,
    user_id: username,
    nonce: nonce || ''
  });
  
  // Redireccionar con el código de autorización
  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.append('code', code);
  redirectUrl.searchParams.append('state', state || '');
  
  return res.redirect(302, redirectUrl.toString());
});

/**
 * @openapi
 * /token:
 *   post:
 *     summary: Endpoint de token
 *     description: |
 *       Intercambia el código de autorización por tokens de acceso o refresca un token existente.
 *       
 *       Hay dos flujos posibles:
 *       1. Authorization Code Flow: Intercambia un código de autorización por tokens de acceso
 *       2. Refresh Token Flow: Usa un refresh token para obtener un nuevo access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               grant_type:
 *                 type: string
 *                 enum: [authorization_code, refresh_token]
 *                 description: |
 *                   Puede utilizarse:
 *                   - authorization_code: Para intercambiar un código de autorización por tokens
 *                   - refresh_token: Para refrescar un token de acceso usando un refresh token
 *               client_id:
 *                 type: string
 *                 description: ID del cliente
 *               client_secret:
 *                 type: string
 *                 description: Secreto del cliente
 *               code:
 *                 type: string
 *                 description: Código de autorización (requerido solo para grant_type=authorization_code)
 *               redirect_uri:
 *                 type: string
 *                 description: URI de redirección (requerido solo para grant_type=authorization_code)
 *               refresh_token:
 *                 type: string
 *                 description: Token de refresco (requerido solo para grant_type=refresh_token)
 *           examples:
 *             authorization_code:
 *               value:
 *                 grant_type: authorization_code
 *                 client_id: my_client_id
 *                 client_secret: my_client_secret
 *                 code: abc123
 *                 redirect_uri: https://myapp.com/callback
 *             refresh_token:
 *               value:
 *                 grant_type: refresh_token
 *                 client_id: my_client_id
 *                 client_secret: my_client_secret
 *                 refresh_token: xyz789
 *     responses:
 *       200:
 *         description: Tokens generados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *             examples:
 *               authorization_code:
 *                 value:
 *                   access_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   refresh_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   token_type: Bearer
 *                   expires_in: 3600
 *               refresh_token:
 *                 value:
 *                   access_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   token_type: Bearer
 *                   expires_in: 3600
 *       400:
 *         description: Error en la solicitud
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   enum: [invalid_client, invalid_grant, unsupported_grant_type]
 *                 error_description:
 *                   type: string
 *             examples:
 *               invalid_client:
 *                 value:
 *                   error: invalid_client
 *                   error_description: Credenciales de cliente no válidas
 *               invalid_grant:
 *                 value:
 *                   error: invalid_grant
 *                   error_description: Código de autorización no válido
 *               unsupported_grant_type:
 *                 value:
 *                   error: unsupported_grant_type
 *                   error_description: Tipo de concesión no soportado
 */

// Endpoint de token
router.post('/token', async (req, res) => {
  const { grant_type: grantType, client_id: clientId, 
    client_secret: clientSecret, code, redirect_uri: redirectUri, 
    refresh_token: refreshToken } = req.body;
  
  // Verificar que el cliente exista y las credenciales sean correctas
  const client = config.clients.find(c => c.id === clientId && c.secret === clientSecret);
  if (!client) {
    return res.status(400).json({
      error: 'invalid_client',
      error_description: 'Credenciales de cliente no válidas'
    });
  }
  
  let tokens;
  
  // Procesar según el tipo de concesión
  if (grantType === 'authorization_code') {
    // Validar el código de autorización
    const codeData = await openidService.validateAuthorizationCode(code, clientId, redirectUri);
    
    if (!codeData) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Código de autorización no válido'
      });
    }
    
    // Generar tokens
    tokens = await openidService.generateTokens(codeData);
  } else if (grantType === 'refresh_token') {
    // Refrescar token
    tokens = await openidService.refreshAccessToken(refreshToken, clientId);
    
    if (!tokens) {
      return res.status(400).json({
        error: 'invalid_grant',
        error_description: 'Token de refresco no válido'
      });
    }
  } else {
    return res.status(400).json({
      error: 'unsupported_grant_type',
      error_description: 'Tipo de concesión no soportado'
    });
  }
  
  return res.json(tokens);
});

/**
 * @openapi
 * /userinfo:
 *   get:
 *     summary: Información del usuario
 *     description: Obtiene la información del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserInfo'
 *       401:
 *         description: No autorizado
 */

// Endpoint de información del usuario
router.get('/userinfo', async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'invalid_token',
      error_description: 'Token no proporcionado o formato incorrecto'
    });
  }
  
  const accessToken = authHeader.substring(7);
  const userInfo = await openidService.getUserInfo(accessToken);
  
  if (!userInfo) {
    return res.status(401).json({
      error: 'invalid_token',
      error_description: 'Token no válido'
    });
  }
  
  return res.json(userInfo);
});

/**
 * @openapi
 * /authz:
 *   get:
 *     summary: Autorización de URNs
 *     description: Verifica si un token tiene acceso a una URN específica
 *     parameters:
 *       - name: access_token
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de acceso
 *       - name: resource_id
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: URN a autorizar
 *     responses:
 *       200:
 *         description: Resultado de la autorización
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthzResponse'
 *       400:
 *         description: Error en la solicitud
 *       401:
 *         description: No autorizado
 */

// Endpoint de autorización
router.get('/authz', async (req, res) => {
  const { access_token: accessToken, resource_id: resourceId } = req.query;
  
  // Verificar que se proporcionó un token de acceso
  if (!accessToken) {
    return res.status(401).json({
      error: 'invalid_token',
      error_description: 'Token no proporcionado'
    });
  }
  
  // Verificar que se proporcionó un resource_id
  if (!resourceId) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'resource_id no proporcionado'
    });
  }
  
  // Verificar que resource_id comienza con "urn:tve:"
  if (!resourceId.startsWith('urn:tve:')) {
    return res.status(400).json({
      error: 'invalid_resource',
      error_description: 'resource_id debe comenzar con "urn:tve:"'
    });
  }
  
  // Validar el token de acceso y autorizar
  const authzResult = await openidService.authorize(accessToken, resourceId);
  
  if (!authzResult.access) {
    return res.status(401).json({
      error: 'unauthorized',
      error_description: authzResult.reason || 'No autorizado'
    });
  }
  
  return res.json(authzResult);
});

module.exports = router; 