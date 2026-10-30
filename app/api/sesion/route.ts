import { obtenerSesion } from "@/lib/olivia";

export async function POST(request: Request) {
  const { token } = (await request.json().catch(() => ({}))) as { token?: unknown };
  if (typeof token !== "string" || token.length === 0) {
    return Response.json({ valido: false, motivo: "TOKEN_INVALIDO" }, { status: 400 });
  }
  try {
    return Response.json(await obtenerSesion(token));
  } catch (e) {
    console.error("[api/sesion]", e instanceof Error ? e.message : e);
    return Response.json({ valido: false, motivo: "SERVICIO_NO_DISPONIBLE" }, { status: 502 });
  }
}
