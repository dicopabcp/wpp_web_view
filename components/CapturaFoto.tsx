"use client";

import { useEffect, useRef, useState } from "react";

type Estado = "iniciando" | "lista" | "sin-permiso" | "sin-camara" | "error";
type Marco = { x: number; y: number; w: number; h: number };

const MENSAJES: Record<Exclude<Estado, "iniciando" | "lista">, string> = {
  "sin-permiso": "Necesitamos permiso para usar la cámara. Actívalo en la configuración del navegador y vuelve a intentar.",
  "sin-camara": "No encontramos una cámara en este dispositivo. Abre el enlace desde tu celular.",
  error: "No pudimos abrir la cámara. Cierra otras aplicaciones que la estén usando y vuelve a intentar.",
};

function clasificarError(e: unknown): Estado {
  const nombre = e instanceof DOMException ? e.name : "";
  if (nombre === "NotAllowedError" || nombre === "SecurityError") return "sin-permiso";
  if (nombre === "NotFoundError" || nombre === "OverconstrainedError") return "sin-camara";
  return "error";
}

// Marco guía según el tamaño de la pantalla: óvalo para el rostro, rectángulo con proporción de carnet (ID-1) para el documento.
function calcularMarco(modo: "selfie" | "carnet", ancho: number, alto: number): Marco {
  if (modo === "selfie") {
    const w = Math.min(ancho * 0.72, 340);
    const h = Math.min(w * 1.32, alto * 0.5);
    return { x: (ancho - w) / 2, y: alto * 0.44 - h / 2, w, h };
  }
  const w = Math.min(ancho * 0.88, 520);
  const h = w / 1.586;
  return { x: (ancho - w) / 2, y: alto * 0.46 - h / 2, w, h };
}

/**
 * Captura a pantalla completa con la cámara en vivo (como en Figma): la imagen ocupa toda la web y un marco indica
 * dónde ubicar el rostro o el carnet. No permite elegir archivos. El carnet se recorta al marco; la selfie se envía completa.
 */
