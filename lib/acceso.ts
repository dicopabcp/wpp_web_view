// Reglas de acceso a los enlaces: identificador del navegador (cookie) y filtro opcional por navegador.

export const COOKIE_DISPOSITIVO = "bcpwa_disp";
// WA4A/<versión> = navegador interno de WhatsApp para Android (verificado en un celular real). En iPhone no está verificado.
export const PATRON_POR_DEFECTO = "WA4A/|WhatsApp";

/**
 * Textos que debe contener el user-agent, tomados de PATRON_NAVEGADOR_PERMITIDO separados por "|" o ",".
 * Se ignoran comillas y espacios alrededor (errores comunes al cargar la variable en Vercel) y no se usan expresiones regulares.
 */
export function patronesNavegador(): string[] {
  const crudo = process.env.PATRON_NAVEGADOR_PERMITIDO?.trim() || PATRON_POR_DEFECTO;
  const patrones = crudo
    .split(/[|,]/)
    .map((p) => p.trim().replace(/^["']+|["']+$/g, "").trim())
    .filter((p) => p.length > 0);
  return patrones.length > 0 ? patrones : PATRON_POR_DEFECTO.split("|");
}

export const filtroNavegadorActivo = () => process.env.RESTRINGIR_NAVEGADOR?.trim().toLowerCase() === "true";

/**
 * Filtro por navegador, apagado por defecto (RESTRINGIR_NAVEGADOR=true para activarlo).
 * No es una barrera de seguridad: el user-agent se puede falsificar y el navegador de WhatsApp no siempre se identifica.
 * La protección real es el enlace firmado y ligado al primer navegador que lo abre.
 */
export function navegadorPermitido(userAgent: string | null): boolean {
  if (!filtroNavegadorActivo()) return true;
  const ua = (userAgent ?? "").toLowerCase();
  return patronesNavegador().some((p) => ua.includes(p.toLowerCase()));
}
