import Link from "next/link";
import { Marco } from "@/components/Marco";
import { TOKENS_DEMO } from "@/lib/olivia-mock";

export default function Inicio() {
  const simulado = process.env.MOCK_OLIVIA === "true";
  return (
    <Marco>
      <div className="cuerpo">
        <h1>BCP Bolivia por WhatsApp</h1>
        <p className="lead">Esta página se abre desde el botón que te enviamos por WhatsApp.</p>
        {simulado && (
          <>
            <p className="muted">Modo simulado: enlaces de prueba</p>
            <div className="filas">
              {TOKENS_DEMO.map((t) => (
                <Link key={t} href={`/s/${t}`} style={{ padding: "13px 14px", borderBottom: "1px solid var(--g100)", color: "var(--bcp-blue)", fontWeight: 600, textDecoration: "none" }}>
                  /s/{t}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </Marco>
  );
}
