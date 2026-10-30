# web-whatsapp

Web de BCP Bolivia que se abre desde el botón **CTA URL** que Olivia envía por WhatsApp. Reemplaza a los WhatsApp Flows de validación de identidad, inicio de sesión y consulta de saldos y movimientos.

```
WhatsApp ──botón CTA URL──▶ /s/<token> (esta web) ──/api/*──▶ Olivia v1/WppWeb ──▶ lógica de v1/WppFlow
```

- El navegador solo conoce el token del enlace. Las rutas `/api/sesion` y `/api/pantalla` agregan el header `X-Web-Key` en el servidor y llaman a Olivia.
- El token lo firma Olivia (HMAC-SHA256, 10 minutos). Un CTA nuevo invalida el anterior.
- Al terminar, la web vuelve sola a WhatsApp (`https://wa.me/<número>`) y Olivia ya envió el siguiente mensaje al chat.

## Requisitos

- Node.js 20.9 o superior.

## Variables de entorno

Copia `.env.example` a `.env.local`:

| Variable | Uso |
|---|---|
| `MOCK_OLIVIA` | `true` para desarrollo sin Olivia: usa respuestas simuladas y los enlaces `/s/demo-*`. |
| `OLIVIA_BASE_URL` | URL base de la API de Olivia, sin barra final. |
| `OLIVIA_WEB_KEY` | Igual a `WppFormularios:WebApiKey` en el `appsettings.json` de Olivia. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número del bot (solo dígitos, con 591) para "Volver a WhatsApp". **Se incrusta al compilar**: debe estar definido al correr `npm run build`. |

Si Olivia usa un certificado interno, exporta `NODE_EXTRA_CA_CERTS=<ruta al .pem>` antes de iniciar el servidor.

## Comandos

```bash
npm install
npm run dev        # desarrollo en http://localhost:3000
npm run build      # compilación de producción
npm start          # sirve la compilación
npm run lint
```

### Probar sin Olivia

```bash
MOCK_OLIVIA=true npm run dev
```

Enlaces de prueba (datos simulados: celular `71234567`, clave `123456`, código `123456`):

- `/s/demo-identidad`: validación completa (carnet, selfie, carnet anverso y reverso, clave).
- `/s/demo-clave`: solo clave de Banca Móvil (cliente ya registrado).
- `/s/demo-movimientos`: código al correo, cuentas, saldo y movimientos.
- `/s/demo-usado` y `/s/demo-vencido`: enlaces rechazados.

## Conectar con Olivia

En `olivia-bxt-core-develop/OLIVIA.CORE.API/appsettings.json`, sección `WppFormularios`:

```json
"WppFormularios": {
  "Modo": "CTA_URL",
  "WebBaseUrl": "https://<dominio-de-esta-web>",
  "TokenSecret": "<secreto largo y aleatorio>",
  "TokenMinutos": 10,
  "WebApiKey": "<mismo valor que OLIVIA_WEB_KEY>",
  "Botones": [ ... ]
}
```

- `Modo: "FLOW"` vuelve a los WhatsApp Flows sin tocar código. Cada botón puede tener su propio `Modo`.
- Si falta `WebBaseUrl` o `TokenSecret`, Olivia envía el Flow aunque el modo sea `CTA_URL`.

## Pantallas

| Flujo (Olivia) | Pasos en la web | Pantallas enviadas a Olivia |
|---|---|---|
| `FlowValidacionIdentidad` | carnet y celular, selfie, carnet anverso, carnet reverso, clave | `CSM_DATOS_CI`, `CSM_SELFIE`, `CSM_DOCUMENTO_ID` (dos veces), `CSM_LOGIN_CLAVE` |
| `FlowValidacionIdentidadClave` | clave | `CSM_LOGIN_CLAVE` |
| `FlowConsultaMovimientos` | código, cuentas, saldo, movimientos, detalle | `CSM_OTP_CORREO`, `CSM_REENVIAR_OTP`, `CSM_CUENTAS`, `CSM_ELEGIR_CUENTA`, `CSM_ELEGIR_MOVIMIENTO` |

Las fotos se reducen en el navegador a 1280 px (JPEG) antes de enviarse.
