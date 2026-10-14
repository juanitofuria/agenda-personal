import { Almacen } from "./almacen";
import { Usuario } from "./modelo";
import { Config } from "./horoscopo";
import { HttpGet } from "./util";
import { construirContenido } from "./secciones";
import { Contenido } from "./secciones/tipos";

export interface DependenciasContenido {
  http: HttpGet;
  almacen: Almacen;
  ahora: () => Date;
  horoscopoCfg?: Config;
  podcastFeed?: string;
}

export const contenidoDeSeccion = (deps: DependenciasContenido, usuario: Usuario, ref: string): Promise<Contenido> =>
  construirContenido(ref, { usuario, http: deps.http, almacen: deps.almacen, ahora: deps.ahora(), horoscopoCfg: deps.horoscopoCfg, podcastFeed: deps.podcastFeed });
