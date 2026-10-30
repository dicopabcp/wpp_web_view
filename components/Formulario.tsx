"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { EstadoFinal, volverAWhatsApp, type Fin } from "./EstadoFinal";
import { finPorMotivo } from "@/lib/motivos";
import { CapturaFoto } from "./CapturaFoto";
import { Marco } from "./Marco";
import type { Cuenta, Movimiento, RespuestaPantalla, Saldo } from "@/lib/tipos";

type Paso = "datos" | "selfie" | "anverso" | "reverso" | "clave" | "otp" | "cuentas" | "saldo" | "movimientos" | "movimiento";

const PASOS_INICIALES: Record<string, Paso> = {
  FlowValidacionIdentidad: "datos",
  FlowValidacionIdentidadClave: "clave",
  FlowConsultaMovimientos: "otp",
};
const ORDEN_IDENTIDAD: Paso[] = ["datos", "selfie", "anverso", "reverso", "clave"];
const FIN_VALIDACION: Fin = { tipo: "bien", titulo: "Listo, confirmamos que eres tú", texto: "Vuelve a WhatsApp: te enviamos el botón para ver tus saldos y movimientos." };
const FIN_SESION: Fin = { tipo: "bien", titulo: "Iniciaste sesión", texto: "Tu sesión segura dura 10 minutos. Vuelve a WhatsApp: te enviamos el botón para ver tus saldos." };

const formatoMonto = (monto: number, moneda = "") =>
  `${monto < 0 ? "-" : ""}${Math.abs(monto).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${moneda ? ` ${moneda}` : ""}`;
const enmascarar = (numero: string) => (numero.length > 4 ? `****${numero.slice(-4)}` : numero);

