"use client";

import { useEffect, useState } from "react";
import type { Fin } from "@/lib/motivos";
import { Marco } from "./Marco";

export type { Fin };

export function volverAWhatsApp() {
  const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (numero) {
    window.location.href = `https://wa.me/${numero}`;
  } else {
    window.close();
  }
}

// Pantalla final del Figma: muestra el resultado y vuelve sola a WhatsApp (3 s si hubo un problema, 4 s si salió bien).
export function EstadoFinal({ fin }: { fin: Fin }) {
  const [segundos, setSegundos] = useState(fin.tipo === "bien" ? 4 : 3);

  useEffect(() => {
    if (segundos <= 0) {
      volverAWhatsApp();
      return;
    }
    const id = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [segundos]);

  return (
    <Marco
      pie={
        <button type="button" className="btn" onClick={volverAWhatsApp}>
          Volver a WhatsApp
        </button>
      }
    >
      <div className="estado" role="status">
        <div className={`insignia ${fin.tipo}`}>
          {fin.tipo === "bien" ? (
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" />
              <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" />
            </svg>
          )}
        </div>
        <h2>{fin.titulo}</h2>
        <p>{fin.texto}</p>
        {segundos > 0 && <p className="regreso">Regresando a WhatsApp en {segundos}...</p>}
      </div>
    </Marco>
  );
}
