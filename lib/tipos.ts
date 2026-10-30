// Contratos con Olivia (v1/WppWeb). ASP.NET serializa en camelCase.

export type SesionWeb = {
  valido: boolean;
  motivo: string;
  flujo: string;
  pantallaInicial: string;
  celular: string;
};

export type RespuestaPantalla = {
  success: boolean;
  mensaje: string;
  expired: boolean;
  enviarGenesys: boolean;
  data?: unknown;
};

export type Cuenta = { numeroCuenta: string; tipo: string; descripcion: string };
export type Saldo = { saldo: number; moneda: string };
export type Movimiento = { fecha: string; glosa: string; monto: number };

export const FLUJOS_SOPORTADOS = ["FlowValidacionIdentidad", "FlowValidacionIdentidadClave", "FlowConsultaMovimientos"] as const;

export const PANTALLAS_PERMITIDAS = new Set([
  "CSM_DATOS_CI",
  "CSM_SELFIE",
  "CSM_DOCUMENTO_ID",
  "CSM_LOGIN_CLAVE",
  "CSM_OTP_CORREO",
  "CSM_REENVIAR_OTP",
  "CSM_CUENTAS",
  "CSM_ELEGIR_CUENTA",
  "CSM_ELEGIR_MOVIMIENTO",
]);
