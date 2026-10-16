import { Repeticion } from "./fechas";
import { MensajeWa } from "./whatsapp";

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

export interface ConfigSeccion { activa: boolean; hora: string; /** Eliminada de la lista del usuario (se puede volver a añadir). Solo las secciones integradas; los temas se borran de verdad. */ oculta?: boolean }

/** Tema de noticias creado por el usuario. */
export interface Tema { id: string; titulo: string; emoji: string; consulta: string; hora: string; activa: boolean }

export interface Ciudad { nombre: string; provincia: string; lat: number; lon: number }

/** Aspecto visual de la app. */
export type Estilo = "informal" | "formal";
/** `auto`: cambia solo según la hora (de claro a oscuro y al revés), como lo hace el sistema de muchos dispositivos. */
export type Modo = "claro" | "oscuro" | "auto";

/** Franja en la que el dispositivo está en oscuro (modo `auto`), en la hora local del usuario. Puede cruzar la medianoche: 22:00 → 08:00. */

/** Lista de la compra: lo pendiente y el historial de compras terminadas (con su fecha de finalización). */
export interface ArticuloCompra { id: string; texto: string; hecho: boolean }
export interface CompraTerminada { id: string; fecha: string /* ISO */; items: string[] }
export interface ListaCompra { items: ArticuloCompra[]; historial: CompraTerminada[]; /** Código del enlace compartido de la lista actual (null si no se ha compartido). */ token?: string | null }
export type TipoMovimiento = "ingreso" | "gasto";
export interface MovimientoEconomico { id: string; tipo: TipoMovimiento; concepto: string; categoria: string; grupo?: "fijo" | "variable" | "ahorro"; importe: number; fecha: string; recurrente?: boolean }
export interface FacturaEconomica { id: string; concepto: string; importe: number; vencimiento: string; pagada: boolean }
export interface ObjetivoEconomico { id: string; titulo: string; importe: number; ahorrado: number; fechaObjetivo: string }
export interface Economia { movimientos: MovimientoEconomico[]; facturas: FacturaEconomica[]; presupuestoMensual: number | null; objetivos: ObjetivoEconomico[]; porcentajes?: { fijo:number; variable:number; ahorro:number }; historial?: Array<{ mes:string; ingresos:number; gastos:number; saldo:number; gastosFijos:number; gastosVariables:number; objetivoAhorro:number; movimientos:MovimientoEconomico[] }> }
export interface RegistroPeso { id:string; kg:number; fecha:string }
export interface EntrenamientoSalud { id:string; titulo:string; tipo:string; duracion:number; fecha:string }
export interface PlanSalud { id:string; titulo:string; dias:string; enfoque:string; detalle:string; inicio?:string; fin?:string; ejercicios?:string[] }
export interface Salud { peso:RegistroPeso[]; entrenamientos:EntrenamientoSalud[]; planes:PlanSalud[] }

/** Imagen del usuario: un avatar (emoji sobre un fondo de color) o una foto subida. Sin elegir: burbuja con su inicial. */
export type Avatar = { tipo: "emoji"; emoji: string; color: number } | { tipo: "foto" };

/** Dispositivo que recibe notificaciones push (Web Push). */
export interface SuscripcionPush { endpoint: string; p256dh: string; auth: string; dispositivo: string; desde: string }
export type SonidoAviso = "signature" | "crystal" | "pulse" | "halo" | "orbit" | "velvet";
export interface AjustesAvisos { sonido?: SonidoAviso; suscripciones: SuscripcionPush[] }

export interface Usuario {
  id: string;                 // Firebase Authentication UID
  nombre: string;
  estilo: Estilo;
  modo: Modo;
  /** Solo se usa con el modo `auto`. */
  nacimiento: string | null;  // yyyy-MM-dd
  zona: string;               // zona horaria IANA
  ciudad: Ciudad | null;
  compra: ListaCompra;
  economia: Economia;
  salud: Salud;
  avatar: Avatar | null;
  notificaciones: AjustesAvisos;
  secciones: Record<SeccionId, ConfigSeccion>;
  temas: Tema[];
  creadoEn: Date;
}

export type TipoEvento = "alarma" | "cita" | "tarea" | "mensaje" | "nota";

export interface Subtarea { id: string; titulo: string; hecho: boolean }

export interface Evento {
  id: string;
  uid: string;
  tipo: TipoEvento;
  titulo: string;
  lugar: string;
  fechaHora: Date | null;     // momento del evento; las tareas pueden no tener
  antelacionMin: number;      // minutos antes del evento a los que se avisa (0 en alarmas)
  repeticion: Repeticion;
  /** Solo en el tipo «mensaje»: a quién y qué se envía por WhatsApp cuando llegue la hora. */
  mensaje?: MensajeWa;
  /** Solo en el tipo «nota»: el texto de la nota. */
  nota?: string;
  /** Solo en tareas: pasos o partes de la tarea principal. */
  subtareas?: Subtarea[];
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

/** Hora a la que se avisa de un evento (evento - antelación). */
export function momentoAviso(e: Evento): Date | null {
  return e.fechaHora ? new Date(e.fechaHora.getTime() - e.antelacionMin * 60_000) : null;
}

export function usuarioNuevo(id: string, nombre: string, ahora: Date): Usuario {
  const secciones = {} as Record<SeccionId, ConfigSeccion>;
  for (const s of ORDEN_SECCIONES) secciones[s] = { activa: false, hora: SECCIONES[s].horaDefecto };
  return {
    id, nombre, estilo: "informal", modo: "claro", nacimiento: null, zona: "Europe/Madrid", ciudad: null, compra: { items: [], historial: [], token: null }, economia: { movimientos: [], facturas: [], presupuestoMensual: null, objetivos: [] }, salud: { peso: [], entrenamientos: [], planes: [] }, avatar: null, notificaciones: { sonido: "signature", suscripciones: [] }, secciones, temas: [], creadoEn: ahora,
  };
}
