# OpenID Provider para CloudPass

Este módulo implementa un proveedor de identidad (IDP) con soporte para OpenID Connect, diseñado específicamente para automatizar escenarios de autorización y pruebas con tokens de refresco en CloudPass.

## Características

- Implementa los 5 endpoints estándar de OpenID Connect:
  - `/authorize`: Inicia el flujo de autorización con un formulario de login
  - `/token`: Obtiene tokens a partir de un código de autorización o token de refresco
  - `/userinfo`: Obtiene información del usuario a partir de un token de acceso
  - `/authz`: Verifica la autorización de un usuario (acepta access_token y resource_id)
- Soporte para flujo de refreshToken
- Integración con CloudPass (shortName "automation_id")
- Configuración flexible de duración de tokens:
  - AccessToken: 10 minutos por defecto
  - RefreshToken: 24 horas por defecto

## Código de Autorización Fijo

Para facilitar la automatización, se ha implementado un código de autorización fijo:

```
0000-0000-0000-0000
```

Este código siempre generará un nuevo accessToken y refreshToken, lo que permite hardcodear valores en el backend y crear dispositivos manualmente durante el proceso de login.

## Configuración

La configuración del IDP se encuentra en el archivo `src/config/openid.json`. Puedes modificar los siguientes parámetros:

```json
{
  "shortName": "automation_id",
  "issuer": "cloudpass-automation",
  "audience": "cloudpass-clients",
  "accessTokenExpiry": 600,
  "refreshTokenExpiry": 86400,
  "secretKey": "automation-secret-key-for-jwt-signing",
  "clients": [
    {
      "id": "automation_client",
      "secret": "automation_secret",
      "redirectUris": ["https://automation.cloudpass.local/callback"],
      "allowedScopes": ["openid", "profile", "email"]
    }
  ]
}
```

## Ejemplos de Uso

### Flujo de Autorización

1. Iniciar el flujo de autorización (muestra un formulario de login):

```
GET /authorize?response_type=code&client_id=automation_client&redirect_uri=https://automation.cloudpass.local/callback&scope=openid%20profile%20email&state=random_state
```

2. Obtener tokens con el código de autorización (usando x-www-form-urlencoded):

```
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&client_id=automation_client&client_secret=automation_secret&code=0000-0000-0000-0000&redirect_uri=https://automation.cloudpass.local/callback
```

3. Refrescar tokens (usando x-www-form-urlencoded):

```
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&client_id=automation_client&client_secret=automation_secret&refresh_token=refresh_token_obtenido_anteriormente
```

4. Obtener información del usuario:

```
GET /userinfo
Authorization: Bearer access_token_obtenido_anteriormente
```

5. Verificar autorización:

```
GET /authz?access_token=access_token_obtenido_anteriormente&resource_id=urn:tve:recurso
```

## Ejemplos de CURL para pruebas

A continuación se muestran ejemplos de comandos CURL para probar cada uno de los endpoints:

### 1. Endpoint de autorización

```bash
curl -v "http://localhost:3000/authorize?response_type=code&client_id=automation_client&redirect_uri=https://automation.cloudpass.local/callback&scope=openid%20profile%20email&state=random_state&country=AR"
```

Este comando mostrará un formulario de login HTML. Después de enviar el formulario, redirigirá a la URI especificada con un código de autorización.

### 2. Endpoint de token (con código de autorización fijo)

```bash
curl -v -X POST -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&client_id=automation_client&client_secret=automation_secret&code=0000-0000-0000-0000&redirect_uri=https://automation.cloudpass.local/callback" \
  http://localhost:3000/token
```

Este comando obtendrá un token de acceso y un token de refresco utilizando el código de autorización fijo.

### 3. Endpoint de token (con token de refresco)

```bash
curl -v -X POST -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token&client_id=automation_client&client_secret=automation_secret&refresh_token=REFRESH_TOKEN_AQUÍ" \
  http://localhost:3000/token
```

Reemplaza `REFRESH_TOKEN_AQUÍ` con el token de refresco obtenido en el paso anterior.

### 4. Endpoint de información del usuario

```bash
curl -v -H "Authorization: Bearer ACCESS_TOKEN_AQUÍ" \
  http://localhost:3000/userinfo
```

Reemplaza `ACCESS_TOKEN_AQUÍ` con el token de acceso obtenido en el paso 2 o 3.

### 5. Endpoint de autorización

```bash
curl -v "http://localhost:3000/authz?access_token=ACCESS_TOKEN_AQUÍ&resource_id=urn:tve:recurso"
```

Reemplaza `ACCESS_TOKEN_AQUÍ` con el token de acceso obtenido en el paso 2 o 3. Nota que el `resource_id` debe comenzar con `urn:tve:`.

## Integración con CloudPass

Para integrar este IDP con CloudPass, configura el shortName "automation_id" en la configuración de CloudPass. 