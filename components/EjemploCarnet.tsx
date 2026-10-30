// Ilustración de la cédula de identidad boliviana (SEGIP, formato tarjeta) con datos ficticios, solo como guía visual.
const ROJO = "#d52b1e";
const AMARILLO = "#f9e300";
const VERDE = "#007934";
const TINTA = "#32335c";

// Módulos de un QR de muestra (no codifica nada): patrón fijo a partir de una semilla
const QR = Array.from({ length: 21 * 21 }, (_, i) => {
  const x = i % 21, y = Math.floor(i / 21);
  const enEsquina = (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);
  return !enEsquina && ((x * 7 + y * 13 + x * y) % 5 < 2);
});

function Campo(p: { x: number; y: number; etiqueta: string; valor: string }) {
  return (
    <>
      <text x={p.x} y={p.y} fontSize={7} fill="#5b6478">{p.etiqueta}</text>
      <text x={p.x} y={p.y + 11} fontSize={10} fontWeight={700} fill={TINTA}>{p.valor}</text>
    </>
  );
}

function Esquina(p: { x: number; y: number }) {
  return (
    <g>
      <rect x={p.x} y={p.y} width={14} height={14} fill={TINTA} />
      <rect x={p.x + 2} y={p.y + 2} width={10} height={10} fill="#fff" />
      <rect x={p.x + 4} y={p.y + 4} width={6} height={6} fill={TINTA} />
    </g>
  );
}

export function EjemploCarnet({ lado }: { lado: "anverso" | "reverso" }) {
  const titulo = lado === "anverso" ? "Ejemplo del carnet por delante: lado con tu foto" : "Ejemplo del carnet por detrás: lado con tu huella y código QR";
  return (
    <svg viewBox="0 0 317 200" role="img" aria-label={titulo} fontFamily="Arial, Helvetica, sans-serif">
      <defs>
        <linearGradient id={`fondo-${lado}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef6f1" />
          <stop offset="0.55" stopColor="#fbf8e6" />
          <stop offset="1" stopColor="#f6ece9" />
        </linearGradient>
        <clipPath id={`tarjeta-${lado}`}>
          <rect width={317} height={200} rx={12} />
        </clipPath>
      </defs>
      <g clipPath={`url(#tarjeta-${lado})`}>
        <rect width={317} height={200} fill={`url(#fondo-${lado})`} />
        <rect width={317} height={5} fill={ROJO} />
        <rect y={5} width={317} height={5} fill={AMARILLO} />
        <rect y={10} width={317} height={5} fill={VERDE} />

        {lado === "anverso" ? (
          <>
            <text x={158} y={30} fontSize={10} fontWeight={700} fill={TINTA} textAnchor="middle">ESTADO PLURINACIONAL DE BOLIVIA</text>
            <text x={158} y={42} fontSize={8.5} fill={TINTA} textAnchor="middle" letterSpacing={1}>CÉDULA DE IDENTIDAD</text>
            {/* Foto del titular */}
            <rect x={16} y={54} width={78} height={98} rx={4} fill="#cfd6e2" />
            <circle cx={55} cy={92} r={19} fill="#8e9ab0" />
            <path d="M22 152c4-26 18-36 33-36s29 10 33 36z" fill="#8e9ab0" />
            <Campo x={106} y={60} etiqueta="N° DE DOCUMENTO" valor="1234567" />
            <Campo x={106} y={86} etiqueta="APELLIDOS" valor="MAMANI QUISPE" />
            <Campo x={106} y={112} etiqueta="NOMBRES" valor="JUAN CARLOS" />
            <Campo x={106} y={138} etiqueta="FECHA DE NACIMIENTO" valor="15/08/1990" />
            <Campo x={226} y={138} etiqueta="EXPIRA" valor="15/08/2034" />
            <path d="M18 178c8-10 14 6 22-4s10 4 18-2 8 3 14 0" fill="none" stroke={TINTA} strokeWidth={1.4} />
            <text x={18} y={192} fontSize={6.5} fill="#5b6478">FIRMA DEL TITULAR</text>
          </>
        ) : (
          <>
            <Campo x={16} y={32} etiqueta="LUGAR DE NACIMIENTO" valor="LA PAZ - MURILLO" />
            <Campo x={16} y={58} etiqueta="DOMICILIO" valor="AV. 6 DE AGOSTO N° 100" />
            <Campo x={16} y={84} etiqueta="ESTADO CIVIL" valor="SOLTERO" />
            <Campo x={110} y={84} etiqueta="PROFESIÓN" valor="ESTUDIANTE" />
            {/* Huella dactilar */}
            <rect x={232} y={24} width={70} height={84} rx={6} fill="#fff" stroke="#c9cfdb" />
            <g fill="none" stroke="#7a8296" strokeWidth={1.3}>
              {[8, 14, 20, 26].map((r) => (
                <ellipse key={r} cx={267} cy={68} rx={r * 0.8} ry={r} />
              ))}
            </g>
            {/* Código QR */}
            <g transform="translate(16 108) scale(1.9)">
              <rect width={21} height={21} fill="#fff" />
              {QR.map((on, i) => on && <rect key={i} x={i % 21} y={Math.floor(i / 21)} width={1} height={1} fill={TINTA} />)}
            </g>
            <g transform="translate(16 108) scale(0.95)">
              <Esquina x={0} y={0} />
              <Esquina x={28} y={0} />
              <Esquina x={0} y={28} />
            </g>
            {/* Zona de lectura mecánica */}
            <rect x={64} y={124} width={253} height={76} fill="#fff" opacity={0.75} />
            <g fontFamily="Consolas, monospace" fontSize={10.5} fill={TINTA} letterSpacing={0.6}>
              <text x={72} y={144}>IDBOL1234567&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
              <text x={72} y={164}>9008151M3408150BOL&lt;&lt;&lt;&lt;</text>
              <text x={72} y={184}>MAMANI&lt;&lt;JUAN&lt;CARLOS&lt;&lt;&lt;</text>
            </g>
          </>
        )}

        <text x={158} y={118} fontSize={34} fontWeight={800} fill={ROJO} opacity={0.22} textAnchor="middle" transform="rotate(-18 158 110)">EJEMPLO</text>
      </g>
      <rect x={0.5} y={0.5} width={316} height={199} rx={12} fill="none" stroke="rgba(0,0,0,.18)" />
    </svg>
  );
}
