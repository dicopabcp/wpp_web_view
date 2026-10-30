import { Suspense } from "react";
import { EstadoFinal } from "@/components/EstadoFinal";
import { finPorMotivo } from "@/lib/motivos";
import { Formulario } from "@/components/Formulario";
import { Marco } from "@/components/Marco";
import { obtenerSesion } from "@/lib/olivia";
import { FLUJOS_SOPORTADOS } from "@/lib/tipos";

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
  let sesion;
  try {
    sesion = await obtenerSesion(token);
  } catch (e) {
    console.error("[s/token]", e instanceof Error ? e.message : e);
    return <EstadoFinal fin={finPorMotivo("SERVICIO_NO_DISPONIBLE")} />;
  }
  if (!sesion.valido) {
    return <EstadoFinal fin={finPorMotivo(sesion.motivo)} />;
  }
  if (!(FLUJOS_SOPORTADOS as readonly string[]).includes(sesion.flujo)) {
    return <EstadoFinal fin={finPorMotivo("FLUJO_NO_SOPORTADO")} />;
  }
  return <Formulario token={token} flujo={sesion.flujo} />;
}
