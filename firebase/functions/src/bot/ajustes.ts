import { claveFoto } from "../avatares";
import { esc, Teclado } from "../canal";
import { buscarLugares, Lugar } from "../geocoding";
import { parseHoraHHMM, parseNacimiento } from "../fechas";
import { ORDEN_SECCIONES, SECCIONES, SeccionId, Tema } from "../modelo";
import { programarSeccion, sincronizarSecciones } from "../programar";
import { bloque, cabecera } from "../util";
import { modoEfectivo, textoModo, textoSol } from "../apariencia";
import { slug } from "./catalogo";
import { BTN_CANCELAR, BTN_MENU, Ctx } from "./ctx";
import { tecladoPerfil, textoPerfil } from "./vistas";

type Cfg = { activa: boolean; hora: string };
const esTema = (ref: string) => ref.startsWith("tema:");
const getCfg = (c: Ctx, ref: string): Cfg | undefined => (esTema(ref) ? c.u.temas.find((t) => `tema:${t.id}` === ref) : c.u.secciones[ref as SeccionId]);
const info = (c: Ctx, ref: string) => {
  if (esTema(ref)) { const t = c.u.temas.find((x) => `tema:${x.id}` === ref); return t ? { emoji: t.emoji, titulo: t.titulo, desc: `Noticias sobre «${t.consulta}»` } : null; }
  const s = SECCIONES[ref as SeccionId]; return s ? { emoji: s.emoji, titulo: s.titulo, desc: s.descripcion } : null;
};

export async function listaSecciones(c: Ctx): Promise<void> {
  const fila = (ref: string, emoji: string, titulo: string, cfg: Cfg) => [{ texto: `${cfg.activa ? "✅" : "▫️"} ${emoji} ${titulo} · ${cfg.hora}`, datos: `s:ver:${ref}` }];
  const filas: Teclado = [
    ...ORDEN_SECCIONES.map((s) => fila(s, SECCIONES[s].emoji, SECCIONES[s].titulo, c.u.secciones[s])),
    ...c.u.temas.map((t) => fila(`tema:${t.id}`, t.emoji, t.titulo, t)),
    [{ texto: "➕ Añadir un tema", datos: "s:tema+" }, BTN_MENU],
  ];
  const todas = [...ORDEN_SECCIONES.map((s) => c.u.secciones[s]), ...c.u.temas];
  const activas = todas.filter((x) => x.activa).length;
  await c.responder([
    cabecera("🧩", "Mis secciones", `${activas} activa${activas === 1 ? "" : "s"} de ${todas.length}`),
    "",
    bloque("🔎", "Cómo leerlo", "✅ activa · ▫️ desactivada", "La hora es la del aviso diario"),
    "",
    "<i>Toca una para activarla, desactivarla o cambiar su hora 👇</i>",
  ].join("\n"), filas);
}

async function verSeccion(c: Ctx, ref: string): Promise<void> {
  const i = info(c, ref), cfg = getCfg(c, ref);
  if (!i || !cfg) { await listaSecciones(c); return; }
  await c.responder(
    [
      cabecera(i.emoji, esc(i.titulo), esc(i.desc)),
      "",
      bloque("🔔", "Aviso diario", cfg.activa ? `✅ Activada · cada día a las <b>${cfg.hora}</b>` : "▫️ Desactivada"),
      "",
      "<i>Elige qué hacer 👇</i>",
    ].join("\n"),
    [
      [{ texto: cfg.activa ? "🔕 Desactivar" : "🔔 Activar", datos: `s:tog:${ref}` }, { texto: "🕒 Cambiar hora", datos: `s:hora:${ref}` }],
      [{ texto: "👁 Ver ahora", datos: `sec:${ref}` }],
      ...(esTema(ref) ? [[{ texto: "🗑 Eliminar tema", datos: `s:temadel:${ref.slice(5)}` }]] : []),
      [{ texto: "⬅️ Mis secciones", datos: "s:lista" }, BTN_MENU],
    ],
  );
}

