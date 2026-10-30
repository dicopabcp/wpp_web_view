"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { volverAWhatsApp } from "./EstadoFinal";
import { Marco } from "./Marco";
import type { RespuestaPantalla } from "@/lib/tipos";

export type Progreso = readonly [number, number] | null;
export type Enviar = (pantalla: string, data?: unknown) => Promise<RespuestaPantalla | null>;
// Datos compartidos entre pasos del mismo flujo (p. ej. producto elegido o número de cuenta creado)
export type Contexto = Record<string, string>;

export type PropsPaso = {
  seccion: string;
  ocupado: boolean;
  error: string;
  progreso: Progreso;
  ctx: Contexto;
  enviar: Enviar;
  onAtras?: () => void;
  onListo: (data?: Record<string, unknown>, ctx?: Contexto) => void;
};

/* ---------- Piezas comunes ---------- */

export function Pantalla(props: { seccion: string; titulo?: string; ocupado: boolean; progreso?: Progreso; onAtras?: () => void; pie?: ReactNode; children: ReactNode }) {
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
        {props.progreso && <Segmentos progreso={props.progreso} />}
        {props.titulo && <h1>{props.titulo}</h1>}
        {props.children}
      </main>
    </Marco>
  );
}

export function Segmentos({ progreso, claro = false }: { progreso: readonly [number, number]; claro?: boolean }) {
  return (
    <div className={`segmentos ${claro ? "cf-segmentos" : ""}`} role="progressbar" aria-valuemin={1} aria-valuemax={progreso[1]} aria-valuenow={progreso[0]} aria-label={`Paso ${progreso[0]} de ${progreso[1]}`}>
      {Array.from({ length: progreso[1] }, (_, i) => (
        <span key={i} className={i < progreso[0] ? "on" : ""} />
      ))}
    </div>
  );
}

export function BotonPrincipal({ texto = "Continuar", habilitado, ocupado, onClick }: { texto?: string; habilitado: boolean; ocupado: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`btn ${ocupado ? "cargando" : ""}`} disabled={!habilitado || ocupado} onClick={onClick}>
      {texto}
    </button>
  );
}

export function BotonVolver() {
  return (
    <button type="button" className="btn" onClick={volverAWhatsApp}>
      Volver a WhatsApp
    </button>
  );
}

