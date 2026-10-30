// Reglas de acceso a los enlaces: identificador del navegador (cookie) y filtro opcional por navegador.

export const COOKIE_DISPOSITIVO = "bcpwa_disp";
export const PATRON_POR_DEFECTO = "WA4A/|WhatsApp";

/**
 * Filtro por navegador, apagado por defecto (RESTRINGIR_NAVEGADOR=true para activarlo).
 * No es una barrera de seguridad: el user-agent se puede falsificar y el navegador de WhatsApp no siempre se identifica
 * (en iPhone se presenta como Safari y en Android a veces abre Chrome). La protección real es el enlace ligado al navegador.
 */
export function navegadorPermitido(userAgent: string | null): boolean {
  if (process.env.RESTRINGIR_NAVEGADOR !== "true") return true;
  // WA4A/<versión> = navegador interno de WhatsApp para Android (verificado en un celular real). En iPhone no está verificado.
  const patron = process.env.PATRON_NAVEGADOR_PERMITIDO || PATRON_POR_DEFECTO;
  try {
    return new RegExp(patron, "i").test(userAgent ?? "");
  } catch {
    console.error("[acceso] PATRON_NAVEGADOR_PERMITIDO no es una expresión regular válida");
    return false;
  }
}
