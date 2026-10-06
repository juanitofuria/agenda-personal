import { Almacen } from "../almacen";
import { Teclado } from "../canal";
import { Usuario } from "../modelo";
import { Config } from "../horoscopo";
import { HttpGet } from "../util";

/** Lo que necesita un resumen para generarse. */
export interface Contexto {
  usuario: Usuario; http: HttpGet; almacen: Almacen; ahora: Date;
  /** Dónde pedir el horóscopo si todavía no está guardado (la tarea diaria puede no haberlo traído). */
  horoscopoCfg?: Config;
  /** Feed RSS del podcast con un episodio por signo y día (para el botón «Escuchar»). */
  podcastFeed?: string;
}

/** Noticias de un bloque (Economía, Política…), para pintarlas como tarjetas en la app. */
export interface GrupoNoticias { titulo: string; noticias: { titulo: string; fuente: string; enlace: string; fecha: number; imagen?: string }[] }

/** Datos del tiempo ya preparados para que la app los pinte como tarjetas (el texto de Telegram sale de los mismos datos). */
export interface PanelTiempo {
  vista: "resumen" | "horas" | "luna";
  ciudad: string; actualizado: string;
  resumen?: {
    emoji: string; desc: string; temp: number; tMin: number; tMax: number; humedad: number;
    viento: number; dir: string; dirGrados: number; vientoMax: number; rachaMax: number; uv: number; uvNivel: string; amanece: string; anochece: string; luz: string;
    horasDesde: number; horasHasta: number; maxima: { v: number; hora: number }; minima: { v: number; hora: number };
    lluvia: { horas: number; tramos: { desde: number; hasta: number; mm: number; prob: number }[] };
    luna: { emoji: string; nombre: string; iluminada: number };
    caida?: { ayer: number; anio: number; total: number };
  };
  horas?: { hora: number; emoji: string; desc: string; temp: number; prob: number; mm: number; viento: number; humedad: number }[];
  luna?: { mes: string; hoy: { emoji: string; nombre: string; iluminada: number; dias: number; dia: number }; llena: string; nueva: string; semanas: ({ d: number; emoji: string } | null)[][] };
}

/** Mensaje listo para enviar. `grupos`: las mismas noticias de forma estructurada (la app las muestra con su foto). */
export interface Contenido { html: string; teclado?: Teclado; grupos?: GrupoNoticias[]; tiempo?: PanelTiempo }

export const NAV_MENU = [{ texto: "🏠 Menú", datos: "m:menu" }];
