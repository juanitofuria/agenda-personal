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
  /** Reescribe un texto con palabras sencillas (null si no puede). Solo si la plataforma tiene IA. */
  simplificar?: (texto: string) => Promise<string | null>;
}

/** Mensaje listo para enviar. */
export interface Contenido { html: string; teclado?: Teclado }

export const NAV_MENU = [{ texto: "🏠 Menú", datos: "m:menu" }];
