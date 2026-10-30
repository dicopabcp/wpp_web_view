"use client";

import { useEffect, useRef, useState } from "react";
import { EstadoFinal, type Fin } from "./EstadoFinal";
import { CapturaFoto } from "./CapturaFoto";
import {
  BotonVolver,
  Flecha,
  Pantalla,
  PasoCarta,
  PasoCivil,
  PasoClave,
  PasoConfirmarCierre,
  PasoContrato,
  PasoCorreo,
  PasoCrearCuenta,
  PasoCuentas,
  PasoDatos,
  PasoDomicilio,
  PasoLaboral,
  PasoNuevaClave,
  PasoOtp,
  PasoPep,
  PasoProposito,
  PasoReferencia,
  PasoReglas,
  PasoToken,
  PasoUsuario,
  PasoVerificarDatos,
  type Contexto,
  type Progreso,
  type PropsPaso,
} from "./Pasos";
import { FLUJOS, FLUJO_MOVIMIENTOS, type Paso } from "@/lib/flujos";
import { finPorMotivo } from "@/lib/motivos";
import type { Cuenta, Movimiento, RespuestaPantalla, Saldo } from "@/lib/tipos";

const TEXTOS_FOTO = {
  selfie: { titulo: "Tómate una selfie", texto: "Queremos asegurarnos que eres tú. Asegúrate de tener buena iluminación y no utilizar lentes, gorra ni barbijo.", instruccion: "Ubica tu rostro dentro del óvalo" },
  anverso: { titulo: "Foto de tu carnet por delante", texto: "Usa el lado con tu foto. Evita reflejos y que se vean los cuatro bordes.", instruccion: "Ubica tu carnet dentro del marco" },
  reverso: { titulo: "Foto de tu carnet por detrás", texto: "Ahora el lado con el código de barras. Evita reflejos y que se vean los cuatro bordes.", instruccion: "Ubica tu carnet dentro del marco" },
};

// Llamada a /api/pantalla compartida por todos los flujos: los rechazos de enlace o de sesión terminan el flujo.
function useEnviar(token: string, setFin: (f: Fin) => void) {
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  async function enviar(pantalla: string, data: unknown = {}): Promise<RespuestaPantalla | null> {
    setOcupado(true);
    setError("");
    try {
      const r = await fetch("/api/pantalla", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, pantalla, data }) });
      const respuesta = (await r.json()) as RespuestaPantalla;
      if (respuesta.expired || respuesta.enviarGenesys) {
        const motivo = finPorMotivo(respuesta.mensaje);
        const esMotivo = motivo.titulo !== finPorMotivo("").titulo;
        setFin({
          tipo: "mal",
          titulo: respuesta.enviarGenesys ? "Te ayudaremos por el chat" : esMotivo ? motivo.titulo : "No podemos continuar",
          texto: esMotivo ? motivo.texto : respuesta.mensaje || "Vuelve a WhatsApp para continuar.",
        });
        return null;
      }
      if (!respuesta.success) {
        setError(respuesta.mensaje || "No pudimos completar este paso. Inténtalo de nuevo.");
        return null;
      }
      return respuesta;
    } catch {
      setError("No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.");
      return null;
    } finally {
      setOcupado(false);
    }
  }
  return { enviar, ocupado, error, setError };
}

export function Formulario({ token, flujo }: { token: string; flujo: string }) {
  return flujo === FLUJO_MOVIMIENTOS ? <Movimientos token={token} /> : <MotorDePasos token={token} flujo={flujo} />;
}

/* ---------- Flujos por pasos (identidad, registro, apertura, cambio de clave, cierre, segunda cuenta) ---------- */