async function pedirDatoFaltante(c: Ctx, ref: string): Promise<boolean> {
  if (ref === "tiempo" && !c.u.ciudad) {
    await c.esperar("perfil", "ciudad", { activar: ref });
    await c.responder([cabecera("📍", "¿Dónde vives?", "Para darte el tiempo"), "", "Escribe el nombre de tu municipio.", "", "<i>Por ejemplo: Montoro</i>"].join("\n"), [[BTN_CANCELAR]]); return true;
  }
  if (ref === "horoscopo" && !c.u.nacimiento) {
    await c.esperar("perfil", "nacimiento", { activar: ref });
    await c.responder([cabecera("🎂", "Tu fecha de nacimiento", "Para tu horóscopo"), "", "Escríbela como <i>dd/mm/aaaa</i>.", "", "<i>Por ejemplo: 05/04/1984</i>"].join("\n"), [[BTN_CANCELAR]]); return true;
  }
  return false;
}

const horaLibre = (c: Ctx) => { const n = c.u.temas.length; const m = 8 * 60 + 30 + n * 5; return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };

async function activarPendiente(c: Ctx, ref: unknown): Promise<void> {
  if (typeof ref === "string" && c.u.secciones[ref as SeccionId]) { c.u.secciones[ref as SeccionId].activa = true; await c.guardar(); await programarSeccion(c.almacen, c.u, ref, c.ahora); }
}

export async function callback(c: Ctx, p: string[]): Promise<boolean> {
  const [ns, acc] = p;
  const ref = p.slice(2).join(":");
  if (ns === "s") {
    switch (acc) {
      case "lista": await listaSecciones(c); return true;
      case "ver": await verSeccion(c, ref); return true;
      case "tog": {
        const cfg = getCfg(c, ref); if (!cfg) return true;
        if (!cfg.activa && (await pedirDatoFaltante(c, ref))) return true;
        cfg.activa = !cfg.activa; await c.guardar(); await programarSeccion(c.almacen, c.u, ref, c.ahora); await verSeccion(c, ref); return true;
      }
      case "hora": await c.esperar("hora", "valor", { ref }); await c.responder([cabecera("🕒", "Hora del aviso", `${getCfg(c, ref) ? `Ahora: ${getCfg(c, ref)!.hora}` : "Aviso diario"}`), "", "¿A qué hora lo quieres cada día?", "", "<i>Escríbela como 07:30 o 8h</i>"].join("\n"), [[BTN_CANCELAR]]); return true;
      case "tema+": await c.esperar("tema", "titulo"); await c.responder([cabecera("⭐", "Nuevo tema", "Paso 1: el tema"), "", "¿Sobre qué quieres noticias?", "", "<i>Por ejemplo: Ajedrez, Real Madrid, Energías renovables</i>"].join("\n"), [[BTN_CANCELAR]]); return true;
      case "temaskip": return crearTema(c, undefined);
      case "temadel": {
        const t = c.u.temas.find((x) => x.id === p[2]); if (!t) return true;
        await c.responder([cabecera("🗑", "¿Eliminar este tema?", esc(t.titulo)), "", "<i>Dejarás de recibir sus noticias.</i>"].join("\n"), [[{ texto: "🗑 Sí, eliminar", datos: `s:temadelok:${t.id}` }, { texto: "Cancelar", datos: `s:ver:tema:${t.id}` }]]); return true;
      }
      case "temadelok": {
        c.u.temas = c.u.temas.filter((x) => x.id !== p[2]); await c.guardar();
        await programarSeccion(c.almacen, c.u, `tema:${p[2]}`, c.ahora); await listaSecciones(c); return true;
      }
      default: return true;
    }
  }
  // ns === "p"
  switch (acc) {
    case "ver": await c.responder(textoPerfil(c.u), tecladoPerfil); return true;
    case "nombre": await c.esperar("perfil", "nombre"); await c.responder([cabecera("✏️", "Tu nombre"), "", "¿Cómo te llamo?"].join("\n"), [[BTN_CANCELAR]]); return true;
    case "nacimiento": await c.esperar("perfil", "nacimiento"); await c.responder([cabecera("🎂", "Tu fecha de nacimiento"), "", "Escríbela como <i>dd/mm/aaaa</i>.", "", "<i>Por ejemplo: 05/04/1984</i>"].join("\n"), [[BTN_CANCELAR]]); return true;
    case "ciudad": await c.esperar("perfil", "ciudad"); await c.responder([cabecera("📍", "Tu ciudad"), "", "Escribe el nombre de tu municipio.", "", "<i>Por ejemplo: Montoro</i>"].join("\n"), [[BTN_CANCELAR]]); return true;
    case "lugar": {
      const l = ((c.estado?.datos.resultados ?? []) as Lugar[])[+p[2]];
      if (l) {
        const pendiente = c.estado?.datos.activar;
        c.u.ciudad = { nombre: l.nombre, provincia: l.provincia, lat: l.lat, lon: l.lon }; c.u.zona = l.zona; c.u.estado = null; await c.guardar();
        await activarPendiente(c, pendiente);
        await sincronizarSecciones(c.almacen, c.u, c.ahora); // la zona horaria puede haber cambiado
        await c.responder([cabecera("📍", "¡Listo!", "Ciudad guardada"), "", bloque("📍", "Ciudad", esc(l.nombre)), "", bloque("🕐", "Zona horaria", esc(l.zona))].join("\n"), [[{ texto: "👤 Mi perfil", datos: "p:ver" }, BTN_MENU]]);
      }
      return true;
    }
    case "apar": await apariencia(c); return true;
    case "est": c.u.estilo = p[2] === "formal" ? "formal" : "informal"; await c.guardar(); await apariencia(c); return true;
    case "modo": c.u.modo = p[2] === "oscuro" ? "oscuro" : p[2] === "auto" ? "auto" : "claro"; await c.guardar(); await apariencia(c); return true;
    case "borrar": await c.responder([cabecera("⚠️", "¿Borrar todos tus datos?", "No se puede deshacer"), "", bloque("🗑", "Se eliminará", "• tu perfil", "• tus secciones y temas", "• tus alarmas, citas y tareas"), "", "<i>Y dejaré de enviarte mensajes.</i>"].join("\n"), [[{ texto: "🗑 Sí, borrar todo", datos: "p:borrarok" }, { texto: "Cancelar", datos: "p:ver" }]]); return true;
    case "borrarok": await c.almacen.borrarUsuario(c.u.id); await c.almacen.cacheSet(claveFoto(c.u.id), "", 1, c.ahora); await c.responder([cabecera("🗑", "Datos borrados"), "", "No te enviaré más mensajes.", "", "<i>Si quieres volver, escribe /start.</i>"].join("\n")); return true;
    default: return true;
  }
}

