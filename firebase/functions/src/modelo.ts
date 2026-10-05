import { Repeticion } from "./fechas";

export type SeccionId = "tiempo" | "noticias" | "mercados" | "horoscopo" | "agenda";

export interface InfoSeccion { emoji: string; titulo: string; horaDefecto: string; descripcion: string }

export const SECCIONES: Record<SeccionId, InfoSeccion> = {
  tiempo: { emoji: "🌤", titulo: "Tiempo", horaDefecto: "07:00", descripcion: "Previsión por horas, lluvia, sol, viento, UV y luna" },
  noticias: { emoji: "📰", titulo: "Noticias", horaDefecto: "07:10", descripcion: "Economía, política y noticias de tu zona" },
  agenda: { emoji: "🗓", titulo: "Agenda", horaDefecto: "07:20", descripcion: "Tus citas y tareas de hoy y mañana" },
  horoscopo: { emoji: "🔮", titulo: "Horóscopo", horaDefecto: "08:00", descripcion: "El horóscopo del día de tu signo" },
  mercados: { emoji: "📈", titulo: "Mercados", horaDefecto: "14:00", descripcion: "Premercado de Wall Street y cierre de ayer" },
};
export const ORDEN_SECCIONES: SeccionId[] = ["tiempo", "noticias", "agenda", "horoscopo", "mercados"];

export interface ConfigSeccion { activa: boolean; hora: string }

/** Tema de noticias creado por el usuario. */
export interface Tema { id: string; titulo: string; emoji: string; consulta: string; hora: string; activa: boolean }

export interface Ciudad { nombre: string; provincia: string; lat: number; lon: number }

/** Paso de una conversación en curso (el bot espera un texto del usuario). */
export interface Estado { flujo: string; paso: string; datos: Record<string, unknown> }

/** Aspecto del bot: el estilo (informal o formal) y el modo (claro u oscuro) que usa en Telegram, para elegir las cabeceras y los colores. */
export type Estilo = "informal" | "formal";
/** `auto`: cambia solo según la hora (de claro a oscuro y al revés), como lo hace el sistema de muchos dispositivos. */
export type Modo = "claro" | "oscuro" | "auto";

/** Franja en la que el dispositivo está en oscuro (modo `auto`), en la hora local del usuario. Puede cruzar la medianoche: 22:00 → 08:00. */

/** Lista de la compra: lo pendiente y el historial de compras terminadas (con su fecha de finalización). */
export interface ArticuloCompra { id: string; texto: string; hecho: boolean }
export interface CompraTerminada { id: string; fecha: string /* ISO */; items: string[] }
export interface ListaCompra { items: ArticuloCompra[]; historial: CompraTerminada[]; /** Código del enlace compartido de la lista actual (null si no se ha compartido). */ token?: string | null }

/** Imagen del usuario: un avatar (emoji sobre un fondo de color), su foto de Telegram o una foto subida (se guarda aparte). Sin elegir: burbuja con su inicial. */
export type Avatar = { tipo: "emoji"; emoji: string; color: number } | { tipo: "telegram" } | { tipo: "foto" };

/** Dispositivo que recibe notificaciones push (Web Push). */
export interface SuscripcionPush { endpoint: string; p256dh: string; auth: string; dispositivo: string; desde: string }
/** Por dónde recibe los avisos y resúmenes programados: Telegram, la app instalada o ambos. */
export interface AjustesAvisos { canal: "telegram" | "app" | "ambos"; suscripciones: SuscripcionPush[] }

export interface Usuario {
  id: string;                 // id del chat
  nombre: string;
  estilo: Estilo;
  modo: Modo;
  /** Solo se usa con el modo `auto`. */
  nacimiento: string | null;  // yyyy-MM-dd
  zona: string;               // zona horaria IANA
  ciudad: Ciudad | null;
  compra: ListaCompra;
  avatar: Avatar | null;
  notificaciones: AjustesAvisos;
  secciones: Record<SeccionId, ConfigSeccion>;
  temas: Tema[];
  estado: Estado | null;
  onboardingHecho: boolean;
  activo: boolean;            // false si ha bloqueado el bot
  ultimoUpdate: number;       // para ignorar actualizaciones repetidas de Telegram
  creadoEn: Date;
}

export type TipoEvento = "alarma" | "cita" | "tarea";

export interface Evento {
  id: string;
  uid: string;
  tipo: TipoEvento;
  titulo: string;
  lugar: string;
  fechaHora: Date | null;     // momento del evento; las tareas pueden no tener
  antelacionMin: number;      // minutos antes del evento a los que se avisa (0 en alarmas)
  repeticion: Repeticion;
  avisado: boolean;           // ya se ha enviado el aviso (los repetitivos se rearman solos)
  hecho: boolean;
  creadoEn: Date;
}

export interface Programacion {
  id: string;
  uid: string;
  tipo: "seccion" | "evento";
  ref: string;       // id de sección ("tiempo", "tema:ajedrez") o de evento
  proximo: Date;     // cuándo toca
  posponer?: boolean; // aviso aplazado ("+10 min"): no rearma la repetición del evento
  intentos?: number;  // intentos fallidos de envío
}

export interface HoroscopoDoc {
  signo: string; fecha: string; prediccion: string; idioma?: string; fuente?: string; fuenteUrl?: string;
}

/** Persona autorizada a usar el bot (solo se comprueba si hay un administrador configurado). */
export interface Acceso { id: string; rol: "admin" | "usuario"; nombre: string; desde: Date }

/** Invitación de un solo uso. Con `para` solo vale para esa persona (la que pidió acceso y fue aprobada). */
export interface Invitacion { codigo: string; caduca: Date; creadaPor: string; para?: string }

/** Petición de acceso de alguien no autorizado, pendiente de que el administrador decida (o rechazada: no se puede repetir). */
export interface Solicitud { id: string; nombre: string; usuario?: string; fecha: Date; estado: "pendiente" | "rechazada" }

/** Hora a la que se avisa de un evento (evento - antelación). */
export function momentoAviso(e: Evento): Date | null {
  return e.fechaHora ? new Date(e.fechaHora.getTime() - e.antelacionMin * 60_000) : null;
}

export function usuarioNuevo(id: string, nombre: string, ahora: Date): Usuario {
  const secciones = {} as Record<SeccionId, ConfigSeccion>;
  for (const s of ORDEN_SECCIONES) secciones[s] = { activa: false, hora: SECCIONES[s].horaDefecto };
  return {
    id, nombre, estilo: "informal", modo: "claro", nacimiento: null, zona: "Europe/Madrid", ciudad: null, compra: { items: [], historial: [], token: null }, avatar: null, notificaciones: { canal: "telegram", suscripciones: [] }, secciones, temas: [], estado: null,
    onboardingHecho: false, activo: true, ultimoUpdate: 0, creadoEn: ahora,
  };
}
