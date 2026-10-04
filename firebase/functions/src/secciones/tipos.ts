import { Almacen } from "../almacen";
import { Teclado } from "../canal";
import { Usuario } from "../modelo";
import { HttpGet } from "../util";

/** Lo que necesita un resumen para generarse. */
export interface Contexto { usuario: Usuario; http: HttpGet; almacen: Almacen; ahora: Date }

/** Mensaje listo para enviar. */
export interface Contenido { html: string; teclado?: Teclado }

export const NAV_MENU = [{ texto: "🏠 Menú", datos: "m:menu" }];
