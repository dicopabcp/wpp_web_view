"use client";

import { useEffect, useRef, useState } from "react";

type Estado = "iniciando" | "lista" | "sin-permiso" | "sin-camara" | "error";

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

// Foto tomada en vivo con la cámara del dispositivo (no permite elegir archivos de la galería ni de carpetas).
// Selfie con la cámara frontal; carnet con la trasera. La foto se guarda sin espejo y reducida a 1280 px en JPEG.
export function Camara({ modo, foto, onFoto }: { modo: "selfie" | "carnet"; foto: string; onFoto: (dataUrl: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const flujo = useRef<MediaStream | null>(null);
  const [estado, setEstado] = useState<Estado>("iniciando");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (foto) return;
    let cancelado = false;
    const pedido = navigator.mediaDevices?.getUserMedia
      ? navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: modo === "selfie" ? "user" : { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 960 },
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
  }, [foto, modo, intento]);

  function reintentar() {
    setEstado("iniciando");
    setIntento((n) => n + 1);
  }

  function capturar() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const escala = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(v.videoWidth * escala);
    lienzo.height = Math.round(v.videoHeight * escala);
    lienzo.getContext("2d")!.drawImage(v, 0, 0, lienzo.width, lienzo.height);
    onFoto(lienzo.toDataURL("image/jpeg", 0.85));
  }

  return (
    <>
      <div className={`captura ${modo === "selfie" ? "selfie" : "carnet"} ${foto ? "lista-ok" : ""}`}>
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="Foto tomada" />
        ) : (
          <>
            <video ref={video} className={modo === "selfie" ? "espejo" : ""} playsInline muted autoPlay aria-label="Vista de la cámara" />
            {estado === "iniciando" && <div className="giro" aria-label="Abriendo la cámara" />}
          </>
        )}
      </div>
      {!foto && estado !== "iniciando" && estado !== "lista" && (
        <p className="msg-error" role="alert" style={{ margin: 0 }}>
          {MENSAJES[estado]}
        </p>
      )}
      {foto ? (
        <button
          type="button"
          className="btn-sec"
          onClick={() => {
            setEstado("iniciando");
            onFoto("");
          }}
        >
          Tomar otra foto
        </button>
      ) : estado === "lista" ? (
        <button type="button" className="btn-sec" onClick={capturar}>
          {modo === "selfie" ? "Tomar selfie" : "Tomar foto"}
        </button>
      ) : estado !== "iniciando" ? (
        <button type="button" className="btn-sec" onClick={reintentar}>
          Volver a intentar
        </button>
      ) : null}
    </>
  );
}
