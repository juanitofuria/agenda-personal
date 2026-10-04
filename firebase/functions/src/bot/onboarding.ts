import { esc, Teclado } from "../canal";
import { buscarLugares, Lugar } from "../geocoding";
import { parseNacimiento } from "../fechas";
import { ORDEN_SECCIONES, SECCIONES, SeccionId, Tema } from "../modelo";

type Borrador = Omit<Tema, "hora" | "activa">;
import { sincronizarSecciones } from "../programar";
import { signoDe } from "../signos";
import { SECCIONES_BASICAS, TEMAS, separarIntereses, slug } from "./catalogo";
import { bloque, cabecera } from "../util";
import { Ctx } from "./ctx";
import { textoMenu, tecladoMenu } from "./vistas";

const FLUJO = "onb";

interface Datos {
  secciones?: SeccionId[]; temas?: string[]; extra?: string[]; tocoIntereses?: boolean; resultados?: Lugar[];
}
const datos = (c: Ctx): Datos => (c.estado?.flujo === FLUJO ? (c.estado.datos as Datos) : {});

const OMITIR_TODO = { texto: "⏭ Omitir configuración", datos: "o:omitir" };
const SIGUIENTE = (txt = "Siguiente ➡️", d = "o:sig") => ({ texto: txt, datos: d });

export async function iniciar(c: Ctx): Promise<void> {
  await c.esperar(FLUJO, "inicio", { secciones: ["noticias", "agenda", "mercados", "tiempo"], temas: [], extra: [] });
  await c.nuevo(
    [
      cabecera("👋", "¡Hola! Soy tu agenda personal", "Te ayudo a no olvidar nada"),
      "",
      bloque("📬", "Cada día, a tu hora", "⛅ el tiempo · 📰 noticias · 🔮 horóscopo · 📈 bolsa"),
      "",
      bloque("⏰", "Y te aviso de", "tus alarmas, citas y tareas"),
      "",
      "<i>Te haré unas preguntas rápidas para personalizarlo. Todo es opcional 👇</i>",
    ].join("\n"),
    [[{ texto: "🚀 Empezar", datos: "o:sig" }], [OMITIR_TODO]],
  );
}

function tecladoIntereses(d: Datos): Teclado {
  const marca = (on: boolean, t: string) => `${on ? "✅" : "▫️"} ${t}`;
  const filas: Teclado = [];
  const basicas = SECCIONES_BASICAS.map((s) => ({ texto: marca((d.secciones ?? []).includes(s), `${SECCIONES[s].emoji} ${SECCIONES[s].titulo}`), datos: `o:s:${s}` }));
  for (let i = 0; i < basicas.length; i += 2) filas.push(basicas.slice(i, i + 2));
  return [...filas, [SIGUIENTE("Siguiente: aficiones ➡️", "o:sig")], [OMITIR_TODO]];
}

function tecladoTemas(d: Datos): Teclado {
  const filas: Teclado = [];
  const btns = TEMAS.map((t, i) => ({ texto: `${(d.temas ?? []).includes(t.titulo) ? "✅" : "▫️"} ${t.emoji} ${t.titulo}`, datos: `o:t:${i}` }));
  for (let i = 0; i < btns.length; i += 2) filas.push(btns.slice(i, i + 2));
  return [...filas, [SIGUIENTE("Siguiente ➡️", "o:sig")], [OMITIR_TODO]];
}

const TEXTO_SECCIONES = [cabecera("📋", "¿Qué quieres recibir?", "Paso 1 de 6"), "", "Un resumen cada día, a la hora que elijas.", "", "<i>Pulsa para marcar o desmarcar 👇</i>"].join("\n");
const TEXTO_TEMAS = [cabecera("⭐", "¿Qué te interesa?", "Paso 2 de 6"), "", "Crearé una sección de noticias para cada tema que marques.", "", "<i>Pulsa para marcar o desmarcar 👇</i>"].join("\n");

const PASOS = ["inicio", "secciones", "temas", "extra", "nombre", "nacimiento", "ciudad", "fin"] as const;

