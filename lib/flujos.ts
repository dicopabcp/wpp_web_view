// Definición de los flujos web: qué pasos muestra la web y qué código de pantalla envía a Olivia en cada uno.
// Los códigos siguen a Olivia: CSM_* (saldos), ACBM_* (registro con Banca Móvil), APC_* (apertura no cliente),
// ACSBM_* (cliente sin Banca Móvil), CCL_* (cambio de clave), CWA_* (cierre de WhatsApp) y SGC_* (segunda cuenta).
import type { Fin } from "./motivos";

export type Paso =
  | { tipo: "datos"; pantalla: string }
  | { tipo: "foto"; modo: "selfie" | "anverso" | "reverso"; pantalla: string }
  | { tipo: "clave"; pantalla: string }
  | { tipo: "otp"; pantalla: string; enviar?: string; reenviar?: string; destino: "correo" | "sms" }
  | { tipo: "correo"; pantalla: string }
  | { tipo: "usuario"; pantalla: string }
  | { tipo: "nuevaClave"; pantalla: string; seccion: string }
  | { tipo: "cuentas"; pantalla: string }
  | { tipo: "reglas" }
  | { tipo: "confirmarCierre"; pantalla: string }
  | { tipo: "proposito"; pantalla: string; conProducto?: boolean }
  | { tipo: "carta"; pantalla: string }
  | { tipo: "domicilio"; pantalla: string }
  | { tipo: "pep"; pantalla: string }
  | { tipo: "civil"; pantalla: string }
  | { tipo: "laboral"; pantalla: string }
  | { tipo: "referencia"; pantalla: string }
  | { tipo: "verificarDatos"; pantalla: string }
  | { tipo: "contrato"; pantalla: string }
  | { tipo: "token"; pantalla: string }
  | { tipo: "crearCuenta"; pantalla: string };

export type DefinicionFlujo = { seccion: string; pasos: Paso[]; fin: Fin };

const identidad = (prefijo: string): Paso[] => [
  { tipo: "datos", pantalla: `${prefijo}_DATOS_CI` },
  { tipo: "foto", modo: "selfie", pantalla: `${prefijo}_SELFIE` },
  { tipo: "foto", modo: "anverso", pantalla: `${prefijo}_DOCUMENTO_ID` },
  { tipo: "foto", modo: "reverso", pantalla: `${prefijo}_DOCUMENTO_ID` },
];

const FIN_SALDOS: Fin = { tipo: "bien", titulo: "Listo, confirmamos que eres tú", texto: "Vuelve a WhatsApp: te enviamos el botón para ver tus saldos y movimientos." };