function MotorDePasos({ token, flujo }: { token: string; flujo: string }) {
  const definicion = FLUJOS[flujo];
  const [indice, setIndice] = useState(0);
  const [ctx, setCtx] = useState<Contexto>({});
  const [fin, setFin] = useState<Fin | null>(null);
  const { enviar, ocupado, error, setError } = useEnviar(token, setFin);

  if (fin) return <EstadoFinal fin={fin} />;

  const total = definicion.pasos.length;
  const paso: Paso = definicion.pasos[indice];
  // Barra de 5 segmentos proporcional al avance (los flujos largos tienen más de 15 pasos)
  const progreso: Progreso = total > 1 ? [Math.max(1, Math.ceil(((indice + 1) / total) * 5)), 5] : null;

  const avanzar = (nuevoCtx?: Contexto) => {
    if (nuevoCtx) setCtx((c) => ({ ...c, ...nuevoCtx }));
    setError("");
    window.scrollTo(0, 0);
    if (indice + 1 >= total) setFin(definicion.fin);
    else setIndice(indice + 1);
  };
  const retroceder = indice > 0 ? () => { setError(""); setIndice(indice - 1); } : undefined;
  // Pasos con código de pantalla: se envían a Olivia y solo avanzan si responde bien
  const alListo = (pantalla?: string) => async (data?: Record<string, unknown>, nuevoCtx?: Contexto) => {
    if (pantalla && !(await enviar(pantalla, data ?? {}))) return;
    avanzar(nuevoCtx);
  };

  const comunes = (pantalla?: string): PropsPaso => ({ seccion: definicion.seccion, ocupado, error, progreso, ctx, enviar, onAtras: retroceder, onListo: alListo(pantalla) });
  const clave = `${flujo}-${indice}`;

  switch (paso.tipo) {
    case "datos":
      return <PasoDatos key={clave} {...comunes(paso.pantalla)} onAtras={undefined} />;
    case "foto": {
      const t = TEXTOS_FOTO[paso.modo];
      return (
        <CapturaFoto
          key={clave}
          modo={paso.modo === "selfie" ? "selfie" : "carnet"}
          seccion={definicion.seccion}
          titulo={t.titulo}
          texto={t.texto}
          instruccion={t.instruccion}
          progreso={progreso}
          ocupado={ocupado}
          error={error}
          onAtras={retroceder ?? (() => undefined)}
          onEnviar={(b64) => alListo(paso.pantalla)({ base64: b64, lado: paso.modo === "selfie" ? "" : paso.modo.toUpperCase() })}
        />
      );
    }
    case "clave":
      return <PasoClave key={clave} {...comunes(paso.pantalla)} />;
    case "otp":
      return <PasoOtp key={clave} {...comunes(paso.pantalla)} enviarPantalla={paso.enviar} reenviarPantalla={paso.reenviar} destino={paso.destino} />;
    case "correo":
      return <PasoCorreo key={clave} {...comunes(paso.pantalla)} />;
    case "usuario":
      return <PasoUsuario key={clave} {...comunes(paso.pantalla)} />;
    case "nuevaClave":
      return <PasoNuevaClave key={clave} {...comunes(paso.pantalla)} seccionPaso={paso.seccion} />;
    case "cuentas":
      return <PasoCuentas key={clave} {...comunes()} pantalla={paso.pantalla} />;
    case "reglas":
      return <PasoReglas key={clave} {...comunes()} />;
    case "confirmarCierre":
      return <PasoConfirmarCierre key={clave} {...comunes(paso.pantalla)} />;
    case "proposito":
      return <PasoProposito key={clave} {...comunes(paso.pantalla)} conProducto={paso.conProducto} />;
    case "carta":
      return <PasoCarta key={clave} {...comunes(paso.pantalla)} />;
    case "domicilio":
      return <PasoDomicilio key={clave} {...comunes(paso.pantalla)} />;
    case "pep":
      return <PasoPep key={clave} {...comunes(paso.pantalla)} />;
    case "civil":
      return <PasoCivil key={clave} {...comunes(paso.pantalla)} />;
    case "laboral":
      return <PasoLaboral key={clave} {...comunes(paso.pantalla)} />;
    case "referencia":
      return <PasoReferencia key={clave} {...comunes(paso.pantalla)} />;
    case "verificarDatos":
      // Carga los datos con la pantalla del paso y envía los confirmados con <PREFIJO>_DATOS_CONFIRMADOS
      return <PasoVerificarDatos key={clave} {...comunes(`${paso.pantalla.split("_")[0]}_DATOS_CONFIRMADOS`)} pantalla={paso.pantalla} />;
    case "contrato":
      return <PasoContrato key={clave} {...comunes(paso.pantalla)} />;
    case "token":
      return <PasoToken key={clave} {...comunes(paso.pantalla)} />;
    case "crearCuenta":
      return <PasoCrearCuenta key={clave} {...comunes()} onAtras={undefined} pantalla={paso.pantalla} />;
  }
}

/* ---------- Consulta de saldos y movimientos ---------- */

type VistaMov = "otp" | "cuentas" | "saldo" | "movimientos" | "movimiento";
const formatoMonto = (monto: number, moneda = "") =>
  `${monto < 0 ? "-" : ""}${Math.abs(monto).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${moneda ? ` ${moneda}` : ""}`;