export function Formulario({ token, flujo }: { token: string; flujo: string }) {
  const [paso, setPaso] = useState<Paso>(PASOS_INICIALES[flujo]);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [fin, setFin] = useState<Fin | null>(null);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [cuenta, setCuenta] = useState<Cuenta | null>(null);
  const [saldo, setSaldo] = useState<Saldo | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [movimiento, setMovimiento] = useState<Movimiento | null>(null);

  const ir = (siguiente: Paso) => {
    setError("");
    setPaso(siguiente);
    window.scrollTo(0, 0);
  };

  async function enviar(pantalla: string, data: unknown = {}): Promise<RespuestaPantalla | null> {
    setOcupado(true);
    setError("");
    try {
      const r = await fetch("/api/pantalla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, pantalla, data }),
      });
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

  // Al entrar a "Tus cuentas" se piden las cuentas del cliente autenticado.
  const cuentasPedidas = useRef(false);
  useEffect(() => {
    if (paso !== "cuentas" || cuentasPedidas.current) return;
    cuentasPedidas.current = true;
    enviar("CSM_CUENTAS").then((r) => r && setCuentas((r.data as Cuenta[]) ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso]);

  if (fin) return <EstadoFinal fin={fin} />;

  const segmento = ORDEN_IDENTIDAD.indexOf(paso);
  const progreso = flujo === "FlowValidacionIdentidad" && segmento >= 0 ? [segmento + 1, ORDEN_IDENTIDAD.length] as const : null;

  switch (paso) {
    case "datos":
      return <PasoDatos ocupado={ocupado} error={error} progreso={progreso} onEnviar={async (d) => (await enviar("CSM_DATOS_CI", d)) && ir("selfie")} />;
    case "selfie":
      return (
        <CapturaFoto
          key="selfie"
          modo="selfie"
          seccion="Validación de identidad"
          titulo="Tómate una selfie"
          texto="Queremos asegurarnos que eres tú. Asegúrate de tener buena iluminación y no utilizar lentes, gorra ni barbijo."
          instruccion="Ubica tu rostro dentro del óvalo"
          ocupado={ocupado}
          error={error}
          progreso={progreso}
          onAtras={() => ir("datos")}
          onEnviar={async (b64) => (await enviar("CSM_SELFIE", { base64: b64 })) && ir("anverso")}
        />
      );
    case "anverso":
      return (
        <CapturaFoto
          key="anverso"
          modo="carnet"
          seccion="Validación de identidad"
          titulo="Foto de tu carnet por delante"
          texto="Usa el lado con tu foto. Evita reflejos y que se vean los cuatro bordes."
          instruccion="Ubica tu carnet dentro del marco"
          ocupado={ocupado}
          error={error}
          progreso={progreso}
          onAtras={() => ir("selfie")}
          onEnviar={async (b64) => (await enviar("CSM_DOCUMENTO_ID", { base64: b64, lado: "ANVERSO" })) && ir("reverso")}
        />
      );
    case "reverso":
      return (
        <CapturaFoto
          key="reverso"
          modo="carnet"
          seccion="Validación de identidad"
          titulo="Foto de tu carnet por detrás"
          texto="Ahora el lado con el código de barras. Evita reflejos y que se vean los cuatro bordes."
          instruccion="Ubica tu carnet dentro del marco"
          ocupado={ocupado}
          error={error}
          progreso={progreso}
          onAtras={() => ir("anverso")}
          onEnviar={async (b64) => (await enviar("CSM_DOCUMENTO_ID", { base64: b64, lado: "REVERSO" })) && ir("clave")}
        />
      );
    case "clave":
      return (
        <PasoClave
          ocupado={ocupado}
          error={error}
          progreso={progreso}
          onEnviar={async (clave) => (await enviar("CSM_LOGIN_CLAVE", { clave })) && setFin(flujo === "FlowValidacionIdentidad" ? FIN_VALIDACION : FIN_SESION)}
        />
      );
    case "otp":
      return (
        <PasoOtp
          ocupado={ocupado}
          error={error}
          onReenviar={async () => {
            if (await enviar("CSM_REENVIAR_OTP")) setError("");
          }}
          onEnviar={async (otp) => (await enviar("CSM_OTP_CORREO", { otp })) && ir("cuentas")}
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
                  if (r) {
                    setCuenta(c);
                    setSaldo(r.data as Saldo);
                    ir("saldo");
                  }
                }}
              >
                <b>{c.descripcion}</b>
                <small>{enmascarar(c.numeroCuenta)}</small>
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
            <div>
              <span>Saldo disponible</span>
              <b className="grande">{saldo ? formatoMonto(saldo.saldo, saldo.moneda) : "-"}</b>
            </div>
            <div>
              <span>N° de cuenta</span>
              <b>{cuenta?.numeroCuenta}</b>
            </div>
          </div>
          {error && <p className="msg-error" role="alert">{error}</p>}
          <p className="muted">Revisa tus últimos movimientos realizados.</p>
          <button
            type="button"
            className="btn-sec"
            onClick={async () => {
              const r = await enviar("CSM_ELEGIR_MOVIMIENTO");
              if (r) {
                setMovimientos((r.data as Movimiento[]) ?? []);
                ir("movimientos");
              }
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
                <button
                  key={`${m.fecha}-${i}`}
                  type="button"
                  onClick={() => {
                    setMovimiento(m);
                    ir("movimiento");
                  }}
                >
                  <span>
                    <b>{m.glosa}</b>
                    <small>{m.fecha}</small>
                  </span>
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
            <div>
              <span>{(movimiento?.monto ?? 0) < 0 ? "Monto enviado" : "Monto recibido"}</span>
              <b className="grande">{movimiento ? formatoMonto(movimiento.monto, saldo?.moneda) : "-"}</b>
            </div>
            <div>
              <span>Detalle</span>
              <b>{movimiento?.glosa}</b>
            </div>
            <div>
              <span>Fecha y hora</span>
              <b>{movimiento?.fecha}</b>
            </div>
          </div>
          <p className="muted">☝️ Recuerda presionar <b>Volver a WhatsApp</b> para mantener tus datos protegidos.</p>
        </Pantalla>
      );
  }
}

/* ---------- Piezas de interfaz ---------- */

function Pantalla(props: {
  seccion: string;
  titulo?: string;
  ocupado: boolean;
  progreso?: readonly [number, number] | null;
  onAtras?: () => void;
  pie?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Marco pie={props.pie}>
      <main className={`cuerpo ${props.ocupado ? "ocupado" : ""}`} aria-busy={props.ocupado}>
        <div className="cabecera">
          {props.onAtras ? (
            <button type="button" className="atras" onClick={props.onAtras} aria-label="Atrás">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 4l-8 8 8 8" />
              </svg>
            </button>
          ) : (
            <span />
          )}
          <p>{props.seccion}</p>
          <span />
        </div>
        {props.progreso && (
          <div className="segmentos" role="progressbar" aria-valuemin={1} aria-valuemax={props.progreso[1]} aria-valuenow={props.progreso[0]} aria-label={`Paso ${props.progreso[0]} de ${props.progreso[1]}`}>
            {Array.from({ length: props.progreso[1] }, (_, i) => (
              <span key={i} className={i < props.progreso![0] ? "on" : ""} />
            ))}
          </div>
        )}
        {props.titulo && <h1>{props.titulo}</h1>}
        {props.children}
      </main>
    </Marco>
  );
}

function BotonPrincipal({ texto, habilitado, ocupado, onClick }: { texto: string; habilitado: boolean; ocupado: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`btn ${ocupado ? "cargando" : ""}`} disabled={!habilitado || ocupado} onClick={onClick}>
      {texto}
    </button>
  );
}

function BotonVolver() {
  return (
    <button type="button" className="btn" onClick={volverAWhatsApp}>
      Volver a WhatsApp
    </button>
  );
}

function Info({ children }: { children: ReactNode }) {
  return (
    <div className="info">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 11v6" strokeLinecap="round" />
        <circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
      </svg>
      <div>{children}</div>
    </div>
  );
}

function Flecha() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function ErrorCampo({ error }: { error: string }) {
  return error ? <p className="msg-error" role="alert">{error}</p> : null;
}

function PasoDatos({ ocupado, error, progreso, onEnviar }: { ocupado: boolean; error: string; progreso: readonly [number, number] | null; onEnviar: (d: { carnet: string; complemento: string; celular: string }) => void }) {
  const [carnet, setCarnet] = useState("");
  const [complemento, setComplemento] = useState("");
  const [celular, setCelular] = useState("");
  const [acepta, setAcepta] = useState(false);
  const valido = /^\d{5,10}$/.test(carnet) && /^[67]\d{7}$/.test(celular) && acepta;
  return (
    <Pantalla
      seccion="Verificación de identidad"
      titulo="Verifica tu identidad"
      ocupado={ocupado}
      progreso={progreso}
      pie={<BotonPrincipal texto="Continuar" habilitado={valido} ocupado={ocupado} onClick={() => onEnviar({ carnet, complemento, celular })} />}
    >
      <p className="lead">Para proteger tu seguridad, primero verificaremos tu información utilizando tu número de documento de identidad y número de celular.</p>
      <div className="fila">
        <label className="campo" htmlFor="carnet">
          <span>Número de carnet</span>
          <input id="carnet" inputMode="numeric" maxLength={10} placeholder="Ej: 8456123" value={carnet} onChange={(e) => setCarnet(e.target.value.replace(/\D/g, ""))} autoComplete="off" />
        </label>
        <label className="campo" htmlFor="complemento">
          <span>Complemento</span>
          <input id="complemento" maxLength={2} placeholder="Opcional" value={complemento} onChange={(e) => setComplemento(e.target.value.toUpperCase())} autoComplete="off" />
        </label>
      </div>
      <label className={`campo ${error ? "error" : ""}`} htmlFor="celular">
        <span>Número de celular</span>
        <div className="prefijo">
          <em>+591</em>
          <input id="celular" inputMode="numeric" maxLength={8} placeholder="71234567" value={celular} onChange={(e) => setCelular(e.target.value.replace(/\D/g, ""))} autoComplete="tel-national" />
        </div>
      </label>
      <ErrorCampo error={error} />
      <Info>Los datos de tu carnet serán utilizados para consultar y validar tu información en SEGIP como parte del proceso de verificación de identidad.</Info>
      <label className="check" htmlFor="acepta">
        <input id="acepta" type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
        <span>He leído y acepto el tratamiento de mis datos personales</span>
      </label>
    </Pantalla>
  );
}

function CampoClave({ id, etiqueta, valor, onCambio, error }: { id: string; etiqueta: string; valor: string; onCambio: (v: string) => void; error: string }) {
  const [ver, setVer] = useState(false);
  return (
    <label className={`campo ${error ? "error" : ""}`} htmlFor={id}>
      <span>{etiqueta}</span>
      <input
        id={id}
        type={ver ? "text" : "password"}
        inputMode="numeric"
        maxLength={6}
        placeholder="6 dígitos"
        value={valor}
        onChange={(e) => onCambio(e.target.value.replace(/\D/g, ""))}
        autoComplete="off"
        style={{ paddingRight: 34 }}
      />
      <button type="button" className="ojo" onClick={() => setVer((v) => !v)} aria-label={ver ? "Ocultar clave" : "Ver clave"}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </label>
  );
}

function PasoClave({ ocupado, error, progreso, onEnviar }: { ocupado: boolean; error: string; progreso: readonly [number, number] | null; onEnviar: (clave: string) => void }) {
  const [clave, setClave] = useState("");
  return (
    <Pantalla
      seccion="Clave de seguridad"
      titulo="Ingresa tu clave de Banca Móvil"
      ocupado={ocupado}
      progreso={progreso}
      pie={<BotonPrincipal texto="Continuar" habilitado={/^\d{6}$/.test(clave)} ocupado={ocupado} onClick={() => onEnviar(clave)} />}
    >
      <p className="lead">Escribe tu clave de seguridad.</p>
      <CampoClave id="clave" etiqueta="Clave" valor={clave} onCambio={setClave} error={error} />
      <ErrorCampo error={error} />
      <Info>Es la misma clave de 6 dígitos que usas en la app Banca Móvil BCP Bolivia. Nunca te la pediremos por el chat.</Info>
    </Pantalla>
  );
}

function PasoOtp({ ocupado, error, onEnviar, onReenviar }: { ocupado: boolean; error: string; onEnviar: (otp: string) => void; onReenviar: () => void }) {
  const [otp, setOtp] = useState("");
  return (
    <Pantalla
      seccion="Correo electrónico"
      titulo="Ahora ingresa el código de verificación"
      ocupado={ocupado}
      pie={<BotonPrincipal texto="Continuar" habilitado={/^\d{6}$/.test(otp)} ocupado={ocupado} onClick={() => onEnviar(otp)} />}
    >
      <p className="lead">Hemos enviado un código de 6 dígitos a tu correo registrado.</p>
      <label className={`campo ${error ? "error" : ""}`} htmlFor="otp">
        <span>Código de verificación</span>
        <input id="otp" inputMode="numeric" maxLength={6} placeholder="Ej: 123456" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} autoComplete="one-time-code" />
      </label>
      <ErrorCampo error={error} />
      <p className="muted centro" style={{ textAlign: "center" }}>
        ¿No recibiste el código?{" "}
        <button type="button" className="enlace" onClick={onReenviar}>
          Reenviar código
        </button>
      </p>
      <Info>El código es válido por 10 minutos. Si no lo ves en tu bandeja, revisa tu carpeta de spam o correo no deseado.</Info>
    </Pantalla>
  );
}
