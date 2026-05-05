OpenID Provider para CloudPass 

Este módulo implementa un Proveedor de Identidad (IDP) con soporte para OpenID Connect, pensado especialmente para automatizar flujos de autorización y pruebas con refresh tokens en CloudPass.

Es ideal para entornos de testing, automatización y creación manual de dispositivos sin fricción.

✨ Características

Implementa los endpoints estándar de OpenID Connect:

/authorize: Inicia el flujo de autorización mostrando un formulario de login

/token: Obtiene tokens usando un authorization code o refresh token

/userinfo: Devuelve información del usuario a partir de un access token

/authz: Verifica si un usuario está autorizado (recibe access_token y resource_id)

Soporte completo para refresh token flow

Integración directa con CloudPass (shortName: automation_id)

Configuración flexible de expiración de tokens:

Access Token: 10 minutos (por defecto)

Refresh Token: 24 horas (por defecto)

🔑 Código de Autorización Fijo

Para facilitar la automatización, el IDP expone un authorization code fijo:

0000-0000-0000-0000


Este código siempre genera un nuevo access token y refresh token, lo que permite:

Hardcodear valores en el backend

Crear dispositivos manualmente durante el login

Simplificar flujos automáticos de testing

⚙️ Configuración

La configuración del IDP se encuentra en el archivo:

src/config/openid.json


Parámetros configurables:

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

🔄 Ejemplo de Flujo de Autorización
1️⃣ Iniciar autorización (muestra formulario de login)
GET /authorize?response_type=code&client_id=automation_client&redirect_uri=https://automation.cloudpass.local/callback&scope=openid%20profile%20email&state=random_state

2️⃣ Obtener tokens con authorization code
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
client_id=automation_client&
client_secret=automation_secret&
code=0000-0000-0000-0000&
redirect_uri=https://automation.cloudpass.local/callback

3️⃣ Refrescar tokens
POST /token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&
client_id=automation_client&
client_secret=automation_secret&
refresh_token=refresh_token_obtenido_anteriormente

4️⃣ Obtener información del usuario
GET /userinfo
Authorization: Bearer access_token_obtenido_anteriormente

5️⃣ Verificar autorización
GET /authz?access_token=access_token_obtenido_anteriormente&resource_id=urn:tve:recurso


⚠️ El resource_id debe comenzar con urn:tve:

🧪 Ejemplos CURL para pruebas
1. Endpoint /authorize
curl -v "http://localhost:3000/authorize?response_type=code&client_id=automation_client&redirect_uri=https://automation.cloudpass.local/callback&scope=openid%20profile%20email&state=random_state&country=AR"


Muestra un formulario HTML de login y redirige con el authorization code.

2. /token usando código fijo
curl -v -X POST -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&client_id=automation_client&client_secret=automation_secret&code=0000-0000-0000-0000&redirect_uri=https://automation.cloudpass.local/callback" \
  http://localhost:3000/token

3. /token usando refresh token
curl -v -X POST -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=refresh_token&client_id=automation_client&client_secret=automation_secret&refresh_token=REFRESH_TOKEN_AQUÍ" \
  http://localhost:3000/token

4. /userinfo
curl -v -H "Authorization: Bearer ACCESS_TOKEN_AQUÍ" \
  http://localhost:3000/userinfo

5. /authz
curl -v "http://localhost:3000/authz?access_token=ACCESS_TOKEN_AQUÍ&resource_id=urn:tve:recurso"

🔌 Integración con CloudPass

Para usar este IDP en CloudPass, solo configurá el shortName:

automation_id


en la configuración correspondiente de CloudPass.