async function mostrarPaso(c: Ctx, paso: (typeof PASOS)[number]): Promise<void> {
  const d = datos(c);
  c.u.estado = { flujo: FLUJO, paso, datos: d as Record<string, unknown> };
  await c.guardar();
  switch (paso) {
    case "secciones":
      d.tocoIntereses = true;
      await c.responder(TEXTO_SECCIONES, tecladoIntereses(d)); break;
    case "temas":
      await c.responder(TEXTO_TEMAS, tecladoTemas(d)); break;
    case "extra":
      await c.responder([cabecera("✍️", "¿Algún otro interés?", "Paso 3 de 6"), "", "Escríbelos separados por comas.", "", "<i>Por ejemplo: ajedrez, pesca, Real Madrid</i>"].join("\n"), [[SIGUIENTE("Omitir este paso", "o:sig")], [OMITIR_TODO]]); break;
    case "nombre":
      await c.responder([cabecera("👤", "¿Cómo te llamo?", "Paso 4 de 6"), "", "<i>Escribe tu nombre 👇</i>"].join("\n"), [[SIGUIENTE("Omitir este paso", "o:sig")], [OMITIR_TODO]]); break;
    case "nacimiento":
      await c.responder([cabecera("🎂", "Tu fecha de nacimiento", "Paso 5 de 6"), "", bloque("🔮", "Para qué", "Tu signo y tu horóscopo diario"), "", "Escríbela como <i>dd/mm/aaaa</i>.", "", "<i>Solo se guarda aquí y puedes borrarla cuando quieras.</i>"].join("\n"), [[SIGUIENTE("Omitir este paso", "o:sig")], [OMITIR_TODO]]); break;
    case "ciudad":
      await c.responder([cabecera("📍", "¿Dónde vives?", "Paso 6 de 6"), "", bloque("⛅", "Para qué", "El tiempo y las noticias de tu zona"), "", "Escribe el nombre de tu municipio y lo busco.", "", "<i>Por ejemplo: Montoro</i>"].join("\n"), [[SIGUIENTE("Omitir este paso", "o:sig")], [OMITIR_TODO]]); break;
    case "fin": await resumenFinal(c); break;
    default: break;
  }
}

async function resumenFinal(c: Ctx): Promise<void> {
  const d = datos(c);
  const lineas: string[] = [];
  if (c.u.nombre) lineas.push(`👋 Hola, ${esc(c.u.nombre)}`);
  if (c.u.nacimiento) { const s = signoDe(c.u.nacimiento); lineas.push(`🔮 Horóscopo de ${s.simbolo} ${s.nombre}`); }
  if (c.u.ciudad) lineas.push(`📍 Tiempo y noticias de ${esc(c.u.ciudad.nombre)}`);
  const activas = ORDEN_SECCIONES.filter((s) => (d.secciones ?? []).includes(s) && !(s === "tiempo" && !c.u.ciudad) && !(s === "horoscopo" && !c.u.nacimiento));
  if (activas.length) lineas.push("📋 " + activas.map((s) => `${SECCIONES[s].emoji} ${SECCIONES[s].titulo}`).join(", "));
  const temas = [...(d.temas ?? []), ...(d.extra ?? [])];
  if (temas.length) lineas.push("⭐ " + temas.map(esc).join(", "));
  if ((d.secciones ?? []).includes("tiempo") && !c.u.ciudad) lineas.push("<i>Para activar el tiempo, indica tu ciudad en ‘Mi perfil’.</i>");
  if ((d.secciones ?? []).includes("horoscopo") && !c.u.nacimiento) lineas.push("<i>Para activar el horóscopo, indica tu fecha de nacimiento en ‘Mi perfil’.</i>");
  const cuerpo = lineas.length ? lineas.flatMap((l) => [l, ""]).slice(0, -1) : ["📋 Lo básico: noticias, agenda y mercados"];
  await c.responder(
    [cabecera("🎉", "¡Todo listo!", "Esto es lo que voy a prepararte"), "", ...cuerpo, "", "<i>Podrás cambiarlo cuando quieras desde el menú 👇</i>"].join("\n"),
    [[{ texto: "✅ Terminar", datos: "o:fin" }]],
  );
}

/** Aplica lo elegido (o los valores por defecto si se omitió) y entra en el menú principal. */
export async function terminar(c: Ctx, omitido: boolean): Promise<void> {
  const d = datos(c);
  const ahora = c.ahora;
  const elegidas = omitido && !d.tocoIntereses ? (["noticias", "agenda", "mercados"] as SeccionId[]) : (d.secciones ?? []);
  for (const s of ORDEN_SECCIONES) c.u.secciones[s].activa = elegidas.includes(s);
  // El tiempo y el horóscopo necesitan datos del usuario: sin ellos no se activan.
  if (!c.u.ciudad) c.u.secciones.tiempo.activa = false;
  if (!c.u.nacimiento) c.u.secciones.horoscopo.activa = false;
  const hora0 = 8 * 60 + 30;
  const nuevos: Borrador[] = [
    ...TEMAS.filter((t) => (d.temas ?? []).includes(t.titulo)).map((t) => ({ id: slug(t.titulo), titulo: t.titulo, emoji: t.emoji, consulta: t.consulta })),
    ...(d.extra ?? []).map((t) => ({ id: slug(t), titulo: t, emoji: "⭐", consulta: t })),
  ].filter((t, i, a) => a.findIndex((x) => x.id === t.id) === i && !c.u.temas.some((x) => x.id === t.id));
  nuevos.forEach((t, i) => c.u.temas.push({ ...t, hora: `${String(Math.floor((hora0 + i * 5) / 60)).padStart(2, "0")}:${String((hora0 + i * 5) % 60).padStart(2, "0")}`, activa: true }));
  c.u.onboardingHecho = true;
  c.u.estado = null;
  await c.guardar();
  await sincronizarSecciones(c.almacen, c.u, ahora);
  await c.responder(textoMenu(c.u), tecladoMenu);
}