export function Info({ children }: { children: ReactNode }) {
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

export function ErrorCampo({ error }: { error: string }) {
  return error ? <p className="msg-error" role="alert">{error}</p> : null;
}

export function Flecha() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

function Campo({ id, etiqueta, valor, onCambio, error = false, ...resto }: { id: string; etiqueta: string; valor: string; onCambio: (v: string) => void; error?: boolean } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange">) {
  return (
    <label className={`campo ${error ? "error" : ""}`} htmlFor={id}>
      <span>{etiqueta}</span>
      <input id={id} value={valor} onChange={(e) => onCambio(e.target.value)} autoComplete="off" {...resto} />
    </label>
  );
}

function Opciones({ nombre, opciones, valor, onCambio }: { nombre: string; opciones: string[]; valor: string; onCambio: (v: string) => void }) {
  return (
    <div className="opciones" role="radiogroup">
      {opciones.map((o, i) => (
        <label key={o} className={`opcion ${valor === o ? "marcada" : ""}`} htmlFor={`${nombre}-${i}`}>
          <input id={`${nombre}-${i}`} type="radio" name={nombre} value={o} checked={valor === o} onChange={() => onCambio(o)} />
          {o}
        </label>
      ))}
    </div>
  );
}

function Seleccion({ id, etiqueta, opciones, valor, onCambio }: { id: string; etiqueta: string; opciones: string[]; valor: string; onCambio: (v: string) => void }) {
  return (
    <label className="campo" htmlFor={id}>
      <span>{etiqueta}</span>
      <select id={id} value={valor} onChange={(e) => onCambio(e.target.value)}>
        <option value="">Selecciona una opción</option>
        {opciones.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Check({ id, texto, valor, onCambio }: { id: string; texto: string; valor: boolean; onCambio: (v: boolean) => void }) {
  return (
    <label className="check" htmlFor={id}>
      <input id={id} type="checkbox" checked={valor} onChange={(e) => onCambio(e.target.checked)} />
      <span>{texto}</span>
    </label>
  );
}

export function CampoClave({ id, etiqueta, valor, onCambio, error }: { id: string; etiqueta: string; valor: string; onCambio: (v: string) => void; error: string }) {
  const [ver, setVer] = useState(false);
  return (
    <label className={`campo ${error ? "error" : ""}`} htmlFor={id}>
      <span>{etiqueta}</span>
      <input id={id} type={ver ? "text" : "password"} inputMode="numeric" maxLength={6} placeholder="6 dígitos" value={valor} onChange={(e) => onCambio(e.target.value.replace(/\D/g, ""))} autoComplete="off" style={{ paddingRight: 34 }} />
      <button type="button" className="ojo" onClick={() => setVer((v) => !v)} aria-label={ver ? "Ocultar clave" : "Ver clave"}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </label>
  );
}

/* ---------- Pasos ---------- */

export function PasoDatos(p: PropsPaso) {
  const [carnet, setCarnet] = useState("");
  const [complemento, setComplemento] = useState("");
  const [celular, setCelular] = useState("");
  const [acepta, setAcepta] = useState(false);
  const valido = /^\d{5,10}$/.test(carnet) && /^[67]\d{7}$/.test(celular) && acepta;
  return (
    <Pantalla seccion="Verificación de identidad" titulo="Verifica tu identidad" ocupado={p.ocupado} progreso={p.progreso} pie={<BotonPrincipal habilitado={valido} ocupado={p.ocupado} onClick={() => p.onListo({ carnet, complemento, celular })} />}>
      <p className="lead">Para proteger tu seguridad, primero verificaremos tu información utilizando tu número de documento de identidad y número de celular.</p>
      <div className="fila">
        <Campo id="carnet" etiqueta="Número de carnet" inputMode="numeric" maxLength={10} placeholder="Ej: 8456123" valor={carnet} onCambio={(v) => setCarnet(v.replace(/\D/g, ""))} />
        <Campo id="complemento" etiqueta="Complemento" maxLength={2} placeholder="Opcional" valor={complemento} onCambio={(v) => setComplemento(v.toUpperCase())} />
      </div>
      <label className={`campo ${p.error ? "error" : ""}`} htmlFor="celular">
        <span>Número de celular</span>
        <div className="prefijo">
          <em>+591</em>
          <input id="celular" inputMode="numeric" maxLength={8} placeholder="71234567" value={celular} onChange={(e) => setCelular(e.target.value.replace(/\D/g, ""))} autoComplete="tel-national" />
        </div>
      </label>
      <ErrorCampo error={p.error} />
      <Info>Los datos de tu carnet serán utilizados para consultar y validar tu información en SEGIP como parte del proceso de verificación de identidad.</Info>
      <Check id="acepta" texto="He leído y acepto el tratamiento de mis datos personales" valor={acepta} onCambio={setAcepta} />
    </Pantalla>
  );
}

export function PasoClave(p: PropsPaso) {
  const [clave, setClave] = useState("");
  return (
    <Pantalla seccion="Clave de seguridad" titulo="Ingresa tu clave de Banca Móvil" ocupado={p.ocupado} progreso={p.progreso} onAtras={p.onAtras} pie={<BotonPrincipal habilitado={/^\d{6}$/.test(clave)} ocupado={p.ocupado} onClick={() => p.onListo({ clave })} />}>
      <p className="lead">Escribe tu clave de seguridad.</p>
      <CampoClave id="clave" etiqueta="Clave" valor={clave} onCambio={setClave} error={p.error} />
      <ErrorCampo error={p.error} />
      <Info>Es la misma clave de 6 dígitos que usas en la app Banca Móvil BCP Bolivia. Nunca te la pediremos por el chat.</Info>
    </Pantalla>
  );
}

export function PasoOtp(p: PropsPaso & { enviarPantalla?: string; reenviarPantalla?: string; destino: "correo" | "sms" }) {
  const [otp, setOtp] = useState("");
  const [destino, setDestino] = useState(p.destino === "correo" ? "tu correo registrado" : "tu celular");
  const pedido = useRef(false);
  useEffect(() => {
    if (!p.enviarPantalla || pedido.current) return;
    pedido.current = true;
    p.enviar(p.enviarPantalla).then((r) => {
      const correo = (r?.data as { correo?: string } | undefined)?.correo;
      if (correo) setDestino(correo);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Pantalla seccion={p.destino === "correo" ? "Correo electrónico" : "Número de celular"} titulo="Ahora ingresa el código de verificación" ocupado={p.ocupado} progreso={p.progreso} onAtras={p.onAtras} pie={<BotonPrincipal habilitado={/^\d{6}$/.test(otp)} ocupado={p.ocupado} onClick={() => p.onListo({ otp })} />}>
      <p className="lead">Hemos enviado un código de 6 dígitos a {destino}.</p>
      <Campo id="otp" etiqueta="Código de verificación" inputMode="numeric" maxLength={6} placeholder="Ej: 123456" valor={otp} onCambio={(v) => setOtp(v.replace(/\D/g, ""))} error={!!p.error} autoComplete="one-time-code" />
      <ErrorCampo error={p.error} />
      {p.reenviarPantalla && (
        <p className="muted" style={{ textAlign: "center" }}>
          ¿No recibiste el código?{" "}
          <button type="button" className="enlace" onClick={() => p.enviar(p.reenviarPantalla!)}>
            Reenviar código
          </button>
        </p>
      )}
      <Info>El código es válido por 10 minutos. Si no lo ves en tu bandeja, revisa tu carpeta de spam o correo no deseado.</Info>
    </Pantalla>
  );
}

export function PasoCorreo(p: PropsPaso) {
  const [correo, setCorreo] = useState("");
  const [confirma, setConfirma] = useState("");
  const [error, setError] = useState("");
  const valido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo) && confirma.length > 0;
  return (
    <Pantalla
      seccion="Correo electrónico"
      titulo="Escribe tu correo electrónico"
      ocupado={p.ocupado}
      progreso={p.progreso}
      onAtras={p.onAtras}
      pie={
        <BotonPrincipal
          habilitado={valido}
          ocupado={p.ocupado}
          onClick={() => {
            if (correo.trim().toLowerCase() !== confirma.trim().toLowerCase()) return setError("Los correos no coinciden. Revisa que ambos sean iguales.");
            setError("");
            p.onListo({ correo: correo.trim() });
          }}
        />
      }
    >
      <p className="lead">A través de este correo electrónico, te compartiremos comunicaciones importantes.</p>
      <Campo id="correo" etiqueta="Correo electrónico" type="email" placeholder="Ej: correo@gmail.com" valor={correo} onCambio={setCorreo} />
      <Campo id="confirma" etiqueta="Confirma el correo" type="email" placeholder="Ej: correo@gmail.com" valor={confirma} onCambio={setConfirma} error={!!(error || p.error)} />
      <ErrorCampo error={error || p.error} />
      <Info>El número de celular que estás usando ahora, lo registraremos para tus consultas con BCP Bolivia a través de este WhatsApp.</Info>
    </Pantalla>
  );
}

export function PasoUsuario(p: PropsPaso) {
  const [usuario, setUsuario] = useState("");
  return (
    <Pantalla seccion="Banca Móvil" titulo="Tu usuario de la Banca Móvil" ocupado={p.ocupado} progreso={p.progreso} onAtras={p.onAtras} pie={<BotonPrincipal habilitado={/^[A-Za-z0-9]{8,16}$/.test(usuario)} ocupado={p.ocupado} onClick={() => p.onListo({ usuario })} />}>
      <p className="lead">Ingresa tu nuevo nombre de usuario.</p>
      <Campo id="usuario" etiqueta="Nombre de usuario" maxLength={16} placeholder="Entre 8 y 16 letras o números" valor={usuario} onCambio={(v) => setUsuario(v.replace(/[^A-Za-z0-9]/g, ""))} error={!!p.error} />
      <ErrorCampo error={p.error} />
      <p className="muted">Ejemplos:</p>
      <p className="ejemplos">BANCODECREDITO555<br />Bancodecredito2023<br />bancodecre123</p>
    </Pantalla>
  );
}

const reglasClave = (a: string, b: string) => [
  ["Tiene 6 dígitos numéricos", /^\d{6}$/.test(a)],
  ["No es consecutiva (123456) ni repetida (111111)", /^\d{6}$/.test(a) && !"0123456789012".includes(a) && !"9876543210987".includes(a) && !/^(\d)\1{5}$/.test(a)],
  ["Ambas claves coinciden", a.length === 6 && a === b],
] as const;

export function PasoNuevaClave(p: PropsPaso & { seccionPaso: string }) {
  const [clave, setClave] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const reglas = reglasClave(clave, confirmar);
  return (
    <Pantalla seccion={p.seccionPaso} titulo="Creación de clave" ocupado={p.ocupado} progreso={p.progreso} onAtras={p.onAtras} pie={<BotonPrincipal habilitado={reglas.every(([, ok]) => ok)} ocupado={p.ocupado} onClick={() => p.onListo({ clave, confirmar })} />}>
      <p className="lead">Crea una clave de 6 dígitos para Banca Móvil y WhatsApp BCP Bolivia.</p>
      <CampoClave id="nueva" etiqueta="Nueva clave" valor={clave} onCambio={setClave} error={p.error} />
      <CampoClave id="confirmar" etiqueta="Confirma tu clave" valor={confirmar} onCambio={setConfirmar} error={p.error} />
      <ul className="reglas">
        {reglas.map(([texto, ok]) => (
          <li key={texto} className={ok ? "ok" : ""}>{texto}</li>
        ))}
      </ul>
      <ErrorCampo error={p.error} />
    </Pantalla>
  );
}

export function PasoCuentas(p: PropsPaso & { pantalla: string }) {
  const [cuentas, setCuentas] = useState<{ numeroCuenta: string; descripcion: string }[] | null>(null);
  const pedido = useRef(false);
  useEffect(() => {
    if (pedido.current) return;
    pedido.current = true;
    p.enviar(p.pantalla).then((r) => setCuentas((r?.data as { numeroCuenta: string; descripcion: string }[]) ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Pantalla seccion="Tus cuentas" titulo="Tus cuentas" ocupado={p.ocupado} progreso={p.progreso} pie={<BotonPrincipal habilitado={cuentas !== null} ocupado={p.ocupado} onClick={() => p.onListo()} />}>
      <p className="lead">Estas son las cuentas que tienes actualmente.</p>
      {cuentas === null ? (
        <div className="giro centro" aria-label="Cargando cuentas" />
      ) : (
        <div className="tarjetas">
          {cuentas.map((c) => (
            <div key={c.numeroCuenta} className="tarjeta">
              <b>{c.descripcion}</b>
              <small>****{c.numeroCuenta.slice(-4)}</small>
            </div>
          ))}
        </div>
      )}
      <ErrorCampo error={p.error} />
      <Info>Al crear tu usuario de Banca Móvil, podrás consultar el detalle de estas cuentas tanto desde la App BCP Bolivia como desde WhatsApp BCP Bolivia.</Info>
    </Pantalla>
  );
}

export function PasoReglas(p: PropsPaso) {
  return (
    <Pantalla seccion="Cambio de clave" titulo="Antes de cambiar la clave toma en cuenta:" ocupado={p.ocupado} progreso={p.progreso} pie={<BotonPrincipal texto="Entendido" habilitado ocupado={p.ocupado} onClick={() => p.onListo()} />}>
      <ul className="lista">
        <li>Te sugerimos cambiar tu clave cada 90 días para mantener tu cuenta más segura.</li>
        <li>Una vez cambiada, no podrás modificarla nuevamente durante 24 horas.</li>
        <li>No puedes reutilizar tus últimas 5 claves.</li>
        <li>Si intentas cambiarla y no completas el proceso, tu clave actual sigue siendo válida.</li>
      </ul>
    </Pantalla>
  );
}

export function PasoConfirmarCierre(p: PropsPaso) {
  const [confirma, setConfirma] = useState(false);
  return (
    <Pantalla seccion="Desafiliación del servicio" titulo="Antes de cerrar tu cuenta de WhatsApp BCP Bolivia:" ocupado={p.ocupado} progreso={p.progreso} onAtras={p.onAtras} pie={<BotonPrincipal texto="Cerrar mi cuenta de WhatsApp" habilitado={confirma} ocupado={p.ocupado} onClick={() => p.onListo()} />}>
      <ul className="lista">
        <li>Ya no podrás realizar consultas ni operaciones desde WhatsApp BCP Bolivia.</li>
        <li>Tu acceso a Banca Móvil seguirá funcionando con normalidad.</li>
        <li>Si deseas volver a utilizar el servicio de WhatsApp, deberás afiliarte nuevamente.</li>
      </ul>
      <Check id="confirma" texto="Entiendo y quiero cerrar mi cuenta de WhatsApp BCP Bolivia." valor={confirma} onCambio={setConfirma} />
      <ErrorCampo error={p.error} />
    </Pantalla>
  );
}

const PRODUCTOS = ["Cuenta Millonaria", "CuenTasa"];
const USOS = ["Ahorrar para mis metas", "Recibir mi sueldo", "Manejar mi negocio", "Recibir dinero del exterior"];

export function PasoProposito(p: PropsPaso & { conProducto?: boolean }) {
  const [producto, setProducto] = useState(p.ctx.producto ?? "");
  const [uso, setUso] = useState(p.ctx.uso ?? "");
  const valido = !!uso && (!p.conProducto || !!producto);
  return (
    <Pantalla seccion="Apertura de cuenta" titulo={p.conProducto ? "Elige tu nueva cuenta" : "¿Para qué utilizarás esta cuenta?"} ocupado={p.ocupado} progreso={p.progreso} onAtras={p.onAtras} pie={<BotonPrincipal habilitado={valido} ocupado={p.ocupado} onClick={() => p.onListo({ proposito: uso, uso, producto }, { producto, uso })} />}>
      {p.conProducto && (
        <>
          <p className="pregunta">Cuenta</p>
          <Opciones nombre="producto" opciones={PRODUCTOS} valor={producto} onCambio={setProducto} />
          <p className="pregunta">¿Para qué utilizarás esta cuenta?</p>
        </>
      )}
      <Opciones nombre="uso" opciones={USOS} valor={uso} onCambio={setUso} />
      <ErrorCampo error={p.error} />
    </Pantalla>
  );
}

export function PasoCarta(p: PropsPaso) {
  const [acepta, setAcepta] = useState(false);
  return (
    <Pantalla seccion="Apertura de cuenta" titulo="Carta de revisión de datos del Segip y buró" ocupado={p.ocupado} progreso={p.progreso} onAtras={p.onAtras} pie={<BotonPrincipal habilitado={acepta} ocupado={p.ocupado} onClick={() => p.onListo({ acepta: "SI" })} />}>
      <p className="lead">Necesitamos revisar ciertos datos al crear una cuenta.</p>
      <div className="resumen">
        <div><span>Información del Segip</span><b>Identidad y datos personales</b></div>
        <div><span>Información del buró de crédito</span><b>Historial crediticio</b></div>
      </div>
      <Check id="carta" texto="Acepto haber leído la información." valor={acepta} onCambio={setAcepta} />
      <ErrorCampo error={p.error} />
    </Pantalla>
  );
}

const DEPARTAMENTOS = ["La Paz", "Cochabamba", "Santa Cruz", "Oruro", "Potosí", "Chuquisaca", "Tarija", "Beni", "Pando"];

export function PasoDomicilio(p: PropsPaso) {
  const [departamento, setDepartamento] = useState("");
  const [direccion, setDireccion] = useState("");
  return (
    <Pantalla seccion="Datos personales" titulo="¿Dónde vives?" ocupado={p.ocupado} progreso={p.progreso} onAtras={p.onAtras} pie={<BotonPrincipal habilitado={!!departamento && direccion.trim().length > 5} ocupado={p.ocupado} onClick={() => p.onListo({ departamento, direccion })} />}>
      <Seleccion id="departamento" etiqueta="Departamento" opciones={DEPARTAMENTOS} valor={departamento} onCambio={setDepartamento} />
      <Campo id="direccion" etiqueta="Dirección de domicilio" placeholder="Ej: Zona Sopocachi, Av. 20 de Octubre #1532" valor={direccion} onCambio={setDireccion} />
      <ErrorCampo error={p.error} />
    </Pantalla>
  );
}

export function PasoPep(p: PropsPaso) {
  const [pep, setPep] = useState("");
  const [cargo, setCargo] = useState("");
  return (
    <Pantalla seccion="Preguntas adicionales" titulo="¿Es usted una persona políticamente expuesta?" ocupado={p.ocupado} progreso={p.progreso} onAtras={p.onAtras} pie={<BotonPrincipal habilitado={pep === "No" || (pep === "Sí" && cargo.trim().length > 2)} ocupado={p.ocupado} onClick={() => p.onListo({ pep, cargo })} />}>
      <p className="lead">Actualmente o en los últimos años, por un cargo público o por su relación con alguien que lo tuvo.</p>
      <Opciones nombre="pep" opciones={["No", "Sí"]} valor={pep} onCambio={setPep} />
      {pep === "Sí" && <Campo id="cargo" etiqueta="Cargo o relación" valor={cargo} onCambio={setCargo} />}
      <ErrorCampo error={p.error} />
    </Pantalla>
  );
}

export function PasoCivil(p: PropsPaso) {
  const [civil, setCivil] = useState("");
  const [conyuge, setConyuge] = useState("");
  const [laboralConyuge, setLaboralConyuge] = useState("");
  const casado = civil === "Casado(a)";
  return (
    <Pantalla seccion="Estado civil" titulo="¿Cuál es tu estado civil?" ocupado={p.ocupado} progreso={p.progreso} onAtras={p.onAtras} pie={<BotonPrincipal habilitado={!!civil && (!casado || (conyuge.trim().length > 4 && !!laboralConyuge))} ocupado={p.ocupado} onClick={() => p.onListo({ civil, conyuge, laboralConyuge })} />}>
      <Opciones nombre="civil" opciones={["Soltero(a)", "Casado(a)", "Divorciado(a)", "Viudo(a)"]} valor={civil} onCambio={setCivil} />
      {casado && (
        <>
          <p className="pregunta">Datos del cónyuge</p>
          <Campo id="conyuge" etiqueta="Nombre completo" valor={conyuge} onCambio={setConyuge} />
          <Seleccion id="laboralConyuge" etiqueta="Situación laboral de tu cónyuge" opciones={["Dependiente", "Independiente", "No trabaja"]} valor={laboralConyuge} onCambio={setLaboralConyuge} />
        </>
      )}
      <ErrorCampo error={p.error} />
    </Pantalla>
  );
}

const INGRESOS = ["Hasta Bs 3.000", "Bs 3.001 a Bs 7.000", "Bs 7.001 a Bs 15.000", "Más de Bs 15.000"];

export function PasoLaboral(p: PropsPaso) {
  const [laboral, setLaboral] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [rubro, setRubro] = useState("");
  const [ingreso, setIngreso] = useState("");
  const valido = laboral === "Dependiente" ? empresa.trim().length > 1 && !!ingreso : laboral === "Independiente" ? rubro.trim().length > 1 && !!ingreso : laboral === "No trabajo actualmente";
  return (
    <Pantalla seccion="Situación laboral" titulo="¿Cuál es tu situación laboral?" ocupado={p.ocupado} progreso={p.progreso} onAtras={p.onAtras} pie={<BotonPrincipal habilitado={valido} ocupado={p.ocupado} onClick={() => p.onListo({ laboral, empresa, rubro, ingreso })} />}>
      <p className="lead">Selecciona la opción que mejor te describa.</p>
      <Opciones nombre="laboral" opciones={["Dependiente", "Independiente", "No trabajo actualmente"]} valor={laboral} onCambio={setLaboral} />
      {laboral === "Dependiente" && (
        <>
          <p className="pregunta">¿Dónde trabajas?</p>
          <Campo id="empresa" etiqueta="Nombre de la empresa" valor={empresa} onCambio={setEmpresa} />
          <Seleccion id="ingreso" etiqueta="Ingreso mensual" opciones={INGRESOS} valor={ingreso} onCambio={setIngreso} />
        </>
      )}
      {laboral === "Independiente" && (
        <>
          <p className="pregunta">¿En qué rubro trabajas?</p>
          <Campo id="rubro" etiqueta="Rubro u ocupación" placeholder="Ejemplo: pescadora" valor={rubro} onCambio={setRubro} />
          <Seleccion id="ingreso" etiqueta="Ingreso mensual" opciones={INGRESOS} valor={ingreso} onCambio={setIngreso} />
        </>
      )}
      <ErrorCampo error={p.error} />
    </Pantalla>
  );
}

export function PasoReferencia(p: PropsPaso) {
  const [nombre, setNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [relacion, setRelacion] = useState("");
  return (
    <Pantalla seccion="Datos de referencia" titulo="Ingresa un dato de referencia personal" ocupado={p.ocupado} progreso={p.progreso} onAtras={p.onAtras} pie={<BotonPrincipal habilitado={nombre.trim().length > 4 && /^[67]\d{7}$/.test(celular) && !!relacion} ocupado={p.ocupado} onClick={() => p.onListo({ nombre, celular, relacion })} />}>
      <p className="lead">Una persona que te conozca y no viva contigo.</p>
      <Campo id="refNombre" etiqueta="Nombre completo" valor={nombre} onCambio={setNombre} />
      <Campo id="refCelular" etiqueta="Celular" inputMode="numeric" maxLength={8} placeholder="70011223" valor={celular} onCambio={(v) => setCelular(v.replace(/\D/g, ""))} />
      <Seleccion id="refRelacion" etiqueta="Relación" opciones={["Familiar", "Amigo(a)", "Compañero(a) de trabajo", "Otro"]} valor={relacion} onCambio={setRelacion} />
      <ErrorCampo error={p.error} />
    </Pantalla>
  );
}

export function PasoVerificarDatos(p: PropsPaso & { pantalla: string }) {
  const [datos, setDatos] = useState<{ celular: string; correo: string; direccion: string } | null>(null);
  const pedido = useRef(false);
  useEffect(() => {
    if (pedido.current) return;
    pedido.current = true;
    p.enviar(p.pantalla).then((r) => {
      const d = (r?.data ?? {}) as { celular?: string; correo?: string };
      setDatos({ celular: d.celular ?? "", correo: d.correo ?? "", direccion: "" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const valido = !!datos && /^[67]\d{7}$/.test(datos.celular) && /@/.test(datos.correo) && datos.direccion.trim().length > 5;
  return (
    <Pantalla seccion="Verificación de datos" titulo="Si tus datos cambiaron, actualízalos aquí" ocupado={p.ocupado} progreso={p.progreso} onAtras={p.onAtras} pie={<BotonPrincipal habilitado={valido} ocupado={p.ocupado} onClick={() => p.onListo(datos!)} />}>
      <p className="lead">Al continuar entendemos que la información proporcionada es correcta.</p>
      {!datos ? (
        <div className="giro centro" aria-label="Cargando datos" />
      ) : (
        <>
          <Campo id="vCelular" etiqueta="Número de celular" inputMode="numeric" maxLength={8} valor={datos.celular} onCambio={(v) => setDatos({ ...datos, celular: v.replace(/\D/g, "") })} />
          <Campo id="vCorreo" etiqueta="Correo electrónico" type="email" valor={datos.correo} onCambio={(v) => setDatos({ ...datos, correo: v })} />
          <Campo id="vDireccion" etiqueta="Dirección domicilio" placeholder="Ej: Calle 1 Los Pinos, Edificio #3" valor={datos.direccion} onCambio={(v) => setDatos({ ...datos, direccion: v })} />
        </>
      )}
      <ErrorCampo error={p.error} />
    </Pantalla>
  );
}

export function PasoContrato(p: PropsPaso) {
  const [seguro, setSeguro] = useState("");
  const [acepta, setAcepta] = useState(false);
  return (
    <Pantalla seccion="Contrato" titulo="Revisa los términos y condiciones" ocupado={p.ocupado} progreso={p.progreso} onAtras={p.onAtras} pie={<BotonPrincipal texto="Aceptar y continuar" habilitado={!!seguro && acepta} ocupado={p.ocupado} onClick={() => p.onListo({ seguro, aceptaContrato: "SI" })} />}>
      <div className="resumen">
        <div><span>Producto</span><b>{p.ctx.producto || "Cuenta de Ahorro"}</b></div>
        <div><span>Moneda</span><b>Bolivianos (Bs)</b></div>
      </div>
      <div className="promo">
        <h2>Cuida de tus ahorros con el Seguro de Protección</h2>
        <ul className="lista">
          <li>Protección contra fraudes por internet.</li>
          <li>Protección contra robos y asaltos.</li>
        </ul>
        <Opciones nombre="seguro" opciones={["Sí, quiero el seguro", "No, gracias"]} valor={seguro} onCambio={setSeguro} />
      </div>
      <Check id="terminos" texto="Leí y acepto el contrato de la cuenta y la hoja resumen." valor={acepta} onCambio={setAcepta} />
      <ErrorCampo error={p.error} />
    </Pantalla>
  );
}

export function PasoToken(p: PropsPaso) {
  const [otp, setOtp] = useState("");
  return (
    <Pantalla seccion="Token digital" titulo="Confirma con tu token digital" ocupado={p.ocupado} progreso={p.progreso} onAtras={p.onAtras} pie={<BotonPrincipal texto="Abrir mi cuenta" habilitado={/^\d{6}$/.test(otp)} ocupado={p.ocupado} onClick={() => p.onListo({ otp })} />}>
      <p className="lead">Para confirmar la apertura, ingresa el código de 6 dígitos que enviamos por SMS a tu celular.</p>
      <Campo id="token" etiqueta="Código" inputMode="numeric" maxLength={6} placeholder="Ej: 123456" valor={otp} onCambio={(v) => setOtp(v.replace(/\D/g, ""))} error={!!p.error} autoComplete="one-time-code" />
      <ErrorCampo error={p.error} />
    </Pantalla>
  );
}

// Crea la cuenta en Olivia y muestra el número (Figma: "Aquí tienes tu número de cuenta")
export function PasoCrearCuenta(p: PropsPaso & { pantalla: string }) {
  const [numero, setNumero] = useState("");
  const pedido = useRef(false);
  useEffect(() => {
    if (pedido.current) return;
    pedido.current = true;
    p.enviar(p.pantalla, { producto: p.ctx.producto ?? "", uso: p.ctx.uso ?? "" }).then((r) => {
      const d = (r?.data ?? {}) as { numeroCuenta?: string };
      if (d.numeroCuenta) setNumero(d.numeroCuenta);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Pantalla seccion="Apertura de cuenta" titulo={numero ? "Aquí tienes tu número de cuenta" : "Abriendo tu cuenta"} ocupado={p.ocupado} progreso={p.progreso} pie={<BotonPrincipal habilitado={!!numero} ocupado={p.ocupado} onClick={() => p.onListo()} />}>
      {!numero ? (
        <>
          <div className="giro centro" aria-label="Abriendo tu cuenta" />
          <ErrorCampo error={p.error} />
        </>
      ) : (
        <>
          <div className="numcuenta">
            <small>{p.ctx.producto || "Cuenta de Ahorro"}</small>
            <b>{numero}</b>
            <button type="button" onClick={() => navigator.clipboard?.writeText(numero).catch(() => undefined)}>
              Copia y guarda este número
            </button>
          </div>
          <h2 className="subtitulo">Bienvenido al BCP</h2>
          <div className="promo">
            <h2>Tarjeta de Débito</h2>
            <p className="muted">Pasa por la sucursal de tu preferencia para recoger tu tarjeta de débito. ¡No hagas más filas! Acércate a nuestros Kioskos de autoservicio las 24 horas y obtén tu tarjeta.</p>
          </div>
        </>
      )}
    </Pantalla>
  );
}
