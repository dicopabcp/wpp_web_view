// Simula v1/WppWeb de Olivia para desarrollo local (MOCK_OLIVIA=true). Los textos son los de Olivia (appsettings "Messages").
import type { RespuestaPantalla, SesionWeb } from "./tipos";

const DEMOS: Record<string, Partial<SesionWeb>> = {
  "demo-identidad": { flujo: "FlowValidacionIdentidad", pantallaInicial: "CSM_DATOS_CI" },
  "demo-clave": { flujo: "FlowValidacionIdentidadClave", pantallaInicial: "CSM_LOGIN_CLAVE" },
  "demo-movimientos": { flujo: "FlowConsultaMovimientos", pantallaInicial: "" },
  "demo-registro": { flujo: "FlowRegistroWhatsApp", pantallaInicial: "ACBM_DATOS_CI" },
  "demo-apertura": { flujo: "FlowAperturaCuentaNoCliente", pantallaInicial: "APC_DATOS_CI" },
  "demo-sin-bm": { flujo: "FlowAperturaCuentaYaClienteSinBM", pantallaInicial: "ACSBM_DATOS_CI" },
  "demo-cambio-clave": { flujo: "FlowCambioClave", pantallaInicial: "CCL_REGLAS" },
  "demo-cierre": { flujo: "FlowCierreWhatsApp", pantallaInicial: "CWA_OTP_CORREO" },
  "demo-segunda-cuenta": { flujo: "FlowSegundaCuenta", pantallaInicial: "SGC_USO" },
  "demo-usado": { valido: false, motivo: "TOKEN_REEMPLAZADO" },
  "demo-vencido": { valido: false, motivo: "TOKEN_VENCIDO" },
};

export const TOKENS_DEMO = Object.keys(DEMOS);

// En modo simulado solo se exige la cookie del navegador: los enlaces demo-* son compartidos por todos los que prueban
// y en Vercel cada solicitud puede caer en otra instancia, así que no se guarda a qué navegador quedó ligado cada uno.

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
  }
  return { valido: true, motivo: "", flujo: "", pantallaInicial: "", celular: "+591 7****567", ...demo };
}

export async function pantallaSimulada(token: string, dispositivo: string, pantalla: string, data: unknown): Promise<RespuestaPantalla> {
  await esperar();
  if (!DEMOS[token] || DEMOS[token].valido === false) {
    return { success: false, mensaje: "TOKEN_REEMPLAZADO", expired: true, enviarGenesys: false };
  }
  if (!dispositivo) {
    return { success: false, mensaje: "DISPOSITIVO_REQUERIDO", expired: true, enviarGenesys: false };
  }
  // Pantallas propias de la consulta de movimientos
  switch (pantalla) {
    case "CSM_CUENTAS":
      return ok([
        { numeroCuenta: "6099232727", tipo: "AHORRO", descripcion: "Ahorro Negocios Bs" },
        { numeroCuenta: "6021884415", tipo: "AHORRO", descripcion: "Full Ahorro Bs" },
        { numeroCuenta: "6098419036", tipo: "AHORRO", descripcion: "Ahorro Negocios Dólares" },
      ]);
    case "CSM_ELEGIR_CUENTA": {
      const saldos: Record<string, { saldo: number; moneda: string }> = {
        "6099232727": { saldo: 5000, moneda: "Bs" },
        "6021884415": { saldo: 12350.4, moneda: "Bs" },
        "6098419036": { saldo: 1820, moneda: "$us" },
      };
      const saldo = saldos[campo(data, "cuenta")];
      return saldo ? ok(saldo) : error("No encontramos la cuenta seleccionada.");
    }
    case "CSM_ELEGIR_MOVIMIENTO":
      return ok([
        { fecha: "17/11/2025 19:15", glosa: "Transf. Recibida 65433", monto: 200 },
        { fecha: "17/11/2025 19:15", glosa: "Transf. Recibida 648221", monto: 500 },
        { fecha: "16/11/2025 13:57", glosa: "Transf. Enviada 723630", monto: -350 },
        { fecha: "15/11/2025 12:40", glosa: "Pago QR 118702", monto: -86.5 },
      ]);
  }

  // El resto se decide por el sufijo, igual que Olivia (CSM_, ACBM_, APC_, ACSBM_, CCL_, CWA_, SGC_)
  const sufijo = pantalla.slice(pantalla.indexOf("_") + 1);
  switch (sufijo) {
    case "DATOS_CI":
      return campo(data, "celular") === "71234567"
        ? ok()
        : error("No encontramos una cuenta asociada a tu documento de identidad, vuelve a intentarlo por favor.");
    case "SELFIE":
    case "DOCUMENTO_ID":
      return campo(data, "base64").length > 0 ? ok() : error("No pudimos validar la foto, vuelve a intentarlo por favor.");
    case "LOGIN_CLAVE":
    case "VALIDAR_CLAVE":
      return campo(data, "clave") === "123456" ? ok() : error("La clave de Banca Movil ingresada no es correcta, vuelve a intentarlo por favor.");
    case "OTP_CORREO":
    case "TOKEN":
      return campo(data, "otp") === "123456" ? ok() : error("El codigo ingresado no es valido, vuelve a intentarlo por favor.");
    case "ENVIAR_OTP":
    case "REENVIAR_OTP":
      return ok({ correo: "mar*****@gmail.com" });
    case "CUENTAS":
      return ok([
        { numeroCuenta: "6099232727", tipo: "AHORRO", descripcion: "Ahorro Negocios Bs" },
        { numeroCuenta: "6021884415", tipo: "AHORRO", descripcion: "Full Ahorro Bs" },
      ]);
    case "USUARIO_BM":
      return /^bancodecredito$/i.test(campo(data, "usuario")) ? error("Ese usuario ya existe. Prueba agregando números.") : ok();
    case "CLAVE_BM":
    case "NUEVA_CLAVE":
      return campo(data, "clave") === campo(data, "confirmar") ? ok() : error("Las claves no coinciden.");
    case "DATOS_CLIENTE":
      return ok({ celular: "71234567", correo: "maria.quispe@gmail.com", nombre: "María Fernanda Quispe Mamani" });
    case "RESUMEN":
      return ok({ numeroCuenta: "201-50938471-3-12" });
    case "ABRIR_CUENTA":
      return ok({ numeroCuenta: campo(data, "producto") === "CuenTasa" ? "201-248303221-5-39" : "201-50938471-3-12", producto: campo(data, "producto") });
    default:
      // Consentimientos y datos informativos (carta, PEP, estado civil, laboral, referencia, contrato, cierre...)
      return ok();
  }
}
