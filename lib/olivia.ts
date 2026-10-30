// Solo se usa desde el servidor (route handlers y server components): aquí vive la clave X-Web-Key.
import { pantallaSimulada, sesionSimulada } from "./olivia-mock";
import type { RespuestaPantalla, SesionWeb } from "./tipos";

const modoSimulado = () => process.env.MOCK_OLIVIA === "true";

async function llamarOlivia<T>(ruta: "Sesion" | "Pantalla", cuerpo: unknown): Promise<T> {
  const base = process.env.OLIVIA_BASE_URL;
  const clave = process.env.OLIVIA_WEB_KEY;
  if (!base || !clave) {
    throw new Error("Faltan OLIVIA_BASE_URL u OLIVIA_WEB_KEY");
  }
  const respuesta = await fetch(`${base.replace(/\/$/, "")}/v1/WppWeb/${ruta}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Web-Key": clave },
    body: JSON.stringify(cuerpo),
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });
  if (!respuesta.ok) {
    throw new Error(`Olivia respondió ${respuesta.status} en ${ruta}`);
  }
  return (await respuesta.json()) as T;
}

export async function obtenerSesion(token: string): Promise<SesionWeb> {
  if (modoSimulado()) return sesionSimulada(token);
  return llamarOlivia<SesionWeb>("Sesion", { token });
}

export async function procesarPantalla(token: string, pantalla: string, data: unknown): Promise<RespuestaPantalla> {
  if (modoSimulado()) return pantallaSimulada(token, pantalla, data);
  return llamarOlivia<RespuestaPantalla>("Pantalla", { token, pantalla, data });
}