/** Cambiar el estilo (informal/formal) y el modo (claro/oscuro/automático) del menú. `nuevo`: enviar como mensaje nuevo en vez de editar (cuando se llega por un texto). */
async function apariencia(c: Ctx, nuevo = false): Promise<void> {
  const { estilo, modo } = c.u;
  const marca = (on: boolean) => (on ? "✅ " : "");
  const ahora = modoEfectivo(c.u, c.ahora);
  const texto = [
    cabecera("🎨", "Apariencia", "Cómo se ve el menú"),
    "",
    bloque("😊", "Estilo", estilo === "formal" ? "Formal · sobrio y profesional" : "Informal · cercano y colorido"),
    "",
    bloque("🌗", "Modo", modo === "auto" ? `${textoModo(c.u)}\n${esc(textoSol(c.u, c.ahora))}\nAhora toca: ${ahora}${c.u.ciudad ? "" : "\n(sin ciudad guardada uso el centro de España)"}` : textoModo(c.u)),
    "",
    "<i>Un bot no puede ver el tema de tu dispositivo: «Automático» cambia con el sol: oscuro desde el anochecer hasta el amanecer de tu ciudad. Se aplica al menú principal 👇</i>",
  ].join("\n");
  const teclado: Teclado = [
    [{ texto: `${marca(estilo === "informal")}😊 Informal`, datos: "p:est:informal" }, { texto: `${marca(estilo === "formal")}👔 Formal`, datos: "p:est:formal" }],
    [{ texto: `${marca(modo === "claro")}☀️ Claro`, datos: "p:modo:claro" }, { texto: `${marca(modo === "oscuro")}🌙 Oscuro`, datos: "p:modo:oscuro" }],
    [{ texto: `${marca(modo === "auto")}🔄 Automático`, datos: "p:modo:auto" }],
    [{ texto: "👤 Mi perfil", datos: "p:ver" }, BTN_MENU],
  ];
  if (nuevo) await c.nuevo(texto, teclado); else await c.responder(texto, teclado);
}

