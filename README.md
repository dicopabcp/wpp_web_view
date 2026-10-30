# web-whatsapp

Web de BCP Bolivia que se abre desde el botón **CTA URL** que Olivia envía por WhatsApp. Reemplaza a los WhatsApp Flows de validación de identidad, inicio de sesión y consulta de saldos y movimientos.

```
WhatsApp ──botón CTA URL──▶ /s/<token> (esta web) ──/api/*──▶ Olivia v1/WppWeb ──▶ lógica de v1/WppFlow
```

- El navegador solo conoce el token del enlace. Las rutas `/api/sesion` y `/api/pantalla` agregan el header `X-Web-Key` en el servidor y llaman a Olivia.
- El token lo firma Olivia (HMAC-SHA256, 10 minutos). Un CTA nuevo invalida el anterior.
- Al terminar, la web vuelve sola a WhatsApp (`https://wa.me/<número>`) y Olivia ya envió el siguiente mensaje al chat.

## Diagnóstico de rechazos

Con `MOSTRAR_DIAGNOSTICO=true`, la pantalla de rechazo muestra el motivo, el user-agent que llegó al servidor, si llegó la cookie del navegador, el modo (simulado u Olivia), el estado del filtro de navegador y el inicio del token, y no vuelve sola a WhatsApp. Cada rechazo se registra siempre en el log del servidor (`[s/token] rechazo`). Apágalo después de probar.

## Acceso solo desde el enlace de WhatsApp

- **Enlace ligado al primer navegador (siempre activo):** `proxy.ts` asigna a cada navegador una cookie httpOnly (`bcpwa_disp`). La primera vez que se abre el enlace, Olivia guarda en la sesión el hash de ese identificador. Si el mismo link se abre en otro navegador o equipo, se muestra "Este enlace ya se abrió en otro dispositivo".
- **Filtro por navegador (apagado por defecto):** `RESTRINGIR_NAVEGADOR=true` bloquea los user-agents que no coinciden con `PATRON_NAVEGADOR_PERMITIDO` (por defecto `WA4A/|WhatsApp`; `WA4A/` es el navegador interno de WhatsApp para Android, verificado en un celular real). No es una barrera de seguridad: el user-agent se puede falsificar, en iPhone el navegador de WhatsApp se identifica como Safari y en Android a veces WhatsApp abre Chrome. Actívalo solo después de probar en celulares reales.

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
| `FlowRegistroWhatsApp` | carnet y celular, selfie, carnet anverso y reverso, clave | `ACBM_DATOS_CI`, `ACBM_SELFIE`, `ACBM_DOCUMENTO_ID`, `ACBM_VALIDAR_CLAVE` |
| `FlowAperturaCuentaNoCliente` | identidad, correo y código, propósito, carta SEGIP y buró, domicilio, PEP, estado civil, situación laboral, referencia, contrato, clave y usuario de Banca Móvil, número de cuenta | `APC_*` (crea la cuenta con `APC_RESUMEN`) |
| `FlowAperturaCuentaYaClienteSinBM` | identidad, tus cuentas, correo y código, usuario y clave de Banca Móvil | `ACSBM_*` |
| `FlowCambioClave` | reglas, código al correo, selfie, nueva clave | `CCL_ENVIAR_OTP`, `CCL_OTP_CORREO`, `CCL_SELFIE`, `CCL_NUEVA_CLAVE` |
| `FlowCierreWhatsApp` | código al correo, selfie, confirmación | `CWA_ENVIAR_OTP`, `CWA_OTP_CORREO`, `CWA_SELFIE`, `CWA_CONFIRMAR_CIERRE` |
| `FlowSegundaCuenta` | cuenta y uso, carta, selfie, verificación de datos, contrato, token, número de cuenta | `SGC_*` (crea la cuenta con `SGC_ABRIR_CUENTA`) |

Las definiciones de pasos y pantallas están en `lib/flujos.ts`; los pasos, en `components/Pasos.tsx`. Las fotos se reducen en el navegador a 1280 px (JPEG) antes de enviarse.

## Probar desde WhatsApp con links de prueba

1. Levanta esta web con `MOCK_OLIVIA=true` y publícala con HTTPS (por ejemplo `npx cloudflared tunnel --url http://localhost:3000`).
2. En el `appsettings.json` de Olivia pon `WppFormularios:ModoPruebas` en `true` y completa `WppFormularios:WebBaseUrl` con la URL del túnel. Ese interruptor activa los links de prueba y las frases de prueba; no depende de `ASPNETCORE_ENVIRONMENT`.
3. Escribe al bot una frase de prueba. Olivia responde con el botón y el link simulado del flujo:

| Frase | Flujo | Link |
|---|---|---|
| `prueba identidad` | Validación de identidad | `/s/demo-identidad` |
| `prueba clave` | Solo clave | `/s/demo-clave` |
| `prueba movimientos` | Saldos y movimientos | `/s/demo-movimientos` |
| `prueba registro` | Registro en WhatsApp | `/s/demo-registro` |
| `prueba apertura` | Apertura de cuenta | `/s/demo-apertura` |
| `prueba sin banca movil` | Cliente sin Banca Móvil | `/s/demo-sin-bm` |
| `prueba cambio clave` | Cambio de clave | `/s/demo-cambio-clave` |
| `prueba cierre` | Cierre de WhatsApp | `/s/demo-cierre` |
| `prueba segunda cuenta` | Segunda cuenta | `/s/demo-segunda-cuenta` |

En producción `ModoPruebas` debe estar en `false` (así viene en `appsettings.json`); con `false` las frases de prueba no hacen nada.