export const FLUJOS: Record<string, DefinicionFlujo> = {
  FlowValidacionIdentidad: {
    seccion: "Validación de identidad",
    pasos: [...identidad("CSM"), { tipo: "clave", pantalla: "CSM_LOGIN_CLAVE" }],
    fin: FIN_SALDOS,
  },
  FlowValidacionIdentidadClave: {
    seccion: "Clave de seguridad",
    pasos: [{ tipo: "clave", pantalla: "CSM_LOGIN_CLAVE" }],
    fin: { tipo: "bien", titulo: "Iniciaste sesión", texto: "Tu sesión segura dura 10 minutos. Vuelve a WhatsApp: te enviamos el botón para continuar." },
  },
  FlowRegistroWhatsApp: {
    seccion: "Registro en WhatsApp",
    pasos: [...identidad("ACBM"), { tipo: "clave", pantalla: "ACBM_VALIDAR_CLAVE" }],
    fin: { tipo: "bien", titulo: "Activamos tu WhatsApp BCP Bolivia", texto: "Ya puedes hacer tus consultas desde el chat." },
  },
  FlowAperturaCuentaNoCliente: {
    seccion: "Apertura de cuenta",
    pasos: [
      ...identidad("APC"),
      { tipo: "correo", pantalla: "APC_CONTACTO_CORREO" },
      { tipo: "otp", pantalla: "APC_OTP_CORREO", destino: "correo" },
      { tipo: "proposito", pantalla: "APC_VERIFICACION_WEBVIEW" },
      { tipo: "carta", pantalla: "APC_CARTA_SEGIP_BURO" },
      { tipo: "domicilio", pantalla: "APC_DATOS_PERSONALES" },
      { tipo: "pep", pantalla: "APC_PEP" },
      { tipo: "civil", pantalla: "APC_ESTADO_CIVIL" },
      { tipo: "laboral", pantalla: "APC_SITUACION_LABORAL" },
      { tipo: "referencia", pantalla: "APC_REFERENCIA" },
      { tipo: "contrato", pantalla: "APC_CONTRATO" },
      { tipo: "nuevaClave", pantalla: "APC_CLAVE_BM", seccion: "Banca Móvil" },
      { tipo: "usuario", pantalla: "APC_USUARIO_BM" },
      { tipo: "crearCuenta", pantalla: "APC_RESUMEN" },
    ],
    fin: { tipo: "bien", titulo: "¡Bienvenido al BCP!", texto: "Vuelve a WhatsApp: te enviamos los documentos de tu cuenta." },
  },
  FlowAperturaCuentaYaClienteSinBM: {
    seccion: "Creación de usuario",
    pasos: [
      ...identidad("ACSBM"),
      { tipo: "cuentas", pantalla: "ACSBM_CUENTAS" },
      { tipo: "correo", pantalla: "ACSBM_CONTACTO_CORREO" },
      { tipo: "otp", pantalla: "ACSBM_OTP_CORREO", destino: "correo" },
      { tipo: "usuario", pantalla: "ACSBM_USUARIO_BM" },
      { tipo: "nuevaClave", pantalla: "ACSBM_CLAVE_BM", seccion: "Banca Móvil" },
    ],
    fin: { tipo: "bien", titulo: "Creaste tu usuario de Banca Móvil", texto: "Ya activamos tu WhatsApp BCP Bolivia. Vuelve al chat para continuar." },
  },
  FlowCambioClave: {
    seccion: "Cambio de clave",
    pasos: [
      { tipo: "reglas" },
      { tipo: "otp", pantalla: "CCL_OTP_CORREO", enviar: "CCL_ENVIAR_OTP", reenviar: "CCL_ENVIAR_OTP", destino: "correo" },
      { tipo: "foto", modo: "selfie", pantalla: "CCL_SELFIE" },
      { tipo: "nuevaClave", pantalla: "CCL_NUEVA_CLAVE", seccion: "Cambio de clave" },
    ],
    fin: { tipo: "bien", titulo: "Cambiaste tu clave", texto: "Úsala desde ahora en Banca Móvil y en WhatsApp BCP Bolivia." },
  },
  FlowCierreWhatsApp: {
    seccion: "Cierre de cuenta",
    pasos: [
      { tipo: "otp", pantalla: "CWA_OTP_CORREO", enviar: "CWA_ENVIAR_OTP", reenviar: "CWA_ENVIAR_OTP", destino: "correo" },
      { tipo: "foto", modo: "selfie", pantalla: "CWA_SELFIE" },
      { tipo: "confirmarCierre", pantalla: "CWA_CONFIRMAR_CIERRE" },
    ],
    fin: { tipo: "bien", titulo: "Cerramos tu cuenta de WhatsApp", texto: "Tu acceso a Banca Móvil sigue funcionando con normalidad." },
  },
  FlowSegundaCuenta: {
    seccion: "Apertura de cuenta",
    pasos: [
      { tipo: "proposito", pantalla: "SGC_USO", conProducto: true },
      { tipo: "carta", pantalla: "SGC_CARTA" },
      { tipo: "foto", modo: "selfie", pantalla: "SGC_SELFIE" },
      { tipo: "verificarDatos", pantalla: "SGC_DATOS_CLIENTE" },
      { tipo: "contrato", pantalla: "SGC_CONTRATO" },
      { tipo: "token", pantalla: "SGC_TOKEN" },
      { tipo: "crearCuenta", pantalla: "SGC_ABRIR_CUENTA" },
    ],
    fin: { tipo: "bien", titulo: "Tu cuenta está lista", texto: "Vuelve a WhatsApp: te enviamos los documentos de tu cuenta." },
  },
};

export const FLUJO_MOVIMIENTOS = "FlowConsultaMovimientos";
export const FLUJOS_SOPORTADOS = [...Object.keys(FLUJOS), FLUJO_MOVIMIENTOS];
