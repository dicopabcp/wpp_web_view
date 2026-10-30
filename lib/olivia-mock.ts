// Simula v1/WppWeb de Olivia para desarrollo local (MOCK_OLIVIA=true). Los textos son los de Olivia (appsettings "Messages").
import type { RespuestaPantalla, SesionWeb } from "./tipos";

const DEMOS: Record<string, Partial<SesionWeb>> = {
  "demo-identidad": { flujo: "FlowValidacionIdentidad", pantallaInicial: "CSM_DATOS_CI" },
  "demo-clave": { flujo: "FlowValidacionIdentidadClave", pantallaInicial: "CSM_LOGIN_CLAVE" },
  "demo-movimientos": { flujo: "FlowConsultaMovimientos", pantallaInicial: "" },
  "demo-usado": { valido: false, motivo: "TOKEN_REEMPLAZADO" },
  "demo-vencido": { valido: false, motivo: "TOKEN_VENCIDO" },
};

export const TOKENS_DEMO = Object.keys(DEMOS);

// Enlace -> navegador que lo abrió primero (en memoria; se reinicia con el servidor)
const vinculos = new Map<string, string>();

const esperar = () => new Promise((r) => setTimeout(r, 450));
const ok = (data?: unknown): RespuestaPantalla => ({ success: true, mensaje: "", expired: false, enviarGenesys: false, data });
const error = (mensaje: string): RespuestaPantalla => ({ success: false, mensaje, expired: false, enviarGenesys: false });
const campo = (data: unknown, nombre: string) =>
  typeof data === "object" && data !== null && typeof (data as Record<string, unknown>)[nombre] === "string"
    ? ((data as Record<string, unknown>)[nombre] as string)
    : "";

export async function sesionSimulada(token: string, dispositivo: string): Promise<SesionWeb> {
  await esperar();
  const demo = DEMOS[token];
  const rechazo = (motivo: string): SesionWeb => ({ valido: false, motivo, flujo: "", pantallaInicial: "", celular: "" });
  if (!demo) return rechazo("TOKEN_INVALIDO");
  if (demo.valido !== false) {
    if (!dispositivo) return rechazo("DISPOSITIVO_REQUERIDO");
    const vinculado = vinculos.get(token);
    if (vinculado && vinculado !== dispositivo) return rechazo("DISPOSITIVO_NO_COINCIDE");
    vinculos.set(token, dispositivo);
  }
  return { valido: true, motivo: "", flujo: "", pantallaInicial: "", celular: "+591 7****567", ...demo };
}

export async function pantallaSimulada(token: string, dispositivo: string, pantalla: string, data: unknown): Promise<RespuestaPantalla> {
  await esperar();
  if (!DEMOS[token] || DEMOS[token].valido === false) {
    return { success: false, mensaje: "TOKEN_REEMPLAZADO", expired: true, enviarGenesys: false };
  }
  if (vinculos.get(token) !== dispositivo) {
    return { success: false, mensaje: "DISPOSITIVO_NO_COINCIDE", expired: true, enviarGenesys: false };
  }
  switch (pantalla) {
    case "CSM_DATOS_CI":
      return campo(data, "celular") === "71234567"
        ? ok()
        : error("No encontramos una cuenta asociada a tu documento de identidad, vuelve a intentarlo por favor.");
    case "CSM_SELFIE":
    case "CSM_DOCUMENTO_ID":
      return campo(data, "base64").length > 0 ? ok() : error("No pudimos validar la foto, vuelve a intentarlo por favor.");
    case "CSM_LOGIN_CLAVE":
      return campo(data, "clave") === "123456"
        ? ok()
        : error("La clave de Banca Movil ingresada no es correcta, vuelve a intentarlo por favor.");
    case "CSM_OTP_CORREO":
      return campo(data, "otp") === "123456" ? ok() : error("El codigo ingresado no es valido, vuelve a intentarlo por favor.");
    case "CSM_REENVIAR_OTP":
      return ok();
    case "CSM_CUENTAS":
      return ok([
        { numeroCuenta: "6099232727", tipo: "AHORRO", descripcion: "Ahorro Negocios Bs" },
        { numeroCuenta: "6021884415", tipo: "AHORRO", descripcion: "Full Ahorro Bs" },
        { numeroCuenta: "6098419036", tipo: "AHORRO", descripcion: "Ahorro Negocios Dólares" },
      ]);
    case "CSM_ELEGIR_CUENTA": {
      const cuenta = campo(data, "cuenta");
      const saldos: Record<string, { saldo: number; moneda: string }> = {
        "6099232727": { saldo: 5000, moneda: "Bs" },
        "6021884415": { saldo: 12350.4, moneda: "Bs" },
        "6098419036": { saldo: 1820, moneda: "$us" },
      };
      return saldos[cuenta] ? ok(saldos[cuenta]) : error("No encontramos la cuenta seleccionada.");
    }
    case "CSM_ELEGIR_MOVIMIENTO":
      return ok([
        { fecha: "17/11/2025 19:15", glosa: "Transf. Recibida 65433", monto: 200 },
        { fecha: "17/11/2025 19:15", glosa: "Transf. Recibida 648221", monto: 500 },
        { fecha: "16/11/2025 13:57", glosa: "Transf. Enviada 723630", monto: -350 },
        { fecha: "15/11/2025 12:40", glosa: "Pago QR 118702", monto: -86.5 },
      ]);
    default:
      return error("Pantalla no soportada.");
  }
}
