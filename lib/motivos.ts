// Compartido entre servidor y cliente: no lleva "use client".

export type Fin = { tipo: "bien" | "mal"; titulo: string; texto: string };

// Motivos de rechazo de Olivia (v1/WppWeb) traducidos a mensajes para el cliente.
export function finPorMotivo(motivo: string): Fin {
  switch (motivo) {
    case "TOKEN_VENCIDO":
      return { tipo: "mal", titulo: "Este enlace venció", texto: "Por tu seguridad, los enlaces duran 10 minutos. Vuelve a WhatsApp y pide uno nuevo." };
    case "TOKEN_REEMPLAZADO":
      return { tipo: "mal", titulo: "Este enlace ya fue usado", texto: "Por tu seguridad, cada enlace funciona una sola vez. Vuelve al chat para continuar." };
    case "SESION_VENCIDA":
      return { tipo: "mal", titulo: "Tu sesión terminó", texto: "Vuelve a WhatsApp y escríbenos de nuevo para empezar." };
    case "DISPOSITIVO_NO_COINCIDE":
      return { tipo: "mal", titulo: "Este enlace ya se abrió en otro dispositivo", texto: "Por tu seguridad, el enlace solo funciona en el navegador donde lo abriste por primera vez. Vuelve a WhatsApp y pide uno nuevo." };
    case "DISPOSITIVO_REQUERIDO":
      return { tipo: "mal", titulo: "No pudimos verificar tu navegador", texto: "Activa las cookies del navegador y vuelve a abrir el enlace desde WhatsApp." };
    case "NAVEGADOR_NO_PERMITIDO":
      return { tipo: "mal", titulo: "Abre este enlace desde WhatsApp", texto: "Toca el botón del mensaje que te enviamos por WhatsApp para continuar." };
    case "FLUJO_NO_SOPORTADO":
      return { tipo: "mal", titulo: "Este proceso aún no está disponible aquí", texto: "Vuelve a WhatsApp para continuar." };
    case "SERVICIO_NO_DISPONIBLE":
      return { tipo: "mal", titulo: "No pudimos conectarnos", texto: "Inténtalo de nuevo en unos minutos desde el botón del chat." };
    default:
      return { tipo: "mal", titulo: "Enlace no válido", texto: "Abre esta página desde el botón que te enviamos por WhatsApp." };
  }
}
