"use client";

import { useEffect, useRef, useState } from "react";
import type { FaceDetector } from "@mediapipe/tasks-vision";
import { EjemploCarnet } from "./EjemploCarnet";

type Estado = "iniciando" | "lista" | "sin-permiso" | "sin-camara" | "error";
type Marco = { x: number; y: number; w: number; h: number };
type Guia = "buscando" | "varios" | "centra" | "acercate" | "alejate" | "quieto";

const GUIAS: Record<Guia, string> = {
  buscando: "Ubica tu rostro dentro del óvalo",
  varios: "Solo debe aparecer tu rostro",
  centra: "Centra tu rostro en el óvalo",
  acercate: "Acércate un poco más",
  alejate: "Aléjate un poco",
  quieto: "¡Muy bien! No te muevas…",
};
// Tiempo que el rostro debe quedar bien ubicado antes de la captura automática
const ESPERA_CAPTURA_MS = 900;

// El modelo y los wasm se sirven desde /public/mediapipe (sin CDN externo); se cargan una sola vez y solo para la selfie.
let detector: Promise<FaceDetector> | null = null;
function cargarDetector() {
  detector ??= import("@mediapipe/tasks-vision").then(async ({ FaceDetector, FilesetResolver }) => {
    const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    return FaceDetector.createFromOptions(vision, {
      baseOptions: { modelAssetPath: "/mediapipe/blaze_face_short_range.tflite", delegate: "CPU" },
      runningMode: "VIDEO",
      minDetectionConfidence: 0.6,
    });
  });
  detector.catch(() => (detector = null));
  return detector;
}

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

// Equivalencia entre la pantalla (object-fit: cover) y los píxeles reales del video
function ajusteVideo(v: HTMLVideoElement, tam: { w: number; h: number }) {
  const escala = Math.max(tam.w / v.videoWidth, tam.h / v.videoHeight);
  return { escala, ox: (tam.w - v.videoWidth * escala) / 2, oy: (tam.h - v.videoHeight * escala) / 2 };
}

// Ubica el rostro detectado (píxeles del video) sobre la pantalla en espejo y lo compara con el óvalo.
function evaluarRostro(cajas: { originX: number; originY: number; width: number; height: number }[], v: HTMLVideoElement, tam: { w: number; h: number }, marco: Marco): Guia {
  if (cajas.length === 0) return "buscando";
  if (cajas.length > 1) return "varios";
  const b = cajas[0];
  const { escala, ox, oy } = ajusteVideo(v, tam);
  const cx = tam.w - (ox + (b.originX + b.width / 2) * escala);
  const cy = oy + (b.originY + b.height / 2) * escala;
  const dx = (cx - (marco.x + marco.w / 2)) / (marco.w / 2);
  const dy = (cy - (marco.y + marco.h / 2)) / (marco.h / 2);
  if (dx * dx + dy * dy > 0.1) return "centra";
  const proporcion = (b.width * escala) / marco.w;
  if (proporcion < 0.45) return "acercate";
  if (proporcion > 0.9) return "alejate";
  return "quieto";
}

/**
 * Captura a pantalla completa con la cámara en vivo (como en Figma): la imagen ocupa toda la web y un marco indica
 * dónde ubicar el rostro o el carnet. No permite elegir archivos. El carnet se recorta al marco; la selfie se envía completa
 * y se toma sola cuando el rostro queda bien ubicado en el óvalo (el obturador queda como respaldo).
 */
export function CapturaFoto(props: {
  modo: "selfie" | "carnet";
  lado?: "anverso" | "reverso";
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
  // null: sin detector (no cargó o no aplica); se usa solo el obturador
  const [guia, setGuia] = useState<Guia | null>(null);
  const capturarRef = useRef<() => void>(() => undefined);
  const medidas = useRef({ tam, marco: calcularMarco(props.modo, tam.w, tam.h) });

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
    const { escala, ox, oy } = ajusteVideo(v, tam);
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

  useEffect(() => {
    capturarRef.current = capturar;
    medidas.current = { tam, marco };
  });

  // Selfie: detecta el rostro unas 8 veces por segundo y dispara la captura cuando queda centrado y quieto
  useEffect(() => {
    if (props.modo !== "selfie" || estado !== "lista" || foto) return;
    let activo = true;
    let temporizador = 0;
    let bienDesde = 0;
    cargarDetector()
      .then((d) => {
        const ciclo = () => {
          if (!activo) return;
          const v = video.current;
          if (v && v.readyState >= 2 && v.videoWidth) {
            const cajas = d.detectForVideo(v, performance.now()).detections.flatMap((x) => (x.boundingBox ? [x.boundingBox] : []));
            const g = evaluarRostro(cajas, v, medidas.current.tam, medidas.current.marco);
            setGuia(g);
            const ahora = performance.now();
            bienDesde = g === "quieto" ? bienDesde || ahora : 0;
            if (bienDesde && ahora - bienDesde >= ESPERA_CAPTURA_MS) {
              capturarRef.current();
              return;
            }
          }
          temporizador = window.setTimeout(ciclo, 120);
        };
        ciclo();
      })
      .catch(() => {
        if (activo) setGuia(null);
      });
    return () => {
      activo = false;
      window.clearTimeout(temporizador);
      setGuia(null);
    };
  }, [props.modo, estado, foto]);

  const forma =
    props.modo === "selfie" ? (
      <ellipse cx={marco.x + marco.w / 2} cy={marco.y + marco.h / 2} rx={marco.w / 2} ry={marco.h / 2} />
    ) : (
      <rect x={marco.x} y={marco.y} width={marco.w} height={marco.h} rx={14} />
    );

  return (
    <div ref={contenedor} className="cf" aria-busy={props.ocupado}>
      {foto ? (
        // La selfie se muestra en espejo como en la vista previa; se envía sin voltear
        // eslint-disable-next-line @next/next/no-img-element
        <img className={`cf-medio ${props.modo === "carnet" ? "cf-recorte" : "espejo"}`} src={foto} alt="Foto tomada" />
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
          <g fill="none" stroke={foto || guia === "quieto" ? "#3ddc97" : "#fff"} strokeWidth={3}>
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
            {props.lado && (
              <figure className="cf-ejemplo">
                <EjemploCarnet lado={props.lado} />
                <figcaption>Ejemplo</figcaption>
              </figure>
            )}
            <p className="cf-instruccion" aria-live="polite">
              {guia ? GUIAS[guia] : props.instruccion}
            </p>
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