async function crearTema(c: Ctx, consulta: string | undefined): Promise<boolean> {
  const titulo = String(c.estado?.datos.titulo ?? "").trim();
  if (!titulo) return true;
  let id = slug(titulo); let n = 2;
  while (c.u.temas.some((t) => t.id === id)) id = `${slug(titulo)}-${n++}`;
  const tema: Tema = { id, titulo, emoji: "⭐", consulta: (consulta ?? titulo).trim() || titulo, hora: horaLibre(c), activa: true };
  c.u.temas.push(tema); c.u.estado = null; await c.guardar();
  await programarSeccion(c.almacen, c.u, `tema:${id}`, c.ahora);
  await c.responder([cabecera("✅", "Tema añadido", esc(titulo)), "", bloque("🔔", "Aviso diario", `Cada día a las <b>${tema.hora}</b>`)].join("\n"), [[{ texto: "👁 Verlo ahora", datos: `sec:tema:${id}` }, { texto: "🧩 Mis secciones", datos: "s:lista" }]]);
  return true;
}

export async function texto(c: Ctx): Promise<boolean> {
  const est = c.estado; if (!est) return false;
  if (est.flujo === "hora") {
    const ref = String(est.datos.ref);
    const hm = parseHoraHHMM(c.texto);
    if (!hm) { await c.nuevo("No he entendido la hora. Prueba con <i>07:30</i> o <i>8h</i>.", [[BTN_CANCELAR]]); return true; }
    const cfg = getCfg(c, ref); if (!cfg) { await c.terminarFlujo(); return true; }
    cfg.hora = `${String(hm[0]).padStart(2, "0")}:${String(hm[1]).padStart(2, "0")}`; c.u.estado = null; await c.guardar();
    await programarSeccion(c.almacen, c.u, ref, c.ahora);
    await c.nuevo([cabecera("🕒", "¡Hecho!", "Hora cambiada"), "", bloque("🔔", "Aviso diario", `Cada día a las <b>${cfg.hora}</b>`)].join("\n"), [[{ texto: "🧩 Mis secciones", datos: "s:lista" }, BTN_MENU]]); return true;
  }
  if (est.flujo === "tema") {
    if (est.paso === "titulo") {
      await c.esperar("tema", "consulta", { titulo: c.texto.slice(0, 40) });
      await c.nuevo([cabecera("🔎", "¿Qué busco?", "Paso 2: las palabras"), "", "Escribe las palabras que quieres vigilar.", "", "<i>Por ejemplo: ajedrez OR Magnus Carlsen. Si no escribes nada, uso el nombre.</i>"].join("\n"), [[{ texto: "Usar el nombre", datos: "s:temaskip" }], [BTN_CANCELAR]]); return true;
    }
    return crearTema(c, c.texto.slice(0, 120));
  }
  if (est.flujo === "perfil") {
    const pendiente = est.datos.activar;
    if (est.paso === "nombre") { c.u.nombre = c.texto.slice(0, 40); c.u.estado = null; await c.guardar(); await c.nuevo(`✏️ Encantado, ${esc(c.u.nombre)}.`, [[{ texto: "👤 Mi perfil", datos: "p:ver" }, BTN_MENU]]); return true; }
    if (est.paso === "nacimiento") {
      const iso = parseNacimiento(c.texto, c.ahora);
      if (!iso) { await c.nuevo("No he entendido la fecha. Escríbela como <i>dd/mm/aaaa</i>, por ejemplo <i>05/04/1984</i>.", [[BTN_CANCELAR]]); return true; }
      c.u.nacimiento = iso; c.u.estado = null; await c.guardar(); await activarPendiente(c, pendiente);
      await c.nuevo("🎂 Fecha guardada.", [[{ texto: "👤 Mi perfil", datos: "p:ver" }, { texto: "🔮 Ver mi horóscopo", datos: "sec:horoscopo" }]]); return true;
    }
    if (est.paso === "ciudad") {
      let lugares: Lugar[] = [];
      try { lugares = await buscarLugares(c.deps.http, c.texto); } catch { await c.nuevo("No he podido buscar ahora mismo. Inténtalo de nuevo en un momento.", [[BTN_CANCELAR]]); return true; }
      if (lugares.length === 0) { await c.nuevo("No encuentro ese municipio. Prueba con otro nombre.", [[BTN_CANCELAR]]); return true; }
      await c.esperar("perfil", "ciudad", { ...est.datos, resultados: lugares });
      await c.nuevo("📍 ¿Cuál es?", [...lugares.map((l, i) => [{ texto: l.etiqueta.slice(0, 60), datos: `p:lugar:${i}` }]), [BTN_CANCELAR]]); return true;
    }
  }
  return false;
}
