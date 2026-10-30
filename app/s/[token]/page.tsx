import { cookies, headers } from "next/headers";
import { Suspense } from "react";
import { COOKIE_DISPOSITIVO, navegadorPermitido } from "@/lib/acceso";
import { EstadoFinal } from "@/components/EstadoFinal";
import { finPorMotivo } from "@/lib/motivos";
import { Formulario } from "@/components/Formulario";
import { Marco } from "@/components/Marco";
import { obtenerSesion } from "@/lib/olivia";
import { FLUJOS_SOPORTADOS } from "@/lib/flujos";

// Página que abre el botón CTA URL: valida el enlace en el servidor (por solicitud) y arranca el formulario del flujo.
export default function PaginaEnlace({ params }: PageProps<"/s/[token]">) {
  return (
    <Suspense
      fallback={
        <Marco>
          <div className="estado">
            <div className="giro" aria-label="Cargando" />
          </div>
        </Marco>
      }
    >
      <Contenido params={params} />
    </Suspense>
  );
}

async function Contenido({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const userAgent = (await headers()).get("user-agent") ?? "";
  const dispositivo = (await cookies()).get(COOKIE_DISPOSITIVO)?.value ?? "";

  // Todo rechazo queda en el log del servidor; con MOSTRAR_DIAGNOSTICO=true también se muestra en pantalla.
  const rechazar = (motivo: string, detalle = "") => {
    const diagnostico: Record<string, string> = {
      motivo,
      "user-agent": userAgent || "(vacío)",
      "cookie del navegador": dispositivo ? "presente" : "no llegó",
      "modo": process.env.MOCK_OLIVIA === "true" ? "simulado (MOCK_OLIVIA=true)" : "Olivia",
      "filtro de navegador": process.env.RESTRINGIR_NAVEGADOR === "true" ? `activo (patrón: ${process.env.PATRON_NAVEGADOR_PERMITIDO || "WhatsApp"})` : "apagado",
      "token (inicio)": `${token.slice(0, 12)}${token.length > 12 ? "…" : ""} (${token.length} caracteres)`,
      ...(detalle ? { detalle } : {}),
    };
    console.warn("[s/token] rechazo", JSON.stringify(diagnostico));
    return <EstadoFinal fin={finPorMotivo(motivo)} diagnostico={process.env.MOSTRAR_DIAGNOSTICO === "true" ? diagnostico : undefined} />;
  };

  if (!navegadorPermitido(userAgent)) return rechazar("NAVEGADOR_NO_PERMITIDO");
  let sesion;
  try {
    sesion = await obtenerSesion(token, dispositivo);
  } catch (e) {
    return rechazar("SERVICIO_NO_DISPONIBLE", e instanceof Error ? e.message : String(e));
  }
  if (!sesion.valido) return rechazar(sesion.motivo || "TOKEN_INVALIDO");
  if (!FLUJOS_SOPORTADOS.includes(sesion.flujo)) return rechazar("FLUJO_NO_SOPORTADO", `flujo recibido: ${sesion.flujo || "(vacío)"}`);
  return <Formulario token={token} flujo={sesion.flujo} />;
}
