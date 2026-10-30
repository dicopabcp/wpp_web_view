import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_DISPOSITIVO } from "@/lib/acceso";

// Asigna a cada navegador un identificador aleatorio (cookie httpOnly). Olivia liga el enlace al primer navegador
// que lo abre, así que copiar el link a otro navegador o equipo no funciona.
export function proxy(request: NextRequest) {
  if (request.cookies.has(COOKIE_DISPOSITIVO)) return NextResponse.next();

  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  // Se agrega también a la solicitud actual para que la página la lea en este mismo primer acceso
  request.cookies.set(COOKIE_DISPOSITIVO, id);
  const respuesta = NextResponse.next({ request: { headers: request.headers } });
  respuesta.cookies.set(COOKIE_DISPOSITIVO, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return respuesta;
}

export const config = {
  matcher: ["/s/:path*"],
};