function Movimientos({ token }: { token: string }) {
  const [vista, setVista] = useState<VistaMov>("otp");
  const [fin, setFin] = useState<Fin | null>(null);
  const { enviar, ocupado, error, setError } = useEnviar(token, setFin);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [movimiento, setMovimiento] = useState<Movimiento | null>(null);
  const ir = (v: VistaMov) => { setError(""); setVista(v); window.scrollTo(0, 0); };

  const pedido = useRef(false);
  useEffect(() => {
    if (vista !== "cuentas" || pedido.current) return;
    pedido.current = true;
    enviar("CSM_CUENTAS").then((r) => r && setCuentas((r.data as Cuenta[]) ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista]);

  if (fin) return <EstadoFinal fin={fin} />;

  switch (vista) {
    case "otp":
      return (
        <PasoOtp
          seccion="Correo electrónico"
          ocupado={ocupado}
          error={error}
          progreso={null}
          ctx={{}}
          enviar={enviar}
          destino="correo"
          reenviarPantalla="CSM_REENVIAR_OTP"
          onListo={async (d) => { if (await enviar("CSM_OTP_CORREO", d)) ir("cuentas"); }}
        />
      );
    case "cuentas":
      return (
        <Pantalla seccion="Elige una cuenta" titulo="Tus cuentas" ocupado={ocupado} pie={<BotonVolver />}>
          {error && <p className="msg-error" role="alert">{error}</p>}
          {ocupado && cuentas.length === 0 && <div className="giro centro" aria-label="Cargando cuentas" />}
          <div className="tarjetas">
            {cuentas.map((c) => (
              <button
                key={c.numeroCuenta}
                type="button"
                className="tarjeta"
                onClick={async () => {
                  const r = await enviar("CSM_ELEGIR_CUENTA", { cuenta: c.numeroCuenta });
                  if (r) { setCuenta(c); setSaldo(r.data as Saldo); ir("saldo"); }
                }}
              >
                <b>{c.descripcion}</b>
                <small>****{c.numeroCuenta.slice(-4)}</small>
                <Flecha />
              </button>
            ))}
          </div>
        </Pantalla>
      );
    case "saldo":
      return (
        <Pantalla seccion="Cuenta" titulo={cuenta?.descripcion ?? "Cuenta"} ocupado={ocupado} onAtras={() => ir("cuentas")} pie={<BotonVolver />}>
          <div className="datos">
            <div><span>Saldo disponible</span><b className="grande">{saldo ? formatoMonto(saldo.saldo, saldo.moneda) : "-"}</b></div>
            <div><span>N° de cuenta</span><b>{cuenta?.numeroCuenta}</b></div>
          </div>
          {error && <p className="msg-error" role="alert">{error}</p>}
          <p className="muted">Revisa tus últimos movimientos realizados.</p>
          <button
            type="button"
            className="btn-sec"
            onClick={async () => {
              const r = await enviar("CSM_ELEGIR_MOVIMIENTO");
              if (r) { setMovimientos((r.data as Movimiento[]) ?? []); ir("movimientos"); }
            }}
          >
            Ver mis movimientos
          </button>
          <p className="muted">☝️ Si terminaste tu consulta, presiona <b>Volver a WhatsApp</b> para mantener tus datos protegidos.</p>
        </Pantalla>
      );
    case "movimientos":
      return (
        <Pantalla seccion="Elige un movimiento" titulo="Últimos movimientos" ocupado={ocupado} onAtras={() => ir("saldo")} pie={<BotonVolver />}>
          {movimientos.length === 0 ? (
            <p className="muted">No tienes movimientos en esta cuenta.</p>
          ) : (
            <div className="filas">
              {movimientos.map((m, i) => (
                <button key={`${m.fecha}-${i}`} type="button" onClick={() => { setMovimiento(m); ir("movimiento"); }}>
                  <span><b>{m.glosa}</b><small>{m.fecha}</small></span>
                  <span className={`monto ${m.monto > 0 ? "positivo" : ""}`}>{formatoMonto(m.monto, saldo?.moneda)}</span>
                </button>
              ))}
            </div>
          )}
        </Pantalla>
      );
    case "movimiento":
      return (
        <Pantalla seccion="Movimiento" titulo={cuenta?.descripcion ?? "Movimiento"} ocupado={ocupado} onAtras={() => ir("movimientos")} pie={<BotonVolver />}>
          <div className="datos">
            <div><span>{(movimiento?.monto ?? 0) < 0 ? "Monto enviado" : "Monto recibido"}</span><b className="grande">{movimiento ? formatoMonto(movimiento.monto, saldo?.moneda) : "-"}</b></div>
            <div><span>Detalle</span><b>{movimiento?.glosa}</b></div>
            <div><span>Fecha y hora</span><b>{movimiento?.fecha}</b></div>
          </div>
          <p className="muted">☝️ Recuerda presionar <b>Volver a WhatsApp</b> para mantener tus datos protegidos.</p>
        </Pantalla>
      );
  }
}
