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

/** Mensaje listo para enviar. `grupos`: las mismas noticias de forma estructurada (la app las muestra con su foto). */
export interface Contenido { html: string; teclado?: Teclado; grupos?: GrupoNoticias[] }

export const NAV_MENU = [{ texto: "🏠 Menú", datos: "m:menu" }];