/** Pulsaciones de botones del asistente ("o:..."). */
export async function callback(c: Ctx, p: string[]): Promise<boolean> {
  if (p[0] !== "o") return false;
  if (p[1] === "omitir") { await terminar(c, true); return true; }
  if (p[1] === "fin") { await terminar(c, false); return true; }
  if (c.estado?.flujo !== FLUJO) { await iniciar(c); return true; } // botón de un asistente antiguo
  const d = datos(c);
  if (p[1] === "s") {
    const id = p[2] as SeccionId;
    d.secciones = (d.secciones ?? []).includes(id) ? (d.secciones ?? []).filter((x) => x !== id) : [...(d.secciones ?? []), id];
    c.u.estado = { flujo: FLUJO, paso: "secciones", datos: d as Record<string, unknown> }; await c.guardar();
    await c.responder(TEXTO_SECCIONES, tecladoIntereses(d)); return true;
  }
  if (p[1] === "t") {
    const t = TEMAS[+p[2]]; if (!t) return true;
    d.temas = (d.temas ?? []).includes(t.titulo) ? (d.temas ?? []).filter((x) => x !== t.titulo) : [...(d.temas ?? []), t.titulo];
    c.u.estado = { flujo: FLUJO, paso: "temas", datos: d as Record<string, unknown> }; await c.guardar();
    await c.responder(TEXTO_TEMAS, tecladoTemas(d)); return true;
  }
  if (p[1] === "lugar") { // elección de una de las ciudades encontradas
    const l = (d.resultados ?? [])[+p[2]];
    if (l) { c.u.ciudad = { nombre: l.nombre, provincia: l.provincia, lat: l.lat, lon: l.lon }; c.u.zona = l.zona; await c.guardar(); }
    await mostrarPaso(c, "fin"); return true;
  }
  if (p[1] === "sig") {
    const i = PASOS.indexOf((c.estado!.paso as (typeof PASOS)[number]));
    await mostrarPaso(c, PASOS[Math.min(i + 1, PASOS.length - 1)]);
    return true;
  }
  return true;
}

/** Texto escrito durante el asistente (nombre, nacimiento, ciudad, intereses). */
export async function texto(c: Ctx): Promise<boolean> {
  if (c.estado?.flujo !== FLUJO) return false;
  const d = datos(c);
  switch (c.estado.paso) {
    case "extra": d.extra = separarIntereses(c.texto); await mostrarPaso(c, "nombre"); return true;
    case "nombre": c.u.nombre = c.texto.slice(0, 40); await mostrarPaso(c, "nacimiento"); return true;
    case "nacimiento": {
      const iso = parseNacimiento(c.texto, c.ahora);
      if (!iso) { await c.nuevo("No he entendido la fecha. Escríbela como <i>dd/mm/aaaa</i>, por ejemplo <i>05/04/1984</i>.", [[SIGUIENTE("Omitir este paso", "o:sig")]]); return true; }
      c.u.nacimiento = iso;
      await mostrarPaso(c, "ciudad"); return true;
    }
    case "ciudad": {
      let lugares: Lugar[] = [];
      try { lugares = await buscarLugares(c.deps.http, c.texto); } catch { await c.nuevo("No he podido buscar ahora mismo. Inténtalo de nuevo o sáltate este paso.", [[SIGUIENTE("Omitir este paso", "o:sig")]]); return true; }
      if (lugares.length === 0) { await c.nuevo("No encuentro ese municipio. Prueba con otro nombre.", [[SIGUIENTE("Omitir este paso", "o:sig")]]); return true; }
      d.resultados = lugares;
      c.u.estado = { flujo: FLUJO, paso: "ciudad", datos: d as Record<string, unknown> }; await c.guardar();
      await c.nuevo("📍 ¿Cuál es?", [...lugares.map((l, i) => [{ texto: l.etiqueta.slice(0, 60), datos: `o:lugar:${i}` }]), [SIGUIENTE("Ninguna / omitir", "o:sig")]]);
      return true;
    }
    default: return false;
  }
}
