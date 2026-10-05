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

export interface Usuario {
  id: string;                 // id del chat
  nombre: string;
  nacimiento: string | null;  // yyyy-MM-dd
  zona: string;               // zona horaria IANA
  ciudad: Ciudad | null;
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
  /** El mismo texto explicado con palabras sencillas (lo genera la plataforma si dispone de IA); `prediccion` conserva el original. */
  sencillo?: string;
}

/** Hora a la que se avisa de un evento (evento - antelación). */
export function momentoAviso(e: Evento): Date | null {
  return e.fechaHora ? new Date(e.fechaHora.getTime() - e.antelacionMin * 60_000) : null;
}

export function usuarioNuevo(id: string, nombre: string, ahora: Date): Usuario {
  const secciones = {} as Record<SeccionId, ConfigSeccion>;
  for (const s of ORDEN_SECCIONES) secciones[s] = { activa: false, hora: SECCIONES[s].horaDefecto };
  return {
    id, nombre, nacimiento: null, zona: "Europe/Madrid", ciudad: null, secciones, temas: [], estado: null,
    onboardingHecho: false, activo: true, ultimoUpdate: 0, creadoEn: ahora,
  };
}