export function CapturaFoto(props: {
  modo: "selfie" | "carnet";
  seccion: string;
  titulo: string;
  texto: string;
  instruccion: string;
  progreso: readonly [number, number] | null;
  ocupado: boolean;
  error: string;
  onAtras: () => void;
  onEnviar: (dataUrl: string) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const [estado, setEstado] = useState<Estado>("iniciando");
  const [intento, setIntento] = useState(0);
  const [foto, setFoto] = useState("");
  const [tam, setTam] = useState({ w: 390, h: 780 });

  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const observador = new ResizeObserver(() => setTam({ w: el.clientWidth, h: el.clientHeight }));
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  useEffect(() => {
    if (foto) return;
    let cancelado = false;
    const pedido = navigator.mediaDevices?.getUserMedia
      ? navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: props.modo === "selfie" ? "user" : { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })
      : Promise.reject(new DOMException("Sin soporte de cámara", "NotFoundError"));
    pedido
      .then(async (stream) => {
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        flujo.current = stream;
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play().catch(() => undefined);
        }
        setEstado("lista");
      })
      .catch((e) => {
        if (!cancelado) setEstado(clasificarError(e));
      });
    return () => {
      cancelado = true;
      flujo.current?.getTracks().forEach((t) => t.stop());
      flujo.current = null;
    };
  }, [foto, props.modo, intento]);

  const marco = calcularMarco(props.modo, tam.w, tam.h);

  function capturar() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    // Equivalencia entre la pantalla (object-fit: cover) y los píxeles reales del video
    const escala = Math.max(tam.w / v.videoWidth, tam.h / v.videoHeight);
    const ox = (tam.w - v.videoWidth * escala) / 2;
    const oy = (tam.h - v.videoHeight * escala) / 2;
    let sx = 0, sy = 0, sw = v.videoWidth, sh = v.videoHeight;
    if (props.modo === "carnet") {
      const margen = 0.06;
      sx = Math.max(0, (marco.x - marco.w * margen - ox) / escala);
      sy = Math.max(0, (marco.y - marco.h * margen - oy) / escala);
      sw = Math.min(v.videoWidth - sx, (marco.w * (1 + 2 * margen)) / escala);
      sh = Math.min(v.videoHeight - sy, (marco.h * (1 + 2 * margen)) / escala);
    }
    const reduccion = Math.min(1, 1280 / Math.max(sw, sh));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(sw * reduccion);
    lienzo.height = Math.round(sh * reduccion);
    lienzo.getContext("2d")!.drawImage(v, sx, sy, sw, sh, 0, 0, lienzo.width, lienzo.height);
    setFoto(lienzo.toDataURL("image/jpeg", 0.85));
  }

  const forma =
    props.modo === "selfie" ? (
      <ellipse cx={marco.x + marco.w / 2} cy={marco.y + marco.h / 2} rx={marco.w / 2} ry={marco.h / 2} />
    ) : (
      <rect x={marco.x} y={marco.y} width={marco.w} height={marco.h} rx={14} />
    );

  return (
    <div ref={contenedor} className="cf" aria-busy={props.ocupado}>
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={`cf-medio ${props.modo === "carnet" ? "cf-recorte" : ""}`} src={foto} alt="Foto tomada" />
      ) : (
        <video ref={video} className={`cf-medio ${props.modo === "selfie" ? "espejo" : ""}`} playsInline muted autoPlay aria-label="Vista de la cámara" />
      )}

      {/* Oscurece todo menos el marco guía */}
      {!(foto && props.modo === "carnet") && (
        <svg className="cf-mascara" width={tam.w} height={tam.h} aria-hidden="true">
          <defs>
            <mask id={`hueco-${props.modo}`}>
              <rect width={tam.w} height={tam.h} fill="#fff" />
              <g fill="#000">{forma}</g>
            </mask>
          </defs>
          <rect width={tam.w} height={tam.h} fill="rgba(10,16,30,.62)" mask={`url(#hueco-${props.modo})`} />
          <g fill="none" stroke={foto ? "#3ddc97" : "#fff"} strokeWidth={3}>
            {forma}
          </g>
        </svg>
      )}

      <div className="cf-arriba">
        <div className="cf-cabecera">
          <button type="button" className="cf-icono" onClick={props.onAtras} aria-label="Atrás">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 4l-8 8 8 8" />
            </svg>
          </button>
          <p>{props.seccion}</p>
          <span />
        </div>
        {props.progreso && (
          <div className="segmentos cf-segmentos" role="progressbar" aria-valuemin={1} aria-valuemax={props.progreso[1]} aria-valuenow={props.progreso[0]} aria-label={`Paso ${props.progreso[0]} de ${props.progreso[1]}`}>
            {Array.from({ length: props.progreso[1] }, (_, i) => (
              <span key={i} className={i < props.progreso![0] ? "on" : ""} />
            ))}
          </div>
        )}
        <h1>{props.titulo}</h1>
        <p className="cf-texto">{props.texto}</p>
      </div>

      {!foto && estado === "iniciando" && <div className="giro cf-giro" aria-label="Abriendo la cámara" />}

      <div className="cf-abajo">
        {!foto && estado !== "iniciando" && estado !== "lista" && (
          <p className="cf-alerta" role="alert">
            {MENSAJES[estado]}
          </p>
        )}
        {props.error && foto && (
          <p className="cf-alerta" role="alert">
            {props.error}
          </p>
        )}
        {foto ? (
          <div className="cf-acciones">
            <button type="button" className="cf-secundario" onClick={() => { setEstado("iniciando"); setFoto(""); }} disabled={props.ocupado}>
              Tomar otra
            </button>
            <button type="button" className={`btn ${props.ocupado ? "cargando" : ""}`} onClick={() => props.onEnviar(foto)} disabled={props.ocupado}>
              Usar esta foto
            </button>
          </div>
        ) : estado === "lista" ? (
          <>
            <p className="cf-instruccion">{props.instruccion}</p>
            <button type="button" className="cf-obturador" onClick={capturar} aria-label={props.modo === "selfie" ? "Tomar selfie" : "Tomar foto"} />
          </>
        ) : estado !== "iniciando" ? (
          <button type="button" className="cf-secundario" onClick={() => { setEstado("iniciando"); setIntento((n) => n + 1); }}>
            Volver a intentar
          </button>
        ) : null}
      </div>
    </div>
  );
}
