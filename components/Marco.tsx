import type { ReactNode } from "react";

export function LogoBcp({ size = 26, invertido = true }: { size?: number; invertido?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 46 46" aria-hidden="true">
      <circle cx="23" cy="23" r="23" fill={invertido ? "#fff" : "#064b8e"} />
      <text x="23" y="28" textAnchor="middle" fontWeight="800" fontStyle="italic" fontSize="14" fill={invertido ? "#064b8e" : "#fff"} fontFamily="Segoe UI, Arial, sans-serif">
        BCP
      </text>
      <path d="M5 19l3.5 4L5 27M38 19l3.5 4-3.5 4" fill="none" stroke="#f26e29" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Estructura común de todas las páginas: cabecera BCP, contenido y pie opcional con el botón principal.
export function Marco({ children, pie }: { children: ReactNode; pie?: ReactNode }) {
  return (
    <div className="app">
      <header className="top">
        <span>
          <LogoBcp /> BCP Bolivia
        </span>
        <small>Conexión segura</small>
      </header>
      {children}
      <footer className="pie">
        {pie}
        <p className="admin">
          <LogoBcp size={16} invertido={false} /> Administrado por BCP Bolivia
        </p>
      </footer>
    </div>
  );
}
