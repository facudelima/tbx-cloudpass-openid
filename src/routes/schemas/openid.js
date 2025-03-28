/**
 * Esquemas para validar las solicitudes a los endpoints de OpenID
 */

const authorizeSchema = {
  description: 'Endpoint de autorización OpenID',
  tags: ['openid'],
  summary: 'Inicia el flujo de autorización OpenID',
  querystring: {
    type: 'object',
    required: ['response_type', 'client_id', 'redirect_uri', 'scope', 'state'],
    properties: {
      response_type: { type: 'string', enum: ['code'] },
      client_id: { type: 'string' },
      redirect_uri: { type: 'string', format: 'uri' },
      scope: { type: 'string' },
      state: { type: 'string' },
      nonce: { type: 'string' }
    }
  },
  response: {
    302: {
      description: 'Redirección con código de autorización',
      type: 'null'
    },
    400: {
      description: 'Error en la solicitud',
      type: 'object',
      properties: {
        error: { type: 'string' },
        error_description: { type: 'string' }
      }
    }
  }
};

const tokenSchema = {
  description: 'Endpoint de token OpenID',
  tags: ['openid'],
  summary: 'Obtiene tokens a partir de un código de autorización o token de refresco',
  body: {
    type: 'object',
    required: ['grant_type', 'client_id', 'client_secret'],
    properties: {
      grant_type: { 
        type: 'string', 
        enum: ['authorization_code', 'refresh_token'] 
      },
      client_id: { type: 'string' },
      client_secret: { type: 'string' },
      code: { type: 'string' },
      redirect_uri: { type: 'string', format: 'uri' },
      refresh_token: { type: 'string' }
    },
    allOf: [
      {
        if: {
          properties: { grant_type: { const: 'authorization_code' } }
        },
        then: {
          required: ['code', 'redirect_uri']
        }
      },
      {
        if: {
          properties: { grant_type: { const: 'refresh_token' } }
        },
        then: {
          required: ['refresh_token']
        }
      }
    ]
  },
  response: {
    200: {
      description: 'Tokens generados correctamente',
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        token_type: { type: 'string' },
        expires_in: { type: 'integer' },
        refresh_token: { type: 'string' },
        scope: { type: 'string' }
      }
    },
    400: {
      description: 'Error en la solicitud',
      type: 'object',
      properties: {
        error: { type: 'string' },
        error_description: { type: 'string' }
      }
    }
  }
};

const userInfoSchema = {
  description: 'Endpoint de información del usuario OpenID',
  tags: ['openid'],
  summary: 'Obtiene información del usuario a partir de un token de acceso',
  headers: {
    type: 'object',
    properties: {
      authorization: { type: 'string' }
    },
    required: ['authorization']
  },
  response: {
    200: {
      description: 'Información del usuario',
      type: 'object',
      properties: {
        sub: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        email_verified: { type: 'boolean' }
      }
    },
    401: {
      description: 'Token inválido',
      type: 'object',
      properties: {
        error: { type: 'string' },
        error_description: { type: 'string' }
      }
    }
  }
};

const authzSchema = {
  description: 'Endpoint de autorización',
  tags: ['openid'],
  summary: 'Verifica la autorización de un usuario',
  querystring: {
    type: 'object',
    properties: {
      access_token: { type: 'string' },
      resource: { type: 'string' },
      action: { type: 'string' }
    },
    required: ['access_token']
  },
  response: {
    200: {
      description: 'Resultado de la autorización',
      type: 'object',
      properties: {
        authorized: { type: 'boolean' },
        user_id: { type: 'string' },
        client_id: { type: 'string' },
        scope: { type: 'string' },
        reason: { type: 'string' }
      }
    },
    401: {
      description: 'Token inválido',
      type: 'object',
      properties: {
        error: { type: 'string' },
        error_description: { type: 'string' }
      }
    }
  }
};

module.exports = {
  authorizeSchema,
  tokenSchema,
  userInfoSchema,
  authzSchema
}; 