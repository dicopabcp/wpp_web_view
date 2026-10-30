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

// Códigos de pantalla aceptados por /api/pantalla (prefijos de los flujos de Olivia)
export const PATRON_PANTALLA = /^(CSM|ACBM|APC|ACSBM|CCL|CWA|SGC)_[A-Z_]{2,40}$/;
