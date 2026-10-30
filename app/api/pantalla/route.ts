import { procesarPantalla } from "@/lib/olivia";
import { PANTALLAS_PERMITIDAS } from "@/lib/tipos";

// Las fotos llegan en base64 ya reducidas en el navegador; se limita el cuerpo para no reenviar archivos enormes a Olivia.
const MAX_BYTES = 6 * 1024 * 1024;

export async function POST(request: Request) {
  const texto = await request.text();
  if (texto.length > MAX_BYTES) {
    return Response.json({ success: false, mensaje: "La foto es demasiado pesada. Toma otra con menos resolución.", expired: false, enviarGenesys: false }, { status: 413 });
  }
  let cuerpo: { token?: unknown; pantalla?: unknown; data?: unknown };
  try {
    cuerpo = JSON.parse(texto);
  } catch {
    return Response.json({ success: false, mensaje: "Solicitud inválida.", expired: false, enviarGenesys: false }, { status: 400 });
  }
  const { token, pantalla, data } = cuerpo;
  if (typeof token !== "string" || typeof pantalla !== "string" || !PANTALLAS_PERMITIDAS.has(pantalla)) {
    return Response.json({ success: false, mensaje: "Solicitud inválida.", expired: false, enviarGenesys: false }, { status: 400 });
  }
  try {
    return Response.json(await procesarPantalla(token, pantalla, data ?? {}));
  } catch (e) {
    console.error("[api/pantalla]", pantalla, e instanceof Error ? e.message : e);
    return Response.json(
      { success: false, mensaje: "No pudimos conectarnos. Inténtalo de nuevo en unos segundos.", expired: false, enviarGenesys: false },
      { status: 502 },
    );
  }
}
